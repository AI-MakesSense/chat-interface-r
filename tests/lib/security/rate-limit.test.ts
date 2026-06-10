import { checkRateLimit, resetRateLimit } from '@/lib/security/rate-limit';

describe('rate limiter (memory fallback)', () => {
  beforeEach(() => resetRateLimit());

  it('allows up to the limit then blocks with retryAfter', async () => {
    const cfg = { limit: 3, windowMs: 60_000 };
    expect((await checkRateLimit('test', 'ip1', cfg)).allowed).toBe(true);
    expect((await checkRateLimit('test', 'ip1', cfg)).allowed).toBe(true);
    expect((await checkRateLimit('test', 'ip1', cfg)).allowed).toBe(true);
    const blocked = await checkRateLimit('test', 'ip1', cfg);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThanOrEqual(1);
  });

  it('isolates namespaces and identifiers', async () => {
    const cfg = { limit: 1, windowMs: 60_000 };
    await checkRateLimit('a', 'x', cfg);
    expect((await checkRateLimit('a', 'y', cfg)).allowed).toBe(true);
    expect((await checkRateLimit('b', 'x', cfg)).allowed).toBe(true);
  });
});
