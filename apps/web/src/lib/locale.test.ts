import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isLocale, switchLocalePath } from './locale.ts';

test('switchLocalePath replaces the existing locale segment', () => {
  assert.equal(switchLocalePath('/uz/valyuta', 'ru'), '/ru/valyuta');
  assert.equal(switchLocalePath('/ru', 'uz'), '/uz');
});

test('switchLocalePath adds a locale when the path has none', () => {
  assert.equal(switchLocalePath('/', 'ru'), '/ru');
  assert.equal(switchLocalePath('/valyuta/usd-uzs', 'uz'), '/uz/valyuta/usd-uzs');
});

test('isLocale accepts only supported locales', () => {
  assert.equal(isLocale('uz'), true);
  assert.equal(isLocale('en'), false);
  assert.equal(isLocale('UZ'), false);
});
