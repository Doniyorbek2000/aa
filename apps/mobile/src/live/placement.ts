/**
 * Garment placement from MediaPipe pose landmarks, kept as plain JS source because it runs
 * inside the live WebView page; placement.test.ts evaluates the same string.
 *
 * placeGarment(kind, pts, aspect) takes points in canvas pixels ({x, y, v} where v is
 * landmark visibility) and the garment's height/width ratio. It returns where to hang the
 * garment: (x, y) is the top-centre anchor, w/h its size and angle the body tilt, or null
 * when the needed landmarks are not visible.
 */
export const PLACEMENT_JS = String.raw`
function placeGarment(kind, pts, aspect) {
  var seen = function (p) { return !!p && p.v > 0.5; };
  var mid = function (a, b) { return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; };
  var dist = function (a, b) { return Math.hypot(a.x - b.x, a.y - b.y); };
  // Line angle folded into -90..90 deg so a mirrored camera never turns the garment upside down
  var tilt = function (a, b) {
    var dx = b.x - a.x, dy = b.y - a.y;
    if (dx < 0) { dx = -dx; dy = -dy; }
    return Math.atan2(dy, dx);
  };

  if (kind === 'lower_body') {
    if (!seen(pts.lh) || !seen(pts.rh)) return null;
    var hip = mid(pts.lh, pts.rh), hipSpan = dist(pts.lh, pts.rh);
    if (hipSpan < 8) return null;
    var waist = { x: hip.x, y: hip.y - hipSpan * 0.35 };
    var w = hipSpan * 2.6, h = w * aspect;
    if (seen(pts.la) && seen(pts.ra)) {
      h = dist(waist, mid(pts.la, pts.ra)) * 1.04;
      w = h / aspect;
    }
    return { x: waist.x, y: waist.y, w: w, h: h, angle: tilt(pts.lh, pts.rh) };
  }

  if (!seen(pts.ls) || !seen(pts.rs)) return null;
  var neck = mid(pts.ls, pts.rs), span = dist(pts.ls, pts.rs);
  if (span < 8) return null;
  // Product photos include spread sleeves, so the garment is about twice the shoulder width
  var width = span * (kind === 'dresses' ? 1.9 : 2.05);
  return { x: neck.x, y: neck.y - span * 0.22, w: width, h: width * aspect, angle: tilt(pts.ls, pts.rs) };
}
`;
