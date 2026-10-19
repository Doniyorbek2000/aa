import Image from 'next/image';
import Link from 'next/link';

/** Brand mark (transparent PNG cut from logo.png) + text wordmark, so it reads in both themes. */
export function Logo({ href }: { href: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 rounded-input font-bold tracking-tight">
      <Image src="/logo-mark.png" alt="" width={28} height={28} priority unoptimized />
      <span className="text-[19px]">A12</span>
    </Link>
  );
}
