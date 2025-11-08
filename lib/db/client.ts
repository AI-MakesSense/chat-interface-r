/**
 * Database Client
 *
 * Purpose: Provides a configured Drizzle ORM client for database operations
 *
 * Usage:
 *   import { db } from '@/lib/db/client';
 *   const users = await db.select().from(users);
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

// Lazy initialization to ensure environment variables are loaded
let _sql: ReturnType<typeof neon> | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

function getSql() {
  if (!_sql) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    _sql = neon(connectionString);
  }
  return _sql;
}

/**
 * Drizzle ORM client configured with Neon Serverless
 * Includes schema for type-safe queries and relations
 *
 * Lazily initialized to ensure environment variables are loaded first
 */
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop) {
    if (!_db) {
      _db = drizzle(getSql(), { schema });
    }
    return (_db as any)[prop];
  },
});

/**
 * Type export for query builder
 */
export type Database = typeof db;
