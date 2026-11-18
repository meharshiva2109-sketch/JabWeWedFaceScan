import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/server/supabase-admin';
import { jsonError, requireAdmin } from '@/lib/server/security';
import { ADMIN_EVENT_FIELDS, parseEventInput } from '@/lib/server/admin-events';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const { data, error } = await getAdminSupabase().from('jw_events').select(ADMIN_EVENT_FIELDS).order('event_date', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ events: data || [] });
  } catch (error) {
    return jsonError(error?.message || 'Could not load weddings.', 500);
  }
}

export async function POST(request) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const body = await request.json().catch(() => ({}));
    const { values, error } = parseEventInput(body);
    if (error) return jsonError(error, 400);
    values.status = 'draft';
    values.guest_access = false;
    const { data, error: insertError } = await getAdminSupabase().from('jw_events').insert(values).select(ADMIN_EVENT_FIELDS).single();
    if (insertError) {
      if (insertError.code === '23505') return jsonError('That gallery link is already used by another wedding.', 409);
      throw insertError;
    }
    return NextResponse.json({ event: data }, { status: 201 });
  } catch (error) {
    return jsonError(error?.message || 'Could not create wedding.', 500);
  }
}
