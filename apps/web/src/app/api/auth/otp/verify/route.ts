import { getDb } from '@/db';
import { normaliseUzPhone } from '@/lib/auth/phone';
import { signInResponse } from '@/lib/auth/session';
import { checkOtp, envList, userForPhone } from '@/lib/auth/store';
import { clientIp, createRateLimiter } from '@/lib/rate-limit';

// On top of the five-guesses-per-code lock, so one address cannot cycle through many numbers
const allowIp = createRateLimiter(20, 15 * 60_000);

const MESSAGES = {
  invalid: 'The code is not right.',
  expired: 'The code has expired, request a new one.',
  locked: 'Too many wrong codes, request a new one.',
} as const;

/** Signs in with the SMS code; creates the account on first sign-in. */
export async function POST(request: Request) {
  if (!allowIp(clientIp(request), Date.now())) {
    return Response.json({ error: 'Too many attempts, try again later.' }, { status: 429 });
  }
  const body = (await request.json().catch(() => ({}))) as { phone?: unknown; code?: unknown };
  const phone = typeof body.phone === 'string' ? normaliseUzPhone(body.phone) : null;
  const code = typeof body.code === 'string' ? body.code.trim() : '';
  if (!phone) return Response.json({ error: 'Enter an Uzbek mobile number.' }, { status: 400 });

  const db = getDb();
  const result = await checkOtp(db, phone, code, new Date());
  if (result !== 'ok') return Response.json({ error: MESSAGES[result], reason: result }, { status: 401 });

  const user = await userForPhone(db, phone, envList(process.env.ADMIN_PHONES));
  return signInResponse(request, user);
}
