import { count, eq } from 'drizzle-orm';
import Link from 'next/link';
import { getDb, schema } from '@/db';
import type { User } from '@/lib/auth/store';
import { maskPhone } from '@/lib/auth/phone';
import { LogoutButton } from './logout-button';

/** Receipts waiting for an admin; shown on every console page so none sit unnoticed. */
async function pendingPayments(): Promise<number> {
  const [row] = await getDb().select({ n: count() }).from(schema.payments).where(eq(schema.payments.status, 'pending'));
  return row?.n ?? 0;
}

export async function ConsoleHeader({ user }: { user: User }) {
  const who = user.name ?? user.email ?? (user.phone ? maskPhone(user.phone) : '');
  const pending = user.role === 'admin' ? await pendingPayments() : 0;
  return (
    <header className="console-top">
      <Link href="/" className="console-brand">
        <img src="/logo.png" alt="" width={28} height={28} />
        A12
      </Link>
      <nav className="console-nav" aria-label="Boshqaruv">
        {user.role === 'admin' && (
          <Link href="/admin">
            Admin
            {pending > 0 && (
              <span className="badge" style={{ marginLeft: 6 }} aria-label={`${pending} ta chek kutmoqda`}>
                {pending} chek
              </span>
            )}
          </Link>
        )}
        <Link href="/dashboard">Do‘konim</Link>
        <span className="muted">{who}</span>
        <LogoutButton />
      </nav>
    </header>
  );
}
