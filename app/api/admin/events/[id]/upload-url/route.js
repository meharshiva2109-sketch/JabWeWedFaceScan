import { NextResponse } from 'next/server';
import { getAdminSupabase, BUCKET_ORIGINALS, BUCKET_PREVIEWS } from '@/lib/server/supabase-admin';
import { jsonError, requireAdmin } from '@/lib/server/security';
import { loadAdminEvent } from '@/lib/server/admin-events';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CHUNK = 20;
const ALLOWED = /\.(jpe?g|png)$/i;

/**
 * Adapted from Face Match's upload-url route: duplicate detection by SHA-256,
 * then signed upload URLs so large originals go straight to private storage.
 */
export async function POST(request, { params }) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const { id } = await params;
    const event = await loadAdminEvent(id);
    if (!event) return jsonError('Wedding not found.', 404);
    const { files } = await request.json().catch(() => ({}));
    if (!Array.isArray(files) || !files.length) return jsonError('No files requested.', 400);

    const supabase = getAdminSupabase();
    const incoming = files.slice(0, CHUNK).map((f, index) => ({
      index,
      name: String(f.name || 'photo.jpg').replace(/[^a-zA-Z0-9._-]/g, '_').slice(-120),
      hash: /^[a-f0-9]{64}$/.test(String(f.hash || '')) ? String(f.hash) : '',
    }));

    const hashes = incoming.map((f) => f.hash).filter(Boolean);
    const existing = new Set();
    if (hashes.length) {
      const { data, error } = await supabase.from('jw_photos').select('file_hash').eq('event_id', event.id).in('file_hash', hashes);
      if (error) throw error;
      (data || []).forEach((r) => r.file_hash && existing.add(r.file_hash));
    }

    const uploads = [];
    const skipped = [];
    const seen = new Set();
    for (const f of incoming) {
      if (!ALLOWED.test(f.name)) { skipped.push({ index: f.index, name: f.name, reason: 'unsupported type' }); continue; }
      if (!f.hash) { skipped.push({ index: f.index, name: f.name, reason: 'missing hash' }); continue; }
      if (existing.has(f.hash) || seen.has(f.hash)) { skipped.push({ index: f.index, name: f.name, reason: 'duplicate' }); continue; }
      seen.add(f.hash);
      const base = `${event.id}/${crypto.randomUUID()}`;
      const originalPath = `${base}-${f.name}`;
      const previewPath = `${base}-preview.jpg`;
      const [original, preview] = await Promise.all([
        supabase.storage.from(BUCKET_ORIGINALS).createSignedUploadUrl(originalPath),
        supabase.storage.from(BUCKET_PREVIEWS).createSignedUploadUrl(previewPath),
      ]);
      if (original.error) throw original.error;
      if (preview.error) throw preview.error;
      uploads.push({ index: f.index, name: f.name, fileHash: f.hash, originalPath, previewPath, originalToken: original.data.token, previewToken: preview.data.token });
    }

    return NextResponse.json({ ok: true, uploads, skipped });
  } catch (error) {
    console.error(error?.message);
    return jsonError(error?.message || 'Could not prepare uploads.', 500);
  }
}
