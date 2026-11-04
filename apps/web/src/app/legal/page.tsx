'use client';

import React from 'react';
import Link from 'next/link';
import { LanguageSwitcher, useI18n } from '@/lib/i18n';
import { BrandWordmark, PoweredByA12 } from '@/components/live-tryon-modal';

export default function LegalPage() {
  const { t } = useI18n();

  return (
    <div className="vto-legal-root">
      <style>{`
        .vto-legal-root {
          --ink: #0b1726;
          --paper: #fffffc;
          --muted: #5d6877;
          --line: #0b172618;
          --accent: #2b62ff;
          --wash: #f6f8f7;
          --body: #3b4756;
          font-family: 'Onest', -apple-system, sans-serif;
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <LanguageSwitcher />
            <Link className="btn" href="/">
              {t.navHome}
            </Link>
          </div>
        </header>

        <h1>{t.legalPageTitle}</h1>

        <section id="privacy">
          <h2>{t.navPrivacy}</h2>
          <p>{t.privacyBody}</p>
        </section>

        <section id="terms">
          <h2>{t.navTerms}</h2>
          <p>{t.termsBody}</p>
        </section>

        <section id="aup">
          <h2>{t.navAup}</h2>
          <p>{t.aupBody}</p>
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
