import { desc, eq, inArray } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { getDb, schema } from '@/db';
import { currentUser } from '@/lib/auth/session';
import { BILLING_PERIOD_MS } from '@/lib/billing';
import { ConsoleHeader } from '../console-header';
import { addGarment, deleteGarment, rotateWidgetKey, toggleGarment } from './actions';

export const dynamic = 'force-dynamic';

const KIND_LABELS = { upper_body: 'Ustki kiyim', lower_body: 'Shim / yubka', dresses: 'Ko‘ylak' } as const;
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://a12.uz';

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) redirect('/login?next=/dashboard');
  const db = getDb();
  const rows = await db
    .select({ store: schema.stores, plan: schema.plans })
    .from(schema.stores)
    .leftJoin(schema.plans, eq(schema.plans.id, schema.stores.planId))
    .where(eq(schema.stores.ownerId, user.id))
    .orderBy(desc(schema.stores.createdAt));
  const garments = rows.length
    ? await db
        .select()
        .from(schema.garments)
        .where(inArray(schema.garments.storeId, rows.map((row) => row.store.id)))
        .orderBy(desc(schema.garments.createdAt))
    : [];

  return (
    <>
      <ConsoleHeader user={user} />
      <main className="console-main">
        <h1>Do‘konim</h1>
        {rows.length === 0 && (
          <p className="notice">
            Sizning raqamingizga hali do‘kon ulanmagan. Do‘koningizni A12 ga ulash uchun biz bilan bog‘laning — ulangandan keyin shu
            sahifada vidjet kodi va kiyimlar katalogi paydo bo‘ladi.
          </p>
        )}
        {rows.map(({ store, plan }) => {
          const limit = (plan?.monthlyMinutes ?? 0) * 60;
          const usedPct = limit ? Math.min(100, Math.round((store.usedSeconds / limit) * 100)) : 0;
          const renews = new Date(store.periodStart.getTime() + BILLING_PERIOD_MS).toLocaleDateString('uz-UZ');
          const snippet = `<script src="${SITE}/widget/latest/a12.js" data-store="${store.widgetKey}" defer></script>`;
          const items = garments.filter((garment) => garment.storeId === store.id);
          return (
            <section key={store.id} style={{ display: 'grid', gap: 16 }}>
              <div className="card" style={{ display: 'grid', gap: 10 }}>
                <h2>{store.name}</h2>
                {store.status !== 'active' && <p className="error">Do‘kon vaqtincha to‘xtatilgan — AI kiyintirish bepul rejimda ishlaydi.</p>}
                <p>
                  Tarif: <b>{plan?.name ?? 'tanlanmagan'}</b>
                  {limit > 0 && (
                    <span className="muted"> · {Math.round(store.usedSeconds / 60)} / {plan?.monthlyMinutes} AI daqiqa · {renews} da yangilanadi</span>
                  )}
                </p>
                {limit > 0 && <div className="bar" role="progressbar" aria-valuenow={usedPct} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${usedPct}%` }} /></div>}
                <p className="muted">Daqiqalar tugaganda mijozlaringiz uchun bepul kuzatish rejimi ishlashda davom etadi.</p>
              </div>

              <div className="card" style={{ display: 'grid', gap: 10 }}>
                <h2>Saytga ulash</h2>
                <p className="muted">Bu kodni saytingizning &lt;head&gt; qismiga qo‘ying: mahsulot rasmlarida “Try-On” tugmasi chiqadi.</p>
                <code className="code">{snippet}</code>
                <p className="muted">
                  Mebel, chiroq yoki gilam sotsangiz — “Xonangizda ko‘ring” tugmasiga shu havolani qo‘ying (rasm manzilini o‘zingiznikiga almashtiring):
                </p>
                <code className="code">{`${SITE}/space?kind=furniture&store=${store.widgetKey}&product=https://saytingiz.uz/divan.jpg`}</code>
                <form action={rotateWidgetKey}>
                  <input type="hidden" name="storeId" value={store.id} />
                  <button className="btn btn-ghost btn-small" type="submit">Kalitni yangilash</button>
                </form>
              </div>

              <div className="card">
                <h2>Kiyimlar katalogi</h2>
                <form action={addGarment} className="form-row" style={{ marginBottom: 16 }}>
                  <input type="hidden" name="storeId" value={store.id} />
                  <label className="field"><span>Nomi</span><input className="input" name="title" required maxLength={120} /></label>
                  <label className="field"><span>Rasm havolasi (https)</span><input className="input" name="imageUrl" type="url" required placeholder="https://…" /></label>
                  <label className="field">
                    <span>Turi</span>
                    <select className="select" name="kind" defaultValue="upper_body">
                      {Object.entries(KIND_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </label>
                  <button className="btn" type="submit">Qo‘shish</button>
                </form>
                <div className="table-wrap">
                  <table className="table">
                    <thead><tr><th /><th>Nomi</th><th>Turi</th><th>Holat</th><th /></tr></thead>
                    <tbody>
                      {items.length === 0 && <tr><td colSpan={5} className="muted">Hali kiyim qo‘shilmagan.</td></tr>}
                      {items.map((garment) => (
                        <tr key={garment.id}>
                          <td><img className="thumb" src={garment.imageUrl} alt="" loading="lazy" referrerPolicy="no-referrer" /></td>
                          <td>{garment.title}</td>
                          <td>{KIND_LABELS[garment.kind]}</td>
                          <td><span className={garment.isActive ? 'badge badge-ok' : 'badge badge-off'}>{garment.isActive ? 'ko‘rinadi' : 'yashirin'}</span></td>
                          <td>
                            <div className="form-row">
                              <form action={toggleGarment}>
                                <input type="hidden" name="id" value={garment.id} />
                                <button className="btn btn-ghost btn-small" type="submit">{garment.isActive ? 'Yashirish' : 'Ko‘rsatish'}</button>
                              </form>
                              <form action={deleteGarment}>
                                <input type="hidden" name="id" value={garment.id} />
                                <button className="btn btn-danger btn-small" type="submit">O‘chirish</button>
                              </form>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          );
        })}
      </main>
    </>
  );
}
