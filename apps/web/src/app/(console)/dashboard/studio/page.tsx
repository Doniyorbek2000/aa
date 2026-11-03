import { desc, eq } from 'drizzle-orm';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getDb, schema } from '@/db';
import { currentUser } from '@/lib/auth/session';
import { ConsoleHeader } from '../../console-header';
import { StudioForm } from './studio-form';

export const dynamic = 'force-dynamic';

export default async function StudioPage() {
  const user = await currentUser();
  if (!user) redirect('/login?next=/dashboard/studio');
  const stores = await getDb()
    .select({ id: schema.stores.id, name: schema.stores.name })
    .from(schema.stores)
    .where(eq(schema.stores.ownerId, user.id))
    .orderBy(desc(schema.stores.createdAt));

  return (
    <>
      <ConsoleHeader user={user} />
      <main className="console-main" style={{ maxWidth: 820 }}>
        <div style={{ display: 'grid', gap: 6 }}>
          <Link href="/dashboard" className="console-link" style={{ justifySelf: 'start', padding: 0 }}>← Do‘konim</Link>
          <h1>Fotostudiya</h1>
          <p className="muted">Mahsulot rasmidan katalog uchun yangi rasm: oq fon, interyer, rang varianti yoki modelda. Har bir rasm tarifingizdan 1 soniya oladi.</p>
        </div>
        {stores.length === 0 ? (
          <p className="notice">Fotostudiya do‘kon ulangandan keyin ishlaydi.</p>
        ) : (
          <StudioForm stores={stores} />
        )}
      </main>
    </>
  );
}
