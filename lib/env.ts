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

/** Matches parseBooleanFlag in lib/feature-flags.ts. */
function isTruthyFlag(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
}

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

  // ChatKit flags must be set together. The configurator preview reads the client
  // flag (NEXT_PUBLIC_ENABLE_CHATKIT) while production serving reads ENABLE_CHATKIT;
  // when only one is set the preview's agentKit.enabled diverges from production.
  const chatkitServer = isTruthyFlag(env.ENABLE_CHATKIT);
  const chatkitClient = isTruthyFlag(env.NEXT_PUBLIC_ENABLE_CHATKIT);
  if (chatkitServer !== chatkitClient) {
    console.warn(
      '[env] ChatKit flags asymmetric: ENABLE_CHATKIT=' +
        `${env.ENABLE_CHATKIT ?? '(unset)'} but NEXT_PUBLIC_ENABLE_CHATKIT=` +
        `${env.NEXT_PUBLIC_ENABLE_CHATKIT ?? '(unset)'}. Set both together — the ` +
        'configurator preview reads the NEXT_PUBLIC flag while production reads ENABLE_CHATKIT, ' +
        'so a mismatch makes the preview disagree with what is actually served.'
    );
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
