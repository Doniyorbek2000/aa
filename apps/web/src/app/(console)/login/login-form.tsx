'use client';

import { useEffect, useRef, useState } from 'react';

type GoogleId = {
  initialize: (options: { client_id: string; callback: (response: { credential?: string }) => void }) => void;
  renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
};
declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleId } };
  }
}

type Props = { next: string | null; googleClientId: string | null };

async function post(url: string, body: unknown): Promise<{ ok: boolean; data: Record<string, unknown> }> {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return { ok: res.ok, data: (await res.json().catch(() => ({}))) as Record<string, unknown> };
}

const ERRORS: Record<string, string> = {
  invalid: 'Kod noto‘g‘ri.',
  expired: 'Kod eskirgan, yangisini so‘rang.',
  locked: 'Juda ko‘p noto‘g‘ri urinish, yangi kod so‘rang.',
};

export function LoginForm({ next, googleClientId }: Props) {
  const [phone, setPhone] = useState('+998 ');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [mode, setMode] = useState<'sms' | 'password'>('sms');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const googleRef = useRef<HTMLDivElement | null>(null);

  const finish = (data: Record<string, unknown>) => {
    const role = (data.user as { role?: string } | undefined)?.role;
    window.location.assign(next ?? (role === 'admin' ? '/admin' : '/dashboard'));
  };

  // `finish` only reads `next`, which never changes on this page
  useEffect(() => {
    if (!googleClientId) return;
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => {
      const id = window.google?.accounts?.id;
      if (!id || !googleRef.current) return;
      id.initialize({
        client_id: googleClientId,
        callback: async ({ credential }) => {
          if (!credential) return;
          const { ok, data } = await post('/api/auth/google', { idToken: credential });
          if (ok) finish(data);
          else setError('Google orqali kirib bo‘lmadi.');
        },
      });
      id.renderButton(googleRef.current, { theme: 'outline', size: 'large', width: 360, text: 'continue_with' });
    };
    document.head.appendChild(script);
    return () => script.remove();
  }, [googleClientId]);

  const requestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBusy(true);
    setError(null);
    const { ok, data } = await post('/api/auth/otp/request', { phone });
    setIsBusy(false);
    if (ok || typeof data.retryAfterMs === 'number') {
      setStep('code');
      setDevCode(typeof data.devCode === 'string' ? data.devCode : null);
    } else {
      setError(typeof data.error === 'string' ? data.error : 'SMS yuborib bo‘lmadi.');
    }
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBusy(true);
    setError(null);
    const { ok, data } = await post('/api/auth/otp/verify', { phone, code });
    setIsBusy(false);
    if (ok) finish(data);
    else setError(ERRORS[String(data.reason)] ?? 'Kirib bo‘lmadi.');
  };

  const signInWithPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBusy(true);
    setError(null);
    const { ok, data } = await post('/api/auth/password', { login, password });
    setIsBusy(false);
    if (ok) finish(data);
    else setError(typeof data.error === 'string' ? data.error : 'Kirib bo‘lmadi.');
  };

  const switchMode = (next: 'sms' | 'password') => {
    setMode(next);
    setError(null);
  };

  return (
    <div className="card" style={{ display: 'grid', gap: 14 }}>
      <div className="segmented" role="tablist" aria-label="Kirish usuli">
        <button type="button" role="tab" aria-selected={mode === 'sms'} className={mode === 'sms' ? 'on' : ''} onClick={() => switchMode('sms')}>
          SMS kod
        </button>
        <button type="button" role="tab" aria-selected={mode === 'password'} className={mode === 'password' ? 'on' : ''} onClick={() => switchMode('password')}>
          Login va parol
        </button>
      </div>
      {mode === 'password' ? (
        <form onSubmit={signInWithPassword} style={{ display: 'grid', gap: 10 }}>
          <label className="field">
            <span>Login</span>
            <input className="input" autoComplete="username" autoCapitalize="none" value={login} onChange={(e) => setLogin(e.target.value)} required />
          </label>
          <label className="field">
            <span>Parol</span>
            <input className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          <button className="btn" type="submit" disabled={isBusy}>
            {isBusy ? 'Tekshirilmoqda…' : 'Kirish'}
          </button>
          <p className="muted" style={{ fontSize: 13 }}>Faqat adminlar uchun. Login va parol admin paneldagi “Kirish sozlamalari”da o‘rnatiladi.</p>
        </form>
      ) : step === 'phone' ? (
        <form onSubmit={requestCode} style={{ display: 'grid', gap: 10 }}>
          <label className="field">
            <span>Telefon raqami</span>
            <input className="input" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </label>
          <button className="btn" type="submit" disabled={isBusy}>
            {isBusy ? 'Yuborilmoqda…' : 'SMS kod olish'}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyCode} style={{ display: 'grid', gap: 10 }}>
          <p className="muted">{phone} raqamiga 6 xonali kod yuborildi.</p>
          {devCode && <p className="notice">Sinov rejimi: kod {devCode}</p>}
          <label className="field">
            <span>SMS kod</span>
            <input
              className="input"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              required
              autoFocus
            />
          </label>
          <button className="btn" type="submit" disabled={isBusy || code.length !== 6}>
            {isBusy ? 'Tekshirilmoqda…' : 'Kirish'}
          </button>
          <button className="btn btn-ghost" type="button" onClick={() => setStep('phone')}>
            Raqamni o‘zgartirish
          </button>
        </form>
      )}
      {error && <p className="error" role="alert">{error}</p>}
      {googleClientId && (
        <>
          <div className="divider">yoki</div>
          <div ref={googleRef} style={{ display: 'flex', justifyContent: 'center', minHeight: 44 }} />
        </>
      )}
    </div>
  );
}
