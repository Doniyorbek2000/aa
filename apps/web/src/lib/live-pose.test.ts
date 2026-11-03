import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { clearEdgeBackground, easePlacement, opaqueBounds, placeGarment, type PosePoint } from './live-pose.ts';

const pt = (x: number, y: number, v = 0.9): PosePoint => ({ x, y, v });
const body = { ls: pt(300, 400), rs: pt(500, 400), lh: pt(340, 700), rh: pt(460, 700), la: pt(340, 1200), ra: pt(460, 1200) };
const close = (a: number, b: number) => Math.abs(a - b) < 1e-6;

/** w×h white image with a solid square of `rgb` at (x0..x1, y0..y1). */
function image(w: number, h: number, square: [number, number, number, number], rgb: [number, number, number]) {
  const d = new Uint8ClampedArray(w * h * 4).fill(255);
  const [x0, y0, x1, y1] = square;
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) d.set(rgb, (y * w + x) * 4);
  }
  return d;
}

describe('placeGarment', () => {
  it('hangs a top from the shoulders, about twice their width', () => {
    const p = placeGarment('upper_body', body, 1.2);
    assert.ok(p);
    assert.equal(p.x, 400);
    assert.ok(p.y < 400);
    assert.ok(close(p.w, 410));
    assert.ok(close(p.h, p.w * 1.2));
    assert.equal(p.angle, 0);
  });

  it('keeps the same tilt when the camera is mirrored', () => {
    const tilted = placeGarment('upper_body', { ...body, ls: pt(300, 380), rs: pt(500, 420) }, 1);
    const mirrored = placeGarment('upper_body', { ...body, ls: pt(500, 420), rs: pt(300, 380) }, 1);
    assert.equal(tilted?.angle, mirrored?.angle);
  });

  it('stretches trousers from the waist to the ankles', () => {
    const p = placeGarment('lower_body', body, 2);
    assert.ok(p);
    assert.ok(p.y < 700 && p.y + p.h > 1200);
    assert.ok(close(p.w, p.h / 2));
  });

  it('returns null when the needed landmarks are hidden', () => {
    assert.equal(placeGarment('upper_body', { ...body, ls: pt(300, 400, 0.1) }, 1), null);
    assert.equal(placeGarment('lower_body', { ...body, rh: undefined }, 1), null);
  });
});

describe('easePlacement', () => {
  it('moves part of the way toward the new placement', () => {
    const next = easePlacement({ x: 0, y: 0, w: 100, h: 100, angle: 0 }, { x: 100, y: 0, w: 100, h: 100, angle: 0 }, 0.5);
    assert.equal(next.x, 50);
  });
});

describe('clearEdgeBackground', () => {
  it('removes the white studio background but keeps a white patch inside the garment', () => {
    // 10×10 white image, a blue garment from (2,2) to (7,7) with a white hole at (4..5, 4..5)
    const d = image(10, 10, [2, 2, 7, 7], [20, 40, 200]);
    for (const [x, y] of [[4, 4], [5, 4], [4, 5], [5, 5]] as const) d.set([255, 255, 255], (y * 10 + x) * 4);
    assert.equal(clearEdgeBackground(d, 10, 10), true);
    assert.equal(d[3], 0, 'corner is transparent');
    assert.equal(d[(4 * 10 + 4) * 4 + 3], 255, 'enclosed white stays opaque');
    assert.deepEqual(opaqueBounds(d, 10, 10), { x: 2, y: 2, w: 6, h: 6 });
  });

  it('fades a light antialiasing fringe on the cut edge', () => {
    // Blue garment with a pale-blue 1-px border column at x=2 (blend of white and blue)
    const d = image(10, 10, [2, 2, 7, 7], [20, 40, 200]);
    for (let y = 2; y <= 7; y++) d.set([200, 205, 240], (y * 10 + 2) * 4);
    clearEdgeBackground(d, 10, 10);
    const fringe = d[(4 * 10 + 2) * 4 + 3] ?? 255;
    assert.ok(fringe > 0 && fringe < 255, `fringe alpha ${fringe} is partial`);
    assert.equal(d[(4 * 10 + 4) * 4 + 3], 255, 'garment body stays solid');
  });

  it('leaves photos without a plain background untouched', () => {
    const d = image(4, 4, [0, 0, 1, 1], [10, 10, 10]);
    assert.equal(clearEdgeBackground(d, 4, 4), false);
    assert.equal(d[3], 255);
  });
});
