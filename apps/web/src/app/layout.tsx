import type { Metadata } from 'next';
import { I18nProvider } from '@/lib/i18n';
import './globals.css';

export const metadata: Metadata = {
  title: 'A12 — Live Virtual Try-On for Any Online Store',
  description:
    'Live virtual try-on for any online store. Drag any clothing item onto yourself and see it on your camera in real time. Free Chrome extension, no photo upload.',
  openGraph: {
    type: 'website',
    url: 'https://a12.uz/',
    title: 'A12 — Try clothes on, anywhere online',
    description:
      'Drag any clothing item from any online store and see it on you, live. Free Chrome extension, no photo upload.',
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
    title: 'A12 — Try clothes on, anywhere online',
    description: 'Drag any clothing item from any online store and see it on you, live.',
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
        <link
          rel="preload"
          href="/fonts/RoobertVF.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400&family=Inter:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
