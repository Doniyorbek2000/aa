/**
 * Product photo studio for shops: one product photo in, a catalogue-ready variant out
 * (Decart Lucy Image 2). Each preset is one edit that keeps the product itself unchanged,
 * as Decart's image prompting guide recommends.
 */
export const STUDIO_PRESETS = ['white', 'home', 'street', 'color', 'on_model', 'custom'] as const;
export type StudioPreset = (typeof STUDIO_PRESETS)[number];

const KEEP = 'Keep the product itself exactly the same.';

const FIXED: Partial<Record<StudioPreset, string>> = {
  white: `Replace the background with a seamless pure white studio backdrop with soft even lighting and a gentle shadow under the product. ${KEEP}`,
  home: `Place the product in a bright modern living room with natural daylight and soft shadows, as a lifestyle catalogue photo. ${KEEP}`,
  street: `Place the product in a stylish city street scene in soft golden-hour light, as a lifestyle catalogue photo. ${KEEP}`,
  on_model:
    "Show this garment worn by a model standing in a bright photo studio, full body, natural pose, keeping the garment's color, pattern and details exactly the same.",
};

/** Free text from the shop owner, cleaned to one line of at most `max` characters. */
export function cleanLine(raw: unknown, max: number): string | null {
  if (typeof raw !== 'string') return null;
  // eslint-disable-next-line no-control-regex
  const text = raw.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
  return text ? text.slice(0, max) : null;
}

export function isStudioPreset(value: unknown): value is StudioPreset {
  return typeof value === 'string' && (STUDIO_PRESETS as readonly string[]).includes(value);
}

/** The prompt for a preset, or null when it needs text that was not given (a color, a custom brief). */
export function studioPrompt(preset: StudioPreset, extra: string | null): string | null {
  if (preset === 'color') {
    return extra ? `Change the color of the product to ${extra.slice(0, 40)}, keeping its material, texture, shape, details and lighting exactly the same.` : null;
  }
  if (preset === 'custom') return extra ? extra.slice(0, 300) : null;
  return FIXED[preset] ?? null;
}
