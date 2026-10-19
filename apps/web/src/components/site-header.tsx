import type { Dictionary } from '@/lib/dictionaries';
import type { Locale } from '@/lib/locale';
import { MODULE_SLUGS } from '@/lib/modules';
import { LocaleSwitcher } from './locale-switcher';
import { Logo } from './logo';
import { NavLink } from './nav-link';
import { ThemeToggle } from './theme-toggle';

export function SiteHeader({ locale, t }: { locale: Locale; t: Dictionary }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Logo href={`/${locale}`} />
        <nav aria-label={t.a11y.mainNav} className="hidden md:block">
          <ul className="flex items-center gap-1 text-sm">
            {MODULE_SLUGS.map((slug) => (
              <li key={slug}>
                <NavLink
                  href={`/${locale}/${slug}`}
                  className="rounded-input px-3 py-1.5 transition-colors"
                  activeClassName="bg-fg/[0.06] font-medium text-fg"
                  inactiveClassName="text-muted hover:text-fg"
                >
                  {t.modules[slug].short}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <LocaleSwitcher current={locale} label={t.a11y.language} />
          <ThemeToggle labels={t.a11y.theme} />
        </div>
      </div>
    </header>
  );
}
