import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { addLook, MAX_LOOKS, parseLooks, removeLook, type Look } from './looksIndex.ts';
import { COPY, LOCALES } from './copy.ts';

const look = (id: string): Look => ({ id, file: `${id}.png`, createdAt: 1, garmentType: 'upper_body' });

describe('looks index', () => {
  it('parses valid entries and drops malformed or path-traversing ones', () => {
    const json = JSON.stringify([look('a'), { ...look('b'), file: '../../etc/passwd' }, { id: 1 }, { ...look('c'), garmentType: 'hat' }]);
    assert.deepEqual(parseLooks(json).map((l) => l.id), ['a']);
    assert.deepEqual(parseLooks('not json'), []);
    assert.deepEqual(parseLooks(null), []);
  });

  it('adds newest first, de-duplicates, and evicts past the limit', () => {
    const full = Array.from({ length: MAX_LOOKS }, (_, i) => look(`l${i}`));
    const { looks, evicted } = addLook(full, look('new'));
    assert.equal(looks[0]?.id, 'new');
    assert.equal(looks.length, MAX_LOOKS);
    assert.deepEqual(evicted.map((l) => l.id), [`l${MAX_LOOKS - 1}`]);
    assert.equal(addLook([look('x')], look('x')).looks.length, 1);
  });

  it('removes by id without mutating the input', () => {
    const input = [look('a'), look('b')];
    assert.deepEqual(removeLook(input, 'a').map((l) => l.id), ['b']);
    assert.equal(input.length, 2);
  });
});

describe('copy', () => {
  it('every locale has every key the English copy has', () => {
    const keys = (o: object): string[] =>
      Object.entries(o).flatMap(([k, v]) => (typeof v === 'object' ? keys(v).map((s) => `${k}.${s}`) : [k])).sort();
    for (const locale of LOCALES) assert.deepEqual(keys(COPY[locale]), keys(COPY.en), locale);
  });
});
