/**
 * "See it in your room": a room photo plus a product photo go to Decart's Lucy Image 2, which
 * returns the room with the product placed in it ($0.02 per 720p image).
 */
export const SPACE_MODEL = 'lucy-image-2';
export const SPACE_KINDS = ['furniture', 'decor', 'lighting', 'rug'] as const;
export type SpaceKind = (typeof SPACE_KINDS)[number];

const ITEM: Record<SpaceKind, string> = {
  furniture: 'piece of furniture',
  decor: 'decor item',
  lighting: 'lamp',
  rug: 'rug',
};

const DEFAULT_PLACEMENT: Record<SpaceKind, string> = {
  furniture: 'standing on the floor in a natural free spot',
  decor: 'on a suitable surface or wall',
  lighting: 'where a lamp would naturally stand or hang',
  rug: 'lying flat on the floor in the open area',
};

const MAX_PLACEMENT_CHARS = 120;

/** The shopper's own words on where to put it, cleaned to one short line. */
export function cleanPlacement(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  // eslint-disable-next-line no-control-regex
  const text = raw.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
  return text ? text.slice(0, MAX_PLACEMENT_CHARS) : null;
}

/**
 * One edit, where it goes, and what must stay the same: the shape Decart's image guide
 * recommends (20–40 words, materials and context, nothing else changed).
 */
export function spacePrompt(kind: SpaceKind, placement: string | null): string {
  return (
    `Add the ${ITEM[kind]} shown in the reference image to this room, ${placement ?? DEFAULT_PLACEMENT[kind]}. ` +
    "Keep the walls, floor, other furniture and lighting unchanged, and match the room's perspective, scale and shadows."
  );
}

export function isSpaceKind(value: unknown): value is SpaceKind {
  return typeof value === 'string' && (SPACE_KINDS as readonly string[]).includes(value);
}
