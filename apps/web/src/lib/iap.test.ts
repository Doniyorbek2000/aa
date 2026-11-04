import { after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import * as schema from '../db/schema.ts';
import { appleTransactionProblem, creditPurchase, googlePurchaseProblem, jwsPayload, offeredProducts, productSeconds } from './iap.ts';

const open: PGlite[] = [];
after(async () => {
  await Promise.all(open.map((client) => client.close()));
});

describe('in-app products', () => {
  it('reads the seconds from our product ids only', () => {
    assert.equal(productSeconds('a12.seconds.600'), 600);
    assert.equal(productSeconds('a12.seconds.1'), null);
    assert.equal(productSeconds('com.other.coins.600'), null);
    assert.deepEqual(offeredProducts('a12.seconds.600, junk ,a12.seconds.1800'), ['a12.seconds.600', 'a12.seconds.1800']);
  });

  it('credits only paid Google purchases', () => {
    assert.equal(googlePurchaseProblem({ purchaseState: 0 }), null);
    assert.equal(googlePurchaseProblem({ purchaseState: 2 }), 'pending');
    assert.equal(googlePurchaseProblem({ purchaseState: 1 }), 'not-paid');
    assert.equal(googlePurchaseProblem(null), 'not-found');
  });

  it('credits only our App Store consumable that was not refunded', () => {
    const tx = { bundleId: 'ai.a12.anywear', productId: 'a12.seconds.600', type: 'Consumable', transactionId: '2000001' };
    assert.equal(appleTransactionProblem(tx, 'a12.seconds.600'), null);
    assert.equal(appleTransactionProblem({ ...tx, bundleId: 'com.evil' }, 'a12.seconds.600'), 'wrong-app');
    assert.equal(appleTransactionProblem(tx, 'a12.seconds.7200'), 'wrong-product');
    assert.equal(appleTransactionProblem({ ...tx, revocationDate: 1 }, 'a12.seconds.600'), 'refunded');
  });

  it('decodes a JWS payload', () => {
    const jws = `x.${Buffer.from(JSON.stringify({ productId: 'a12.seconds.600' })).toString('base64url')}.y`;
    assert.deepEqual(jwsPayload(jws), { productId: 'a12.seconds.600' });
    assert.equal(jwsPayload('bad'), null);
  });

  it('adds the seconds once, however often the same purchase is replayed', async () => {
    const client = new PGlite();
    open.push(client);
    const db = drizzle(client, { schema });
    await migrate(db, { migrationsFolder: path.join(import.meta.dirname, '../../drizzle') });
    const [user] = await db.insert(schema.users).values({ phone: '+998901234567' }).returning();
    assert.ok(user);
    const purchase = { transactionId: 'GPA.1234', productId: 'a12.seconds.600' };
    assert.equal(await creditPurchase(db, 'google', purchase, user.id), true);
    assert.equal(await creditPurchase(db, 'google', purchase, user.id), false);
    assert.equal(await creditPurchase(db, 'apple', { ...purchase, transactionId: '2000001' }, user.id), true);
    const [after] = await db.select().from(schema.users).where(eq(schema.users.id, user.id));
    assert.equal(after?.secondsBalance, 1200);
  });
});
