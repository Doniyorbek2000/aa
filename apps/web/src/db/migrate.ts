import path from 'node:path';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { getDb } from './index';

/** Applies pending SQL migrations from ./drizzle (Next's standalone server runs from apps/web). */
export async function migrateDatabase(): Promise<void> {
  await migrate(getDb(), { migrationsFolder: path.join(process.cwd(), 'drizzle') });
}
