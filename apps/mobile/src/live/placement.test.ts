import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PLACEMENT_JS } from './placement.ts';

type Pt = { x: number; y: number; v: number };
type Placement = { x: number; y: number; w: number; h: number; angle: number } | null;
const placeGarment = new Function(`${PLACEMENT_JS}; return placeGarment;`)() as (
  kind: string,
  pts: Record<string, Pt>,
  aspect: number
) => Placement;

const pt = (x: number, y: number, v = 0.9): Pt => ({ x, y, v });
const body = { ls: pt(300, 400), rs: pt(500, 400), lh: pt(340, 700), rh: pt(460, 700), la: pt(340, 1200), ra: pt(460, 1200) };

describe('placeGarment', () => {
  it('hangs a top from the shoulders, about twice their width', () => {
    const p = placeGarment('upper_body', body, 1.2);
    assert.ok(p);
    assert.equal(p.x, 400);
    assert.ok(p.y < 400);
    assert.ok(Math.abs(p.w - 410) < 1e-6);
    assert.ok(Math.abs(p.h - p.w * 1.2) < 1e-6);
    assert.equal(p.angle, 0);
  });

  it('keeps the same tilt when the camera is mirrored', () => {
    const tilted = { ...body, ls: pt(300, 380), rs: pt(500, 420) };
    const mirrored = { ...body, ls: pt(500, 420), rs: pt(300, 380) };
    assert.equal(placeGarment('upper_body', tilted, 1)?.angle, placeGarment('upper_body', mirrored, 1)?.angle);
  });

  it('stretches trousers from the waist to the ankles', () => {
    const p = placeGarment('lower_body', body, 2);
    assert.ok(p);
    assert.ok(p.y < 700);
    assert.ok(p.y + p.h > 1200);
    assert.ok(Math.abs(p.w - p.h / 2) < 1e-6);
  });

  it('returns null when the needed landmarks are hidden', () => {
    assert.equal(placeGarment('upper_body', { ...body, ls: pt(300, 400, 0.1) }, 1), null);
    assert.equal(placeGarment('lower_body', { ...body, rh: pt(460, 700, 0.2) }, 1), null);
  });
});
