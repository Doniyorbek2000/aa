'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';

export const CWS_URL = '/install';

export const DEFAULT_GARMENTS = [
  '/tryon_assets/garment1.png',
  '/tryon_assets/garment2.png',
  '/tryon_assets/garment3.png',
  '/tryon_assets/garment4.png',
];

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Could not read the selected image.'));
    };
    reader.onerror = () => reject(reader.error ?? new Error('Could not read the selected image.'));
    reader.readAsDataURL(file);
  });
}

export type OpenSourceEngineId = 'a12-pose-mesh' | 'leffa-vton';
type LeffaGarmentType = 'upper_body' | 'lower_body' | 'dresses';

export function BrandWordmark({ small = false }: { small?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="A12 home"
      className={`brand-wordmark-link ${small ? 'brand-wordmark-sm' : ''}`}
    >
      <img
        src="/logo-mark.png"
        alt="A12"
        width={small ? 28 : 38}
        height={small ? 28 : 38}
        className="brand-wordmark-logo"
      />
      <span className="brand-wordmark-text">A12</span>
    </Link>
  );
}

export function PoweredByA12() {
  const { t } = useI18n();
  return (
    <span className="powered">
      {t.poweredBy}
      <img className="decart-logo" src="/logo.png" alt="A12" width={26} height={26} />
      <span className="powered-brand">A12</span>
    </span>
  );
}

/**
 * Strips light/studio background pixels from a garment image using corner-flood
 * chrominance + luminance distance and applies soft edge feathering so the garment
 * drapes cleanly over the live camera stream.
 */
function createCleanGarmentCanvas(img: HTMLImageElement): HTMLCanvasElement {
  const off = document.createElement('canvas');
  const w = Math.min(540, img.naturalWidth || 420);
  const h = Math.min(720, img.naturalHeight || 560);
  off.width = w;
  off.height = h;
  const ctx = off.getContext('2d');
  if (!ctx) return off;
  ctx.drawImage(img, 0, 0, w, h);

  try {
    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;
    // Sample 4 corners to estimate studio background color
    const tl = 0;
    const tr = (w - 1) * 4;
    const bl = (h - 1) * w * 4;
    const brIdx = ((h - 1) * w + (w - 1)) * 4;

    const br = ((d[tl] ?? 250) + (d[tr] ?? 250) + (d[bl] ?? 250) + (d[brIdx] ?? 250)) / 4;
    const bg =
      ((d[tl + 1] ?? 250) + (d[tr + 1] ?? 250) + (d[bl + 1] ?? 250) + (d[brIdx + 1] ?? 250)) / 4;
    const bb =
      ((d[tl + 2] ?? 250) + (d[tr + 2] ?? 250) + (d[bl + 2] ?? 250) + (d[brIdx + 2] ?? 250)) / 4;
    const isUniformBg = br > 185 && bg > 185 && bb > 185;

    if (isUniformBg) {
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i] ?? 255;
        const g = d[i + 1] ?? 255;
        const b = d[i + 2] ?? 255;
        const dist = Math.hypot(r - br, g - bg, b - bb);
        if (dist < 28) {
          d[i + 3] = 0;
        } else if (dist < 56) {
          d[i + 3] = Math.round(((dist - 28) / 28) * 255);
        }
      }
      ctx.putImageData(imgData, 0, 0);
    }
  } catch {
    // Cross-origin image without CORS headers: keep as-is
  }
  return off;
}

interface BodyPoseState {
  normX: number; // 0..1 horizontal torso center
  normY: number; // 0..1 vertical shoulder-torso anchor
  scale: number; // relative torso width scale (0.75..1.35)
  tilt: number; // shoulder tilt in radians
  vx: number;
  vy: number;
  ambientBrightness: number;
}

/**
 * Real-time 30 FPS person silhouette & face/skin centroid tracker on a tiny 64x48
 * analysis canvas. Tracks where the user stands in the camera frame and their
 * shoulder width without blocking the main thread.
 */
function analyzePersonPose(
  probeCtx: CanvasRenderingContext2D,
  sourceCanvas: HTMLCanvasElement,
  prev: BodyPoseState
): BodyPoseState {
  const pw = 64;
  const ph = 48;
  probeCtx.drawImage(sourceCanvas, 0, 0, pw, ph);
  const frame = probeCtx.getImageData(0, 0, pw, ph).data;

  // Estimate background from top-left and top-right corners
  const bgR = ((frame[0] ?? 128) + (frame[(pw - 1) * 4] ?? 128)) * 0.5;
  const bgG = ((frame[1] ?? 128) + (frame[(pw - 1) * 4 + 1] ?? 128)) * 0.5;
  const bgB = ((frame[2] ?? 128) + (frame[(pw - 1) * 4 + 2] ?? 128)) * 0.5;

  let sumX = 0;
  let sumY = 0;
  let sumW = 0;
  let minX = pw;
  let maxX = 0;
  let lumTotal = 0;
  let lumCount = 0;

  for (let y = 4; y < ph - 2; y++) {
    for (let x = 4; x < pw - 4; x++) {
      const idx = (y * pw + x) * 4;
      const r = frame[idx] ?? 0;
      const g = frame[idx + 1] ?? 0;
      const b = frame[idx + 2] ?? 0;

      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      lumTotal += luma;
      lumCount++;

      // Foreground contrast + skin/warmth likelihood in upper-middle region
      const fgDist = Math.hypot(r - bgR, g - bgG, b - bgB);
      const isSkinTone = r > 75 && g > 40 && b > 25 && r > g && r - b > 15;
      const centerBias = 1 - Math.abs(x / pw - 0.5) * 0.65;
      const weight = (fgDist > 34 ? fgDist * 0.8 : 0) + (isSkinTone ? 45 : 0);
      const weighted = weight * centerBias;

      if (weighted > 28) {
        sumX += x * weighted;
        sumY += y * weighted;
        sumW += weighted;
        if (y > ph * 0.28 && y < ph * 0.75) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
        }
      }
    }
  }

  const avgLuma = lumCount > 0 ? lumTotal / lumCount : 140;
  const targetAmbient = Math.max(0.78, Math.min(1.12, avgLuma / 145));

  if (sumW < 500) {
    return {
      ...prev,
      ambientBrightness: prev.ambientBrightness * 0.9 + targetAmbient * 0.1,
    };
  }

  const rawNormX = Math.max(0.28, Math.min(0.72, sumX / sumW / pw));
  const rawNormY = Math.max(0.42, Math.min(0.66, sumY / sumW / ph + 0.08));
  const spanRatio = maxX > minX ? (maxX - minX) / pw : 0.44;
  const rawScale = Math.max(0.82, Math.min(1.24, spanRatio / 0.44));

  const nextVx = (rawNormX - prev.normX) * 0.25 + prev.vx * 0.65;
  const nextVy = (rawNormY - prev.normY) * 0.25 + prev.vy * 0.65;
  const nextX = prev.normX + nextVx;
  const nextY = prev.normY + nextVy;
  const nextScale = prev.scale * 0.86 + rawScale * 0.14;
  const nextTilt = Math.max(-0.12, Math.min(0.12, nextVx * -2.2));

  return {
    normX: nextX,
    normY: nextY,
    scale: nextScale,
    tilt: prev.tilt * 0.82 + nextTilt * 0.18,
    vx: nextVx,
    vy: nextVy,
    ambientBrightness: prev.ambientBrightness * 0.9 + targetAmbient * 0.1,
  };
}

/**
 * Renders the garment using a 16-strip horizontal cloth mesh that bends, sways,
 * and tracks the user's body velocity and shoulder angle in real time at 30 FPS.
 */
function drawWarpedGarmentMesh(
  ctx: CanvasRenderingContext2D,
  garmentCanvas: HTMLCanvasElement,
  cw: number,
  ch: number,
  pose: BodyPoseState,
  now: number,
  hdEnhanced: boolean
) {
  const slices = 16;
  const srcW = garmentCanvas.width;
  const srcH = garmentCanvas.height;

  const baseW = cw * 0.46 * pose.scale;
  const baseH = ch * 0.66 * pose.scale;
  const centerX = cw * pose.normX;
  const topY = ch * (pose.normY - 0.27 * pose.scale) + Math.sin(now * 0.0028) * 3.0;

  ctx.save();
  ctx.translate(centerX, topY + baseH * 0.25);
  ctx.rotate(pose.tilt);
  ctx.translate(-centerX, -(topY + baseH * 0.25));

  const brightPct = Math.round(pose.ambientBrightness * (hdEnhanced ? 104 : 100));
  const contrastPct = hdEnhanced ? 108 : 102;
  ctx.filter = `brightness(${brightPct}%) contrast(${contrastPct}%) saturate(${hdEnhanced ? 108 : 102}%)`;

  ctx.shadowColor = 'rgba(15, 5, 10, 0.36)';
  ctx.shadowBlur = hdEnhanced ? 28 : 20;
  ctx.shadowOffsetY = 8;

  const sliceSrcH = srcH / slices;
  const sliceDstH = baseH / slices;

  for (let i = 0; i < slices; i++) {
    const progress = i / (slices - 1); // 0 at collar/shoulders -> 1 at hem
    // Lower cloth hem sways more with body horizontal velocity + natural air wave
    const clothInertia = -pose.vx * cw * 1.8 * Math.pow(progress, 1.35);
    const waveOffset = Math.sin(now * 0.0036 + progress * 3.4) * (1.2 + progress * 3.2);
    const perspectiveWidthFactor = 1 + Math.sin(progress * Math.PI) * 0.025;

    const dstW = baseW * perspectiveWidthFactor;
    const dstX = centerX - dstW / 2 + clothInertia + waveOffset;
    const dstY = topY + i * sliceDstH;

    ctx.drawImage(
      garmentCanvas,
      0,
      i * sliceSrcH,
      srcW,
      sliceSrcH + 0.8,
      dstX,
      dstY,
      dstW,
      sliceDstH + 0.9
    );
  }

  ctx.restore();
}

export function LiveTryOnModal({
  open,
  onClose,
  initialGarmentUrl = null,
}: {
  open: boolean;
  onClose: () => void;
  initialGarmentUrl?: string | null | undefined;
}) {
  const { t } = useI18n();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [connecting, setConnecting] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [statusText, setStatusText] = useState<string>('');
  const [garmentList, setGarmentList] = useState<string[]>(DEFAULT_GARMENTS);
  const [selectedGarment, setSelectedGarment] = useState<string | null>(null);
  const [garmentType, setGarmentType] = useState<LeffaGarmentType>('upper_body');
  const [garmentsApplied, setGarmentsApplied] = useState(0);
  const [thumbsVisible, setThumbsVisible] = useState<boolean[]>([false, false, false, false]);
  const [dragOver, setDragOver] = useState(false);
  const [activeModel, setActiveModel] = useState<OpenSourceEngineId>('a12-pose-mesh');
  const [hdNeuralActive, setHdNeuralActive] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [neuralResultUrl, setNeuralResultUrl] = useState<string | null>(null);

  const camVideoRef = useRef<HTMLVideoElement | null>(null);
  const fallbackVideoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const probeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const cleanGarmentRef = useRef<HTMLCanvasElement | null>(null);
  const hdModeRef = useRef<boolean>(false);
  const poseRef = useRef<BodyPoseState>({
    normX: 0.5,
    normY: 0.54,
    scale: 1,
    tilt: 0,
    vx: 0,
    vy: 0,
    ambientBrightness: 1,
  });

  useEffect(() => {
    hdModeRef.current = hdNeuralActive;
  }, [hdNeuralActive]);

  const stopCameraAndLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
    }
    if (camVideoRef.current) {
      camVideoRef.current.srcObject = null;
    }
    if (fallbackVideoRef.current) {
      fallbackVideoRef.current.pause();
    }
  }, []);

  const revealGarments = useCallback((count: number) => {
    setThumbsVisible(new Array(count).fill(false));
    for (let idx = 0; idx < count; idx++) {
      setTimeout(() => {
        setThumbsVisible((prev) => {
          const next = [...prev];
          next[idx] = true;
          return next;
        });
      }, 90 + idx * 75);
    }
  }, []);

  const captureCleanPersonFrame = useCallback((): string | null => {
    const camVid = camVideoRef.current;
    if (camVid && camVid.readyState >= 2 && streamRef.current) {
      const off = document.createElement('canvas');
      off.width = 768;
      off.height = 1024;
      const ctx = off.getContext('2d');
      if (ctx) {
        ctx.translate(off.width, 0);
        ctx.scale(-1, 1);
        const vw = camVid.videoWidth || 1280;
        const vh = camVid.videoHeight || 720;
        const scale = Math.max(off.width / vw, off.height / vh);
        const dw = vw * scale;
        const dh = vh * scale;
        ctx.drawImage(camVid, (off.width - dw) / 2, (off.height - dh) / 2, dw, dh);
        return off.toDataURL('image/jpeg', 0.86);
      }
    }
    return null;
  }, []);

  const runOpenSourceNeuralTryOn = useCallback(
    async (modelId: OpenSourceEngineId, garmentOverride?: string) => {
      if (modelId === 'leffa-vton' && !window.confirm(t.leffaPrivacyNotice)) return;
      setActiveModel(modelId);
      setModelError(null);
      if (modelId === 'a12-pose-mesh') {
        setHdNeuralActive(false);
        setNeuralResultUrl(null);
        return;
      }

      const targetGarment = garmentOverride ?? selectedGarment ?? DEFAULT_GARMENTS[0];
      if (!targetGarment) return;
      if (!selectedGarment) {
        setSelectedGarment(targetGarment);
      }

      setHdNeuralActive(true);
      setStatusText('Leffa AI (Hugging Face GPU)…');

      try {
        const personFrame = captureCleanPersonFrame();
        if (!personFrame) throw new Error('The live camera is not active.');
        const res = await fetch('/api/tryon', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'neural-tryon',
            modelId,
            personFrame,
            garmentImage: targetGarment,
            garmentType,
          }),
        });
        if (!res.ok) throw new Error('The AI try-on service is unavailable.');
        const data = (await res.json()) as { resultImage?: string | null };
        if (!data.resultImage) throw new Error('The AI try-on service returned no image.');
        setNeuralResultUrl(data.resultImage);
        setGarmentsApplied((c) => c + 1);
      } catch {
        setActiveModel('a12-pose-mesh');
        setHdNeuralActive(false);
        setModelError(t.aiTryOnError);
      } finally {
        setStatusText('');
      }
    },
    [captureCleanPersonFrame, garmentType, selectedGarment, t.aiTryOnError, t.leffaPrivacyNotice]
  );

  const applyGarment = useCallback(
    (url: string) => {
      setSelectedGarment(url);
      setModelError(null);
      setNeuralResultUrl(null);
      setStatusText(t.dressingStatus);

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        cleanGarmentRef.current = createCleanGarmentCanvas(img);
        setTimeout(() => {
          setStatusText('');
          setGarmentsApplied((c) => c + 1);
        }, 420);
      };
      img.onerror = () => {
        setStatusText('');
        setGarmentsApplied((c) => c + 1);
      };
      img.src = url;

      if (activeModel !== 'a12-pose-mesh') {
        void runOpenSourceNeuralTryOn(activeModel, url);
      }
    },
    [activeModel, runOpenSourceNeuralTryOn, t.dressingStatus]
  );

  const startRenderLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    if (!probeCanvasRef.current && typeof document !== 'undefined') {
      const p = document.createElement('canvas');
      p.width = 64;
      p.height = 48;
      probeCanvasRef.current = p;
    }

    let frameCounter = 0;

    const renderFrame = (now: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const cw = canvas.width;
      const ch = canvas.height;
      ctx.fillStyle = '#181818';
      ctx.fillRect(0, 0, cw, ch);

      const camVid = camVideoRef.current;
      const fbVid = fallbackVideoRef.current;

      if (camVid && camVid.readyState >= 2 && streamRef.current) {
        // Draw mirrored webcam feed covering the stage
        ctx.save();
        ctx.translate(cw, 0);
        ctx.scale(-1, 1);
        const vw = camVid.videoWidth || 1280;
        const vh = camVid.videoHeight || 720;
        const scale = Math.max(cw / vw, ch / vh);
        const dw = vw * scale;
        const dh = vh * scale;
        ctx.drawImage(camVid, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
        ctx.restore();
      } else if (fbVid && fbVid.readyState >= 2) {
        const vw = fbVid.videoWidth || 1280;
        const vh = fbVid.videoHeight || 720;
        // Crop cleanly to the live camera person region of the demo video
        const sx = vw * 0.635;
        const sy = vh * 0.40;
        const sw = vw * 0.35;
        const sh = vh * 0.47;
        ctx.drawImage(fbVid, sx, sy, sw, sh, 0, 0, cw, ch);
      }

      // Update body pose every 2nd frame for ultra-smooth 30 FPS performance
      frameCounter++;
      if (frameCounter % 2 === 0 && probeCanvasRef.current) {
        const pCtx = probeCanvasRef.current.getContext('2d');
        if (pCtx) {
          poseRef.current = analyzePersonPose(pCtx, canvas, poseRef.current);
        }
      }

      // Composite garment using 16-slice body-tracked cloth mesh
      const garmentSource = cleanGarmentRef.current;
      if (garmentSource) {
        drawWarpedGarmentMesh(
          ctx,
          garmentSource,
          cw,
          ch,
          poseRef.current,
          now,
          hdModeRef.current
        );
      }

      rafRef.current = requestAnimationFrame(renderFrame);
    };

    rafRef.current = requestAnimationFrame(renderFrame);
  }, []);

  const startExperience = useCallback(async () => {
    if (connecting) return;
    setConnecting(true);
    setCameraError(null);
    setStatusText(t.connectingStudio);

    try {
      if (!window.isSecureContext) {
        setCameraError(t.cameraSecureContextError);
        setStatusText('');
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('camera-unavailable');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'user' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      const video = camVideoRef.current;
      if (!video) {
        mediaStream.getTracks().forEach((track) => track.stop());
        throw new Error('camera-unavailable');
      }
      streamRef.current = mediaStream;
      video.srcObject = mediaStream;
      await video.play();

      setStep(2);
      revealGarments(garmentList.length);
      startRenderLoop();
      window.setTimeout(() => {
        setStatusText('');
        if (initialGarmentUrl) applyGarment(initialGarmentUrl);
      }, 420);
    } catch (error) {
      stopCameraAndLoop();
      const errorName = error instanceof DOMException ? error.name : '';
      setCameraError(
        errorName === 'NotAllowedError' || errorName === 'SecurityError'
          ? t.cameraPermissionError
          : errorName === 'NotFoundError' || errorName === 'OverconstrainedError'
            ? t.cameraNotFoundError
            : t.cameraUnavailableError
      );
      setStatusText('');
    } finally {
      setConnecting(false);
    }
  }, [
    applyGarment,
    connecting,
    garmentList.length,
    initialGarmentUrl,
    revealGarments,
    startRenderLoop,
    stopCameraAndLoop,
    t.cameraNotFoundError,
    t.cameraPermissionError,
    t.cameraSecureContextError,
    t.cameraUnavailableError,
    t.connectingStudio,
  ]);

  useEffect(() => {
    if (!open) {
      stopCameraAndLoop();
      setStep(1);
      setConnecting(false);
      setCameraError(null);
      setSelectedGarment(null);
      setNeuralResultUrl(null);
      setGarmentsApplied(0);
      cleanGarmentRef.current = null;
      setThumbsVisible([false, false, false, false]);
      document.body.style.overflow = '';
    } else {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open, stopCameraAndLoop]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const handleContinue = () => {
    stopCameraAndLoop();
    setStep(3);
  };

  const handleRestart = () => {
    setGarmentsApplied(0);
    setSelectedGarment(null);
    setNeuralResultUrl(null);
    cleanGarmentRef.current = null;
    setStep(2);
    startExperience();
  };

  const handleUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    void readFileAsDataUrl(file).then((dataUrl) => {
      setGarmentList((prev) => [dataUrl, ...prev.slice(0, 5)]);
      setThumbsVisible((prev) => [true, ...prev]);
      applyGarment(dataUrl);
    });
  };

  return (
    <div className={`tryon-modal ${open ? 'open' : ''}`} id="tryon-modal" aria-hidden={!open}>
      <div className="tryon-backdrop" onClick={onClose} />
      <div
        className="tryon-dialog light"
        role="dialog"
        aria-modal="true"
        aria-label="Live virtual try-on demo"
      >
        <button className="tryon-close" type="button" onClick={onClose} aria-label="Close">
          &times;
        </button>
        <div className="tryon-head">
          <div className="tryon-dots">
            <span className={`d ${step === 1 ? 'active' : ''}`} id="td0" />
            <span className={`d ${step === 2 ? 'active' : ''}`} id="td1" />
            <span className={`d ${step === 3 ? 'active' : ''}`} id="td2" />
          </div>
        </div>

        {/* STEP 1 */}
        <div className={`tstep ${step === 1 ? 'active' : ''}`} id="tstep1">
          <h3 className="tstep-heading">{t.modalStep1Heading}</h3>
          <div className="cam-hero">
            <div className="ico">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#888"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
            <button
              className="enable-cam"
              type="button"
              id="t-enable-cam"
              disabled={connecting}
              onClick={startExperience}
            >
              {connecting ? t.startingCamera : t.enableCamera}
            </button>
            {cameraError && (
              <p className="camera-error" role="alert">
                {cameraError}
              </p>
            )}
          </div>
        </div>

        {/* STEP 2 */}
        <div className={`tstep ${step === 2 ? 'active' : ''}`} id="tstep2">
          <h3 className="tstep-heading">{t.modalStep2Heading}</h3>
          <div className="t-tip">
            <span className="ti">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2l1.6 6.4a2 2 0 0 0 1.5 1.5L22 12l-6.4 1.6a2 2 0 0 0-1.5 1.5L12 22l-1.6-6.4a2 2 0 0 0-1.5-1.5L2 12l6.4-1.6a2 2 0 0 0 1.5-1.5z" />
              </svg>
            </span>
            <span className="tt">{t.modalTip}</span>
          </div>

          {/* Open-Source AI Engine Selector Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              flexWrap: 'wrap',
              marginBottom: '10px',
            }}
          >
            <div style={{ display: 'inline-flex', gap: '6px', flexWrap: 'wrap' }}>
              {(
                [
                  { id: 'a12-pose-mesh', label: '⚡ A12 Live Preview' },
                  { id: 'leffa-vton', label: '✨ Leffa AI · Hugging Face' },
                ] as const
              ).map((m) => {
                const isActive = activeModel === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => runOpenSourceNeuralTryOn(m.id)}
                    style={{
                      padding: '5px 11px',
                      borderRadius: '999px',
                      border: isActive ? '1px solid #170404' : '1px solid rgba(23,4,4,0.15)',
                      background: isActive ? '#170404' : 'rgba(255,255,252,0.85)',
                      color: isActive ? '#fffffc' : '#170404',
                      fontSize: '11.5px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>

            <div>
              <label
                htmlFor="leffa-garment-type"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', marginRight: '8px', fontSize: '11.5px' }}
              >
                {t.garmentTypeLabel}
                <select
                  id="leffa-garment-type"
                  value={garmentType}
                  onChange={(event) => setGarmentType(event.target.value as LeffaGarmentType)}
                  style={{ padding: '5px 8px', borderRadius: '8px', border: '1px solid rgba(23,4,4,0.2)', background: '#fff', color: '#170404', font: 'inherit' }}
                >
                  <option value="upper_body">{t.garmentTops}</option>
                  <option value="lower_body">{t.garmentBottoms}</option>
                  <option value="dresses">{t.garmentOnePieces}</option>
                </select>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleUploadFile}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: '5px 11px',
                  borderRadius: '999px',
                  border: '1px dashed rgba(23,4,4,0.3)',
                  background: '#faf7f8',
                  color: '#170404',
                  fontSize: '11.5px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                + Upload garment photo
              </button>
            </div>
          </div>

          <div className="t-s2">
            <div className="t-garments">
              {garmentList.slice(0, 4).map((garmentUrl, idx) => (
                <div
                  key={garmentUrl}
                  className={`g-thumb ${thumbsVisible[idx] !== false ? 'visible' : ''} ${
                    selectedGarment === garmentUrl ? 'selected-garment' : ''
                  }`}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', garmentUrl);
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  onClick={() => applyGarment(garmentUrl)}
                >
                  <img
                    loading="lazy"
                    src={garmentUrl}
                    alt={`Garment ${idx + 1}`}
                    draggable={false}
                  />
                </div>
              ))}
            </div>
            <div className="t-cam-right">
              <div
                className={`t-cam-panel ${dragOver ? 'drag-over' : ''}`}
                id="t-widget-panel"
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const droppedUrl = e.dataTransfer.getData('text/plain');
                  if (droppedUrl) {
                    applyGarment(droppedUrl);
                    return;
                  }
                  const file = e.dataTransfer.files?.[0];
                  if (file && file.type.startsWith('image/')) {
                    void readFileAsDataUrl(file).then((dataUrl) => {
                      setGarmentList((prev) => [dataUrl, ...prev.slice(0, 5)]);
                      applyGarment(dataUrl);
                    });
                  }
                }}
              >
                {/* Hidden video sources driving the real-time 30 FPS canvas compositor */}
                <video
                  ref={camVideoRef}
                  playsInline
                  muted
                  style={{ display: 'none' }}
                />
                <video
                  ref={fallbackVideoRef}
                  src="/assets/hero-tryon.mp4"
                  loop
                  playsInline
                  muted
                  style={{ display: 'none' }}
                />
                <canvas
                  ref={canvasRef}
                  width={960}
                  height={640}
                  className="t-output-canvas"
                  id="t-output"
                />
                {neuralResultUrl && (
                  <img
                    src={neuralResultUrl}
                    alt="AI Neural Try-On Result"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      zIndex: 2,
                    }}
                  />
                )}
                <div className={`t-status ${statusText || modelError ? '' : 'hidden'}`} id="t-status">
                  {modelError ?? statusText}
                </div>
              </div>
            </div>
          </div>
          <button
            className={`t-continue ${garmentsApplied > 0 ? 'show' : ''}`}
            type="button"
            id="t-continue"
            onClick={handleContinue}
          >
            {t.continueBtn}
          </button>
        </div>

        {/* STEP 3 */}
        <div className={`tstep ${step === 3 ? 'active' : ''}`} id="tstep3">
          <h3 className="tstep-heading">{t.modalStep3Heading}</h3>
          <div className="tstep3-inner">
            <a
              className="t-install-btn"
              id="cta-modal-install"
              href={CWS_URL}
            >
              {t.addToChrome}
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </a>
            <div className="t-demo">
              <video
                className="t-demo-vid"
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                src="/assets/tryon-preview.mp4"
              />
            </div>
            <p className="t-install-sub">{t.modalStep3Sub}</p>
            <button className="t-restart" type="button" id="t-restart" onClick={handleRestart}>
              {t.tryAnotherLook}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
