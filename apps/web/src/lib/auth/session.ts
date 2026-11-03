import { cookies } from 'next/headers';
import { getDb } from '@/db';
import { createSession, userForSession, type User } from './store';

export const SESSION_COOKIE = 'a12_session';

/** Session token from the browser cookie or, for the mobile app, an `Authorization: Bearer` header. */
export function tokenFromRequest(request: Request): string | null {
  const bearer = request.headers.get('authorization')?.match(/^Bearer\s+(\S+)$/i)?.[1];
  if (bearer) return bearer;
  const cookie = request.headers.get('cookie') ?? '';
  return cookie.split(/;\s*/).find((part) => part.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1) ?? null;
}

export async function userFromRequest(request: Request): Promise<User | null> {
  const token = tokenFromRequest(request);
  return token ? userForSession(getDb(), token, new Date()) : null;
}

/** Signed-in user in a server component or server action. */
export async function currentUser(): Promise<User | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? userForSession(getDb(), token, new Date()) : null;
}

/**
 * Signs the user in: an httpOnly cookie for the website and, when the mobile app asks
 * (X-A12-Client: app), the token in the body for its secure storage.
 */
export async function signInResponse(request: Request, user: User): Promise<Response> {
  const { token, expiresAt } = await createSession(getDb(), user.id, new Date());
  const isApp = request.headers.get('x-a12-client') === 'app';
  const body = { user: { id: user.id, role: user.role, phone: user.phone, email: user.email, name: user.name }, ...(isApp ? { token } : {}) };
  const res = Response.json(body, { headers: { 'Cache-Control': 'no-store' } });
  res.headers.append(
    'Set-Cookie',
    `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Expires=${expiresAt.toUTCString()}`
  );
  return res;
}
