import { and, eq } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import type { User } from './auth/store';
import { refundStoreSeconds } from './billing';
import { videoJobStatus } from './video';

/** The video job if this user may see it (its store's owner, or an admin). */
export async function ownedVideoJob(user: User, id: string) {
  const [row] = await getDb()
    .select({ job: schema.videoJobs, ownerId: schema.stores.ownerId })
    .from(schema.videoJobs)
    .innerJoin(schema.stores, eq(schema.stores.id, schema.videoJobs.storeId))
    .where(eq(schema.videoJobs.id, id));
  return row && (user.role === 'admin' || row.ownerId === user.id) ? row.job : null;
}

/** Asks Decart about a pending job and records the outcome; a failed job gives its seconds back. */
export async function refreshVideoJob(apiKey: string, job: typeof schema.videoJobs.$inferSelect) {
  if (job.status !== 'pending') return job.status;
  const status = await videoJobStatus(apiKey, job.decartJobId);
  if (status === 'pending') return status;
  const db = getDb();
  // Only the request that flips it from pending refunds, so a failure is never refunded twice
  const [flipped] = await db
    .update(schema.videoJobs)
    .set({ status })
    .where(and(eq(schema.videoJobs.id, job.id), eq(schema.videoJobs.status, 'pending')))
    .returning({ status: schema.videoJobs.status });
  if (flipped && status === 'failed') await refundStoreSeconds(db, job.storeId, job.planSeconds);
  return status;
}
