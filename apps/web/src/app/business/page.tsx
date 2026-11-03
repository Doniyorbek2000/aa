'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LanguageSwitcher, useI18n } from '@/lib/i18n';
import { BUSINESS_COPY } from '@/lib/business-copy';
import {
  BrandWordmark,
  LiveTryOnModal,
  PoweredByA12,
} from '@/components/live-tryon-modal';

const DEMO_GARMENTS = [
  '/assets/one-pager/garment2.png',
  '/assets/one-pager/garment3.png',
  '/assets/one-pager/garment4.png',
];

function normaliseStore(v: string): string {
  return String(v || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/[/?#].*$/, '')
    .slice(0, 253);
}

export default function BusinessOnePagerPage() {
  const { t, locale } = useI18n();
  const b = BUSINESS_COPY[locale] ?? BUSINESS_COPY.en;
  const router = useRouter();
  const [copiedSnip, setCopiedSnip] = useState(false);
  const [tryModalOpen, setTryModalOpen] = useState(false);
  const [activeGarment, setActiveGarment] = useState<string | null>(null);

  // Option 1 preview sheet state
  const [previewSheetOpen, setPreviewSheetOpen] = useState(false);
  const [previewStep, setPreviewStep] = useState<1 | 2 | 3>(1);
  const [previewStoreUrl, setPreviewStoreUrl] = useState('');

  // Install hand-off sheet state
  const [installSheetOpen, setInstallSheetOpen] = useState(false);
  const [installStoreUrl, setInstallStoreUrl] = useState('');

  // The preview needs a desktop browser, so phones get a "send to laptop" sheet instead
  const [laptopSheetOpen, setLaptopSheetOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setPreviewSheetOpen(false);
      setInstallSheetOpen(false);
      setLaptopSheetOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const openPreview = () => {
    if (/iPad|iPhone|iPod|Android|Mobile/i.test(navigator.userAgent)) {
      setLaptopSheetOpen(true);
      return;
    }
    setPreviewStep(1);
    setPreviewSheetOpen(true);
  };

  // Private preview = a bookmarklet that runs the storefront widget on the owner's own tab only
  const bookmarkletRef = useRef<HTMLAnchorElement | null>(null);
  useEffect(() => {
    if (!previewSheetOpen || previewStep !== 2) return;
    let cancelled = false;
    fetch('/widget/latest/a12.js')
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
      .then((code) => {
        if (cancelled || !bookmarkletRef.current) return;
        const src = `window.__A12_ORIGIN__=${JSON.stringify(window.location.origin)};${code}`;
        // React blocks javascript: hrefs in JSX, so the attribute is set directly
        bookmarkletRef.current.setAttribute('href', `javascript:${encodeURIComponent(src)}`);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [previewSheetOpen, previewStep]);

  const pageUrl = () => window.location.origin + '/business';

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(pageUrl()).catch(() => {});
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 1800);
  };

  const handleShareLink = () => {
    if (navigator.share) {
      navigator.share({ title: 'A12 Try-On', url: pageUrl() }).catch(() => {});
    } else {
      handleCopyLink();
    }
  };

  const snippetText = `<script src="https://a12.uz/widget/latest/a12.js?domain=yourstore.com" async></script>`;

  const handleCopySnippet = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(snippetText).catch(() => {});
    }
    setCopiedSnip(true);
    setTimeout(() => setCopiedSnip(false), 1800);
  };

  const openTryOnWithGarment = (garmentUrl: string) => {
    setActiveGarment(garmentUrl);
    setTryModalOpen(true);
  };

  const handleInstallContinue = () => {
    const d = normaliseStore(installStoreUrl);
    setInstallSheetOpen(false);
    if (d && d.includes('.')) {
      router.push(`/install?store=${encodeURIComponent(d)}`);
    } else {
      router.push('/install');
    }
  };

  const cleanPreviewDomain = normaliseStore(previewStoreUrl);

  return (
    <div className="one-pager-root">
      <style>{`
        .one-pager-root {
          --ink: #170404;
          --paper: #fffffc;
          --muted: #6b5555;
          --line: #17040418;
          --accent: #c65a92;
          --lav: #eae4f7;
          --wash: #faf7f8;
          --body: #4a3535;
          font-family: 'Roobert', 'Inter', -apple-system, sans-serif;
          background: var(--paper);
          color: var(--ink);
          letter-spacing: -0.01em;
          min-height: 100vh;
        }
        .one-pager-root img { display: block; max-width: 100%; height: auto; }
        .one-pager-root .wrap { width: min(1120px, 100% - 48px); margin-inline: auto; }
        @media (max-width: 620px) { .one-pager-root .wrap { width: calc(100% - 40px); } }

        .one-pager-root .eyebrow {
          display: block; font-size: 12px; font-weight: 500;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--accent); margin-bottom: 14px;
        }
        .one-pager-root h2 {
          font-size: clamp(28px, 3.4vw, 40px);
          font-weight: 500; letter-spacing: -0.04em; line-height: 1.06; max-width: 26ch;
        }
        .one-pager-root .lede {
          font-size: clamp(16px, 1.35vw, 18px); line-height: 1.5; letter-spacing: -0.02em;
          color: var(--body); margin-top: 16px; max-width: 54ch;
        }
        .one-pager-root p { line-height: 1.55; }
        .one-pager-root > section:nth-of-type(even) { background: var(--wash); }

        .one-pager-root .btn {
          min-width: 210px; height: 58px; width: auto;
          display: inline-flex; align-items: center; justify-content: center; gap: 9px;
          padding: 0 24px;
          font-family: inherit; font-size: 16px; font-weight: 500; letter-spacing: -0.02em;
          border-radius: 8px; border: 1.5px solid var(--ink);
          cursor: pointer; text-decoration: none;
          transition: background 0.18s ease, color 0.18s ease, transform 0.18s ease;
        }
        .one-pager-root .btn:active { transform: translateY(1px); }
        .one-pager-root .btn-primary { background: var(--ink); color: var(--paper); }
        .one-pager-root .btn-primary:hover { background: #000; }
        .one-pager-root .btn-secondary { background: transparent; color: var(--ink); }
        .one-pager-root .btn-secondary:hover { background: #f7f2f4; }
        .one-pager-root .btn-sm { height: 46px; min-width: 0; font-size: 15px; padding: 0 20px; }

        .one-pager-root .btn-stack {
          flex-direction: column; gap: 3px;
          height: auto; min-height: 64px; padding: 11px 24px; line-height: 1.15;
        }
        .one-pager-root .btn-stack .b-main { display: inline-flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 500; }
        .one-pager-root .btn-stack .b-sub  { font-size: 12px; font-weight: 400; opacity: 0.7; letter-spacing: 0; }

        .one-pager-root .cta-row { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 30px; }
        .one-pager-root .hero .cta-row { display: grid; grid-template-columns: max-content; }
        .one-pager-root .fine { font-size: 13px; color: var(--muted); margin-top: 14px; line-height: 1.6; max-width: 62ch; }
        .one-pager-root .fine a { color: var(--ink); }

        .one-pager-root .topbar {
          position: sticky; top: 0; z-index: 40;
          background: rgba(255,255,252,0.9);
          -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px);
          border-bottom: 0.5px solid var(--line);
        }
        .one-pager-root .topbar-in { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 13px 0; }
        .one-pager-root .topbar-cta { display: flex; align-items: center; gap: 10px; }

        .one-pager-root .hero { padding: clamp(44px, 5.5vw, 74px) 0 clamp(48px, 6vw, 82px); }
        .one-pager-root .hero-grid {
          display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 560px);
          gap: clamp(30px, 4.5vw, 60px); align-items: center;
        }
        .one-pager-root .hero h1 { font-size: clamp(38px, 4.7vw, 58px); font-weight: 500; letter-spacing: -0.04em; line-height: 0.99; }
        .one-pager-root .hero .lede { font-size: clamp(17px, 1.5vw, 20px); max-width: 45ch; color: #3a2424; }

        .one-pager-root .frame {
          border-radius: 18px; padding: clamp(16px, 2vw, 26px);
          background: var(--lav) url('/assets/a12-gradient.svg') center center / cover no-repeat;
          display: flex; justify-content: center;
        }
        .one-pager-root .frame img { border-radius: 12px; box-shadow: 0 26px 70px -22px rgba(74,18,40,0.45), 0 8px 24px rgba(30,0,15,0.14); }
        .one-pager-root .frame-hero img { width: min(100%, 600px); }
        .one-pager-root .frame-shot { padding: 0; background: none; }
        .one-pager-root .frame-shot img { width: min(100%, 800px); border-radius: 14px; box-shadow: 0 20px 56px -20px rgba(74,18,40,0.32); }

        .one-pager-root .shot { display: flex; flex-direction: column; gap: 10px; }
        .one-pager-root .shot-cap { font-size: 12.5px; color: var(--muted); letter-spacing: -0.01em; }
        .one-pager-root .demo-link-row { margin-top: 14px; font-size: 15px; color: var(--body); }
        .one-pager-root .demo-link-row a { color: var(--ink); text-decoration: underline; text-underline-offset: 3px; }
        .one-pager-root .expert-row { font-size: 15px; color: var(--muted); }
        .one-pager-root .expert-row a { color: var(--body); }

        .one-pager-root .demo { padding: clamp(52px, 6vw, 84px) 0; scroll-margin-top: 88px; }
        .one-pager-root .garments {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 14px; margin-top: 34px;
        }
        .one-pager-root .garment {
          position: relative;
          border: 0.5px solid var(--line); border-radius: 12px;
          background: var(--wash); overflow: hidden; aspect-ratio: 3 / 4;
          cursor: pointer;
        }
        .one-pager-root .garment img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.25s ease; }
        .one-pager-root .garment:hover img { transform: scale(1.02); }
        .one-pager-root .vton-pin-btn {
          position: absolute; top: 12px; right: 12px; z-index: 3;
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 13px; border-radius: 999px;
          background: rgba(255, 255, 252, 0.94); color: var(--ink);
          border: 1px solid rgba(23, 4, 4, 0.14);
          box-shadow: 0 6px 18px rgba(23, 4, 4, 0.16);
          font-family: inherit; font-size: 13px; font-weight: 500;
          cursor: pointer; transition: transform 0.15s ease, background 0.15s ease;
        }
        .one-pager-root .vton-pin-btn:hover { background: #fff; transform: translateY(-1px); }
        .one-pager-root .vton-pin-btn svg { width: 13px; height: 13px; color: var(--accent); }
        .one-pager-root .demo-foot { margin-top: 18px; font-size: 13px; color: var(--muted); line-height: 1.6; max-width: 76ch; }
        @media (max-width: 760px) { .one-pager-root .garments { grid-template-columns: repeat(2, 1fr); } }

        .one-pager-root .why { padding: clamp(56px, 6.5vw, 88px) 0; }
        .one-pager-root .why-head {
          display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 580px);
          gap: clamp(28px, 4vw, 50px); align-items: center;
        }

        .one-pager-root .numbers { padding: clamp(44px, 5vw, 68px) 0; }
        .one-pager-root .rows { margin-top: 22px; border-top: 0.5px solid var(--line); }
        .one-pager-root .row {
          display: grid; grid-template-columns: minmax(0, 340px) minmax(0, auto) minmax(0, 1fr);
          gap: 6px 28px; align-items: baseline;
          padding: 20px 0; border-bottom: 0.5px solid var(--line);
        }
        .one-pager-root .row-claim {
          font-size: clamp(21px, 2.3vw, 28px); font-weight: 500;
          letter-spacing: -0.04em; line-height: 1.1; color: var(--ink);
        }
        .one-pager-root .row-fig {
          font-size: clamp(22px, 2.2vw, 27px); font-weight: 500; letter-spacing: -0.04em;
          line-height: 1.05; color: var(--accent); white-space: nowrap;
        }
        .one-pager-root .row-fig span { font-size: 0.52em; letter-spacing: -0.01em; }
        .one-pager-root .row-detail { font-size: 14px; color: var(--muted); line-height: 1.55; }
        .one-pager-root .numbers-sub { font-size: 13px; color: var(--muted); margin-top: 16px; }
        @media (max-width: 820px) {
          .one-pager-root .row { grid-template-columns: 1fr; gap: 5px; padding: 18px 0; }
        }

        .one-pager-root .activate { padding: clamp(56px, 6.5vw, 88px) 0; }
        .one-pager-root .tracks {
          display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
          gap: 18px; margin-top: 40px; align-items: stretch;
        }
        .one-pager-root .track {
          min-width: 0; border: 0.5px solid var(--line); border-radius: 16px;
          padding: 28px 26px 30px; background: var(--wash);
          display: flex; flex-direction: column;
        }
        .one-pager-root .track .cta-row { margin-top: auto; padding-top: 22px; }
        .one-pager-root .track.lead { background: var(--ink); color: var(--paper); border-color: var(--ink); }
        .one-pager-root .track.lead .track-tag { color: #f0a8cd; }
        .one-pager-root .track.lead p { color: rgba(255,255,252,0.74); }
        .one-pager-root .track.lead p code { background: rgba(255,255,255,0.12); color: #f7eef2; }
        .one-pager-root .track.lead .snippet { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.16); }
        .one-pager-root .track.lead .copy-btn { color: var(--paper); border-color: rgba(255,255,255,0.32); }
        .one-pager-root .track.lead .copy-btn:hover { border-color: var(--paper); }
        .one-pager-root .track.lead .snippet-foot span { color: rgba(255,255,252,0.6); }
        .one-pager-root .track.lead .btn-primary { background: var(--paper); color: var(--ink); border-color: var(--paper); }
        .one-pager-root .track.lead .btn-primary:hover { background: #fff; }
        .one-pager-root .track.lead .fine { color: rgba(255,255,252,0.66); }
        .one-pager-root .track.lead .fine a { color: var(--paper); }
        .one-pager-root .track-head { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
        .one-pager-root .opt-n {
          flex-shrink: 0; width: 26px; height: 26px; border-radius: 50%;
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 500; border: 1.5px solid var(--ink); color: var(--ink);
        }
        .one-pager-root .track.lead .opt-n { border-color: var(--paper); color: var(--paper); }
        .one-pager-root .track-tag {
          display: inline-block; font-size: 11.5px; font-weight: 500;
          letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted);
        }
        .one-pager-root .track h3 { font-size: 22px; font-weight: 500; letter-spacing: -0.035em; line-height: 1.1; }
        .one-pager-root .track p { font-size: 15px; color: var(--body); margin-top: 12px; }
        .one-pager-root .track p code {
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 0.86em; background: rgba(23,4,4,0.06); border-radius: 4px; padding: 2px 5px;
        }
        .one-pager-root .snippet {
          margin-top: 18px; border-radius: 10px; border: 0.5px solid var(--line);
          background: #1c0a0a; padding: 15px 16px; max-width: 100%; overflow-x: auto;
        }
        .one-pager-root .snippet code {
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 12.5px; line-height: 1.65; color: #f4e9ee; white-space: pre-wrap; overflow-wrap: anywhere;
        }
        .one-pager-root .snippet .ca { color: #f0a8cd; }
        .one-pager-root .snippet .cv { color: #b9e3c6; }
        .one-pager-root .snippet-foot { display: flex; align-items: center; gap: 12px; margin-top: 10px; flex-wrap: wrap; }
        .one-pager-root .snippet-foot span { font-size: 12.5px; color: var(--muted); }
        .one-pager-root .copy-btn {
          font-family: inherit; font-size: 12.5px; font-weight: 500; color: var(--ink);
          background: transparent; border: 0.5px solid var(--line); border-radius: 6px;
          padding: 5px 11px; cursor: pointer;
        }

        .one-pager-root .qa { padding: clamp(44px, 5vw, 68px) 0; }
        .one-pager-root .qa-list { margin-top: 26px; border-top: 0.5px solid var(--line); }
        .one-pager-root .qa-list details { border-bottom: 0.5px solid var(--line); }
        .one-pager-root .qa-list summary {
          display: flex; align-items: center; justify-content: space-between; gap: 18px;
          padding: 17px 2px; cursor: pointer; list-style: none;
          font-size: 16px; font-weight: 500; letter-spacing: -0.025em;
        }
        .one-pager-root .qa-list summary::-webkit-details-marker { display: none; }
        .one-pager-root .qa-list summary::after { content: '+'; font-size: 19px; font-weight: 400; color: var(--muted); flex-shrink: 0; }
        .one-pager-root .qa-list details[open] summary::after { content: '–'; }
        .one-pager-root .qa-list summary:hover { color: var(--accent); }
        .one-pager-root .qa-a { padding: 0 2px 18px; font-size: 14.5px; line-height: 1.55; color: var(--body); max-width: 82ch; }
        .one-pager-root .qa-a code {
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 0.86em; background: rgba(23,4,4,0.06); border-radius: 4px; padding: 2px 5px;
        }
        .one-pager-root .qa-a p + p { margin-top: 10px; }

        .one-pager-root .voices { padding: clamp(44px, 5vw, 68px) 0; }
        .one-pager-root .voices-line {
          font-size: clamp(19px, 2vw, 25px); font-weight: 500; letter-spacing: -0.035em;
          line-height: 1.2; max-width: 34ch; color: var(--ink);
        }
        .one-pager-root .voices-sub { font-size: 13.5px; color: var(--muted); line-height: 1.55; margin-top: 10px; max-width: 58ch; }
          display: flex; flex-direction: column; overflow: hidden;
          border: 0.5px solid var(--line); border-radius: 12px;
          background: var(--paper); color: var(--ink); text-decoration: none;
          transition: border-color 0.18s ease, transform 0.18s ease;
        }

        .one-pager-root footer { padding: 32px 0 40px; border-top: 0.5px solid var(--line); }
        .one-pager-root .foot-in { display: flex; align-items: center; justify-content: space-between; gap: 16px 30px; flex-wrap: wrap; }
        .one-pager-root .legal { display: flex; gap: 8px 22px; flex-wrap: wrap; }
        .one-pager-root .legal a { font-size: 12.5px; color: var(--muted); text-decoration: none; }
        .one-pager-root .legal a:hover { color: var(--ink); text-decoration: underline; text-underline-offset: 3px; }

        /* Sheet Modal Overlay */
        .one-pager-root .sheet-overlay {
          position: fixed; inset: 0; z-index: 950;
          background: rgba(6,5,3,0.55); -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center; padding: 20px;
        }
        .one-pager-root .sheet-in {
          position: relative; width: min(520px, 100%); max-height: calc(100dvh - 40px); overflow-y: auto;
          background: var(--paper); color: var(--ink);
          border: 0.5px solid var(--line); border-radius: 18px;
          padding: 28px 26px 26px;
          box-shadow: 0 24px 70px rgba(40,10,25,0.35);
        }
        .one-pager-root .sheet-close {
          position: absolute; top: 16px; right: 16px;
          width: 30px; height: 30px; border-radius: 50%;
          border: 1px solid rgba(23,4,4,0.18); background: transparent; color: var(--ink);
          font-size: 16px; line-height: 1; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
        }
        .one-pager-root .sheet-in h4 {
          font-size: clamp(20px, 2.4vw, 26px); font-weight: 500;
          letter-spacing: -0.035em; line-height: 1.1; padding-right: 34px;
        }
        .one-pager-root .wiz-dots { display: flex; align-items: center; gap: 7px; margin-bottom: 18px; }
        .one-pager-root .wiz-dots .d {
          width: 7px; height: 7px; border-radius: 50%; background: rgba(23,4,4,0.16);
          transition: width 0.35s cubic-bezier(.16,1,.3,1), background 0.35s, border-radius 0.35s;
        }
        .one-pager-root .wiz-dots .d.active { width: 30px; border-radius: 4px; background: var(--ink); }
        .one-pager-root .sheet-lede { font-size: 14.5px; color: var(--body); line-height: 1.5; margin-top: 10px; }
        .one-pager-root .url-row { margin-top: 18px; }
        .one-pager-root .url-row label {
          display: block; font-size: 12px; font-weight: 500; letter-spacing: 0.06em;
          text-transform: uppercase; color: var(--muted); margin-bottom: 7px;
        }
        .one-pager-root .url-row input {
          width: 100%; font-family: inherit; font-size: 15px; color: var(--ink);
          background: var(--paper); border: 1px solid rgba(23,4,4,0.18); border-radius: 9px;
          padding: 12px 14px;
        }
        .one-pager-root .sheet-cta { margin-top: 22px; }
        .one-pager-root .sheet-cta .btn { width: 100%; }
        .one-pager-root .bookmarklet { cursor: grab; border-style: dashed; }
        .one-pager-root .bookmarklet:active { cursor: grabbing; }
        .one-pager-root .wiz-next {
          margin-top: 14px; background: none; border: none; padding: 0; cursor: pointer;
          font-family: inherit; font-size: 14px; color: var(--muted);
          text-decoration: underline; text-underline-offset: 3px;
        }

        @media (max-width: 940px) {
          .one-pager-root .hero-grid, .one-pager-root .why-head, .one-pager-root .tracks {
            grid-template-columns: minmax(0, 1fr);
          }
        }
        @media (max-width: 620px) {
          .one-pager-root .cta-row .btn { width: 100%; }
          .one-pager-root .hero .cta-row { grid-template-columns: 1fr; }
          .one-pager-root .topbar .btn-talk { display: none; }
        }
      `}</style>

      <header className="topbar">
        <div className="wrap topbar-in">
          <BrandWordmark small />
          <span className="topbar-cta">
            <LanguageSwitcher />
            <button
              type="button"
              className="btn btn-secondary btn-sm btn-talk"
              onClick={openPreview}
            >
              {t.seeItOnMyStore}
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setInstallSheetOpen(true)}
            >
              {t.installOnMyStore}
            </button>
          </span>
        </div>
      </header>

      {/* ═══ BEAT 1 — Here is A12 ═══ */}
      <section className="hero">
        <div className="wrap hero-grid">
          <div>
            <h1>
              {t.bizHeroTitle1}
              <br />
              {t.bizHeroTitle2}
            </h1>
            <p className="lede">{t.bizHeroLede}</p>
            <div className="cta-row">
              <button
                type="button"
                className="btn btn-primary btn-stack"
                onClick={() => setInstallSheetOpen(true)}
              >
                <span className="b-main">{t.installOnMyStore}</span>
                <span className="b-sub">{t.forFreeOneLine}</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-stack"
                onClick={openPreview}
              >
                <span className="b-main">
                  {t.seeItOnMyStore}
                </span>
                <span className="b-sub">{t.ownProductPagesSub}</span>
              </button>
            </div>
            <p className="demo-link-row">
              <a href="#demo">{t.orTryItRightHere}</a>
            </p>
            <p className="demo-link-row expert-row">
              <Link href="/install">{t.talkToExpert}</Link>
            </p>
          </div>

          <div className="shot">
            <div className="frame frame-hero">
              <img
                src="/assets/one-pager/vton-hero.gif"
                alt="A shopper live on camera: their own t-shirt, and a red floral dress rendered onto them in real time"
                width={600}
                height={337}
              />
            </div>
            <p className="shot-cap">{t.heroShotCaption}</p>
          </div>
        </div>
      </section>

      {/* ═══ LIVE DEMO — the widget itself, on this page ═══ */}
      <section className="demo" id="demo">
        <div className="wrap">
          <span className="eyebrow">{t.liveDemoEyebrow}</span>
          <h2>{t.liveDemoTitle}</h2>
          <p className="lede">{t.liveDemoLede}</p>

          <div className="garments">
            {DEMO_GARMENTS.map((src, i) => (
              <div
                key={src}
                className="garment"
                onClick={() => openTryOnWithGarment(src)}
              >
                <button
                  type="button"
                  className="vton-pin-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    openTryOnWithGarment(src);
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 2l1.6 6.4a2 2 0 0 0 1.5 1.5L22 12l-6.4 1.6a2 2 0 0 0-1.5 1.5L12 22l-1.6-6.4a2 2 0 0 0-1.5-1.5L2 12l6.4-1.6a2 2 0 0 0 1.5-1.5z" />
                  </svg>
                  {t.tryOnPin}
                </button>
                <img
                  src={src}
                  alt={`Garment ${i + 1} to try on`}
                  width={522}
                  height={700}
                  loading="lazy"
                />
              </div>
            ))}
          </div>

          <p className="demo-foot">{t.liveDemoFoot}</p>
        </div>
      </section>

      {/* ═══ BEAT 2 — Why you'd use it ═══ */}
      <section className="why">
        <div className="wrap">
          <div className="why-head">
            <div>
              <span className="eyebrow">{t.engagementEyebrow}</span>
              <h2>{t.engagementTitle}</h2>
              <p className="lede">{b.engagementLede}</p>
            </div>
            <div className="shot">
              <div className="frame frame-shot">
                <img
                  src="/assets/one-pager/vton-extension.gif"
                  loading="lazy"
                  alt="The A12 try-on panel open on a store's page, rendering a garment onto the shopper live"
                  width={800}
                  height={586}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ The three facts ═══ */}
      <section className="numbers">
        <div className="wrap">
          <span className="eyebrow">{b.factsEyebrow}</span>

          <div className="rows">
            {(
              [
                [b.fact1Claim, b.fact1Fig, b.fact1Detail],
                [b.fact2Claim, b.fact2Fig, b.fact2Detail],
                [b.fact3Claim, b.fact3Fig, b.fact3Detail],
              ] as const
            ).map(([claim, fig, detail]) => (
              <div className="row" key={fig}>
                <div className="row-claim">{claim}</div>
                <div className="row-fig">{fig}</div>
                <p className="row-detail">{detail}</p>
              </div>
            ))}
          </div>

          <p className="numbers-sub">{b.factsSub}</p>
        </div>
      </section>

      {/* ═══ BEAT 3 — Activate today ═══ */}
      <section className="activate" id="activate">
        <div className="wrap">
          <span className="eyebrow">{t.activateEyebrow}</span>
          <h2>{t.activateTitle}</h2>
          <p className="lede">{t.activateLede}</p>

          <div className="tracks">
            <div className="track">
              <div className="track-head">
                <span className="opt-n" aria-hidden="true">
                  1
                </span>
                <span className="track-tag">{t.opt1Tag}</span>
              </div>
              <h3>{t.opt1Title}</h3>
              <p>{t.opt1Body}</p>

              <div className="cta-row">
                <button
                  type="button"
                  className="btn btn-secondary btn-stack"
                  onClick={openPreview}
                >
                  <span className="b-main">
                    {t.opt1Btn}
                  </span>
                  <span className="b-sub">{t.opt1Sub}</span>
                </button>
              </div>
            </div>

            <div className="track lead">
              <div className="track-head">
                <span className="opt-n" aria-hidden="true">
                  2
                </span>
                <span className="track-tag">{t.opt2Tag}</span>
              </div>
              <h3>{t.opt2Title}</h3>
              <p>{t.opt2Body}</p>

              <div className="snippet">
                <code id="snip">
                  &lt;<span className="ca">script</span> <span className="ca">src</span>=
                  <span className="cv">
                    &quot;https://a12.uz/widget/latest/a12.js?domain=yourstore.com&quot;
                  </span>{' '}
                  <span className="ca">async</span>&gt;&lt;/<span className="ca">script</span>&gt;
                </code>
              </div>
              <div className="snippet-foot">
                <button className="copy-btn" type="button" onClick={handleCopySnippet}>
                  {copiedSnip ? t.copied : t.copyBtn}
                </button>
                <span>Shopify · WooCommerce · HTML</span>
              </div>

              <div className="cta-row">
                <button
                  type="button"
                  className="btn btn-primary btn-stack"
                  onClick={() => setInstallSheetOpen(true)}
                >
                  <span className="b-main">{t.installOnMyStore}</span>
                  <span className="b-sub">{t.justOneLine}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Q&A ═══ */}
      <section className="qa" id="qa">
        <div className="wrap">
          <span className="eyebrow">{b.qaEyebrow}</span>
          <h2>{b.qaTitle}</h2>

          <div className="qa-list">
            {b.qa.map(([question, answer]) => (
              <details key={question}>
                <summary>{question}</summary>
                <div className="qa-a">{answer}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Social share ═══ */}
      <section className="voices" id="voices">
        <div className="wrap">
          <span className="eyebrow">{b.shareEyebrow}</span>
          <p className="voices-line">{b.shareTitle}</p>
          <p className="voices-sub">{b.shareLede}</p>
          <div className="cta-row">
            <a className="btn btn-secondary btn-sm" href="#demo">
              {t.orTryItRightHere}
            </a>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap foot-in">
          <PoweredByA12 />
          <nav className="legal" aria-label="Legal">
            <Link href="/virtual-try-on">{t.navVirtualTryOn}</Link>
            <Link href="/mobile">{t.navMobileApp}</Link>
            <Link href="/legal#privacy">{t.navPrivacy}</Link>
            <Link href="/legal#terms">{t.navTerms}</Link>
            <Link href="/legal#aup">{t.navAup}</Link>
            <Link href="/">a12.uz</Link>
          </nav>
        </div>
      </footer>

      {/* ═══ Option 1: private preview via bookmark ═══ */}
      {previewSheetOpen && (
        <div
          className="sheet-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPreviewSheetOpen(false);
          }}
        >
          <div className="sheet-in" role="dialog" aria-modal="true" aria-labelledby="preview-title">
            <button
              className="sheet-close"
              type="button"
              onClick={() => setPreviewSheetOpen(false)}
              aria-label={b.close}
            >
              &times;
            </button>
            <div className="wiz-dots" aria-hidden="true">
              <span className={`d ${previewStep === 1 ? 'active' : ''}`} />
              <span className={`d ${previewStep === 2 ? 'active' : ''}`} />
              <span className={`d ${previewStep === 3 ? 'active' : ''}`} />
            </div>

            {previewStep === 1 && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setPreviewStep(2);
                }}
              >
                <h4 id="preview-title">{b.pv1Title}</h4>
                <p className="sheet-lede">{b.pv1Lede}</p>
                <div className="url-row">
                  <label htmlFor="store-url">{b.storeLabel}</label>
                  <input
                    id="store-url"
                    type="text"
                    inputMode="url"
                    autoComplete="url"
                    placeholder="yourstore.com"
                    value={previewStoreUrl}
                    onChange={(e) => setPreviewStoreUrl(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="sheet-cta">
                  <button className="btn btn-primary" type="submit">
                    {b.pv1Btn}
                  </button>
                </div>
              </form>
            )}

            {previewStep === 2 && (
              <div>
                <h4 id="preview-title">{b.pv2Title}</h4>
                <p className="sheet-lede">{b.pv2Lede}</p>
                <div className="sheet-cta">
                  <a
                    ref={bookmarkletRef}
                    className="btn btn-primary bookmarklet"
                    draggable
                    onClick={(e) => e.preventDefault()}
                  >
                    ✨ A12 Try-On
                  </a>
                </div>
                <button className="wiz-next" type="button" onClick={() => setPreviewStep(3)}>
                  {b.pv2Next}
                </button>
              </div>
            )}

            {previewStep === 3 && (
              <div>
                <h4 id="preview-title">{b.pv3Title}</h4>
                <p className="sheet-lede">
                  {b.pv3Lede.replace('{store}', cleanPreviewDomain || b.pv3Fallback)}
                </p>
                {cleanPreviewDomain.includes('.') && (
                  <div className="sheet-cta">
                    <a
                      className="btn btn-primary"
                      href={`https://${cleanPreviewDomain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {b.pv3Open.replace('{store}', cleanPreviewDomain)}
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ Mobile notice: the preview needs a laptop ═══ */}
      {laptopSheetOpen && (
        <div
          className="sheet-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setLaptopSheetOpen(false);
          }}
        >
          <div className="sheet-in" role="dialog" aria-modal="true" aria-labelledby="laptop-title">
            <button
              className="sheet-close"
              type="button"
              onClick={() => setLaptopSheetOpen(false)}
              aria-label={b.close}
            >
              &times;
            </button>
            <h4 id="laptop-title">{b.lpTitle}</h4>
            <p className="sheet-lede">{b.lpLede}</p>
            <div className="sheet-cta">
              <button className="btn btn-primary" type="button" onClick={handleShareLink}>
                {t.handoffShareBtn}
              </button>
            </div>
            <p className="fine">{t.handoffSubNote}</p>
            <button className="wiz-next" type="button" onClick={handleCopyLink}>
              {copiedLink ? t.copied : t.copyLink}
            </button>
          </div>
        </div>
      )}

      {/* ═══ Install Hand-off Sheet ═══ */}
      {installSheetOpen && (
        <div
          className="sheet-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setInstallSheetOpen(false);
          }}
        >
          <form
            className="sheet-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="install-title"
            onSubmit={(e) => {
              e.preventDefault();
              handleInstallContinue();
            }}
          >
            <button
              className="sheet-close"
              type="button"
              onClick={() => setInstallSheetOpen(false)}
              aria-label={b.close}
            >
              &times;
            </button>
            <h4 id="install-title">{b.inTitle}</h4>
            <p className="sheet-lede">{b.inLede}</p>
            <div className="url-row">
              <label htmlFor="install-url">{b.storeLabel}</label>
              <input
                id="install-url"
                type="text"
                inputMode="url"
                autoComplete="url"
                placeholder="yourstore.com"
                value={installStoreUrl}
                onChange={(e) => setInstallStoreUrl(e.target.value)}
                autoFocus
              />
            </div>
            <div className="sheet-cta">
              <button className="btn btn-primary" type="submit">
                {b.inBtn}
              </button>
            </div>
            <button
              className="wiz-next"
              type="button"
              onClick={() => {
                setInstallSheetOpen(false);
                router.push('/install');
              }}
            >
              {b.inSkip}
            </button>
          </form>
        </div>
      )}

      {/* ═══ Live Try-On Modal triggered from the 3 garments in #demo ═══ */}
      <LiveTryOnModal
        open={tryModalOpen}
        onClose={() => setTryModalOpen(false)}
        initialGarmentUrl={activeGarment}
      />
    </div>
  );
}
