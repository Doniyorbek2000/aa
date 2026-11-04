/** Server-side call to Decart's Lucy Image 2 (image + prompt [+ reference image] → edited image). */
export const IMAGE_MODEL = 'lucy-image-2';
export const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function editImage(input: {
  apiKey: string;
  image: Blob;
  prompt: string;
  reference?: Blob | null;
}): Promise<{ bytes: ArrayBuffer; contentType: string }> {
  const form = new FormData();
  form.set('data', input.image, 'image');
  if (input.reference) form.set('reference_image', input.reference, 'reference');
  form.set('prompt', input.prompt);
  form.set('resolution', '720p');
  const res = await fetch(`https://api.decart.ai/v1/generate/${IMAGE_MODEL}`, {
    method: 'POST',
    headers: { 'X-API-KEY': input.apiKey },
    body: form,
    signal: AbortSignal.timeout(80_000),
  });
  if (!res.ok) throw new Error(`Decart image edit failed (${res.status})`);
  return { bytes: await res.arrayBuffer(), contentType: res.headers.get('content-type') ?? 'image/jpeg' };
}

export function imageResponse(result: { bytes: ArrayBuffer; contentType: string }): Response {
  return new Response(result.bytes, { headers: { 'Content-Type': result.contentType, 'Cache-Control': 'no-store' } });
}
