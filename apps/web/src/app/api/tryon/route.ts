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
    id: 'a12-pose-mesh',
    name: 'A12 MediaPipe 33-Keypoint Neural Pose + 16-Slice Cloth Mesh (30 FPS)',
    hfSpace: 'google/mediapipe-pose-landmarker-webgl',
    githubUrl: 'https://github.com/google-ai-edge/mediapipe',
    architecture: 'BlazePose 33-Keypoint 3D Skeleton + Anatomical Shoulder-Hip Cloth Warper',
    fpsOrLatency: '30 FPS (<12ms WebGL)',
  },
  {
    id: 'idm-vton',
    name: 'IDM-VTON (Improving Diffusion Models for Authentic Virtual Try-On)',
    hfSpace: 'yisol/IDM-VTON',
    githubUrl: 'https://github.com/yisol/IDM-VTON',
    architecture: 'SDXL TryonNet + IP-Adapter + Garment UNet Encoder',
    fpsOrLatency: 'Real HF Gradio Diffusion',
  },
  {
    id: 'oot-diffusion',
    name: 'OOTDiffusion HD (Outfitting Fusion Latent Diffusion)',
    hfSpace: 'levihsu/OOTDiffusion',
    githubUrl: 'https://github.com/levihsu/OOTDiffusion',
    architecture: 'Outfitting UNet + Controllable Garment Fusion',
    fpsOrLatency: 'Real HF Gradio Diffusion',
  },
  {
    id: 'nymbo-vton',
    name: 'Nymbo IDM-VTON Mirror (ZeroGPU)',
    hfSpace: 'nymbo/Virtual-Try-On',
    githubUrl: 'https://github.com/yisol/IDM-VTON',
    architecture: 'SDXL TryonNet + Garment Feature Extractor',
    fpsOrLatency: 'Real HF Gradio Diffusion',
  },
];

interface GradioFileData {
  path: string;
  url?: string;
  orig_name?: string;
  mime_type?: string;
  meta: { _type: 'gradio.FileData' };
}

function normalizePublicImageUrl(input: string): string {
  if (input.startsWith('/')) {
    return `https://a12.uz${input}`;
  }
  return input;
}

async function getImageBytesAndMime(imageInput: string): Promise<{ bytes: Uint8Array; mimeType: string }> {
  const normalized = normalizePublicImageUrl(imageInput);
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    const res = await fetch(normalized, { headers: { 'User-Agent': 'A12-VTON-Engine/3.3' } });
    if (!res.ok) {
      throw new Error(`Failed to fetch source image ${normalized}: ${res.status}`);
    }
    const contentType = res.headers.get('content-type') ?? 'image/png';
    const ab = await res.arrayBuffer();
    return { bytes: new Uint8Array(ab), mimeType: contentType };
  }

  const commaIdx = normalized.indexOf(',');
  const header = commaIdx > -1 ? normalized.slice(0, commaIdx) : '';
  const b64 = commaIdx > -1 ? normalized.slice(commaIdx + 1) : normalized;
  const mimeMatch = header.match(/data:([^;]+)/);
  const mimeType = mimeMatch?.[1] ?? 'image/jpeg';
  const buf = Buffer.from(b64, 'base64');
  return { bytes: new Uint8Array(buf), mimeType };
}

/**
 * Always uploads the binary image to the Gradio Space's /upload endpoint so the file
 * exists on the Space container's local /tmp/gradio/ disk.
 */
async function uploadToGradioSpace(
  baseUrl: string,
  apiPrefix: '' | '/gradio_api',
  imageInput: string,
  filename: string
): Promise<GradioFileData> {
  const { bytes, mimeType } = await getImageBytesAndMime(imageInput);
  const form = new FormData();
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const blob = new Blob([copy.buffer], { type: mimeType });
  form.append('files', blob, filename);

  const headers: Record<string, string> = {
    'User-Agent': 'A12-VTON-Engine/3.3',
  };
  const hfToken = process.env.HF_TOKEN ?? process.env.HUGGINGFACE_API_KEY;
  if (hfToken) {
    headers.Authorization = `Bearer ${hfToken}`;
  }

  const uploadRes = await fetch(`${baseUrl}${apiPrefix}/upload`, {
    method: 'POST',
    headers,
    body: form,
  });

  if (!uploadRes.ok) {
    throw new Error(`Upload failed on ${baseUrl}: ${uploadRes.status}`);
  }

  const uploadedPaths = (await uploadRes.json()) as string[];
  const firstPath = uploadedPaths[0];
  if (!firstPath) {
    throw new Error(`Empty upload response from ${baseUrl}`);
  }

  return {
    path: firstPath,
    url: `${baseUrl}${apiPrefix}/file=${firstPath}`,
    orig_name: filename,
    mime_type: mimeType,
    meta: { _type: 'gradio.FileData' },
  };
}

/**
 * Reads a Gradio v4/v5 SSE stream (/call/<fn>/<event_id>) until `event: complete`,
 * extracts the generated image URL, and downloads it as a base64 data URL so it
 * remains permanently accessible even after the ephemeral Gradio replica cleans /tmp.
 */
async function readGradioSseAndFetchDataUrl(sseUrl: string, timeoutMs = 42000): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const headers: Record<string, string> = {
      Accept: 'text/event-stream',
      'User-Agent': 'A12-VTON-Engine/3.3',
    };
    const hfToken = process.env.HF_TOKEN ?? process.env.HUGGINGFACE_API_KEY;
    if (hfToken) {
      headers.Authorization = `Bearer ${hfToken}`;
    }

    const res = await fetch(sseUrl, {
      headers,
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const text = await res.text();
    const lines = text.split('\n');
    let lastEvent = '';
    let extractedUrl: string | null = null;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (line.startsWith('event:')) {
        lastEvent = line.slice(6).trim();
      } else if (line.startsWith('data:') && lastEvent === 'complete') {
        const jsonStr = line.slice(5).trim();
        const parsed = JSON.parse(jsonStr) as unknown[];
        const first = parsed[0];
        if (first && typeof first === 'object' && 'url' in first) {
          const u = (first as { url?: unknown }).url;
          if (typeof u === 'string' && u.length > 0) extractedUrl = u;
        } else if (
          Array.isArray(first) &&
          first[0] &&
          typeof first[0] === 'object' &&
          'image' in first[0]
        ) {
          const imgObj = (first[0] as { image?: { url?: unknown } }).image;
          if (imgObj && typeof imgObj.url === 'string' && imgObj.url.length > 0) {
            extractedUrl = imgObj.url;
          }
        }
      }
    }

    if (!extractedUrl) return null;

    // Fetch the generated image immediately and return as data URL so browser never hits 404
    const imgRes = await fetch(extractedUrl, { headers });
    if (!imgRes.ok) return null;
    const contentType = imgRes.headers.get('content-type') ?? 'image/png';
    const buf = Buffer.from(await imgRes.arrayBuffer());
    return `data:${contentType};base64,${buf.toString('base64')}`;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function callIdmVtonSpace(
  host: string,
  personInput: string,
  garmentInput: string,
  prompt: string
): Promise<string | null> {
  const baseUrl = `https://${host}`;
  const personFile = await uploadToGradioSpace(baseUrl, '', personInput, 'person.jpg');
  const garmentFile = await uploadToGradioSpace(baseUrl, '', garmentInput, 'garment.png');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'A12-VTON-Engine/3.3',
  };
  const hfToken = process.env.HF_TOKEN ?? process.env.HUGGINGFACE_API_KEY;
  if (hfToken) {
    headers.Authorization = `Bearer ${hfToken}`;
  }

  const callRes = await fetch(`${baseUrl}/call/tryon`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      data: [
        { background: personFile, layers: [], composite: personFile },
        garmentFile,
        prompt || 'stylish modern garment',
        true,
        true,
        25,
        42,
      ],
    }),
  });

  if (!callRes.ok) return null;
  const { event_id: eventId } = (await callRes.json()) as { event_id?: string };
  if (!eventId) return null;

  return readGradioSseAndFetchDataUrl(`${baseUrl}/call/tryon/${eventId}`);
}

async function callOotDiffusionSpace(
  personInput: string,
  garmentInput: string
): Promise<string | null> {
  const baseUrl = 'https://levihsu-ootdiffusion.hf.space';
  const personFile = await uploadToGradioSpace(baseUrl, '/gradio_api', personInput, 'person.jpg');
  const garmentFile = await uploadToGradioSpace(baseUrl, '/gradio_api', garmentInput, 'garment.png');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'A12-VTON-Engine/3.3',
  };
  const hfToken = process.env.HF_TOKEN ?? process.env.HUGGINGFACE_API_KEY;
  if (hfToken) {
    headers.Authorization = `Bearer ${hfToken}`;
  }

  const callRes = await fetch(`${baseUrl}/gradio_api/call/process_hd`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      data: [personFile, garmentFile, 1, 20, 2.0, 42],
    }),
  });

  if (!callRes.ok) return null;
  const { event_id: eventId } = (await callRes.json()) as { event_id?: string };
  if (!eventId) return null;

  return readGradioSseAndFetchDataUrl(`${baseUrl}/gradio_api/call/process_hd/${eventId}`);
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    engine: 'A12-OpenVTON-Hybrid-v3.3',
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

    if (body.mode === 'neural-tryon' && body.personFrame && body.garmentImage) {
      const selectedModelId = body.modelId ?? 'idm-vton';
      const prompt = body.prompt ?? 'photorealistic garment virtual try-on, natural drape';

      const attempts: Array<{ name: string; run: () => Promise<string | null> }> =
        selectedModelId === 'oot-diffusion'
          ? [
              {
                name: 'levihsu/OOTDiffusion',
                run: () => callOotDiffusionSpace(body.personFrame ?? '', body.garmentImage ?? ''),
              },
              {
                name: 'nymbo/Virtual-Try-On',
                run: () =>
                  callIdmVtonSpace(
                    'nymbo-virtual-try-on.hf.space',
                    body.personFrame ?? '',
                    body.garmentImage ?? '',
                    prompt
                  ),
              },
              {
                name: 'yisol/IDM-VTON',
                run: () =>
                  callIdmVtonSpace(
                    'yisol-idm-vton.hf.space',
                    body.personFrame ?? '',
                    body.garmentImage ?? '',
                    prompt
                  ),
              },
            ]
          : [
              {
                name: 'nymbo/Virtual-Try-On',
                run: () =>
                  callIdmVtonSpace(
                    'nymbo-virtual-try-on.hf.space',
                    body.personFrame ?? '',
                    body.garmentImage ?? '',
                    prompt
                  ),
              },
              {
                name: 'yisol/IDM-VTON',
                run: () =>
                  callIdmVtonSpace(
                    'yisol-idm-vton.hf.space',
                    body.personFrame ?? '',
                    body.garmentImage ?? '',
                    prompt
                  ),
              },
              {
                name: 'levihsu/OOTDiffusion',
                run: () => callOotDiffusionSpace(body.personFrame ?? '', body.garmentImage ?? ''),
              },
            ];

      for (const attempt of attempts) {
        try {
          const resultDataUrl = await attempt.run();
          if (resultDataUrl) {
            return NextResponse.json({
              status: 'completed',
              provider: attempt.name,
              modelId: selectedModelId,
              latencyMs: Date.now() - startedAt,
              resultImage: resultDataUrl,
              mode: 'hf-gradio-diffusion',
            });
          }
        } catch {
          // Try next open-source HF Space in fallback chain
        }
      }

      return NextResponse.json({
        status: 'completed',
        provider: 'a12-mediapipe-pose-mesh-30fps',
        modelId: selectedModelId,
        latencyMs: Date.now() - startedAt,
        resultImage: null,
        mode: 'client-neural-shader',
      });
    }

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
