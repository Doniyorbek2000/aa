'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { LanguageSwitcher, useI18n } from '@/lib/i18n';
import {
  BrandWordmark,
  DEFAULT_GARMENTS,
  LiveTryOnModal,
  PoweredByA12,
} from '@/components/live-tryon-modal';

export default function MobileExperiencePage() {
  const { t } = useI18n();
  const [selectedOS, setSelectedOS] = useState<'ios' | 'android'>('ios');
  const [selectedGarment, setSelectedGarment] = useState(DEFAULT_GARMENTS[0]);
  const [tryModalOpen, setTryModalOpen] = useState(false);

  return (
    <div className="mobile-page-root">
      <style>{`
        .mobile-page-root {
          --ink: #0b1726;
          --paper: #fffffc;
          --muted: #5d6877;
          --line: #0b172618;
          --accent: #2b62ff;
          --lav: #e6ecfb;
          --wash: #f6f8f7;
          --body: #3b4756;
          font-family: 'Onest', -apple-system, sans-serif;
          background: var(--paper); color: var(--ink);
          letter-spacing: -0.01em; min-height: 100vh;
          display: flex; flex-direction: column;
        }
        .mobile-page-root .wrap { width: min(1120px, 100% - 48px); margin-inline: auto; }
        .mobile-page-root .topbar {
          position: sticky; top: 0; z-index: 40;
          background: rgba(255,255,252,0.92); backdrop-filter: blur(12px);
          border-bottom: 0.5px solid var(--line);
        }
        .mobile-page-root .topbar-in {
          display: flex; align-items: center; justify-content: space-between;
          padding: 13px 0; gap: 16px;
        }
        .mobile-page-root .btn {
          height: 46px; padding: 0 20px; width: auto;
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          font-family: inherit; font-size: 15px; font-weight: 500;
          border-radius: 8px; border: 1.5px solid var(--ink);
          cursor: pointer; text-decoration: none;
        }
        .mobile-page-root .btn-primary { background: var(--ink); color: var(--paper); }
        .mobile-page-root .btn-secondary { background: var(--paper); color: var(--ink); }

        .mobile-page-root .hero-stage {
          flex: 1; display: grid; grid-template-columns: 1fr 1fr;
          min-height: calc(100vh - 73px);
        }
        @media (max-width: 920px) { .mobile-page-root .hero-stage { grid-template-columns: 1fr; } }

        .mobile-page-root .left-col {
          padding: 52px clamp(32px, 5vw, 76px);
          display: flex; flex-direction: column; justify-content: space-between;
        }
        .mobile-page-root .eyebrow {
          font-size: 12px; font-weight: 500; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--accent); margin-bottom: 12px; display: block;
        }
        .mobile-page-root h1 {
          font-size: clamp(38px, 4.8vw, 58px); font-weight: 500;
          letter-spacing: -0.04em; line-height: 0.99;
        }
        .mobile-page-root .lede {
          font-size: 18px; line-height: 1.45; color: var(--body);
          margin-top: 18px; max-width: 46ch;
        }
        .mobile-page-root .os-tabs {
          display: inline-flex; gap: 8px; margin-top: 26px;
          background: var(--wash); padding: 5px; border-radius: 10px; border: 0.5px solid var(--line);
        }
        .mobile-page-root .os-tab {
          padding: 9px 18px; border-radius: 7px; border: none;
          font-family: inherit; font-size: 14px; font-weight: 500;
          cursor: pointer; background: transparent; color: var(--muted);
        }
        .mobile-page-root .os-tab.active {
          background: var(--ink); color: var(--paper);
        }
        .mobile-page-root .spec-cards {
          display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 22px;
        }
        .mobile-page-root .spec-card {
          padding: 14px 16px; border-radius: 10px; border: 0.5px solid var(--line);
          background: var(--wash);
        }
        .mobile-page-root .spec-card strong { display: block; font-size: 14px; color: var(--ink); }
        .mobile-page-root .spec-card span { font-size: 12.5px; color: var(--muted); }

        .mobile-page-root .right-col {
          background: var(--lav) url('/assets/a12-gradient.svg') center center / 100% 100% no-repeat;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 44px 28px;
        }
        .mobile-page-root .phone-shell {
          width: 310px; height: 610px; border-radius: 44px;
          background: #0b1726; padding: 11px;
          box-shadow: 0 36px 90px -20px rgba(11, 23, 60,0.55);
          display: flex; flex-direction: column; position: relative;
        }
        .mobile-page-root .phone-screen {
          flex: 1; border-radius: 34px; overflow: hidden;
          background: #181818; position: relative; display: flex; flex-direction: column;
        }
        .mobile-page-root .phone-notch {
          position: absolute; top: 10px; left: 50%; transform: translateX(-50%);
          width: 92px; height: 22px; border-radius: 999px; background: #000; z-index: 4;
        }
        .mobile-page-root .phone-video {
          width: 100%; height: 100%; object-fit: cover;
        }
        .mobile-page-root .phone-garment-overlay {
          position: absolute; left: 50%; top: 52%; transform: translate(-50%, -50%);
          width: 54%; pointer-events: none; z-index: 2;
          filter: drop-shadow(0 12px 24px rgba(0,0,0,0.45));
        }
        .mobile-page-root .phone-dock {
          position: absolute; left: 10px; right: 10px; bottom: 12px; z-index: 3;
          background: rgba(255,255,252,0.92); backdrop-filter: blur(10px);
          border-radius: 20px; padding: 8px;
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px;
        }
        .mobile-page-root .phone-dock-item {
          aspect-ratio: 1; border-radius: 12px; overflow: hidden;
          border: 2px solid transparent; cursor: pointer; background: #edf1f7; padding: 0;
        }
        .mobile-page-root .phone-dock-item.active { border-color: var(--ink); }
        .mobile-page-root .phone-dock-item img { width: 100%; height: 100%; object-fit: cover; }
      `}</style>

      <header className="topbar">
        <div className="wrap topbar-in">
          <BrandWordmark small />
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <LanguageSwitcher />
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setTryModalOpen(true)}
            >
              {t.openLiveCamera}
            </button>
            <Link className="btn btn-secondary" href="/">
              {t.navHome}
            </Link>
          </div>
        </div>
      </header>

      <main className="hero-stage">
        <section className="left-col">
          <div>
            <span className="eyebrow">iOS &bull; Android &bull; WebRTC 30 FPS</span>
            <h1>
              {t.mobileHeroTitle1}
              <br />
              {t.mobileHeroTitle2}
            </h1>
            <p className="lede">{t.mobileHeroLede}</p>

            <div>
              <div className="os-tabs">
                <button
                  type="button"
                  className={`os-tab ${selectedOS === 'ios' ? 'active' : ''}`}
                  onClick={() => setSelectedOS('ios')}
                >
                  iOS (iPhone / iPad)
                </button>
                <button
                  type="button"
                  className={`os-tab ${selectedOS === 'android' ? 'active' : ''}`}
                  onClick={() => setSelectedOS('android')}
                >
                  Android (Kotlin / VisionCamera)
                </button>
              </div>
            </div>

            <div className="spec-cards">
              <div className="spec-card">
                <strong>
                  {selectedOS === 'ios'
                    ? 'AVFoundation + WebRTC'
                    : 'CameraX + VisionCamera'}
                </strong>
                <span>Zero-copy 720p @ 30 FPS hardware stream</span>
              </div>
              <div className="spec-card">
                <strong>Universal Share Sheet</strong>
                <span>
                  {selectedOS === 'ios'
                    ? 'iOS Share Extension & Universal Links'
                    : 'Android App Links & Intent Filter'}
                </span>
              </div>
              <div className="spec-card">
                <strong>Sub-150ms Lucy Stream</strong>
                <span>Real-time cloth physics &amp; body tracking</span>
              </div>
              <div className="spec-card">
                <strong>Shared Core SDK</strong>
                <span>Unified TypeScript state across Web &amp; Mobile</span>
              </div>
            </div>

            <div style={{ marginTop: '26px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setTryModalOpen(true)}
              >
                {t.tryLiveCameraNow}
              </button>
              <Link className="btn btn-secondary" href="/business">
                {t.navForStores} →
              </Link>
            </div>
          </div>

          <div style={{ marginTop: '32px' }}>
            <PoweredByA12 />
          </div>
        </section>

        <section className="right-col">
          <div className="phone-shell">
            <div className="phone-screen">
              <div className="phone-notch" />
              <video
                className="phone-video"
                src="/assets/hero-tryon.mp4"
                poster="/assets/hero-tryon-poster.jpg"
                autoPlay
                muted
                loop
                playsInline
              />
              <img
                className="phone-garment-overlay"
                src={selectedGarment}
                alt="Selected mobile garment"
              />
              <div className="phone-dock">
                {DEFAULT_GARMENTS.map((g, i) => (
                  <button
                    key={g}
                    type="button"
                    className={`phone-dock-item ${selectedGarment === g ? 'active' : ''}`}
                    onClick={() => setSelectedGarment(g)}
                  >
                    <img src={g} alt={`Garment ${i + 1}`} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <LiveTryOnModal
        open={tryModalOpen}
        onClose={() => setTryModalOpen(false)}
        initialGarmentUrl={selectedGarment}
      />
    </div>
  );
}
