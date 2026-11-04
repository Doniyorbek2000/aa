'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getDb, schema } from '@/db';
import { normaliseUzPhone } from '@/lib/auth/phone';
import { currentUser } from '@/lib/auth/session';
import { envList, userForPhone } from '@/lib/auth/store';
import { credentialProblem, normaliseLogin, setCredentials } from '@/lib/auth/password';
import { randomToken } from '@/lib/auth/tokens';
import { approvePayment, rejectPayment, saveSettings } from '@/lib/payments';
import { int, oneOf, text, uuid } from '../validate';

// Every action re-checks the role: a server action is a public endpoint, not just a button
async function requireAdmin() {
  const user = await currentUser();
  if (!user || user.role !== 'admin') redirect('/login?next=/admin');
  return user;
}

const done = () => revalidatePath('/admin');

export async function createPlan(form: FormData) {
  await requireAdmin();
  const name = text(form, 'name', 40);
  const monthlySeconds = int(form, 'monthlySeconds', 30, 6_000_000);
  const priceUzs = int(form, 'priceUzs', 0, 1_000_000_000);
  if (!name || monthlySeconds === null || priceUzs === null) return;
  await getDb().insert(schema.plans).values({ name, monthlySeconds, priceUzs });
  done();
}

export async function togglePlan(form: FormData) {
  await requireAdmin();
  const id = uuid(form, 'id');
  if (!id) return;
  const db = getDb();
  const [plan] = await db.select().from(schema.plans).where(eq(schema.plans.id, id));
  if (plan) await db.update(schema.plans).set({ isActive: !plan.isActive }).where(eq(schema.plans.id, id));
  done();
}

/** Connects a shop: its owner signs in with this phone number to reach the dashboard. */
export async function createStore(form: FormData) {
  await requireAdmin();
  const name = text(form, 'name', 80);
  const phoneRaw = text(form, 'ownerPhone', 30);
  const phone = phoneRaw ? normaliseUzPhone(phoneRaw) : null;
  const planId = uuid(form, 'planId');
  if (!name || !phone) return;
  const db = getDb();
  const owner = await userForPhone(db, phone, envList(process.env.ADMIN_PHONES));
  await db.insert(schema.stores).values({ name, ownerId: owner.id, planId, widgetKey: `wk_${randomToken(24)}` });
  done();
}

export async function updateStore(form: FormData) {
  await requireAdmin();
  const id = uuid(form, 'id');
  if (!id) return;
  const planId = form.get('planId') === '' ? null : uuid(form, 'planId');
  const status = oneOf(form, 'status', ['active', 'paused'] as const);
  await getDb()
    .update(schema.stores)
    .set({ ...(form.has('planId') ? { planId } : {}), ...(status ? { status } : {}) })
    .where(eq(schema.stores.id, id));
  done();
}

export async function createPack(form: FormData) {
  await requireAdmin();
  const name = text(form, 'name', 40);
  const seconds = int(form, 'seconds', 30, 6_000_000);
  const priceUzs = int(form, 'priceUzs', 0, 1_000_000_000);
  if (!name || seconds === null || priceUzs === null) return;
  await getDb().insert(schema.packs).values({ name, seconds, priceUzs });
  done();
}

export async function togglePack(form: FormData) {
  await requireAdmin();
  const id = uuid(form, 'id');
  if (!id) return;
  const db = getDb();
  const [pack] = await db.select().from(schema.packs).where(eq(schema.packs.id, id));
  if (pack) await db.update(schema.packs).set({ isActive: !pack.isActive }).where(eq(schema.packs.id, id));
  done();
}

/** The card shops pay to, shown on their billing page, and today's dollar rate for reports. */
export async function savePaymentSettings(form: FormData) {
  await requireAdmin();
  const cardNumber = (text(form, 'cardNumber', 40) ?? '').replace(/\D/g, '');
  const rate = int(form, 'usdRate', 1, 1_000_000);
  const markup = Number((text(form, 'markup', 6) ?? '').replace(',', '.'));
  // Forms post only their own fields; a missing field leaves the saved value alone
  await saveSettings(getDb(), {
    ...(cardNumber.length >= 12 && cardNumber.length <= 19 ? { cardNumber } : {}),
    ...(text(form, 'cardHolder', 60) ? { cardHolder: text(form, 'cardHolder', 60) ?? '' } : {}),
    ...(form.has('bankName') ? { bankName: text(form, 'bankName', 60) ?? '' } : {}),
    ...(rate ? { usdRate: String(rate) } : {}),
    ...(Number.isFinite(markup) && markup >= 1 && markup <= 20 ? { markup: String(markup) } : {}),
  });
  done();
}

export async function approvePaymentAction(form: FormData) {
  await requireAdmin();
  const id = uuid(form, 'id');
  if (id) await approvePayment(getDb(), id, new Date());
  done();
}

export async function rejectPaymentAction(form: FormData) {
  await requireAdmin();
  const id = uuid(form, 'id');
  if (id) await rejectPayment(getDb(), id, text(form, 'note', 200), new Date());
  done();
}

/** Starts a fresh monthly allowance now, e.g. after the shop has paid. */
export async function resetStoreUsage(form: FormData) {
  await requireAdmin();
  const id = uuid(form, 'id');
  if (!id) return;
  await getDb().update(schema.stores).set({ usedSeconds: 0, periodStart: new Date() }).where(eq(schema.stores.id, id));
  done();
}

/**
 * Sets or changes the signed-in admin's login and password. Outcomes come back as a short code in
 * the URL (never free text), so a crafted link cannot put words into the admin panel.
 */
export async function saveAdminCredentials(form: FormData) {
  const user = await requireAdmin();
  const field = (key: string) => {
    const value = form.get(key);
    return typeof value === 'string' ? value : '';
  };
  const login = normaliseLogin(field('login'));
  const password = field('password');
  const back = (code: string) => redirect(`/admin?cred=${code}#kirish`);
  if (password !== field('confirm')) back('mismatch');
  const problem = credentialProblem(login, password);
  if (problem) back(problem);
  const result = await setCredentials(getDb(), user.id, login, password, field('current'), new Date());
  back(result);
}
