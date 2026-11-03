import type { Metadata } from 'next';
import '../(console)/console.css';

export const metadata: Metadata = {
  title: 'A12 — xonangizda ko‘ring',
  description: 'Mebel, chiroq yoki gilamni o‘z xonangiz rasmida AI bilan ko‘ring.',
};

export default function SpaceLayout({ children }: { children: React.ReactNode }) {
  return <div className="console">{children}</div>;
}
