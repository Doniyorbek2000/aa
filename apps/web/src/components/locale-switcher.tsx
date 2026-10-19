'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LOCALES, switchLocalePath, type Locale } from '@/lib/locale';

export function LocaleSwitcher({ current, label }: { current: Locale; label: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label={label} className="flex rounded-input border border-border p-0.5 text-xs font-semibold">
      {LOCALES.map((locale) => (
        <Link
          key={locale}
          href={switchLocalePath(pathname, locale)}
          hrefLang={locale}
          aria-current={locale === current ? 'true' : undefined}
          className={
            locale === current
              ? 'rounded-[4px] bg-ink px-2 py-1 uppercase text-ink-fg'
              : 'rounded-[4px] px-2 py-1 uppercase text-muted hover:text-fg'
          }
        >
          {locale}
        </Link>
      ))}
    </nav>
  );
}
