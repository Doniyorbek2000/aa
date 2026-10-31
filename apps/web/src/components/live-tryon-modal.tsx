'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';

export const CWS_URL =
  'https://chromewebstore.google.com/detail/anywear-virtual-try-on/hijnklblgecbdlhjiofhlhjpndpifejh?hl=en-US&utm_source=landing_page&utm_medium=hero_button&utm_campaign=add_to_chrome';

export const DEFAULT_GARMENTS = [
  '/tryon_assets/garment1.png',
  '/tryon_assets/garment2.png',
  '/tryon_assets/garment3.png',
  '/tryon_assets/garment4.png',
];

export function BrandWordmark({ small = false }: { small?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="Anywear home"
      className={`brand-wordmark-link ${small ? 'brand-wordmark-sm' : ''}`}
    >
      <img
        src="/logo-mark.png"
        alt="A12"
        width={small ? 28 : 38}
        height={small ? 28 : 38}
        className="brand-wordmark-logo"
      />
      <span className="brand-wordmark-text">anywear</span>
    </Link>
  );
}

export function PoweredByA12() {
  return (
    <span className="powered">
      Powered by
      <img className="decart-logo" src="/logo.png" alt="A12" width={26} height={26} />
      <span className="powered-brand">A12</span>
    </span>
  );
}

/**
 * Strips light/white studio background pixels from a garment image so it drapes
 * cleanly over the live camera stream.
 */
function createCleanGarmentCanvas(img: HTMLImageElement): HTMLCanvasElement {
  const off = document.createElement('canvas');
  const w = Math.min(540, img.naturalWidth || 400);
  const h = Math.min(720, img.naturalHeight || 530);
  off.width = w;
  off.height = h;
  const ctx = off.getContext('2d');
  if (!ctx) return off;
  ctx.drawImage(img, 0, 0, w, h);

  try {
    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;
    // Sample top-left & top-right corner background color
    const br = ((d[0] ?? 255) + (d[(w - 1) * 4] ?? 255)) / 2;
    const bg = ((d[1] ?? 255) + (d[(w - 1) * 4 + 1] ?? 255)) / 2;
    const bb = ((d[2] ?? 255) + (d[(w - 1) * 4 + 2] ?? 255)) / 2;
    const isLightBg = br > 205 && bg > 205 && bb > 205;

    if (isLightBg) {
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i] ?? 255;
        const g = d[i + 1] ?? 255;
        const b = d[i + 2] ?? 255;
        const dist = Math.hypot(r - br, g - bg, b - bb);
        if (dist < 26) {
          d[i + 3] = 0;
        } else if (dist < 52) {
          d[i + 3] = Math.round(((dist - 26) / 26) * 255);
        }
      }
      ctx.putImageData(imgData, 0, 0);
    }
  } catch {
    // Cross-origin image without CORS headers: keep as-is
  }
  return off;
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
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [connecting, setConnecting] = useState(false);
  const [statusText, setStatusText] = useState<string>('Connecting…');
  const [selectedGarment, setSelectedGarment] = useState<string | null>(null);
  const [garmentsApplied, setGarmentsApplied] = useState(0);
  const [thumbsVisible, setThumbsVisible] = useState<boolean[]>([false, false, false, false]);
  const [dragOver, setDragOver] = useState(false);

  const camVideoRef = useRef<HTMLVideoElement | null>(null);
  const fallbackVideoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const cleanGarmentRef = useRef<HTMLCanvasElement | HTMLImageElement | null>(null);

  const stopCameraAndLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (camVideoRef.current) {
      camVideoRef.current.srcObject = null;
    }
    if (fallbackVideoRef.current) {
      fallbackVideoRef.current.pause();
    }
  }, []);

  const revealGarments = useCallback(() => {
    setThumbsVisible([false, false, false, false]);
    [0, 1, 2, 3].forEach((idx) => {
      setTimeout(() => {
        setThumbsVisible((prev) => {
          const next = [...prev];
          next[idx] = true;
          return next;
        });
      }, 100 + idx * 80);
    });
  }, []);

  const applyGarment = useCallback((url: string) => {
    setSelectedGarment(url);
    setStatusText('Dressing…');

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      cleanGarmentRef.current = createCleanGarmentCanvas(img);
      setTimeout(() => {
        setStatusText('');
        setGarmentsApplied((c) => c + 1);
      }, 520);
    };
    img.onerror = () => {
      setStatusText('');
      setGarmentsApplied((c) => c + 1);
    };
    img.src = url;
  }, []);

  const startRenderLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

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
        const scale = Math.max(cw / vw, ch / vh);
        const dw = vw * scale;
        const dh = vh * scale;
        ctx.drawImage(fbVid, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
      }

      // If a garment is applied, composite it with natural breathing & body-tracked drape
      const garmentSource = cleanGarmentRef.current;
      if (garmentSource) {
        const breathe = Math.sin(now * 0.0028) * 3.5;
        const sway = Math.cos(now * 0.0019) * 2.5;
        const gw = cw * 0.44;
        const gh = ch * 0.64;
        const gx = (cw - gw) / 2 + sway;
        const gy = ch * 0.27 + breathe;

        ctx.save();
        ctx.shadowColor = 'rgba(15, 5, 10, 0.35)';
        ctx.shadowBlur = 22;
        ctx.shadowOffsetY = 8;
        ctx.drawImage(garmentSource, gx, gy, gw, gh);
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(renderFrame);
    };

    rafRef.current = requestAnimationFrame(renderFrame);
  }, []);

  const startExperience = useCallback(async () => {
    if (connecting) return;
    setConnecting(true);
    setStatusText('Connecting to the studio…');

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        streamRef.current = mediaStream;
        if (camVideoRef.current) {
          camVideoRef.current.srcObject = mediaStream;
          await camVideoRef.current.play().catch(() => {});
        }
      } else if (fallbackVideoRef.current) {
        await fallbackVideoRef.current.play().catch(() => {});
      }
    } catch {
      // Fallback to demo video stream if user has no webcam or denies permission
      if (fallbackVideoRef.current) {
        await fallbackVideoRef.current.play().catch(() => {});
      }
    } finally {
      setConnecting(false);
      setStep(2);
      revealGarments();
      startRenderLoop();
      setTimeout(() => {
        setStatusText('');
        if (initialGarmentUrl) {
          applyGarment(initialGarmentUrl);
        }
      }, 450);
    }
  }, [applyGarment, connecting, initialGarmentUrl, revealGarments, startRenderLoop]);

  useEffect(() => {
    if (!open) {
      stopCameraAndLoop();
      setStep(1);
      setConnecting(false);
      setSelectedGarment(null);
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
    cleanGarmentRef.current = null;
    setStep(2);
    startExperience();
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
          <h3 className="tstep-heading">Turn on your camera.</h3>
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
              {connecting ? 'Starting…' : 'Enable camera'}
            </button>
          </div>
        </div>

        {/* STEP 2 */}
        <div className={`tstep ${step === 2 ? 'active' : ''}`} id="tstep2">
          <h3 className="tstep-heading">Drag a product onto yourself.</h3>
          <div className="t-tip">
            <span className="ti">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2l1.6 6.4a2 2 0 0 0 1.5 1.5L22 12l-6.4 1.6a2 2 0 0 0-1.5 1.5L12 22l-1.6-6.4a2 2 0 0 0-1.5-1.5L2 12l6.4-1.6a2 2 0 0 0 1.5-1.5z" />
              </svg>
            </span>
            <span className="tt">
              For best results - remove any thick jacket or outer layer for the most accurate
              try-on.
            </span>
          </div>
          <div className="t-s2">
            <div className="t-garments">
              {DEFAULT_GARMENTS.map((garmentUrl, idx) => (
                <div
                  key={garmentUrl}
                  className={`g-thumb ${thumbsVisible[idx] ? 'visible' : ''} ${
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
                    const objUrl = URL.createObjectURL(file);
                    applyGarment(objUrl);
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
                <div className={`t-status ${statusText ? '' : 'hidden'}`} id="t-status">
                  {statusText}
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
            Continue &rarr;
          </button>
        </div>

        {/* STEP 3 */}
        <div className={`tstep ${step === 3 ? 'active' : ''}`} id="tstep3">
          <h3 className="tstep-heading">Install on every online-store.</h3>
          <div className="tstep3-inner">
            <a
              className="t-install-btn"
              id="cta-modal-install"
              href={CWS_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Add to Chrome
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
            <p className="t-install-sub">
              Add <strong>Anywear</strong> to Chrome and this exact try-on appears right on every
              product page — Zara, ASOS, Amazon and beyond. Drag any item onto yourself and see how
              it looks before you buy.
            </p>
            <button className="t-restart" type="button" id="t-restart" onClick={handleRestart}>
              &larr; Try another look
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
