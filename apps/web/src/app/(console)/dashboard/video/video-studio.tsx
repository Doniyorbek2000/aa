'use client';

import { useEffect, useState } from 'react';
import type { VideoPreset } from '@/lib/video';

type Job = { id: string; prompt: string; status: 'pending' | 'completed' | 'failed'; videoSeconds: number; createdAt: string };
type Props = { stores: { id: string; name: string }[]; jobs: Job[] };

const PRESETS: { value: VideoPreset; label: string; hint: string }[] = [
  { value: 'background', label: 'Fonni almashtirish', hint: 'Qanday fon? (bo‘sh qolsa — oq studiya; inglizcha yaxshiroq)' },
  { value: 'color', label: 'Mahsulot rangi', hint: 'Qaysi rang? (inglizcha: navy blue)' },
  { value: 'outfit', label: 'Boshqa kiyim (rasm bo‘yicha)', hint: '' },
  { value: 'custom', label: 'O‘z topshirig‘im', hint: 'Nima o‘zgarsin? (inglizcha yaxshiroq)' },
];
const POLL_MS = 8000;
const STATUS_LABEL = { pending: 'tayyorlanmoqda…', completed: 'tayyor', failed: 'xato — daqiqalar qaytarildi' } as const;

export function VideoStudio({ stores, jobs: initialJobs }: Props) {
  const [storeId, setStoreId] = useState(stores[0]?.id ?? '');
  const [video, setVideo] = useState<File | null>(null);
  const [reference, setReference] = useState<File | null>(null);
  const [preset, setPreset] = useState<VideoPreset>('background');
  const [extra, setExtra] = useState('');
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const active = PRESETS.find((item) => item.value === preset);

  // Decart renders in the background; ask about unfinished jobs every few seconds
  const pendingIds = jobs.filter((job) => job.status === 'pending').map((job) => job.id).join(',');
  useEffect(() => {
    if (!pendingIds) return;
    const timer = setInterval(async () => {
      for (const id of pendingIds.split(',')) {
        const res = await fetch(`/api/video/jobs/${id}`).catch(() => null);
        const data = res?.ok ? ((await res.json()) as { status: Job['status'] }) : null;
        if (data && data.status !== 'pending') setJobs((list) => list.map((job) => (job.id === id ? { ...job, status: data.status } : job)));
      }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [pendingIds]);

  const submit = async () => {
    if (!video) return;
    setIsBusy(true);
    setError(null);
    const form = new FormData();
    form.set('storeId', storeId);
    form.set('video', video);
    form.set('preset', preset);
    if (extra.trim()) form.set('extra', extra);
    if (reference) form.set('reference', reference);
    try {
      const res = await fetch('/api/video/jobs', { method: 'POST', body: form });
      const data = (await res.json().catch(() => ({}))) as { id?: string; videoSeconds?: number; error?: string };
      if (!res.ok || !data.id) {
        setError(data.error ?? 'Videoni yuborib bo‘lmadi.');
        return;
      }
      const job: Job = { id: data.id, prompt: active?.label ?? '', status: 'pending', videoSeconds: data.videoSeconds ?? 0, createdAt: new Date().toISOString() };
      setJobs((list) => [job, ...list]);
      setVideo(null);
    } catch {
      setError('Internet aloqasini tekshirib, qayta urinib ko‘ring.');
    } finally {
      setIsBusy(false);
    }
  };

  const ready = !!video && !isBusy && (preset === 'outfit' ? !!reference : preset === 'background' || !!extra.trim());

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
          <span>Video (MP4, 60 soniyagacha, 16:9 yoki 9:16)</span>
          <input className="input" style={{ paddingTop: 6 }} type="file" accept="video/mp4" onChange={(e) => setVideo(e.target.files?.[0] ?? null)} />
        </label>
        <div className="form-row">
          <label className="field">
            <span>Nima qilamiz?</span>
            <select className="select" value={preset} onChange={(e) => setPreset(e.target.value as VideoPreset)}>
              {PRESETS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          {preset === 'outfit' ? (
            <label className="field" style={{ flex: 2 }}>
              <span>Kiyim rasmi (oq fonda)</span>
              <input className="input" style={{ paddingTop: 6 }} type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setReference(e.target.files?.[0] ?? null)} />
            </label>
          ) : (
            <label className="field" style={{ flex: 2 }}>
              <span>{active?.hint}</span>
              <input className="input" value={extra} maxLength={preset === 'color' ? 40 : 300} onChange={(e) => setExtra(e.target.value)} />
            </label>
          )}
        </div>
        <button className="btn" type="button" disabled={!ready} onClick={() => void submit()}>
          {isBusy ? 'Yuborilmoqda…' : 'Video tayyorlash'}
        </button>
        {error && <p className="error" role="alert">{error}</p>}
      </div>

      <div className="card" style={{ display: 'grid', gap: 12 }}>
        <h2>Videolarim</h2>
        {jobs.length === 0 && <p className="muted">Hali video yo‘q.</p>}
        {jobs.map((job) => (
          <div key={job.id} style={{ display: 'grid', gap: 8, borderTop: '1px solid var(--c-line)', paddingTop: 12 }}>
            <p>
              <span className={job.status === 'completed' ? 'badge badge-ok' : job.status === 'failed' ? 'badge badge-off' : 'badge'}>{STATUS_LABEL[job.status]}</span>{' '}
              <span className="muted">{job.videoSeconds} s · {new Date(job.createdAt).toLocaleString('uz-UZ')}</span>
            </p>
            <p className="muted" style={{ fontSize: 13 }}>{job.prompt}</p>
            {job.status === 'completed' && (
              <>
                <video src={`/api/video/jobs/${job.id}/content`} controls playsInline style={{ width: '100%', maxHeight: 480, borderRadius: 12, background: '#000' }} />
                <a className="btn btn-ghost btn-small" href={`/api/video/jobs/${job.id}/content`} download style={{ display: 'inline-flex', alignItems: 'center', justifySelf: 'start', textDecoration: 'none' }}>
                  Yuklab olish
                </a>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
