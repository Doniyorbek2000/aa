import { getDb } from '@/db';
import { MIN_PASSWORD, hasCredentials } from '@/lib/auth/password';
import type { User } from '@/lib/auth/store';
import { saveAdminCredentials } from './actions';

const MESSAGES: Record<string, { ok: boolean; text: string }> = {
  ok: { ok: true, text: 'Saqlandi. Endi /login sahifasida “Login va parol” orqali kira olasiz.' },
  mismatch: { ok: false, text: 'Yangi parol va uning takrori bir xil emas.' },
  login: { ok: false, text: 'Login 3–40 belgi bo‘lsin: lotin harflari, raqamlar, nuqta, chiziqcha.' },
  length: { ok: false, text: `Parol kamida ${MIN_PASSWORD} belgi bo‘lsin.` },
  same: { ok: false, text: 'Parol logindan farq qilsin, aks holda uni taxmin qilish juda oson.' },
  taken: { ok: false, text: 'Bu login boshqa adminda band.' },
  'wrong-current': { ok: false, text: 'Joriy parol noto‘g‘ri.' },
};

/** The admin's own login and password, as a second way in besides the SMS code. */
export async function CredentialsSection({ user, status }: { user: User; status: string | undefined }) {
  const existing = await hasCredentials(getDb(), user.id);
  const message = status ? MESSAGES[status] : undefined;

  return (
    <section className="card" id="kirish" style={{ display: 'grid', gap: 12 }}>
      <h2>Kirish sozlamalari</h2>
      <p className="muted">
        {existing
          ? `Login: ${existing.login}. Parolni yoki loginni o‘zgartirish uchun joriy parolni ham kiriting.`
          : 'Hozir faqat SMS kod bilan kirasiz. Login va parol o‘rnatsangiz, SMSsiz ham kira olasiz.'}
      </p>
      {message && (
        <p className={message.ok ? 'notice' : 'error'} role="status">
          {message.text}
        </p>
      )}
      <form action={saveAdminCredentials} className="form-row" style={{ alignItems: 'flex-end' }}>
        <label className="field">
          <span>Login</span>
          <input className="input" name="login" required minLength={3} maxLength={40} autoComplete="username" autoCapitalize="none" defaultValue={existing?.login ?? ''} />
        </label>
        {existing && (
          <label className="field">
            <span>Joriy parol</span>
            <input className="input" name="current" type="password" required autoComplete="current-password" />
          </label>
        )}
        <label className="field">
          <span>Yangi parol</span>
          <input className="input" name="password" type="password" required minLength={MIN_PASSWORD} maxLength={128} autoComplete="new-password" />
        </label>
        <label className="field">
          <span>Yangi parol (takror)</span>
          <input className="input" name="confirm" type="password" required minLength={MIN_PASSWORD} maxLength={128} autoComplete="new-password" />
        </label>
        <button className="btn" type="submit">{existing ? 'O‘zgartirish' : 'O‘rnatish'}</button>
      </form>
      <p className="muted" style={{ fontSize: 13 }}>
        Telefon raqamingiz yoki tug‘ilgan sanangiz kabi taxmin qilinadigan parol qo‘ymang: bu oyna orqali to‘lovlar tasdiqlanadi.
      </p>
    </section>
  );
}
