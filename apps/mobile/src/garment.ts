export type GarmentType = 'upper_body' | 'lower_body' | 'dresses';

export const GARMENT_TYPES: readonly GarmentType[] = ['upper_body', 'lower_body', 'dresses'];

/** Demo garments served by the web app, the same three shown on a12.uz/business */
export const DEMO_GARMENT_PATHS = [
  '/assets/one-pager/garment2.png',
  '/assets/one-pager/garment3.png',
  '/assets/one-pager/garment4.png',
] as const;

const MAX_URL_LENGTH = 2048;

/** Accepts only plain https links (the API refuses anything else) and trims stray whitespace. */
export function normaliseGarmentUrl(input: string): string | null {
  const value = input.trim();
  if (value.length === 0 || value.length > MAX_URL_LENGTH) return null;
  if (!/^https:\/\/[^\s/?#@]+\.[^\s/?#@]+([/?#]\S*)?$/i.test(value)) return null;
  return value;
}

/** Reads `garment` from a deep link like a12anywear://try?garment=https://… */
export function garmentFromQuery(params: Record<string, unknown> | null | undefined): string | null {
  const raw = params?.garment;
  return typeof raw === 'string' ? normaliseGarmentUrl(raw) : null;
}

export function dataUrl(base64: string, mimeType = 'image/jpeg'): string {
  return `data:${mimeType};base64,${base64}`;
}

/** Splits a data URL into its base64 payload and file extension, for saving a result to share. */
export function splitDataUrl(url: string): { base64: string; extension: string; mimeType: string } | null {
  const match = url.match(/^data:(image\/(png|jpeg|webp));base64,(.+)$/i);
  if (!match?.[1] || !match[2] || !match[3]) return null;
  const extension = match[2].toLowerCase() === 'jpeg' ? 'jpg' : match[2].toLowerCase();
  return { base64: match[3], extension, mimeType: match[1].toLowerCase() };
}
