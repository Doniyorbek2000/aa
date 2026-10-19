'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

interface NavLinkProps {
  href: string;
  className: string;
  activeClassName: string;
  inactiveClassName: string;
  children: ReactNode;
  /** Home link must match exactly; section links also match their sub-pages. */
  exact?: boolean;
}

export function NavLink({ href, className, activeClassName, inactiveClassName, children, exact = false }: NavLinkProps) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + '/');
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`${className} ${active ? activeClassName : inactiveClassName}`}
    >
      {children}
    </Link>
  );
}
