import type { Metadata } from 'next';
import './console.css';

export const metadata: Metadata = {
  title: 'A12 — boshqaruv',
  robots: { index: false, follow: false },
};

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  return <div className="console">{children}</div>;
}
