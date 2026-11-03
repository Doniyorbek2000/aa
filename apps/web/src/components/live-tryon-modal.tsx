'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { PoseLandmarker } from '@mediapipe/tasks-vision';
import { useI18n } from '@/lib/i18n';
import {
  POSE_INDEX,
  clearEdgeBackground,
  easePlacement,
  opaqueBounds,
  placeGarment,
  type BodyPoints,
  type GarmentPlacement,
} from '@/lib/live-pose';
import { useDecartLive } from './use-decart-live';

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
 * Cuts the garment out of its studio background (edge flood fill, so white parts of the
 * garment survive) and crops it to the garment, keeping the photo's proportions.
 */
function createCleanGarmentCanvas(img: HTMLImageElement): HTMLCanvasElement {
  const off = document.createElement('canvas');
  const scale = Math.min(1, 512 / Math.max(img.naturalWidth || 420, img.naturalHeight || 560));
  const w = Math.max(1, Math.round((img.naturalWidth || 420) * scale));
  const h = Math.max(1, Math.round((img.naturalHeight || 560) * scale));
  off.width = w;
  off.height = h;
  const ctx = off.getContext('2d', { willReadFrequently: true });
  if (!ctx) return off;
  ctx.drawImage(img, 0, 0, w, h);

  try {
    const imgData = ctx.getImageData(0, 0, w, h);
    if (clearEdgeBackground(imgData.data, w, h)) ctx.putImageData(imgData, 0, 0);
    const box = opaqueBounds(imgData.data, w, h);
    if (!box) return off;
    const cropped = document.createElement('canvas');
    cropped.width = box.w;
    cropped.height = box.h;
    cropped.getContext('2d')?.drawImage(off, box.x, box.y, box.w, box.h, 0, 0, box.w, box.h);
    return cropped;
  } catch {
    // Cross-origin image without CORS headers: keep as-is
    return off;
  }
}

const MEDIAPIPE_WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.0/wasm';
const POSE_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task';
// Keep the garment through brief tracking drops instead of flickering
const LOST_BODY_GRACE_MS = 400;

/** Loads MediaPipe Pose (GPU when available) on demand, so the page bundle stays small. */
async function createPoseLandmarker(): Promise<PoseLandmarker> {
  const vision = await import('@mediapipe/tasks-vision');
  const files = await vision.FilesetResolver.forVisionTasks(MEDIAPIPE_WASM);
  const options = (delegate: 'GPU' | 'CPU') => ({
    baseOptions: { modelAssetPath: POSE_MODEL_URL, delegate },
    runningMode: 'VIDEO' as const,
    numPoses: 1,
  });
  return vision.PoseLandmarker.createFromOptions(files, options('GPU')).catch(() =>
    vision.PoseLandmarker.createFromOptions(files, options('CPU'))
  );
}

/** Default spot on the chest when there is no body to track (demo video, model unavailable). */
function centredPlacement(cw: number, ch: number, aspect: number): GarmentPlacement {
  const w = cw * 0.46;
  return { x: cw / 2, y: ch * 0.27, w, h: w * aspect, angle: 0 };
}

/**
 * Draws the garment hung from its tracked anchor as 16 horizontal strips, so the hem
 * trails a little behind sideways body movement (vx, px per frame) like real cloth.
 */
function drawWarpedGarmentMesh(
  ctx: CanvasRenderingContext2D,
  garmentCanvas: HTMLCanvasElement,
  place: GarmentPlacement,
  vx: number,
  now: number,
  hdEnhanced: boolean
) {
  const slices = 16;
  const srcW = garmentCanvas.width;
  const srcH = garmentCanvas.height;

  ctx.save();
  ctx.translate(place.x, place.y);
  ctx.rotate(place.angle);
  if (hdEnhanced) ctx.filter = 'contrast(108%) saturate(108%)';
  ctx.shadowColor = 'rgba(15, 5, 10, 0.36)';
  ctx.shadowBlur = hdEnhanced ? 28 : 20;
  ctx.shadowOffsetY = 8;

  const sliceSrcH = srcH / slices;
  const sliceDstH = place.h / slices;
  for (let i = 0; i < slices; i++) {
    const progress = i / (slices - 1); // 0 at collar/waist -> 1 at hem
    const clothInertia = -vx * 1.8 * Math.pow(progress, 1.35);
    const waveOffset = Math.sin(now * 0.0036 + progress * 3.4) * progress * 2;
    ctx.drawImage(
      garmentCanvas,
      0,
      i * sliceSrcH,
      srcW,
      sliceSrcH + 0.8,
      -place.w / 2 + clothInertia + waveOffset,
      i * sliceDstH,
      place.w,
      sliceDstH + 0.9
    );
  }
  ctx.restore();
}

export function LiveTryOnModal({
  open,
  onClose,
  initialGarmentUrl = null,
  storeKey = null,
}: {
  open: boolean;
  onClose: () => void;
  initialGarmentUrl?: string | null | undefined;
  /** Widget key of the shop that sent the visitor; its plan pays for the live AI minutes. */
  storeKey?: string | null | undefined;
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const cleanGarmentRef = useRef<HTMLCanvasElement | null>(null);
  const hdModeRef = useRef<boolean>(false);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const bodyRef = useRef<BodyPoints | null>(null);
  const placementRef = useRef<GarmentPlacement | null>(null);
  const garmentTypeRef = useRef<LeffaGarmentType>('upper_body');
  const garmentImgRef = useRef<HTMLImageElement | null>(null);
  const decart = useDecartLive();

  useEffect(() => {
    hdModeRef.current = hdNeuralActive;
  }, [hdNeuralActive]);

  useEffect(() => {
    garmentTypeRef.current = garmentType;
    placementRef.current = null;
    if (garmentImgRef.current) decart.setGarment(garmentImgRef.current, garmentType);
  }, [garmentType, decart]);

  useEffect(() => () => landmarkerRef.current?.close(), []);

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
    decart.stop();
  }, [decart]);

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
        garmentImgRef.current = img;
        decart.setGarment(img, garmentTypeRef.current);
        setTimeout(() => {
          setStatusText('');
          setGarmentsApplied((c) => c + 1);
        }, 420);
      };
      img.onerror = () => {
        setStatusText('');
        setGarmentsApplied((c) => c + 1);
      };
      // Store CDNs often send no CORS headers, which would leave the canvas unable to draw them
      img.src = /^https?:\/\//i.test(url) && !url.startsWith(window.location.origin)
        ? `/api/garment?url=${encodeURIComponent(url)}`
        : url;

      if (activeModel !== 'a12-pose-mesh') {
        void runOpenSourceNeuralTryOn(activeModel, url);
      }
    },
    [activeModel, decart, runOpenSourceNeuralTryOn, t.dressingStatus]
  );

  const startRenderLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    let lastVideoTime = -1;
    let lostAt = 0;
    let vx = 0;

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
      const isCameraLive = !!camVid && camVid.readyState >= 2 && !!streamRef.current;
      // Decart's AI-rendered video replaces the camera and the overlay while it is streaming
      const aiVideo = isCameraLive ? decart.liveVideo() : null;

      if (camVid && isCameraLive) {
        // Draw the feed covering the stage as a selfie view; Decart's video arrives already mirrored
        const source = aiVideo ?? camVid;
        ctx.save();
        if (!aiVideo) {
          ctx.translate(cw, 0);
          ctx.scale(-1, 1);
        }
        const vw = source.videoWidth || 1280;
        const vh = source.videoHeight || 720;
        const scale = Math.max(cw / vw, ch / vh);
        const dw = vw * scale;
        const dh = vh * scale;
        ctx.drawImage(source, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
        ctx.restore();

        const landmarker = landmarkerRef.current;
        if (!aiVideo && landmarker && camVid.currentTime !== lastVideoTime) {
          lastVideoTime = camVid.currentTime;
          const lm = landmarker.detectForVideo(camVid, now).landmarks[0];
          // Landmarks are normalised to the video; map them through the same cover-fit and mirror
          const toCanvas = (i: number) => {
            const p = lm?.[i];
            if (!p) return undefined;
            return { x: cw - ((cw - dw) / 2 + p.x * dw), y: (ch - dh) / 2 + p.y * dh, v: p.visibility ?? 1 };
          };
          bodyRef.current = lm
            ? {
                ls: toCanvas(POSE_INDEX.ls),
                rs: toCanvas(POSE_INDEX.rs),
                lh: toCanvas(POSE_INDEX.lh),
                rh: toCanvas(POSE_INDEX.rh),
                la: toCanvas(POSE_INDEX.la),
                ra: toCanvas(POSE_INDEX.ra),
              }
            : null;
        }
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

      const garmentSource = cleanGarmentRef.current;
      if (garmentSource && !aiVideo) {
        const aspect = garmentSource.height / garmentSource.width;
        const isTracking = isCameraLive && !!landmarkerRef.current;
        const body = bodyRef.current;
        const target = isTracking
          ? body && placeGarment(garmentTypeRef.current, body, aspect)
          : centredPlacement(cw, ch, aspect);

        const prev = placementRef.current;
        if (target) {
          placementRef.current = easePlacement(prev, target);
          vx = prev ? placementRef.current.x - prev.x : 0;
          lostAt = 0;
        } else {
          if (!lostAt) lostAt = now;
          if (now - lostAt > LOST_BODY_GRACE_MS) placementRef.current = null;
        }
        if (placementRef.current) {
          drawWarpedGarmentMesh(ctx, garmentSource, placementRef.current, vx, now, hdModeRef.current);
        }
      }

      rafRef.current = requestAnimationFrame(renderFrame);
    };

    rafRef.current = requestAnimationFrame(renderFrame);
  }, [decart]);

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
      // Photoreal AI try-on when the server has a Decart key; otherwise the tracked overlay below
      void decart.start(mediaStream, storeKey);
      // Body tracking arrives a moment later; until then (or if it cannot load) the garment stays centred
      if (!landmarkerRef.current) {
        createPoseLandmarker()
          .then((landmarker) => {
            landmarkerRef.current = landmarker;
          })
          .catch(() => {
            landmarkerRef.current = null;
          });
      }
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
    decart,
    garmentList.length,
    initialGarmentUrl,
    revealGarments,
    startRenderLoop,
    stopCameraAndLoop,
    storeKey,
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

  const handleShareLook = async () => {
    const blob = neuralResultUrl
      ? await fetch(neuralResultUrl).then((r) => r.blob())
      : await new Promise<Blob | null>((resolve) => canvasRef.current?.toBlob(resolve, 'image/jpeg', 0.9) ?? resolve(null));
    if (!blob) return;
    const file = new File([blob], 'a12-try-on.jpg', { type: blob.type || 'image/jpeg' });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: 'A12 Try-On' }).catch(() => {});
      return;
    }
    const link = document.createElement('a');
    link.href = URL.createObjectURL(file);
    link.download = file.name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
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
          {garmentsApplied > 0 && (
            <button
              type="button"
              onClick={() => void handleShareLook()}
              style={{
                display: 'block',
                margin: '10px auto 0',
                padding: '7px 14px',
                borderRadius: '999px',
                border: '1px solid rgba(23,4,4,0.2)',
                background: '#fffffc',
                color: '#170404',
                fontSize: '12.5px',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {t.shareLook}
            </button>
          )}
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
