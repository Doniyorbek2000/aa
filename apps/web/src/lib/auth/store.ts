/**
 * Database side of sign-in: SMS codes, users and sessions. Every function takes the database,
 * so tests run them on in-memory Postgres.
 */
import { and, eq, gt } from 'drizzle-orm';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import * as schema from '../../db/schema.ts';
import { generateOtp, randomToken, safeEqualHex, sha256Hex } from './tokens.ts';

export type AuthDb = PgDatabase<PgQueryResultHKT, typeof schema>;
export type User = typeof schema.users.$inferSelect;

export const OTP_TTL_MS = 5 * 60_000;
export const OTP_RESEND_MS = 60_000;
export const OTP_MAX_ATTEMPTS = 5;
export const SESSION_TTL_MS = 30 * 24 * 60 * 60_000;

const otpHash = (phone: string, code: string) => sha256Hex(`${phone}:${code}`);

/**
 * A new code for this phone, or how long to wait when one was sent less than a minute ago.
 * `fixedCode` is only for the store-review number, whose reviewers cannot receive an SMS.
 */
export async function issueOtp(
  db: AuthDb,
  phone: string,
  now: Date,
  fixedCode?: string
): Promise<{ code: string } | { retryAfterMs: number }> {
  const [existing] = await db.select().from(schema.otpCodes).where(eq(schema.otpCodes.phone, phone));
  const sinceLast = existing ? now.getTime() - existing.createdAt.getTime() : Infinity;
  if (sinceLast < OTP_RESEND_MS) return { retryAfterMs: OTP_RESEND_MS - sinceLast };

  const code = fixedCode ?? generateOtp();
  const row = { codeHash: otpHash(phone, code), attempts: 0, expiresAt: new Date(now.getTime() + OTP_TTL_MS), createdAt: now };
  await db
    .insert(schema.otpCodes)
    .values({ phone, ...row })
    .onConflictDoUpdate({ target: schema.otpCodes.phone, set: row });
  return { code };
}

export type OtpCheck = 'ok' | 'invalid' | 'expired' | 'locked';

/** Checks a code; five wrong guesses lock it until a new code is requested. */
export async function checkOtp(db: AuthDb, phone: string, code: string, now: Date): Promise<OtpCheck> {
  const [row] = await db.select().from(schema.otpCodes).where(eq(schema.otpCodes.phone, phone));
  if (!row || row.expiresAt <= now) return 'expired';
  if (row.attempts >= OTP_MAX_ATTEMPTS) return 'locked';
  if (!/^\d{6}$/.test(code) || !safeEqualHex(row.codeHash, otpHash(phone, code))) {
    const attempts = row.attempts + 1;
    await db.update(schema.otpCodes).set({ attempts }).where(eq(schema.otpCodes.phone, phone));
    return attempts >= OTP_MAX_ATTEMPTS ? 'locked' : 'invalid';
  }
  await db.delete(schema.otpCodes).where(eq(schema.otpCodes.phone, phone));
  return 'ok';
}

/** Comma-separated list from an env var, e.g. ADMIN_PHONES. */
export function envList(raw: string | undefined): string[] {
  return (raw ?? '').split(',').map((value) => value.trim().toLowerCase()).filter(Boolean);
}

/** The user for this phone, created on first sign-in; numbers in ADMIN_PHONES become admins. */
export async function userForPhone(db: AuthDb, phone: string, adminPhones: string[]): Promise<User> {
  const role = adminPhones.includes(phone) ? 'admin' : undefined;
  const [user] = await db
    .insert(schema.users)
    .values({ phone, ...(role ? { role } : {}) })
    .onConflictDoUpdate({ target: schema.users.phone, set: role ? { role } : { phone } })
    .returning();
  if (!user) throw new Error('User could not be saved');
  return user;
}

/** The user for a verified Google account; emails in ADMIN_EMAILS become admins. */
export async function userForGoogle(
  db: AuthDb,
  account: { sub: string; email: string; name: string | null },
  adminEmails: string[]
): Promise<User> {
  const email = account.email.toLowerCase();
  const role: 'admin' | undefined = adminEmails.includes(email) ? 'admin' : undefined;
  const [bySub] = await db.select().from(schema.users).where(eq(schema.users.googleSub, account.sub));
  const [byEmail] = bySub ? [bySub] : await db.select().from(schema.users).where(eq(schema.users.email, email));
  const fields = { googleSub: account.sub, email, ...(account.name ? { name: account.name } : {}), ...(role ? { role } : {}) };
  const [user] = byEmail
    ? await db.update(schema.users).set(fields).where(eq(schema.users.id, byEmail.id)).returning()
    : await db.insert(schema.users).values(fields).returning();
  if (!user) throw new Error('User could not be saved');
  return user;
}

/** Opens a session and returns its token; only the token's hash is stored. */
export async function createSession(db: AuthDb, userId: string, now: Date): Promise<{ token: string; expiresAt: Date }> {
  const token = randomToken();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
  await db.insert(schema.sessions).values({ tokenHash: sha256Hex(token), userId, expiresAt, createdAt: now });
  return { token, expiresAt };
}

export async function userForSession(db: AuthDb, token: string, now: Date): Promise<User | null> {
  if (!token || token.length > 128) return null;
  const [row] = await db
    .select({ user: schema.users })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
    .where(and(eq(schema.sessions.tokenHash, sha256Hex(token)), gt(schema.sessions.expiresAt, now)));
  return row?.user ?? null;
}

export async function deleteSession(db: AuthDb, token: string): Promise<void> {
  await db.delete(schema.sessions).where(eq(schema.sessions.tokenHash, sha256Hex(token)));
}
