import { getDb } from '@/db';
import { SESSION_COOKIE, tokenFromRequest } from '@/lib/auth/session';
import { deleteSession } from '@/lib/auth/store';

export async function POST(request: Request) {
  const token = tokenFromRequest(request);
  if (token) await deleteSession(getDb(), token);
  const res = Response.json({ ok: true });
  res.headers.append('Set-Cookie', `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
  return res;
}
