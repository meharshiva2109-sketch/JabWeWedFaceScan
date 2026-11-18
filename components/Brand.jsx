import Link from 'next/link';

export function HeartIcon({ className = '', filled = false }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20.5s-7.5-4.6-9.2-9.4C1.6 7.7 3.7 4.5 7 4.5c2 0 3.6 1.2 5 3 1.4-1.8 3-3 5-3 3.3 0 5.4 3.2 4.2 6.6-1.7 4.8-9.2 9.4-9.2 9.4z" />
    </svg>
  );
}

/** "jab ♡ we wed.." signature with "by SMF Studios" — mirrors the printed standee. */
export function Brand({ size = 'lg', href = '/' }) {
  const inner = (
    <>
      <span className="brand-script" aria-hidden="true">
        <span className="l1">jab<HeartIcon className="brand-heart" /></span>
        <span className="l2">we wed..</span>
      </span>
      <span className="visually-hidden">Jab We Wed</span>
      <span className="brand-sub">by SMF Studios</span>
    </>
  );
  if (!href) return <span className={`brand ${size}`}>{inner}</span>;
  return <Link href={href} className={`brand ${size}`} aria-label="Jab We Wed by SMF Studios — home">{inner}</Link>;
}

export function CameraRule() {
  return (
    <div className="rule" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"><path d="M4 8.5h3l1.6-2.5h6.8L17 8.5h3a1 1 0 0 1 1 1V18a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5a1 1 0 0 1 1-1z" /><circle cx="12" cy="13.5" r="3.6" /></svg>
    </div>
  );
}

export function HeartRule() {
  return <div className="rule" aria-hidden="true"><HeartIcon /></div>;
}

export function Decor() {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/decor/leaf.webp" alt="" className="decor-leaf" aria-hidden="true" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/decor/flower.webp" alt="" className="decor-flower" aria-hidden="true" />
    </>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <HeartRule />
      <div className="thanks">Thank You</div>
      <div className="thanks-line">for being a part of our celebration!</div>
      <div className="footer-links">
        <Link href="/privacy">Privacy &amp; selfie policy</Link>
        <a href="https://instagram.com/jabwewed.in" target="_blank" rel="noreferrer">@jabwewed.in</a>
      </div>
    </footer>
  );
}
