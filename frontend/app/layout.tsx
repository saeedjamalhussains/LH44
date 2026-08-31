import type { Metadata, Viewport } from 'next';
import './globals.css';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  metadataBase: new URL('https://legacy-of-44.example'),
  title: {
    default: 'Lewis Hamilton | The Legacy of 44',
    template: '%s | The Legacy of 44',
  },
  description:
    "Explore Lewis Hamilton's Formula 1 legacy through career statistics, championships, race history, rivalries and interactive FastF1 telemetry.",
  keywords: ['Lewis Hamilton', 'Formula 1', '44', 'FastF1', 'telemetry', 'Ferrari', 'Mercedes', 'F1 data'],
  openGraph: {
    title: 'Lewis Hamilton | The Legacy of 44',
    description:
      'A career measured in milliseconds. A legacy measured in generations. Seven world championships, explored through data.',
    type: 'website',
    siteName: 'The Legacy of 44',
  },
  twitter: { card: 'summary_large_image', title: 'Lewis Hamilton | The Legacy of 44' },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#050505',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
        />
        {/* Entrance animations are server-rendered in their hidden start state.
            Without JS they would never play, so reveal everything instead. */}
        <noscript>
          <style>{`
            [style*="opacity:0"], [style*="opacity: 0"] {
              opacity: 1 !important; transform: none !important;
            }
            /* Bars animate from width:0; without JS they would stay collapsed. */
            [style*="width:0"], [style*="width: 0"] { width: auto !important; }
          `}</style>
        </noscript>
      </head>
      <body>
        <Nav />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
