import { and, eq } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { userFromRequest } from '@/lib/auth/session';
import { chargeStoreSession, recordLiveSession, refundStoreSeconds } from '@/lib/billing';
import { editImage, IMAGE_TYPES, imageResponse } from '@/lib/decart-image';
import { getSettings } from '@/lib/payments';
import { imagePlanSeconds, pricesOf } from '@/lib/pricing';
import { MAX_IMAGE_BYTES } from '@/lib/public-image';
import { cleanLine, isStudioPreset, studioPrompt } from '@/lib/studio';

export const maxDuration = 90;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const fail = (status: number, error: string) => Response.json({ error }, { status });

/**
 * Makes a catalogue photo variant for the signed-in owner's store, paid from its plan.
 * Multipart form: storeId, image, preset, extra (a color or a custom brief).
 */
export async function POST(request: Request) {
  const apiKey = process.env.DECART_API_KEY;
  if (!apiKey) return fail(503, 'Photo studio is not configured.');
  const user = await userFromRequest(request);
  if (!user) return fail(401, 'Sign in first.');

  const form = await request.formData().catch(() => null);
  const storeId = form?.get('storeId');
  const image = form?.get('image');
  const preset = form?.get('preset');
  if (typeof storeId !== 'string' || !UUID.test(storeId)) return fail(400, 'Choose a store.');
  if (!(image instanceof File) || !IMAGE_TYPES.has(image.type) || image.size === 0 || image.size > MAX_IMAGE_BYTES) {
    return fail(400, 'Add a JPEG, PNG or WebP photo (up to 8 MB).');
  }
  if (!isStudioPreset(preset)) return fail(400, 'Choose a style.');
  const prompt = studioPrompt(preset, cleanLine(form?.get('extra'), 300));
  if (!prompt) return fail(400, preset === 'color' ? 'Write the color.' : 'Describe the change.');

  const db = getDb();
  const ownsStore = user.role === 'admin' ? eq(schema.stores.id, storeId) : and(eq(schema.stores.id, storeId), eq(schema.stores.ownerId, user.id));
  const [store] = await db.select().from(schema.stores).where(ownsStore);
  if (!store) return fail(404, 'Store not found.');

  const planSeconds = imagePlanSeconds(pricesOf(await getSettings(db)));
  const charge = await chargeStoreSession(db, store.widgetKey, planSeconds, new Date());
  if (!charge.ok) return fail(402, 'Your AI seconds balance is empty.');
  try {
    const result = await editImage({ apiKey, image, prompt });
    await recordLiveSession(db, { storeId: store.id, userId: user.id, source: 'studio-image', seconds: planSeconds }).catch(() => {});
    return imageResponse(result);
  } catch (error) {
    await refundStoreSeconds(db, store.id, planSeconds).catch(() => {});
    console.error('Studio render failed', error instanceof Error ? error.message : 'unknown error');
    return fail(502, 'The photo could not be made right now.');
  }
}
