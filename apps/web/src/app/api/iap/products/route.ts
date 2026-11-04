import { offeredProducts } from '@/lib/iap';

/** Store product ids the app offers (IAP_PRODUCT_IDS), so the list changes without an app update. */
export function GET() {
  return Response.json({ products: offeredProducts() }, { headers: { 'Cache-Control': 'public, max-age=300' } });
}
