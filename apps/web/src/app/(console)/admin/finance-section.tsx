import { and, count, eq, gte, ne, sum } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { decartCredits, USD_PER_CREDIT } from '@/lib/decart-account';
import { getSettings, usdRate } from '@/lib/payments';

// Decart realtime / per-image price; video plan seconds already count double
const USD_PER_PLAN_SECOND = 0.02;
const MONTH_MS = 30 * 24 * 60 * 60_000;

const som = (value: number) => `${Math.round(value).toLocaleString('uz-UZ')} so‘m`;

/**
 * Money at a glance: what shops paid, what Decart costs, the difference, and how much Decart
 * balance is left. Cost counts the seconds reserved per session (each session's cap), so it is
 * an upper bound; the Decart balance is the exact figure.
 */
export async function FinanceSection() {
  const db = getDb();
  const since = new Date(Date.now() - MONTH_MS);
  const [settings, credits, [paid30], [paidAll], [pending], [live30], [video30]] = await Promise.all([
    getSettings(db),
    decartCredits(process.env.DECART_API_KEY),
    db.select({ uzs: sum(schema.payments.amountUzs) }).from(schema.payments).where(and(eq(schema.payments.status, 'approved'), gte(schema.payments.reviewedAt, since))),
    db.select({ uzs: sum(schema.payments.amountUzs) }).from(schema.payments).where(eq(schema.payments.status, 'approved')),
    db.select({ n: count() }).from(schema.payments).where(eq(schema.payments.status, 'pending')),
    db.select({ s: sum(schema.liveSessions.seconds) }).from(schema.liveSessions).where(gte(schema.liveSessions.createdAt, since)),
    db
      .select({ s: sum(schema.videoJobs.planSeconds) })
      .from(schema.videoJobs)
      .where(and(gte(schema.videoJobs.createdAt, since), ne(schema.videoJobs.status, 'failed'))),
  ]);
  const rate = usdRate(settings);
  const revenue30 = Number(paid30?.uzs ?? 0);
  const costUsd = (Number(live30?.s ?? 0) + Number(video30?.s ?? 0)) * USD_PER_PLAN_SECOND;
  const costUzs = costUsd * rate;
  const balanceUsd = credits === null ? null : credits * USD_PER_CREDIT;
  const balanceMinutes = balanceUsd === null ? null : Math.floor(balanceUsd / USD_PER_PLAN_SECOND / 60);

  return (
    <section className="card" style={{ display: 'grid', gap: 12 }}>
      <h2>Moliya (oxirgi 30 kun)</h2>
      <div className="stats">
        <div className="stat"><b>{som(revenue30)}</b><span>tushum (tasdiqlangan)</span></div>
        <div className="stat"><b>${costUsd.toFixed(2)}</b><span>Decart xarajati ≈ {som(costUzs)}</span></div>
        <div className="stat">
          <b style={{ color: revenue30 - costUzs >= 0 ? 'var(--c-ok)' : 'var(--c-danger)' }}>{som(revenue30 - costUzs)}</b>
          <span>foyda</span>
        </div>
        <div className="stat"><b>{som(Number(paidAll?.uzs ?? 0))}</b><span>jami tushum (hamma vaqt)</span></div>
        <div className="stat">
          <b>{balanceUsd === null ? '—' : `$${balanceUsd.toFixed(2)}`}</b>
          <span>{balanceMinutes === null ? 'Decart balansi olinmadi' : `Decart balansi · ≈ ${balanceMinutes} AI daqiqa`}</span>
        </div>
        <div className="stat"><b>{pending?.n ?? 0}</b><span>tekshirilishi kerak bo‘lgan chek</span></div>
      </div>
      <p className="muted" style={{ fontSize: 13 }}>
        Kurs: 1 $ = {rate.toLocaleString('uz-UZ')} so‘m. Xarajat har sessiyaga ajratilgan soniyalar bo‘yicha (yuqori chegara); aniq sarf — Decart balansi.
        {balanceMinutes !== null && balanceMinutes < 60 && <b className="error"> Decart balansi kam — to‘ldiring: platform.decart.ai → Billing.</b>}
      </p>
    </section>
  );
}
