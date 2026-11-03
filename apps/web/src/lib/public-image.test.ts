import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { assertPublicHttpsUrl, isNonPublicAddress } from './public-image.ts';

describe('public image fetch guard', () => {
  it('flags private, loopback, link-local and mapped addresses', () => {
    for (const ip of ['127.0.0.1', '10.1.2.3', '172.20.0.1', '192.168.1.1', '169.254.169.254', '100.64.0.1', '0.0.0.0', '::1', 'fd00::1', 'fe80::1', '::ffff:10.0.0.1']) {
      assert.equal(isNonPublicAddress(ip), true, ip);
    }
  });

  it('allows ordinary public addresses', () => {
    for (const ip of ['8.8.8.8', '151.101.1.1', '2606:4700::1111']) {
      assert.equal(isNonPublicAddress(ip), false, ip);
    }
  });

  it('rejects non-https, credentials, raw IPs, odd ports and local hostnames before any DNS lookup', async () => {
    for (const u of ['http://cdn.shopify.com/a.jpg', 'https://user:pw@cdn.shopify.com/a.jpg', 'https://8.8.8.8/a.jpg', 'https://cdn.shopify.com:8443/a.jpg', 'https://printer.local/a.jpg', 'https://localhost/a.jpg']) {
      await assert.rejects(assertPublicHttpsUrl(new URL(u)), u);
    }
  });
});
