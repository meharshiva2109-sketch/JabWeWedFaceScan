import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/server/supabase-admin';
import { jsonError, requireAdmin } from '@/lib/server/security';
import { ADMIN_EVENT_FIELDS, loadAdminEvent, parseEventInput } from '@/lib/server/admin-events';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const { id } = await params;
    const supabase = getAdminSupabase();
    const event = await loadAdminEvent(id);
    if (!event) return jsonError('Wedding not found.', 404);
    await supabase.rpc('jw_refresh_event_counts', { p_event_id: id });
    const fresh = await loadAdminEvent(id);
    const { count: failed } = await supabase.from('jw_photos').select('id', { count: 'exact', head: true }).eq('event_id', id).not('index_error', 'is', null);
    const { count: noFaces } = await supabase.from('jw_photos').select('id', { count: 'exact', head: true }).eq('event_id', id).not('indexed_at', 'is', null).eq('face_count', 0);
    return NextResponse.json({ event: fresh, stats: { indexErrors: failed || 0, photosWithoutFaces: noFaces || 0 } });
  } catch (error) {
    return jsonError(error?.message || 'Could not load wedding.', 500);
  }
}

export async function PATCH(request, { params }) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const { id } = await params;
    const event = await loadAdminEvent(id);
    if (!event) return jsonError('Wedding not found.', 404);
    const body = await request.json().catch(() => ({}));
    const { values, error } = parseEventInput(body, { partial: true });
    if (error) return jsonError(error, 400);
    if (values.status === 'archived') values.guest_access = false;
    values.updated_at = new Date().toISOString();
    const { data, error: updateError } = await getAdminSupabase().from('jw_events').update(values).eq('id', id).select(ADMIN_EVENT_FIELDS).single();
    if (updateError) {
      if (updateError.code === '23505') return jsonError('That gallery link is already used by another wedding.', 409);
      throw updateError;
    }
    // Closing a gallery immediately invalidates outstanding guest download sessions.
    if (data.status !== 'live' || !data.guest_access) {
      await getAdminSupabase().from('jw_match_sessions').delete().eq('event_id', id);
    }
    return NextResponse.json({ event: data });
  } catch (error) {
    return jsonError(error?.message || 'Could not update wedding.', 500);
  }
}
