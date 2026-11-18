// Self-hosted fonts (no third-party font requests from guests' phones)
import '@fontsource/allura/latin-400.css';
import '@fontsource/cinzel/latin-400.css';
import '@fontsource/cinzel/latin-500.css';
import '@fontsource/cormorant-garamond/latin-500.css';
import '@fontsource/cormorant-garamond/latin-600.css';
import '@fontsource/cormorant-garamond/latin-500-italic.css';
import '@fontsource/jost/latin-300.css';
import '@fontsource/jost/latin-400.css';
import '@fontsource/jost/latin-500.css';
import './globals.css';

export const metadata = {
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL) : undefined,
  title: { default: 'Jab We Wed — Find Your Wedding Photos', template: '%s · Jab We Wed' },
  description: 'Scan your face & download your wedding memories for free. By SMF Studios.',
  applicationName: 'Jab We Wed',
  icons: { icon: '/icon.svg' },
  openGraph: {
    title: 'Jab We Wed — Find Your Wedding Photos',
    description: 'Scan your face & download your wedding memories. By SMF Studios.',
    type: 'website',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#f6dcc8',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
