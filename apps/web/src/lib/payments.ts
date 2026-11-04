/**
 * Shops pay by card transfer to the card the admin set, upload the receipt, and an admin
 * approves it: a plan starts a fresh month on that plan, a pack adds top-up seconds.
 */
import { and, eq, inArray, sql } from 'drizzle-orm';
import type { AuthDb } from './auth/store.ts';
import * as schema from '../db/schema.ts';

export const SETTING_KEYS = ['cardNumber', 'cardHolder', 'bankName', 'usdRate'] as const;
export type SettingKey = (typeof SETTING_KEYS)[number];
export type PaymentSettings = Record<SettingKey, string>;
// Used for cost reports until the admin sets today's rate
export const DEFAULT_USD_RATE = 12_800;

export async function getSettings(db: AuthDb): Promise<PaymentSettings> {
  const rows = await db.select().from(schema.settings).where(inArray(schema.settings.key, [...SETTING_KEYS]));
  const value = (key: SettingKey) => rows.find((row) => row.key === key)?.value ?? '';
  return { cardNumber: value('cardNumber'), cardHolder: value('cardHolder'), bankName: value('bankName'), usdRate: value('usdRate') };
}

export async function saveSettings(db: AuthDb, values: Partial<PaymentSettings>): Promise<void> {
  for (const key of SETTING_KEYS) {
    const value = values[key];
    if (value === undefined) continue;
    await db.insert(schema.settings).values({ key, value }).onConflictDoUpdate({ target: schema.settings.key, set: { value } });
  }
}

export function usdRate(settings: PaymentSettings): number {
  const rate = Number(settings.usdRate);
  return Number.isFinite(rate) && rate > 0 ? rate : DEFAULT_USD_RATE;
}

/** Card number shown in groups of four: "8600 1234 5678 9012". */
export function formatCard(raw: string): string {
  return raw.replace(/\D/g, '').replace(/(.{4})(?=.)/g, '$1 ');
}

/**
 * Approves a pending payment and grants what it bought. The pending→approved flip is the guard:
 * a second click (or a second admin) finds nothing pending and grants nothing. One transaction,
 * so a payment is never marked approved without its seconds being granted.
 */
export async function approvePayment(db: AuthDb, paymentId: string, now: Date): Promise<boolean> {
  return db.transaction(async (tx) => {
    const [payment] = await tx
      .update(schema.payments)
      .set({ status: 'approved', reviewedAt: now })
      .where(and(eq(schema.payments.id, paymentId), eq(schema.payments.status, 'pending')))
      .returning();
    if (!payment) return false;
    if (payment.kind === 'plan') {
      await tx
        .update(schema.stores)
        // A store the admin paused stays paused: paying does not override that decision
        .set({ planId: payment.planId, usedSeconds: 0, periodStart: now })
        .where(eq(schema.stores.id, payment.storeId));
    } else {
      // Concurrent live sessions may be spending top-ups, so add with SQL, not a read-modify-write
      await tx
        .update(schema.stores)
        .set({ extraSeconds: sql`${schema.stores.extraSeconds} + ${payment.seconds}` })
        .where(eq(schema.stores.id, payment.storeId));
    }
    return true;
  });
}

export async function rejectPayment(db: AuthDb, paymentId: string, note: string | null, now: Date): Promise<boolean> {
  const [payment] = await db
    .update(schema.payments)
    .set({ status: 'rejected', adminNote: note, reviewedAt: now })
    .where(and(eq(schema.payments.id, paymentId), eq(schema.payments.status, 'pending')))
    .returning({ id: schema.payments.id });
  return !!payment;
}
