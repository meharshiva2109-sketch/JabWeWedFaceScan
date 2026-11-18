'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Lock, LogOut, Loader2 } from 'lucide-react';
import { Brand } from '../Brand';
import { api } from '@/lib/client/admin-api';

/** Gate for every admin screen: shows the login form until a session cookie exists. */
export default function AdminShell({ children }) {
  const [state, setState] = useState('checking');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api('/api/admin/session').then((d) => setState(d.authenticated ? 'in' : 'out')).catch(() => setState('out'));
  }, []);

  const login = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      await api('/api/admin/session', { method: 'POST', body: { code } });
      setCode(''); setState('in');
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  const logout = async () => { await api('/api/admin/session', { method: 'DELETE' }).catch(() => {}); setState('out'); };

  return (
    <div className="admin">
      <header className="admin-top">
        <Link href="/admin" style={{ textDecoration: 'none' }}><Brand size="sm" href={null} /></Link>
        <div className="row" style={{ gap: 8 }}>
          <span className="pill pill-draft">Studio admin</span>
          {state === 'in' && <button className="btn btn-quiet" onClick={logout}><LogOut aria-hidden="true" /> Sign out</button>}
        </div>
      </header>
      <main className="admin-main">
        {state === 'checking' && <div style={{ textAlign: 'center', padding: 60 }}><Loader2 className="spin" aria-label="Loading" /></div>}
        {state === 'out' && (
          <form onSubmit={login} className="panel" style={{ maxWidth: 420, margin: '40px auto' }}>
            <h1 style={{ fontSize: 30 }}>Studio sign in</h1>
            <p className="muted small" style={{ lineHeight: 1.6 }}>Manage weddings, uploads, face indexing and guest QR codes.</p>
            <div className="field" style={{ marginTop: 14 }}>
              <label htmlFor="code">Admin access code</label>
              <input id="code" type="password" className="input" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="current-password" autoFocus />
            </div>
            {error && <div className="notice notice-error" role="alert" style={{ marginTop: 12 }}>{error}</div>}
            <button className="btn btn-primary btn-block" style={{ marginTop: 16 }} disabled={!code || busy}>
              {busy ? <Loader2 className="spin" aria-hidden="true" /> : <Lock aria-hidden="true" />} Sign in
            </button>
          </form>
        )}
        {state === 'in' && children}
      </main>
    </div>
  );
}
