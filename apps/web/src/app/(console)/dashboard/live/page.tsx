import { and, desc, eq, inArray } from 'drizzle-orm';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getDb, schema } from '@/db';
import { currentUser } from '@/lib/auth/session';
import { ConsoleHeader } from '../../console-header';
import { LiveShopStudio } from './live-shop-studio';

export const dynamic = 'force-dynamic';

export default async function LiveShopPage() {
  const user = await currentUser();
  if (!user) redirect('/login?next=/dashboard/live');
  const db = getDb();
  const stores = await db
    .select({ id: schema.stores.id, name: schema.stores.name, widgetKey: schema.stores.widgetKey })
    .from(schema.stores)
    .where(eq(schema.stores.ownerId, user.id))
    .orderBy(desc(schema.stores.createdAt));
  const garments = stores.length
    ? await db
        .select({ id: schema.garments.id, storeId: schema.garments.storeId, title: schema.garments.title, imageUrl: schema.garments.imageUrl, kind: schema.garments.kind })
        .from(schema.garments)
        .where(and(inArray(schema.garments.storeId, stores.map((store) => store.id)), eq(schema.garments.isActive, true)))
        .orderBy(desc(schema.garments.createdAt))
    : [];

  return (
    <>
      <ConsoleHeader user={user} />
      <main className="console-main">
        <div style={{ display: 'grid', gap: 6 }}>
          <Link href="/dashboard" className="console-link" style={{ justifySelf: 'start', padding: 0 }}>← Do‘konim</Link>
          <h1>Jonli efir</h1>
          <p className="muted">
            Efirda o‘zingizga katalogdagi kiyimlarni AI bilan kiyintiring. Ekranni OBS yoki ekran ulashish orqali Instagram / TikTok efiriga uzating.
            Efir vaqti tarifingizdagi AI daqiqalardan sarflanadi.
          </p>
        </div>
        {stores.length === 0 ? (
          <p className="notice">Jonli efir do‘kon ulangandan keyin ishlaydi.</p>
        ) : garments.length === 0 ? (
          <p className="notice">Avval “Do‘konim” sahifasida katalogga kiyim qo‘shing.</p>
        ) : (
          <LiveShopStudio stores={stores} garments={garments} />
        )}
      </main>
    </>
  );
}
