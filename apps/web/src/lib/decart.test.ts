import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  DECART_MODEL,
  createRateLimiter,
  decartAllowedOrigins,
  decartPrompt,
  decartTokenOptions,
  isAllowedOrigin,
  maxSessionSeconds,
  maxSessionsPerDay,
} from './decart.ts';

describe('decart config', () => {
  it('keeps only exact https origins and falls back to a12.uz', () => {
    assert.deepEqual(decartAllowedOrigins(' https://shop.uz ,http://evil.com,https://a.uz/path,junk'), ['https://shop.uz']);
    assert.deepEqual(decartAllowedOrigins('http://localhost:3000'), ['http://localhost:3000']);
    assert.deepEqual(decartAllowedOrigins(undefined), ['https://a12.uz', 'https://www.a12.uz']);
  });

  it('matches origins exactly', () => {
    assert.equal(isAllowedOrigin('https://a12.uz', ['https://a12.uz']), true);
    assert.equal(isAllowedOrigin('https://a12.uz.evil.com', ['https://a12.uz']), false);
    assert.equal(isAllowedOrigin(null, ['https://a12.uz']), false);
  });

  it('bounds the daily session budget', () => {
    assert.equal(maxSessionsPerDay('50'), 50);
    assert.equal(maxSessionsPerDay('0'), 20);
    assert.equal(maxSessionsPerDay(undefined), 20);
  });

  it('bounds the session length', () => {
    assert.equal(maxSessionSeconds('300'), 300);
    assert.equal(maxSessionSeconds('5'), 180);
    assert.equal(maxSessionSeconds('lots'), 180);
  });

  it('locks tokens to the try-on model, the origins and a session cap', () => {
    const options = decartTokenOptions(['https://a12.uz'], 120);
    assert.deepEqual(options.allowedModels, [DECART_MODEL]);
    assert.deepEqual(options.allowedOrigins, ['https://a12.uz']);
    assert.equal(options.constraints?.realtime?.maxSessionDuration, 120);
    assert.ok((options.expiresIn ?? 0) <= 60);
  });

  it('tells the model which part of the outfit to replace', () => {
    assert.match(decartPrompt('upper_body'), /top/);
    assert.match(decartPrompt('lower_body'), /trousers or skirt/);
    assert.match(decartPrompt('dresses'), /dress/);
  });
});

describe('createRateLimiter', () => {
  it('allows up to the limit per window and resets after it', () => {
    const allow = createRateLimiter(2, 1000);
    assert.equal(allow('ip', 0), true);
    assert.equal(allow('ip', 10), true);
    assert.equal(allow('ip', 20), false);
    assert.equal(allow('other', 20), true);
    assert.equal(allow('ip', 1000), true);
  });
});
