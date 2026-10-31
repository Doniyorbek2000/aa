import { NextResponse } from 'next/server';
import { INITIAL_GARMENT_CATALOG, parseProductUrlToGarment } from '@webpul/shared-core';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    engine: 'A12-Lucy-VTON-v2.4-FP8',
    fps: 30,
    platforms: ['web', 'ios', 'android', 'extension'],
    catalogCount: INITIAL_GARMENT_CATALOG.length,
    catalog: INITIAL_GARMENT_CATALOG,
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: string };
    if (!body.url || typeof body.url !== 'string') {
      return NextResponse.json(
        { error: 'Product URL is required' },
        { status: 400 }
      );
    }
    const garment = parseProductUrlToGarment(body.url);
    return NextResponse.json({
      status: 'extracted',
      latencyMs: 39,
      garment,
    });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request payload' },
      { status: 400 }
    );
  }
}

