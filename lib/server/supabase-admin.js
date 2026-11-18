import 'server-only';
import { createClient } from '@supabase/supabase-js';

export const BUCKET_ORIGINALS = 'jw-originals';
export const BUCKET_PREVIEWS = 'jw-previews';

let cached = null;

/** Service-role Supabase client. Server-only — never import from client components. */
export function getAdminSupabase() {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase server configuration is missing.');
  cached = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return cached;
}

/** Create signed URLs in parallel chunks. Returns Map<path, url>. */
export async function signPaths(supabase, bucket, paths, expiresIn, options) {
  const out = new Map();
  const unique = [...new Set(paths.filter(Boolean))];
  for (let i = 0; i < unique.length; i += 100) {
    const chunk = unique.slice(i, i + 100);
    const { data, error } = await supabase.storage.from(bucket).createSignedUrls(chunk, expiresIn, options);
    if (error) throw error;
    for (const row of data || []) if (row?.signedUrl && row.path) out.set(row.path, row.signedUrl);
  }
  return out;
}

export const EVENT_PUBLIC_FIELDS = 'id,slug,title,bride_name,groom_name,event_date,venue,status,guest_access,photos_count,indexed_count';

export async function getEventBySlug(slug) {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase.from('jw_events').select(EVENT_PUBLIC_FIELDS).eq('slug', String(slug || '').toLowerCase()).maybeSingle();
  if (error) throw error;
  return data;
}

export function isGuestOpen(event) {
  return Boolean(event && event.status === 'live' && event.guest_access);
}
