import { and, desc, eq, isNull } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { getDb, schema } from '@/db';
import { currentUser } from '@/lib/auth/session';
import { formatCard, getSettings } from '@/lib/payments';
import { ConsoleHeader } from '../console-header';
import { PayForm } from '../dashboard/billing/pay-form';

export const dynamic = 'force-dynamic';

const STATUS = { pending: 'tekshirilmoqda', approved: 'tasdiqlandi', rejected: 'rad etildi' } as const;

/** A person's own live AI seconds: the balance, packs to buy on the web, and their top-ups. */
export default async function BalancePage() {
  const user = await currentUser();
  if (!user) redirect('/login?next=/balance');
  const db = getDb();
  const [packs, settings, history] = await Promise.all([
    db
      .select()
      .from(schema.packs)
      .where(and(eq(schema.packs.isActive, true), eq(schema.packs.audience, 'user')))
      .orderBy(schema.packs.priceUzs),
    getSettings(db),
    db
      .select({
        id: schema.payments.id,
        title: schema.payments.title,
        seconds: schema.payments.seconds,
        amountUzs: schema.payments.amountUzs,
        status: schema.payments.status,
        adminNote: schema.payments.adminNote,
        createdAt: schema.payments.createdAt,
      })
      .from(schema.payments)
      .where(and(eq(schema.payments.userId, user.id), isNull(schema.payments.storeId)))
      .orderBy(desc(schema.payments.createdAt))
      .limit(30),
  ]);
  const hasCard = !!settings.cardNumber && !!settings.cardHolder;

  return (
    <>
      <ConsoleHeader user={user} />
      <main className="console-main" style={{ maxWidth: 860 }}>
        <div style={{ display: 'grid', gap: 6 }}>
          <h1>Balansim</h1>
          <p className="muted">
            Jonli AI kiyib ko‘rish uchun soniyalar. Avval kunlik bepul soniyalar, keyin balansingiz sarflanadi. Balans shu raqam bilan
            kirilgan telefondagi A12 ilovasida ham, saytda ham ishlaydi va hech qachon yonmaydi.
          </p>
        </div>

        <section className="stats" aria-label="Balans">
          <div className="stat">
            <b>{user.secondsBalance.toLocaleString('uz-UZ')} s</b>
            <span>soniyalar balansi · muddatsiz</span>
          </div>
          <div className="stat">
            <b>≈ {Math.floor(user.secondsBalance / 60).toLocaleString('uz-UZ')}</b>
            <span>daqiqalik sessiya</span>
          </div>
        </section>

        {!hasCard || packs.length === 0 ? (
          <p className="notice">Soniya sotib olish hozircha sozlanmagan. Tez orada ochiladi.</p>
        ) : (
          <PayForm
            stores={[]}
            items={packs.map((pack) => ({ kind: 'pack' as const, id: pack.id, name: pack.name, seconds: pack.seconds, priceUzs: pack.priceUzs }))}
            card={{ number: formatCard(settings.cardNumber), holder: settings.cardHolder, bank: settings.bankName }}
          />
        )}

        {history.length > 0 && (
          <section className="card">
            <h2>To‘lovlarim</h2>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Sana</th><th>Paket</th><th>Soniya</th><th>Summa</th><th>Holat</th></tr></thead>
                <tbody>
                  {history.map((payment) => (
                    <tr key={payment.id}>
                      <td>{payment.createdAt.toLocaleDateString('uz-UZ')}</td>
                      <td>{payment.title}</td>
                      <td>{payment.seconds.toLocaleString('uz-UZ')}</td>
                      <td>{payment.amountUzs.toLocaleString('uz-UZ')} so‘m</td>
                      <td>
                        <span className={payment.status === 'approved' ? 'badge badge-ok' : payment.status === 'rejected' ? 'badge badge-off' : 'badge'}>
                          {STATUS[payment.status]}
                        </span>
                        {payment.adminNote && <div className="muted" style={{ fontSize: 13 }}>{payment.adminNote}</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </>
  );
}
