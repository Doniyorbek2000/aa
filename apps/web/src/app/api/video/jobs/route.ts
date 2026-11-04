import { and, eq } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { userFromRequest } from '@/lib/auth/session';
import { chargeStoreSession, refundStoreSeconds } from '@/lib/billing';
import { IMAGE_TYPES } from '@/lib/decart-image';
import { mp4DurationSeconds } from '@/lib/mp4';
import { getSettings } from '@/lib/payments';
import { pricesOf, videoPlanSeconds } from '@/lib/pricing';
import { MAX_IMAGE_BYTES } from '@/lib/public-image';
import {
  MAX_VIDEO_BYTES,
  MAX_VIDEO_SECONDS,
  isVideoPreset,
  submitVideoJob,
  videoJob,
} from '@/lib/video';

export const maxDuration = 150;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const fail = (status: number, error: string) => Response.json({ error }, { status });

/**
 * Starts a video ad variant for the signed-in owner's store. Multipart form: storeId,
 * video (MP4, up to 60 s / 60 MB), preset, extra (text), reference (garment image, for outfits).
 * The plan pays for the length read from the file itself, before Decart starts.
 */
export async function POST(request: Request) {
  const apiKey = process.env.DECART_API_KEY;
  if (!apiKey) return fail(503, 'Video ads are not configured.');
  const user = await userFromRequest(request);
  if (!user) return fail(401, 'Sign in first.');

  const form = await request.formData().catch(() => null);
  const storeId = form?.get('storeId');
  const video = form?.get('video');
  const preset = form?.get('preset');
  const referenceField = form?.get('reference');
  if (typeof storeId !== 'string' || !UUID.test(storeId)) return fail(400, 'Choose a store.');
  if (!(video instanceof File) || video.type !== 'video/mp4' || video.size === 0 || video.size > MAX_VIDEO_BYTES) {
    return fail(400, 'Add an MP4 video up to 60 MB.');
  }
  const reference =
    referenceField instanceof File && IMAGE_TYPES.has(referenceField.type) && referenceField.size > 0 && referenceField.size <= MAX_IMAGE_BYTES
      ? referenceField
      : null;
  if (!isVideoPreset(preset)) return fail(400, 'Choose what to change.');
  const job = videoJob(preset, form?.get('extra'), !!reference);
  if (!job) return fail(400, preset === 'outfit' ? 'Add the garment photo.' : 'Describe the change.');

  const bytes = new Uint8Array(await video.arrayBuffer());
  const seconds = mp4DurationSeconds(bytes);
  if (seconds === null) return fail(400, 'This MP4 could not be read; export it again (H.264, 16:9 or 9:16).');
  if (seconds > MAX_VIDEO_SECONDS) return fail(400, 'Videos can be up to 60 seconds long.');
  const videoSeconds = Math.max(1, Math.ceil(seconds));
  const db = getDb();
  // Video costs more per second than live AI; the admin's Decart prices set how many plan seconds
  const planSeconds = videoPlanSeconds(videoSeconds, pricesOf(await getSettings(db)));
  const owns = user.role === 'admin' ? eq(schema.stores.id, storeId) : and(eq(schema.stores.id, storeId), eq(schema.stores.ownerId, user.id));
  const [store] = await db.select().from(schema.stores).where(owns);
  if (!store) return fail(404, 'Store not found.');

  const charge = await chargeStoreSession(db, store.widgetKey, planSeconds, new Date());
  if (!charge.ok) return fail(402, 'Your AI seconds balance is empty.');
  if (charge.seconds < planSeconds) {
    // Partial grants suit live sessions, not a video that is billed in full
    await refundStoreSeconds(db, store.id, charge.seconds);
    return fail(402, 'Not enough AI seconds left for this video.');
  }
  try {
    const decartJobId = await submitVideoJob({ apiKey, model: job.model, video: new Blob([bytes], { type: 'video/mp4' }), prompt: job.prompt, reference });
    const [row] = await db
      .insert(schema.videoJobs)
      .values({ storeId: store.id, decartJobId, prompt: job.prompt, videoSeconds, planSeconds })
      .returning({ id: schema.videoJobs.id });
    return Response.json({ id: row?.id, status: 'pending', videoSeconds });
  } catch (error) {
    await refundStoreSeconds(db, store.id, planSeconds).catch(() => {});
    console.error('Video job submit failed', error instanceof Error ? error.message : 'unknown error');
    return fail(502, 'The video could not be sent for processing, try again shortly.');
  }
}
