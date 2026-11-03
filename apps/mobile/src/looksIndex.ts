import { GARMENT_TYPES, type GarmentType } from './garment.ts';

export interface Look {
  id: string;
  file: string;
  createdAt: number;
  garmentType: GarmentType;
}

export const MAX_LOOKS = 200;

/** Parses the stored index, dropping anything malformed instead of failing the whole gallery. */
export function parseLooks(json: string | null): Look[] {
  if (!json) return [];
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return [];
  }
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (l): l is Look =>
      typeof l === 'object' &&
      l !== null &&
      typeof l.id === 'string' &&
      typeof l.file === 'string' &&
      /^[\w-]+\.(png|jpg|webp)$/.test(l.file) &&
      typeof l.createdAt === 'number' &&
      GARMENT_TYPES.includes(l.garmentType)
  );
}

/** Newest first; returns the looks that fell off the end so their files can be deleted. */
export function addLook(looks: readonly Look[], look: Look): { looks: Look[]; evicted: Look[] } {
  const next = [look, ...looks.filter((l) => l.id !== look.id)];
  return { looks: next.slice(0, MAX_LOOKS), evicted: next.slice(MAX_LOOKS) };
}

export function removeLook(looks: readonly Look[], id: string): Look[] {
  return looks.filter((l) => l.id !== id);
}
