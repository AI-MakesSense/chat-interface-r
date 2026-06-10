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
});
