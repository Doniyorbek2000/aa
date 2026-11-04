import { desc, eq, ne } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { approvePaymentAction, rejectPaymentAction } from './actions';

const som = (value: number) => `${value.toLocaleString('uz-UZ')} so‘m`;
const RECENT = 15;

/** Receipts waiting for a check, then the latest decisions. */
export async function PaymentsSection() {
  const db = getDb();
  const columns = {
    id: schema.payments.id,
    title: schema.payments.title,
    kind: schema.payments.kind,
    seconds: schema.payments.seconds,
    amountUzs: schema.payments.amountUzs,
    status: schema.payments.status,
    adminNote: schema.payments.adminNote,
    createdAt: schema.payments.createdAt,
    store: schema.stores.name,
    payerPhone: schema.users.phone,
  };
  const [pending, recent] = await Promise.all([
    db.select(columns).from(schema.payments).leftJoin(schema.stores, eq(schema.stores.id, schema.payments.storeId)).innerJoin(schema.users, eq(schema.users.id, schema.payments.userId)).where(eq(schema.payments.status, 'pending')).orderBy(schema.payments.createdAt),
    db.select(columns).from(schema.payments).leftJoin(schema.stores, eq(schema.stores.id, schema.payments.storeId)).innerJoin(schema.users, eq(schema.users.id, schema.payments.userId)).where(ne(schema.payments.status, 'pending')).orderBy(desc(schema.payments.reviewedAt)).limit(RECENT),
  ]);

  return (
    <section className="card" style={{ display: 'grid', gap: 12 }}>
      <h2>To‘lovlar</h2>
      {pending.length === 0 ? (
        <p className="muted">Tekshirilishi kerak bo‘lgan chek yo‘q.</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Kim</th><th>Nima uchun</th><th>Summa</th><th>Chek</th><th /></tr></thead>
            <tbody>
              {pending.map((payment) => (
                <tr key={payment.id}>
                  <td>
                    {payment.store ?? `Foydalanuvchi · ${payment.payerPhone ?? '—'}`}
                    <div className="muted" style={{ fontSize: 13 }}>{payment.createdAt.toLocaleString('uz-UZ')}</div>
                  </td>
                  <td>{payment.title}<div className="muted" style={{ fontSize: 13 }}>{payment.kind === 'plan' ? 'oylik tarif' : 'paket'} · {payment.seconds.toLocaleString('uz-UZ')} s</div></td>
                  <td><b>{som(payment.amountUzs)}</b></td>
                  <td><a className="console-link" href={`/api/payments/${payment.id}/receipt`} target="_blank" rel="noopener noreferrer">Ko‘rish</a></td>
                  <td>
                    <div className="form-row">
                      <form action={approvePaymentAction}>
                        <input type="hidden" name="id" value={payment.id} />
                        <button className="btn btn-small" type="submit">Tasdiqlash</button>
                      </form>
                      <form action={rejectPaymentAction} className="form-row">
                        <input type="hidden" name="id" value={payment.id} />
                        <input className="input" name="note" placeholder="Sabab" maxLength={200} style={{ height: 32, minWidth: 120 }} />
                        <button className="btn btn-danger btn-small" type="submit">Rad etish</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {recent.length > 0 && (
        <details>
          <summary className="muted" style={{ cursor: 'pointer' }}>Oxirgi qarorlar</summary>
          <div className="table-wrap">
            <table className="table">
              <tbody>
                {recent.map((payment) => (
                  <tr key={payment.id}>
                    <td>{payment.store ?? `Foydalanuvchi · ${payment.payerPhone ?? '—'}`}</td>
                    <td>{payment.title}</td>
                    <td>{som(payment.amountUzs)}</td>
                    <td><span className={payment.status === 'approved' ? 'badge badge-ok' : 'badge badge-off'}>{payment.status === 'approved' ? 'tasdiqlandi' : 'rad etildi'}</span> {payment.adminNote}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </section>
  );
}
