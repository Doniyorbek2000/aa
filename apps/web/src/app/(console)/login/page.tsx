import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth/session';
import { LoginForm } from './login-form';

/** Only same-site paths, so the redirect cannot send people to another website. */
function safeNext(raw: string | string[] | undefined): string | null {
  return typeof raw === 'string' && raw.startsWith('/') && !raw.startsWith('//') ? raw : null;
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const next = safeNext((await searchParams).next);
  const user = await currentUser().catch(() => null);
  if (user) redirect(next ?? (user.role === 'admin' ? '/admin' : '/dashboard'));

  return (
    <main className="login">
      <div className="login-card">
        <div className="console-brand">
          <img src="/logo.png" alt="" width={28} height={28} />
          A12
        </div>
        <div>
          <h1>Kirish</h1>
          <p className="muted">Telefon raqamingiz yoki Google akkauntingiz bilan kiring.</p>
        </div>
        <LoginForm next={next} googleClientId={process.env.GOOGLE_WEB_CLIENT_ID ?? null} />
      </div>
    </main>
  );
}
