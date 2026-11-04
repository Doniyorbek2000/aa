import { after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import * as schema from '../../db/schema.ts';
import { credentialProblem, hashPassword, setCredentials, userForCredentials, verifyPassword } from './password.ts';

const open: PGlite[] = [];
after(async () => {
  await Promise.all(open.map((client) => client.close()));
});

const now = new Date('2026-11-04T00:00:00Z');

async function setup() {
  const client = new PGlite();
  open.push(client);
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: path.join(import.meta.dirname, '../../../drizzle') });
  const [admin] = await db.insert(schema.users).values({ phone: '+998901234567', role: 'admin' }).returning();
  const [user] = await db.insert(schema.users).values({ phone: '+998901234568' }).returning();
  assert.ok(admin && user);
  return { db, admin, user };
}

describe('password hashing', () => {
  it('verifies the right password and rejects others', async () => {
    const stored = await hashPassword('tog‘-daryo-2026');
    assert.match(stored, /^scrypt\$16384\$8\$1\$/);
    assert.equal(await verifyPassword('tog‘-daryo-2026', stored), true);
    assert.equal(await verifyPassword('tog‘-daryo-2027', stored), false);
    assert.equal(await verifyPassword('x', 'not-a-hash'), false);
  });

  it('salts every hash, so equal passwords look different', async () => {
    assert.notEqual(await hashPassword('same-password'), await hashPassword('same-password'));
  });

  it('refuses bad logins, short passwords and a password equal to the login', () => {
    assert.equal(credentialProblem('admin', 'long-enough-1'), null);
    assert.ok(credentialProblem('a b', 'long-enough-1'));
    assert.ok(credentialProblem('admin', 'short'));
    assert.ok(credentialProblem('949392250', '949392250'));
  });
});

describe('admin credentials', () => {
  it('signs an admin in with login and password, case-insensitively for the login', async () => {
    const { db, admin } = await setup();
    assert.equal(await setCredentials(db, admin.id, 'Boss', 'kuchli-parol-1', '', now), 'ok');
    assert.equal((await userForCredentials(db, 'boss', 'kuchli-parol-1'))?.id, admin.id);
    assert.equal(await userForCredentials(db, 'boss', 'notogri-parol'), null);
    assert.equal(await userForCredentials(db, 'nobody', 'kuchli-parol-1'), null);
  });

  it('needs the current password to change it', async () => {
    const { db, admin } = await setup();
    await setCredentials(db, admin.id, 'boss', 'kuchli-parol-1', '', now);
    assert.equal(await setCredentials(db, admin.id, 'boss', 'yangi-parol-2', 'notogri', now), 'wrong-current');
    assert.equal(await setCredentials(db, admin.id, 'boss', 'yangi-parol-2', 'kuchli-parol-1', now), 'ok');
    assert.equal(await userForCredentials(db, 'boss', 'kuchli-parol-1'), null);
    assert.ok(await userForCredentials(db, 'boss', 'yangi-parol-2'));
  });

  it('keeps logins unique and never signs in someone who is not an admin', async () => {
    const { db, admin, user } = await setup();
    await setCredentials(db, admin.id, 'boss', 'kuchli-parol-1', '', now);
    assert.equal(await setCredentials(db, user.id, 'boss', 'boshqa-parol-1', '', now), 'taken');
    await setCredentials(db, user.id, 'oddiy', 'boshqa-parol-1', '', now);
    assert.equal(await userForCredentials(db, 'oddiy', 'boshqa-parol-1'), null);
  });
});
