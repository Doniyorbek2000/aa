import { and, desc, eq, inArray } from 'drizzle-orm';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getDb, schema } from '@/db';
import { currentUser } from '@/lib/auth/session';
import { formatCard, getSettings } from '@/lib/payments';
import { ConsoleHeader } from '../../console-header';
import { PayForm } from './pay-form';

export const dynamic = 'force-dynamic';

const STATUS = { pending: 'tekshirilmoqda', approved: 'tasdiqlandi', rejected: 'rad etildi' } as const;

export default async function BillingPage() {
  const user = await currentUser();
  if (!user) redirect('/login?next=/dashboard/billing');
  const db = getDb();
  // No subscriptions: shops buy prepaid seconds that never expire
  const [stores, packs, settings] = await Promise.all([
    db.select({ id: schema.stores.id, name: schema.stores.name }).from(schema.stores).where(eq(schema.stores.ownerId, user.id)),
    db.select().from(schema.packs).where(and(eq(schema.packs.isActive, true), eq(schema.packs.audience, 'store'))).orderBy(schema.packs.priceUzs),
    getSettings(db),
  ]);
  const history = stores.length
    ? await db
        .select({ id: schema.payments.id, title: schema.payments.title, amountUzs: schema.payments.amountUzs, status: schema.payments.status, adminNote: schema.payments.adminNote, createdAt: schema.payments.createdAt })
        .from(schema.payments)
        .where(inArray(schema.payments.storeId, stores.map((store) => store.id)))
        .orderBy(desc(schema.payments.createdAt))
        .limit(30)
    : [];
  const hasCard = !!settings.cardNumber && !!settings.cardHolder;

  return (
    <>
      <ConsoleHeader user={user} />
      <main className="console-main" style={{ maxWidth: 860 }}>
        <div style={{ display: 'grid', gap: 6 }}>
          <Link href="/dashboard" className="console-link" style={{ justifySelf: 'start', padding: 0 }}>← Do‘konim</Link>
          <h1>Balansni to‘ldirish</h1>
          <p className="muted">Obuna yo‘q: AI soniyalar paketini tanlang, kartaga o‘tkazing va chekni yuboring. Tekshirilgach soniyalar balansingizga qo‘shiladi va hech qachon yonmaydi.</p>
        </div>
        {stores.length === 0 ? (
          <p className="notice">To‘lov do‘kon ulangandan keyin ochiladi.</p>
        ) : !hasCard || packs.length === 0 ? (
          <p className="notice">To‘lov hozircha sozlanmagan. Iltimos, biz bilan bog‘laning.</p>
        ) : (
          <PayForm
            stores={stores}
            items={[
              ...packs.map((pack) => ({ kind: 'pack' as const, id: pack.id, name: pack.name, seconds: pack.seconds, priceUzs: pack.priceUzs })),
            ]}
            card={{ number: formatCard(settings.cardNumber), holder: settings.cardHolder, bank: settings.bankName }}
          />
        )}
        {history.length > 0 && (
          <section className="card">
            <h2>To‘lovlarim</h2>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Sana</th><th>Nima uchun</th><th>Summa</th><th>Holat</th></tr></thead>
                <tbody>
                  {history.map((payment) => (
                    <tr key={payment.id}>
                      <td>{payment.createdAt.toLocaleDateString('uz-UZ')}</td>
                      <td>{payment.title}</td>
                      <td>{payment.amountUzs.toLocaleString('uz-UZ')} so‘m</td>
                      <td>
                        <span className={payment.status === 'approved' ? 'badge badge-ok' : payment.status === 'rejected' ? 'badge badge-off' : 'badge'}>{STATUS[payment.status]}</span>
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
