import { defineConfig } from 'drizzle-kit';

// `pnpm exec drizzle-kit generate` writes SQL migrations to ./drizzle; the server applies them on start
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
});
