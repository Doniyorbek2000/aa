import { and, count, desc, eq, gte, ne, sum } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { getDb, schema } from '@/db';
import { maskPhone } from '@/lib/auth/phone';
import { currentUser } from '@/lib/auth/session';
import { getSettings, usdRate } from '@/lib/payments';
import { ConsoleHeader } from '../console-header';
import { createPlan, createStore, resetStoreUsage, togglePlan, updateStore } from './actions';
import { FinanceSection } from './finance-section';
import { PacksSettingsSection } from './packs-settings-section';
import { PaymentsSection } from './payments-section';

export const dynamic = 'force-dynamic';

// Decart Lucy VTON realtime: 2 credits/s at $0.01 per credit
const USD_PER_LIVE_SECOND = 0.02;
const MONTH_MS = 30 * 24 * 60 * 60_000;
const DAY_MS = 24 * 60 * 60_000;

const som = (value: number) => `${value.toLocaleString('uz-UZ')} so‘m`;
const minutes = (seconds: number) => `${Math.round(seconds / 60)} daq`;

async function loadAdminData() {
  const db = getDb();
  const since = (ms: number) => new Date(Date.now() - ms);
  const [[users], [stores], [today], [month], [videos], plans, storeRows] = await Promise.all([
    db.select({ n: count() }).from(schema.users),
    db.select({ n: count() }).from(schema.stores),
    db.select({ n: count() }).from(schema.liveSessions).where(gte(schema.liveSessions.createdAt, since(DAY_MS))),
    db
      .select({ n: count(), seconds: sum(schema.liveSessions.seconds) })
      .from(schema.liveSessions)
      .where(gte(schema.liveSessions.createdAt, since(MONTH_MS))),
    // Video ads are billed apart from live sessions; failed ones were refunded
    db
      .select({ seconds: sum(schema.videoJobs.planSeconds) })
      .from(schema.videoJobs)
      .where(and(gte(schema.videoJobs.createdAt, since(MONTH_MS)), ne(schema.videoJobs.status, 'failed'))),
    db.select().from(schema.plans).orderBy(schema.plans.monthlyMinutes),
    db
      .select({ store: schema.stores, plan: schema.plans, owner: schema.users })
      .from(schema.stores)
      .innerJoin(schema.users, eq(schema.users.id, schema.stores.ownerId))
      .leftJoin(schema.plans, eq(schema.plans.id, schema.stores.planId))
      .orderBy(desc(schema.stores.createdAt)),
  ]);
  const monthSeconds = Number(month?.seconds ?? 0) + Number(videos?.seconds ?? 0);
  return {
    stats: { users: users?.n ?? 0, stores: stores?.n ?? 0, today: today?.n ?? 0, month: month?.n ?? 0, monthSeconds },
    plans,
    storeRows,
  };
}

export default async function AdminPage() {
  const user = await currentUser();
  if (!user) redirect('/login?next=/admin');
  if (user.role !== 'admin') redirect('/dashboard');
  const [{ stats, plans, storeRows }, settings] = await Promise.all([loadAdminData(), getSettings(getDb())]);
  const rate = usdRate(settings);
  const activePlans = plans.filter((plan) => plan.isActive);

  return (
    <>
      <ConsoleHeader user={user} />
      <main className="console-main">
        <h1>Admin panel</h1>

        <section className="stats" aria-label="Statistika">
          <div className="stat"><b>{stats.users}</b><span>foydalanuvchi</span></div>
          <div className="stat"><b>{stats.stores}</b><span>do‘kon</span></div>
          <div className="stat"><b>{stats.today}</b><span>AI sessiya (bugun)</span></div>
          <div className="stat"><b>{stats.month}</b><span>AI sessiya (30 kun)</span></div>
          <div className="stat"><b>{minutes(stats.monthSeconds)}</b><span>AI vaqt (30 kun)</span></div>
        </section>

        <FinanceSection />
        <PaymentsSection />

        <section className="card">
          <h2>Do‘konlar</h2>
          <form action={createStore} className="form-row" style={{ marginBottom: 16 }}>
            <label className="field"><span>Do‘kon nomi</span><input className="input" name="name" required maxLength={80} /></label>
            <label className="field"><span>Egasining telefoni</span><input className="input" name="ownerPhone" type="tel" placeholder="+998 90 123 45 67" required /></label>
            <label className="field">
              <span>Tarif</span>
              <select className="select" name="planId" defaultValue="">
                <option value="">— tarifsiz —</option>
                {activePlans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}
              </select>
            </label>
            <button className="btn" type="submit">Do‘kon qo‘shish</button>
          </form>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Do‘kon</th><th>Egasi</th><th>Tarif</th><th>Sarf</th><th>Holat</th><th /></tr></thead>
              <tbody>
                {storeRows.length === 0 && <tr><td colSpan={6} className="muted">Hali do‘kon yo‘q.</td></tr>}
                {storeRows.map(({ store, plan, owner }) => {
                  const limit = (plan?.monthlyMinutes ?? 0) * 60;
                  return (
                    <tr key={store.id}>
                      <td>{store.name}</td>
                      <td>{owner.phone ? maskPhone(owner.phone) : owner.email}</td>
                      <td>
                        <form action={updateStore} className="form-row">
                          <input type="hidden" name="id" value={store.id} />
                          <select className="select" name="planId" defaultValue={store.planId ?? ''} aria-label="Tarif">
                            <option value="">— tarifsiz —</option>
                            {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                          <button className="btn btn-ghost btn-small" type="submit">Saqlash</button>
                        </form>
                      </td>
                      <td>{minutes(store.usedSeconds)} / {limit ? minutes(limit) : '—'}</td>
                      <td><span className={store.status === 'active' ? 'badge badge-ok' : 'badge badge-off'}>{store.status === 'active' ? 'faol' : 'to‘xtatilgan'}</span></td>
                      <td>
                        <div className="form-row">
                          <form action={updateStore}>
                            <input type="hidden" name="id" value={store.id} />
                            <input type="hidden" name="status" value={store.status === 'active' ? 'paused' : 'active'} />
                            <button className="btn btn-ghost btn-small" type="submit">{store.status === 'active' ? 'To‘xtatish' : 'Yoqish'}</button>
                          </form>
                          <form action={resetStoreUsage}>
                            <input type="hidden" name="id" value={store.id} />
                            <button className="btn btn-ghost btn-small" type="submit">Yangi oy</button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card">
          <h2>Tariflar</h2>
          <form action={createPlan} className="form-row" style={{ marginBottom: 16 }}>
            <label className="field"><span>Nomi</span><input className="input" name="name" required maxLength={40} placeholder="Start" /></label>
            <label className="field"><span>AI daqiqa / oy</span><input className="input" name="monthlyMinutes" type="number" min={1} required placeholder="100" /></label>
            <label className="field"><span>Narxi (so‘m / oy)</span><input className="input" name="priceUzs" type="number" min={0} required placeholder="1500000" /></label>
            <button className="btn" type="submit">Tarif qo‘shish</button>
          </form>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Tarif</th><th>AI daqiqa</th><th>Narx</th><th>Decart tannarxi</th><th>Foyda (to‘liq sarflansa)</th><th>Holat</th><th /></tr></thead>
              <tbody>
                {plans.length === 0 && <tr><td colSpan={7} className="muted">Hali tarif yo‘q.</td></tr>}
                {plans.map((plan) => (
                  <tr key={plan.id}>
                    <td>{plan.name}</td>
                    <td>{plan.monthlyMinutes}</td>
                    <td>{som(plan.priceUzs)}</td>
                    <td>{som(Math.round(plan.monthlyMinutes * 60 * USD_PER_LIVE_SECOND * rate))} (${(plan.monthlyMinutes * 60 * USD_PER_LIVE_SECOND).toFixed(0)})</td>
                    <td style={{ color: plan.priceUzs - plan.monthlyMinutes * 60 * USD_PER_LIVE_SECOND * rate >= 0 ? 'var(--c-ok)' : 'var(--c-danger)' }}>
                      {som(Math.round(plan.priceUzs - plan.monthlyMinutes * 60 * USD_PER_LIVE_SECOND * rate))}
                    </td>
                    <td><span className={plan.isActive ? 'badge badge-ok' : 'badge badge-off'}>{plan.isActive ? 'faol' : 'yopiq'}</span></td>
                    <td>
                      <form action={togglePlan}>
                        <input type="hidden" name="id" value={plan.id} />
                        <button className="btn btn-ghost btn-small" type="submit">{plan.isActive ? 'Yopish' : 'Ochish'}</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <PacksSettingsSection />
      </main>
    </>
  );
}
