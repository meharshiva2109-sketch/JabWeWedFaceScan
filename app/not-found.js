import Link from 'next/link';
import { Brand, Decor, Footer } from '@/components/Brand';

export default function NotFound() {
  return (
    <div className="page">
      <Decor />
      <main className="wrap narrow" style={{ textAlign: 'center', paddingTop: 56 }}>
        <Brand size="md" />
        <div className="card" style={{ padding: 28, marginTop: 30 }}>
          <h1 className="serif" style={{ color: 'var(--cocoa)', fontWeight: 600, fontSize: 30, margin: 0 }}>Gallery not found</h1>
          <p className="muted" style={{ lineHeight: 1.6 }}>Please check the QR code or the gallery name shared by the couple.</p>
          <Link className="btn btn-ghost" href="/#find">Enter gallery name</Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
