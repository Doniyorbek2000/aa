import { getDb } from '@/db';
import { verifyGoogleIdToken } from '@/lib/auth/google';
import { signInResponse } from '@/lib/auth/session';
import { envList, userForGoogle } from '@/lib/auth/store';
import { clientIp, createRateLimiter } from '@/lib/rate-limit';

const allowIp = createRateLimiter(20, 15 * 60_000);

/** Signs in with a Google ID token from the website button or the mobile app. */
export async function POST(request: Request) {
  if (!allowIp(clientIp(request), Date.now())) {
    return Response.json({ error: 'Too many attempts, try again later.' }, { status: 429 });
  }
  const body = (await request.json().catch(() => ({}))) as { idToken?: unknown };
  if (typeof body.idToken !== 'string' || body.idToken.length > 4096) {
    return Response.json({ error: 'Missing Google sign-in token.' }, { status: 400 });
  }
  // Client IDs keep their case; only emails are compared lower-cased
  const clientIds = (process.env.GOOGLE_CLIENT_IDS ?? '').split(',').map((id) => id.trim()).filter(Boolean);
  let account: Awaited<ReturnType<typeof verifyGoogleIdToken>>;
  try {
    account = await verifyGoogleIdToken(body.idToken, clientIds);
  } catch {
    return Response.json({ error: 'Google sign-in could not be verified.' }, { status: 401 });
  }
  const user = await userForGoogle(getDb(), account, envList(process.env.ADMIN_EMAILS));
  return signInResponse(request, user);
}
