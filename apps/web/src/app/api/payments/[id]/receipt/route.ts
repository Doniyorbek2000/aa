import { eq } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { userFromRequest } from '@/lib/auth/session';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The uploaded receipt, for admins and the shop owner who sent it. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await userFromRequest(request);
  if (!user || !UUID.test(id)) return new Response('Not found.', { status: 404 });
  const [payment] = await getDb()
    .select({ receipt: schema.payments.receipt, receiptType: schema.payments.receiptType, userId: schema.payments.userId })
    .from(schema.payments)
    .where(eq(schema.payments.id, id));
  if (!payment || (user.role !== 'admin' && payment.userId !== user.id)) return new Response('Not found.', { status: 404 });
  return new Response(new Uint8Array(payment.receipt), {
    headers: {
      'Content-Type': payment.receiptType,
      'Content-Disposition': 'inline',
      // A user-uploaded file: never sniff it into HTML, never let it run scripts
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
      'Cache-Control': 'private, no-store',
    },
  });
}
