import { NextResponse } from 'next/server';
import { isIP } from 'node:net';
import { INITIAL_GARMENT_CATALOG, parseProductUrlToGarment } from '@webpul/shared-core';

export const maxDuration = 150;

interface OpenSourceModelSpec {
  id: string;
  name: string;
  hfSpace: string;
  githubUrl: string;
  architecture: string;
  fpsOrLatency: string;
  license?: string;
}

const OPEN_SOURCE_VTON_MODELS: OpenSourceModelSpec[] = [
  {
    id: 'a12-pose-mesh',
    name: 'A12 local camera preview (garment overlay)',
    hfSpace: '',
    githubUrl: '',
    architecture: 'Local camera preview with a garment overlay; not generative AI',
    fpsOrLatency: 'Browser render loop; device dependent',
  },
  {
    id: 'leffa-vton',
    name: 'Leffa virtual try-on (single-image inference)',
    hfSpace: 'franciszzj/Leffa',
    githubUrl: 'https://github.com/franciszzj/Leffa',
    architecture: 'Flow-field attention diffusion with pose and garment conditioning',
    fpsOrLatency: 'About 6 seconds/image on A100; HF ZeroGPU queue varies',
    license: 'MIT (code/model card); dataset terms require separate review',
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
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://a12.uz';
    return new URL(input, siteUrl).toString();
  }
  return input;
}

async function getImageBytesAndMime(imageInput: string): Promise<{ bytes: Uint8Array; mimeType: string }> {
  const normalized = normalizePublicImageUrl(imageInput);
  const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    const url = new URL(normalized);
    const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      isIP(host) ||
      host === 'localhost' ||
      host.endsWith('.localhost') ||
      host.endsWith('.local') ||
      host.endsWith('.internal')
    ) {
      throw new Error('Only public HTTPS image URLs are supported.');
    }
    const res = await fetch(url, {
      headers: { 'User-Agent': 'A12-VTON-Engine/3.3' },
      redirect: 'manual',
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch source image: ${res.status}`);
    }
    const contentType = (res.headers.get('content-type') ?? '').split(';', 1)[0]?.trim().toLowerCase();
    const contentLength = Number(res.headers.get('content-length') ?? 0);
    if (!contentType || !allowedMimeTypes.has(contentType) || contentLength > 8_000_000) {
      throw new Error('Source image type or size is not supported.');
    }
    const ab = await res.arrayBuffer();
    if (ab.byteLength > 8_000_000) throw new Error('Source image is too large.');
    return { bytes: new Uint8Array(ab), mimeType: contentType };
  }

  const commaIdx = normalized.indexOf(',');
  const header = commaIdx > -1 ? normalized.slice(0, commaIdx) : '';
  const b64 = commaIdx > -1 ? normalized.slice(commaIdx + 1) : '';
  const mimeMatch = header.match(/^data:(image\/(?:jpeg|png|webp));base64$/i);
  const mimeType = mimeMatch?.[1]?.toLowerCase();
  if (!mimeType || !allowedMimeTypes.has(mimeType) || b64.length > 11_000_000) {
    throw new Error('Only JPEG, PNG, or WebP images up to 8 MB are supported.');
  }
  const buf = Buffer.from(b64, 'base64');
  if (buf.byteLength > 8_000_000) throw new Error('Source image is too large.');
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
async function readGradioSseAndFetchDataUrl(sseUrl: string, timeoutMs = 120000): Promise<string | null> {
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

async function callLeffaSpace(
  personInput: string,
  garmentInput: string,
  garmentType: 'upper_body' | 'lower_body' | 'dresses'
): Promise<string | null> {
  const baseUrl = 'https://franciszzj-leffa.hf.space';
  const personFile = await uploadToGradioSpace(baseUrl, '/gradio_api', personInput, 'person.jpg');
  const garmentFile = await uploadToGradioSpace(baseUrl, '/gradio_api', garmentInput, 'garment.png');
  const callRes = await fetch(`${baseUrl}/gradio_api/call/leffa_predict_vt`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'A12-VTON-Engine/3.3',
    },
    body: JSON.stringify({
      data: [personFile, garmentFile, false, 30, 2.5, 42, 'viton_hd', garmentType, false],
    }),
  });

  if (!callRes.ok) return null;
  const { event_id: eventId } = (await callRes.json()) as { event_id?: string };
  if (!eventId) return null;

  return readGradioSseAndFetchDataUrl(
    `${baseUrl}/gradio_api/call/leffa_predict_vt/${eventId}`
  );
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    engine: 'A12 live preview + Leffa single-image try-on',
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
      garmentType?: 'upper_body' | 'lower_body' | 'dresses';
    };

    if (body.mode === 'neural-tryon' && body.personFrame && body.garmentImage) {
      if (body.modelId && body.modelId !== 'leffa-vton') {
        return NextResponse.json({ error: 'Unsupported virtual try-on model' }, { status: 400 });
      }
      const garmentType = body.garmentType ?? 'upper_body';
      if (!['upper_body', 'lower_body', 'dresses'].includes(garmentType)) {
        return NextResponse.json({ error: 'Unsupported garment type' }, { status: 400 });
      }
      try {
        const resultDataUrl = await callLeffaSpace(body.personFrame, body.garmentImage, garmentType);
        if (resultDataUrl) {
          return NextResponse.json({
            status: 'completed',
            provider: 'franciszzj/Leffa (Hugging Face ZeroGPU)',
            modelId: 'leffa-vton',
            latencyMs: Date.now() - startedAt,
            resultImage: resultDataUrl,
            mode: 'single-frame-virtual-tryon',
          });
        }
      } catch {
        // Return an explicit unavailable response instead of presenting the preview as AI output.
      }
      return NextResponse.json(
        { status: 'unavailable', error: 'Leffa could not generate a try-on image right now.' },
        { status: 503 }
      );
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
