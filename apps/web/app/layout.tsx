import type React from 'react';
import type { Metadata, Viewport } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

/**
 * Root layout. Loads the brand type via next/font (self-hosted, no layout shift)
 * and exposes it as CSS variables consumed by tailwind.config.ts. Metadata is set
 * once here and overridden per-route (e.g. the share page's OG tags).
 */
const sans = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const display = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://tayfa.app'),
  title: {
    default: 'Tayfa — Friends through doing, not swiping',
    template: '%s · Tayfa',
  },
  description:
    'Tayfa turns shared hobbies into real-life, small-group hangouts. Verified members, 18+, you choose who sees you. Not a dating app.',
  applicationName: 'Tayfa',
  openGraph: {
    title: 'Tayfa — Friends through doing, not swiping',
    description:
      'Verified, location-based meetups built around what you love. Starting in Istanbul.',
    type: 'website',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#15131f',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body>{children}</body>
    </html>
  );
}
