import { userFromRequest } from '@/lib/auth/session';
import { ownedVideoJob, refreshVideoJob } from '@/lib/video-jobs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Current status of a video ad job; checks with Decart while it is still pending. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await userFromRequest(request);
  if (!user) return Response.json({ error: 'Sign in first.' }, { status: 401 });
  const job = UUID.test(id) ? await ownedVideoJob(user, id) : null;
  if (!job) return Response.json({ error: 'Not found.' }, { status: 404 });
  const apiKey = process.env.DECART_API_KEY;
  const status = apiKey ? await refreshVideoJob(apiKey, job).catch(() => job.status) : job.status;
  return Response.json({ id: job.id, status }, { headers: { 'Cache-Control': 'no-store' } });
}
