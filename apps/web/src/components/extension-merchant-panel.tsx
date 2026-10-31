'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Check,
  Code2,
  Copy,
  ExternalLink,
  GripVertical,
  Puzzle,
  ShoppingBag,
  Sparkles,
  Wand2,
} from 'lucide-react';
import type { GarmentItem, SupportedLocale } from '@webpul/shared-core';
import type { Dictionary } from '@/lib/i18n';

interface ExtensionMerchantPanelProps {
  locale: SupportedLocale;
  dict: Dictionary['extension'];
  catalog: GarmentItem[];
  activeGarment: GarmentItem;
  onSelectGarmentAndOpenStudio: (garment: GarmentItem) => void;
}

export function ExtensionMerchantPanel({
  locale,
  dict,
  catalog,
  activeGarment,
  onSelectGarmentAndOpenStudio,
}: ExtensionMerchantPanelProps) {
  const [copiedSdk, setCopiedSdk] = useState(false);
  const [floatingPreviewItem, setFloatingPreviewItem] = useState<GarmentItem>(activeGarment);
  const [isDragHighlight, setIsDragHighlight] = useState(false);

  const merchantSnippet = `<!-- A12 Anywear 30FPS Live Virtual Try-On Widget (Shopify / WooCommerce / Custom) -->
<script
  src="https://cdn.a12-anywear.ai/v1/anywear-widget.js"
  data-merchant-key="a12_live_pk_99481a"
  data-engine="lucy-vton-30fps"
  data-theme="dark-glass"
  async
></script>`;

  const handleCopySnippet = () => {
    void navigator.clipboard?.writeText(merchantSnippet);
    setCopiedSdk(true);
    setTimeout(() => setCopiedSdk(false), 2000);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header Banner */}
      <div className="rounded-3xl border border-slate-800/90 bg-slate-900/60 p-6 backdrop-blur-md">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
          <Puzzle className="h-3.5 w-3.5" />
          Manifest V3 Chrome/Edge Extension + E-Commerce Widget
        </div>
        <h2 className="mt-3 text-2xl font-extrabold text-white">{dict.title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300">
          {dict.subtitle}
        </p>
      </div>

      {/* Interactive Store + Floating Chrome Extension Split Sandbox */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Simulated Online Fashion Store (Left 7 Cols) */}
        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5 lg:col-span-7">
          <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-cyan-400" />
              <span className="text-sm font-bold text-white">{dict.merchantTitle}</span>
            </div>
            <span className="rounded-lg bg-slate-900 px-2.5 py-1 font-mono text-[11px] text-slate-400">
              https://store.example.com/new-arrivals
            </span>
          </div>

          <p className="mb-4 text-xs text-slate-400">{dict.merchantSubtitle}</p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {catalog.slice(0, 4).map((item) => (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', item.id);
                }}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-800/90 bg-slate-900/70 p-4 transition hover:border-cyan-400/60"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {item.brand}
                    </span>
                    <GripVertical className="h-4 w-4 cursor-grab text-slate-500 group-hover:text-cyan-400" />
                  </div>

                  {/* Visual Garment Swatch Card */}
                  <div
                    className="my-3 flex h-28 w-full flex-col items-center justify-center rounded-xl border border-white/10 p-3 shadow-inner"
                    style={{
                      background: `linear-gradient(135deg, ${item.primaryColor}, ${item.secondaryColor})`,
                    }}
                  >
                    <span className="rounded-full bg-black/40 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                      {item.silhouetteType.toUpperCase()} • {item.fabric.toUpperCase()}
                    </span>
                    <span className="mt-1.5 text-center text-xs font-extrabold text-white">
                      {item.name[locale]}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-sm font-extrabold text-white">{item.price}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFloatingPreviewItem(item)}
                      className="rounded-xl border border-cyan-400/40 bg-cyan-500/15 px-2.5 py-1.5 text-[11px] font-bold text-cyan-300 transition hover:bg-cyan-500/25"
                    >
                      Widget Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectGarmentAndOpenStudio(item)}
                      className="flex items-center gap-1 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 px-2.5 py-1.5 text-[11px] font-bold text-slate-950 transition hover:brightness-110"
                    >
                      <Wand2 className="h-3 w-3" />
                      Studio
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Simulated Chrome/Edge Floating Extension Window (Right 5 Cols) */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragHighlight(true);
          }}
          onDragLeave={() => setIsDragHighlight(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragHighlight(false);
            const droppedId = e.dataTransfer.getData('text/plain');
            const found = catalog.find((c) => c.id === droppedId);
            if (found) setFloatingPreviewItem(found);
          }}
          className={`flex flex-col justify-between rounded-3xl border p-5 transition-all lg:col-span-5 ${
            isDragHighlight
              ? 'border-cyan-400 bg-cyan-950/20 ring-4 ring-cyan-400/30'
              : 'border-slate-700/80 bg-slate-900/90 shadow-2xl'
          }`}
        >
          <div>
            {/* Extension Floating Top Bar */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Image src="/logo-mark.png" alt="A12" width={20} height={20} unoptimized />
                <span className="text-xs font-extrabold tracking-wide text-white">
                  A12 ANYWEAR EXTENSION
                </span>
              </div>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                30 FPS LIVE
              </span>
            </div>

            {/* Floating Extension Mirror Preview */}
            <div
              className="relative my-4 flex h-64 flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/10 p-4"
              style={{
                background: `radial-gradient(circle at 50% 40%, ${floatingPreviewItem.secondaryColor}55, #050811 78%)`,
              }}
            >
              <div
                className="flex h-36 w-36 flex-col items-center justify-center rounded-2xl border-2 p-3 text-center shadow-xl transition-all"
                style={{
                  background: `linear-gradient(145deg, ${floatingPreviewItem.primaryColor}, ${floatingPreviewItem.secondaryColor})`,
                  borderColor: floatingPreviewItem.accentColor,
                }}
              >
                <Sparkles className="h-5 w-5 text-cyan-200" />
                <div className="mt-1.5 text-xs font-extrabold text-white">
                  {floatingPreviewItem.name[locale]}
                </div>
                <div className="mt-1 text-[10px] text-cyan-200">
                  {floatingPreviewItem.brand} • {floatingPreviewItem.price}
                </div>
              </div>

              <div className="mt-3 text-[11px] font-medium text-slate-300">
                {dict.dragHint}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectGarmentAndOpenStudio(floatingPreviewItem)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-400 py-3 text-xs font-extrabold text-slate-950 shadow-lg shadow-sky-500/20 transition hover:brightness-110"
          >
            <ExternalLink className="h-4 w-4" />
            {dict.tryOnButton} ({floatingPreviewItem.name[locale]})
          </button>
        </div>
      </div>

      {/* 1-Line Merchant Embed SDK Code Block */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">
              Shopify / WooCommerce / Custom Store 1-Line Integration SDK
            </h3>
          </div>
          <button
            type="button"
            onClick={handleCopySnippet}
            className="flex items-center gap-1.5 rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-semibold text-cyan-300 transition hover:bg-slate-700"
          >
            {copiedSdk ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                Copied Script
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy Embed Code
              </>
            )}
          </button>
        </div>
        <pre className="mt-3 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs leading-relaxed text-cyan-300">
          {merchantSnippet}
        </pre>
      </div>
    </div>
  );
}
