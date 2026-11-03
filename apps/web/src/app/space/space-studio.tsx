'use client';

import { useEffect, useState } from 'react';
import type { SpaceKind } from '@/lib/space';

const KIND_LABELS: Record<SpaceKind, string> = {
  furniture: 'Mebel',
  decor: 'Dekor',
  lighting: 'Chiroq',
  rug: 'Gilam',
};
// Phone photos are 12+ MP; the model works at 720p, so a 1600px side is plenty and uploads fast
const MAX_SIDE = 1600;

async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not read the photo'))), 'image/jpeg', 0.88)
  );
}

type Props = { initialProductUrl: string | null; initialKind: SpaceKind; storeKey: string | null };

export function SpaceStudio({ initialProductUrl, initialKind, storeKey }: Props) {
  const [room, setRoom] = useState<Blob | null>(null);
  const [roomPreview, setRoomPreview] = useState<string | null>(null);
  const [product, setProduct] = useState<File | null>(null);
  const [productPreview, setProductPreview] = useState<string | null>(initialProductUrl);
  const [kind, setKind] = useState<SpaceKind>(initialKind);
  const [placement, setPlacement] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Object URLs hold the image in memory until revoked
  useEffect(() => () => void (roomPreview && URL.revokeObjectURL(roomPreview)), [roomPreview]);
  useEffect(() => () => void (result && URL.revokeObjectURL(result)), [result]);
  useEffect(
    () => () => void (productPreview && productPreview.startsWith('blob:') && URL.revokeObjectURL(productPreview)),
    [productPreview]
  );

  const pickRoom = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    try {
      const small = await shrink(file);
      setRoom(small);
      setRoomPreview(URL.createObjectURL(small));
      setResult(null);
    } catch {
      setError('Rasmni o‘qib bo‘lmadi, boshqa rasm tanlang.');
    }
  };

  const pickProduct = (file: File | undefined) => {
    if (!file) return;
    setProduct(file);
    setProductPreview(URL.createObjectURL(file));
    setResult(null);
  };

  const render = async () => {
    if (!room || (!product && !initialProductUrl)) return;
    setIsBusy(true);
    setError(null);
    const form = new FormData();
    form.set('room', room, 'room.jpg');
    if (product) form.set('product', product);
    else if (initialProductUrl) form.set('productUrl', initialProductUrl);
    form.set('kind', kind);
    if (placement.trim()) form.set('placement', placement);
    if (storeKey) form.set('storeKey', storeKey);
    try {
      const res = await fetch('/api/space/render', { method: 'POST', body: form });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? 'Hozircha natija olib bo‘lmadi, birozdan so‘ng urinib ko‘ring.');
        return;
      }
      setResult(URL.createObjectURL(await res.blob()));
    } catch {
      setError('Internet aloqasini tekshirib, qayta urinib ko‘ring.');
    } finally {
      setIsBusy(false);
    }
  };

  const canRender = !!room && (!!product || !!initialProductUrl) && !isBusy;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="card" style={{ display: 'grid', gap: 12 }}>
        <h2>1. Xonangiz rasmi</h2>
        <input className="input" style={{ paddingTop: 6 }} type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => void pickRoom(e.target.files?.[0])} aria-label="Xona rasmi" />
        {roomPreview && <img src={roomPreview} alt="Xonangiz" style={{ width: '100%', borderRadius: 12 }} />}
      </div>

      <div className="card" style={{ display: 'grid', gap: 12 }}>
        <h2>2. Mahsulot</h2>
        {productPreview && <img src={productPreview} alt="Mahsulot" style={{ maxWidth: 220, borderRadius: 12, background: 'var(--c-wash)' }} referrerPolicy="no-referrer" />}
        <input className="input" style={{ paddingTop: 6 }} type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => pickProduct(e.target.files?.[0])} aria-label="Mahsulot rasmi" />
        <div className="form-row">
          <label className="field">
            <span>Turi</span>
            <select className="select" value={kind} onChange={(e) => setKind(e.target.value as SpaceKind)}>
              {Object.entries(KIND_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="field" style={{ flex: 2 }}>
            <span>Qayerga? (ixtiyoriy)</span>
            <input className="input" value={placement} maxLength={120} placeholder="masalan: deraza yoniga, devorga qaratib" onChange={(e) => setPlacement(e.target.value)} />
          </label>
        </div>
      </div>

      <button className="btn" type="button" disabled={!canRender} onClick={() => void render()}>
        {isBusy ? 'AI joylashtirmoqda… (10–30 soniya)' : 'Xonamda ko‘rish'}
      </button>
      {error && <p className="error" role="alert">{error}</p>}

      {result && (
        <div className="card" style={{ display: 'grid', gap: 12 }}>
          <h2>Natija</h2>
          <img src={result} alt="Mahsulot xonangizda" style={{ width: '100%', borderRadius: 12 }} />
          <div className="form-row">
            <a className="btn" href={result} download="a12-xonam.jpg" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>Yuklab olish</a>
            <button className="btn btn-ghost" type="button" onClick={() => void render()} disabled={isBusy}>Boshqa variant</button>
          </div>
          <p className="muted">Rasm AI tomonidan yaratilgan — o‘lcham va rang taxminiy.</p>
        </div>
      )}
    </div>
  );
}
