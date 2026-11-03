'use client';

import { useCallback, useMemo, useRef } from 'react';
import type { RealTimeClient } from '@decartai/sdk';
import { DECART_MODEL, decartPrompt } from '@/lib/decart';
import type { LiveGarmentKind } from '@/lib/live-pose';

/** off: not started · connecting · live: AI frames are arriving · unavailable: use the free overlay */
export type DecartLiveState = 'off' | 'connecting' | 'live' | 'unavailable';

/** Garment photo on white as JPEG: the model reads a flat product shot best. */
function garmentToJpeg(img: HTMLImageElement): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || 512;
  canvas.height = img.naturalHeight || 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.resolve(null);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
}

/**
 * Decart realtime try-on session for the live studio. State lives in refs because the canvas
 * render loop reads it every frame; nothing here should re-render the modal.
 */
export function useDecartLive() {
  const stateRef = useRef<DecartLiveState>('off');
  const clientRef = useRef<RealTimeClient | null>(null);
  const outputRef = useRef<HTMLVideoElement | null>(null);
  const garmentRef = useRef<{ img: HTMLImageElement; kind: LiveGarmentKind } | null>(null);

  const sendGarment = useCallback(async () => {
    const client = clientRef.current;
    const garment = garmentRef.current;
    if (!client || !garment) return;
    const image = await garmentToJpeg(garment.img);
    if (!image || clientRef.current !== client) return;
    await client.setImage(image, { prompt: decartPrompt(garment.kind), enhance: true }).catch(() => {});
  }, []);

  const stop = useCallback(() => {
    clientRef.current?.disconnect();
    clientRef.current = null;
    if (outputRef.current) outputRef.current.srcObject = null;
    stateRef.current = 'off';
  }, []);

  const start = useCallback(
    async (camera: MediaStream) => {
      if (stateRef.current === 'connecting' || stateRef.current === 'live') return;
      stateRef.current = 'connecting';
      try {
        const res = await fetch('/api/decart-token', { method: 'POST' });
        const data = (await res.json().catch(() => ({}))) as { apiKey?: unknown };
        if (!res.ok || typeof data.apiKey !== 'string') throw new Error('No live AI token');

        const { createDecartClient, models } = await import('@decartai/sdk');
        const output = outputRef.current ?? document.createElement('video');
        output.muted = true;
        output.playsInline = true;
        outputRef.current = output;

        const client = await createDecartClient({ apiKey: data.apiKey }).realtime.connect(camera, {
          model: models.realtime(DECART_MODEL),
          onRemoteStream: (remote) => {
            output.srcObject = remote;
            void output.play().catch(() => {});
          },
        });
        if (stateRef.current !== 'connecting') {
          // The studio closed while we were connecting
          client.disconnect();
          return;
        }
        client.on('connectionChange', (state) => {
          if (state === 'generating') stateRef.current = 'live';
          else if (state === 'disconnected') stateRef.current = 'unavailable';
        });
        // The session cap or an error ends AI mode; the free tracked overlay takes over
        client.on('sessionEnded', () => {
          stateRef.current = 'unavailable';
        });
        client.on('error', () => {
          stateRef.current = 'unavailable';
        });
        clientRef.current = client;
        await sendGarment();
      } catch {
        stateRef.current = 'unavailable';
      }
    },
    [sendGarment]
  );

  const setGarment = useCallback(
    (img: HTMLImageElement, kind: LiveGarmentKind) => {
      garmentRef.current = { img, kind };
      void sendGarment();
    },
    [sendGarment]
  );

  /** The AI-rendered video while it is playing, else null (draw the camera and overlay instead). */
  const liveVideo = useCallback((): HTMLVideoElement | null => {
    const output = outputRef.current;
    return stateRef.current === 'live' && output && output.readyState >= 2 ? output : null;
  }, []);

  // Stable identity: callers list this in effect deps, and re-running them would resend the garment
  return useMemo(() => ({ start, stop, setGarment, liveVideo }), [start, stop, setGarment, liveVideo]);
}
