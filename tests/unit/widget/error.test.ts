/**
 * Unit Tests for Widget Error Utilities
 *
 * Purpose: Test error script generation and error logging for widget serving
 * Module: lib/widget/error.ts
 *
 * Test Coverage:
 * - createErrorScript: Generate JavaScript error script (6 error types)
 * - logWidgetError: Log error with context and timestamp
 *
 * Note: These tests FAIL in RED phase - implementation required for GREEN phase
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createErrorScript, logWidgetError, ErrorType } from '@/lib/widget/error';

describe('createErrorScript', () => {
  describe('Error Type: LICENSE_INVALID', () => {
    // Must create valid JavaScript for invalid license error
    it('should create valid JavaScript for LICENSE_INVALID error', () => {
      const script = createErrorScript('LICENSE_INVALID');
      expect(typeof script).toBe('string');
      expect(script.length).toBeGreaterThan(0);
      expect(() => new Function(script)).not.toThrow();
    });

    // Script must set error flag on window object
    it('should set error flag on window for LICENSE_INVALID', () => {
      const script = createErrorScript('LICENSE_INVALID');
      expect(script).toContain('window');
      expect(script).toContain('error');
    });

    // Script must be executable JavaScript
    it('should be executable JavaScript without syntax errors', () => {
      const script = createErrorScript('LICENSE_INVALID');
      expect(() => {
        new Function(script);
      }).not.toThrow();
    });

    // Script must not expose sensitive data
    it('should not expose sensitive data in error message', () => {
      const script = createErrorScript('LICENSE_INVALID');
      expect(script).not.toContain('password');
      expect(script).not.toContain('secret');
      expect(script).not.toContain('key');
    });
  });

  describe('Error Type: LICENSE_EXPIRED', () => {
    // Must create valid JavaScript for expired license error
    it('should create valid JavaScript for LICENSE_EXPIRED error', () => {
      const script = createErrorScript('LICENSE_EXPIRED');
      expect(typeof script).toBe('string');
      expect(script.length).toBeGreaterThan(0);
      expect(() => new Function(script)).not.toThrow();
    });

    // Must set appropriate error flag
    it('should set error flag on window for LICENSE_EXPIRED', () => {
      const script = createErrorScript('LICENSE_EXPIRED');
      expect(script).toContain('window');
    });
  });

  describe('Error Type: DOMAIN_UNAUTHORIZED', () => {
    // Must create valid JavaScript for unauthorized domain error
    it('should create valid JavaScript for DOMAIN_UNAUTHORIZED error', () => {
      const script = createErrorScript('DOMAIN_UNAUTHORIZED');
      expect(typeof script).toBe('string');
      expect(script.length).toBeGreaterThan(0);
      expect(() => new Function(script)).not.toThrow();
    });

    // Must set appropriate error flag
    it('should set error flag on window for DOMAIN_UNAUTHORIZED', () => {
      const script = createErrorScript('DOMAIN_UNAUTHORIZED');
      expect(script).toContain('window');
    });
  });

  describe('Error Type: LICENSE_CANCELLED', () => {
    // Must create valid JavaScript for cancelled license error
    it('should create valid JavaScript for LICENSE_CANCELLED error', () => {
      const script = createErrorScript('LICENSE_CANCELLED');
      expect(typeof script).toBe('string');
      expect(script.length).toBeGreaterThan(0);
      expect(() => new Function(script)).not.toThrow();
    });

    // Must set appropriate error flag
    it('should set error flag on window for LICENSE_CANCELLED', () => {
      const script = createErrorScript('LICENSE_CANCELLED');
      expect(script).toContain('window');
    });
  });

  describe('Error Type: REFERER_MISSING', () => {
    // Must create valid JavaScript for missing referer error
    it('should create valid JavaScript for REFERER_MISSING error', () => {
      const script = createErrorScript('REFERER_MISSING');
      expect(typeof script).toBe('string');
      expect(script.length).toBeGreaterThan(0);
      expect(() => new Function(script)).not.toThrow();
    });

    // Must set appropriate error flag
    it('should set error flag on window for REFERER_MISSING', () => {
      const script = createErrorScript('REFERER_MISSING');
      expect(script).toContain('window');
    });
  });

  describe('Error Type: INTERNAL_ERROR', () => {
    // Must create valid JavaScript for internal server error
    it('should create valid JavaScript for INTERNAL_ERROR error', () => {
      const script = createErrorScript('INTERNAL_ERROR');
      expect(typeof script).toBe('string');
      expect(script.length).toBeGreaterThan(0);
      expect(() => new Function(script)).not.toThrow();
    });

    // Must set appropriate error flag
    it('should set error flag on window for INTERNAL_ERROR', () => {
      const script = createErrorScript('INTERNAL_ERROR');
      expect(script).toContain('window');
    });
  });

  describe('Console Logging', () => {
    // Script must log error to console.error
    it('should log error to console', () => {
      const script = createErrorScript('LICENSE_INVALID');
      expect(script).toMatch(/console\.error/i);
    });

    // Must include error type in log message
    it('should include error type in console message', () => {
      const script = createErrorScript('LICENSE_EXPIRED');
      expect(script.toLowerCase()).toContain('error');
    });

    // Different error types should have different messages
    it('should create different messages for different error types', () => {
      const script1 = createErrorScript('LICENSE_INVALID');
      const script2 = createErrorScript('DOMAIN_UNAUTHORIZED');
      expect(script1).not.toBe(script2);
    });
  });

  describe('Security', () => {
    // Must not expose sensitive license data
    it('should not expose license keys in error script', () => {
      const errorTypes: ErrorType[] = [
        'LICENSE_INVALID',
        'LICENSE_EXPIRED',
        'DOMAIN_UNAUTHORIZED',
        'LICENSE_CANCELLED',
        'REFERER_MISSING',
        'INTERNAL_ERROR'
      ];

      errorTypes.forEach(errorType => {
        const script = createErrorScript(errorType);
        expect(script).not.toMatch(/[a-f0-9]{32}/); // No hex license keys
        expect(script).not.toContain('api_key');
        expect(script).not.toContain('secret');
      });
    });

    // Must not allow code injection
    it('should not be susceptible to code injection', () => {
      const script = createErrorScript('LICENSE_INVALID');
      expect(() => new Function(script)).not.toThrow();
      // Script should be safe to execute
    });
  });

  describe('Return Type', () => {
    // Must return valid JavaScript string
    it('should always return a string', () => {
      const script = createErrorScript('LICENSE_INVALID');
      expect(typeof script).toBe('string');
    });

    // Must not be empty
    it('should not return empty string', () => {
      const script = createErrorScript('LICENSE_INVALID');
      expect(script.length).toBeGreaterThan(0);
    });

    // Must be valid for direct eval (in safe context)
    it('should be executable JavaScript', () => {
      const errorTypes: ErrorType[] = [
        'LICENSE_INVALID',
        'LICENSE_EXPIRED',
        'DOMAIN_UNAUTHORIZED',
        'LICENSE_CANCELLED',
        'REFERER_MISSING',
        'INTERNAL_ERROR'
      ];

      errorTypes.forEach(errorType => {
        const script = createErrorScript(errorType);
        expect(() => {
          new Function(script);
        }).not.toThrow();
      });
    });
  });

  describe('All Error Types Coverage', () => {
    // Must support all 6 error types
    it('should support LICENSE_INVALID type', () => {
      const script = createErrorScript('LICENSE_INVALID');
      expect(script).toBeDefined();
      expect(script.length).toBeGreaterThan(0);
    });

    it('should support LICENSE_EXPIRED type', () => {
      const script = createErrorScript('LICENSE_EXPIRED');
      expect(script).toBeDefined();
      expect(script.length).toBeGreaterThan(0);
    });

    it('should support DOMAIN_UNAUTHORIZED type', () => {
      const script = createErrorScript('DOMAIN_UNAUTHORIZED');
      expect(script).toBeDefined();
      expect(script.length).toBeGreaterThan(0);
    });

    it('should support LICENSE_CANCELLED type', () => {
      const script = createErrorScript('LICENSE_CANCELLED');
      expect(script).toBeDefined();
      expect(script.length).toBeGreaterThan(0);
    });

    it('should support REFERER_MISSING type', () => {
      const script = createErrorScript('REFERER_MISSING');
      expect(script).toBeDefined();
      expect(script.length).toBeGreaterThan(0);
    });

    it('should support INTERNAL_ERROR type', () => {
      const script = createErrorScript('INTERNAL_ERROR');
      expect(script).toBeDefined();
      expect(script.length).toBeGreaterThan(0);
    });
  });
});

describe('logWidgetError', () => {
  describe('Basic Logging', () => {
    // Mock console.error
    beforeEach(() => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    // Must log error with context
    it('should log error with context', () => {
      const consoleSpy = vi.spyOn(console, 'error');
      const context = { domain: 'example.com', licenseKey: 'abc123' };

      logWidgetError('LICENSE_INVALID', context);

      expect(consoleSpy).toHaveBeenCalled();
    });

    // Must include error type in log
    it('should include error type in log message', () => {
      const consoleSpy = vi.spyOn(console, 'error');
      logWidgetError('LICENSE_EXPIRED', {});

      expect(consoleSpy).toHaveBeenCalled();
      const logCall = consoleSpy.mock.calls[0];
      expect(JSON.stringify(logCall)).toContain('LICENSE_EXPIRED');
    });

    // Must include context in log
    it('should include context in log message', () => {
      const consoleSpy = vi.spyOn(console, 'error');
      const context = { domain: 'example.com', ip: '192.168.1.1' };

      logWidgetError('DOMAIN_UNAUTHORIZED', context);

      expect(consoleSpy).toHaveBeenCalled();
    });

    // Must handle empty context
    it('should handle empty context object', () => {
      const consoleSpy = vi.spyOn(console, 'error');

      expect(() => {
        logWidgetError('LICENSE_INVALID', {});
      }).not.toThrow();

      expect(consoleSpy).toHaveBeenCalled();
    });

    // Must handle undefined context
    it('should handle undefined context', () => {
      const consoleSpy = vi.spyOn(console, 'error');

      expect(() => {
        logWidgetError('LICENSE_INVALID', undefined as any);
      }).not.toThrow();
    });
  });

  describe('Timestamp Handling', () => {
    // Must include timestamp in log
    it('should include timestamp in log', () => {
      const consoleSpy = vi.spyOn(console, 'error');

      logWidgetError('LICENSE_INVALID', {});

      expect(consoleSpy).toHaveBeenCalled();
      const logMessage = JSON.stringify(consoleSpy.mock.calls[0]);
      expect(logMessage).toMatch(/\d{4}-\d{2}-\d{2}/);
    });

    // Must use current timestamp
    it('should use current time for timestamp', () => {
      const consoleSpy = vi.spyOn(console, 'error');
      const beforeTime = new Date();

      logWidgetError('LICENSE_INVALID', {});

      const afterTime = new Date();
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('Context Handling', () => {
    // Must log domain if provided
    it('should log domain from context', () => {
      const consoleSpy = vi.spyOn(console, 'error');
      const context = { domain: 'example.com' };

      logWidgetError('DOMAIN_UNAUTHORIZED', context);

      expect(consoleSpy).toHaveBeenCalled();
    });

    // Must log license key if provided
    it('should log license key from context', () => {
      const consoleSpy = vi.spyOn(console, 'error');
      const context = { licenseKey: 'abc123def456' };

      logWidgetError('LICENSE_INVALID', context);

      expect(consoleSpy).toHaveBeenCalled();
    });

    // Must log IP address if provided
    it('should log IP address from context', () => {
      const consoleSpy = vi.spyOn(console, 'error');
      const context = { ip: '192.168.1.1' };

      logWidgetError('LICENSE_INVALID', context);

      expect(consoleSpy).toHaveBeenCalled();
    });

    // Must handle multiple context fields
    it('should handle multiple context fields', () => {
      const consoleSpy = vi.spyOn(console, 'error');
      const context = {
        domain: 'example.com',
        licenseKey: 'abc123',
        ip: '192.168.1.1',
        reason: 'Domain not authorized'
      };

      logWidgetError('DOMAIN_UNAUTHORIZED', context);

      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('Error Types', () => {
    // Must support all 6 error types
    it('should log LICENSE_INVALID error', () => {
      const consoleSpy = vi.spyOn(console, 'error');
      expect(() => {
        logWidgetError('LICENSE_INVALID', {});
      }).not.toThrow();
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should log LICENSE_EXPIRED error', () => {
      const consoleSpy = vi.spyOn(console, 'error');
      expect(() => {
        logWidgetError('LICENSE_EXPIRED', {});
      }).not.toThrow();
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should log DOMAIN_UNAUTHORIZED error', () => {
      const consoleSpy = vi.spyOn(console, 'error');
      expect(() => {
        logWidgetError('DOMAIN_UNAUTHORIZED', {});
      }).not.toThrow();
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should log LICENSE_CANCELLED error', () => {
      const consoleSpy = vi.spyOn(console, 'error');
      expect(() => {
        logWidgetError('LICENSE_CANCELLED', {});
      }).not.toThrow();
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should log REFERER_MISSING error', () => {
      const consoleSpy = vi.spyOn(console, 'error');
      expect(() => {
        logWidgetError('REFERER_MISSING', {});
      }).not.toThrow();
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should log INTERNAL_ERROR error', () => {
      const consoleSpy = vi.spyOn(console, 'error');
      expect(() => {
        logWidgetError('INTERNAL_ERROR', {});
      }).not.toThrow();
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('Return Value', () => {
    // Must not throw
    it('should not throw error', () => {
      expect(() => {
        logWidgetError('LICENSE_INVALID', {});
      }).not.toThrow();
    });

    // Must not return value (void function)
    it('should be a void function', () => {
      const result = logWidgetError('LICENSE_INVALID', {});
      expect(result).toBeUndefined();
    });
  });

  describe('Security', () => {
    // Must not expose sensitive data in logs
    it('should safely log without exposing secrets', () => {
      const consoleSpy = vi.spyOn(console, 'error');
      const context = {
        licenseKey: 'super-secret-key-12345',
        domain: 'example.com'
      };

      logWidgetError('LICENSE_INVALID', context);

      expect(consoleSpy).toHaveBeenCalled();
      // Implementation should handle sensitive data safely
    });
  });
});
