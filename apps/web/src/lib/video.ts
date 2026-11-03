/**
 * Video ad variants: a shop's product video is re-rendered by Decart in the background
 * (Lucy 2.6 for scene edits, Lucy VTON for outfits). Both bill $0.04 per output second, twice
 * live AI, so each video second takes two seconds of the shop's plan.
 */
import { cleanLine } from './studio.ts';

export const VIDEO_PLAN_SECONDS_PER_SECOND = 2;
export const MAX_VIDEO_SECONDS = 60;
export const MAX_VIDEO_BYTES = 60_000_000;
export const VIDEO_PRESETS = ['background', 'color', 'outfit', 'custom'] as const;
export type VideoPreset = (typeof VIDEO_PRESETS)[number];

export function isVideoPreset(value: unknown): value is VideoPreset {
  return typeof value === 'string' && (VIDEO_PRESETS as readonly string[]).includes(value);
}

/** Which model renders a preset and with what prompt; null when required text or image is missing. */
export function videoJob(
  preset: VideoPreset,
  extraRaw: unknown,
  hasReference: boolean
): { model: 'lucy-latest' | 'lucy-vton-latest'; prompt: string } | null {
  const extra = cleanLine(extraRaw, 300);
  switch (preset) {
    case 'background':
      return {
        model: 'lucy-latest',
        prompt: `Replace the background with ${extra ?? 'a clean bright photo studio with soft even lighting'}, keeping the person, the product and their motion unchanged.`,
      };
    case 'color':
      return extra
        ? { model: 'lucy-latest', prompt: `Change the color of the main product to ${extra.slice(0, 40)}, keeping its material, shape, details and motion unchanged.` }
        : null;
    case 'outfit':
      return hasReference ? { model: 'lucy-vton-latest', prompt: 'Substitute the outfit with the garment shown in the reference image.' } : null;
    case 'custom':
      return extra ? { model: 'lucy-latest', prompt: extra } : null;
  }
}

const DECART_JOBS = 'https://api.decart.ai/v1/jobs';

export async function submitVideoJob(input: {
  apiKey: string;
  model: string;
  video: Blob;
  prompt: string;
  reference: Blob | null;
}): Promise<string> {
  const form = new FormData();
  form.set('data', input.video, 'video.mp4');
  form.set('prompt', input.prompt);
  if (input.reference) form.set('reference_image', input.reference, 'reference');
  form.set('resolution', '720p');
  const res = await fetch(`${DECART_JOBS}/${input.model}`, {
    method: 'POST',
    headers: { 'X-API-KEY': input.apiKey },
    body: form,
    signal: AbortSignal.timeout(120_000),
  });
  const data = (await res.json().catch(() => ({}))) as { job_id?: unknown };
  if (!res.ok || typeof data.job_id !== 'string') throw new Error(`Decart video job failed (${res.status})`);
  return data.job_id;
}

/** pending while Decart works on it; completed or failed when done. */
export async function videoJobStatus(apiKey: string, jobId: string): Promise<'pending' | 'completed' | 'failed'> {
  const res = await fetch(`${DECART_JOBS}/${encodeURIComponent(jobId)}`, {
    headers: { 'X-API-KEY': apiKey },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`Decart job status failed (${res.status})`);
  const { status } = (await res.json()) as { status?: unknown };
  return status === 'completed' ? 'completed' : status === 'failed' ? 'failed' : 'pending';
}

export function videoJobContent(apiKey: string, jobId: string): Promise<Response> {
  return fetch(`${DECART_JOBS}/${encodeURIComponent(jobId)}/content`, {
    headers: { 'X-API-KEY': apiKey },
    signal: AbortSignal.timeout(120_000),
  });
}
