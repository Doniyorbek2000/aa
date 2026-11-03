import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { cleanPlacement, isSpaceKind, spacePrompt } from './space.ts';

describe('space prompts', () => {
  it('names the item, where it goes, and what must not change', () => {
    const prompt = spacePrompt('furniture', null);
    assert.match(prompt, /^Add the piece of furniture shown in the reference image to this room, standing on the floor/);
    assert.match(prompt, /Keep the walls, floor, other furniture and lighting unchanged/);
    assert.ok(prompt.length < 750, 'within the ~750 character prompt limit');
  });

  it("uses the shopper's placement instead of the default", () => {
    assert.match(spacePrompt('rug', 'under the coffee table'), /this room, under the coffee table\./);
  });

  it('cleans placement text to one short line', () => {
    assert.equal(cleanPlacement('  by the\nwindow \t '), 'by the window');
    assert.equal(cleanPlacement('   '), null);
    assert.equal(cleanPlacement(42), null);
    assert.equal(cleanPlacement('x'.repeat(500))?.length, 120);
  });

  it('accepts only known kinds', () => {
    assert.equal(isSpaceKind('lighting'), true);
    assert.equal(isSpaceKind('car'), false);
  });
});
