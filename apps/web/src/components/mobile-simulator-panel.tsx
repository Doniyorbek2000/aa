'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Check,
  Copy,
  Cpu,
  Layers,
  QrCode,
  Share2,
  Smartphone,
  Sparkles,
  Wifi,
  Zap,
} from 'lucide-react';
import type { GarmentItem, SupportedLocale } from '@webpul/shared-core';
import type { Dictionary } from '@/lib/i18n';

interface MobileSimulatorPanelProps {
  locale: SupportedLocale;
  dict: Dictionary['mobile'];
  catalog: GarmentItem[];
  activeGarment: GarmentItem;
  onSelectGarment: (garment: GarmentItem) => void;
  onImportUrl: (url: string) => void;
}

export function MobileSimulatorPanel({
  locale,
  dict,
  catalog,
  activeGarment,
  onSelectGarment,
  onImportUrl,
}: MobileSimulatorPanelProps) {
  const [deviceOs, setDeviceOs] = useState<'ios' | 'android'>('ios');
  const [mobileUrlInput, setMobileUrlInput] = useState('');
  const [copiedDeepLink, setCopiedDeepLink] = useState(false);
  const [mobileSplitMode, setMobileSplitMode] = useState(false);

  const deepLinkUri = `a12anywear://tryon?garment=${encodeURIComponent(
    activeGarment.id
  )}&fabric=${activeGarment.fabric}&fps=30`;

  const handleCopyDeepLink = () => {
    void navigator.clipboard?.writeText(deepLinkUri);
    setCopiedDeepLink(true);
    setTimeout(() => setCopiedDeepLink(false), 2000);
  };

  const handleMobileShareImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobileUrlInput.trim()) return;
    onImportUrl(mobileUrlInput);
    setMobileUrlInput('');
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      {/* Left Column: Interactive iPhone 16 Pro / Pixel 9 Pro Live Simulator */}
      <div className="flex flex-col items-center lg:col-span-5">
        {/* OS Switcher Pill */}
        <div className="mb-5 flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/80 p-1.5">
          <button
            type="button"
            onClick={() => setDeviceOs('ios')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              deviceOs === 'ios'
                ? 'bg-gradient-to-r from-sky-500 to-cyan-400 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="h-4 w-4" />
            {dict.iosLabel}
          </button>
          <button
            type="button"
            onClick={() => setDeviceOs('android')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              deviceOs === 'android'
                ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="h-4 w-4" />
            {dict.androidLabel}
          </button>
        </div>

        {/* Phone Hardware Frame */}
        <div
          className={`relative flex h-[690px] w-[345px] flex-col justify-between overflow-hidden border-[7px] bg-slate-950 shadow-2xl transition-all ${
            deviceOs === 'ios'
              ? 'rounded-[54px] border-slate-700/90 shadow-sky-500/15'
              : 'rounded-[40px] border-slate-800 shadow-emerald-500/15'
          }`}
        >
          {/* Top Notch / Dynamic Island or Punch-Hole */}
          <div className="relative z-20 flex items-center justify-between px-6 pt-3 text-[11px] font-semibold text-white">
            <span>09:41</span>
            {deviceOs === 'ios' ? (
              <div className="flex h-6 w-28 items-center justify-between rounded-full bg-black px-3 ring-1 ring-white/10">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] text-cyan-300">30FPS AI</span>
              </div>
            ) : (
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-black ring-1 ring-white/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Wifi className="h-3.5 w-3.5 text-cyan-300" />
              <span className="rounded bg-emerald-500/20 px-1 text-[9px] text-emerald-300">
                5G
              </span>
            </div>
          </div>

          {/* Mobile App Header Overlay */}
          <div className="relative z-20 mx-3 mt-2 flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/75 px-3 py-2 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <Image
                src="/logo-mark.png"
                alt="A12"
                width={20}
                height={20}
                unoptimized
              />
              <div>
                <div className="text-[11px] font-extrabold tracking-wide text-white">
                  A12 ANYWEAR
                </div>
                <div className="text-[9px] text-cyan-300">
                  {deviceOs === 'ios' ? 'Apple CoreML + WebRTC' : 'Android NNAPI + WebRTC'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMobileSplitMode(!mobileSplitMode)}
              className={`rounded-xl px-2.5 py-1 text-[10px] font-bold transition ${
                mobileSplitMode
                  ? 'bg-cyan-400 text-slate-950'
                  : 'bg-white/10 text-white'
              }`}
            >
              {mobileSplitMode ? '50/50 Split' : 'Full AI'}
            </button>
          </div>

          {/* Simulated Live Mobile Camera + Animated Garment Viewport */}
          <div className="relative my-2 flex flex-1 flex-col items-center justify-center overflow-hidden px-4">
            <div
              className="pointer-events-none absolute inset-0 opacity-35"
              style={{
                background: `radial-gradient(circle at 50% 42%, ${activeGarment.secondaryColor}, transparent 72%)`,
              }}
            />

            {/* Animated Mobile Silhouette & Garment Representation */}
            <div className="relative flex flex-col items-center">
              {/* Head */}
              <div className="h-14 w-11 rounded-full bg-gradient-to-b from-amber-200 to-amber-400/80 shadow-inner" />
              {/* Neck */}
              <div className="-mt-1 h-4 w-5 bg-amber-300/80" />
              {/* Garment Torso with Real-Time Pulse & Split Preview */}
              <div className="relative -mt-1 flex items-center justify-center">
                <div
                  className="relative flex h-44 w-40 flex-col items-center justify-between rounded-t-3xl rounded-b-xl border-2 p-3 shadow-2xl transition-all duration-300"
                  style={{
                    background: `linear-gradient(145deg, ${activeGarment.primaryColor}, ${activeGarment.secondaryColor})`,
                    borderColor: activeGarment.accentColor,
                  }}
                >
                  {mobileSplitMode && (
                    <div className="absolute inset-y-0 left-0 w-1/2 rounded-tl-3xl rounded-bl-xl border-r-2 border-cyan-300 bg-slate-800/95 flex items-center justify-center">
                      <span className="rotate-[-90deg] text-[9px] font-bold tracking-widest text-slate-400">
                        ORIGINAL
                      </span>
                    </div>
                  )}
                  <div className="z-10 flex w-full items-center justify-between text-[9px] font-bold text-white/90">
                    <span>{activeGarment.brand}</span>
                    <span className="rounded bg-black/40 px-1.5 py-0.5 text-cyan-300">
                      {activeGarment.fabric}
                    </span>
                  </div>
                  <div className="z-10 text-center">
                    <div className="text-xs font-extrabold text-white drop-shadow">
                      {activeGarment.name[locale]}
                    </div>
                    <div className="mt-0.5 text-[10px] text-white/80">
                      30.0 FPS • 38ms RTT
                    </div>
                  </div>
                  <div className="z-10 flex w-full justify-between text-[9px] text-cyan-200">
                    <span>Drape: {Math.round((1 - activeGarment.drapeStiffness) * 100)}%</span>
                    <span>{activeGarment.price}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Share-Sheet Quick URL Bar */}
            <form
              onSubmit={handleMobileShareImport}
              className="relative z-20 mt-4 flex w-full items-center gap-1.5 rounded-xl border border-white/15 bg-slate-900/90 p-1.5 backdrop-blur-md"
            >
              <Share2 className="ml-1.5 h-3.5 w-3.5 shrink-0 text-cyan-400" />
              <input
                type="text"
                value={mobileUrlInput}
                onChange={(e) => setMobileUrlInput(e.target.value)}
                placeholder="Share store link to A12 App..."
                className="w-full bg-transparent text-[11px] text-white placeholder-slate-400 focus:outline-none"
              />
              <button
                type="submit"
                className=" shrink-0 rounded-lg bg-cyan-400 px-2.5 py-1 text-[10px] font-bold text-slate-950"
              >
                Try
              </button>
            </form>
          </div>

          {/* Native Swipeable Bottom-Sheet Wardrobe Carousel */}
          <div className="relative z-20 rounded-t-3xl border-t border-white/10 bg-slate-900/95 px-3 pt-2.5 pb-5 backdrop-blur-xl">
            <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-slate-700" />
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Instant Wardrobe ({catalog.length})
              </span>
              <span className="text-[10px] font-semibold text-cyan-400">
                Haptic Swap Active
              </span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {catalog.map((item) => {
                const selected = item.id === activeGarment.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectGarment(item)}
                    className={`flex shrink-0 flex-col items-start rounded-2xl border p-2 text-left transition ${
                      selected
                        ? 'border-cyan-400 bg-cyan-500/15 ring-1 ring-cyan-400'
                        : 'border-slate-800 bg-slate-950/80 hover:border-slate-700'
                    }`}
                    style={{ width: 108 }}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span
                        className="h-3.5 w-3.5 rounded-full ring-1 ring-white/30"
                        style={{ backgroundColor: item.secondaryColor }}
                      />
                      <span className="text-[9px] font-bold text-slate-400">
                        {item.price}
                      </span>
                    </div>
                    <div className="mt-1.5 line-clamp-1 text-[10px] font-bold text-white">
                      {item.name[locale]}
                    </div>
                    <div className="text-[9px] text-slate-400">{item.brand}</div>
                  </button>
                );
              })}
            </div>
            {/* Home Indicator Bar */}
            <div className="mx-auto mt-3 h-1 w-28 rounded-full bg-white/40" />
          </div>
        </div>
      </div>

      {/* Right Column: Mobile Architecture, Deep-Link Handoff & Native Specs */}
      <div className="flex flex-col justify-between gap-6 lg:col-span-7">
        <div className="rounded-3xl border border-slate-800/90 bg-slate-900/60 p-6 backdrop-blur-md">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
            <Sparkles className="h-3.5 w-3.5" />
            iOS 19 + Android 16 Cross-Platform Architecture
          </div>
          <h2 className="mt-3 text-2xl font-extrabold text-white">{dict.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">{dict.subtitle}</p>

          {/* Deep-Link Session Handoff Box */}
          <div className="mt-6 rounded-2xl border border-sky-500/30 bg-slate-950/90 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400">
                  <QrCode className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">{dict.deepLinkTitle}</div>
                  <div className="text-xs text-slate-400">{dict.deepLinkDesc}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyDeepLink}
                className="flex items-center gap-1.5 rounded-xl bg-sky-500 px-3 py-1.5 text-xs font-bold text-slate-950 transition hover:bg-sky-400"
              >
                {copiedDeepLink ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy Deep Link
                  </>
                )}
              </button>
            </div>
            <div className="mt-3 overflow-x-auto rounded-xl bg-slate-900 px-3 py-2 font-mono text-xs text-cyan-300">
              {deepLinkUri}
            </div>
          </div>

          {/* Native Architecture Pillars */}
          <h3 className="mt-6 text-sm font-bold uppercase tracking-wider text-slate-400">
            {dict.nativeFeaturesTitle}
          </h3>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Zap className="h-4 w-4 text-cyan-400" />
                VisionCamera + WebRTC 30 FPS
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                Zero-copy GPU frame buffer from iOS AVFoundation / Android Camera2 directly into
                WebRTC hardware H.264/VP9 encoder (`apps/mobile/src/services/webrtcLucyStream.ts`).
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Cpu className="h-4 w-4 text-emerald-400" />
                On-Device NPU Pose Tracking
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                Extracts 17 3D skeletal keypoints on Apple Neural Engine (CoreML) & Android NNAPI in
                &lt;4ms before streaming over RTCDataChannel.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Share2 className="h-4 w-4 text-purple-400" />
                iOS & Android OS Share Extension
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                Share any product post or link directly from Instagram, TikTok, Zara, or Uzum Market
                into the A12 Anywear live camera mirror.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Layers className="h-4 w-4 text-amber-400" />
                100% Shared Core Monorepo
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                `apps/mobile` (`@webpul/mobile`) and `apps/web` (`@webpul/web`) share all domain
                models, URL garment parsers, and session state via `packages/shared-core`.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

