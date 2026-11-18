import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/server/supabase-admin';
import { jsonError, requireAdmin } from '@/lib/server/security';
import { loadAdminEvent } from '@/lib/server/admin-events';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const { id } = await params;
    const event = await loadAdminEvent(id);
    if (!event) return jsonError('Wedding not found.', 404);
    const { uploads } = await request.json().catch(() => ({}));
    if (!Array.isArray(uploads) || !uploads.length) return NextResponse.json({ ok: true, count: 0 });

    const prefix = `${event.id}/`;
    const rows = [];
    for (const u of uploads.slice(0, 100)) {
      const originalPath = String(u.originalPath || '');
      const previewPath = String(u.previewPath || '');
      // Only accept paths issued for THIS event.
      if (!originalPath.startsWith(prefix) || !previewPath.startsWith(prefix) || originalPath.includes('..') || previewPath.includes('..')) {
        return jsonError('Invalid upload path.', 400);
      }
      rows.push({
        event_id: event.id,
        original_path: originalPath,
        preview_path: previewPath,
        original_filename: String(u.name || 'photo.jpg').slice(0, 160),
        content_type: String(u.contentType || 'image/jpeg').slice(0, 40),
        bytes: Number.isFinite(Number(u.bytes)) ? Number(u.bytes) : null,
        file_hash: /^[a-f0-9]{64}$/.test(String(u.fileHash || '')) ? u.fileHash : null,
        processing_status: 'ready',
      });
    }

    const supabase = getAdminSupabase();
    const { data, error } = await supabase.from('jw_photos').insert(rows).select('id');
    if (error) throw error;
    await supabase.rpc('jw_refresh_event_counts', { p_event_id: event.id });
    return NextResponse.json({ ok: true, count: data?.length || 0 });
  } catch (error) {
    console.error(error?.message);
    return jsonError(error?.message || 'Could not finalize uploads.', 500);
  }
}
