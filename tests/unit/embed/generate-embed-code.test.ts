/**
 * Unit Tests for Embed Code Generator
 *
 * Tests for lib/embed/generate-embed-code.ts
 *
 * Test Coverage:
 * - generateEmbedCode for all embed types
 * - generateAllEmbedCodes
 * - getPrimaryEmbedCode
 * - generateWidgetKey
 * - isValidWidgetKey
 * - getEmbedTypeInfo
 *
 * Total: 35 tests
 */

import {
  generateEmbedCode,
  generateAllEmbedCodes,
  getPrimaryEmbedCode,
  generateWidgetKey,
  isValidWidgetKey,
  getEmbedTypeInfo,
  EMBED_TYPES,
  type EmbedType,
} from '@/lib/embed';

// =============================================================================
// A. generateEmbedCode Tests (16 tests)
// =============================================================================

describe('generateEmbedCode', () => {
  const testWidget = { widgetKey: 'AbCdEfGh12345678' };

  describe('popup type', () => {
    it('should generate popup embed code', () => {
      const result = generateEmbedCode(testWidget, 'popup');
      expect(result.type).toBe('popup');
      expect(result.title).toBe('Popup Widget');
      expect(result.language).toBe('html');
    });

    it('should include script tag with widget key', () => {
      const result = generateEmbedCode(testWidget, 'popup');
      expect(result.code).toContain('<script');
      expect(result.code).toContain(testWidget.widgetKey);
      expect(result.code).toContain('.js');
    });

    it('should include async attribute', () => {
      const result = generateEmbedCode(testWidget, 'popup');
      expect(result.code).toContain('async');
    });

    it('should have message-circle icon', () => {
      const result = generateEmbedCode(testWidget, 'popup');
      expect(result.icon).toBe('message-circle');
    });
  });

  describe('inline type', () => {
    it('should generate inline embed code', () => {
      const result = generateEmbedCode(testWidget, 'inline');
      expect(result.type).toBe('inline');
      expect(result.title).toBe('Inline Widget');
      expect(result.language).toBe('html');
    });

    it('should include container div with default dimensions', () => {
      const result = generateEmbedCode(testWidget, 'inline');
      expect(result.code).toContain('<div id="chat-widget"');
      expect(result.code).toContain('style="width: 400px; height: 600px;"');
    });

    it('should use custom inline dimensions when provided', () => {
      const result = generateEmbedCode(testWidget, 'inline', {
        inlineWidth: 500,
        inlineHeight: 700,
      });
      expect(result.code).toContain('style="width: 500px; height: 700px;"');
    });

    it('should include data-mode attribute', () => {
      const result = generateEmbedCode(testWidget, 'inline');
      expect(result.code).toContain('data-mode="inline"');
      expect(result.code).toContain('data-container="chat-widget"');
    });

    it('should have layout icon', () => {
      const result = generateEmbedCode(testWidget, 'inline');
      expect(result.icon).toBe('layout');
    });
  });

  describe('fullpage type', () => {
    it('should generate fullpage embed code', () => {
      const result = generateEmbedCode(testWidget, 'fullpage');
      expect(result.type).toBe('fullpage');
      expect(result.title).toBe('Fullpage Widget');
      expect(result.language).toBe('html');
    });

    it('should include iframe', () => {
      const result = generateEmbedCode(testWidget, 'fullpage');
      expect(result.code).toContain('<iframe');
      expect(result.code).toContain('</iframe>');
    });

    it('should use /chat/ URL path', () => {
      const result = generateEmbedCode(testWidget, 'fullpage');
      expect(result.code).toContain(`/chat/${testWidget.widgetKey}`);
    });

    it('should have maximize icon', () => {
      const result = generateEmbedCode(testWidget, 'fullpage');
      expect(result.icon).toBe('maximize');
    });
  });

  describe('portal type', () => {
    it('should generate portal link', () => {
      const result = generateEmbedCode(testWidget, 'portal');
      expect(result.type).toBe('portal');
      expect(result.title).toBe('Shareable Link');
      expect(result.language).toBe('url');
    });

    it('should return direct URL', () => {
      const result = generateEmbedCode(testWidget, 'portal');
      expect(result.code).toContain(`/chat/${testWidget.widgetKey}`);
      expect(result.code).not.toContain('<script');
      expect(result.code).not.toContain('<iframe');
    });

    it('should have link icon', () => {
      const result = generateEmbedCode(testWidget, 'portal');
      expect(result.icon).toBe('link');
    });
  });
});

// =============================================================================
// B. generateAllEmbedCodes Tests (5 tests)
// =============================================================================

describe('generateAllEmbedCodes', () => {
  const testWidget = { widgetKey: 'TestKey12345678' };

  it('should return all 4 embed types', () => {
    const results = generateAllEmbedCodes(testWidget);
    expect(results.length).toBe(4);
  });

  it('should include all embed types', () => {
    const results = generateAllEmbedCodes(testWidget);
    const types = results.map(r => r.type);
    expect(types).toContain('popup');
    expect(types).toContain('inline');
    expect(types).toContain('fullpage');
    expect(types).toContain('portal');
  });

  it('should return results in correct order', () => {
    const results = generateAllEmbedCodes(testWidget);
    expect(results[0].type).toBe('popup');
    expect(results[1].type).toBe('inline');
    expect(results[2].type).toBe('fullpage');
    expect(results[3].type).toBe('portal');
  });

  it('should use same widget key for all types', () => {
    const results = generateAllEmbedCodes(testWidget);
    results.forEach(result => {
      expect(result.code).toContain(testWidget.widgetKey);
    });
  });

  it('should return unique embed codes', () => {
    const results = generateAllEmbedCodes(testWidget);
    const codes = results.map(r => r.code);
    const uniqueCodes = new Set(codes);
    expect(uniqueCodes.size).toBe(4);
  });
});

// =============================================================================
// C. getPrimaryEmbedCode Tests (4 tests)
// =============================================================================

describe('getPrimaryEmbedCode', () => {
  it('should return popup by default', () => {
    const widget = { widgetKey: 'DefaultKey12345' };
    const result = getPrimaryEmbedCode(widget);
    expect(result.type).toBe('popup');
  });

  it('should return configured embed type', () => {
    const widget = { widgetKey: 'InlineKey1234567', embedType: 'inline' as EmbedType };
    const result = getPrimaryEmbedCode(widget);
    expect(result.type).toBe('inline');
  });

  it('should work with fullpage embed type', () => {
    const widget = { widgetKey: 'FullpageKey12345', embedType: 'fullpage' as EmbedType };
    const result = getPrimaryEmbedCode(widget);
    expect(result.type).toBe('fullpage');
  });

  it('should work with portal embed type', () => {
    const widget = { widgetKey: 'PortalKey1234567', embedType: 'portal' as EmbedType };
    const result = getPrimaryEmbedCode(widget);
    expect(result.type).toBe('portal');
  });
});

// =============================================================================
// D. generateWidgetKey Tests (5 tests)
// =============================================================================

describe('generateWidgetKey', () => {
  it('should generate 16-character key', () => {
    const key = generateWidgetKey();
    expect(key.length).toBe(16);
  });

  it('should only contain alphanumeric characters', () => {
    const key = generateWidgetKey();
    expect(key).toMatch(/^[A-Za-z0-9]+$/);
  });

  it('should generate unique keys', () => {
    const keys = new Set<string>();
    for (let i = 0; i < 50; i++) {
      keys.add(generateWidgetKey());
    }
    expect(keys.size).toBe(50);
  });

  it('should be URL-safe', () => {
    const key = generateWidgetKey();
    expect(encodeURIComponent(key)).toBe(key);
  });

  it('should pass validation', () => {
    const key = generateWidgetKey();
    expect(isValidWidgetKey(key)).toBe(true);
  });
});

// =============================================================================
// E. isValidWidgetKey Tests (8 tests)
// =============================================================================

describe('isValidWidgetKey', () => {
  it('should accept valid 16-char alphanumeric key', () => {
    expect(isValidWidgetKey('AbCdEfGh12345678')).toBe(true);
  });

  it('should reject empty string', () => {
    expect(isValidWidgetKey('')).toBe(false);
  });

  it('should reject null', () => {
    expect(isValidWidgetKey(null as any)).toBe(false);
  });

  it('should reject undefined', () => {
    expect(isValidWidgetKey(undefined as any)).toBe(false);
  });

  it('should reject key shorter than 16 chars', () => {
    expect(isValidWidgetKey('AbCdEfGh123456')).toBe(false);
  });

  it('should reject key longer than 16 chars', () => {
    expect(isValidWidgetKey('AbCdEfGh123456789')).toBe(false);
  });

  it('should reject key with special characters', () => {
    expect(isValidWidgetKey('AbCdEfGh1234567!')).toBe(false);
    expect(isValidWidgetKey('AbCdEfGh1234567-')).toBe(false);
    expect(isValidWidgetKey('AbCdEfGh1234567_')).toBe(false);
  });

  it('should reject key with spaces', () => {
    expect(isValidWidgetKey('AbCdEfGh 1234567')).toBe(false);
  });
});

// =============================================================================
// F. getEmbedTypeInfo Tests (4 tests)
// =============================================================================

describe('getEmbedTypeInfo', () => {
  it('should return correct info for popup', () => {
    const info = getEmbedTypeInfo('popup');
    expect(info.label).toBe('Popup');
    expect(info.shortDescription).toContain('bubble');
    expect(info.tier).toBe('free');
  });

  it('should return correct info for inline', () => {
    const info = getEmbedTypeInfo('inline');
    expect(info.label).toBe('Inline');
    expect(info.shortDescription).toContain('page');
    expect(info.tier).toBe('basic');
  });

  it('should return correct info for fullpage', () => {
    const info = getEmbedTypeInfo('fullpage');
    expect(info.label).toBe('Fullpage');
    expect(info.shortDescription).toContain('viewport');
    expect(info.tier).toBe('pro');
  });

  it('should return correct info for portal', () => {
    const info = getEmbedTypeInfo('portal');
    expect(info.label).toBe('Portal');
    expect(info.shortDescription).toContain('link');
    expect(info.tier).toBe('basic');
  });
});

// =============================================================================
// G. EMBED_TYPES constant Tests (3 tests)
// =============================================================================

describe('EMBED_TYPES constant', () => {
  it('should have all 4 types', () => {
    expect(EMBED_TYPES.length).toBe(4);
  });

  it('should include all expected types', () => {
    expect(EMBED_TYPES).toContain('popup');
    expect(EMBED_TYPES).toContain('inline');
    expect(EMBED_TYPES).toContain('fullpage');
    expect(EMBED_TYPES).toContain('portal');
  });

  it('should have popup first', () => {
    expect(EMBED_TYPES[0]).toBe('popup');
  });
});
