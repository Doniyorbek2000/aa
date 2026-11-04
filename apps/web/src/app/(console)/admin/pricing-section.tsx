import { getDb } from '@/db';
import { getSettings, usdRate } from '@/lib/payments';
import { costUzs, imagePlanSeconds, marginPercent, markupOf, pricesOf, suggestedPriceUzs, videoPlanSeconds } from '@/lib/pricing';
import { savePaymentSettings } from './actions';

const som = (value: number) => `${Math.round(value).toLocaleString('uz-UZ')} so‘m`;
const usd = (value: number) => `$${value.toFixed(value < 0.1 ? 3 : 2)}`;

// Starting points for the prepaid packs (no subscriptions); the admin still names and prices each
const TIERS = [
  { name: 'Sinov', seconds: 600 },
  { name: 'Start', seconds: 1_800 },
  { name: 'Biznes', seconds: 7_200 },
  { name: 'Pro', seconds: 21_600 },
] as const;

// Decart modes A12 does not call; listed so the price sheet matches Decart's
const UNUSED = [
  { name: 'Lucy Fast (real vaqt)', price: '$0.04 / s' },
  { name: 'Lucy Restyle (real vaqt)', price: '$0.01 / s' },
] as const;

/**
 * Decart's prices per feature (editable), A12's markup, and every sale price that follows. The
 * shop balance is in live-AI seconds; video and images are converted by their price ratio.
 */
export async function PricingSection() {
  const settings = await getSettings(getDb());
  const rate = usdRate(settings);
  const markup = markupOf(settings.markup);
  const prices = pricesOf(settings);
  const perVideoSecond = videoPlanSeconds(1, prices);
  const perImage = imagePlanSeconds(prices);

  const features = [
    { name: 'Jonli kiyib ko‘rish', model: 'Lucy VTON · real vaqt', field: 'priceLive', usdPrice: prices.live, unit: '1 s', planSeconds: 1 },
    { name: 'Video reklama', model: 'Lucy · tayyor video', field: 'priceVideo', usdPrice: prices.video, unit: '1 s video', planSeconds: perVideoSecond },
    { name: 'Fotostudiya va xona rasmi', model: 'Lucy Image 2 · 720p', field: 'priceImage', usdPrice: prices.image, unit: '1 rasm', planSeconds: perImage },
  ] as const;

  return (
    <section className="card" style={{ display: 'grid', gap: 16 }} id="narx">
      <div>
        <h2>Narx siyosati</h2>
        <p className="muted" style={{ marginTop: 4 }}>
          Do‘kon balansi jonli AI soniyasida yuritiladi. Decart narxini o‘zgartirsangiz, video va rasm balansdan necha soniya yechishi,
          tannarx, tavsiya narx va moliya hisobi o‘zi qayta hisoblanadi.
        </p>
      </div>

      <form action={savePaymentSettings} style={{ display: 'grid', gap: 12 }}>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Xizmat</th>
                <th>Decart narxi ($)</th>
                <th>Balansdan</th>
                <th>Tannarx</th>
                <th>Sotuv (×{markup})</th>
                <th>Marja</th>
              </tr>
            </thead>
            <tbody>
              {features.map((feature) => {
                const cost = costUzs(feature.planSeconds, rate, prices);
                const sale = cost * markup;
                return (
                  <tr key={feature.field}>
                    <td>
                      <b>{feature.name}</b>
                      <div className="muted" style={{ fontSize: 13 }}>{feature.model}</div>
                    </td>
                    <td>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input
                          className="input"
                          name={feature.field}
                          type="number"
                          min={0.001}
                          max={10}
                          step={0.001}
                          defaultValue={feature.usdPrice}
                          aria-label={`${feature.name}: Decart narxi, ${feature.unit} uchun dollar`}
                          style={{ width: 96 }}
                        />
                        <span className="muted" style={{ fontSize: 13 }}>/ {feature.unit}</span>
                      </label>
                    </td>
                    <td>{feature.planSeconds} s</td>
                    <td>{som(cost)}</td>
                    <td><b>{som(sale)}</b></td>
                    <td style={{ color: 'var(--c-ok)' }}>{marginPercent(sale, cost)}%</td>
                  </tr>
                );
              })}
              {UNUSED.map((mode) => (
                <tr key={mode.name} className="muted">
                  <td>{mode.name}</td>
                  <td>{mode.price}</td>
                  <td colSpan={4}>A12 ishlatmaydi</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="form-row" style={{ alignItems: 'flex-end' }}>
          <label className="field" style={{ width: 140 }}>
            <span>Ustama (×)</span>
            <input className="input" name="markup" type="number" min={1} max={20} step={0.1} defaultValue={markup} />
          </label>
          <label className="field" style={{ width: 160 }}>
            <span>1 $ kursi (so‘m)</span>
            <input className="input" name="usdRate" type="number" min={1} defaultValue={rate} />
          </label>
          <button className="btn" type="submit">Narxlarni saqlash</button>
        </div>
      </form>

      <div className="stats">
        <div className="stat"><b>{som(costUzs(60, rate, prices) * markup)}</b><span>1 daqiqa jonli AI · sotuv</span></div>
        <div className="stat"><b>{som(costUzs(60 * perVideoSecond, rate, prices) * markup)}</b><span>1 daqiqa video · sotuv</span></div>
        <div className="stat"><b>{som(costUzs(perImage, rate, prices) * markup)}</b><span>1 rasm · sotuv</span></div>
        <div className="stat"><b>{usd(prices.live * 60)}</b><span>1 daqiqa jonli AI · Decart</span></div>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr><th>Tavsiya paket</th><th>AI soniya</th><th>Decart tannarxi</th><th>Tavsiya narx</th><th>Foyda</th></tr>
          </thead>
          <tbody>
            {TIERS.map((tier) => {
              const cost = costUzs(tier.seconds, rate, prices);
              const price = suggestedPriceUzs(tier.seconds, rate, markup, prices);
              return (
                <tr key={tier.name}>
                  <td>{tier.name}</td>
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
        Narxga aylanma soliq (~4%), karta komissiyasi (~1–2%) va ilovadagi bepul soniyalar kirmaydi, shuning uchun ustamani ×2.5 dan
        past qo‘ymang. Decart narxlari: platform.decart.ai → Pricing. Kurs oshsa, tannarx ham oshadi.
      </p>
    </section>
  );
}
