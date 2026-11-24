import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Plus_Jakarta_Sans } from 'next/font/google';
import { Analytics } from '@/components/analytics';
import { SITE } from '@/lib/config';
import './globals.css';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-cormorant',
  display: 'swap',
});
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: 'HomeFi: Find out how much mortgage you can get, in under 5 minutes',
    template: '%s · HomeFi',
  },
  description:
    'Free mortgage prequalification for Nigerians at home and in the diaspora. Compare NHF, MREIF and commercial mortgage options side by side, then talk to a vetted Mortgage Advisor.',
  openGraph: { siteName: 'HomeFi', type: 'website', locale: 'en_NG' },
  twitter: { card: 'summary_large_image', site: '@HomeFi_Ng' },
};

export const viewport: Viewport = {
  themeColor: '#0D2240',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NG" className={`${cormorant.variable} ${jakarta.variable}`}>
      <body className="min-h-dvh antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
