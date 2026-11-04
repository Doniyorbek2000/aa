'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useDecartLive, type DecartLiveState } from '@/components/use-decart-live';
import type { LiveGarmentKind } from '@/lib/live-pose';

type Garment = { id: string; storeId: string; title: string; imageUrl: string; kind: LiveGarmentKind };
type Props = { stores: { id: string; name: string; widgetKey: string }[]; garments: Garment[] };

const STATUS: Record<DecartLiveState, string> = {
  off: 'Efir boshlanmagan',
  connecting: 'AI ulanmoqda…',
  live: 'AI efirda',
  unavailable: 'AI to‘xtadi (soniyalar tugagan yoki aloqa uzildi)',
};

/** Same-origin copy of a store image, so the browser may read its pixels for the AI. */
const proxied = (url: string) => (url.startsWith(window.location.origin) ? url : `/api/garment?url=${encodeURIComponent(url)}`);

export function LiveShopStudio({ stores, garments }: Props) {
  const [storeId, setStoreId] = useState(stores[0]?.id ?? '');
  const [selected, setSelected] = useState<string | null>(null);
  const [status, setStatus] = useState<DecartLiveState>('off');
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const decart = useDecartLive();
  const store = stores.find((item) => item.id === storeId);
  const items = garments.filter((garment) => garment.storeId === storeId);

  // Draw the AI video when it streams, otherwise the camera, as a mirrored selfie view
  useEffect(() => {
    let frame = 0;
    const draw = () => {
      frame = requestAnimationFrame(draw);
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      const ai = decart.liveVideo();
      const source = ai ?? videoRef.current;
      setStatus(decart.getState());
      if (!canvas || !ctx || !source || source.readyState < 2) return;
      if (canvas.width !== source.videoWidth || canvas.height !== source.videoHeight) {
        canvas.width = source.videoWidth;
        canvas.height = source.videoHeight;
      }
      ctx.save();
      if (!ai) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    };
    draw();
    return () => cancelAnimationFrame(frame);
  }, [decart]);

  const stopAll = useCallback(() => {
    decart.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, [decart]);
  useEffect(() => stopAll, [stopAll]);

  const startShow = async () => {
    if (!store) return;
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      void decart.start(stream, store.widgetKey, { source: 'live-shop', autoRenew: true });
    } catch {
      setError('Kameraga ruxsat bering va qayta urinib ko‘ring.');
    }
  };

  const pick = (garment: Garment) => {
    setSelected(garment.id);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => decart.setGarment(img, garment.kind);
    img.onerror = () => setError('Kiyim rasmini yuklab bo‘lmadi.');
    img.src = proxied(garment.imageUrl);
  };

  const isOn = !!streamRef.current;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div ref={stageRef} className="card" style={{ padding: 0, overflow: 'hidden', background: '#000', position: 'relative' }}>
        <canvas ref={canvasRef} style={{ width: '100%', display: 'block', aspectRatio: '16 / 9', objectFit: 'contain' }} aria-label="Efir ko‘rinishi" />
        <video ref={videoRef} muted playsInline style={{ display: 'none' }} />
        <span className={status === 'live' ? 'badge badge-ok' : 'badge'} style={{ position: 'absolute', top: 12, left: 12 }}>{STATUS[status]}</span>
      </div>
      <div className="form-row">
        {stores.length > 1 && (
          <label className="field">
            <span>Do‘kon</span>
            <select className="select" value={storeId} onChange={(e) => setStoreId(e.target.value)} disabled={isOn}>
              {stores.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
        )}
        {isOn ? (
          <button className="btn btn-danger" type="button" onClick={() => { stopAll(); setStatus('off'); }}>Efirni tugatish</button>
        ) : (
          <button className="btn" type="button" onClick={() => void startShow()}>Efirni boshlash</button>
        )}
        <button className="btn btn-ghost" type="button" onClick={() => void stageRef.current?.requestFullscreen?.()}>To‘liq ekran</button>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="card">
        <h2>Kiyimni tanlang</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12 }}>
          {items.map((garment) => (
            <button
              key={garment.id}
              type="button"
              onClick={() => pick(garment)}
              aria-pressed={selected === garment.id}
              className="card"
              style={{ padding: 8, cursor: 'pointer', borderColor: selected === garment.id ? 'var(--c-accent)' : undefined, display: 'grid', gap: 6, font: 'inherit', textAlign: 'left' }}
            >
              <img src={garment.imageUrl} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'contain', background: 'var(--c-wash)', borderRadius: 8 }} referrerPolicy="no-referrer" />
              <span style={{ fontSize: 13 }}>{garment.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
