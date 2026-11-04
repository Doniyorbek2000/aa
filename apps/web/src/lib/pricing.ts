/**
 * What A12 pays Decart and what it charges shops. Every paid feature is counted in plan seconds:
 * a second of live AI, one studio or room image, or half a second of video ad each cost $0.02.
 */
export const USD_PER_PLAN_SECOND = 0.02;
// Price = Decart cost x markup; 3 leaves ~67% before tax, card fees and free trials
export const DEFAULT_MARKUP = 3;
const MIN_MARKUP = 1;
const MAX_MARKUP = 20;
// Suggested prices are rounded up to a tidy so'm amount
const ROUND_TO_UZS = 10_000;

export function markupOf(raw: string | undefined): number {
  const value = Number(raw);
  return Number.isFinite(value) && value >= MIN_MARKUP && value <= MAX_MARKUP ? value : DEFAULT_MARKUP;
}

export function costUzs(seconds: number, usdRate: number): number {
  return seconds * USD_PER_PLAN_SECOND * usdRate;
}

/** Decart cost times the markup, rounded up to the next 10 000 so'm. */
export function suggestedPriceUzs(seconds: number, usdRate: number, markup: number): number {
  return Math.ceil((costUzs(seconds, usdRate) * markup) / ROUND_TO_UZS) * ROUND_TO_UZS;
}

/** Share of the price left after Decart's cost, in whole percent (negative means a loss). */
export function marginPercent(priceUzs: number, cost: number): number {
  return priceUzs > 0 ? Math.round(((priceUzs - cost) / priceUzs) * 100) : 0;
}
