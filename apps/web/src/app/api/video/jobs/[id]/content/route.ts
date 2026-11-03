import { userFromRequest } from '@/lib/auth/session';
import { videoJobContent } from '@/lib/video';
import { ownedVideoJob } from '@/lib/video-jobs';

export const maxDuration = 150;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Streams a finished video ad from Decart to its store's owner, without exposing the API key. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await userFromRequest(request);
  if (!user) return new Response('Sign in first.', { status: 401 });
  const job = UUID.test(id) ? await ownedVideoJob(user, id) : null;
  const apiKey = process.env.DECART_API_KEY;
  if (!job || job.status !== 'completed' || !apiKey) return new Response('Not found.', { status: 404 });
  const upstream = await videoJobContent(apiKey, job.decartJobId);
  if (!upstream.ok || !upstream.body) return new Response('The video is not available right now.', { status: 502 });
  return new Response(upstream.body, {
    headers: {
      'Content-Type': upstream.headers.get('content-type') ?? 'video/mp4',
      'Content-Disposition': `inline; filename="a12-reklama-${job.id.slice(0, 8)}.mp4"`,
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
