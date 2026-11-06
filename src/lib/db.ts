import path from 'path';
import postgres from 'postgres';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import * as schema from '@/db/schema';

export type Database = PostgresJsDatabase<typeof schema>;

interface DbCache {
  client: postgres.Sql;
  db: Database;
}

declare global {
  // eslint-disable-next-line no-var
  var pgCache: DbCache | undefined;
}

function createDb(): DbCache {
  // postgres.js connects lazily, so creating the pool at import time is safe during `next build`.
  const client = postgres(process.env.DATABASE_URL ?? '', {
    max: Number(process.env.DATABASE_POOL_SIZE) || 10,
    onnotice: () => {},
  });
  return { client, db: drizzle(client, { schema }) };
}

// Cached on globalThis so Next.js dev reloads reuse one pool instead of opening new ones.
const cache: DbCache = global.pgCache ?? (global.pgCache = createDb());

/** Shared Drizzle client for the whole server (API routes, bot, scheduler, Socket.IO). */
export const db: Database = cache.db;

/**
 * Verifies the database is reachable and applies pending migrations from `./drizzle`.
 * Called once by `server.ts` on startup.
 *
 * @example
 * await connectToDatabase();
 */
export async function connectToDatabase(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error('Please provide a Postgres connection string in process.env.DATABASE_URL');
  }
  await migrate(db, { migrationsFolder: path.join(process.cwd(), 'drizzle') });
  console.log('Connected to Postgres and applied migrations');
}

/**
 * Closes the connection pool (graceful shutdown).
 *
 * @example
 * await closeDatabase();
 */
export async function closeDatabase(): Promise<void> {
  await cache.client.end({ timeout: 5 });
}
