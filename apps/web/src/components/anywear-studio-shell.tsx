'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { LanguageSwitcher, useI18n } from '@/lib/i18n';
import {
  BrandWordmark,
  CWS_URL,
  LiveTryOnModal,
  PoweredByA12,
} from './live-tryon-modal';

const BROWSER_SITES = ['revolve.com', 'pinterest.com'];

export function AnywearStudioShell() {
  const { t } = useI18n();
  const [tryModalOpen, setTryModalOpen] = useState(false);
  const [handoffOpen, setHandoffOpen] = useState(false);
  const [copiedHandoff, setCopiedHandoff] = useState(false);
  const [siteIndex, setSiteIndex] = useState(0);
  const [hostVisible, setHostVisible] = useState(true);
  const [initialGarment, setInitialGarment] = useState<string | null>(null);
  const [storeKey, setStoreKey] = useState<string | null>(null);

  // Fake-browser URL bar: cycle between shopping sites every 2.6s
  useEffect(() => {
    const interval = setInterval(() => {
      setHostVisible(false);
      setTimeout(() => {
        setSiteIndex((i) => (i + 1) % BROWSER_SITES.length);
        setHostVisible(true);
      }, 350);
    }, 2600);
    return () => clearInterval(interval);
  }, []);

  // Auto-open Try Example modal when arriving via /?try=1
  useEffect(() => {
    try {
      const u = new URL(window.location.href);
      if (u.searchParams.has('try')) {
        // The storefront widget sends the product image it was pinned to
        const garment = u.searchParams.get('garment');
        if (garment && /^https:\/\//i.test(garment) && garment.length <= 2048) {
          setInitialGarment(garment);
        }
        // ...and the shop's widget key, so its live AI minutes are counted against its plan
        const store = u.searchParams.get('store');
        if (store && /^[A-Za-z0-9_-]{16,64}$/.test(store)) setStoreKey(store);
        u.searchParams.delete('try');
        u.searchParams.delete('garment');
        u.searchParams.delete('store');
        window.history.replaceState(
          null,
          '',
          u.pathname + (u.searchParams.toString() ? '?' + u.searchParams.toString() : '') + u.hash
        );
        setTimeout(() => setTryModalOpen(true), 80);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleAddToChromeClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (typeof navigator !== 'undefined' && /iPad|iPhone|iPod|Android|Mobile/i.test(navigator.userAgent)) {
      e.preventDefault();
      setHandoffOpen(true);
    }
  };

  const handleCopyHandoffLink = () => {
    const url = typeof window !== 'undefined' ? window.location.origin : 'https://a12.uz';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
    setCopiedHandoff(true);
    setTimeout(() => setCopiedHandoff(false), 2200);
  };

  const handleShareHandoffLink = () => {
    const url = typeof window !== 'undefined' ? window.location.origin : 'https://a12.uz';
    if (navigator.share) {
      navigator
        .share({
          title: 'A12 — virtual try-on',
          text: 'Open this on your computer:',
          url,
        })
        .catch(() => {});
    } else {
      handleCopyHandoffLink();
    }
  };

  return (
    <>
      <main className="stage">
        {/* ═══ Left column ═══ */}
        <section className="panel-left">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', width: '100%' }}>
            <BrandWordmark />
            <LanguageSwitcher />
          </div>

          <div className="hero-copy">
            <h1>
              {t.heroTitleLine1}
              <br />
              {t.heroTitleLine2}
            </h1>
            <p className="lede">{t.heroLede}</p>
            <div className="cta">
              <a
                className="btn btn-primary"
                id="cta-add-to-chrome"
                href={CWS_URL}
                onClick={handleAddToChromeClick}
              >
                <img
                  className="chrome-ico"
                  src="/assets/chrome.svg"
                  alt=""
                  aria-hidden="true"
                  width={20}
                  height={20}
                />
                <span className="cta-desktop-label">{t.addToChrome}</span>
                <span className="cta-mobile-label">{t.addToChromeLaptop}</span>
              </a>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setTryModalOpen(true)}
              >
                {t.tryExample}
              </button>
            </div>

            <Link href="/business" className="store-cta">
              <span className="store-cta-text">{t.ownAStoreCta}</span>
              <span className="store-cta-arrow">→</span>
            </Link>
          </div>

          <PoweredByA12 />
        </section>

        {/* ═══ Right column: gradient panel ═══ */}
        <section className="panel-right">
          <div className="stack">
            <span className="beta-pill">
              <svg
                className="spark"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 2l1.6 6.4a2 2 0 0 0 1.5 1.5L22 12l-6.4 1.6a2 2 0 0 0-1.5 1.5L12 22l-1.6-6.4a2 2 0 0 0-1.5-1.5L2 12l6.4-1.6a2 2 0 0 0 1.5-1.5z" />
              </svg>
              {t.betaBadge}
            </span>

            <div className="browser">
              <div className="browser-bar">
                <span className="dot r" />
                <span className="dot y" />
                <span className="dot g" />
                <span className="browser-url">
                  <span
                    id="browser-url-host"
                    style={{ opacity: hostVisible ? 1 : 0 }}
                  >
                    {BROWSER_SITES[siteIndex]}
                  </span>
                </span>
              </div>
              <div className="browser-body">
                <video
                  src="/assets/hero-tryon.mp4"
                  poster="/assets/hero-tryon-poster.jpg"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  aria-label="Live virtual try-on demo"
                />
              </div>
            </div>
          </div>

          <nav className="legal" aria-label="Legal">
            <Link href="/virtual-try-on">{t.navVirtualTryOn}</Link>
            <Link href="/mobile">{t.navMobileApp}</Link>
            <Link href="/legal#privacy">{t.navPrivacy}</Link>
            <Link href="/legal#terms">{t.navTerms}</Link>
            <Link href="/legal#aup">{t.navAup}</Link>
          </nav>
        </section>
      </main>

      {/* ═══ Live try-on demo modal ═══ */}
      <LiveTryOnModal
        open={tryModalOpen}
        onClose={() => setTryModalOpen(false)}
        initialGarmentUrl={initialGarment}
        storeKey={storeKey}
      />

      {/* ═══ Mobile handoff modal ═══ */}
      <div
        id="aw-handoff"
        className={handoffOpen ? 'open' : ''}
        aria-hidden={!handoffOpen}
      >
        <div className="aw-h-backdrop" onClick={() => setHandoffOpen(false)} />
        <div
          className="aw-h-sheet"
          role="dialog"
          aria-modal="true"
          aria-label="Get A12 on your laptop"
        >
          <button
            className="aw-h-close"
            type="button"
            onClick={() => setHandoffOpen(false)}
            aria-label="Close"
          >
            &times;
          </button>
          <div className="aw-h-title-row">
            <div className="aw-h-title">{t.handoffTitle}</div>
          </div>
          <div className="aw-h-flow" id="aw-h-step1">
            <div className="aw-h-action">
              <button
                type="button"
                className="aw-h-btn aw-primary aw-h-share-main"
                onClick={handleShareHandoffLink}
              >
                <span className="aw-h-label">{t.handoffShareBtn}</span>
              </button>
              <div className="aw-h-sub-row">
                <span className="aw-h-sub-note">{t.handoffSubNote}</span>
                <button
                  type="button"
                  className="aw-h-copy-link"
                  onClick={handleCopyHandoffLink}
                >
                  <span className="aw-h-label">{copiedHandoff ? t.copied : t.copyLink}</span>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect x="9" y="9" width="12" height="12" rx="2.5" />
                    <path d="M5 15H4.5A2.5 2.5 0 0 1 2 12.5v-8A2.5 2.5 0 0 1 4.5 2h8A2.5 2.5 0 0 1 15 4.5V5" />
                  </svg>
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
