/**
 * SMS through Eskiz.uz. The account logs in with ESKIZ_EMAIL / ESKIZ_PASSWORD; the token lasts
 * 30 days and is cached per server instance. Message text must match a template Eskiz approved
 * (ESKIZ_TEMPLATE, with {code} where the code goes).
 */
const ESKIZ_API = 'https://notify.eskiz.uz/api';
const TOKEN_REUSE_MS = 25 * 24 * 60 * 60_000;
// Eskiz template #98774, approved 2026-11-04 for sender 4546; any change needs a new approval
const DEFAULT_TEMPLATE = 'Kodni hech kimga bermang! A12 ilovasiga kirish uchun tasdiqlash kodi: {code}';

let cached: { token: string; until: number } | null = null;

export function isSmsConfigured(): boolean {
  return !!process.env.ESKIZ_EMAIL && !!process.env.ESKIZ_PASSWORD;
}

export function smsText(code: string): string {
  return (process.env.ESKIZ_TEMPLATE || DEFAULT_TEMPLATE).replace('{code}', code);
}

async function login(): Promise<string> {
  const form = new FormData();
  form.set('email', process.env.ESKIZ_EMAIL ?? '');
  form.set('password', process.env.ESKIZ_PASSWORD ?? '');
  const res = await fetch(`${ESKIZ_API}/auth/login`, { method: 'POST', body: form, signal: AbortSignal.timeout(15_000) });
  const data = (await res.json().catch(() => ({}))) as { data?: { token?: unknown } };
  if (!res.ok || typeof data.data?.token !== 'string') throw new Error(`Eskiz login failed (${res.status})`);
  cached = { token: data.data.token, until: Date.now() + TOKEN_REUSE_MS };
  return cached.token;
}

/** Sends one SMS to +998XXXXXXXXX; retries once with a fresh token if Eskiz rejects the cached one. */
export async function sendSms(phone: string, text: string): Promise<void> {
  const send = async (token: string) => {
    const form = new FormData();
    form.set('mobile_phone', phone.replace(/^\+/, ''));
    form.set('message', text);
    form.set('from', process.env.ESKIZ_FROM || '4546');
    return fetch(`${ESKIZ_API}/message/sms/send`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
      signal: AbortSignal.timeout(15_000),
    });
  };
  let res = await send(cached && cached.until > Date.now() ? cached.token : await login());
  if (res.status === 401) res = await send(await login());
  if (!res.ok) throw new Error(`Eskiz send failed (${res.status})`);
}
