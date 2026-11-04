import { after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import * as schema from '../db/schema.ts';
import { BILLING_PERIOD_MS, chargeStoreSession, refundStoreSeconds } from './billing.ts';

const open: PGlite[] = [];
after(async () => {
  await Promise.all(open.map((client) => client.close()));
});

const t0 = new Date('2026-11-01T00:00:00Z');

/** A store on a 5-minute plan. */
async function setup(overrides: Partial<typeof schema.stores.$inferInsert> = {}) {
  const client = new PGlite();
  open.push(client);
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: path.join(import.meta.dirname, '../../drizzle') });
  const [owner] = await db.insert(schema.users).values({ phone: '+998901234567' }).returning();
  const [plan] = await db.insert(schema.plans).values({ name: 'Test', monthlySeconds: 300, priceUzs: 1 }).returning();
  assert.ok(owner && plan);
  const [store] = await db
    .insert(schema.stores)
    .values({ name: 'Shop', ownerId: owner.id, planId: plan.id, widgetKey: 'wk_0123456789abcdef', periodStart: t0, ...overrides })
    .returning();
  assert.ok(store);
  const used = async () => (await db.select().from(schema.stores).where(eq(schema.stores.id, store.id)))[0]?.usedSeconds;
  return { db, store, used };
}

describe('chargeStoreSession', () => {
  it('reserves the session from the plan and grants the rest near the end', async () => {
    const { db, store, used } = await setup();
    assert.deepEqual(await chargeStoreSession(db, 'wk_0123456789abcdef', 180, t0), { ok: true, storeId: store.id, seconds: 180 });
    assert.equal(await used(), 180);
    const second = await chargeStoreSession(db, 'wk_0123456789abcdef', 180, t0);
    assert.ok(second.ok && second.seconds === 120);
    assert.equal(await used(), 300);
    assert.deepEqual(await chargeStoreSession(db, 'wk_0123456789abcdef', 180, t0), { ok: false, reason: 'limit' });
  });

  it('ends the plan after its 30 days instead of renewing it unpaid', async () => {
    const { db, used } = await setup();
    const expired = new Date(t0.getTime() + BILLING_PERIOD_MS);
    assert.deepEqual(await chargeStoreSession(db, 'wk_0123456789abcdef', 60, expired), { ok: false, reason: 'limit' });
    assert.equal(await used(), 0);
  });

  it('keeps spending bought top-ups after the plan month ends', async () => {
    const { db, store } = await setup({ extraSeconds: 100 });
    const charge = await chargeStoreSession(db, 'wk_0123456789abcdef', 60, new Date(t0.getTime() + BILLING_PERIOD_MS));
    assert.ok(charge.ok && charge.seconds === 60);
    const [after] = await db.select().from(schema.stores).where(eq(schema.stores.id, store.id));
    assert.equal(after?.extraSeconds, 40);
  });

  it('still serves a paid plan after the admin stops selling it', async () => {
    const { db } = await setup();
    await db.update(schema.plans).set({ isActive: false });
    const charge = await chargeStoreSession(db, 'wk_0123456789abcdef', 60, t0);
    assert.ok(charge.ok && charge.seconds === 60);
  });

  it('refuses unknown keys, paused stores and stores without a plan', async () => {
    const paused = await setup({ status: 'paused' });
    assert.deepEqual(await chargeStoreSession(paused.db, 'wk_0123456789abcdef', 60, t0), { ok: false, reason: 'paused' });
    assert.deepEqual(await chargeStoreSession(paused.db, 'wk_nope_nope_nope_nope', 60, t0), { ok: false, reason: 'unknown' });
    const noPlan = await setup({ planId: null });
    assert.deepEqual(await chargeStoreSession(noPlan.db, 'wk_0123456789abcdef', 60, t0), { ok: false, reason: 'no-plan' });
  });

  it('spends bought top-up seconds after the plan, and works on top-ups alone', async () => {
    const { db, store, used } = await setup({ usedSeconds: 290, extraSeconds: 100 });
    const charge = await chargeStoreSession(db, 'wk_0123456789abcdef', 60, t0);
    assert.ok(charge.ok && charge.seconds === 60);
    const [after] = await db.select().from(schema.stores).where(eq(schema.stores.id, store.id));
    assert.equal(await used(), 300);
    assert.equal(after?.extraSeconds, 50);

    const packOnly = await setup({ planId: null, extraSeconds: 45 });
    const packCharge = await chargeStoreSession(packOnly.db, 'wk_0123456789abcdef', 180, t0);
    assert.ok(packCharge.ok && packCharge.seconds === 45);
  });

  it('gives seconds back for a session that never started', async () => {
    const { db, store, used } = await setup();
    await chargeStoreSession(db, 'wk_0123456789abcdef', 180, t0);
    await refundStoreSeconds(db, store.id, 180);
    assert.equal(await used(), 0);
  });
});
