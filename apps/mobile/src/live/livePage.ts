import { PLACEMENT_JS } from './placement';

const MEDIAPIPE = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.0';
const DECART_SDK = 'https://cdn.jsdelivr.net/npm/@decartai/sdk@0.2.14/+esm';
// Same model and prompts as the web studio (apps/web/src/lib/decart.ts)
const DECART_MODEL = 'lucy-vton-latest';
const POSE_MODEL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task';

/**
 * Self-contained page for the live try-on WebView. When the A12 server hands out a Decart
 * token, the camera streams to Decart's realtime Lucy VTON model and the page shows the
 * AI-dressed video it sends back (status 'ai'). Otherwise, or once that session ends, it
 * tracks the body on-device with MediaPipe Pose Landmarker and draws the cut-out garment on
 * the shoulders or hips; those frames never leave the phone. `capture` hands one camera
 * still back to the app for the photo AI try-on.
 *
 * App -> page: window.__a12({type: 'garment', url, kind} | {type: 'facing', value} | {type: 'capture', id})
 * Page -> app: {type: 'ready'} | {type: 'status', value} | {type: 'frame', id, data}
 */
export const LIVE_PAGE_HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
  html, body { margin: 0; height: 100%; background: #000; overflow: hidden; }
  video { display: none; }
  canvas { position: fixed; inset: 0; width: 100%; height: 100%; }
</style>
</head>
<body>
<video id="v" playsinline muted></video>
<video id="ai" playsinline muted></video>
<canvas id="c"></canvas>
<script type="module">
import { FilesetResolver, PoseLandmarker } from '${MEDIAPIPE}/vision_bundle.mjs';
${PLACEMENT_JS}

const video = document.getElementById('v');
const aiVideo = document.getElementById('ai');
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const post = (msg) => window.ReactNativeWebView.postMessage(JSON.stringify(msg));

let stream = null;
let facing = 'front';
let landmarker = null;
let garment = null;
let garmentToken = 0;
let kind = 'upper_body';
let pts = null;
let smooth = null;
let lostAt = 0;
let lastVideoTime = -1;
let lastStatus = '';
let garmentImg = null;
let decart = null;
let isAiLive = false;

const PROMPTS = {
  upper_body: "Substitute the person's current top with the garment shown in the reference image, keeping their trousers unchanged",
  lower_body: "Substitute the person's current trousers or skirt with the garment shown in the reference image, keeping their top unchanged",
  dresses: "Substitute the person's current clothing with the dress shown in the reference image",
};

// Garment photo on white as JPEG: the model reads a flat product shot best
function garmentJpeg(img) {
  const c = document.createElement('canvas');
  c.width = img.naturalWidth || 512;
  c.height = img.naturalHeight || 512;
  const g = c.getContext('2d');
  g.fillStyle = '#fff';
  g.fillRect(0, 0, c.width, c.height);
  g.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.9);
}

// The front camera goes to Decart already mirrored, so its output is a selfie view as-is and the
// "AI Generated" watermark it burns in stays readable
const mirror = document.createElement('canvas');
const mirrorCtx = mirror.getContext('2d');
let mirrorStream = null;

function drawMirror() {
  if (!video.videoWidth) return;
  if (mirror.width !== video.videoWidth || mirror.height !== video.videoHeight) {
    mirror.width = video.videoWidth;
    mirror.height = video.videoHeight;
  }
  mirrorCtx.setTransform(-1, 0, 0, 1, mirror.width, 0);
  mirrorCtx.drawImage(video, 0, 0);
}

function aiInputTrack() {
  if (facing !== 'front') return stream.getVideoTracks()[0];
  if (!mirrorStream) {
    drawMirror();
    mirrorStream = mirror.captureStream(30);
  }
  return mirrorStream.getVideoTracks()[0];
}

async function sendGarmentToAi() {
  if (!decart || !garmentImg) return;
  const client = decart;
  await client.setImage(garmentJpeg(garmentImg), { prompt: PROMPTS[kind] || PROMPTS.upper_body, enhance: true }).catch(() => {});
}

// Photoreal live try-on when the A12 server has a Decart key; any failure leaves the overlay running
async function startAi() {
  try {
    const res = await fetch('/api/decart-token', { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || typeof data.apiKey !== 'string') return;
    const { createDecartClient, models } = await import('${DECART_SDK}');
    const client = await createDecartClient({ apiKey: data.apiKey }).realtime.connect(new MediaStream([aiInputTrack()]), {
      model: models.realtime('${DECART_MODEL}'),
      onRemoteStream: (remote) => {
        aiVideo.srcObject = remote;
        aiVideo.play().catch(() => {});
      },
    });
    const endAi = () => { isAiLive = false; decart = null; smooth = null; };
    client.on('connectionChange', (state) => {
      if (state === 'generating') isAiLive = true;
      else if (state === 'disconnected') endAi();
    });
    client.on('sessionEnded', endAi);
    client.on('error', endAi);
    decart = client;
    await sendGarmentToAi();
  } catch (error) {
    console.warn('a12 live AI unavailable', String(error));
    decart = null;
    isAiLive = false;
  }
}

function setStatus(value) {
  if (value === lastStatus) return;
  lastStatus = value;
  post({ type: 'status', value });
}

async function startCamera() {
  if (stream) stream.getTracks().forEach((t) => t.stop());
  stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: { facingMode: facing === 'front' ? 'user' : 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
  });
  video.srcObject = stream;
  await video.play();
}

// Clears the studio background that touches the image edges (flood fill), so light parts
// of the garment itself survive, then crops to the garment.
function cutout(img) {
  const scale = Math.min(1, 512 / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, 0, 0, w, h);
  const data = g.getImageData(0, 0, w, h);
  const d = data.data;
  const corners = [0, w - 1, (h - 1) * w, h * w - 1];
  const bg = [0, 1, 2].map((k) => corners.reduce((sum, i) => sum + d[i * 4 + k], 0) / 4);
  const far = (o, limit) => Math.hypot(d[o] - bg[0], d[o + 1] - bg[1], d[o + 2] - bg[2]) >= limit;
  const hasStudioBg = corners.every((i) => d[i * 4 + 3] > 200 && !far(i * 4, 40));

  if (hasStudioBg) {
    const seen = new Uint8Array(w * h);
    const queue = new Int32Array(w * h);
    let head = 0;
    let tail = 0;
    const push = (i) => {
      if (seen[i]) return;
      seen[i] = 1;
      if (far(i * 4, 42)) return;
      d[i * 4 + 3] = 0;
      queue[tail++] = i;
    };
    for (let x = 0; x < w; x++) { push(x); push((h - 1) * w + x); }
    for (let y = 0; y < h; y++) { push(y * w); push(y * w + w - 1); }
    while (head < tail) {
      const i = queue[head++];
      const x = i % w;
      if (x > 0) push(i - 1);
      if (x < w - 1) push(i + 1);
      if (i >= w) push(i - w);
      if (i < w * (h - 1)) push(i + w);
    }
    // Fade the light antialiasing fringe along the cut, one pixel ring per pass (two rings);
    // each ring is measured before it changes so it never cascades into the garment
    const cleared = (i) => d[i * 4 + 3] < 128;
    for (let pass = 0; pass < 2; pass++) {
      const fades = [];
      for (let i = 0; i < w * h; i++) {
        if (cleared(i)) continue;
        const x = i % w;
        const touchesCut = (x > 0 && cleared(i - 1)) || (x < w - 1 && cleared(i + 1)) || (i >= w && cleared(i - w)) || (i < w * (h - 1) && cleared(i + w));
        if (touchesCut && !far(i * 4, 110)) {
          const dist = Math.hypot(d[i * 4] - bg[0], d[i * 4 + 1] - bg[1], d[i * 4 + 2] - bg[2]);
          fades.push([i, Math.max(0, Math.min(255, Math.round((255 * (dist - 42)) / 68)))]);
        }
      }
      for (const [i, alpha] of fades) d[i * 4 + 3] = alpha;
    }
    g.putImageData(data, 0, 0);
  }

  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (d[(y * w + x) * 4 + 3] < 24) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < 0) return c;
  const out = document.createElement('canvas');
  out.width = maxX - minX + 1;
  out.height = maxY - minY + 1;
  out.getContext('2d').drawImage(c, minX, minY, out.width, out.height, 0, 0, out.width, out.height);
  return out;
}

async function setGarment(url, nextKind) {
  const token = ++garmentToken;
  kind = nextKind;
  smooth = null;
  if (!url) { garment = null; return; }
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = url;
  try {
    await img.decode();
    if (token !== garmentToken) return;
    garment = cutout(img);
    garmentImg = img;
    await sendGarmentToAi();
  } catch (error) {
    console.warn('a12 garment failed', url.slice(0, 80), String(error));
    if (token === garmentToken) garment = null;
  }
}

// Cover-fits the video into the canvas, like the native camera preview
function layout() {
  const vw = video.videoWidth, vh = video.videoHeight, cw = canvas.width, ch = canvas.height;
  const s = Math.max(cw / vw, ch / vh);
  return { s, vw, vh, cw, ox: (cw - vw * s) / 2, oy: (ch - vh * s) / 2 };
}

function toCanvas(L, p) {
  const x = L.ox + p.x * L.vw * L.s;
  return { x: facing === 'front' ? L.cw - x : x, y: L.oy + p.y * L.vh * L.s, v: p.visibility ?? 1 };
}

function ease(prev, next) {
  if (!prev) return next;
  const a = 0.45;
  return {
    x: prev.x + (next.x - prev.x) * a,
    y: prev.y + (next.y - prev.y) * a,
    w: prev.w + (next.w - prev.w) * a,
    h: prev.h + (next.h - prev.h) * a,
    angle: prev.angle + (next.angle - prev.angle) * a,
  };
}

function frame(now) {
  requestAnimationFrame(frame);
  if (video.readyState < 2 || !video.videoWidth) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cw = Math.round(innerWidth * dpr), ch = Math.round(innerHeight * dpr);
  if (canvas.width !== cw || canvas.height !== ch) { canvas.width = cw; canvas.height = ch; }

  if (mirrorStream && facing === 'front') drawMirror();

  if (isAiLive && aiVideo.readyState >= 2 && aiVideo.videoWidth) {
    // Decart already dressed the person in this frame, and it was sent mirrored, so draw it as-is
    const s = Math.max(cw / aiVideo.videoWidth, ch / aiVideo.videoHeight);
    const dw = aiVideo.videoWidth * s, dh = aiVideo.videoHeight * s;
    ctx.drawImage(aiVideo, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    setStatus('ai');
    return;
  }

  const L = layout();

  ctx.save();
  if (facing === 'front') { ctx.translate(cw, 0); ctx.scale(-1, 1); }
  ctx.drawImage(video, L.ox, L.oy, L.vw * L.s, L.vh * L.s);
  ctx.restore();

  if (landmarker && video.currentTime !== lastVideoTime) {
    lastVideoTime = video.currentTime;
    const lm = landmarker.detectForVideo(video, now).landmarks[0];
    pts = lm
      ? {
          ls: toCanvas(L, lm[11]), rs: toCanvas(L, lm[12]),
          lh: toCanvas(L, lm[23]), rh: toCanvas(L, lm[24]),
          la: toCanvas(L, lm[27]), ra: toCanvas(L, lm[28]),
        }
      : null;
  }
  if (!garment) return;

  const target = pts ? placeGarment(kind, pts, garment.height / garment.width) : null;
  if (target) {
    smooth = ease(smooth, target);
    lostAt = 0;
    setStatus('tracking');
  } else {
    // Keep the garment for a moment through brief tracking drops instead of flickering
    if (!lostAt) lostAt = now;
    if (now - lostAt > 400) smooth = null;
    setStatus(landmarker ? 'nobody' : 'loading');
  }
  if (!smooth) return;

  ctx.save();
  ctx.translate(smooth.x, smooth.y);
  ctx.rotate(smooth.angle);
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = 18 * dpr;
  ctx.shadowOffsetY = 6 * dpr;
  ctx.drawImage(garment, -smooth.w / 2, 0, smooth.w, smooth.h);
  ctx.restore();
}

function capture(id) {
  if (!video.videoWidth) { post({ type: 'frame', id, data: null }); return; }
  const s = Math.min(1, 1024 / Math.max(video.videoWidth, video.videoHeight));
  const c = document.createElement('canvas');
  c.width = Math.round(video.videoWidth * s);
  c.height = Math.round(video.videoHeight * s);
  const g = c.getContext('2d');
  if (facing === 'front') { g.translate(c.width, 0); g.scale(-1, 1); }
  g.drawImage(video, 0, 0, c.width, c.height);
  post({ type: 'frame', id, data: c.toDataURL('image/jpeg', 0.85) });
}

window.__a12 = async (msg) => {
  try {
    if (msg.type === 'garment') await setGarment(msg.url, msg.kind);
    else if (msg.type === 'capture') capture(msg.id);
    else if (msg.type === 'facing' && msg.value !== facing) {
      facing = msg.value;
      smooth = null;
      await startCamera();
      if (decart) await decart.replaceVideoTrack(aiInputTrack());
    }
  } catch (error) {
    post({ type: 'status', value: 'failed', detail: String(error) });
  }
};

(async () => {
  try {
    await startCamera();
  } catch (error) {
    post({ type: 'status', value: 'failed', detail: 'camera: ' + error });
    return;
  }
  post({ type: 'ready' });
  requestAnimationFrame(frame);
  startAi();
  try {
    const files = await FilesetResolver.forVisionTasks('${MEDIAPIPE}/wasm');
    const options = (delegate) => ({
      baseOptions: { modelAssetPath: '${POSE_MODEL}', delegate },
      runningMode: 'VIDEO',
      numPoses: 1,
    });
    landmarker = await PoseLandmarker.createFromOptions(files, options('GPU')).catch(() =>
      PoseLandmarker.createFromOptions(files, options('CPU'))
    );
  } catch (error) {
    post({ type: 'status', value: 'failed', detail: 'model: ' + error });
  }
})();
</script>
</body>
</html>`;
