import Link from 'next/link';
import type { User } from '@/lib/auth/store';
import { maskPhone } from '@/lib/auth/phone';
import { LogoutButton } from './logout-button';

export function ConsoleHeader({ user }: { user: User }) {
  const who = user.name ?? user.email ?? (user.phone ? maskPhone(user.phone) : '');
  return (
    <header className="console-top">
      <Link href="/" className="console-brand">
        <img src="/logo.png" alt="" width={28} height={28} />
        A12
      </Link>
      <nav className="console-nav" aria-label="Boshqaruv">
        {user.role === 'admin' && <Link href="/admin">Admin</Link>}
        <Link href="/dashboard">Do‘konim</Link>
        <span className="muted">{who}</span>
        <LogoutButton />
      </nav>
    </header>
  );
}
