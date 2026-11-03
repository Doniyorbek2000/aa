import { fetchPublicImage } from '@/lib/public-image';

/**
 * Same-origin proxy for store product images, so the live preview can draw them on a
 * canvas even when the store's CDN sends no CORS headers.
 */
export async function GET(request: Request) {
  const target = new URL(request.url).searchParams.get('url');
  if (!target || target.length > 2048) {
    return Response.json({ error: 'An image url is required' }, { status: 400 });
  }
  try {
    const { bytes, mimeType } = await fetchPublicImage(target);
    return new Response(bytes, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=86400, immutable',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Image could not be fetched.';
    return Response.json({ error: message }, { status: 422 });
  }
}
