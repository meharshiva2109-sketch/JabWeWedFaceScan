import { NextResponse } from 'next/server';
import { DeleteCollectionCommand, DeleteFacesCommand } from '@aws-sdk/client-rekognition';
import { getAdminSupabase, signPaths, BUCKET_ORIGINALS, BUCKET_PREVIEWS } from '@/lib/server/supabase-admin';
import { getCollectionId, getRekognitionClient } from '@/lib/server/rekognition';
import { jsonError, requireAdmin, UUID_RE } from '@/lib/server/security';
import { loadAdminEvent } from '@/lib/server/admin-events';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const PAGE = 60;

/** Paginated photo library with short-lived signed preview URLs. */
export async function GET(request, { params }) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const { id } = await params;
    const event = await loadAdminEvent(id);
    if (!event) return jsonError('Wedding not found.', 404);
    const page = Math.max(0, Number(request.nextUrl.searchParams.get('page') || 0));
    const filter = request.nextUrl.searchParams.get('filter') || 'all';

    const supabase = getAdminSupabase();
    let q = supabase.from('jw_photos')
      .select('id,original_filename,preview_path,bytes,indexed_at,face_count,index_error,created_at', { count: 'exact' })
      .eq('event_id', event.id);
    if (filter === 'unindexed') q = q.is('indexed_at', null);
    if (filter === 'errors') q = q.not('index_error', 'is', null);
    if (filter === 'nofaces') q = q.not('indexed_at', 'is', null).eq('face_count', 0);
    const { data, error, count } = await q.order('created_at', { ascending: true }).range(page * PAGE, page * PAGE + PAGE - 1);
    if (error) throw error;

    const urls = await signPaths(supabase, BUCKET_PREVIEWS, (data || []).map((p) => p.preview_path), 3600);
    const { data: sizes } = await supabase.from('jw_photos').select('bytes').eq('event_id', event.id);
    const totalBytes = (sizes || []).reduce((s, r) => s + Number(r.bytes || 0), 0);
    const quotaGb = Number(process.env.SUPABASE_STORAGE_LIMIT_GB || 0);

    return NextResponse.json({
      photos: (data || []).map((p) => ({ ...p, preview_url: urls.get(p.preview_path) || null, preview_path: undefined })),
      total: count || 0,
      page,
      pageSize: PAGE,
      storage: { originalBytes: totalBytes, quotaBytes: quotaGb > 0 ? quotaGb * 1024 ** 3 : null },
    });
  } catch (error) {
    return jsonError(error?.message || 'Could not load photos.', 500);
  }
}

/**
 * Delete selected photos ({ photoIds }) or every photo of the wedding
 * ({ all: true, confirmSlug }). Removes originals, previews, DB rows and the
 * matching faces from this wedding's Rekognition collection only.
 */
export async function DELETE(request, { params }) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const { id } = await params;
    const event = await loadAdminEvent(id);
    if (!event) return jsonError('Wedding not found.', 404);
    const body = await request.json().catch(() => ({}));
    const supabase = getAdminSupabase();
    const all = body.all === true;
    if (all && body.confirmSlug !== event.slug) return jsonError('Type the gallery link to confirm.', 400);

    let deleted = 0;
    const faceIds = [];
    const ids = all ? null : (Array.isArray(body.photoIds) ? body.photoIds.filter((x) => UUID_RE.test(String(x))).slice(0, 500) : []);
    if (!all && !ids.length) return jsonError('No photos selected.', 400);

    for (;;) {
      let q = supabase.from('jw_photos').select('id,original_path,preview_path,face_ids').eq('event_id', event.id).limit(500);
      if (!all) q = q.in('id', ids);
      const { data: rows, error } = await q;
      if (error) throw error;
      if (!rows?.length) break;
      const r1 = await supabase.storage.from(BUCKET_ORIGINALS).remove(rows.map((r) => r.original_path));
      if (r1.error) throw r1.error;
      const r2 = await supabase.storage.from(BUCKET_PREVIEWS).remove(rows.map((r) => r.preview_path));
      if (r2.error) throw r2.error;
      rows.forEach((r) => faceIds.push(...(r.face_ids || [])));
      const { error: delError } = await supabase.from('jw_photos').delete().in('id', rows.map((r) => r.id));
      if (delError) throw delError;
      deleted += rows.length;
      if (!all) break;
    }

    let rekognition = 'skipped';
    try {
      const client = getRekognitionClient();
      const collectionId = getCollectionId(event.id);
      if (all) {
        await client.send(new DeleteCollectionCommand({ CollectionId: collectionId }));
        rekognition = 'collection deleted';
      } else if (faceIds.length) {
        for (let i = 0; i < faceIds.length; i += 4096) {
          await client.send(new DeleteFacesCommand({ CollectionId: collectionId, FaceIds: faceIds.slice(i, i + 4096) }));
        }
        rekognition = `${faceIds.length} faces removed`;
      }
    } catch (e) {
      if (e?.name !== 'ResourceNotFoundException') rekognition = `not updated: ${e?.message}`;
    }

    await supabase.from('jw_match_sessions').delete().eq('event_id', event.id);
    await supabase.rpc('jw_refresh_event_counts', { p_event_id: event.id });
    return NextResponse.json({ ok: true, deleted, rekognition });
  } catch (error) {
    return jsonError(error?.message || 'Could not delete photos.', 500);
  }
}
