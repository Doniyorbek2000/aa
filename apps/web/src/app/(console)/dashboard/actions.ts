'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getDb, schema } from '@/db';
import { currentUser } from '@/lib/auth/session';
import { randomToken } from '@/lib/auth/tokens';
import { httpsUrl, oneOf, text, uuid } from '../validate';

const KINDS = ['upper_body', 'lower_body', 'dresses'] as const;

/** The signed-in owner's store with this id (admins may manage any store), or null. */
async function ownStore(storeId: string | null) {
  const user = await currentUser();
  if (!user) redirect('/login?next=/dashboard');
  if (!storeId) return null;
  const [store] = await getDb()
    .select()
    .from(schema.stores)
    .where(user.role === 'admin' ? eq(schema.stores.id, storeId) : and(eq(schema.stores.id, storeId), eq(schema.stores.ownerId, user.id)));
  return store ?? null;
}

/** Same, starting from one of the store's garments. */
async function ownGarment(garmentId: string | null) {
  if (!garmentId) return null;
  const [garment] = await getDb().select().from(schema.garments).where(eq(schema.garments.id, garmentId));
  return garment && (await ownStore(garment.storeId)) ? garment : null;
}

const done = () => revalidatePath('/dashboard');

export async function addGarment(form: FormData) {
  const store = await ownStore(uuid(form, 'storeId'));
  const title = text(form, 'title', 120);
  const imageUrl = httpsUrl(form, 'imageUrl');
  const kind = oneOf(form, 'kind', KINDS) ?? 'upper_body';
  if (!store || !title || !imageUrl) return;
  await getDb().insert(schema.garments).values({ storeId: store.id, title, imageUrl, kind });
  done();
}

export async function toggleGarment(form: FormData) {
  const garment = await ownGarment(uuid(form, 'id'));
  if (!garment) return;
  await getDb().update(schema.garments).set({ isActive: !garment.isActive }).where(eq(schema.garments.id, garment.id));
  done();
}

export async function deleteGarment(form: FormData) {
  const garment = await ownGarment(uuid(form, 'id'));
  if (!garment) return;
  await getDb().delete(schema.garments).where(eq(schema.garments.id, garment.id));
  done();
}

/** Issues a new widget key; the old one stops working, e.g. after it leaked to another site. */
export async function rotateWidgetKey(form: FormData) {
  const store = await ownStore(uuid(form, 'storeId'));
  if (!store) return;
  await getDb().update(schema.stores).set({ widgetKey: `wk_${randomToken(24)}` }).where(eq(schema.stores.id, store.id));
  done();
}
