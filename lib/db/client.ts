/**
 * Database Client
 *
 * Purpose: Provides a configured Drizzle ORM client for database operations
 *
 * Usage:
 *   import { db } from '@/lib/db/client';
 *   const users = await db.select().from(users);
 */

import { drizzle } from 'drizzle-orm/vercel-postgres';
import { sql } from '@vercel/postgres';
import * as schema from './schema';

/**
 * Drizzle ORM client configured with Vercel Postgres
 * Includes schema for type-safe queries and relations
 */
export const db = drizzle(sql, { schema });

/**
 * Type export for query builder
 */
export type Database = typeof db;
