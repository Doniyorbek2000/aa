import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { garmentFromQuery, normaliseGarmentUrl, splitDataUrl } from './garment.ts';

describe('garment helpers', () => {
  it('accepts https image links and trims whitespace', () => {
    assert.equal(normaliseGarmentUrl('  https://cdn.shopify.com/a.jpg '), 'https://cdn.shopify.com/a.jpg');
  });

  it('rejects http, credentials, bare hosts, junk and overlong links', () => {
    for (const bad of ['http://x.com/a.jpg', 'https://u:p@x.com/a.jpg', 'https://localhost/a.jpg', 'javascript:alert(1)', '', `https://x.com/${'a'.repeat(2100)}`]) {
      assert.equal(normaliseGarmentUrl(bad), null, bad);
    }
  });

  it('reads the garment param from a deep link query', () => {
    assert.equal(garmentFromQuery({ garment: 'https://x.com/a.png' }), 'https://x.com/a.png');
    assert.equal(garmentFromQuery({ garment: ['https://x.com/a.png'] }), null);
    assert.equal(garmentFromQuery(null), null);
  });

  it('splits result data URLs for sharing', () => {
    assert.deepEqual(splitDataUrl('data:image/jpeg;base64,QUJD'), { base64: 'QUJD', extension: 'jpg', mimeType: 'image/jpeg' });
    assert.equal(splitDataUrl('data:text/html;base64,QUJD'), null);
  });
});
