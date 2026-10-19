import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { notFound } from 'next/navigation';
import { MobileNav } from '@/components/mobile-nav';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { THEME_INIT_SCRIPT } from '@/components/theme-toggle';
import { DICTIONARIES } from '@/lib/dictionaries';
import { HTML_LANG, LOCALES, isLocale } from '@/lib/locale';
import '../globals.css';

const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-inter', display: 'swap' });

export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<'/[locale]'>): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = DICTIONARIES[locale];
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
    title: { default: t.meta.title, template: `%s · A12` },
    description: t.meta.description,
    alternates: { canonical: `/${locale}`, languages: { uz: '/uz', ru: '/ru', 'x-default': '/uz' } },
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = DICTIONARIES[locale];

  return (
    <html lang={HTML_LANG[locale]} className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Static constant (no user input): applies the stored theme before first paint. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-dvh flex-col bg-bg font-sans text-fg antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-input focus:bg-ink focus:px-3 focus:py-2 focus:text-ink-fg"
        >
          {t.a11y.skip}
        </a>
        <SiteHeader locale={locale} t={t} />
        <main id="main" className="flex-1 pb-20 md:pb-0">
          {children}
        </main>
        <SiteFooter t={t} />
        <MobileNav locale={locale} t={t} />
      </body>
    </html>
  );
}
