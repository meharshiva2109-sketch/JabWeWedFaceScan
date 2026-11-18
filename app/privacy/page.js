import { Brand, Decor, Footer } from '@/components/Brand';

export const metadata = { title: 'Privacy & selfie policy' };

export default function Privacy() {
  const h = { fontFamily: 'var(--serif)', color: 'var(--cocoa)', fontWeight: 600, fontSize: 24, margin: '26px 0 8px' };
  return (
    <div className="page">
      <Decor />
      <main className="wrap narrow" style={{ paddingTop: 48 }}>
        <div style={{ textAlign: 'center' }}><Brand size="md" /></div>
        <article className="card" style={{ padding: '28px 26px', marginTop: 30, lineHeight: 1.7, fontSize: 15.5 }}>
          <h1 className="serif" style={{ color: 'var(--cocoa)', fontWeight: 600, fontSize: 34, margin: 0 }}>Privacy &amp; selfie policy</h1>
          <h2 style={h}>Your selfie</h2>
          <p>When you scan your face, your selfie is sent securely to our server and compared — using Amazon Rekognition face recognition — only against photographs from the wedding gallery you opened. The selfie is processed in memory and is <strong>not saved</strong> to our storage, database or logs. We never use it for any other purpose.</p>
          <h2 style={h}>Your matches</h2>
          <p>After a successful match we create a temporary, private download session that lists only the photos matched to your face. It expires automatically (normally within two hours). Downloads use short-lived private links, and photographs are never publicly listed.</p>
          <h2 style={h}>Wedding photographs</h2>
          <p>Photos are stored privately by SMF Studios for the couple and their guests. Each wedding is kept completely separate. Face data for a wedding is created from the photographers&apos; own gallery images and is deleted when the wedding gallery is removed.</p>
          <h2 style={h}>Questions or removal requests</h2>
          <p>If you would like a photo of you removed from a gallery, contact SMF Studios via <a href="https://instagram.com/jabwewed.in" target="_blank" rel="noreferrer">@jabwewed.in</a>.</p>
        </article>
      </main>
      <Footer />
    </div>
  );
}
