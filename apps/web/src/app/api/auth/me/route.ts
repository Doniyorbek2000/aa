import { eq } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { appSecondsUsedSince, freeAppSeconds } from '@/lib/billing';
import { SESSION_COOKIE, userFromRequest } from '@/lib/auth/session';
import { cleanLine } from '@/lib/studio';

const DAY_MS = 24 * 60 * 60_000;
const NO_STORE = { 'Cache-Control': 'no-store' };
const signedOut = () => Response.json({ user: null }, { status: 401, headers: NO_STORE });

/** The signed-in profile, with today's free live AI time left and the seconds the person bought. */
export async function GET(request: Request) {
  const user = await userFromRequest(request);
  if (!user) return signedOut();
  const used = await appSecondsUsedSince(getDb(), user.id, new Date(Date.now() - DAY_MS));
  const daily = freeAppSeconds(process.env.FREE_APP_SECONDS_PER_DAY);
  const { id, role, phone, email, name } = user;
  return Response.json(
    { user: { id, role, phone, email, name }, live: { dailySeconds: daily, secondsLeft: Math.max(0, daily - used), balanceSeconds: user.secondsBalance } },
    { headers: NO_STORE }
  );
}

/** Updates the display name. */
export async function PATCH(request: Request) {
  const user = await userFromRequest(request);
  if (!user) return signedOut();
  const body = (await request.json().catch(() => ({}))) as { name?: unknown };
  const name = cleanLine(body.name, 60);
  await getDb().update(schema.users).set({ name }).where(eq(schema.users.id, user.id));
  return Response.json({ ok: true, name }, { headers: NO_STORE });
}

/**
 * Deletes the account and its sessions (App Store and Play require in-app deletion). Shop
 * owners are refused: their store, plan and payment records must be closed with A12 first.
 */
export async function DELETE(request: Request) {
  const user = await userFromRequest(request);
  if (!user) return signedOut();
  const db = getDb();
  const [store] = await db.select({ id: schema.stores.id }).from(schema.stores).where(eq(schema.stores.ownerId, user.id));
  if (store) {
    return Response.json({ error: 'You own a store on A12; contact us to close it before deleting the account.', reason: 'store-owner' }, { status: 409 });
  }
  await db.delete(schema.users).where(eq(schema.users.id, user.id));
  const res = Response.json({ ok: true }, { headers: NO_STORE });
  res.headers.append('Set-Cookie', `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
  return res;
}
