/**
 * Unit tests for the pure helpers used by the v1→v2 backfill script:
 * - generateWidgetKey (lib/license/widget-key)
 * - withUniqueRetry / isUniqueViolation (lib/db/unique-retry)
 */

import { generateWidgetKey } from '@/lib/license/widget-key';
import { withUniqueRetry, isUniqueViolation } from '@/lib/db/unique-retry';

describe('generateWidgetKey', () => {
  it('produces 16-char alphanumeric keys', () => {
    for (let i = 0; i < 50; i++) {
      expect(generateWidgetKey()).toMatch(/^[A-Za-z0-9]{16}$/);
    }
  });

  it('produces unique keys', () => {
    const keys = new Set(Array.from({ length: 1000 }, () => generateWidgetKey()));
    expect(keys.size).toBe(1000);
  });

  it('does not include special characters or spaces', () => {
    for (let i = 0; i < 100; i++) {
      const key = generateWidgetKey();
      expect(key).not.toMatch(/[^A-Za-z0-9]/);
    }
  });

  it('always returns exactly 16 characters', () => {
    for (let i = 0; i < 100; i++) {
      expect(generateWidgetKey()).toHaveLength(16);
    }
  });
});

describe('isUniqueViolation', () => {
  it('detects Postgres 23505 error codes', () => {
    expect(isUniqueViolation(new Error('error code 23505'))).toBe(true);
  });

  it('detects unique/duplicate message text', () => {
    expect(isUniqueViolation(new Error('duplicate key value violates unique constraint'))).toBe(true);
    expect(isUniqueViolation(new Error('unique constraint failed'))).toBe(true);
  });

  it('returns false for unrelated errors', () => {
    expect(isUniqueViolation(new Error('connection refused'))).toBe(false);
    expect(isUniqueViolation('some string error')).toBe(false);
  });
});

describe('withUniqueRetry', () => {
  it('succeeds after two 23505 failures', async () => {
    let calls = 0;
    const fn = jest.fn(async () => {
      calls++;
      if (calls <= 2) throw new Error('23505: duplicate key value violates unique constraint');
      return 'ok';
    });

    await expect(withUniqueRetry(fn, 4)).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('throws non-unique errors immediately without retrying', async () => {
    const fn = jest.fn(async () => {
      throw new Error('connection refused');
    });

    await expect(withUniqueRetry(fn, 4)).rejects.toThrow('connection refused');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('gives up after maxAttempts unique violations', async () => {
    const fn = jest.fn(async () => {
      throw new Error('23505: duplicate key');
    });

    await expect(withUniqueRetry(fn, 3)).rejects.toThrow('23505');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('returns immediately on first success', async () => {
    const fn = jest.fn(async () => 42);

    await expect(withUniqueRetry(fn)).resolves.toBe(42);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
