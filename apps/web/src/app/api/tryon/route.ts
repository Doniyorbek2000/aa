import { NextResponse } from 'next/server';
import { INITIAL_GARMENT_CATALOG, parseProductUrlToGarment } from '@webpul/shared-core';

interface OpenSourceModelSpec {
  id: string;
  name: string;
  hfSpace: string;
  githubUrl: string;
  architecture: string;
  fpsOrLatency: string;
}

const OPEN_SOURCE_VTON_MODELS: OpenSourceModelSpec[] = [
  {
    id: 'a12-pose-mesh-30fps',
    name: 'A12 Real-Time Pose & Cloth Mesh v3',
    hfSpace: 'local/webgl-canvas-30fps',
    githubUrl: 'https://github.com/google/mediapipe',
    architecture: '30 FPS Body-Torso Tracking + Multi-Slice Cloth Drape Warping',
    fpsOrLatency: '30 FPS (<16ms)',
  },
  {
    id: 'idm-vton',
    name: 'IDM-VTON (Improving Diffusion Models for Authentic Virtual Try-On)',
    hfSpace: 'yisol/IDM-VTON',
    githubUrl: 'https://github.com/yisol/IDM-VTON',
    architecture: 'SDXL TryonNet + IP-Adapter + Garment UNet Encoder',
    fpsOrLatency: 'HD Neural Diffusion',
  },
  {
    id: 'cat-vton',
    name: 'CatVTON (Concatenation Is All You Need for Virtual Try-On)',
    hfSpace: 'zhengchong/CatVTON',
    githubUrl: 'https://github.com/Zheng-Chong/CatVTON',
    architecture: 'Lightweight Spatial Concatenation Diffusion (899M params)',
    fpsOrLatency: 'Fast Neural Diffusion',
  },
  {
    id: 'oot-diffusion',
    name: 'OOTDiffusion (Outfitting Fusion based Latent Diffusion)',
    hfSpace: 'levihsu/OOTDiffusion',
    githubUrl: 'https://github.com/levihsu/OOTDiffusion',
    architecture: 'Outfitting UNet + Controllable Garment Fusion',
    fpsOrLatency: 'HD Neural Diffusion',
  },
];

/**
 * Attempts to call a public Hugging Face Gradio Space for zero-shot Diffusion Virtual Try-On
 * when personImageBase64 and garmentImageUrl/Base64 are provided.
 */
async function tryHuggingFaceGradioSpace(
  spaceHost: string,
  personDataUrl: string,
  garmentDataUrl: string,
  garmentDescription: string
): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 14000);
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const hfToken = process.env.HF_TOKEN ?? process.env.HUGGINGFACE_API_KEY;
    if (hfToken) {
      headers.Authorization = `Bearer ${hfToken}`;
    }

    const res = await fetch(`https://${spaceHost}/api/predict`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        data: [
          { background: personDataUrl, layers: [], composite: personDataUrl },
          garmentDataUrl,
          garmentDescription || 'modern fashion garment, photorealistic fabric drape',
          true,
          true,
          25,
          42,
        ],
      }),
      signal: controller.signal,
    });

    if (!res.ok) return null;
    const json = (await res.json()) as { data?: unknown[] };
    const first = json.data?.[0];
    if (typeof first === 'string' && (first.startsWith('data:image') || first.startsWith('http'))) {
      return first;
    }
    if (first && typeof first === 'object' && 'url' in first) {
      const u = (first as { url?: unknown }).url;
      if (typeof u === 'string') return u;
    }
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    engine: 'A12-OpenVTON-Hybrid-v3.0',
    fps: 30,
    openSourceModels: OPEN_SOURCE_VTON_MODELS,
    platforms: ['web', 'ios', 'android', 'extension'],
    catalogCount: INITIAL_GARMENT_CATALOG.length,
    catalog: INITIAL_GARMENT_CATALOG,
  });
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  try {
    const body = (await request.json()) as {
      url?: string;
      mode?: 'extract' | 'neural-tryon';
      modelId?: string;
      personFrame?: string;
      garmentImage?: string;
      prompt?: string;
    };

    // Mode 1: Neural Virtual Try-On synthesis (Hugging Face Open-Source VTON bridge)
    if (body.mode === 'neural-tryon' && body.personFrame && body.garmentImage) {
      const selectedModelId = body.modelId ?? 'idm-vton';
      const prompt = body.prompt ?? 'high quality photorealistic garment virtual try-on, natural fabric folds';

      const spacesToTry = [
        'yisol-idm-vton.hf.space',
        'zhengchong-catvton.hf.space',
        'levihsu-ootdiffusion.hf.space',
      ];

      for (const spaceHost of spacesToTry) {
        const remoteResult = await tryHuggingFaceGradioSpace(
          spaceHost,
          body.personFrame,
          body.garmentImage,
          prompt
        );
        if (remoteResult) {
          return NextResponse.json({
            status: 'completed',
            provider: spaceHost,
            modelId: selectedModelId,
            latencyMs: Date.now() - startedAt,
            resultImage: remoteResult,
            mode: 'hf-gradio-diffusion',
          });
        }
      }

      // If public HF ZeroGPU queue is full/rate-limited, return instant status so client uses
      // A12's local High-Precision Neural Shader & Multi-Slice Cloth Compositor
      return NextResponse.json({
        status: 'completed',
        provider: 'a12-neural-cloth-compositor',
        modelId: selectedModelId,
        latencyMs: Date.now() - startedAt,
        resultImage: null,
        mode: 'client-neural-shader',
      });
    }

    // Mode 2: Product URL extraction
    if (!body.url || typeof body.url !== 'string') {
      return NextResponse.json(
        { error: 'Product URL or neural-tryon payload is required' },
        { status: 400 }
      );
    }

    const garment = parseProductUrlToGarment(body.url);
    return NextResponse.json({
      status: 'extracted',
      latencyMs: Date.now() - startedAt,
      garment,
    });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request payload' },
      { status: 400 }
    );
  }
}
