/**
 * Live AI try-on through Decart's realtime Lucy VTON model: the camera streams to Decart over
 * WebRTC and comes back with the garment rendered onto the person, frame by frame.
 * The API key stays on the server; browsers and the app get short-lived, locked-down tokens.
 */
import type { CreateTokenOptions } from '@decartai/sdk';
import type { LiveGarmentKind } from './live-pose';

export const DECART_MODEL = 'lucy-vton-latest';

const DEFAULT_ORIGINS = ['https://a12.uz', 'https://www.a12.uz'];
// A token only has to last until the WebRTC session is open
const TOKEN_TTL_SECONDS = 60;
// Caps what one session can cost; the page falls back to the free tracked overlay afterwards
export const DEFAULT_MAX_SESSION_SECONDS = 180;

/** Comma-separated DECART_ALLOWED_ORIGINS, keeping only well-formed https (or localhost) origins. */
export function decartAllowedOrigins(raw: string | undefined): string[] {
  const origins = (raw ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter((value) => {
      try {
        const url = new URL(value);
        const isSecure = url.protocol === 'https:' || url.hostname === 'localhost';
        return isSecure && url.origin === value;
      } catch {
        return false;
      }
    });
  return origins.length > 0 ? origins : DEFAULT_ORIGINS;
}

export function isAllowedOrigin(origin: string | null, allowed: readonly string[]): boolean {
  return origin !== null && allowed.includes(origin);
}

export function maxSessionSeconds(raw: string | undefined): number {
  const value = Number(raw);
  return Number.isInteger(value) && value >= 10 && value <= 3600 ? value : DEFAULT_MAX_SESSION_SECONDS;
}

// The Origin check stops other websites, not scripts that fake the header, so the whole site
// also has a daily session budget that bounds the worst-case bill
export const DEFAULT_MAX_SESSIONS_PER_DAY = 20;

export function maxSessionsPerDay(raw: string | undefined): number {
  const value = Number(raw);
  return Number.isInteger(value) && value >= 1 && value <= 10_000 ? value : DEFAULT_MAX_SESSIONS_PER_DAY;
}

export function decartTokenOptions(origins: string[], sessionSeconds: number): CreateTokenOptions {
  return {
    expiresIn: TOKEN_TTL_SECONDS,
    allowedModels: [DECART_MODEL],
    allowedOrigins: origins,
    constraints: { realtime: { maxSessionDuration: sessionSeconds } },
  };
}

/** Lucy reproduces the reference image; the prompt says which part of the outfit to replace. */
export function decartPrompt(kind: LiveGarmentKind): string {
  if (kind === 'lower_body') {
    return "Substitute the person's current trousers or skirt with the garment shown in the reference image, keeping their top unchanged";
  }
  if (kind === 'dresses') {
    return "Substitute the person's current clothing with the dress shown in the reference image";
  }
  return "Substitute the person's current top with the garment shown in the reference image, keeping their trousers unchanged";
}
