/**
 * In-app purchases of live AI seconds (consumables) from Google Play and the App Store. The app
 * sends what the store handed it; the server asks the store itself whether the purchase is real,
 * then credits the buyer once. Product ids carry their seconds: "a12.seconds.600" adds 600.
 */
import { createSign, sign as signData } from 'node:crypto';
import { eq, sql } from 'drizzle-orm';
import * as schema from '../db/schema.ts';
import type { AuthDb } from './auth/store.ts';

export const APP_ID = process.env.IAP_APP_ID || 'ai.a12.anywear';
const PRODUCT = /^a12\.seconds\.(\d{2,6})$/;
const DEFAULT_PRODUCTS = 'a12.seconds.600,a12.seconds.1800,a12.seconds.7200';
const TIMEOUT_MS = 15_000;

export type IapStore = 'google' | 'apple';

/** Seconds a product id stands for, or null when it is not one of ours. */
export function productSeconds(productId: string): number | null {
  const match = PRODUCT.exec(productId);
  return match ? Number(match[1]) : null;
}

/** Product ids the app should offer, from IAP_PRODUCT_IDS. */
export function offeredProducts(raw: string | undefined = process.env.IAP_PRODUCT_IDS): string[] {
  return (raw || DEFAULT_PRODUCTS)
    .split(',')
    .map((id) => id.trim())
    .filter((id) => productSeconds(id) !== null);
}

const b64url = (value: string | Buffer) => Buffer.from(value).toString('base64url');

function jwt(header: object, claims: object, signer: (input: string) => Buffer): string {
  const input = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(claims))}`;
  return `${input}.${b64url(signer(input))}`;
}

/** Payload of a JWS without checking its signature; only for JWS fetched straight from Apple over TLS. */
export function jwsPayload(jws: string): Record<string, unknown> | null {
  const part = jws.split('.')[1];
  if (!part) return null;
  try {
    return JSON.parse(Buffer.from(part, 'base64url').toString('utf8')) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export type Verified = { transactionId: string; productId: string };

// ── Google Play ──────────────────────────────────────────────────────────────

type ServiceAccount = { client_email: string; private_key: string };
let googleToken: { value: string; until: number } | null = null;

function serviceAccount(): ServiceAccount | null {
  const raw = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8')) as ServiceAccount;
    return parsed.client_email && parsed.private_key ? parsed : null;
  } catch {
    return null;
  }
}

async function googleAccessToken(account: ServiceAccount): Promise<string> {
  if (googleToken && googleToken.until > Date.now()) return googleToken.value;
  const now = Math.floor(Date.now() / 1000);
  const assertion = jwt(
    { alg: 'RS256', typ: 'JWT' },
    { iss: account.client_email, scope: 'https://www.googleapis.com/auth/androidpublisher', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 },
    (input) => createSign('RSA-SHA256').update(input).sign(account.private_key)
  );
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const data = (await res.json().catch(() => ({}))) as { access_token?: string; expires_in?: number };
  if (!res.ok || !data.access_token) throw new Error(`Google auth failed (${res.status})`);
  googleToken = { value: data.access_token, until: Date.now() + ((data.expires_in ?? 3600) - 300) * 1000 };
  return data.access_token;
}

/** Why a Google Play product purchase must not be credited, or null when it is paid and ours. */
export function googlePurchaseProblem(purchase: { purchaseState?: number; acknowledgementState?: number } | null): string | null {
  if (!purchase) return 'not-found';
  // 0 purchased, 1 cancelled, 2 pending (cash payments not yet made)
  if (purchase.purchaseState !== 0) return purchase.purchaseState === 2 ? 'pending' : 'not-paid';
  return null;
}

export async function verifyGooglePurchase(productId: string, purchaseToken: string): Promise<Verified> {
  const account = serviceAccount();
  if (!account) throw new Error('Google Play purchases are not configured');
  const token = await googleAccessToken(account);
  const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(APP_ID)}/purchases/products/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(TIMEOUT_MS) });
  const purchase = res.ok ? ((await res.json()) as { purchaseState?: number; orderId?: string }) : null;
  const problem = googlePurchaseProblem(purchase);
  if (problem) throw new IapError(problem);
  // Consumed on the server too, so it can be bought again even if the app never finishes it
  await fetch(`${url}:consume`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(TIMEOUT_MS) }).catch(() => {});
  return { transactionId: purchase?.orderId || purchaseToken, productId };
}

// ── App Store ────────────────────────────────────────────────────────────────

function appleKey(): { keyId: string; issuerId: string; privateKey: string } | null {
  const keyId = process.env.APPLE_IAP_KEY_ID;
  const issuerId = process.env.APPLE_IAP_ISSUER_ID;
  const raw = process.env.APPLE_IAP_PRIVATE_KEY;
  if (!keyId || !issuerId || !raw) return null;
  const privateKey = raw.includes('BEGIN PRIVATE KEY') ? raw.replace(/\\n/g, '\n') : Buffer.from(raw, 'base64').toString('utf8');
  return { keyId, issuerId, privateKey };
}

/** Why an App Store transaction must not be credited, or null when it is a paid consumable of ours. */
export function appleTransactionProblem(tx: Record<string, unknown> | null, productId: string): string | null {
  if (!tx) return 'not-found';
  if (tx.bundleId !== APP_ID) return 'wrong-app';
  if (tx.productId !== productId) return 'wrong-product';
  if (tx.type !== 'Consumable') return 'wrong-type';
  if (tx.revocationDate) return 'refunded';
  return null;
}

export async function verifyAppleTransaction(productId: string, transactionId: string): Promise<Verified> {
  const key = appleKey();
  if (!key) throw new Error('App Store purchases are not configured');
  if (!/^\d{1,32}$/.test(transactionId)) throw new IapError('not-found');
  const now = Math.floor(Date.now() / 1000);
  const token = jwt(
    { alg: 'ES256', kid: key.keyId, typ: 'JWT' },
    { iss: key.issuerId, iat: now, exp: now + 600, aud: 'appstoreconnect-v1', bid: APP_ID },
    (input) => signData('sha256', Buffer.from(input), { key: key.privateKey, dsaEncoding: 'ieee-p1363' })
  );
  // Production first; TestFlight and review purchases live in the sandbox
  for (const host of ['api.storekit.itunes.apple.com', 'api.storekit-sandbox.itunes.apple.com']) {
    const res = await fetch(`https://${host}/inApps/v1/transactions/${transactionId}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (res.status === 404) continue;
    if (!res.ok) throw new Error(`App Store lookup failed (${res.status})`);
    const { signedTransactionInfo } = (await res.json()) as { signedTransactionInfo?: string };
    const tx = signedTransactionInfo ? jwsPayload(signedTransactionInfo) : null;
    const problem = appleTransactionProblem(tx, productId);
    if (problem) throw new IapError(problem);
    return { transactionId: String(tx?.transactionId ?? transactionId), productId };
  }
  throw new IapError('not-found');
}

export class IapError extends Error {}

/**
 * Adds a verified purchase's seconds to the buyer, once. Returns false when this transaction was
 * already credited (a replay), true when the seconds were added now.
 */
export async function creditPurchase(db: AuthDb, store: IapStore, verified: Verified, userId: string): Promise<boolean> {
  const seconds = productSeconds(verified.productId);
  if (seconds === null) throw new IapError('unknown-product');
  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(schema.iapPurchases)
      .values({ store, transactionId: verified.transactionId, userId, productId: verified.productId, seconds })
      .onConflictDoNothing()
      .returning({ id: schema.iapPurchases.id });
    if (!row) return false;
    await tx
      .update(schema.users)
      .set({ secondsBalance: sql`${schema.users.secondsBalance} + ${seconds}` })
      .where(eq(schema.users.id, userId));
    return true;
  });
}
