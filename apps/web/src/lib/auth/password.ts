/**
 * Admin login and password: salted scrypt hashes, checked in constant time. Stored as
 * "scrypt$N$r$p$salt$hash" (base64url) so the cost can be raised later without breaking old hashes.
 */
import { randomBytes, scrypt as scryptCb, timingSafeEqual, type ScryptOptions } from 'node:crypto';
import { eq } from 'drizzle-orm';
import * as schema from '../../db/schema.ts';
import type { AuthDb, User } from './store.ts';

const COST = { N: 16_384, r: 8, p: 1 } as const;
const KEY_BYTES = 64;
const SALT_BYTES = 16;
export const MIN_PASSWORD = 8;
const MAX_PASSWORD = 128;
const LOGIN = /^[a-z0-9._-]{3,40}$/;

function scrypt(password: string, salt: Buffer, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scryptCb(password, salt, KEY_BYTES, options, (error, key) => (error ? reject(error) : resolve(key)))
  );
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const key = await scrypt(password, salt, COST);
  return ['scrypt', COST.N, COST.r, COST.p, salt.toString('base64url'), key.toString('base64url')].join('$');
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [kind, n, r, p, salt, hash] = stored.split('$');
  if (kind !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'base64url');
  const key = await scrypt(password, Buffer.from(salt, 'base64url'), { N: Number(n), r: Number(r), p: Number(p) });
  return key.length === expected.length && timingSafeEqual(key, expected);
}

export function normaliseLogin(raw: string): string {
  return raw.trim().toLowerCase();
}

export type CredentialProblem = 'login' | 'length' | 'same';

/** Why these would make a weak or invalid admin sign-in, or null when they are fine. */
export function credentialProblem(login: string, password: string): CredentialProblem | null {
  if (!LOGIN.test(login)) return 'login';
  if (password.length < MIN_PASSWORD || password.length > MAX_PASSWORD) return 'length';
  if (password.toLowerCase() === login) return 'same';
  return null;
}

// Spent on unknown logins too, so response time does not reveal which logins exist
const DUMMY_HASH = 'scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA$' + 'A'.repeat(86);

/** The admin these credentials belong to, or null. */
export async function userForCredentials(db: AuthDb, rawLogin: string, password: string): Promise<User | null> {
  const login = normaliseLogin(rawLogin);
  const [row] = await db
    .select({ user: schema.users, hash: schema.credentials.passwordHash })
    .from(schema.credentials)
    .innerJoin(schema.users, eq(schema.users.id, schema.credentials.userId))
    .where(eq(schema.credentials.login, login));
  const isMatch = await verifyPassword(password, row?.hash ?? DUMMY_HASH);
  return row && isMatch && row.user.role === 'admin' ? row.user : null;
}

export async function hasCredentials(db: AuthDb, userId: string): Promise<{ login: string } | null> {
  const [row] = await db.select({ login: schema.credentials.login }).from(schema.credentials).where(eq(schema.credentials.userId, userId));
  return row ?? null;
}

export type SetCredentialsResult = 'ok' | 'taken' | 'wrong-current';

/**
 * Sets or replaces a user's login and password. Replacing needs the current password, so a
 * borrowed signed-in browser cannot lock the owner out.
 */
export async function setCredentials(
  db: AuthDb,
  userId: string,
  rawLogin: string,
  password: string,
  currentPassword: string,
  now: Date
): Promise<SetCredentialsResult> {
  const login = normaliseLogin(rawLogin);
  const [existing] = await db.select().from(schema.credentials).where(eq(schema.credentials.userId, userId));
  if (existing && !(await verifyPassword(currentPassword, existing.passwordHash))) return 'wrong-current';
  const [other] = await db.select({ userId: schema.credentials.userId }).from(schema.credentials).where(eq(schema.credentials.login, login));
  if (other && other.userId !== userId) return 'taken';
  const passwordHash = await hashPassword(password);
  await db
    .insert(schema.credentials)
    .values({ userId, login, passwordHash, updatedAt: now })
    .onConflictDoUpdate({ target: schema.credentials.userId, set: { login, passwordHash, updatedAt: now } });
  return 'ok';
}
