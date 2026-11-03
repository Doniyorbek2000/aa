import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { garmentFromQuery, liveGarmentUrl, normaliseGarmentUrl, splitDataUrl } from './garment.ts';

describe('garment helpers', () => {
  it('proxies only third-party garment images for the live canvas', () => {
    assert.equal(liveGarmentUrl('https://a12.uz/assets/g.png', 'https://a12.uz'), 'https://a12.uz/assets/g.png');
    assert.equal(liveGarmentUrl('data:image/png;base64,AA', 'https://a12.uz'), 'data:image/png;base64,AA');
    assert.equal(
      liveGarmentUrl('https://cdn.shop.com/a b.jpg?x=1', 'https://a12.uz'),
      'https://a12.uz/api/garment?url=https%3A%2F%2Fcdn.shop.com%2Fa%20b.jpg%3Fx%3D1'
    );
    // a lookalike host must not skip the proxy
    assert.match(liveGarmentUrl('https://a12.uz.evil.com/g.png', 'https://a12.uz'), /^https:\/\/a12\.uz\/api\/garment\?url=/);
  });

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
