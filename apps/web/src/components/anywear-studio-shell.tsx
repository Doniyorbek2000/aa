'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BrandWordmark,
  CWS_URL,
  LiveTryOnModal,
  PoweredByA12,
} from './live-tryon-modal';

const BROWSER_SITES = ['revolve.com', 'pinterest.com'];

export function AnywearStudioShell() {
  const [tryModalOpen, setTryModalOpen] = useState(false);
  const [handoffOpen, setHandoffOpen] = useState(false);
  const [copiedHandoff, setCopiedHandoff] = useState(false);
  const [siteIndex, setSiteIndex] = useState(0);
  const [hostVisible, setHostVisible] = useState(true);

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
        u.searchParams.delete('try');
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
          title: 'Anywear — virtual try-on',
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
          <BrandWordmark />

          <div className="hero-copy">
            <h1>
              Try clothes on,
              <br />
              anywhere online
            </h1>
            <p className="lede">
              Drag any clothing item from any online store and see it on you, instantly.
            </p>
            <div className="cta">
              <a
                className="btn btn-primary"
                id="cta-add-to-chrome"
                href={CWS_URL}
                target="_blank"
                rel="noopener noreferrer"
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
                <span className="cta-desktop-label">Add to Chrome</span>
                <span className="cta-mobile-label">Add to Chrome on your Laptop</span>
              </a>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setTryModalOpen(true)}
              >
                Try Example
              </button>
            </div>

            <Link href="/business" className="store-cta">
              <span className="store-cta-text">
                Own a store? Add virtual try-on to your website
              </span>
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
              Free during Beta. Available for limited time.
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
            <Link href="/virtual-try-on">Virtual Try-On</Link>
            <Link href="/mobile">Mobile App (iOS &amp; Android)</Link>
            <a
              href="https://docs.platform.decart.ai/resources/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy Policy
            </a>
            <a
              href="https://docs.platform.decart.ai/resources/terms-of-service"
              target="_blank"
              rel="noopener noreferrer"
            >
              Terms of Service
            </a>
            <a
              href="https://docs.platform.decart.ai/resources/aup"
              target="_blank"
              rel="noopener noreferrer"
            >
              Acceptable Use Policy
            </a>
          </nav>
        </section>
      </main>

      {/* ═══ Live try-on demo modal ═══ */}
      <LiveTryOnModal open={tryModalOpen} onClose={() => setTryModalOpen(false)} />

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
          aria-label="Get Anywear on your laptop"
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
            <div className="aw-h-title">Search &ldquo;Anywear&rdquo; on Chrome Web Store</div>
          </div>
          <div className="aw-h-flow" id="aw-h-step1">
            <div className="aw-h-action">
              <button
                type="button"
                className="aw-h-btn aw-primary aw-h-share-main"
                onClick={handleShareHandoffLink}
              >
                <span className="aw-h-label">Share Link to Your Laptop</span>
              </button>
              <div className="aw-h-sub-row">
                <span className="aw-h-sub-note">
                  AirDrop, copy, email, or message the link to your computer.
                </span>
                <button
                  type="button"
                  className="aw-h-copy-link"
                  onClick={handleCopyHandoffLink}
                >
                  <span className="aw-h-label">{copiedHandoff ? 'Copied ✓' : 'Copy link'}</span>
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
          <a
            className="aw-h-store-anyway"
            href={CWS_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Or view it on the Chrome Web Store →
          </a>
        </div>
      </div>
    </>
  );
}
