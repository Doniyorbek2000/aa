/**
 * Live AI minutes per store: each session reserves its seconds from the store's monthly plan up
 * front (the session cap). The write only lands if usedSeconds is unchanged since it was read,
 * so concurrent visitors cannot overspend a plan.
 */
import { and, eq } from 'drizzle-orm';
import type { AuthDb } from './auth/store.ts';
import * as schema from '../db/schema.ts';

export const BILLING_PERIOD_MS = 30 * 24 * 60 * 60_000;
// Below this a session is too short to be worth starting
export const MIN_SESSION_SECONDS = 30;
const MAX_TRIES = 3;

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
    const planLimit = plan && plan.isActive ? plan.monthlyMinutes * 60 : 0;
    if (planLimit === 0 && store.extraSeconds === 0) return { ok: false, reason: 'no-plan' };

    const isNewPeriod = now.getTime() - store.periodStart.getTime() >= BILLING_PERIOD_MS;
    const used = isNewPeriod ? 0 : store.usedSeconds;
    // The monthly plan is spent first; bought top-up seconds only once it runs out
    const planLeft = Math.max(0, planLimit - used);
    const remaining = planLeft + store.extraSeconds;
    if (remaining < MIN_SESSION_SECONDS) return { ok: false, reason: 'limit' };
    const seconds = Math.min(wantSeconds, remaining);
    const fromPlan = Math.min(seconds, planLeft);

    const [saved] = await db
      .update(schema.stores)
      .set({
        usedSeconds: used + fromPlan,
        extraSeconds: store.extraSeconds - (seconds - fromPlan),
        ...(isNewPeriod ? { periodStart: now } : {}),
      })
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

export async function recordLiveSession(
  db: AuthDb,
  session: { storeId: string | null; userId: string | null; source: string; seconds: number }
): Promise<void> {
  await db.insert(schema.liveSessions).values(session);
}
