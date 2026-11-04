import { after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import * as schema from '../db/schema.ts';
import { DEFAULT_USD_RATE, approvePayment, formatCard, getSettings, rejectPayment, saveSettings, usdRate } from './payments.ts';

const open: PGlite[] = [];
after(async () => {
  await Promise.all(open.map((client) => client.close()));
});

const t0 = new Date('2026-11-01T00:00:00Z');
const t1 = new Date('2026-11-10T00:00:00Z');

async function setup() {
  const client = new PGlite();
  open.push(client);
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: path.join(import.meta.dirname, '../../drizzle') });
  const [owner] = await db.insert(schema.users).values({ phone: '+998901234567' }).returning();
  const [plan] = await db.insert(schema.plans).values({ name: 'Biznes', monthlySeconds: 30_000, priceUzs: 5_000_000 }).returning();
  assert.ok(owner && plan);
  const [store] = await db
    .insert(schema.stores)
    .values({ name: 'Shop', ownerId: owner.id, widgetKey: 'wk_0123456789abcdef', usedSeconds: 90, periodStart: t0, extraSeconds: 10 })
    .returning();
  assert.ok(store);
  const pay = async (values: Partial<typeof schema.payments.$inferInsert>) => {
    const [row] = await db
      .insert(schema.payments)
      .values({ storeId: store.id, userId: owner.id, kind: 'pack', title: 'x', seconds: 600, amountUzs: 100_000, receipt: new Uint8Array([1, 2]), receiptType: 'image/png', ...values })
      .returning();
    assert.ok(row);
    return row;
  };
  const storeNow = async () => (await db.select().from(schema.stores).where(eq(schema.stores.id, store.id)))[0];
  return { db, plan, pay, storeNow };
}

describe('payments', () => {
  it('approving a plan starts a fresh month on it', async () => {
    const { db, plan, pay, storeNow } = await setup();
    const payment = await pay({ kind: 'plan', planId: plan.id, seconds: 30_000 });
    assert.equal(await approvePayment(db, payment.id, t1), true);
    const store = await storeNow();
    assert.equal(store?.planId, plan.id);
    assert.equal(store?.usedSeconds, 0);
    assert.equal(store?.periodStart.toISOString(), t1.toISOString());
  });

  it('approving a plan leaves a store the admin paused paused', async () => {
    const { db, plan, pay, storeNow } = await setup();
    await db.update(schema.stores).set({ status: 'paused' });
    const payment = await pay({ kind: 'plan', planId: plan.id, seconds: 30_000 });
    assert.equal(await approvePayment(db, payment.id, t1), true);
    const store = await storeNow();
    assert.equal(store?.status, 'paused');
    assert.equal(store?.planId, plan.id);
  });

  it('approving a pack adds its minutes once, however many times it is clicked', async () => {
    const { db, pay, storeNow } = await setup();
    const payment = await pay({ kind: 'pack', seconds: 600 });
    assert.equal(await approvePayment(db, payment.id, t1), true);
    assert.equal(await approvePayment(db, payment.id, t1), false);
    assert.equal((await storeNow())?.extraSeconds, 10 + 600);
  });

  it('a top-up without a store lands on the payer account balance', async () => {
    const { db, pay, storeNow } = await setup();
    const payment = await pay({ storeId: null, kind: 'pack', seconds: 600 });
    assert.equal(await approvePayment(db, payment.id, t1), true);
    const [owner] = await db.select().from(schema.users).where(eq(schema.users.id, payment.userId));
    assert.equal(owner?.secondsBalance, 600);
    assert.equal((await storeNow())?.extraSeconds, 10);
  });

  it('a rejected payment grants nothing and cannot be approved later', async () => {
    const { db, pay, storeNow } = await setup();
    const payment = await pay({ kind: 'pack', seconds: 600 });
    assert.equal(await rejectPayment(db, payment.id, 'Chek topilmadi', t1), true);
    assert.equal(await approvePayment(db, payment.id, t1), false);
    assert.equal((await storeNow())?.extraSeconds, 10);
  });
});

describe('payment settings', () => {
  it('stores the card and falls back to a default dollar rate', async () => {
    const { db } = await setup();
    assert.equal(usdRate(await getSettings(db)), DEFAULT_USD_RATE);
    await saveSettings(db, { cardNumber: '8600123412341234', cardHolder: 'ALI VALIYEV', usdRate: '12650' });
    await saveSettings(db, { usdRate: '12700' });
    const settings = await getSettings(db);
    assert.equal(settings.cardHolder, 'ALI VALIYEV');
    assert.equal(usdRate(settings), 12_700);
    assert.equal(formatCard(settings.cardNumber), '8600 1234 1234 1234');
  });
});
