'use client';

import { useState } from 'react';

type Item = { kind: 'plan' | 'pack'; id: string; name: string; seconds: number; priceUzs: number };
type Props = { stores: { id: string; name: string }[]; items: Item[]; card: { number: string; holder: string; bank: string } };

const som = (value: number) => `${value.toLocaleString('uz-UZ')} so‘m`;

export function PayForm({ stores, items, card }: Props) {
  const [storeId, setStoreId] = useState(stores[0]?.id ?? '');
  const [choice, setChoice] = useState<string>(items[0] ? `${items[0].kind}:${items[0].id}` : '');
  const [receipt, setReceipt] = useState<File | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const selected = items.find((item) => `${item.kind}:${item.id}` === choice);

  const copyCard = async () => {
    await navigator.clipboard?.writeText(card.number.replace(/\s/g, '')).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const send = async () => {
    if (!selected || !receipt) return;
    setIsBusy(true);
    setMessage(null);
    const form = new FormData();
    form.set('storeId', storeId);
    form.set('kind', selected.kind);
    form.set('itemId', selected.id);
    form.set('receipt', receipt);
    try {
      const res = await fetch('/api/payments', { method: 'POST', body: form });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.ok) {
        setMessage({ ok: true, text: 'Chek yuborildi. Tekshirilgach soniyalar qo‘shiladi — odatda bir necha soat ichida.' });
        setReceipt(null);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setMessage({ ok: false, text: data.error ?? 'Yuborib bo‘lmadi.' });
      }
    } catch {
      setMessage({ ok: false, text: 'Internet aloqasini tekshirib, qayta urinib ko‘ring.' });
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <section className="card" style={{ display: 'grid', gap: 12 }}>
        <h2>1. Tanlang</h2>
        {stores.length > 1 && (
          <label className="field">
            <span>Do‘kon</span>
            <select className="select" value={storeId} onChange={(e) => setStoreId(e.target.value)}>
              {stores.map((store) => <option key={store.id} value={store.id}>{store.name}</option>)}
            </select>
          </label>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {items.map((item) => {
            const value = `${item.kind}:${item.id}`;
            const isOn = value === choice;
            return (
              <label key={value} className="stat" style={{ position: 'relative', cursor: 'pointer', borderColor: isOn ? 'var(--c-accent)' : undefined, boxShadow: isOn ? '0 0 0 1px var(--c-accent)' : undefined }}>
                <input type="radio" name="item" value={value} checked={isOn} onChange={() => setChoice(value)} style={{ position: 'absolute', opacity: 0 }} />
                <span>{item.kind === 'plan' ? 'Oylik tarif' : 'Soniya paketi'}</span>
                <b>{item.name}</b>
                <span>{item.seconds.toLocaleString('uz-UZ')} AI soniya{item.kind === 'plan' ? ' / 30 kun' : ''}</span>
                <b style={{ fontSize: 18, marginTop: 6 }}>{som(item.priceUzs)}</b>
              </label>
            );
          })}
        </div>
      </section>

      <section className="card" style={{ display: 'grid', gap: 10 }}>
        <h2>2. Kartaga o‘tkazing</h2>
        <div className="notice" style={{ display: 'grid', gap: 4 }}>
          <span className="muted">Karta raqami</span>
          <b style={{ fontSize: 22, letterSpacing: '0.04em', fontVariantNumeric: 'tabular-nums' }}>{card.number}</b>
          <span>{card.holder}{card.bank ? ` · ${card.bank}` : ''}</span>
          {selected && <span>Summa: <b>{som(selected.priceUzs)}</b></span>}
        </div>
        <button className="btn btn-ghost btn-small" type="button" onClick={() => void copyCard()} style={{ justifySelf: 'start' }}>
          {copied ? 'Nusxa olindi ✓' : 'Karta raqamini nusxalash'}
        </button>
      </section>

      <section className="card" style={{ display: 'grid', gap: 10 }}>
        <h2>3. Chekni yuboring</h2>
        <input className="input" style={{ paddingTop: 6 }} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => setReceipt(e.target.files?.[0] ?? null)} aria-label="To‘lov cheki" />
        <button className="btn" type="button" disabled={!selected || !receipt || isBusy} onClick={() => void send()}>
          {isBusy ? 'Yuborilmoqda…' : 'Chekni yuborish'}
        </button>
        {message && <p className={message.ok ? 'notice' : 'error'} role="status">{message.text}</p>}
      </section>
    </div>
  );
}
