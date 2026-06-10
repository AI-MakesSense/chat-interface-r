import { validateEnv } from '@/lib/env';

describe('validateEnv', () => {
  it('passes when required vars are set in production', () => {
    expect(() => validateEnv({ DATABASE_URL: 'postgres://x', JWT_SECRET: 'a'.repeat(32), NODE_ENV: 'production' } as any)).not.toThrow();
  });

  it('throws listing ALL missing vars at once in production', () => {
    expect(() => validateEnv({ NODE_ENV: 'production' } as any)).toThrow(/DATABASE_URL[\s\S]*JWT_SECRET|JWT_SECRET[\s\S]*DATABASE_URL/);
  });

  it('rejects short JWT_SECRET in production', () => {
    expect(() => validateEnv({ DATABASE_URL: 'postgres://x', JWT_SECRET: 'short', NODE_ENV: 'production' } as any)).toThrow(/JWT_SECRET/);
  });

  it('warns but does not throw in development', () => {
    expect(() => validateEnv({ NODE_ENV: 'development' } as any)).not.toThrow();
  });

  describe('ChatKit flag symmetry (F4)', () => {
    const base = { DATABASE_URL: 'postgres://x', JWT_SECRET: 'a'.repeat(32) };
    let warnSpy: jest.SpyInstance;

    beforeEach(() => {
      warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });
    afterEach(() => {
      warnSpy.mockRestore();
    });

    it('warns when ENABLE_CHATKIT is set without NEXT_PUBLIC_ENABLE_CHATKIT', () => {
      validateEnv({ ...base, NODE_ENV: 'production', ENABLE_CHATKIT: 'true' } as any);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringMatching(/ChatKit flags asymmetric/));
    });

    it('warns when NEXT_PUBLIC_ENABLE_CHATKIT is set without ENABLE_CHATKIT', () => {
      validateEnv({ ...base, NODE_ENV: 'production', NEXT_PUBLIC_ENABLE_CHATKIT: 'true' } as any);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringMatching(/ChatKit flags asymmetric/));
    });

    it('does not warn when both chatkit flags are set together', () => {
      validateEnv({
        ...base,
        NODE_ENV: 'production',
        UPSTASH_REDIS_REST_URL: 'redis://x',
        ENABLE_CHATKIT: 'true',
        NEXT_PUBLIC_ENABLE_CHATKIT: 'true',
      } as any);
      expect(warnSpy).not.toHaveBeenCalledWith(expect.stringMatching(/ChatKit flags asymmetric/));
    });

    it('does not warn when both chatkit flags are unset', () => {
      validateEnv({ ...base, NODE_ENV: 'production', UPSTASH_REDIS_REST_URL: 'redis://x' } as any);
      expect(warnSpy).not.toHaveBeenCalledWith(expect.stringMatching(/ChatKit flags asymmetric/));
    });
  });
});
