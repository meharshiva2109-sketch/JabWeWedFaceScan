'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Loader2, Plus } from 'lucide-react';
import AdminShell from '@/components/admin/AdminShell';
import { StatusPill } from '@/components/admin/StatusPill';
import { api } from '@/lib/client/admin-api';
import { formatDate, slugify } from '@/lib/format';

export default function AdminHome() {
  return <AdminShell><Dashboard /></AdminShell>;
}

function Dashboard() {
  const [events, setEvents] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const load = () => api('/api/admin/events').then((d) => setEvents(d.events)).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const visible = (events || []).filter((e) => showArchived || e.status !== 'archived');

  return (
    <>
      <div className="spread">
        <div>
          <div className="eyebrow">Jab We Wed · SMF Studios</div>
          <h1>Weddings</h1>
        </div>
        <button className="btn btn-primary" onClick={() => setCreating((c) => !c)}><Plus aria-hidden="true" /> New wedding</button>
      </div>

      {creating && <CreateForm onCreated={(ev) => { window.location.href = `/admin/events/${ev.id}`; }} onCancel={() => setCreating(false)} />}
      {error && <div className="notice notice-error" style={{ marginTop: 16 }}>{error}</div>}

      <div className="panel" style={{ marginTop: 18 }}>
        <div className="spread" style={{ marginBottom: 14 }}>
          <h2>All galleries</h2>
          <label className="check small"><input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} /> Show archived</label>
        </div>
        {!events ? <div style={{ textAlign: 'center', padding: 30 }}><Loader2 className="spin" aria-label="Loading" /></div>
          : !visible.length ? <p className="muted">No weddings yet. Create the first one to get its QR code.</p>
            : visible.map((ev) => (
              <Link key={ev.id} href={`/admin/events/${ev.id}`} className="event-row">
                <div>
                  <div className="serif" style={{ fontSize: 22, fontWeight: 600, color: 'var(--cocoa)' }}>{ev.bride_name} &amp; {ev.groom_name}</div>
                  <div className="small muted" style={{ marginTop: 4 }}>
                    {[formatDate(ev.event_date), `/w/${ev.slug}`, `${ev.photos_count} photos`, `${ev.indexed_count} indexed`].filter(Boolean).join(' · ')}
                  </div>
                </div>
                <div className="row"><StatusPill event={ev} /><ChevronRight aria-hidden="true" style={{ color: 'var(--muted)' }} /></div>
              </Link>
            ))}
      </div>
    </>
  );
}

function CreateForm({ onCreated, onCancel }) {
  const [f, setF] = useState({ brideName: '', groomName: '', title: '', eventDate: '', venue: '', slug: '' });
  const [slugTouched, setSlugTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => {
    const v = e.target.value;
    setF((prev) => {
      const next = { ...prev, [k]: v };
      if (!slugTouched && (k === 'brideName' || k === 'groomName')) next.slug = slugify(`${next.brideName} ${next.groomName}`);
      return next;
    });
  };
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const { event } = await api('/api/admin/events', { method: 'POST', body: { ...f, title: f.title || `${f.brideName} & ${f.groomName} Wedding` } });
      onCreated(event);
    } catch (err) { setError(err.message); setBusy(false); }
  };
  return (
    <form className="panel" style={{ marginTop: 18 }} onSubmit={submit}>
      <h2>New wedding</h2>
      <div className="grid-2" style={{ marginTop: 14 }}>
        <div className="field"><label htmlFor="b">Bride name</label><input id="b" className="input" required value={f.brideName} onChange={set('brideName')} /></div>
        <div className="field"><label htmlFor="g">Groom name</label><input id="g" className="input" required value={f.groomName} onChange={set('groomName')} /></div>
        <div className="field"><label htmlFor="t">Event title</label><input id="t" className="input" placeholder="e.g. Wedding Reception" value={f.title} onChange={set('title')} /></div>
        <div className="field"><label htmlFor="d">Wedding date</label><input id="d" type="date" className="input" value={f.eventDate} onChange={set('eventDate')} /></div>
        <div className="field"><label htmlFor="v">Venue (optional)</label><input id="v" className="input" value={f.venue} onChange={set('venue')} /></div>
        <div className="field"><label htmlFor="s">Gallery link</label>
          <div className="row" style={{ gap: 6, flexWrap: 'nowrap' }}><span className="muted small">/w/</span>
            <input id="s" className="input" required value={f.slug} onChange={(e) => { setSlugTouched(true); setF((p) => ({ ...p, slug: slugify(e.target.value) })); }} />
          </div>
        </div>
      </div>
      {error && <div className="notice notice-error" style={{ marginTop: 12 }}>{error}</div>}
      <div className="row" style={{ marginTop: 16 }}>
        <button className="btn btn-primary" disabled={busy}>{busy && <Loader2 className="spin" aria-hidden="true" />} Create wedding</button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
      <p className="small muted" style={{ marginBottom: 0 }}>New weddings start as drafts with guest access off. Upload photos and build the face index before going live.</p>
    </form>
  );
}
