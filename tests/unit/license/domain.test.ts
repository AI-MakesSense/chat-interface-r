import { describe, it, expect } from 'vitest';
// RED: Module doesn't exist yet - this import should fail
import { normalizeDomain, isValidDomain } from '@/lib/license/domain';

describe('normalizeDomain', () => {
  describe('basic normalization', () => {
    it('should return domain unchanged when already normalized', () => {
      expect(normalizeDomain('example.com')).toBe('example.com');
    });

    it('should convert uppercase to lowercase', () => {
      expect(normalizeDomain('Example.COM')).toBe('example.com');
    });

    it('should convert mixed case to lowercase', () => {
      expect(normalizeDomain('ExAmPlE.CoM')).toBe('example.com');
    });

    it('should trim leading and trailing whitespace', () => {
      expect(normalizeDomain('  example.com  ')).toBe('example.com');
    });

    it('should trim tabs and newlines', () => {
      expect(normalizeDomain('\t\nexample.com\n\t')).toBe('example.com');
    });
  });

  describe('protocol removal', () => {
    it('should remove http:// protocol', () => {
      expect(normalizeDomain('http://example.com')).toBe('example.com');
    });

    it('should remove https:// protocol', () => {
      expect(normalizeDomain('https://example.com')).toBe('example.com');
    });

    it('should handle uppercase protocol', () => {
      expect(normalizeDomain('HTTP://example.com')).toBe('example.com');
    });

    it('should handle mixed case protocol', () => {
      expect(normalizeDomain('HtTpS://example.com')).toBe('example.com');
    });
  });

  describe('www prefix removal', () => {
    it('should remove www. prefix', () => {
      expect(normalizeDomain('www.example.com')).toBe('example.com');
    });

    it('should remove www. with protocol', () => {
      expect(normalizeDomain('https://www.example.com')).toBe('example.com');
    });

    it('should remove WWW. (uppercase)', () => {
      expect(normalizeDomain('WWW.example.com')).toBe('example.com');
    });

    it('should preserve www if it is part of subdomain (not prefix)', () => {
      // e.g., "wwwtest.example.com" should become "wwwtest.example.com"
      expect(normalizeDomain('wwwtest.example.com')).toBe('wwwtest.example.com');
    });
  });

  describe('path and trailing slash removal', () => {
    it('should remove trailing slash', () => {
      expect(normalizeDomain('example.com/')).toBe('example.com');
    });

    it('should remove single-level path', () => {
      expect(normalizeDomain('example.com/path')).toBe('example.com');
    });

    it('should remove multi-level path', () => {
      expect(normalizeDomain('example.com/path/to/page')).toBe('example.com');
    });

    it('should remove path with query parameters', () => {
      expect(normalizeDomain('example.com/path?query=value')).toBe('example.com');
    });

    it('should remove path with hash fragment', () => {
      expect(normalizeDomain('example.com/path#section')).toBe('example.com');
    });

    it('should handle protocol, www, path combination', () => {
      expect(normalizeDomain('https://www.example.com/path/to/page')).toBe('example.com');
    });
  });

  describe('port removal', () => {
    it('should remove standard HTTP port', () => {
      expect(normalizeDomain('example.com:80')).toBe('example.com');
    });

    it('should remove standard HTTPS port', () => {
      expect(normalizeDomain('example.com:443')).toBe('example.com');
    });

    it('should remove custom port', () => {
      expect(normalizeDomain('example.com:3000')).toBe('example.com');
    });

    it('should remove port with protocol', () => {
      expect(normalizeDomain('https://example.com:8080')).toBe('example.com');
    });

    it('should remove port with protocol and path', () => {
      expect(normalizeDomain('https://example.com:8080/path')).toBe('example.com');
    });

    it('should handle all normalizations together: protocol, www, port, path', () => {
      expect(normalizeDomain('HTTPS://WWW.Example.COM:8080/path/to/page')).toBe('example.com');
    });
  });

  describe('subdomain preservation', () => {
    it('should preserve single subdomain', () => {
      expect(normalizeDomain('api.example.com')).toBe('api.example.com');
    });

    it('should preserve multi-level subdomains', () => {
      expect(normalizeDomain('app.staging.example.com')).toBe('app.staging.example.com');
    });

    it('should preserve subdomain with protocol removal', () => {
      expect(normalizeDomain('https://api.example.com')).toBe('api.example.com');
    });

    it('should preserve subdomain but remove www prefix', () => {
      expect(normalizeDomain('www.api.example.com')).toBe('api.example.com');
    });

    it('should handle subdomain with all normalizations', () => {
      expect(normalizeDomain('HTTPS://WWW.API.Example.COM:3000/path')).toBe('api.example.com');
    });
  });

  describe('edge cases', () => {
    it('should return empty string for empty input', () => {
      expect(normalizeDomain('')).toBe('');
    });

    it('should return empty string for whitespace-only input', () => {
      expect(normalizeDomain('   ')).toBe('');
    });

    it('should return empty string for just protocol', () => {
      expect(normalizeDomain('https://')).toBe('');
    });

    it('should return empty string for just www', () => {
      expect(normalizeDomain('www.')).toBe('');
    });

    it('should return empty string for protocol and www only', () => {
      expect(normalizeDomain('https://www.')).toBe('');
    });

    it('should handle localhost', () => {
      expect(normalizeDomain('localhost')).toBe('localhost');
    });

    it('should handle localhost with port', () => {
      expect(normalizeDomain('localhost:3000')).toBe('localhost');
    });
  });
});

describe('isValidDomain', () => {
  describe('valid domains', () => {
    it('should accept basic domain with TLD', () => {
      expect(isValidDomain('example.com')).toBe(true);
    });

    it('should accept domain with subdomain', () => {
      expect(isValidDomain('subdomain.example.com')).toBe(true);
    });

    it('should accept domain with hyphen', () => {
      expect(isValidDomain('my-site.com')).toBe(true);
    });

    it('should accept domain with country code TLD', () => {
      expect(isValidDomain('my-site.co.uk')).toBe(true);
    });

    it('should accept multi-level subdomain', () => {
      expect(isValidDomain('app.staging.example.com')).toBe(true);
    });

    it('should accept domain with numbers', () => {
      expect(isValidDomain('example123.com')).toBe(true);
    });

    it('should accept single-letter labels', () => {
      expect(isValidDomain('a.b.com')).toBe(true);
    });
  });

  describe('invalid domains - missing TLD', () => {
    it('should reject empty string', () => {
      expect(isValidDomain('')).toBe(false);
    });

    it('should reject single word without dot', () => {
      expect(isValidDomain('example')).toBe(false);
    });

    it('should reject whitespace-only string', () => {
      expect(isValidDomain('   ')).toBe(false);
    });
  });

  describe('invalid domains - dot placement', () => {
    it('should reject domain starting with dot', () => {
      expect(isValidDomain('.example.com')).toBe(false);
    });

    it('should reject domain ending with dot', () => {
      expect(isValidDomain('example.com.')).toBe(false);
    });

    it('should reject domain with consecutive dots', () => {
      expect(isValidDomain('example..com')).toBe(false);
    });

    it('should reject domain with multiple consecutive dots', () => {
      expect(isValidDomain('example...com')).toBe(false);
    });
  });

  describe('invalid domains - invalid characters', () => {
    it('should reject domain with space', () => {
      expect(isValidDomain('example .com')).toBe(false);
    });

    it('should reject domain with underscore', () => {
      // Underscores are not valid in domain names (only in hostnames for special cases)
      expect(isValidDomain('example_com')).toBe(false);
    });

    it('should reject domain with special characters', () => {
      expect(isValidDomain('example@com')).toBe(false);
    });

    it('should reject domain with hash', () => {
      expect(isValidDomain('example#com')).toBe(false);
    });

    it('should reject domain with slash', () => {
      expect(isValidDomain('example/com')).toBe(false);
    });
  });

  describe('invalid domains - hyphen placement', () => {
    it('should reject domain starting with hyphen', () => {
      expect(isValidDomain('-example.com')).toBe(false);
    });

    it('should reject label ending with hyphen', () => {
      expect(isValidDomain('example-.com')).toBe(false);
    });

    it('should reject label starting with hyphen after dot', () => {
      expect(isValidDomain('example.-com')).toBe(false);
    });

    it('should reject TLD starting with hyphen', () => {
      expect(isValidDomain('example.-com')).toBe(false);
    });
  });

  describe('invalid domains - length validation', () => {
    it('should reject label longer than 63 characters', () => {
      // Create a label with 64 characters
      const longLabel = 'a'.repeat(64);
      expect(isValidDomain(`${longLabel}.com`)).toBe(false);
    });

    it('should accept label exactly 63 characters', () => {
      // Create a label with exactly 63 characters
      const maxLabel = 'a'.repeat(63);
      expect(isValidDomain(`${maxLabel}.com`)).toBe(true);
    });

    it('should reject domain longer than 253 characters', () => {
      // Create a domain with total length > 253
      // Each label can be up to 63 chars, so we need multiple labels
      const label = 'a'.repeat(50);
      const longDomain = `${label}.${label}.${label}.${label}.${label}.com`; // 50*5 + 5 dots + 3 = 258 chars
      expect(isValidDomain(longDomain)).toBe(false);
    });

    it('should accept domain at exactly 253 characters', () => {
      // Create domain with exactly 253 characters
      // 253 = 63 + 1 + 63 + 1 + 63 + 1 + 61
      const part63 = 'a'.repeat(63);
      const part61 = 'a'.repeat(61);
      const domain253 = `${part63}.${part63}.${part63}.${part61}`; // 63+1+63+1+63+1+61 = 253
      expect(isValidDomain(domain253)).toBe(true);
    });
  });

  describe('edge cases and special scenarios', () => {
    it('should accept localhost for development', () => {
      // localhost is a valid domain for development/testing purposes
      expect(isValidDomain('localhost')).toBe(true);
    });

    it('should accept localhost with different casing', () => {
      expect(isValidDomain('LOCALHOST')).toBe(true);
      expect(isValidDomain('LocalHost')).toBe(true);
    });

    it('should reject IP address format (not a domain)', () => {
      // IP addresses are not domains for our purposes
      expect(isValidDomain('192.168.1.1')).toBe(false);
    });

    it('should accept domain with all valid characters', () => {
      expect(isValidDomain('test-123.example-456.com')).toBe(true);
    });

    it('should reject domain with only dots', () => {
      expect(isValidDomain('...')).toBe(false);
    });

    it('should reject single dot', () => {
      expect(isValidDomain('.')).toBe(false);
    });
  });
});
