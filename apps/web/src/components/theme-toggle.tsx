'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

type Theme = 'system' | 'light' | 'dark';
const NEXT: Record<Theme, Theme> = { system: 'light', light: 'dark', dark: 'system' };
const ICON = { system: Monitor, light: Sun, dark: Moon };

/** Runs before paint so the stored theme never flashes. Static string, no user input. */
export const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`;

export function ThemeToggle({ labels }: { labels: Record<Theme, string> }) {
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    const current = document.documentElement.dataset.theme;
    if (current === 'light' || current === 'dark') setTheme(current);
  }, []);

  function cycle() {
    const next = NEXT[theme];
    setTheme(next);
    if (next === 'system') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = next;
    try {
      if (next === 'system') localStorage.removeItem('theme');
      else localStorage.setItem('theme', next);
    } catch {
      // storage blocked (private mode): theme still applies for this page view
    }
  }

  const Icon = ICON[theme];
  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={labels[theme]}
      title={labels[theme]}
      className="grid size-9 place-items-center rounded-input text-muted transition-colors hover:bg-fg/5 hover:text-fg"
    >
      <Icon className="size-[18px]" aria-hidden />
    </button>
  );
}
