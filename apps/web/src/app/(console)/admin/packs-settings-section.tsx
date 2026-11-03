import { getDb, schema } from '@/db';
import { formatCard, getSettings, usdRate } from '@/lib/payments';
import { createPack, savePaymentSettings, togglePack } from './actions';

const USD_PER_MINUTE = 0.02 * 60;
const som = (value: number) => `${Math.round(value).toLocaleString('uz-UZ')} so‘m`;

/** Top-up packs with their Decart cost and margin, and the card shops pay to. */
export async function PacksSettingsSection() {
  const db = getDb();
  const [packs, settings] = await Promise.all([db.select().from(schema.packs).orderBy(schema.packs.minutes), getSettings(db)]);
  const rate = usdRate(settings);

  return (
    <>
      <section className="card">
        <h2>Qo‘shimcha daqiqa paketlari</h2>
        <form action={createPack} className="form-row" style={{ marginBottom: 16 }}>
          <label className="field"><span>Nomi</span><input className="input" name="name" required maxLength={40} placeholder="+60 daqiqa" /></label>
          <label className="field"><span>AI daqiqa</span><input className="input" name="minutes" type="number" min={1} required placeholder="60" /></label>
          <label className="field"><span>Narxi (so‘m)</span><input className="input" name="priceUzs" type="number" min={0} required placeholder="1200000" /></label>
          <button className="btn" type="submit">Paket qo‘shish</button>
        </form>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Paket</th><th>Daqiqa</th><th>Narx</th><th>Decart tannarxi</th><th>Foyda</th><th>Holat</th><th /></tr></thead>
            <tbody>
              {packs.length === 0 && <tr><td colSpan={7} className="muted">Hali paket yo‘q.</td></tr>}
              {packs.map((pack) => {
                const cost = pack.minutes * USD_PER_MINUTE * rate;
                const margin = pack.priceUzs ? Math.round(((pack.priceUzs - cost) / pack.priceUzs) * 100) : 0;
                return (
                  <tr key={pack.id}>
                    <td>{pack.name}</td>
                    <td>{pack.minutes}</td>
                    <td>{som(pack.priceUzs)}</td>
                    <td>{som(cost)} (${(pack.minutes * USD_PER_MINUTE).toFixed(0)})</td>
                    <td style={{ color: margin >= 0 ? 'var(--c-ok)' : 'var(--c-danger)' }}>{som(pack.priceUzs - cost)} · {margin}%</td>
                    <td><span className={pack.isActive ? 'badge badge-ok' : 'badge badge-off'}>{pack.isActive ? 'sotuvda' : 'yopiq'}</span></td>
                    <td>
                      <form action={togglePack}>
                        <input type="hidden" name="id" value={pack.id} />
                        <button className="btn btn-ghost btn-small" type="submit">{pack.isActive ? 'Yopish' : 'Ochish'}</button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card" style={{ display: 'grid', gap: 12 }}>
        <h2>To‘lov kartasi va kurs</h2>
        <p className="muted">Do‘konlar “Tarif va to‘lov” sahifasida shu kartani ko‘radi.</p>
        <form action={savePaymentSettings} className="form-row">
          <label className="field"><span>Karta raqami</span><input className="input" name="cardNumber" inputMode="numeric" defaultValue={formatCard(settings.cardNumber)} placeholder="8600 0000 0000 0000" /></label>
          <label className="field"><span>Karta egasi</span><input className="input" name="cardHolder" defaultValue={settings.cardHolder} maxLength={60} placeholder="ISM FAMILIYA" /></label>
          <label className="field"><span>Bank (ixtiyoriy)</span><input className="input" name="bankName" defaultValue={settings.bankName} maxLength={60} /></label>
          <label className="field"><span>1 $ kursi (so‘m)</span><input className="input" name="usdRate" type="number" min={1} defaultValue={rate} /></label>
          <button className="btn" type="submit">Saqlash</button>
        </form>
      </section>
    </>
  );
}
