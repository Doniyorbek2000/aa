import { getDb } from '@/db';
import { userFromRequest } from '@/lib/auth/session';
import { chargeStoreSession, recordLiveSession, refundStoreSeconds } from '@/lib/billing';
import { decartAllowedOrigins, isAllowedOrigin, maxSessionsPerDay } from '@/lib/decart';
import { editImage, IMAGE_PLAN_SECONDS, IMAGE_TYPES, imageResponse } from '@/lib/decart-image';
import { fetchPublicImage, MAX_IMAGE_BYTES } from '@/lib/public-image';
import { clientIp, createRateLimiter } from '@/lib/rate-limit';
import { cleanPlacement, isSpaceKind, spacePrompt } from '@/lib/space';

export const maxDuration = 90;

const STORE_KEY = /^[A-Za-z0-9_-]{16,64}$/;
const DAY_MS = 24 * 60 * 60_000;
const allowClient = createRateLimiter(6, 10 * 60_000);
// Shares the daily budget knob with live sessions; images are cheap, so allow ten times as many
const allowToday = createRateLimiter(maxSessionsPerDay(process.env.DECART_MAX_SESSIONS_PER_DAY) * 10, DAY_MS);

const fail = (status: number, error: string) => Response.json({ error }, { status });

function imageFile(value: FormDataEntryValue | null): File | null {
  return value instanceof File && IMAGE_TYPES.has(value.type) && value.size > 0 && value.size <= MAX_IMAGE_BYTES ? value : null;
}

/**
 * Renders a product into the shopper's room photo with Lucy Image 2. Takes multipart form data:
 * room (photo), product (photo) or productUrl (https), kind, placement, optional storeKey.
 */
export async function POST(request: Request) {
  const apiKey = process.env.DECART_API_KEY;
  if (!apiKey) return fail(503, 'Room preview is not configured.');
  // The website is checked by its Origin; the mobile app sends none, so it must be signed in instead
  const isSignedInApp =
    request.headers.get('x-a12-client') === 'app' && !!process.env.DATABASE_URL && !!(await userFromRequest(request).catch(() => null));
  if (!isSignedInApp && !isAllowedOrigin(request.headers.get('origin'), decartAllowedOrigins(process.env.DECART_ALLOWED_ORIGINS))) {
    return fail(403, 'Origin not allowed.');
  }
  const now = new Date();
  if (!allowClient(clientIp(request), now.getTime())) return fail(429, 'Too many previews, try again in a few minutes.');

  const form = await request.formData().catch(() => null);
  if (!form) return fail(400, 'Send the photos as form data.');
  const room = imageFile(form.get('room'));
  if (!room) return fail(400, 'Add a JPEG, PNG or WebP photo of the room (up to 8 MB).');
  const kindField = form.get('kind');
  const kind = isSpaceKind(kindField) ? kindField : 'furniture';
  const placement = cleanPlacement(form.get('placement'));

  let product: Blob | null = imageFile(form.get('product'));
  const productUrl = form.get('productUrl');
  if (!product && typeof productUrl === 'string' && productUrl.startsWith('https://') && productUrl.length <= 2048) {
    try {
      const fetched = await fetchPublicImage(productUrl);
      product = new Blob([fetched.bytes], { type: fetched.mimeType });
    } catch {
      return fail(422, 'The product image could not be loaded.');
    }
  }
  if (!product) return fail(400, 'Add a photo of the product.');

  const storeKey = form.get('storeKey');
  const hasDb = !!process.env.DATABASE_URL;
  let storeId: string | null = null;
  if (typeof storeKey === 'string' && STORE_KEY.test(storeKey) && hasDb) {
    const charge = await chargeStoreSession(getDb(), storeKey, IMAGE_PLAN_SECONDS, now);
    if (!charge.ok) return fail(402, 'This shop has no AI minutes left.');
    storeId = charge.storeId;
  } else if (!allowToday('site', now.getTime())) {
    return fail(429, 'Too many previews today, try again tomorrow.');
  }

  try {
    const result = await editImage({ apiKey, image: room, reference: product, prompt: spacePrompt(kind, placement) });
    if (hasDb) {
      await recordLiveSession(getDb(), { storeId, userId: null, source: 'space-image', seconds: IMAGE_PLAN_SECONDS }).catch(() => {});
    }
    return imageResponse(result);
  } catch (error) {
    if (storeId) await refundStoreSeconds(getDb(), storeId, IMAGE_PLAN_SECONDS).catch(() => {});
    console.error('Room preview failed', error instanceof Error ? error.message : 'unknown error');
    return fail(502, 'The room preview could not be made right now.');
  }
}
