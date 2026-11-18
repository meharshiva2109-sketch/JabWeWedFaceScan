'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { slugify } from '@/lib/format';

export function GalleryCodeForm() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const submit = (e) => {
    e.preventDefault();
    let value = code.trim();
    // Accept a pasted full link too.
    const m = value.match(/\/w\/([a-z0-9-]+)/i);
    if (m) value = m[1];
    const slug = slugify(value);
    if (slug) router.push(`/w/${slug}`);
  };
  return (
    <form onSubmit={submit} className="row" style={{ justifyContent: 'center' }}>
      <label htmlFor="gallery-code" className="visually-hidden">Gallery name</label>
      <input id="gallery-code" className="input" style={{ flex: '1 1 220px', maxWidth: 360, textAlign: 'center' }}
        placeholder="e.g. anjali-anukool" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="off" autoCapitalize="none" spellCheck={false} />
      <button className="btn btn-primary" disabled={!code.trim()} type="submit">Open <ArrowRight aria-hidden="true" /></button>
    </form>
  );
}
