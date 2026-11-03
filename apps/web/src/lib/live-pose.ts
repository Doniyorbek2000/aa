/**
 * Pure helpers for the live try-on: where to hang a garment on MediaPipe pose landmarks and
 * how to cut a product photo out of its studio background. The mobile app runs the same
 * placement inside its WebView (apps/mobile/src/live/placement.ts); keep the two in step.
 */

export type LiveGarmentKind = 'upper_body' | 'lower_body' | 'dresses';

/** A landmark in canvas pixels; v is MediaPipe's visibility score (0..1). */
export interface PosePoint {
  x: number;
  y: number;
  v: number;
}

/** Shoulders, hips and ankles, left/right as MediaPipe labels them. */
export interface BodyPoints {
  ls?: PosePoint | undefined;
  rs?: PosePoint | undefined;
  lh?: PosePoint | undefined;
  rh?: PosePoint | undefined;
  la?: PosePoint | undefined;
  ra?: PosePoint | undefined;
}

/** (x, y) is the garment's top-centre anchor; it is rotated by angle around that point. */
export interface GarmentPlacement {
  x: number;
  y: number;
  w: number;
  h: number;
  angle: number;
}

/** MediaPipe Pose landmark indices for BodyPoints. */
export const POSE_INDEX = { ls: 11, rs: 12, lh: 23, rh: 24, la: 27, ra: 28 } as const;

const MIN_VISIBILITY = 0.5;
const MIN_SPAN_PX = 8;

const isSeen = (p: PosePoint | undefined): p is PosePoint => !!p && p.v > MIN_VISIBILITY;
const midpoint = (a: PosePoint, b: PosePoint) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const distance = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

// Line angle folded into -90..90 deg so a mirrored camera never turns the garment upside down
function tilt(a: PosePoint, b: PosePoint): number {
  let dx = b.x - a.x;
  let dy = b.y - a.y;
  if (dx < 0) {
    dx = -dx;
    dy = -dy;
  }
  return Math.atan2(dy, dx);
}

/** aspect is the garment's height / width. Returns null when the needed landmarks are hidden. */
export function placeGarment(kind: LiveGarmentKind, pts: BodyPoints, aspect: number): GarmentPlacement | null {
  if (kind === 'lower_body') {
    if (!isSeen(pts.lh) || !isSeen(pts.rh)) return null;
    const hipSpan = distance(pts.lh, pts.rh);
    if (hipSpan < MIN_SPAN_PX) return null;
    const hip = midpoint(pts.lh, pts.rh);
    const waist = { x: hip.x, y: hip.y - hipSpan * 0.35 };
    let w = hipSpan * 2.6;
    let h = w * aspect;
    if (isSeen(pts.la) && isSeen(pts.ra)) {
      h = distance(waist, midpoint(pts.la, pts.ra)) * 1.04;
      w = h / aspect;
    }
    return { x: waist.x, y: waist.y, w, h, angle: tilt(pts.lh, pts.rh) };
  }

  if (!isSeen(pts.ls) || !isSeen(pts.rs)) return null;
  const span = distance(pts.ls, pts.rs);
  if (span < MIN_SPAN_PX) return null;
  const neck = midpoint(pts.ls, pts.rs);
  // Product photos include spread sleeves, so the garment is about twice the shoulder width
  const w = span * (kind === 'dresses' ? 1.9 : 2.05);
  return { x: neck.x, y: neck.y - span * 0.22, w, h: w * aspect, angle: tilt(pts.ls, pts.rs) };
}

/** Exponential smoothing so landmark jitter does not shake the garment. */
export function easePlacement(prev: GarmentPlacement | null, next: GarmentPlacement, amount = 0.45): GarmentPlacement {
  if (!prev) return next;
  const lerp = (a: number, b: number) => a + (b - a) * amount;
  return {
    x: lerp(prev.x, next.x),
    y: lerp(prev.y, next.y),
    w: lerp(prev.w, next.w),
    h: lerp(prev.h, next.h),
    angle: lerp(prev.angle, next.angle),
  };
}

const BG_CORNER_TOLERANCE = 40;
const BG_FILL_TOLERANCE = 42;
// Edge pixels closer than this to the background are antialiasing blend, faded instead of kept solid
const BG_HALO_TOLERANCE = 110;
// Product photos blend the edge over about two pixels
const BG_HALO_PASSES = 2;

/**
 * Makes the studio background transparent in an RGBA buffer, in place. Only background that
 * touches the image edges is removed (flood fill), so white or grey parts of the garment
 * itself survive. Returns false when the corners do not look like one plain background.
 */
export function clearEdgeBackground(d: Uint8ClampedArray, w: number, h: number): boolean {
  const corners = [0, w - 1, (h - 1) * w, h * w - 1];
  const bg = [0, 1, 2].map((k) => corners.reduce((sum, i) => sum + (d[i * 4 + k] ?? 0), 0) / 4);
  const colourDistance = (o: number) =>
    Math.hypot((d[o] ?? 0) - (bg[0] ?? 0), (d[o + 1] ?? 0) - (bg[1] ?? 0), (d[o + 2] ?? 0) - (bg[2] ?? 0));
  const hasPlainBg = corners.every((i) => (d[i * 4 + 3] ?? 0) > 200 && colourDistance(i * 4) < BG_CORNER_TOLERANCE);
  if (!hasPlainBg) return false;

  const seen = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let head = 0;
  let tail = 0;
  const visit = (i: number) => {
    if (seen[i]) return;
    seen[i] = 1;
    if (colourDistance(i * 4) >= BG_FILL_TOLERANCE) return;
    d[i * 4 + 3] = 0;
    queue[tail++] = i;
  };
  for (let x = 0; x < w; x++) {
    visit(x);
    visit((h - 1) * w + x);
  }
  for (let y = 0; y < h; y++) {
    visit(y * w);
    visit(y * w + w - 1);
  }
  while (head < tail) {
    const i = queue[head++] ?? 0;
    const x = i % w;
    if (x > 0) visit(i - 1);
    if (x < w - 1) visit(i + 1);
    if (i >= w) visit(i - w);
    if (i < w * (h - 1)) visit(i + w);
  }

  // Fade the light fringe along the cut, one pixel ring per pass; each ring is measured before
  // it is changed so a pass never cascades further into the garment
  const isCleared = (i: number) => (d[i * 4 + 3] ?? 255) < 128;
  for (let pass = 0; pass < BG_HALO_PASSES; pass++) {
    const fades: Array<[number, number]> = [];
    for (let i = 0; i < w * h; i++) {
      if (isCleared(i)) continue;
      const x = i % w;
      const touchesCut =
        (x > 0 && isCleared(i - 1)) || (x < w - 1 && isCleared(i + 1)) || (i >= w && isCleared(i - w)) || (i < w * (h - 1) && isCleared(i + w));
      const dist = colourDistance(i * 4);
      if (touchesCut && dist < BG_HALO_TOLERANCE) {
        fades.push([i, Math.round((255 * (dist - BG_FILL_TOLERANCE)) / (BG_HALO_TOLERANCE - BG_FILL_TOLERANCE))]);
      }
    }
    for (const [i, alpha] of fades) d[i * 4 + 3] = Math.max(0, Math.min(255, alpha));
  }
  return true;
}

/** Bounding box of the visible pixels, used to crop the garment to its real size. */
export function opaqueBounds(d: Uint8ClampedArray, w: number, h: number): { x: number; y: number; w: number; h: number } | null {
  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if ((d[(y * w + x) * 4 + 3] ?? 0) < 24) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  return maxX < 0 ? null : { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}
