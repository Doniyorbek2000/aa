import { createDecartClient } from '@decartai/sdk';
import {
  createRateLimiter,
  decartAllowedOrigins,
  decartTokenOptions,
  isAllowedOrigin,
  maxSessionSeconds,
  maxSessionsPerDay,
} from '@/lib/decart';

const SESSIONS_PER_CLIENT = 3;
const CLIENT_WINDOW_MS = 10 * 60_000;
const DAY_MS = 24 * 60 * 60_000;
const allowClient = createRateLimiter(SESSIONS_PER_CLIENT, CLIENT_WINDOW_MS);
const allowToday = createRateLimiter(maxSessionsPerDay(process.env.DECART_MAX_SESSIONS_PER_DAY), DAY_MS);

/**
 * Mints a short-lived Decart token for one live try-on session. Every token is locked to the
 * try-on model, A12's own origins and a session length cap, and the site has a per-client and
 * a daily session budget, so neither a leaked token nor a script can run up the bill.
 * DECART_API_KEY itself never leaves the server.
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

  // Caddy, the only way in, sets X-Forwarded-For to the real client address
  const client = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const now = Date.now();
  if (!allowClient(client, now) || !allowToday('site', now)) {
    return Response.json({ error: 'Too many live sessions, try again later.' }, { status: 429 });
  }

  try {
    const token = await createDecartClient({ apiKey }).tokens.create(
      decartTokenOptions(origins, maxSessionSeconds(process.env.DECART_MAX_SESSION_SECONDS))
    );
    return Response.json(
      { apiKey: token.apiKey, expiresAt: token.expiresAt },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Decart token request failed', error instanceof Error ? error.message : 'unknown error');
    return Response.json({ error: 'Live AI try-on is unavailable right now.' }, { status: 502 });
  }
}
