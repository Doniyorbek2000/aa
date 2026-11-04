import { and, eq } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { userFromRequest } from '@/lib/auth/session';
import { clientIp, createRateLimiter } from '@/lib/rate-limit';

const RECEIPT_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
const MAX_RECEIPT_BYTES = 5_000_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const allowIp = createRateLimiter(10, 60 * 60_000);
const fail = (status: number, error: string) => Response.json({ error }, { status });

/**
 * A card transfer reported with its receipt: a shop owner paying for a plan or a shop pack (storeId
 * required), or anyone signed in buying seconds for their own account (a pack for people, no storeId).
 * Multipart form: storeId?, kind (plan | pack), itemId, receipt. Nothing is granted until an admin approves.
 */
export async function POST(request: Request) {
  const user = await userFromRequest(request);
  if (!user) return fail(401, 'Sign in first.');
  if (!allowIp(clientIp(request), Date.now())) return fail(429, 'Too many payments sent, try again later.');

  const form = await request.formData().catch(() => null);
  const storeId = form?.get('storeId');
  const kind = form?.get('kind');
  const itemId = form?.get('itemId');
  const receipt = form?.get('receipt');
  if (typeof itemId !== 'string' || !UUID.test(itemId)) return fail(400, 'Choose what you are paying for.');
  if (kind !== 'plan' && kind !== 'pack') return fail(400, 'Choose a plan or a pack.');
  if (!(receipt instanceof File) || !RECEIPT_TYPES.has(receipt.type) || receipt.size === 0 || receipt.size > MAX_RECEIPT_BYTES) {
    return fail(400, 'Attach the receipt as an image or PDF (up to 5 MB).');
  }

  const db = getDb();
  const item =
    kind === 'plan'
      ? (await db.select().from(schema.plans).where(and(eq(schema.plans.id, itemId), eq(schema.plans.isActive, true))))[0]
      : (await db.select().from(schema.packs).where(and(eq(schema.packs.id, itemId), eq(schema.packs.isActive, true))))[0];
  if (!item) return fail(404, 'This plan or pack is no longer offered.');
  // People buy for their own account; plans and shop packs need a store the payer owns
  const isPersonal = 'audience' in item && item.audience === 'user';
  let store: { id: string } | undefined;
  if (!isPersonal) {
    if (typeof storeId !== 'string' || !UUID.test(storeId)) return fail(400, 'Choose the store.');
    [store] = await db
      .select({ id: schema.stores.id })
      .from(schema.stores)
      .where(and(eq(schema.stores.id, storeId), eq(schema.stores.ownerId, user.id)));
    if (!store) return fail(404, 'Store not found.');
  }
  const seconds = 'monthlySeconds' in item ? item.monthlySeconds : item.seconds;

  const [payment] = await db
    .insert(schema.payments)
    .values({
      storeId: store?.id ?? null,
      userId: user.id,
      kind,
      planId: kind === 'plan' ? item.id : null,
      packId: kind === 'pack' ? item.id : null,
      title: item.name,
      seconds,
      amountUzs: item.priceUzs,
      receipt: new Uint8Array(await receipt.arrayBuffer()),
      receiptType: receipt.type,
    })
    .returning({ id: schema.payments.id });
  return Response.json({ id: payment?.id, status: 'pending' });
}
