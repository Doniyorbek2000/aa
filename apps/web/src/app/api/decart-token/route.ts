import { createDecartClient } from '@decartai/sdk';
import { getDb } from '@/db';
import { userFromRequest } from '@/lib/auth/session';
import {
  MIN_SESSION_SECONDS,
  appSecondsUsedSince,
  chargeStoreSession,
  freeAppSeconds,
  recordLiveSession,
  refundStoreSeconds,
  refundUserSeconds,
  takeUserSeconds,
} from '@/lib/billing';
import { decartAllowedOrigins, decartTokenOptions, isAllowedOrigin, maxSessionSeconds, maxSessionsPerDay } from '@/lib/decart';
import { clientIp, createRateLimiter } from '@/lib/rate-limit';

const SESSIONS_PER_CLIENT = 3;
const CLIENT_WINDOW_MS = 10 * 60_000;
const DAY_MS = 24 * 60 * 60_000;
const STORE_KEY = /^[A-Za-z0-9_-]{16,64}$/;
const allowClient = createRateLimiter(SESSIONS_PER_CLIENT, CLIENT_WINDOW_MS);
const allowToday = createRateLimiter(maxSessionsPerDay(process.env.DECART_MAX_SESSIONS_PER_DAY), DAY_MS);
// Free (non-shop) live AI is a short taste: one visitor must not spend the whole site budget
const FREE_SESSIONS_PER_CLIENT_PER_DAY = 2;
const allowFreeClientToday = createRateLimiter(FREE_SESSIONS_PER_CLIENT_PER_DAY, DAY_MS);

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
  const source = body.source === 'widget' || body.source === 'app' || body.source === 'live-shop' ? body.source : 'web';
  const hasDb = !!process.env.DATABASE_URL;

  let seconds = maxSessionSeconds(process.env.DECART_MAX_SESSION_SECONDS);
  let storeId: string | null = null;
  // Seconds of this session that come from the free daily allowance and from the person's bought balance
  let freeSeconds = 0;
  let paidSeconds = 0;
  const user = hasDb ? await userFromRequest(request).catch(() => null) : null;
  const giveBack = () => (user && paidSeconds > 0 ? refundUserSeconds(getDb(), user.id, paidSeconds).catch(() => {}) : Promise.resolve());

  if (source === 'app' && !storeKey) {
    // The app is free to download: its live AI needs an account, spends today's free seconds first, then bought ones
    if (!user) return Response.json({ error: 'Sign in to use live AI.', reason: 'sign-in' }, { status: 401 });
    const used = await appSecondsUsedSince(getDb(), user.id, new Date(now.getTime() - DAY_MS));
    freeSeconds = Math.min(seconds, Math.max(0, freeAppSeconds(process.env.FREE_APP_SECONDS_PER_DAY) - used));
    paidSeconds = await takeUserSeconds(getDb(), user.id, seconds - freeSeconds);
    if (freeSeconds + paidSeconds < MIN_SESSION_SECONDS) {
      await giveBack();
      return Response.json({ error: 'Today’s free live AI time is used up.', reason: 'daily-limit' }, { status: 402 });
    }
    seconds = freeSeconds + paidSeconds;
  } else if (source === 'web' && !storeKey && user && user.secondsBalance > 0) {
    // Signed in on the web with bought seconds: those pay, and the free-taste limits do not apply
    paidSeconds = await takeUserSeconds(getDb(), user.id, seconds);
    if (paidSeconds < MIN_SESSION_SECONDS) {
      await giveBack();
      paidSeconds = 0;
    } else {
      seconds = paidSeconds;
    }
  }

  if (storeKey && hasDb) {
    const charge = await chargeStoreSession(getDb(), storeKey, seconds, now);
    if (!charge.ok) {
      return Response.json({ error: 'This shop has no live AI seconds left.', reason: charge.reason }, { status: 402 });
    }
    ({ seconds, storeId } = charge);
  } else if (!storeKey && paidSeconds === 0) {
    if (!allowFreeClientToday(clientIp(request), now.getTime())) {
      return Response.json({ error: 'Today’s free live AI tries are used up.', reason: 'daily-limit' }, { status: 429 });
    }
    if (!allowToday('site', now.getTime())) {
      return Response.json({ error: 'Too many live sessions, try again later.' }, { status: 429 });
    }
  } else if (storeKey && !allowToday('site', now.getTime())) {
    // A shop key without a database cannot be billed, so it shares the site budget
    return Response.json({ error: 'Too many live sessions, try again later.' }, { status: 429 });
  }

  try {
    const token = await createDecartClient({ apiKey }).tokens.create(decartTokenOptions(origins, seconds));
    if (hasDb) {
      // Free and bought seconds are logged apart, so bought ones never eat into tomorrow's free allowance
      const userId = user?.id ?? null;
      const sessions = paidSeconds > 0
        ? [
            ...(freeSeconds > 0 ? [{ storeId, userId, source, seconds: freeSeconds }] : []),
            { storeId, userId, source: `${source}-paid`, seconds: paidSeconds },
          ]
        : [{ storeId, userId, source, seconds }];
      for (const session of sessions) {
        await recordLiveSession(getDb(), session).catch((error: unknown) =>
          console.error('Live session not recorded', error instanceof Error ? error.message : 'unknown error')
        );
      }
    }
    return Response.json(
      { apiKey: token.apiKey, expiresAt: token.expiresAt, seconds },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    if (storeId) await refundStoreSeconds(getDb(), storeId, seconds).catch(() => {});
    await giveBack();
    console.error('Decart token request failed', error instanceof Error ? error.message : 'unknown error');
    return Response.json({ error: 'Live AI try-on is unavailable right now.' }, { status: 502 });
  }
}
