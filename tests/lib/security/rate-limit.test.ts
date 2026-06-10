import { checkRateLimit, resetRateLimit, __getMemoryStoreSize } from '@/lib/security/rate-limit';

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

  it('prunes expired entries when the per-namespace cap (10k) is exceeded', async () => {
    // Tiny window so each entry expires almost immediately. Pruning only runs
    // when a NEW identifier is inserted into a store already at/over the cap, so
    // crossing 10_000 unique ids triggers a sweep that drops the expired bulk.
    const cfg = { limit: 1, windowMs: 1 };
    const NS = 'prune';

    const realNow = Date.now;
    let t = 1_000_000;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (Date as any).now = () => t;
    try {
      for (let i = 0; i < 10_050; i++) {
        t += 10; // advance past windowMs so prior entries are expired
        await checkRateLimit(NS, `id-${i}`, cfg);
      }
    } finally {
      Date.now = realNow;
    }

    // 10_050 unique ids were seen, but the store must have been swept and stay
    // well under that — proving growth is bounded on the fallback path.
    expect(__getMemoryStoreSize(NS)).toBeLessThan(10_000);
  });

  it('stays bounded at the cap when ALL entries are fresh (nothing to prune)', async () => {
    // Long window so no entry expires: pruning cannot reclaim anything. Once the
    // store hits the cap, new identifiers must fail open WITHOUT being tracked so
    // memory stays bounded.
    const cfg = { limit: 1, windowMs: 60_000 };
    const NS = 'fresh-cap';

    const realNow = Date.now;
    const t = 5_000_000;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (Date as any).now = () => t; // freeze time so all entries stay fresh
    try {
      // Fill exactly to the cap with fresh entries.
      for (let i = 0; i < 10_000; i++) {
        await checkRateLimit(NS, `fresh-${i}`, cfg);
      }
      expect(__getMemoryStoreSize(NS)).toBe(10_000);

      // A brand-new identifier at the cap: allowed (fail-open) but NOT stored.
      const res = await checkRateLimit(NS, 'overflow-id', cfg);
      expect(res.allowed).toBe(true);
      expect(res.remaining).toBe(0);
      expect(__getMemoryStoreSize(NS)).toBeLessThanOrEqual(10_000);
    } finally {
      Date.now = realNow;
    }
  });
});

describe('rate limiter (Redis path fail-open)', () => {
  const ORIGINAL_URL = process.env.UPSTASH_REDIS_REST_URL;
  const ORIGINAL_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

  beforeEach(() => {
    jest.resetModules();
    process.env.UPSTASH_REDIS_REST_URL = 'https://example.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
  });

  afterEach(() => {
    jest.resetModules();
    if (ORIGINAL_URL === undefined) delete process.env.UPSTASH_REDIS_REST_URL;
    else process.env.UPSTASH_REDIS_REST_URL = ORIGINAL_URL;
    if (ORIGINAL_TOKEN === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN;
    else process.env.UPSTASH_REDIS_REST_TOKEN = ORIGINAL_TOKEN;
  });

  it('fails open when limit() throws', async () => {
    jest.doMock('@upstash/redis', () => ({
      Redis: class {},
    }));
    jest.doMock('@upstash/ratelimit', () => ({
      Ratelimit: class {
        static slidingWindow() {
          return () => ({});
        }
        async limit() {
          throw new Error('boom: redis unreachable');
        }
      },
    }));

    const { checkRateLimit: check } = await import('@/lib/security/rate-limit');
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = await check('chat', 'ip1', { limit: 1, windowMs: 1000 });
    expect(res.allowed).toBe(true);
    expect(res.remaining).toBe(0);
    errSpy.mockRestore();
  });

  it('fails open when the limiter constructor throws', async () => {
    jest.doMock('@upstash/redis', () => ({
      Redis: class {},
    }));
    jest.doMock('@upstash/ratelimit', () => ({
      Ratelimit: class {
        static slidingWindow() {
          return () => ({});
        }
        constructor() {
          throw new Error('boom: bad limiter config');
        }
      },
    }));

    const { checkRateLimit: check } = await import('@/lib/security/rate-limit');
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = await check('chat', 'ip1', { limit: 1, windowMs: 1000 });
    expect(res.allowed).toBe(true);
    expect(res.remaining).toBe(0);
    errSpy.mockRestore();
  });
});
