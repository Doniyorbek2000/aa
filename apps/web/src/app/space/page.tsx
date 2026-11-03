import Link from 'next/link';
import { isSpaceKind } from '@/lib/space';
import { SpaceStudio } from './space-studio';

type Params = Record<string, string | string[] | undefined>;
const one = (value: string | string[] | undefined) => (typeof value === 'string' ? value : null);

/** Shops link here as /space?product=<https image>&kind=furniture&store=<widget key>. */
export default async function SpacePage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const product = one(params.product);
  const kind = one(params.kind);
  const store = one(params.store);
  return (
    <>
      <header className="console-top">
        <Link href="/" className="console-brand">
          <img src="/logo.png" alt="" width={28} height={28} />
          A12
        </Link>
      </header>
      <main className="console-main" style={{ maxWidth: 820 }}>
        <div style={{ display: 'grid', gap: 6 }}>
          <h1>Xonangizda ko‘ring</h1>
          <p className="muted">Xonangizni suratga oling va mahsulotni tanlang — AI uni xonangizga joylab beradi.</p>
        </div>
        <SpaceStudio
          initialProductUrl={product && product.startsWith('https://') && product.length <= 2048 ? product : null}
          initialKind={isSpaceKind(kind) ? kind : 'furniture'}
          storeKey={store && /^[A-Za-z0-9_-]{16,64}$/.test(store) ? store : null}
        />
      </main>
    </>
  );
}
