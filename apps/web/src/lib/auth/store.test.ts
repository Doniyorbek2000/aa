import { after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import * as schema from '../../db/schema.ts';
import { maskPhone, normaliseUzPhone } from './phone.ts';
import {
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_MS,
  OTP_TTL_MS,
  checkOtp,
  createSession,
  deleteSession,
  envList,
  issueOtp,
  userForGoogle,
  userForPhone,
  userForSession,
} from './store.ts';
import { generateOtp, safeEqualHex, sha256Hex } from './tokens.ts';

const open: PGlite[] = [];
async function freshDb() {
  const client = new PGlite();
  open.push(client);
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: path.join(import.meta.dirname, '../../../drizzle') });
  return db;
}
after(async () => {
  await Promise.all(open.map((client) => client.close()));
});

const PHONE = '+998901234567';
const t0 = new Date('2026-11-03T10:00:00Z');
const at = (ms: number) => new Date(t0.getTime() + ms);

describe('phone numbers', () => {
  it('normalises Uzbek mobile formats and rejects the rest', () => {
    assert.equal(normaliseUzPhone('+998 (90) 123-45-67'), PHONE);
    assert.equal(normaliseUzPhone('998901234567'), PHONE);
    assert.equal(normaliseUzPhone('90 123 45 67'), PHONE);
    for (const bad of ['+7 900 123 45 67', '12345', '+99890123456a', '']) assert.equal(normaliseUzPhone(bad), null);
  });

  it('masks the middle digits', () => {
    assert.equal(maskPhone(PHONE), '+998 90 *** ** 67');
  });
});

describe('tokens', () => {
  it('makes six-digit codes and compares digests safely', () => {
    assert.match(generateOtp(), /^\d{6}$/);
    assert.equal(safeEqualHex(sha256Hex('a'), sha256Hex('a')), true);
    assert.equal(safeEqualHex(sha256Hex('a'), sha256Hex('b')), false);
    assert.equal(safeEqualHex('', ''), false);
  });
});

describe('SMS codes', () => {
  it('accepts the right code once', async () => {
    const db = await freshDb();
    const issued = await issueOtp(db, PHONE, t0);
    assert.ok('code' in issued);
    assert.equal(await checkOtp(db, PHONE, issued.code, at(1000)), 'ok');
    assert.equal(await checkOtp(db, PHONE, issued.code, at(2000)), 'expired');
  });

  it('accepts the fixed code of the store-review number', async () => {
    const db = await freshDb();
    assert.deepEqual(await issueOtp(db, PHONE, t0, '246810'), { code: '246810' });
    assert.equal(await checkOtp(db, PHONE, '246810', at(1000)), 'ok');
  });

  it('throttles resends to one a minute', async () => {
    const db = await freshDb();
    await issueOtp(db, PHONE, t0);
    const again = await issueOtp(db, PHONE, at(10_000));
    assert.ok('retryAfterMs' in again && again.retryAfterMs === OTP_RESEND_MS - 10_000);
    assert.ok('code' in (await issueOtp(db, PHONE, at(OTP_RESEND_MS))));
  });

  it('locks after five wrong guesses, even for the right code', async () => {
    const db = await freshDb();
    const issued = await issueOtp(db, PHONE, t0);
    assert.ok('code' in issued);
    const wrong = issued.code === '000000' ? '111111' : '000000';
    for (let i = 1; i < OTP_MAX_ATTEMPTS; i++) assert.equal(await checkOtp(db, PHONE, wrong, at(i)), 'invalid');
    assert.equal(await checkOtp(db, PHONE, wrong, at(10)), 'locked');
    assert.equal(await checkOtp(db, PHONE, issued.code, at(11)), 'locked');
  });

  it('expires codes after five minutes', async () => {
    const db = await freshDb();
    const issued = await issueOtp(db, PHONE, t0);
    assert.ok('code' in issued);
    assert.equal(await checkOtp(db, PHONE, issued.code, at(OTP_TTL_MS)), 'expired');
  });
});

describe('users and sessions', () => {
  it('creates a phone user once and makes ADMIN_PHONES admins', async () => {
    const db = await freshDb();
    const first = await userForPhone(db, PHONE, []);
    const again = await userForPhone(db, PHONE, envList(` ${PHONE} ,+998900000000`));
    assert.equal(first.id, again.id);
    assert.equal(first.role, 'user');
    assert.equal(again.role, 'admin');
  });

  it('links a Google account by its subject and keeps one user per email', async () => {
    const db = await freshDb();
    const a = await userForGoogle(db, { sub: 'g1', email: 'Shop@Mail.uz', name: 'Shop' }, []);
    const b = await userForGoogle(db, { sub: 'g1', email: 'shop@mail.uz', name: null }, ['shop@mail.uz']);
    assert.equal(a.id, b.id);
    assert.equal(b.email, 'shop@mail.uz');
    assert.equal(b.role, 'admin');
  });

  it('resolves a session until it expires or is deleted', async () => {
    const db = await freshDb();
    const user = await userForPhone(db, PHONE, []);
    const { token, expiresAt } = await createSession(db, user.id, t0);
    assert.equal((await userForSession(db, token, at(1000)))?.id, user.id);
    assert.equal(await userForSession(db, token, expiresAt), null);
    assert.equal(await userForSession(db, 'not-a-token', at(1000)), null);
    await deleteSession(db, token);
    assert.equal(await userForSession(db, token, at(1000)), null);
  });
});
