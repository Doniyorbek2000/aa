'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { LanguageSwitcher, useI18n } from '@/lib/i18n';
import { BrandWordmark, PoweredByA12 } from '@/components/live-tryon-modal';

type PlatformType = 'shopify' | 'woo' | 'any';

export default function InstallWizardPage() {
  const { t } = useI18n();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [platform, setPlatform] = useState<PlatformType | null>(null);
  const [domain, setDomain] = useState('');
  const [email, setEmail] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [copied, setCopied] = useState(false);
  const [faqVisible, setFaqVisible] = useState(false);
  const [openFaqIndices, setOpenFaqIndices] = useState<Record<number, boolean>>({});

  useEffect(() => {
    try {
      const handover = new URLSearchParams(window.location.search).get('store');
      if (handover) {
        const clean = String(handover)
          .trim()
          .toLowerCase()
          .replace(/^https?:\/\//, '')
          .replace(/^www\./, '')
          .replace(/[/?#].*$/, '')
          .slice(0, 253);
        if (clean.includes('.')) {
          setTimeout(() => setDomain(clean), 0);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const cleanDomain = domain
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/.*$/, '');

  const formReady =
    cleanDomain.length > 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
    Boolean(priceRange);

  const selectPlatform = (p: PlatformType) => {
    setPlatform(p);
    setStep(2);
  };

  const scriptBase =
    platform === 'woo'
      ? 'https://a12.uz/widget/latest/a12.woocommerce.js'
      : 'https://a12.uz/widget/latest/a12.js';
  const scriptSrc = `${scriptBase}?domain=${encodeURIComponent(cleanDomain || 'mystore.com')}`;
  const rawScriptTag = `<script src="${scriptSrc}" async></script>`;

  const handleCopy = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(rawScriptTag).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleRestart = () => {
    setPlatform(null);
    setDomain('');
    setEmail('');
    setPriceRange('');
    setStep(1);
  };

  const toggleFaqItem = (idx: number) => {
    setOpenFaqIndices((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="install-root">
      <style>{`
        .install-root {
          --ink: #170404;
          --paper: #fffffc;
          --muted: #6b5555;
          --line: #17040418;
          --accent: #c65a92;
          --lav: #eae4f7;
          --wash: #faf7f8;
          --body: #4a3535;
          font-family: 'Onest', -apple-system, sans-serif;
          background: var(--paper); color: var(--ink);
          letter-spacing: -0.01em;
          min-height: 100vh; display: flex; flex-direction: column;
        }
        .install-root .wrap { width: min(1120px, 100% - 48px); margin-inline: auto; }
        @media (max-width: 620px) { .install-root .wrap { width: calc(100% - 40px); } }

        .install-root .eyebrow {
          display: block; font-size: 12px; font-weight: 500;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--accent); margin-bottom: 8px;
        }
        .install-root p { line-height: 1.55; }

        .install-root .btn {
          min-width: 210px; height: 50px; width: auto;
          display: inline-flex; align-items: center; justify-content: center; gap: 9px;
          padding: 0 24px;
          font-family: inherit; font-size: 16px; font-weight: 500; letter-spacing: -0.02em;
          border-radius: 8px; border: 1.5px solid var(--ink);
          cursor: pointer; text-decoration: none;
          transition: background 0.18s ease, color 0.18s ease, transform 0.18s ease;
        }
        .install-root .btn-primary { background: var(--ink); color: var(--paper); }
        .install-root .btn-primary:hover { background: #000; }
        .install-root .btn-secondary { background: transparent; color: var(--ink); }
        .install-root .btn-secondary:hover { background: #f7f2f4; }
        .install-root .btn-sm { height: 44px; min-width: 0; font-size: 15px; padding: 0 18px; }

        .install-root .topbar {
          background: var(--paper);
          border-bottom: 0.5px solid var(--line);
          flex-shrink: 0;
        }
        .install-root .topbar-in { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 12px 0; }

        .install-root main { flex: 1; }
        .install-root .hero { padding: clamp(22px, 3.5vw, 46px) 0 clamp(16px, 2vw, 30px); }
        .install-root .hero-grid { max-width: 600px; margin-inline: auto; }
        .install-root .hero h1 {
          font-size: clamp(32px, 3.6vw, 44px); font-weight: 500;
          letter-spacing: -0.04em; line-height: 1.0;
        }
        .install-root .hero .lede {
          font-size: clamp(15px, 1.25vw, 17px); line-height: 1.45; letter-spacing: -0.02em;
          color: #3a2424; margin-top: 10px; max-width: 46ch;
        }
        .install-root .hero .lede strong { font-weight: 500; color: var(--ink); }

        .install-root .panel {
          margin-top: 18px; min-width: 0;
          background: var(--paper); border: 0.5px solid var(--line); border-radius: 14px;
          padding: 18px 20px 20px;
        }
        .install-root .wiz-head {
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px; margin-bottom: 9px;
        }
        .install-root .wiz-count {
          font-size: 12px; font-weight: 500; letter-spacing: 0.08em;
          text-transform: uppercase; color: var(--muted);
        }
        .install-root .wiz-count span { color: var(--ink); }
        .install-root .wiz-back {
          background: none; border: none; padding: 0; cursor: pointer;
          font-family: inherit; font-size: 13.5px; color: var(--body);
          text-decoration: underline; text-underline-offset: 3px;
        }
        .install-root .wiz-bar { height: 3px; border-radius: 2px; background: rgba(23,4,4,0.08); overflow: hidden; margin-bottom: 20px; }
        .install-root .wiz-bar span {
          display: block; height: 100%; border-radius: 2px;
          background: var(--ink); transition: width 0.3s cubic-bezier(.16,1,.3,1);
        }
        .install-root .wiz-q {
          font-size: 17px; font-weight: 500; letter-spacing: -0.03em;
          line-height: 1.2; color: var(--ink); margin-bottom: 13px;
        }
        .install-root .platform-opts {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 8px; margin-bottom: 18px;
        }
        @media (max-width: 560px) { .install-root .platform-opts { grid-template-columns: 1fr; } }
        .install-root .popt {
          border: 1px solid transparent; border-radius: 10px;
          padding: 14px 12px; background: var(--wash);
          font-family: inherit; font-size: 15px; font-weight: 500; letter-spacing: -0.025em;
          color: var(--ink); cursor: pointer; text-align: center;
          transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
        }
        .install-root .popt:hover { background: #f2eaee; }
        .install-root .popt.selected { border-color: var(--ink); box-shadow: 0 0 0 1px var(--ink); background: var(--paper); }

        .install-root .wiz-form { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 18px; }
        @media (max-width: 560px) { .install-root .wiz-form { grid-template-columns: 1fr; } }
        .install-root .wiz-field { min-width: 0; }
        .install-root .wiz-field-wide { grid-column: 1 / -1; }
        .install-root .wiz-field label {
          display: block; font-size: 11.5px; font-weight: 500; letter-spacing: 0.06em;
          text-transform: uppercase; color: var(--muted); margin-bottom: 6px;
        }
        .install-root .wiz-field input, .install-root .wiz-field select {
          width: 100%; font-family: inherit; font-size: 15px; color: var(--ink);
          background: var(--paper); border: 1px solid rgba(23,4,4,0.18); border-radius: 9px;
          padding: 11px 13px; outline: none;
        }
        .install-root .wiz-hint { font-size: 12px; color: var(--muted); margin-top: 5px; }
        .install-root .wiz-nav { display: flex; align-items: center; justify-content: flex-end; gap: 10px; }
        .install-root .wiz-fwd { opacity: 0.32; pointer-events: none; transition: opacity 0.15s; }
        .install-root .wiz-fwd.ready { opacity: 1; pointer-events: auto; }

        .install-root .wiz-step-title { font-size: 17px; font-weight: 500; letter-spacing: -0.035em; line-height: 1.15; margin-bottom: 6px; }
        .install-root .snippet-lead { font-size: 13.5px; color: var(--muted); line-height: 1.5; }
        .install-root .mono {
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 0.86em; background: rgba(23,4,4,0.06); border-radius: 4px; padding: 2px 5px;
        }
        .install-root .snippet {
          margin-top: 14px; border-radius: 10px; border: 0.5px solid var(--line);
          background: #1c0a0a; padding: 14px 15px; max-width: 100%; overflow-x: auto;
        }
        .install-root .snippet code {
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 12.5px; line-height: 1.65; color: #f4e9ee; white-space: pre-wrap; overflow-wrap: anywhere;
        }
        .install-root .snippet .ct { color: #c99ab0; }
        .install-root .snippet .ca { color: #f0a8cd; }
        .install-root .snippet .cv { color: #b9e3c6; }
        .install-root .snippet .ck { color: #cbb6ee; }
        .install-root .snippet-foot { display: flex; align-items: center; gap: 12px; margin-top: 11px; flex-wrap: wrap; }
        .install-root .snippet-foot span { font-size: 12.5px; color: var(--muted); }
        .install-root .copy-btn {
          font-family: inherit; font-size: 12.5px; font-weight: 500; color: var(--ink);
          background: transparent; border: 0.5px solid var(--line); border-radius: 6px;
          padding: 6px 12px; cursor: pointer;
        }
        .install-root .copy-btn.copied { background: var(--ink); color: var(--paper); border-color: var(--ink); }
        .install-root .dash-note { font-size: 13px; color: var(--muted); line-height: 1.5; margin-top: 10px; }
        .install-root .restart-link { margin-top: 18px; padding-top: 16px; border-top: 0.5px solid var(--line); }
        .install-root .restart-link button {
          background: none; border: none; padding: 0; cursor: pointer;
          font-family: inherit; font-size: 13.5px; color: var(--muted);
          text-decoration: underline; text-underline-offset: 3px;
        }

        .install-root .below { padding: 2px 0 18px; }
        .install-root .below-in { max-width: 600px; margin-inline: auto; }
        .install-root .below-row { display: flex; align-items: baseline; gap: 6px 14px; flex-wrap: wrap; }
        .install-root .beta-line { font-size: 12.5px; color: var(--muted); opacity: 0.8; }
        .install-root .beta-line::before { content: '·'; margin-right: 12px; color: rgba(23,4,4,0.28); }
        .install-root .faq-trigger {
          background: none; border: none; padding: 0; cursor: pointer;
          font-family: inherit; font-size: 13.5px; color: var(--body);
          text-decoration: underline; text-underline-offset: 3px;
        }
        .install-root .faq-section { margin-top: 22px; border-top: 0.5px solid var(--line); }
        .install-root .faq-item { border-bottom: 0.5px solid var(--line); }
        .install-root .faq-q {
          display: flex; align-items: center; justify-content: space-between; gap: 18px;
          width: 100%; background: none; border: none; cursor: pointer;
          padding: 15px 2px; text-align: left; font-family: inherit;
          font-size: 15.5px; font-weight: 500; letter-spacing: -0.025em; color: var(--ink);
        }
        .install-root .faq-a {
          padding: 0 2px 18px;
          font-size: 14.5px; line-height: 1.55; color: var(--body); max-width: 82ch;
        }
        .install-root .faq-gif-sm { width: min(100%, 420px); border-radius: 10px; margin-top: 14px; display: block; }

        .install-root footer { padding: 18px 0 22px; border-top: 0.5px solid var(--line); flex-shrink: 0; }
        .install-root .foot-in { display: flex; align-items: center; justify-content: space-between; gap: 12px 30px; flex-wrap: wrap; }
        .install-root .legal { display: flex; gap: 8px 20px; flex-wrap: wrap; }
        .install-root .legal a { font-size: 12.5px; color: var(--muted); text-decoration: none; }
      `}</style>

      <header className="topbar">
        <div className="wrap topbar-in">
          <BrandWordmark small />
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <LanguageSwitcher />
            <Link className="btn btn-secondary btn-sm" href="/?try=1">
              <img
                className="chrome-ico"
                src="/assets/chrome.svg"
                alt=""
                aria-hidden="true"
                width={20}
                height={20}
              />
              {t.seeItOnMyStore}
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="wrap hero-grid">
            <div>
              <span className="eyebrow">{t.forStoreOwners}</span>
              <h1>
                {t.installHeroTitle1}
                <br />
                {t.installHeroTitle2}
              </h1>
              <p className="lede">{t.installHeroLede}</p>

              <div className="panel">
                <div className="wiz-head">
                  <span className="wiz-count">
                    {t.stepOf3.replace('{step}', String(step))}
                  </span>
                  {step > 1 && (
                    <button
                      type="button"
                      className="wiz-back"
                      onClick={() => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2) : 1))}
                    >
                      {t.backBtn}
                    </button>
                  )}
                </div>
                <div className="wiz-bar" aria-hidden="true">
                  <span style={{ width: `${(step / 3) * 100}%` }} />
                </div>

                {/* Step 1: Platform */}
                {step === 1 && (
                  <div>
                    <p className="wiz-q">{t.whatTypeWebsite}</p>
                    <div className="platform-opts">
                      <button
                        type="button"
                        className={`popt ${platform === 'shopify' ? 'selected' : ''}`}
                        onClick={() => selectPlatform('shopify')}
                      >
                        Shopify
                      </button>
                      <button
                        type="button"
                        className={`popt ${platform === 'woo' ? 'selected' : ''}`}
                        onClick={() => selectPlatform('woo')}
                      >
                        WooCommerce
                      </button>
                      <button
                        type="button"
                        className={`popt ${platform === 'any' ? 'selected' : ''}`}
                        onClick={() => selectPlatform('any')}
                      >
                        {t.anyWebsite}
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Domain + email */}
                {step === 2 && (
                  <div>
                    <p className="wiz-q">{t.whichStoreInstalling}</p>
                    <div className="wiz-form">
                      <div className="wiz-field">
                        <label htmlFor="w-domain">{t.storeDomainLabel}</label>
                        <input
                          type="text"
                          id="w-domain"
                          placeholder="mystore.com"
                          value={domain}
                          onChange={(e) => setDomain(e.target.value)}
                          autoComplete="off"
                          autoCapitalize="none"
                          spellCheck={false}
                        />
                        <div className="wiz-hint">mystore.com</div>
                      </div>
                      <div className="wiz-field">
                        <label htmlFor="w-email">{t.yourEmailLabel}</label>
                        <input
                          type="email"
                          id="w-email"
                          placeholder="you@mystore.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                      <div className="wiz-field wiz-field-wide">
                        <label htmlFor="w-price">{t.typicalPriceLabel}</label>
                        <select
                          id="w-price"
                          value={priceRange}
                          onChange={(e) => setPriceRange(e.target.value)}
                        >
                          <option value="" disabled>
                            {t.selectRange}
                          </option>
                          <option value="5_50">$5 &ndash; $50</option>
                          <option value="50_100">$50 &ndash; $100</option>
                          <option value="100_150">$100 &ndash; $150</option>
                          <option value="150_300">$150 &ndash; $300</option>
                          <option value="300_500">$300 &ndash; $500</option>
                          <option value="over_500">$500+</option>
                        </select>
                      </div>
                    </div>
                    <div className="wiz-nav">
                      <button
                        type="button"
                        className={`btn btn-primary wiz-fwd ${formReady ? 'ready' : ''}`}
                        onClick={() => setStep(3)}
                      >
                        {t.installCodeBtn}
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Snippet */}
                {step === 3 && (
                  <div>
                    <p className="wiz-step-title">{t.oneLineTitle}</p>
                    <p className="snippet-lead">{t.pasteBeforeBody}</p>
                    <div className="snippet">
                      <code>
                        <span className="ct">&lt;</span>
                        <span className="ca">script</span> <span className="ca">src</span>=
                        <span className="cv">&quot;{scriptSrc}&quot;</span>{' '}
                        <span className="ck">async</span>
                        <span className="ct">&gt;&lt;/script&gt;</span>
                      </code>
                    </div>
                    <div className="snippet-foot">
                      <button
                        type="button"
                        className={`copy-btn ${copied ? 'copied' : ''}`}
                        onClick={handleCopy}
                      >
                        {copied ? t.copied : t.copyBtn}
                      </button>
                      <span>
                        <code className="mono">
                          {platform === 'woo'
                            ? 'footer.php'
                            : platform === 'shopify'
                            ? 'layout/theme.liquid'
                            : 'index.html'}
                        </code>
                      </span>
                    </div>

                    <div className="restart-link">
                      <button type="button" onClick={handleRestart}>
                        {t.installAnotherStore}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="below">
          <div className="wrap below-in">
            <div className="below-row">
              <button
                type="button"
                className="faq-trigger"
                onClick={() => setFaqVisible((v) => !v)}
              >
                {faqVisible ? t.hideQuestions : t.haveAQuestion}
              </button>
              <span className="beta-line">{t.betaBadge}</span>
            </div>

            {faqVisible && (
              <div className="faq-section">
                {[
                  {
                    q: 'Is A12 actually free?',
                    a: 'Yes, free during Beta. For unlimited sessions or enterprise-scale needs, contact us.',
                  },
                  {
                    q: 'Will I get a dashboard to see how shoppers use it?',
                    a: "Yes. Once A12 is activated on your store — that is, once the one line of code is live on your site — you'll receive an email with access to your dashboard.",
                  },
                  {
                    q: "What will A12's widget look like on my store?",
                    a: 'A floating try-on button that lives on your product pages. Shoppers open it to try on any item live, right in their browser. No app, no account, no extra steps.',
                    hasVideo: true,
                  },
                  {
                    q: 'How can A12 increase buyer confidence?',
                    a: "When shoppers can see an item on their own body in real-time, they have the information they need to make a confident purchase decision. Studies consistently show that virtual try-on increases conversion rates and reduces returns.",
                  },
                  {
                    q: 'What is A12?',
                    a: "A12 is a new AI that lets shoppers try on clothes from any website without going to a physical store. It's the world's first real-time virtual try-on that renders clothing live with true physics, not a static image overlay.",
                  },
                  {
                    q: "Will it affect my site's performance or design?",
                    a: "No. It loads as a single async script tag; it won't block your page or change any of your existing layout. The widget UI only appears when a shopper actively opens it.",
                  },
                  {
                    q: 'Does it work on mobile and desktop?',
                    a: 'Yes. On desktop, the widget appears on your website and shoppers use it right in the browser. On mobile, shoppers can use the A12 web or mobile app to try on items from any store. Both experiences are live and real-time.',
                  },
                ].map((item, idx) => (
                  <div
                    key={item.q}
                    className={`faq-item ${openFaqIndices[idx] ? 'open' : ''}`}
                  >
                    <button
                      type="button"
                      className="faq-q"
                      onClick={() => toggleFaqItem(idx)}
                    >
                      {item.q}
                      <span aria-hidden="true">{openFaqIndices[idx] ? '–' : '+'}</span>
                    </button>
                    {openFaqIndices[idx] && (
                      <div className="faq-a">
                        <p>{item.a}</p>
                        {item.hasVideo && (
                          <video
                            src="/assets/hero-tryon.mp4"
                            poster="/assets/hero-tryon-poster.jpg"
                            autoPlay
                            muted
                            loop
                            playsInline
                            preload="metadata"
                            className="faq-gif-sm"
                          />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap foot-in">
          <PoweredByA12 />
          <nav className="legal" aria-label="Legal">
            <Link href="/business">For Stores</Link>
            <Link href="/virtual-try-on">Virtual Try-On</Link>
            <Link href="/mobile">Mobile App</Link>
            <Link href="/">a12.uz</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
