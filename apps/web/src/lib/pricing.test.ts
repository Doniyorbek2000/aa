import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_MARKUP, costUzs, marginPercent, markupOf, suggestedPriceUzs } from './pricing.ts';

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

  it('reports the margin, negative when the price is below cost', () => {
    assert.equal(marginPercent(1_390_000, 460_800), 67);
    assert.equal(marginPercent(400_000, 460_800), -15);
    assert.equal(marginPercent(0, 100), 0);
  });
});
