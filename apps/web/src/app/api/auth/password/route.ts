import { getDb } from '@/db';
import { normaliseLogin, userForCredentials } from '@/lib/auth/password';
import { signInResponse } from '@/lib/auth/session';
import { clientIp, createRateLimiter } from '@/lib/rate-limit';

const WINDOW_MS = 15 * 60_000;
// Guessing is slowed per address and per login, so spreading over many addresses does not help either
const allowIp = createRateLimiter(10, WINDOW_MS);
const allowLogin = createRateLimiter(5, WINDOW_MS);

/** Admin sign-in with login and password, as an alternative to the SMS code. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { login?: unknown; password?: unknown };
  const login = typeof body.login === 'string' ? normaliseLogin(body.login).slice(0, 40) : '';
  const password = typeof body.password === 'string' ? body.password.slice(0, 128) : '';
  if (!login || !password) return Response.json({ error: 'Login va parolni kiriting.' }, { status: 400 });

  const now = Date.now();
  if (!allowIp(clientIp(request), now) || !allowLogin(login, now)) {
    return Response.json({ error: 'Juda ko‘p urinish. 15 daqiqadan keyin qayta urinib ko‘ring.' }, { status: 429 });
  }

  const user = await userForCredentials(getDb(), login, password);
  if (!user) return Response.json({ error: 'Login yoki parol noto‘g‘ri.' }, { status: 401 });
  return signInResponse(request, user);
}
