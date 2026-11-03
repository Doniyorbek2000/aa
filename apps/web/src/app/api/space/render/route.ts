import { getDb } from '@/db';
import { chargeStoreSession, recordLiveSession, refundStoreSeconds } from '@/lib/billing';
import { decartAllowedOrigins, isAllowedOrigin, maxSessionsPerDay } from '@/lib/decart';
import { fetchPublicImage, MAX_IMAGE_BYTES } from '@/lib/public-image';
import { clientIp, createRateLimiter } from '@/lib/rate-limit';
import { cleanPlacement, isSpaceKind, SPACE_MODEL, spacePrompt } from '@/lib/space';

export const maxDuration = 90;

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const STORE_KEY = /^[A-Za-z0-9_-]{16,64}$/;
// One 720p image costs what one second of live AI does ($0.02), so it uses a second of the plan
const IMAGE_PLAN_SECONDS = 1;
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
  if (!isAllowedOrigin(request.headers.get('origin'), decartAllowedOrigins(process.env.DECART_ALLOWED_ORIGINS))) {
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

  const upstream = new FormData();
  upstream.set('data', room, 'room');
  upstream.set('reference_image', product, 'product');
  upstream.set('prompt', spacePrompt(kind, placement));
  upstream.set('resolution', '720p');
  try {
    const res = await fetch(`https://api.decart.ai/v1/generate/${SPACE_MODEL}`, {
      method: 'POST',
      headers: { 'X-API-KEY': apiKey },
      body: upstream,
      signal: AbortSignal.timeout(80_000),
    });
    if (!res.ok) throw new Error(`Decart image edit failed (${res.status})`);
    const bytes = await res.arrayBuffer();
    if (hasDb) {
      await recordLiveSession(getDb(), { storeId, userId: null, source: 'space-image', seconds: IMAGE_PLAN_SECONDS }).catch(() => {});
    }
    return new Response(bytes, {
      headers: { 'Content-Type': res.headers.get('content-type') ?? 'image/jpeg', 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    if (storeId) await refundStoreSeconds(getDb(), storeId, IMAGE_PLAN_SECONDS).catch(() => {});
    console.error('Room preview failed', error instanceof Error ? error.message : 'unknown error');
    return fail(502, 'The room preview could not be made right now.');
  }
}
