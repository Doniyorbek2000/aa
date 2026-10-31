'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BrandWordmark,
  CWS_URL,
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

  const snippetText = `<script src="https://a12.uz/widget/latest/anywear.js?domain=yourstore.com" async></script>`;

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
          background: var(--lav) url('/assets/anywear-gradient.svg') center center / cover no-repeat;
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
        .one-pager-root .vq-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 26px; }
        @media (max-width: 900px) { .one-pager-root .vq-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 520px) { .one-pager-root .vq-grid { grid-template-columns: 1fr; } }
        .one-pager-root .vq {
          display: flex; flex-direction: column; overflow: hidden;
          border: 0.5px solid var(--line); border-radius: 12px;
          background: var(--paper); color: var(--ink); text-decoration: none;
          transition: border-color 0.18s ease, transform 0.18s ease;
        }
        .one-pager-root .vq:hover { border-color: rgba(23,4,4,0.32); transform: translateY(-2px); }
        .one-pager-root .vq-shot { position: relative; display: block; height: 168px; overflow: hidden; background: #efe9f2; }
        .one-pager-root .vq-shot img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; }
        .one-pager-root .vq-body { padding: 13px 14px 12px; display: flex; flex-direction: column; gap: 9px; flex: 1; }
        .one-pager-root .vq-body q { font-size: 14px; line-height: 1.38; letter-spacing: -0.02em; quotes: '\\201C' '\\201D'; }
        .one-pager-root .vq-meta { margin-top: auto; display: flex; align-items: center; gap: 5px; font-size: 12px; color: var(--muted); }
        .one-pager-root .vq-meta strong { color: var(--ink); font-weight: 500; }
        .one-pager-root .vq-meta svg { width: 11px; height: 11px; flex-shrink: 0; margin-left: auto; }

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
            <button
              type="button"
              className="btn btn-secondary btn-sm btn-talk"
              onClick={() => {
                setPreviewStep(1);
                setPreviewSheetOpen(true);
              }}
            >
              See it on my store
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setInstallSheetOpen(true)}
            >
              Install on my store
            </button>
          </span>
        </div>
      </header>

      {/* ═══ BEAT 1 — Here is Anywear ═══ */}
      <section className="hero">
        <div className="wrap hero-grid">
          <div>
            <h1>
              Real-time
              <br />
              virtual try-on
            </h1>
            <p className="lede">
              Your shopper opens their camera and sees themselves wearing it &mdash; moving, in real
              time. Not a photo upload, not a render queue.
            </p>
            <div className="cta-row">
              <button
                type="button"
                className="btn btn-primary btn-stack"
                onClick={() => setInstallSheetOpen(true)}
              >
                <span className="b-main">Install on my store</span>
                <span className="b-sub">For free &middot; using one line of code</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-stack"
                onClick={() => {
                  setPreviewStep(1);
                  setPreviewSheetOpen(true);
                }}
              >
                <span className="b-main">
                  <img
                    className="chrome-ico"
                    src="/assets/chrome.svg"
                    alt=""
                    aria-hidden="true"
                    width={16}
                    height={16}
                  />
                  See it on my store
                </span>
                <span className="b-sub">Your own product pages &middot; only you can see it</span>
              </button>
            </div>
            <p className="demo-link-row">
              Or <a href="#demo">try it on yourself right here</a> &mdash; camera on, nothing to
              install, about a minute.
            </p>
            <p className="demo-link-row expert-row">
              or <Link href="/install">Talk to an expert</Link>
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
            <p className="shot-cap">
              The concept: one of your garments, rendered onto a real shopper, live.
            </p>
          </div>
        </div>
      </section>

      {/* ═══ LIVE DEMO — the widget itself, on this page ═══ */}
      <section className="demo" id="demo">
        <div className="wrap">
          <span className="eyebrow">Live demo</span>
          <h2>Try it on yourself, on this page.</h2>
          <p className="lede">
            Click <strong>Try-On</strong> on any garment. Every virtual try-on you have been shown
            before was a photo edit &mdash; this one you can move in.
          </p>

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
                  Try-On
                </button>
                <img
                  src={src}
                  alt={`Garment ${i + 2} to try on`}
                  width={522}
                  height={700}
                  loading="lazy"
                />
              </div>
            ))}
          </div>

          <p className="demo-foot">
            The same widget your shoppers would get, on your own products, on mobile and desktop,
            once it&rsquo;s installed. Free to trial, so it won&rsquo;t serve your whole traffic.
          </p>
        </div>
      </section>

      {/* ═══ BEAT 2 — Why you'd use it ═══ */}
      <section className="why">
        <div className="wrap">
          <div className="why-head">
            <div>
              <span className="eyebrow">Engagement</span>
              <h2>Try-on keeps shoppers in your store for longer.</h2>
              <p className="lede">
                Every minute spent trying something on is a minute on your site, on top of the
                browsing and reading they would have done anyway. Among shoppers who open it, more
                than <strong>2 in 5</strong> stay past five minutes and <strong>1 in 10</strong>{' '}
                past half an hour.
              </p>
            </div>
            <div className="shot">
              <div className="frame frame-shot">
                <img
                  src="/assets/one-pager/vton-extension.gif"
                  loading="lazy"
                  alt="The Anywear try-on panel open on a store's page, rendering a garment onto the shopper live"
                  width={800}
                  height={586}
                />
              </div>
              <p className="shot-cap">A shopper several minutes into a product page.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ The three numbers ═══ */}
      <section className="numbers">
        <div className="wrap">
          <span className="eyebrow">What changes</span>

          <div className="rows">
            <div className="row">
              <div className="row-claim">More add-to-carts.</div>
              <div className="row-fig">1 in 9</div>
              <p className="row-detail">
                11.3% of shoppers who tried a garment on clicked add-to-cart or buy-now in the same
                window.
              </p>
            </div>
            <div className="row">
              <div className="row-claim">More of your catalogue tried.</div>
              <div className="row-fig">
                8.7 <span>items per visit</span>
              </div>
              <p className="row-detail">
                Not one product page. 3 in 4 shoppers go past the first item they came for.
              </p>
            </div>
            <div className="row">
              <div className="row-claim">Longer visits.</div>
              <div className="row-fig">
                7.8 <span>minutes</span>
              </div>
              <p className="row-detail">
                Average session, from a shopper&rsquo;s first try-on to their last.
              </p>
            </div>
          </div>

          <p className="numbers-sub">Measured on our own network, across real storefronts.</p>
        </div>
      </section>

      {/* ═══ BEAT 3 — Activate today ═══ */}
      <section className="activate" id="activate">
        <div className="wrap">
          <span className="eyebrow">Activate today</span>
          <h2>One line of code to install. One click to try it first.</h2>
          <p className="lede">
            Both free to start, and either takes about a minute. Option 1 is a demo, on your own
            store, that only you can see; Option 2 puts it live for your shoppers.
          </p>

          <div className="tracks">
            <div className="track">
              <div className="track-head">
                <span className="opt-n" aria-hidden="true">
                  1
                </span>
                <span className="track-tag">Option 1 &middot; private demo</span>
              </div>
              <h3>Try it on your store, right now</h3>
              <p>
                <strong>A demo, not an install.</strong> The try-on appears on your own product
                pages, visible only to you, and nothing on your site changes. It needs a computer to
                view; once it is live, your shoppers get it on mobile too.
              </p>

              <div className="cta-row">
                <button
                  type="button"
                  className="btn btn-secondary btn-stack"
                  onClick={() => {
                    setPreviewStep(1);
                    setPreviewSheetOpen(true);
                  }}
                >
                  <span className="b-main">
                    <img
                      className="chrome-ico"
                      src="/assets/chrome.svg"
                      alt=""
                      aria-hidden="true"
                      width={20}
                      height={20}
                    />
                    See the demo on my store
                  </span>
                  <span className="b-sub">about a minute, your site is untouched</span>
                </button>
              </div>
            </div>

            <div className="track lead">
              <div className="track-head">
                <span className="opt-n" aria-hidden="true">
                  2
                </span>
                <span className="track-tag">Option 2 &middot; go live</span>
              </div>
              <h3>Install it on your store</h3>
              <p>
                Seamless: <strong>no work for your engineers</strong>. On Shopify it&rsquo;s one
                click from the{' '}
                <a
                  href="https://apps.shopify.com/anywear-virtual-try-on"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'inherit' }}
                >
                  App&nbsp;Store
                </a>
                . Anywhere else, paste one line before <code>&lt;/body&gt;</code>:
              </p>

              <div className="snippet">
                <code id="snip">
                  &lt;<span className="ca">script</span> <span className="ca">src</span>=
                  <span className="cv">
                    &quot;https://a12.uz/widget/latest/anywear.js?domain=yourstore.com&quot;
                  </span>{' '}
                  <span className="ca">async</span>&gt;&lt;/<span className="ca">script</span>&gt;
                </code>
              </div>
              <div className="snippet-foot">
                <button className="copy-btn" type="button" onClick={handleCopySnippet}>
                  {copiedSnip ? 'Copied ✓' : 'Copy'}
                </button>
                <span>Shopify: one click &middot; WooCommerce or any site: this one line</span>
              </div>

              <div className="cta-row">
                <button
                  type="button"
                  className="btn btn-primary btn-stack"
                  onClick={() => setInstallSheetOpen(true)}
                >
                  <span className="b-main">Install on my store</span>
                  <span className="b-sub">just one line of code</span>
                </button>
              </div>
              <p className="fine">
                Free to trial: enough to prove it on your store, not to serve all your shoppers.
                Happy with what you see? <Link href="/install">Talk to an expert</Link> about
                opening it to everyone.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Q&A ═══ */}
      <section className="qa" id="qa">
        <div className="wrap">
          <span className="eyebrow">For your engineers</span>
          <h2>What the one line of code gives you.</h2>

          <div className="qa-list">
            <details>
              <summary>One line of code, live in under an hour</summary>
              <div className="qa-a">
                One line before <code>&lt;/body&gt;</code>, or one click if you are on Shopify. No
                complex APIs, no build step, no theme files edited. Live in under an hour with
                near-zero engineering cost. Deleting the line removes it completely.
              </div>
            </details>
            <details>
              <summary>Fast performance, live video in real time</summary>
              <div className="qa-a">
                The try-on is live video, rendered in real time as your shopper moves. What sits on
                your storefront is a single <code>async</code> script of about{' '}
                <strong>17&nbsp;KB</strong>, so your pages keep loading exactly as fast as they do
                today.
              </div>
            </details>
            <details>
              <summary>Native by design</summary>
              <div className="qa-a">
                It&rsquo;s designed to disappear into your storefront rather than compete with it:
                neutral white surfaces, 4px radius, no brand colour of its own, and it inherits your
                typeface. It runs in an isolated frame on our origin, so your CSS can&rsquo;t touch
                it and none of its styles leak into your site.
              </div>
            </details>
            <details>
              <summary>Out of the box and yours to control</summary>
              <div className="qa-a">
                It detects product images across your pages automatically: nothing to tag or
                annotate. If you&rsquo;d rather set the rules yourself, you can restrict it to
                specific pages, swap in your own Try-On button, or hand-pick which products get it.
              </div>
            </details>
            <details>
              <summary>Broad coverage, curated live</summary>
              <div className="qa-a">
                <p>
                  Our model covers the <strong>majority of fashion catalogues</strong>. On your live
                  storefront, the Try-On button only appears on garments that render well.
                </p>
                <p>
                  Want proof? The Chrome extension preview skips the filter entirely: try any
                  garment, on any site, and judge the model&rsquo;s range yourself.
                </p>
              </div>
            </details>
            <details>
              <summary>Fabric that behaves like fabric</summary>
              <div className="qa-a">
                It&rsquo;s powered by Lucy, our real-time try-on model. Quality isn&rsquo;t
                something you take on faith: try it on the garments above, or load your own products
                with the Chrome extension and judge for yourself.
              </div>
            </details>
            <details>
              <summary>One line, every device</summary>
              <div className="qa-a">
                Yes, mobile and desktop both, once it&rsquo;s live on your store. The Chrome
                extension is the one desktop-only piece, since browser extensions simply don&rsquo;t
                install on phones. That&rsquo;s for previewing only; live, it runs everywhere.
              </div>
            </details>
          </div>
        </div>
      </section>

      {/* ═══ Social posts ═══ */}
      <section className="voices" id="voices">
        <div className="wrap">
          <span className="eyebrow">Social share opportunity</span>
          <p className="voices-line">Free distribution, built in.</p>
          <p className="voices-sub">
            Shoppers post their try-on videos to social media, and your storefront rides along.
            Distribution you didn&rsquo;t pay for, in front of people who weren&rsquo;t shopping
            yet.
          </p>
          <div className="vq-grid">
            <a
              className="vq"
              href="https://x.com/crislenta/status/2084926197130027510"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="vq-shot">
                <img
                  src="/assets/reactions/crislenta.jpg"
                  alt="Screen recording of the Anywear try-on running on a Loro Piana product page"
                  loading="lazy"
                  width={560}
                  height={350}
                />
              </span>
              <span className="vq-body">
                <q>holy shit this is good</q>
                <span className="vq-meta">
                  <strong>Cris Lenta</strong> @crislenta
                </span>
              </span>
            </a>
            <a
              className="vq"
              href="https://www.tiktok.com/@evisdrenova/video/7671078195805883661"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="vq-shot">
                <img
                  src="/assets/reactions/evisdrenova.jpg"
                  alt="evis talking to camera about Anywear"
                  loading="lazy"
                  width={560}
                  height={350}
                />
              </span>
              <span className="vq-body">
                <q>Finally good e-commerce uses of AI!</q>
                <span className="vq-meta">
                  <strong>evis</strong> @evisdrenova
                </span>
              </span>
            </a>
            <a
              className="vq"
              href="https://x.com/sofiasofian/status/2085282205316628791"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="vq-shot">
                <img
                  src="/assets/reactions/sofiasofian.jpg"
                  alt="The Anywear try-on panel open on a fashion storefront"
                  loading="lazy"
                  width={560}
                  height={350}
                />
              </span>
              <span className="vq-body">
                <q>This is truly what the future of shopping looks like</q>
                <span className="vq-meta">
                  <strong>sofía</strong> @sofiasofian
                </span>
              </span>
            </a>
            <a
              className="vq"
              href="https://x.com/DevonFrohne/status/2085435563650462069"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="vq-shot">
                <img
                  src="/assets/reactions/devonfrohne.jpg"
                  alt="The Anywear widget rendering a jacket onto the poster live"
                  loading="lazy"
                  width={560}
                  height={350}
                />
              </span>
              <span className="vq-body">
                <q>Ok trying on different outfits is cooler than I anticipated.</q>
                <span className="vq-meta">
                  <strong>▷Ξ▽O</strong> @DevonFrohne
                </span>
              </span>
            </a>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap foot-in">
          <PoweredByA12 />
          <nav className="legal" aria-label="Legal">
            <Link href="/virtual-try-on">Virtual Try-On</Link>
            <Link href="/mobile">Mobile App</Link>
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
            <Link href="/">a12.uz</Link>
          </nav>
        </div>
      </footer>

      {/* ═══ Option 1 Explainer Sheet ═══ */}
      {previewSheetOpen && (
        <div
          className="sheet-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPreviewSheetOpen(false);
          }}
        >
          <div className="sheet-in" role="dialog" aria-modal="true">
            <button
              className="sheet-close"
              type="button"
              onClick={() => setPreviewSheetOpen(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <div className="wiz-dots" aria-hidden="true">
              <span className={`d ${previewStep === 1 ? 'active' : ''}`} />
              <span className={`d ${previewStep === 2 ? 'active' : ''}`} />
              <span className={`d ${previewStep === 3 ? 'active' : ''}`} />
            </div>

            {previewStep === 1 && (
              <div>
                <h4>Create a live demo on your store</h4>
                <p className="sheet-lede">
                  It runs on your own product pages, right now. Nothing changes on your site.
                </p>
                <div className="url-row">
                  <label htmlFor="store-url">Your store</label>
                  <input
                    id="store-url"
                    type="text"
                    placeholder="yourstore.com"
                    value={previewStoreUrl}
                    onChange={(e) => setPreviewStoreUrl(e.target.value)}
                  />
                </div>
                <div className="sheet-cta">
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={() => setPreviewStep(2)}
                  >
                    Create my demo
                  </button>
                </div>
              </div>
            )}

            {previewStep === 2 && (
              <div>
                <h4>Add the extension</h4>
                <p className="sheet-lede">
                  One click, free, no account. This is what puts the try-on on your pages, for your
                  eyes only.
                </p>
                <div className="sheet-cta">
                  <a
                    className="btn btn-primary"
                    href={CWS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      className="chrome-ico"
                      src="/assets/chrome.svg"
                      alt=""
                      aria-hidden="true"
                      width={20}
                      height={20}
                    />
                    Add to Chrome, free
                  </a>
                </div>
                <button
                  className="wiz-next"
                  type="button"
                  onClick={() => setPreviewStep(3)}
                >
                  Added it, what is next
                </button>
              </div>
            )}

            {previewStep === 3 && (
              <div>
                <h4>Open your store</h4>
                <p className="sheet-lede">
                  Go to any product page on{' '}
                  <strong>{cleanPreviewDomain || 'your own store'}</strong>. The Try-On button is
                  waiting on your products, exactly what your shoppers would get once the line of
                  code is in.
                </p>
                {cleanPreviewDomain && cleanPreviewDomain.includes('.') && (
                  <div className="sheet-cta">
                    <a
                      className="btn btn-primary"
                      href={`https://${cleanPreviewDomain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open {cleanPreviewDomain}
                    </a>
                  </div>
                )}
              </div>
            )}
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
          <div className="sheet-in" role="dialog" aria-modal="true">
            <button
              className="sheet-close"
              type="button"
              onClick={() => setInstallSheetOpen(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h4>Which store are we installing on?</h4>
            <p className="sheet-lede">
              One field, then straight to the install. Nothing changes on your store until you paste
              the line of code in.
            </p>
            <div className="url-row">
              <label htmlFor="install-url">Your store</label>
              <input
                id="install-url"
                type="text"
                placeholder="yourstore.com"
                value={installStoreUrl}
                onChange={(e) => setInstallStoreUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleInstallContinue();
                  }
                }}
              />
            </div>
            <div className="sheet-cta">
              <button
                className="btn btn-primary"
                type="button"
                onClick={handleInstallContinue}
              >
                Continue to install
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
              Skip, I&rsquo;ll type it there
            </button>
          </div>
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
