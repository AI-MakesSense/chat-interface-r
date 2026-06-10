/**
 * Startup Environment Validation
 *
 * Purpose: Fail fast at boot when required environment variables are missing or invalid.
 * Called from instrumentation.ts register() so misconfigured deployments surface
 * immediately rather than returning 500s at request time.
 *
 * Required (hard failure in production):
 *   - DATABASE_URL  — Neon/Vercel Postgres connection string
 *   - JWT_SECRET    — at least 32 chars; used to sign/verify auth tokens
 *
 * Warn-only (optional but logged):
 *   - UPSTASH_REDIS_REST_URL — rate limiting falls back to per-instance without it
 */

export function validateEnv(env: NodeJS.ProcessEnv = process.env): void {
  const problems: string[] = [];

  if (!env.DATABASE_URL) {
    problems.push('DATABASE_URL is required');
  }

  if (!env.JWT_SECRET) {
    problems.push('JWT_SECRET is required');
  } else if (env.JWT_SECRET.length < 32) {
    problems.push('JWT_SECRET must be at least 32 characters');
  }

  if (env.NODE_ENV === 'production') {
    if (!env.UPSTASH_REDIS_REST_URL) {
      console.warn('[env] UPSTASH_REDIS_REST_URL not set — rate limiting is per-instance only');
    }
    if (problems.length) {
      throw new Error(`Environment validation failed:\n - ${problems.join('\n - ')}`);
    }
  } else if (problems.length) {
    console.warn(`[env] (non-production) issues:\n - ${problems.join('\n - ')}`);
  }
}
