/**
 * Widget Key Generator
 *
 * Generates 16-character alphanumeric keys used as embed URL identifiers
 * (widgetKey column on widgets table). Canonical single source of truth —
 * imported by lib/db/queries.ts, scripts/seed.ts, and the backfill script.
 */

import { randomBytes } from 'node:crypto';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Generate a cryptographically random 16-character alphanumeric widget key.
 * Uses Node.js `randomBytes` so it works in both server-side Next.js code
 * and plain tsx scripts.
 */
export function generateWidgetKey(): string {
  const bytes = randomBytes(16);
  let key = '';
  for (let i = 0; i < 16; i++) {
    key += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return key;
}
