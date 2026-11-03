/** Runs once when the server starts: brings the database schema up to date. */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs' || !process.env.DATABASE_URL) return;
  const { migrateDatabase } = await import('./db/migrate');
  await migrateDatabase();
}
