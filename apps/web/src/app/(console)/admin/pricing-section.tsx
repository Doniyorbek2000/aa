import { getDb } from '@/db';
import { getSettings, usdRate } from '@/lib/payments';
import { USD_PER_PLAN_SECOND, costUzs, marginPercent, markupOf, suggestedPriceUzs } from '@/lib/pricing';
import { savePaymentSettings } from './actions';

const som = (value: number) => `${Math.round(value).toLocaleString('uz-UZ')} so‘m`;

// Starting points for the prepaid packs (no subscriptions); the admin still names and prices each
const TIERS = [
  { name: 'Sinov', kind: 'Paket', seconds: 600 },
  { name: 'Start', kind: 'Paket', seconds: 1_800 },
  { name: 'Biznes', kind: 'Paket', seconds: 7_200 },
  { name: 'Pro', kind: 'Paket', seconds: 21_600 },
] as const;

/** Decart's cost per second, A12's markup, and the sale prices that follow from them. */
export async function PricingSection() {
  const settings = await getSettings(getDb());
  const rate = usdRate(settings);
  const markup = markupOf(settings.markup);
  const secondCost = costUzs(1, rate);
  const secondPrice = secondCost * markup;

  return (
    <section className="card" style={{ display: 'grid', gap: 14 }}>
      <div className="form-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Narx siyosati</h2>
        <form action={savePaymentSettings} className="form-row" style={{ alignItems: 'flex-end' }}>
          <label className="field" style={{ width: 140 }}>
            <span>Ustama (×)</span>
            <input className="input" name="markup" type="number" min={1} max={20} step={0.1} defaultValue={markup} />
          </label>
          <button className="btn btn-small" type="submit">Saqlash</button>
        </form>
      </div>

      <div className="stats">
        <div className="stat">
          <b>{som(secondCost)}</b>
          <span>tannarx · 1 s (${USD_PER_PLAN_SECOND})</span>
        </div>
        <div className="stat">
          <b>{som(secondPrice)}</b>
          <span>sotuv · 1 s (×{markup})</span>
        </div>
        <div className="stat">
          <b>{som(secondPrice * 60)}</b>
          <span>sotuv · 1 daqiqa</span>
        </div>
        <div className="stat">
          <b>{marginPercent(secondPrice, secondCost)}%</b>
          <span>marja (soliqgacha)</span>
        </div>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr><th>Tavsiya</th><th>AI soniya</th><th>Decart tannarxi</th><th>Tavsiya narx</th><th>Foyda</th></tr>
          </thead>
          <tbody>
            {TIERS.map((tier) => {
              const cost = costUzs(tier.seconds, rate);
              const price = suggestedPriceUzs(tier.seconds, rate, markup);
              return (
                <tr key={tier.name}>
                  <td>{tier.name} <span className="muted">· {tier.kind.toLowerCase()}</span></td>
                  <td>{tier.seconds.toLocaleString('uz-UZ')}</td>
                  <td>{som(cost)}</td>
                  <td><b>{som(price)}</b></td>
                  <td style={{ color: 'var(--c-ok)' }}>{som(price - cost)} · {marginPercent(price, cost)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
        Har bir xizmat tarif soniyasida hisoblanadi: 1 s jonli AI = 1 fotostudiya yoki xona rasmi = ½ s video reklama, hammasi
        Decart’da $0.02. Kurs: 1 $ = {rate.toLocaleString('uz-UZ')} so‘m. Narxga soliq (aylanma soliq ~4%), karta komissiyasi
        (~1–2%) va bepul sinov xarajati kirmaydi, shuning uchun ustamani ×2.5 dan past qo‘ymang. Kurs ko‘tarilsa, tannarx ham
        oshadi: “To‘lov kartasi va kurs” bo‘limida kursni yangilab turing.
      </p>
    </section>
  );
}
