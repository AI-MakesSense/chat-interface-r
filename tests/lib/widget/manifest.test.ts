/**
 * @jest-environment node
 *
 * Unit tests for lib/widget/manifest.ts (getBundlePath).
 *
 * Hermetic: node:fs is mocked so the test does not depend on `pnpm build:widget`
 * having run in the test environment.
 */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('node:fs', () => ({
  readFileSync: jest.fn(),
}));

const fs = require('node:fs');
const { getBundlePath, __resetBundlePathCache } = require('@/lib/widget/manifest');

describe('getBundlePath', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __resetBundlePathCache();
  });

  it('returns the hashed bundlePath from the manifest', () => {
    fs.readFileSync.mockReturnValue(
      JSON.stringify({ bundlePath: '/widget/v/chat-widget.2450d3da.js', builtAt: '2026-06-10T04:33:39.881Z' })
    );

    const path = getBundlePath();
    expect(path).toMatch(/^\/widget\/v\/chat-widget\.[0-9a-f]{8}\.js$/);
  });

  it('caches the manifest read (reads the file only once per process)', () => {
    fs.readFileSync.mockReturnValue(JSON.stringify({ bundlePath: '/widget/v/chat-widget.abcdef01.js' }));

    getBundlePath();
    getBundlePath();
    expect(fs.readFileSync).toHaveBeenCalledTimes(1);
  });

  it('throws a clear error when the manifest cannot be read', () => {
    fs.readFileSync.mockImplementation(() => {
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
    });

    expect(() => getBundlePath()).toThrow(/could not be read or parsed/i);
  });

  it('throws when the manifest has no valid bundlePath', () => {
    fs.readFileSync.mockReturnValue(JSON.stringify({ builtAt: 'whenever' }));

    expect(() => getBundlePath()).toThrow(/missing a valid "bundlePath"/i);
  });
});
