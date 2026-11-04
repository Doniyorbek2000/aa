import { after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import * as schema from './schema.ts';

// Runs the real SQL migrations on an in-memory Postgres (PGlite), so a broken migration fails here
const open: PGlite[] = [];

async function freshDb() {
  const client = new PGlite();
  open.push(client);
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: path.join(import.meta.dirname, '../../drizzle') });
  return db;
}

describe('database schema', () => {
  after(async () => {
    await Promise.all(open.map((client) => client.close()));
  });

  it('migrates and links a store to its owner, plan and garments', async () => {
    const db = await freshDb();
    const [owner] = await db.insert(schema.users).values({ phone: '+998901234567' }).returning();
    const [plan] = await db.insert(schema.plans).values({ name: 'Start', monthlySeconds: 6000, priceUzs: 990_000 }).returning();
    assert.ok(owner && plan);
    const [store] = await db
      .insert(schema.stores)
      .values({ name: 'Shop', ownerId: owner.id, planId: plan.id, widgetKey: 'wk_test' })
      .returning();
    assert.ok(store);
    await db.insert(schema.garments).values({ storeId: store.id, title: 'Hoodie', imageUrl: 'https://x.uz/h.png' });

    assert.equal(store.usedSeconds, 0);
    assert.equal(store.status, 'active');
    assert.equal(owner.role, 'user');
    const items = await db.select().from(schema.garments).where(eq(schema.garments.storeId, store.id));
    assert.equal(items.length, 1);
  });

  it('keeps phone numbers and widget keys unique', async () => {
    const db = await freshDb();
    await db.insert(schema.users).values({ phone: '+998901111111' });
    await assert.rejects(db.insert(schema.users).values({ phone: '+998901111111' }));
  });
});
