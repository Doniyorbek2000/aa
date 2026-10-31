'use client';

import Image from 'next/image';

export function A12Logo({ showBadge = true }: { showBadge?: boolean }) {
  return (
    <div className="flex items-center gap-3 select-none">
      <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/20 via-blue-600/15 to-teal-400/20 p-1.5 ring-1 ring-sky-400/30 shadow-lg shadow-sky-500/10">
        <Image
          src="/logo-mark.png"
          alt="A12 Logo"
          width={30}
          height={30}
          priority
          unoptimized
          className="object-contain"
        />
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="text-xl font-extrabold tracking-tight text-white">A12</span>
          <span className="bg-gradient-to-r from-sky-400 via-cyan-300 to-teal-300 bg-clip-text text-lg font-bold tracking-wide text-transparent">
            ANYWEAR
          </span>
          {showBadge && (
            <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-300">
              Lucy V-TON 30FPS
            </span>
          )}
        </div>
        <span className="text-[11px] text-slate-400">
          Real-Time AI Video Virtual Try-On Studio
        </span>
      </div>
    </div>
  );
}

