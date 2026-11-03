import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mp4DurationSeconds } from './mp4.ts';

function box(type: string, body: Uint8Array): Uint8Array {
  const out = new Uint8Array(8 + body.length);
  new DataView(out.buffer).setUint32(0, out.length);
  out.set([...type].map((c) => c.charCodeAt(0)), 4);
  out.set(body, 8);
  return out;
}

function mvhd(version: 0 | 1, timescale: number, duration: number): Uint8Array {
  const body = new Uint8Array(version === 1 ? 32 : 20);
  const view = new DataView(body.buffer);
  view.setUint8(0, version);
  if (version === 1) {
    view.setUint32(20, timescale);
    view.setBigUint64(24, BigInt(duration));
  } else {
    view.setUint32(12, timescale);
    view.setUint32(16, duration);
  }
  return box('mvhd', body);
}

const concat = (...parts: Uint8Array[]) => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const part of parts) {
    out.set(part, at);
    at += part.length;
  }
  return out;
};

describe('mp4DurationSeconds', () => {
  it('reads version 0 and version 1 movie headers after other boxes', () => {
    const ftyp = box('ftyp', new Uint8Array(8));
    const mdat = box('mdat', new Uint8Array(100));
    assert.equal(mp4DurationSeconds(concat(ftyp, mdat, box('moov', mvhd(0, 1000, 12_500)))), 12.5);
    assert.equal(mp4DurationSeconds(concat(ftyp, box('moov', mvhd(1, 600, 18_000)))), 30);
  });

  it('returns null for files that are not readable MP4s', () => {
    assert.equal(mp4DurationSeconds(new Uint8Array([1, 2, 3])), null);
    assert.equal(mp4DurationSeconds(box('ftyp', new Uint8Array(8))), null);
    const broken = box('moov', mvhd(0, 1000, 5000));
    new DataView(broken.buffer).setUint32(0, 9999);
    assert.equal(mp4DurationSeconds(broken), null);
  });
});
