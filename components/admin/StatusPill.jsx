export function StatusPill({ event }) {
  if (event.status === 'archived') return <span className="pill pill-archived">Archived</span>;
  if (event.status === 'draft') return <span className="pill pill-draft">Draft</span>;
  if (!event.guest_access) return <span className="pill pill-closed">Live · guests closed</span>;
  return <span className="pill pill-live">● Live · guests open</span>;
}
