import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { STUDIO_PRESETS, cleanLine, isStudioPreset, studioPrompt } from './studio.ts';

describe('studio prompts', () => {
  it('keeps the product unchanged in every fixed preset', () => {
    for (const preset of ['white', 'home', 'street'] as const) {
      assert.match(studioPrompt(preset, null) ?? '', /Keep the product itself exactly the same\.$/);
    }
    assert.match(studioPrompt('on_model', null) ?? '', /details exactly the same\.$/);
  });

  it('needs a color for recolouring and a brief for custom edits', () => {
    assert.equal(studioPrompt('color', null), null);
    assert.match(studioPrompt('color', 'navy blue') ?? '', /^Change the color of the product to navy blue,/);
    assert.equal(studioPrompt('custom', null), null);
    assert.equal(studioPrompt('custom', 'Put it on a marble table'), 'Put it on a marble table');
  });

  it('stays within the prompt length limit', () => {
    for (const preset of STUDIO_PRESETS) {
      assert.ok((studioPrompt(preset, 'x'.repeat(1000)) ?? '').length < 750, preset);
    }
  });

  it('cleans free text and validates presets', () => {
    assert.equal(cleanLine(' a\n b ', 10), 'a b');
    assert.equal(cleanLine('', 10), null);
    assert.equal(isStudioPreset('white'), true);
    assert.equal(isStudioPreset('sepia'), false);
  });
});
