'use client';

import React from 'react';
import Link from 'next/link';
import { LanguageSwitcher, useI18n } from '@/lib/i18n';
import { BrandWordmark, CWS_URL, PoweredByA12 } from '@/components/live-tryon-modal';

export default function VirtualTryOnPillarPage() {
  const { t } = useI18n();
  return (
    <div className="vto-seo-root">
      <style>{`
        .vto-seo-root {
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
          letter-spacing: -0.01em; min-height: 100vh;
        }
        .vto-seo-root .wrap { width: min(860px, 100% - 48px); margin-inline: auto; padding-bottom: 48px; }
        @media (max-width: 620px) { .vto-seo-root .wrap { width: calc(100% - 40px); } }

        .vto-seo-root .topbar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 24px 0; border-bottom: 0.5px solid var(--line);
        }
        .vto-seo-root .btn {
          height: 52px; padding: 0 22px; width: auto;
          display: inline-flex; align-items: center; justify-content: center; gap: 9px;
          font-family: inherit; font-size: 15px; font-weight: 500;
          border-radius: 8px; border: 1.5px solid var(--ink);
          text-decoration: none; cursor: pointer;
        }
        .vto-seo-root .topbar .btn { height: 40px; padding: 0 16px; font-size: 14px; }
        .vto-seo-root .btn-primary { background: var(--ink); color: var(--paper); }
        .vto-seo-root .btn-secondary { background: var(--paper); color: var(--ink); }

        .vto-seo-root .hero { padding: 54px 0 42px; border-bottom: 0.5px solid var(--line); }
        .vto-seo-root .eyebrow {
          display: block; font-size: 12px; font-weight: 500;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--accent); margin-bottom: 12px;
        }
        .vto-seo-root h1 {
          font-size: clamp(34px, 4.4vw, 52px); font-weight: 500;
          letter-spacing: -0.04em; line-height: 1.02;
        }
        .vto-seo-root .lede {
          font-size: 18px; line-height: 1.55; color: var(--body);
          margin-top: 18px; max-width: 64ch;
        }
        .vto-seo-root .cta { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 28px; }
        .vto-seo-root .cta-note { font-size: 13px; color: var(--muted); margin-top: 12px; }

        .vto-seo-root section { padding: 44px 0; border-bottom: 0.5px solid var(--line); }
        .vto-seo-root h2 {
          font-size: clamp(24px, 3vw, 32px); font-weight: 500;
          letter-spacing: -0.035em; line-height: 1.12; margin-bottom: 16px;
        }
        .vto-seo-root p { font-size: 16px; line-height: 1.6; color: var(--body); }
        .vto-seo-root p + p { margin-top: 14px; }
        .vto-seo-root .answer {
          padding: 20px 22px; border-radius: 12px; background: var(--wash);
          border: 0.5px solid var(--line); margin-bottom: 16px;
        }

        .vto-seo-root .steps { display: grid; gap: 18px; margin-top: 22px; }
        .vto-seo-root .step {
          display: flex; gap: 16px; align-items: flex-start;
          padding: 18px 20px; border-radius: 12px; border: 0.5px solid var(--line); background: var(--paper);
        }
        .vto-seo-root .step-n {
          width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
          background: var(--ink); color: var(--paper);
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 600;
        }
        .vto-seo-root .step h3 { font-size: 18px; font-weight: 500; margin-bottom: 4px; color: var(--ink); }

        .vto-seo-root .table-scroll { overflow-x: auto; margin-top: 20px; border: 0.5px solid var(--line); border-radius: 12px; }
        .vto-seo-root table { width: 100%; border-collapse: collapse; font-size: 14.5px; text-align: left; }
        .vto-seo-root th, .vto-seo-root td { padding: 13px 16px; border-bottom: 0.5px solid var(--line); }
        .vto-seo-root th { font-weight: 500; color: var(--ink); background: var(--wash); }
        .vto-seo-root .col-ours { background: rgba(198, 90, 146, 0.08); font-weight: 500; color: var(--ink); }

        .vto-seo-root .cards {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
          gap: 14px; margin-top: 20px;
        }
        .vto-seo-root .card {
          padding: 20px; border-radius: 12px; border: 0.5px solid var(--line); background: var(--wash);
        }
        .vto-seo-root .card h3 { font-size: 17px; font-weight: 500; margin-bottom: 8px; color: var(--ink); }
        .vto-seo-root .card p { font-size: 14.5px; }

        .vto-seo-root .faq { margin-top: 18px; border-top: 0.5px solid var(--line); }
        .vto-seo-root .faq details { border-bottom: 0.5px solid var(--line); }
        .vto-seo-root .faq summary {
          padding: 16px 2px; cursor: pointer; font-size: 16px; font-weight: 500;
          color: var(--ink); list-style: none; display: flex; justify-content: space-between;
        }
        .vto-seo-root .faq summary::-webkit-details-marker { display: none; }
        .vto-seo-root .faq summary::after { content: '+'; color: var(--muted); }
        .vto-seo-root .faq details[open] summary::after { content: '–'; }
        .vto-seo-root .faq details p { padding: 0 2px 16px; font-size: 15px; }

        .vto-seo-root footer { padding-top: 32px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px; }
        .vto-seo-root .legal { display: flex; gap: 18px; flex-wrap: wrap; }
        .vto-seo-root .legal a { font-size: 13px; color: var(--muted); text-decoration: none; }
      `}</style>

      <div className="wrap">
        <header className="topbar">
          <BrandWordmark small />
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <LanguageSwitcher />
            <Link className="btn btn-secondary" href="/">
              {t.navHome}
            </Link>
          </div>
        </header>

        <div className="hero">
          <span className="eyebrow">AI by A12</span>
          <h1>{t.vtoHeroTitle}</h1>
          <p className="lede">{t.vtoHeroLede}</p>
          <div className="cta">
            <Link className="btn btn-primary" href={CWS_URL}>
              <img src="/assets/chrome.svg" alt="" aria-hidden="true" width={20} height={20} />
              {t.addToChrome}
            </Link>
            <Link className="btn btn-secondary" href="/?try=1">
              {t.tryWithoutInstalling}
            </Link>
          </div>
          <p className="cta-note">{t.betaBadge}</p>
        </div>

        <section>
          <h2>{t.whatIsVtoTitle}</h2>
          <div className="answer">
            <p>
              <strong>{t.whatIsVtoBody}</strong>
            </p>
          </div>
        </section>

        <section>
          <h2>{t.howItWorksTitle}</h2>
          <div className="steps">
            <div className="step">
              <span className="step-n">1</span>
              <div>
                <h3>{t.modalStep1Heading}</h3>
                <p>{t.enableCamera}</p>
              </div>
            </div>
            <div className="step">
              <span className="step-n">2</span>
              <div>
                <h3>{t.modalStep2Heading}</h3>
                <p>{t.heroLede}</p>
              </div>
            </div>
            <div className="step">
              <span className="step-n">3</span>
              <div>
                <h3>{t.modalStep3Heading}</h3>
                <p>{t.modalStep3Sub}</p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2>The three generations of virtual try-on</h2>
          <p>
            Most confusion about virtual try-on comes from three genuinely different technologies
            sharing one name. They fail at different things.
          </p>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>&nbsp;</th>
                  <th>Static overlay</th>
                  <th>Photo generation</th>
                  <th className="col-ours">Live try-on (A12)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>What you give it</td>
                  <td>Your measurements or a model</td>
                  <td>An uploaded selfie</td>
                  <td className="col-ours">Your camera, as-is</td>
                </tr>
                <tr>
                  <td>What you get back</td>
                  <td>A flat image pasted on a shape</td>
                  <td>One generated still picture</td>
                  <td className="col-ours">Live video of you wearing it</td>
                </tr>
                <tr>
                  <td>Can you move?</td>
                  <td>No</td>
                  <td>No</td>
                  <td className="col-ours">Yes — turn, walk, gesture</td>
                </tr>
                <tr>
                  <td>Physics and drape</td>
                  <td>None</td>
                  <td>Implied, frozen</td>
                  <td className="col-ours">Rendered as it moves</td>
                </tr>
                <tr>
                  <td>Where it works</td>
                  <td>One retailer&rsquo;s site</td>
                  <td>Inside a separate tool</td>
                  <td className="col-ours">Any online store you visit</td>
                </tr>
                <tr>
                  <td>Setup</td>
                  <td>Sizing form</td>
                  <td>Find and upload a good photo</td>
                  <td className="col-ours">Allow camera, drag, done</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2>Where you can use it</h2>
          <div className="cards">
            <div className="card">
              <h3>Any online store</h3>
              <p>
                The extension runs on the page you are already on, so it needs nothing from the
                retailer. Revolve, Pinterest boards, a Shopify boutique — the button shows up the
                same way.
              </p>
            </div>
            <div className="card">
              <h3>Desktop and mobile</h3>
              <p>
                On a computer it&rsquo;s a Chrome extension. On a phone, the A12 web &amp;
                mobile app does the same job. <Link href="/mobile">Mobile App →</Link>
              </p>
            </div>
            <div className="card">
              <h3>On your own store</h3>
              <p>
                Store owners add the same live try-on to their product pages with one line of code.{' '}
                <Link href="/business">For stores →</Link>
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2>Frequently asked questions</h2>
          <div className="faq">
            <details>
              <summary>Is A12&rsquo;s virtual try-on free?</summary>
              <p>
                Yes — free during Beta, for a limited time. No account and no card to start.
              </p>
            </details>
            <details>
              <summary>Do I need to upload a photo?</summary>
              <p>
                No. That&rsquo;s the main difference between A12 and every other virtual try-on
                tool. It uses your live camera, so there&rsquo;s no photo to find, crop, or light
                well.
              </p>
            </details>
            <details>
              <summary>Which stores does it work on?</summary>
              <p>
                Any of them. A12 runs in your browser rather than inside one retailer&rsquo;s
                website, so it works on the fashion stores you already shop.
              </p>
            </details>
            <details>
              <summary>Does it work on my phone?</summary>
              <p>
                Yes, through the A12 mobile &amp; web app. The try-on experience is live and
                real-time on both desktop and mobile.
              </p>
            </details>
            <details>
              <summary>Can I put this on my own store?</summary>
              <p>
                Yes. One line of code before <code>&lt;/body&gt;</code>, or one click on Shopify,
                puts a floating try-on button on your product pages.{' '}
                <Link href="/install">See the store setup →</Link>
              </p>
            </details>
          </div>
        </section>

        <footer>
          <PoweredByA12 />
          <nav className="legal" aria-label="Legal">
            <Link href="/">Home</Link>
            <Link href="/business">For Stores</Link>
            <Link href="/install">Install</Link>
            <Link href="/mobile">Mobile App</Link>
          </nav>
        </footer>
      </div>
    </div>
  );
}
