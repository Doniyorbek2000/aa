/**
 * Live AI seconds per store: each session reserves its seconds from the store's monthly plan up
 * front (the session cap). The write only lands if usedSeconds is unchanged since it was read,
 * so concurrent visitors cannot overspend a plan.
 */
import { and, eq, gte, sql, sum } from 'drizzle-orm';
import type { AuthDb } from './auth/store.ts';
import * as schema from '../db/schema.ts';

export const BILLING_PERIOD_MS = 30 * 24 * 60 * 60_000;
// Below this a session is too short to be worth starting
export const MIN_SESSION_SECONDS = 30;
const MAX_TRIES = 3;

/** The day the paid month that started at periodStart ends. */
export function planEndsAt(periodStart: Date): Date {
  return new Date(periodStart.getTime() + BILLING_PERIOD_MS);
}

export function isPlanExpired(periodStart: Date, now: Date): boolean {
  return now.getTime() >= planEndsAt(periodStart).getTime();
}

export type StoreCharge =
  | { ok: true; storeId: string; seconds: number }
  | { ok: false; reason: 'unknown' | 'paused' | 'no-plan' | 'limit' };

/** Reserves up to wantSeconds; near the end of a plan the session gets whatever is left. */
export async function chargeStoreSession(db: AuthDb, widgetKey: string, wantSeconds: number, now: Date): Promise<StoreCharge> {
  for (let attempt = 0; attempt < MAX_TRIES; attempt++) {
    const [row] = await db
      .select({ store: schema.stores, plan: schema.plans })
      .from(schema.stores)
      .leftJoin(schema.plans, eq(schema.plans.id, schema.stores.planId))
      .where(eq(schema.stores.widgetKey, widgetKey));
    if (!row) return { ok: false, reason: 'unknown' };
    const { store, plan } = row;
    if (store.status !== 'active') return { ok: false, reason: 'paused' };
    // A plan the admin stopped selling still serves the shops that already paid for it
    const planLimit = plan ? plan.monthlySeconds : 0;
    if (planLimit === 0 && store.extraSeconds === 0) return { ok: false, reason: 'no-plan' };

    // A paid month lasts 30 days; only an approved payment (or the admin) starts the next one
    const used = store.usedSeconds;
    const planLeft = isPlanExpired(store.periodStart, now) ? 0 : Math.max(0, planLimit - used);
    // The monthly plan is spent first; bought top-up seconds only once it runs out
    const remaining = planLeft + store.extraSeconds;
    if (remaining < MIN_SESSION_SECONDS) return { ok: false, reason: 'limit' };
    const seconds = Math.min(wantSeconds, remaining);
    const fromPlan = Math.min(seconds, planLeft);

    const [saved] = await db
      .update(schema.stores)
      .set({ usedSeconds: used + fromPlan, extraSeconds: store.extraSeconds - (seconds - fromPlan) })
      .where(
        and(
          eq(schema.stores.id, store.id),
          eq(schema.stores.usedSeconds, store.usedSeconds),
          eq(schema.stores.extraSeconds, store.extraSeconds),
          eq(schema.stores.periodStart, store.periodStart)
        )
      )
      .returning({ id: schema.stores.id });
    if (saved) return { ok: true, storeId: store.id, seconds };
  }
  // Lost the race three times in a row; refuse rather than overspend
  return { ok: false, reason: 'limit' };
}

/**
 * Gives back seconds reserved for work that never happened: to this month's plan first, and
 * whatever the plan did not cover back to the top-up balance.
 */
export async function refundStoreSeconds(db: AuthDb, storeId: string, seconds: number): Promise<void> {
  for (let attempt = 0; attempt < MAX_TRIES; attempt++) {
    const [store] = await db.select().from(schema.stores).where(eq(schema.stores.id, storeId));
    if (!store) return;
    const toPlan = Math.min(seconds, store.usedSeconds);
    const [saved] = await db
      .update(schema.stores)
      .set({ usedSeconds: store.usedSeconds - toPlan, extraSeconds: store.extraSeconds + (seconds - toPlan) })
      .where(
        and(
          eq(schema.stores.id, storeId),
          eq(schema.stores.usedSeconds, store.usedSeconds),
          eq(schema.stores.extraSeconds, store.extraSeconds)
        )
      )
      .returning({ id: schema.stores.id });
    if (saved) return;
  }
}

/**
 * Takes up to wantSeconds from a person's bought balance and returns how many it took. The write
 * only lands if the balance is unchanged since it was read, so two devices cannot overspend it.
 */
export async function takeUserSeconds(db: AuthDb, userId: string, wantSeconds: number): Promise<number> {
  if (wantSeconds <= 0) return 0;
  for (let attempt = 0; attempt < MAX_TRIES; attempt++) {
    const [user] = await db.select({ balance: schema.users.secondsBalance }).from(schema.users).where(eq(schema.users.id, userId));
    if (!user || user.balance <= 0) return 0;
    const take = Math.min(wantSeconds, user.balance);
    const [saved] = await db
      .update(schema.users)
      .set({ secondsBalance: user.balance - take })
      .where(and(eq(schema.users.id, userId), eq(schema.users.secondsBalance, user.balance)))
      .returning({ id: schema.users.id });
    if (saved) return take;
  }
  return 0;
}

/** Gives back bought seconds reserved for a session that never started. */
export async function refundUserSeconds(db: AuthDb, userId: string, seconds: number): Promise<void> {
  if (seconds <= 0) return;
  await db
    .update(schema.users)
    .set({ secondsBalance: sql`${schema.users.secondsBalance} + ${seconds}` })
    .where(eq(schema.users.id, userId));
}

// One full live session a day for each signed-in app user, unless FREE_APP_SECONDS_PER_DAY says otherwise
export const DEFAULT_FREE_APP_SECONDS = 180;

export function freeAppSeconds(raw: string | undefined): number {
  const value = Number(raw);
  return Number.isInteger(value) && value >= 0 && value <= 86_400 ? value : DEFAULT_FREE_APP_SECONDS;
}

/** Live AI seconds an app user was granted since `since` (the last 24 hours). */
export async function appSecondsUsedSince(db: AuthDb, userId: string, since: Date): Promise<number> {
  const [row] = await db
    .select({ seconds: sum(schema.liveSessions.seconds) })
    .from(schema.liveSessions)
    .where(
      and(eq(schema.liveSessions.userId, userId), eq(schema.liveSessions.source, 'app'), gte(schema.liveSessions.createdAt, since))
    );
  return Number(row?.seconds ?? 0);
}

export async function recordLiveSession(
  db: AuthDb,
  session: { storeId: string | null; userId: string | null; source: string; seconds: number }
): Promise<void> {
  await db.insert(schema.liveSessions).values(session);
}
