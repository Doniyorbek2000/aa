import Constants from 'expo-constants';
import type { GarmentType } from './garment';

const extra = Constants.expoConfig?.extra as { apiUrl?: string } | undefined;
export const API_BASE = (process.env.EXPO_PUBLIC_API_URL ?? extra?.apiUrl ?? 'https://a12.uz').replace(/\/$/, '');

// The Hugging Face queue can take a while; the server itself gives up after 150 s
const TRY_ON_TIMEOUT_MS = 160_000;

export function absoluteAssetUrl(path: string): string {
  return path.startsWith('/') ? `${API_BASE}${path}` : path;
}

/** Sends one camera photo and a garment (https URL or data URL) to Leffa via the A12 API. */
export async function requestAiTryOn(
  personFrame: string,
  garmentImage: string,
  garmentType: GarmentType
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TRY_ON_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE}/api/tryon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'neural-tryon', modelId: 'leffa-vton', personFrame, garmentImage, garmentType }),
      signal: controller.signal,
    });
    const data = (await res.json().catch(() => ({}))) as { resultImage?: unknown; error?: unknown };
    if (!res.ok || typeof data.resultImage !== 'string') {
      throw new Error(typeof data.error === 'string' ? data.error : `Try-on failed (${res.status})`);
    }
    return data.resultImage;
  } finally {
    clearTimeout(timer);
  }
}
