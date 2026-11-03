/** Decart account balance for the admin finance view ($1 = 100 credits). */
export const USD_PER_CREDIT = 0.01;
// Decart asks for at most one balance request per second; the admin page needs far less
const CACHE_MS = 60_000;

let cached: { credits: number; at: number } | null = null;

export async function decartCredits(apiKey: string | undefined): Promise<number | null> {
  if (!apiKey) return null;
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.credits;
  try {
    const res = await fetch('https://api.decart.ai/v1/credits', {
      headers: { 'x-api-key': apiKey },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    const { credits } = (await res.json()) as { credits?: unknown };
    if (typeof credits !== 'number') return null;
    cached = { credits, at: Date.now() };
    return credits;
  } catch {
    return null;
  }
}
