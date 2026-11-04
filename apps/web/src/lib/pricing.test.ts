import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_MARKUP,
  DEFAULT_PRICES,
  costUzs,
  imagePlanSeconds,
  marginPercent,
  markupOf,
  pricesOf,
  suggestedPriceUzs,
  videoPlanSeconds,
} from './pricing.ts';

describe('pricing', () => {
  it('prices a second of live AI from the dollar rate', () => {
    assert.equal(costUzs(1, 12_800), 256);
    assert.equal(costUzs(3600, 12_800), 921_600);
  });

  it('suggests cost times markup, rounded up to 10 000 so‘m', () => {
    assert.equal(suggestedPriceUzs(1800, 12_800, 3), 1_390_000);
    assert.equal(suggestedPriceUzs(600, 12_800, 3), 470_000);
  });

  it('falls back to the default markup for missing or silly values', () => {
    assert.equal(markupOf(undefined), DEFAULT_MARKUP);
    assert.equal(markupOf('0.5'), DEFAULT_MARKUP);
    assert.equal(markupOf('abc'), DEFAULT_MARKUP);
    assert.equal(markupOf('2.5'), 2.5);
  });

  it('converts video and images into plan seconds from the Decart prices', () => {
    const prices = pricesOf({});
    assert.deepEqual(prices, DEFAULT_PRICES);
    assert.equal(videoPlanSeconds(10, prices), 20);
    assert.equal(imagePlanSeconds(prices), 1);
    const cheaperVideo = pricesOf({ priceVideo: '0.03' });
    assert.equal(videoPlanSeconds(10, cheaperVideo), 15);
    assert.equal(imagePlanSeconds(pricesOf({ priceImage: '0.05' })), 3);
  });

  it('ignores prices that are missing, zero or absurd', () => {
    assert.deepEqual(pricesOf({ priceLive: '0', priceVideo: '-1', priceImage: '999' }), DEFAULT_PRICES);
  });

  it('prices plan seconds at the live rate the admin set', () => {
    assert.equal(costUzs(100, 12_800, pricesOf({ priceLive: '0.03' })), 38_400);
  });

  it('reports the margin, negative when the price is below cost', () => {
    assert.equal(marginPercent(1_390_000, 460_800), 67);
    assert.equal(marginPercent(400_000, 460_800), -15);
    assert.equal(marginPercent(0, 100), 0);
  });
});
