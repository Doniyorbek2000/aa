import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_GARMENT_CATALOG,
  parseProductUrlToGarment,
} from '../../../../packages/shared-core/src/index.ts';

describe('A12 Shared Core & URL Garment Parser', () => {
  it('provides a rich initial garment catalog with 30 FPS physics parameters', () => {
    assert.ok(INITIAL_GARMENT_CATALOG.length >= 6);
    for (const item of INITIAL_GARMENT_CATALOG) {
      assert.ok(item.id.length > 0);
      assert.ok(item.drapeStiffness > 0 && item.drapeStiffness <= 1);
      assert.ok(item.windResponse > 0 && item.windResponse <= 1);
    }
  });

  it('parses e-commerce product URLs into zero-shot garments with accurate category detection', () => {
    const dress = parseProductUrlToGarment('https://www.zara.com/uz/en/satin-slip-dress-p01234.html');
    assert.equal(dress.storeDomain, 'zara.com');
    assert.equal(dress.silhouetteType, 'dress');
    assert.equal(dress.fabric, 'silk');

    const hoodie = parseProductUrlToGarment('https://ssense.com/en-us/men/oversized-cotton-hoodie');
    assert.equal(hoodie.silhouetteType, 'hoodie');
    assert.equal(hoodie.fabric, 'cotton');
  });
});

