'use client';

import { useEffect, useState } from 'react';
import type { StudioPreset } from '@/lib/studio';

const PRESETS: { value: StudioPreset; label: string }[] = [
  { value: 'white', label: 'Oq fon (katalog)' },
  { value: 'home', label: 'Uy interyerida' },
  { value: 'street', label: 'Ko‘chada' },
  { value: 'color', label: 'Boshqa rangda' },
  { value: 'on_model', label: 'Modelda (kiyim)' },
  { value: 'custom', label: 'O‘z topshirig‘im' },
];

type Props = { stores: { id: string; name: string }[] };

export function StudioForm({ stores }: Props) {
  const [storeId, setStoreId] = useState(stores[0]?.id ?? '');
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [preset, setPreset] = useState<StudioPreset>('white');
  const [extra, setExtra] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [resultName, setResultName] = useState('a12-studio.png');
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);
  useEffect(() => () => void (result && URL.revokeObjectURL(result)), [result]);

  const needsText = preset === 'color' || preset === 'custom';

  const render = async () => {
    if (!image) return;
    setIsBusy(true);
    setError(null);
    const form = new FormData();
    form.set('storeId', storeId);
    form.set('image', image);
    form.set('preset', preset);
    if (extra.trim()) form.set('extra', extra);
    try {
      const res = await fetch('/api/studio/render', { method: 'POST', body: form });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? 'Rasm tayyorlab bo‘lmadi.');
        return;
      }
      const blob = await res.blob();
      setResultName(`a12-studio.${blob.type === 'image/jpeg' ? 'jpg' : 'png'}`);
      setResult(URL.createObjectURL(blob));
    } catch {
      setError('Internet aloqasini tekshirib, qayta urinib ko‘ring.');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="card" style={{ display: 'grid', gap: 12 }}>
        {stores.length > 1 && (
          <label className="field">
            <span>Do‘kon</span>
            <select className="select" value={storeId} onChange={(e) => setStoreId(e.target.value)}>
              {stores.map((store) => <option key={store.id} value={store.id}>{store.name}</option>)}
            </select>
          </label>
        )}
        <label className="field">
          <span>Mahsulot rasmi</span>
          <input
            className="input"
            style={{ paddingTop: 6 }}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setImage(file);
              setPreview(URL.createObjectURL(file));
              setResult(null);
            }}
          />
        </label>
        {preview && <img src={preview} alt="Mahsulot" style={{ maxWidth: 260, borderRadius: 12 }} />}
        <div className="form-row">
          <label className="field">
            <span>Uslub</span>
            <select className="select" value={preset} onChange={(e) => setPreset(e.target.value as StudioPreset)}>
              {PRESETS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          {needsText && (
            <label className="field" style={{ flex: 2 }}>
              <span>{preset === 'color' ? 'Qaysi rang? (inglizcha yaxshiroq: navy blue)' : 'Nima o‘zgarsin? (inglizcha yaxshiroq)'}</span>
              <input className="input" value={extra} maxLength={preset === 'color' ? 40 : 300} onChange={(e) => setExtra(e.target.value)} />
            </label>
          )}
        </div>
        <button className="btn" type="button" disabled={!image || isBusy || (needsText && !extra.trim())} onClick={() => void render()}>
          {isBusy ? 'Tayyorlanmoqda… (10–30 soniya)' : 'Rasm yaratish'}
        </button>
        {error && <p className="error" role="alert">{error}</p>}
      </div>
      {result && (
        <div className="card" style={{ display: 'grid', gap: 12 }}>
          <img src={result} alt="Natija" style={{ width: '100%', borderRadius: 12 }} />
          <a className="btn" href={result} download={resultName} style={{ display: 'inline-flex', alignItems: 'center', justifySelf: 'start', textDecoration: 'none' }}>
            Yuklab olish
          </a>
          <p className="muted">AI tomonidan yaratilgan rasm — joylashdan oldin mahsulot detallarini tekshiring.</p>
        </div>
      )}
    </div>
  );
}
