import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

export const MAX_IMAGE_BYTES = 8_000_000;
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_REDIRECTS = 3;

/** True for loopback, private, link-local, CGNAT, multicast and other non-public addresses. */
export function isNonPublicAddress(address: string): boolean {
  const ip = address.toLowerCase().replace(/^\[|\]$/g, '');
  const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped?.[1]) return isNonPublicAddress(mapped[1]);

  if (isIP(ip) === 4) {
    const [a = 0, b = 0] = ip.split('.').map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19))
    );
  }
  if (isIP(ip) === 6) {
    return (
      ip === '::' ||
      ip === '::1' ||
      ip.startsWith('fc') ||
      ip.startsWith('fd') ||
      ip.startsWith('fe8') ||
      ip.startsWith('fe9') ||
      ip.startsWith('fea') ||
      ip.startsWith('feb') ||
      ip.startsWith('ff')
    );
  }
  return true;
}

/** Throws unless the URL is plain public HTTPS whose host resolves only to public addresses. */
export async function assertPublicHttpsUrl(url: URL): Promise<void> {
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    (url.port && url.port !== '443') ||
    isIP(host) ||
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal')
  ) {
    throw new Error('Only public HTTPS image URLs are supported.');
  }
  // shortcut: checks DNS before fetch, so a rebinding host could still flip between the two; pin the IP with a custom agent if this proxy gets abused
  const addresses = await lookup(host, { all: true });
  if (addresses.length === 0 || addresses.some((a) => isNonPublicAddress(a.address))) {
    throw new Error('Only public HTTPS image URLs are supported.');
  }
}

/** Fetches a public HTTPS image (following up to 3 re-validated redirects) with type and size limits. */
export async function fetchPublicImage(
  input: string
): Promise<{ bytes: Uint8Array<ArrayBuffer>; mimeType: string }> {
  let url = new URL(input);
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublicHttpsUrl(url);
    const res = await fetch(url, {
      headers: { 'User-Agent': 'A12-VTON-Engine/3.3', Accept: 'image/webp,image/jpeg,image/png' },
      redirect: 'manual',
      signal: AbortSignal.timeout(15000),
    });
    if (res.status >= 300 && res.status < 400) {
      const next = res.headers.get('location');
      if (!next) break;
      url = new URL(next, url);
      continue;
    }
    if (!res.ok) throw new Error(`Failed to fetch source image: ${res.status}`);
    const mimeType = (res.headers.get('content-type') ?? '').split(';', 1)[0]?.trim().toLowerCase() ?? '';
    const contentLength = Number(res.headers.get('content-length') ?? 0);
    if (!ALLOWED_MIME_TYPES.has(mimeType) || contentLength > MAX_IMAGE_BYTES) {
      throw new Error('Source image type or size is not supported.');
    }
    const ab = await res.arrayBuffer();
    if (ab.byteLength > MAX_IMAGE_BYTES) throw new Error('Source image is too large.');
    return { bytes: new Uint8Array(ab), mimeType };
  }
  throw new Error('Too many redirects while fetching the image.');
}
