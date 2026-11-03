/** Form field parsing for the console's server actions; anything malformed becomes null. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function text(form: FormData, name: string, max = 120): string | null {
  const value = form.get(name);
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= max ? trimmed : null;
}

export function int(form: FormData, name: string, min: number, max: number): number | null {
  const value = Number(form.get(name));
  return Number.isInteger(value) && value >= min && value <= max ? value : null;
}

export function uuid(form: FormData, name: string): string | null {
  const value = form.get(name);
  return typeof value === 'string' && UUID.test(value) ? value : null;
}

export function httpsUrl(form: FormData, name: string): string | null {
  const value = text(form, name, 2048);
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.toString() : null;
  } catch {
    return null;
  }
}

export function oneOf<T extends string>(form: FormData, name: string, allowed: readonly T[]): T | null {
  const value = form.get(name);
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : null;
}
