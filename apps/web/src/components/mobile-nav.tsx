import { House } from 'lucide-react';
import type { Dictionary } from '@/lib/dictionaries';
import type { Locale } from '@/lib/locale';
import { MODULE_SLUGS, MODULE_STYLE } from '@/lib/modules';
import { NavLink } from './nav-link';

const item = {
  className: 'flex flex-col items-center gap-1 py-2 text-[11px] leading-none',
  activeClassName: 'font-semibold text-fg',
  inactiveClassName: 'text-muted',
};

export function MobileNav({ locale, t }: { locale: Locale; t: Dictionary }) {
  return (
    <nav
      aria-label={t.a11y.mobileNav}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="grid grid-cols-5">
        <li>
          <NavLink href={`/${locale}`} exact {...item}>
            <House className="size-5" aria-hidden />
            {t.nav.home}
          </NavLink>
        </li>
        {MODULE_SLUGS.map((slug) => {
          const Icon = MODULE_STYLE[slug].icon;
          return (
            <li key={slug}>
              <NavLink href={`/${locale}/${slug}`} {...item}>
                <Icon className="size-5" aria-hidden />
                {t.modules[slug].short}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
