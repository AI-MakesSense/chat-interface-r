/**
 * Unit tests for the widgetKey generator used by the v1→v2 backfill script.
 */

import { generateWidgetKey } from '@/lib/license/widget-key';

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
