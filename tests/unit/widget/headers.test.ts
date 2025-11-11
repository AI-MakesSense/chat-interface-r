/**
 * Unit Tests for Widget Headers Utilities
 *
 * Purpose: Test domain extraction from referer headers and response header creation
 * Module: lib/widget/headers.ts
 *
 * Test Coverage:
 * - extractDomainFromReferer: Extract domain from referer header (various URL formats)
 * - createResponseHeaders: Create standard response headers for widget serving
 *
 * Note: These tests FAIL in RED phase - implementation required for GREEN phase
 */

import { describe, it, expect } from 'vitest';
import { extractDomainFromReferer, createResponseHeaders } from '@/lib/widget/headers';

describe('extractDomainFromReferer', () => {
  describe('Happy Path - Valid URLs', () => {
    // Must extract domain from HTTPS URL
    it('should extract domain from https URL', () => {
      const referer = 'https://example.com/page';
      const result = extractDomainFromReferer(referer);
      expect(result).toBe('example.com');
    });

    // Must extract domain from HTTP URL
    it('should extract domain from http URL', () => {
      const referer = 'http://example.com/page';
      const result = extractDomainFromReferer(referer);
      expect(result).toBe('example.com');
    });

    // Must remove www prefix for normalization
    it('should remove www prefix from domain', () => {
      const referer = 'https://www.example.com/page';
      const result = extractDomainFromReferer(referer);
      expect(result).toBe('example.com');
    });

    // Must handle port numbers and remove them
    it('should remove port number from domain', () => {
      const referer = 'https://example.com:3000/page';
      const result = extractDomainFromReferer(referer);
      expect(result).toBe('example.com');
    });

    // Must handle subdomains correctly
    it('should handle subdomains correctly', () => {
      const referer = 'https://api.example.com/page';
      const result = extractDomainFromReferer(referer);
      expect(result).toBe('api.example.com');
    });

    // Must handle localhost for development
    it('should handle localhost domain', () => {
      const referer = 'http://localhost:3000/page';
      const result = extractDomainFromReferer(referer);
      expect(result).toBe('localhost');
    });

    // Must handle IP addresses
    it('should handle IP addresses', () => {
      const referer = 'http://192.168.1.1:8000/page';
      const result = extractDomainFromReferer(referer);
      expect(result).toBe('192.168.1.1');
    });

    // Must handle query parameters
    it('should ignore query parameters', () => {
      const referer = 'https://example.com/page?param=value&other=123';
      const result = extractDomainFromReferer(referer);
      expect(result).toBe('example.com');
    });

    // Must handle URL hash
    it('should ignore URL hash', () => {
      const referer = 'https://example.com/page#section';
      const result = extractDomainFromReferer(referer);
      expect(result).toBe('example.com');
    });

    // Must normalize to lowercase
    it('should normalize domain to lowercase', () => {
      const referer = 'https://Example.COM/page';
      const result = extractDomainFromReferer(referer);
      expect(result).toBe('example.com');
    });

    // Must remove www and handle subdomains with port
    it('should handle www with subdomain and port', () => {
      const referer = 'https://www.api.example.com:8443/page';
      const result = extractDomainFromReferer(referer);
      expect(result).toBe('api.example.com');
    });

    // Must handle multiple levels of subdomains
    it('should handle multiple subdomain levels', () => {
      const referer = 'https://staging.api.example.com/page';
      const result = extractDomainFromReferer(referer);
      expect(result).toBe('staging.api.example.com');
    });
  });

  describe('Error Cases - Invalid Input', () => {
    // Must return null for invalid URL
    it('should return null for invalid URL format', () => {
      const referer = 'not a valid url at all';
      const result = extractDomainFromReferer(referer);
      expect(result).toBeNull();
    });

    // Must return null for empty string
    it('should return null for empty string', () => {
      const referer = '';
      const result = extractDomainFromReferer(referer);
      expect(result).toBeNull();
    });

    // Must return null for malformed URL
    it('should return null for malformed URL without protocol', () => {
      const referer = 'example.com/page';
      const result = extractDomainFromReferer(referer);
      expect(result).toBeNull();
    });

    // Must return null for URL with only protocol
    it('should return null for URL with only protocol', () => {
      const referer = 'https://';
      const result = extractDomainFromReferer(referer);
      expect(result).toBeNull();
    });

    // Must return null for undefined
    it('should return null for undefined', () => {
      const referer = undefined as any;
      const result = extractDomainFromReferer(referer);
      expect(result).toBeNull();
    });

    // Must return null for null
    it('should return null for null', () => {
      const referer = null as any;
      const result = extractDomainFromReferer(referer);
      expect(result).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    // Must handle domain with hyphens
    it('should handle domain with hyphens', () => {
      const referer = 'https://my-example-site.com/page';
      const result = extractDomainFromReferer(referer);
      expect(result).toBe('my-example-site.com');
    });

    // Must handle domain with numbers
    it('should handle domain with numbers', () => {
      const referer = 'https://example123.com/page';
      const result = extractDomainFromReferer(referer);
      expect(result).toBe('example123.com');
    });

    // Must handle international domains
    it('should handle international domains', () => {
      const referer = 'https://例え.jp/page';
      const result = extractDomainFromReferer(referer);
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
    });

    // Must handle very long paths
    it('should handle URL with very long path', () => {
      const longPath = '/path/' + 'segment/'.repeat(50) + 'page';
      const referer = 'https://example.com' + longPath;
      const result = extractDomainFromReferer(referer);
      expect(result).toBe('example.com');
    });

    // Must handle URL with no path
    it('should handle URL with no path', () => {
      const referer = 'https://example.com';
      const result = extractDomainFromReferer(referer);
      expect(result).toBe('example.com');
    });

    // Must handle URL with trailing slash
    it('should handle URL with trailing slash', () => {
      const referer = 'https://example.com/';
      const result = extractDomainFromReferer(referer);
      expect(result).toBe('example.com');
    });
  });
});

describe('createResponseHeaders', () => {
  describe('Content Type Header', () => {
    // Must set content-type to javascript
    it('should set content-type to application/javascript', () => {
      const headers = createResponseHeaders();
      expect(headers['Content-Type']).toBe('application/javascript');
    });

    // Alternative: charset might be included
    it('should have content-type with charset if included', () => {
      const headers = createResponseHeaders();
      expect(headers['Content-Type']).toMatch(/javascript/);
    });
  });

  describe('Cache Control Header', () => {
    // Must set cache-control header for browser caching
    it('should set cache-control header for browser cache', () => {
      const headers = createResponseHeaders();
      expect(headers['Cache-Control']).toBeDefined();
      expect(headers['Cache-Control']).toContain('max-age');
    });

    // Must include public directive
    it('should include public directive in cache-control', () => {
      const headers = createResponseHeaders();
      expect(headers['Cache-Control']).toContain('public');
    });

    // Must include stale-while-revalidate for CDN caching
    it('should include stale-while-revalidate for CDN', () => {
      const headers = createResponseHeaders();
      expect(headers['Cache-Control']).toContain('stale-while-revalidate');
    });
  });

  describe('CORS Header', () => {
    // Must set CORS header to allow all origins (widget needs to work anywhere)
    it('should set Access-Control-Allow-Origin to *', () => {
      const headers = createResponseHeaders();
      expect(headers['Access-Control-Allow-Origin']).toBe('*');
    });

    // CORS header allows widget to be loaded from any domain
    it('should allow widget to load from any domain', () => {
      const headers = createResponseHeaders();
      const corsHeader = headers['Access-Control-Allow-Origin'];
      expect(corsHeader).toBeDefined();
      expect(corsHeader).not.toBeNull();
    });
  });

  describe('Return Type', () => {
    // Must return object with string keys and string values
    it('should return object with string keys and values', () => {
      const headers = createResponseHeaders();
      expect(typeof headers).toBe('object');
      Object.entries(headers).forEach(([key, value]) => {
        expect(typeof key).toBe('string');
        expect(typeof value).toBe('string');
      });
    });

    // Must return consistent headers on multiple calls
    it('should return consistent headers across calls', () => {
      const headers1 = createResponseHeaders();
      const headers2 = createResponseHeaders();
      expect(headers1).toEqual(headers2);
    });

    // Must have at least 3 core headers
    it('should have minimum required headers', () => {
      const headers = createResponseHeaders();
      const requiredHeaders = ['Content-Type', 'Cache-Control', 'Access-Control-Allow-Origin'];
      requiredHeaders.forEach(header => {
        expect(headers[header]).toBeDefined();
      });
    });
  });

  describe('Header Format', () => {
    // Headers should be production-ready
    it('should have properly formatted header values', () => {
      const headers = createResponseHeaders();
      Object.entries(headers).forEach(([key, value]) => {
        expect(value.trim()).toBe(value);
        expect(value.length).toBeGreaterThan(0);
      });
    });

    // No extra spaces or formatting issues
    it('should not have extra whitespace', () => {
      const headers = createResponseHeaders();
      Object.values(headers).forEach(value => {
        expect(value).not.toMatch(/^\s+|\s+$/);
      });
    });
  });
});
