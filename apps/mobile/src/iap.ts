/**
 * Buying live AI seconds inside the app, through the App Store or Google Play (consumables).
 * The server confirms every purchase with the store before crediting it; only then is the
 * transaction finished, so a lost connection never loses a paid purchase (the store replays it).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import {
  endConnection,
  fetchProducts,
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  type Product,
  type Purchase,
} from 'expo-iap';
import { apiFetch } from './account';

export type SecondsProduct = { id: string; seconds: number; price: string };
export type BuyState = 'idle' | 'buying' | 'done' | 'pending' | 'failed';

const PRODUCT = /^a12\.seconds\.(\d+)$/;
const STORE = Platform.OS === 'ios' ? 'apple' : 'google';

function toProduct(product: Product): SecondsProduct | null {
  const match = PRODUCT.exec(product.id);
  return match ? { id: product.id, seconds: Number(match[1]), price: product.displayPrice } : null;
}

/** Sends a store purchase to A12; true once A12 has credited it (now or earlier). */
async function creditOnServer(token: string, purchase: Purchase): Promise<'ok' | 'pending' | 'failed'> {
  const res = await apiFetch('/api/iap/verify', token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      store: STORE,
      productId: purchase.productId,
      purchaseToken: purchase.purchaseToken ?? undefined,
      transactionId: purchase.id,
    }),
  }).catch(() => null);
  if (res?.ok) return 'ok';
  const data = res ? ((await res.json().catch(() => ({}))) as { reason?: string }) : {};
  return data.reason === 'pending' ? 'pending' : 'failed';
}

/** Store products for seconds, and buy(); calls onCredited after the balance grew. */
export function useSecondsStore(token: string | null, onCredited: () => void) {
  const [products, setProducts] = useState<SecondsProduct[]>([]);
  const [state, setState] = useState<BuyState>('idle');
  const credited = useRef(onCredited);
  useEffect(() => {
    credited.current = onCredited;
  }, [onCredited]);

  useEffect(() => {
    if (!token) return;
    let isActive = true;

    const settle = async (purchase: Purchase) => {
      const result = await creditOnServer(token, purchase);
      if (!isActive) return;
      if (result === 'ok') {
        // Finished only after A12 credited it; the server consumes Google purchases as well
        await finishTransaction({ purchase, isConsumable: true }).catch(() => {});
        setState('done');
        credited.current();
      } else {
        setState(result);
      }
    };

    const updated = purchaseUpdatedListener((purchase) => void settle(purchase));
    const failed = purchaseErrorListener((error) => {
      if (isActive) setState(error.code === 'user-cancelled' ? 'idle' : 'failed');
    });

    (async () => {
      try {
        await initConnection();
        const res = await apiFetch('/api/iap/products', token);
        const { products: ids } = (await res.json()) as { products?: string[] };
        if (!ids?.length) return;
        const found = (await fetchProducts({ skus: ids, type: 'in-app' })) ?? [];
        if (!isActive) return;
        setProducts(
          (found as Product[])
            .map(toProduct)
            .filter((product): product is SecondsProduct => product !== null)
            .sort((a, b) => a.seconds - b.seconds)
        );
        // Paid earlier but never finished (app closed mid-way): credit them now
        for (const purchase of await getAvailablePurchases()) {
          if (PRODUCT.test(purchase.productId)) await settle(purchase);
        }
      } catch {
        // No store on this device or build (e.g. a sideloaded APK): the section stays hidden
      }
    })();

    return () => {
      isActive = false;
      updated.remove();
      failed.remove();
      void endConnection().catch(() => {});
    };
  }, [token]);

  const buy = useCallback(async (productId: string) => {
    setState('buying');
    try {
      await requestPurchase({ request: { apple: { sku: productId }, google: { skus: [productId] } }, type: 'in-app' });
    } catch {
      setState('failed');
    }
  }, []);

  return { products, state, buy };
}
