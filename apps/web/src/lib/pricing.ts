/**
 * What A12 pays Decart and what it charges shops. A shop's balance is counted in plan seconds,
 * one plan second being one second of live AI. Video and images are converted into plan seconds
 * by their Decart price, so changing a price in the admin panel re-prices them everywhere.
 */
export interface DecartPrices {
  /** Lucy VTON real-time try-on, $ per second */
  live: number;
  /** Lucy on a pre-recorded video, $ per generated second */
  video: number;
  /** One studio or room image, $ per image */
  image: number;
}

export const DEFAULT_PRICES: DecartPrices = { live: 0.02, video: 0.04, image: 0.02 };
// Price = Decart cost x markup; 3 leaves ~67% before tax, card fees and free trials
export const DEFAULT_MARKUP = 3;
const MIN_MARKUP = 1;
const MAX_MARKUP = 20;
const MAX_USD_PRICE = 10;
// Suggested prices are rounded up to a tidy so'm amount
const ROUND_TO_UZS = 10_000;

function positiveUsd(raw: string | undefined, fallback: number): number {
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 && value <= MAX_USD_PRICE ? value : fallback;
}

export function pricesOf(settings: { priceLive?: string; priceVideo?: string; priceImage?: string }): DecartPrices {
  return {
    live: positiveUsd(settings.priceLive, DEFAULT_PRICES.live),
    video: positiveUsd(settings.priceVideo, DEFAULT_PRICES.video),
    image: positiveUsd(settings.priceImage, DEFAULT_PRICES.image),
  };
}

/** Plan seconds a video of this many output seconds takes from a shop's balance. */
export function videoPlanSeconds(outputSeconds: number, prices: DecartPrices): number {
  return Math.ceil((outputSeconds * prices.video) / prices.live);
}

/** Plan seconds one studio or room image takes from a shop's balance (at least one). */
export function imagePlanSeconds(prices: DecartPrices): number {
  return Math.max(1, Math.ceil(prices.image / prices.live));
}

export function markupOf(raw: string | undefined): number {
  const value = Number(raw);
  return Number.isFinite(value) && value >= MIN_MARKUP && value <= MAX_MARKUP ? value : DEFAULT_MARKUP;
}

/** Decart's cost of this many plan seconds, in so'm. */
export function costUzs(planSeconds: number, usdRate: number, prices: DecartPrices = DEFAULT_PRICES): number {
  return planSeconds * prices.live * usdRate;
}

/** Decart cost times the markup, rounded up to the next 10 000 so'm. */
export function suggestedPriceUzs(planSeconds: number, usdRate: number, markup: number, prices: DecartPrices = DEFAULT_PRICES): number {
  return Math.ceil((costUzs(planSeconds, usdRate, prices) * markup) / ROUND_TO_UZS) * ROUND_TO_UZS;
}

/** Share of the price left after Decart's cost, in whole percent (negative means a loss). */
export function marginPercent(priceUzs: number, cost: number): number {
  return priceUzs > 0 ? Math.round(((priceUzs - cost) / priceUzs) * 100) : 0;
}
