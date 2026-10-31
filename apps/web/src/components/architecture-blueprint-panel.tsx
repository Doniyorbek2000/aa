'use client';

import React from 'react';
import {
  Cpu,
  Database,
  FolderTree,
  Globe,
  Network,
  Server,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import type { Dictionary } from '@/lib/i18n';

export function ArchitectureBlueprintPanel({
  dict,
}: {
  dict: Dictionary['architecture'];
}) {
  const layers = [
    {
      icon: Globe,
      badge: 'Layer 1 • Omni-Client',
      title: 'Web Studio + iOS/Android Mobile + Chrome Extension',
      color: 'from-sky-500/20 to-cyan-500/10 border-sky-500/30',
      items: [
        'apps/web (Next.js 16 + React 19 + WebRTC + 30 FPS HTML5/WebGPU Canvas)',
        'apps/mobile (React Native 0.79 + Expo 53 + VisionCamera 4 + react-native-webrtc)',
        'apps/extension (Manifest V3 Universal Drag-and-Drop Content Script & Floating HUD)',
        'packages/shared-core (100% shared TypeScript domain types, URL parser, i18n, physics state)',
      ],
    },
    {
      icon: Network,
      badge: 'Layer 2 • Ultra-Low Latency Transport',
      title: 'Global WebRTC SFU + Zero-Renegotiation RTCDataChannel',
      color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30',
      items: [
        'Sub-45ms glass-to-glass latency via edge WebRTC Selective Forwarding Units (SFU)',
        'Hardware-accelerated H.264 / VP9 video ingress & egress at 1080p @ 30 FPS',
        'Out-of-band RTCDataChannel streams 17-point 3D pose keypoints + instant garment hot-swaps',
        'Adaptive bitrate & automatic local physics fallback if network jitter spikes',
      ],
    },
    {
      icon: Cpu,
      badge: 'Layer 3 • Real-Time AI World Model',
      title: 'A12 Lucy V-TON Diffusion-Forcing Video Engine (30 FPS)',
      color: 'from-purple-500/20 to-indigo-500/10 border-purple-500/30',
      items: [
        'Autoregressive Diffusion-Forcing Latent Video Model compiled with TensorRT FP8 on H100 GPUs',
        'Zero-Shot Garment Extractor: SAM-2 + U2Net + DensePose isolates clothing from any store URL',
        'Material-Aware Drape Conditioning: silk, wool, denim, leather, cotton & techwear stiffness',
        'Scene Relighting & Specular Harmony: matches ambient webcam/phone lighting dynamically',
      ],
    },
    {
      icon: Database,
      badge: 'Layer 4 • Persistence & Merchant Cloud',
      title: 'API Gateway, Redis Session State & E-Commerce Catalog Sync',
      color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30',
      items: [
        'Stateless Edge API Gateway with JWT & Merchant API Key authentication',
        'Redis Cluster stores live WebRTC session handoff tokens (Web ↔ iOS/Android QR continuity)',
        'PostgreSQL + Object Storage (S3/R2) for user Digital Wardrobe, Saved Looks & WebM clips',
        'Shopify / WooCommerce Webhook & 1-Line Script Tag CDN for B2B merchant integration',
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="rounded-3xl border border-slate-800/90 bg-slate-900/60 p-6 backdrop-blur-md">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
          <Sparkles className="h-3.5 w-3.5" />
          Production Engineering & AI Pipeline Blueprint
        </div>
        <h2 className="mt-3 text-2xl font-extrabold text-white">{dict.title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300">
          {dict.subtitle}
        </p>
      </div>

      {/* 4-Tier Architecture Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {layers.map((layer) => {
          const Icon = layer.icon;
          return (
            <div
              key={layer.title}
              className={`rounded-3xl border bg-gradient-to-br p-6 ${layer.color}`}
            >
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-slate-950/70 px-3 py-1 text-[11px] font-bold text-cyan-300">
                  {layer.badge}
                </span>
                <Icon className="h-5 w-5 text-cyan-300" />
              </div>
              <h3 className="mt-3 text-lg font-extrabold text-white">{layer.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {layer.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-xs leading-relaxed text-slate-200"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Monorepo Directory Map & Dataflow */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 lg:col-span-6">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <FolderTree className="h-4 w-4 text-cyan-400" />
            Monorepo Workspace Structure (`webpul`)
          </div>
          <pre className="mt-4 overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4 font-mono text-xs leading-relaxed text-cyan-300">
{`webpul/
├── logo.png                          # Official A12 Master Brand Logo
├── packages/
│   └── shared-core/                  # @webpul/shared-core (Web + iOS + Android)
│       └── src/index.ts              # Garment models, URL parser, Pose & Telemetry types
├── apps/
│   ├── web/                          # Next.js 16 + React 19 Live Virtual Try-On Studio
│   │   ├── public/logo-mark.png      # Transparent A12 Brand Mark
│   │   └── src/
│   │       ├── app/                  # Root Layout, API Health/Try-On Routes & Studio Page
│   │       ├── components/           # Live Viewport, Mobile Simulator, Extension Sandbox
│   │       └── lib/i18n.ts           # UZ / EN / RU Multi-language Dictionary
│   ├── mobile/                       # iOS & Android Native App (React Native + Expo)
│   │   ├── app.json                  # iOS Bundle ID & Android Package + Camera Permissions
│   │   ├── App.tsx                   # Native Mobile Try-On Screen & Share-Sheet Handler
│   │   └── src/services/
│   │       └── webrtcLucyStream.ts   # Low-Latency 30 FPS WebRTC + NPU Pose Client
│   └── extension/                    # Chrome / Edge Universal Drag-and-Drop Extension
│       ├── manifest.json             # Manifest V3 Configuration
│       └── content-script.js         # Universal Store Image Drag Interceptor`}
          </pre>
        </div>

        <div className="flex flex-col justify-between rounded-3xl border border-slate-800 bg-slate-950/90 p-6 lg:col-span-6">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Server className="h-4 w-4 text-emerald-400" />
              30 FPS Frame-by-Frame Neural Pipeline Latency Budget (39ms Total)
            </div>
            <div className="mt-4 space-y-3">
              {[
                {
                  step: '1. Camera Capture + On-Device NPU 17-Keypoint Pose',
                  ms: '4.2 ms',
                  pct: '12%',
                },
                {
                  step: '2. WebRTC Edge Ingress & RTCDataChannel Sync',
                  ms: '8.5 ms',
                  pct: '22%',
                },
                {
                  step: '3. Lucy V-TON Single-Step Diffusion-Forcing Warping (FP8)',
                  ms: '19.8 ms',
                  pct: '50%',
                },
                {
                  step: '4. Scene Relighting & WebRTC Frame Decode to Viewport',
                  ms: '6.5 ms',
                  pct: '16%',
                },
              ].map((row) => (
                <div
                  key={row.step}
                  className="rounded-2xl border border-slate-800/90 bg-slate-900/60 p-3"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-white">
                    <span>{row.step}</span>
                    <span className="font-mono text-cyan-300">{row.ms}</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-300"
                      style={{ width: row.pct }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-emerald-400" />
              <div>
                <div className="text-xs font-bold text-white">
                  Privacy-First Ephemeral Video Stream
                </div>
                <div className="text-[11px] text-slate-300">
                  Camera frames are processed in volatile GPU SRAM and never written to disk unless
                  the user explicitly clicks Capture or Record.
                </div>
              </div>
            </div>
            <Smartphone className="h-5 w-5 shrink-0 text-emerald-300" />
          </div>
        </div>
      </div>
    </div>
  );
}
