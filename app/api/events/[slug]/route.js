import { NextResponse } from 'next/server';
import { getEventBySlug, isGuestOpen } from '@/lib/server/supabase-admin';
import { jsonError } from '@/lib/server/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Public wedding info for the guest landing page (no photo data). */
export async function GET(_request, { params }) {
  try {
    const { slug } = await params;
    const event = await getEventBySlug(slug);
    if (!event || event.status === 'draft') return jsonError('Gallery not found.', 404);
    return NextResponse.json({
      slug: event.slug,
      title: event.title,
      brideName: event.bride_name,
      groomName: event.groom_name,
      eventDate: event.event_date,
      venue: event.venue,
      open: isGuestOpen(event),
      archived: event.status === 'archived',
    });
  } catch (error) {
    console.error(error?.message);
    return jsonError('Could not load this gallery.', 500);
  }
}
