import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isVideoPreset, videoJob } from './video.ts';

describe('video ad jobs', () => {
  it('keeps people, product and motion when swapping the background', () => {
    const job = videoJob('background', null, false);
    assert.equal(job?.model, 'lucy-latest');
    assert.match(job?.prompt ?? '', /^Replace the background with a clean bright photo studio.*motion unchanged\.$/);
    assert.match(videoJob('background', 'a sunny beach', false)?.prompt ?? '', /with a sunny beach,/);
  });

  it('needs a color, a garment image or a brief where the preset does', () => {
    assert.equal(videoJob('color', '', false), null);
    assert.match(videoJob('color', 'red', false)?.prompt ?? '', /to red,/);
    assert.equal(videoJob('outfit', null, false), null);
    assert.equal(videoJob('outfit', null, true)?.model, 'lucy-vton-latest');
    assert.equal(videoJob('custom', '  ', false), null);
  });

  it('accepts only known presets', () => {
    assert.equal(isVideoPreset('outfit'), true);
    assert.equal(isVideoPreset('explode'), false);
  });
});
