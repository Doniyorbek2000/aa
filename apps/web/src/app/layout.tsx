import type { Metadata } from 'next';
import { I18nProvider } from '@/lib/i18n';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://a12.uz'),
  title: 'A12 — See it on you before you buy',
  description:
    'A12 turns your camera into a live mirror: pick a garment from any shop and see how it looks on you in real time. Works in Chrome and on your phone.',
  openGraph: {
    type: 'website',
    url: 'https://a12.uz/',
    title: 'A12 — See it on you before you buy',
    description: 'A live fitting room in your browser: pick a garment from any shop and see it on you in real time.',
    images: [
      {
        url: '/assets/one-pager/vton-hero.gif',
        width: 600,
        height: 337,
        alt: 'The same shopper side by side: a white t-shirt on the left, a red floral dress rendered live on the right.',
      },
    ],
    siteName: 'A12',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'A12 — See it on you before you buy',
    description: 'A live fitting room in your browser: pick a garment from any shop and see it on you in real time.',
    images: ['/assets/og-preview.jpg'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600;700&family=Unbounded:wght@500;600&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
