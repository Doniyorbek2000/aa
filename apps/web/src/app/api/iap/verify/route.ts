import { getDb } from '@/db';
import { userFromRequest } from '@/lib/auth/session';
import { IapError, creditPurchase, productSeconds, verifyAppleTransaction, verifyGooglePurchase } from '@/lib/iap';
import { clientIp, createRateLimiter } from '@/lib/rate-limit';

const allowIp = createRateLimiter(30, 15 * 60_000);
const NO_STORE = { 'Cache-Control': 'no-store' };

/**
 * The app reports a store purchase; the store confirms it and the buyer gets the seconds once.
 * Body: { store: 'google' | 'apple', productId, purchaseToken (Google) | transactionId (Apple) }.
 * A replayed purchase answers ok without adding again, so the app can always finish it.
 */
export async function POST(request: Request) {
  const user = await userFromRequest(request);
  if (!user) return Response.json({ error: 'Sign in first.' }, { status: 401 });
  if (!allowIp(clientIp(request), Date.now())) return Response.json({ error: 'Too many requests.' }, { status: 429 });

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const store = body.store === 'google' || body.store === 'apple' ? body.store : null;
  const productId = typeof body.productId === 'string' ? body.productId : '';
  const proof = typeof (store === 'google' ? body.purchaseToken : body.transactionId) === 'string'
    ? String(store === 'google' ? body.purchaseToken : body.transactionId).slice(0, 4096)
    : '';
  if (!store || productSeconds(productId) === null || !proof) {
    return Response.json({ error: 'Unknown purchase.' }, { status: 400 });
  }

  try {
    const verified = store === 'google' ? await verifyGooglePurchase(productId, proof) : await verifyAppleTransaction(productId, proof);
    const isNew = await creditPurchase(getDb(), store, verified, user.id);
    return Response.json({ ok: true, credited: isNew }, { headers: NO_STORE });
  } catch (error) {
    if (error instanceof IapError) {
      // Pending (e.g. cash) purchases are credited later, when the app reports them again
      return Response.json({ error: 'The store did not confirm this purchase.', reason: error.message }, { status: 402, headers: NO_STORE });
    }
    console.error('IAP verification failed', error instanceof Error ? error.message : 'unknown error');
    return Response.json({ error: 'The purchase could not be checked right now.' }, { status: 502, headers: NO_STORE });
  }
}
