import { getDb } from '@/db';
import { isSmsConfigured, sendSms, smsText } from '@/lib/auth/eskiz';
import { normaliseUzPhone } from '@/lib/auth/phone';
import { issueOtp } from '@/lib/auth/store';
import { clientIp, createRateLimiter } from '@/lib/rate-limit';

// Each SMS costs money, so a single address may ask for only a few codes
const allowIp = createRateLimiter(5, 15 * 60_000);

/** Sends a six-digit sign-in code to an Uzbek mobile number (one per minute per number). */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { phone?: unknown };
  const phone = typeof body.phone === 'string' ? normaliseUzPhone(body.phone) : null;
  if (!phone) return Response.json({ error: 'Enter an Uzbek mobile number, e.g. +998 90 123 45 67.' }, { status: 400 });

  // App Store / Google Play reviewers sign in with this number and its fixed code, no SMS sent
  const reviewCode = process.env.AUTH_REVIEW_CODE ?? '';
  const isReviewPhone = !!process.env.AUTH_REVIEW_PHONE && phone === normaliseUzPhone(process.env.AUTH_REVIEW_PHONE) && /^\d{6}$/.test(reviewCode);
  const isDevFallback = !isSmsConfigured() && process.env.NODE_ENV !== 'production';
  if (!isSmsConfigured() && !isDevFallback && !isReviewPhone) {
    return Response.json({ error: 'SMS sign-in is not available yet.' }, { status: 503 });
  }
  if (!allowIp(clientIp(request), Date.now())) {
    return Response.json({ error: 'Too many codes requested, try again later.' }, { status: 429 });
  }

  const issued = await issueOtp(getDb(), phone, new Date(), isReviewPhone ? reviewCode : undefined);
  if ('retryAfterMs' in issued) {
    return Response.json({ error: 'A code was just sent.', retryAfterMs: issued.retryAfterMs }, { status: 429 });
  }
  if (isReviewPhone) return Response.json({ sent: true });
  if (isDevFallback) {
    // Local development without Eskiz: show the code instead of texting it
    return Response.json({ sent: true, devCode: issued.code });
  }
  try {
    await sendSms(phone, smsText(issued.code));
  } catch (error) {
    console.error('SMS send failed', error instanceof Error ? error.message : 'unknown error');
    return Response.json({ error: 'The SMS could not be sent, try again shortly.' }, { status: 502 });
  }
  return Response.json({ sent: true });
}
