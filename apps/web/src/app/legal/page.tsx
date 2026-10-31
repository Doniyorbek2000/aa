'use client';

import React from 'react';
import Link from 'next/link';
import { BrandWordmark, PoweredByA12 } from '@/components/live-tryon-modal';

export default function LegalPage() {
  return (
    <div className="vto-legal-root">
      <style>{`
        .vto-legal-root {
          --ink: #170404;
          --paper: #fffffc;
          --muted: #6b5555;
          --line: #17040418;
          --accent: #c65a92;
          --wash: #faf7f8;
          --body: #4a3535;
          font-family: 'Roobert', 'Inter', -apple-system, sans-serif;
          background: var(--paper); color: var(--ink);
          letter-spacing: -0.01em; min-height: 100vh;
        }
        .vto-legal-root .wrap { width: min(820px, 100% - 48px); margin-inline: auto; padding-bottom: 56px; }
        .vto-legal-root .topbar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 22px 0; border-bottom: 0.5px solid var(--line);
        }
        .vto-legal-root .btn {
          height: 40px; padding: 0 16px;
          display: inline-flex; align-items: center; justify-content: center;
          font-family: inherit; font-size: 14px; font-weight: 500;
          border-radius: 8px; border: 1.5px solid var(--ink);
          background: var(--paper); color: var(--ink); text-decoration: none;
        }
        .vto-legal-root section { padding: 36px 0; border-bottom: 0.5px solid var(--line); }
        .vto-legal-root h1 { font-size: clamp(30px, 4vw, 44px); font-weight: 500; letter-spacing: -0.04em; margin-top: 36px; }
        .vto-legal-root h2 { font-size: 22px; font-weight: 500; letter-spacing: -0.03em; margin-bottom: 12px; }
        .vto-legal-root p { font-size: 15.5px; line-height: 1.65; color: var(--body); }
        .vto-legal-root p + p { margin-top: 12px; }
        .vto-legal-root footer { padding-top: 28px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; }
      `}</style>
      <div className="wrap">
        <header className="topbar">
          <BrandWordmark small />
          <Link className="btn" href="/">
            Home
          </Link>
        </header>

        <h1>A12 Legal, Privacy &amp; Terms</h1>

        <section id="privacy">
          <h2>Privacy Policy</h2>
          <p>
            A12 processes live camera streams strictly in real time for virtual try-on rendering.
            Live video frames are never permanently stored, sold, or used to train third-party
            models.
          </p>
          <p>
            When you enable your camera on A12 (`a12.uz`), video processing happens strictly for
            the duration of your active try-on session and is terminated immediately when you close
            the try-on window.
          </p>
        </section>

        <section id="terms">
          <h2>Terms of Service</h2>
          <p>
            By using A12 Virtual Try-On across web, browser extension, or mobile applications, or
            by embedding the A12 storefront script (`a12.js`) on your online store, you agree to
            use the service for lawful e-commerce and personal shopping purposes.
          </p>
        </section>

        <section id="aup">
          <h2>Acceptable Use Policy</h2>
          <p>
            Users and merchants may not upload or stream unlawful, harmful, or non-consensual
            imagery through A12 Virtual Try-On. Automated safety filters enforce acceptable garment
            and camera stream usage in real time.
          </p>
        </section>

        <footer>
          <PoweredByA12 />
          <Link href="/" style={{ fontSize: '13px', color: 'var(--muted)', textDecoration: 'none' }}>
            a12.uz
          </Link>
        </footer>
      </div>
    </div>
  );
}

