import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export type Db = ReturnType<typeof drizzle<typeof schema>>;

let cached: Db | null = null;

/** Connects on first use, so pages that never touch the database build and run without DATABASE_URL. */
export function getDb(): Db {
  if (cached) return cached;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  // Postgres NOTICEs (e.g. "already exists, skipping" on every migration run) are not errors
  cached = drizzle(postgres(url, { max: 10, onnotice: () => {} }), { schema });
  return cached;
}

export { schema };
