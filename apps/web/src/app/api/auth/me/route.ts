import { userFromRequest } from '@/lib/auth/session';

export async function GET(request: Request) {
  const user = await userFromRequest(request);
  if (!user) return Response.json({ user: null }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
  const { id, role, phone, email, name } = user;
  return Response.json({ user: { id, role, phone, email, name } }, { headers: { 'Cache-Control': 'no-store' } });
}
