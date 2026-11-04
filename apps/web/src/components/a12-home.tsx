'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { LanguageSwitcher, useI18n } from '@/lib/i18n';
import { homeCopy } from '@/lib/home-copy';
import { BrandWordmark, CWS_URL, LiveTryOnModal, createCleanGarmentCanvas } from './live-tryon-modal';

// Tops only: the mirror's silhouette is cut at the waist. The cut-out keys on the light studio
// background, so white garments do not belong here
const MIRROR_GARMENTS = ['/garments/adm-tshirt.jpg', '/garments/adm-bomber.jpg', '/garments/adm-hoodie.jpg'];
const CYCLE_MS = 3200;

/** Garment photos with their studio background cut away, so they sit on the mirror's silhouette. */
function useCutouts(urls: string[]): (string | null)[] {
  const [cutouts, setCutouts] = useState<(string | null)[]>(() => urls.map(() => null));
  useEffect(() => {
    let isActive = true;
    urls.forEach((url, i) => {
      const img = new Image();
      img.onload = () => {
        if (!isActive) return;
        try {
          const data = createCleanGarmentCanvas(img).toDataURL('image/png');
          setCutouts((prev) => prev.map((c, j) => (j === i ? data : c)));
        } catch {
          // Leave this one out of the mirror; the rail still shows its photo
        }
      };
      img.src = url;
    });
    return () => {
      isActive = false;
    };
  }, [urls]);
  return cutouts;
}

export function A12Home() {
  const { t, locale } = useI18n();
  const c = homeCopy(locale);
  const [isTryOpen, setIsTryOpen] = useState(false);
  const [isHandoffOpen, setIsHandoffOpen] = useState(false);
  const [isHandoffCopied, setIsHandoffCopied] = useState(false);
  const [initialGarment, setInitialGarment] = useState<string | null>(null);
  const [storeKey, setStoreKey] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const [isAuto, setIsAuto] = useState(true);
  const cutouts = useCutouts(MIRROR_GARMENTS);

  useEffect(() => {
    if (!isAuto) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    const timer = setInterval(() => setActive((i) => (i + 1) % MIRROR_GARMENTS.length), CYCLE_MS);
    return () => clearInterval(timer);
  }, [isAuto]);

  // /?try=1 (from a shop's widget) opens the live studio, with the shop's garment and key
  useEffect(() => {
    try {
      const u = new URL(window.location.href);
      if (!u.searchParams.has('try')) return;
      const garment = u.searchParams.get('garment');
      if (garment && /^https:\/\//i.test(garment) && garment.length <= 2048) setInitialGarment(garment);
      const store = u.searchParams.get('store');
      if (store && /^[A-Za-z0-9_-]{16,64}$/.test(store)) setStoreKey(store);
      ['try', 'garment', 'store'].forEach((key) => u.searchParams.delete(key));
      const query = u.searchParams.toString();
      window.history.replaceState(null, '', u.pathname + (query ? `?${query}` : '') + u.hash);
      setTimeout(() => setIsTryOpen(true), 80);
    } catch {
      // A malformed URL just shows the page
    }
  }, []);

  const handleChromeClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (/iPad|iPhone|iPod|Android|Mobile/i.test(navigator.userAgent)) {
      e.preventDefault();
      setIsHandoffOpen(true);
    }
  };

  const copyHandoffLink = () => {
    navigator.clipboard?.writeText(window.location.origin).catch(() => {});
    setIsHandoffCopied(true);
    setTimeout(() => setIsHandoffCopied(false), 2200);
  };

  const shareHandoffLink = () => {
    if (navigator.share) {
      navigator.share({ title: 'A12', text: 'Open this on your computer:', url: window.location.origin }).catch(() => {});
    } else {
      copyHandoffLink();
    }
  };

  const pickGarment = (i: number) => {
    setIsAuto(false);
    setActive(i);
  };

  return (
    <>
      <div className="h-root">
        <header className="h-top">
          <BrandWordmark small />
          <nav className="h-nav" aria-label="Main">
            <Link href="/business">{c.navStores}</Link>
            <Link href="/mobile">{c.navApp}</Link>
            <Link href="/virtual-try-on">{c.navVto}</Link>
          </nav>
          <div className="h-top-actions">
            <LanguageSwitcher />
            <button type="button" className="h-btn h-btn-dark h-btn-sm" onClick={() => setIsTryOpen(true)}>
              {c.tryLive}
            </button>
          </div>
        </header>

        <main>
          <section className="h-hero">
            <div className="h-hero-copy">
              <span className="h-eyebrow">
                <span className="h-pulse" aria-hidden="true" />
                {c.eyebrow}
              </span>
              <h1 className="h-title">
                {c.titleA}
                <span className="h-title-accent">{c.titleB}</span>
              </h1>
              <p className="h-lede">{c.lede}</p>
              <div className="h-cta">
                <button type="button" className="h-btn h-btn-grad" onClick={() => setIsTryOpen(true)}>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M15 10l4.5-2.5v9L15 14M4 7h11v10H4z" strokeLinejoin="round" />
                  </svg>
                  {c.tryLive}
                </button>
                <a className="h-btn h-btn-line" href={CWS_URL} onClick={handleChromeClick}>
                  <img src="/assets/chrome.svg" alt="" aria-hidden="true" width={18} height={18} />
                  <span className="h-only-desktop">{t.addToChrome}</span>
                  <span className="h-only-mobile">{t.addToChromeLaptop}</span>
                </a>
              </div>
              <ul className="h-perks">
                {c.perks.map((perk) => (
                  <li key={perk}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
                      <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {perk}
                  </li>
                ))}
              </ul>
            </div>

            <div className="h-visual">
              <div className="h-mirror" aria-hidden="true">
                <span className="h-corner tl" />
                <span className="h-corner tr" />
                <span className="h-corner bl" />
                <span className="h-corner br" />
                <span className="h-live">
                  <span className="h-pulse" />
                  {c.liveBadge}
                </span>
                <svg className="h-figure" viewBox="0 0 300 400" preserveAspectRatio="xMidYMax meet">
                  <defs>
                    <linearGradient id="h-figure-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="#0d1b2a" stopOpacity="0.2" />
                      <stop offset="1" stopColor="#0d1b2a" stopOpacity="0.08" />
                    </linearGradient>
                  </defs>
                  <g fill="url(#h-figure-fill)">
                    <circle cx="150" cy="100" r="40" />
                    <rect x="131" y="128" width="38" height="96" rx="16" />
                    <path d="M30 400C30 292 78 222 150 212c72 10 120 80 120 188z" />
                  </g>
                </svg>
                {cutouts.map((src, i) =>
                  src ? <img key={i} className={`h-worn ${i === active ? 'on' : ''}`} src={src} alt="" /> : null
                )}
                <span className="h-scan" />
                <span className="h-caption">{c.mirrorCaption}</span>
              </div>

              <div className="h-rail" role="radiogroup" aria-label={c.eyebrow}>
                {MIRROR_GARMENTS.map((src, i) => (
                  <button
                    key={src}
                    type="button"
                    role="radio"
                    aria-checked={i === active}
                    aria-label={`${i + 1}`}
                    className={`h-rail-item ${i === active ? 'on' : ''}`}
                    onClick={() => pickGarment(i)}
                  >
                    <img src={src} alt="" width={72} height={90} />
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="h-steps" aria-labelledby="h-steps-title">
            <h2 id="h-steps-title" className="h-h2">
              {c.stepsTitle}
            </h2>
            <ol className="h-step-list">
              {c.steps.map((step, i) => (
                <li key={step.title} className="h-step">
                  <span className="h-step-num">{String(i + 1).padStart(2, '0')}</span>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="h-split">
            <Link href="/business" className="h-card h-card-dark">
              <h2 className="h-h2">{c.shopTitle}</h2>
              <p>{c.shopBody}</p>
              <span className="h-card-link">
                {c.shopCta} <span aria-hidden="true">→</span>
              </span>
            </Link>
            <Link href="/mobile" className="h-card h-card-light">
              <h2 className="h-h2">{c.appTitle}</h2>
              <p>{c.appBody}</p>
              <span className="h-card-link">
                {c.appCta} <span aria-hidden="true">→</span>
              </span>
            </Link>
          </section>
        </main>

        <footer className="h-foot">
          <BrandWordmark small />
          <nav className="h-foot-links" aria-label="Legal">
            <Link href="/virtual-try-on">{c.navVto}</Link>
            <Link href="/legal#privacy">{t.navPrivacy}</Link>
            <Link href="/legal#terms">{t.navTerms}</Link>
            <Link href="/legal#aup">{t.navAup}</Link>
          </nav>
          <span className="h-foot-note">© {new Date().getFullYear()} A12</span>
        </footer>
      </div>

      <LiveTryOnModal open={isTryOpen} onClose={() => setIsTryOpen(false)} initialGarmentUrl={initialGarment} storeKey={storeKey} />

      {/* Phones cannot install the extension: offer to send the link to a computer */}
      <div id="aw-handoff" className={isHandoffOpen ? 'open' : ''} aria-hidden={!isHandoffOpen}>
        <div className="aw-h-backdrop" onClick={() => setIsHandoffOpen(false)} />
        <div className="aw-h-sheet" role="dialog" aria-modal="true" aria-label={t.handoffTitle}>
          <button className="aw-h-close" type="button" onClick={() => setIsHandoffOpen(false)} aria-label="Close">
            &times;
          </button>
          <div className="aw-h-title-row">
            <div className="aw-h-title">{t.handoffTitle}</div>
          </div>
          <div className="aw-h-flow">
            <div className="aw-h-action">
              <button type="button" className="aw-h-btn aw-primary aw-h-share-main" onClick={shareHandoffLink}>
                <span className="aw-h-label">{t.handoffShareBtn}</span>
              </button>
              <div className="aw-h-sub-row">
                <span className="aw-h-sub-note">{t.handoffSubNote}</span>
                <button type="button" className="aw-h-copy-link" onClick={copyHandoffLink}>
                  <span className="aw-h-label">{isHandoffCopied ? t.copied : t.copyLink}</span>
                </button>
              </div>
            </div>
          </div>
          <a className="aw-h-store-anyway" href={CWS_URL}>
            {t.continueToStoreSetup}
          </a>
        </div>
      </div>
    </>
  );
}
