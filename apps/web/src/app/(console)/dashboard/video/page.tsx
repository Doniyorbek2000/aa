import { desc, eq, inArray } from 'drizzle-orm';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getDb, schema } from '@/db';
import { currentUser } from '@/lib/auth/session';
import { ConsoleHeader } from '../../console-header';
import { VideoStudio } from './video-studio';

export const dynamic = 'force-dynamic';

const RECENT_JOBS = 20;

export default async function VideoAdsPage() {
  const user = await currentUser();
  if (!user) redirect('/login?next=/dashboard/video');
  const db = getDb();
  const stores = await db
    .select({ id: schema.stores.id, name: schema.stores.name })
    .from(schema.stores)
    .where(eq(schema.stores.ownerId, user.id))
    .orderBy(desc(schema.stores.createdAt));
  const jobs = stores.length
    ? await db
        .select({ id: schema.videoJobs.id, prompt: schema.videoJobs.prompt, status: schema.videoJobs.status, videoSeconds: schema.videoJobs.videoSeconds, createdAt: schema.videoJobs.createdAt })
        .from(schema.videoJobs)
        .where(inArray(schema.videoJobs.storeId, stores.map((store) => store.id)))
        .orderBy(desc(schema.videoJobs.createdAt))
        .limit(RECENT_JOBS)
    : [];

  return (
    <>
      <ConsoleHeader user={user} />
      <main className="console-main" style={{ maxWidth: 900 }}>
        <div style={{ display: 'grid', gap: 6 }}>
          <Link href="/dashboard" className="console-link" style={{ justifySelf: 'start', padding: 0 }}>← Do‘konim</Link>
          <h1>Video reklama</h1>
          <p className="muted">
            Bitta mahsulot videosidan yangi variantlar: boshqa fon, boshqa rang yoki boshqa kiyim. 60 soniyagacha MP4. Videoning har bir soniyasi tarifingizdan 2 soniya
            oladi; tayyorlash bir necha daqiqa davom etadi.
          </p>
        </div>
        {stores.length === 0 ? (
          <p className="notice">Video reklama do‘kon ulangandan keyin ishlaydi.</p>
        ) : (
          <VideoStudio stores={stores} jobs={jobs.map((job) => ({ ...job, createdAt: job.createdAt.toISOString() }))} />
        )}
      </main>
    </>
  );
}
