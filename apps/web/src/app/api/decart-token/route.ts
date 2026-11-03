import { createDecartClient } from '@decartai/sdk';
import { getDb } from '@/db';
import { userFromRequest } from '@/lib/auth/session';
import { chargeStoreSession, recordLiveSession, refundStoreSeconds } from '@/lib/billing';
import { decartAllowedOrigins, decartTokenOptions, isAllowedOrigin, maxSessionSeconds, maxSessionsPerDay } from '@/lib/decart';
import { clientIp, createRateLimiter } from '@/lib/rate-limit';

const SESSIONS_PER_CLIENT = 3;
const CLIENT_WINDOW_MS = 10 * 60_000;
const DAY_MS = 24 * 60 * 60_000;
const STORE_KEY = /^[A-Za-z0-9_-]{16,64}$/;
const allowClient = createRateLimiter(SESSIONS_PER_CLIENT, CLIENT_WINDOW_MS);
const allowToday = createRateLimiter(maxSessionsPerDay(process.env.DECART_MAX_SESSIONS_PER_DAY), DAY_MS);

/**
 * Mints a short-lived Decart token for one live try-on session. Every token is locked to the
 * try-on model, A12's own origins and a session length cap. A visitor sent by a shop's widget
 * spends that shop's plan minutes (402 when used up, and the page falls back to the free
 * overlay); everyone else shares A12's daily session budget. DECART_API_KEY never leaves the server.
 */
export async function POST(request: Request) {
  const apiKey = process.env.DECART_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'Live AI try-on is not configured.' }, { status: 503 });
  }

  const origins = decartAllowedOrigins(process.env.DECART_ALLOWED_ORIGINS);
  if (!isAllowedOrigin(request.headers.get('origin'), origins)) {
    return Response.json({ error: 'Origin not allowed.' }, { status: 403 });
  }

  const now = new Date();
  if (!allowClient(clientIp(request), now.getTime())) {
    return Response.json({ error: 'Too many live sessions, try again later.' }, { status: 429 });
  }

  const body = (await request.json().catch(() => ({}))) as { storeKey?: unknown; source?: unknown };
  const storeKey = typeof body.storeKey === 'string' && STORE_KEY.test(body.storeKey) ? body.storeKey : null;
  const source = body.source === 'widget' || body.source === 'app' ? body.source : 'web';
  const hasDb = !!process.env.DATABASE_URL;

  let seconds = maxSessionSeconds(process.env.DECART_MAX_SESSION_SECONDS);
  let storeId: string | null = null;
  if (storeKey && hasDb) {
    const charge = await chargeStoreSession(getDb(), storeKey, seconds, now);
    if (!charge.ok) {
      return Response.json({ error: 'This shop has no live AI minutes left.', reason: charge.reason }, { status: 402 });
    }
    ({ seconds, storeId } = charge);
  } else if (!allowToday('site', now.getTime())) {
    return Response.json({ error: 'Too many live sessions, try again later.' }, { status: 429 });
  }

  try {
    const token = await createDecartClient({ apiKey }).tokens.create(decartTokenOptions(origins, seconds));
    if (hasDb) {
      const user = await userFromRequest(request).catch(() => null);
      await recordLiveSession(getDb(), { storeId, userId: user?.id ?? null, source, seconds }).catch((error: unknown) =>
        console.error('Live session not recorded', error instanceof Error ? error.message : 'unknown error')
      );
    }
    return Response.json(
      { apiKey: token.apiKey, expiresAt: token.expiresAt, seconds },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    if (storeId) await refundStoreSeconds(getDb(), storeId, seconds).catch(() => {});
    console.error('Decart token request failed', error instanceof Error ? error.message : 'unknown error');
    return Response.json({ error: 'Live AI try-on is unavailable right now.' }, { status: 502 });
  }
}
