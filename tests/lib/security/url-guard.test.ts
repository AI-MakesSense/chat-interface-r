/**
 * @jest-environment node
 *
 * Tests for the SSRF guard module.
 *
 * The dns/promises lookup is mocked at the top level so that:
 *  - no real network calls are made in CI
 *  - we can deterministically control what "hostnames resolve to"
 *
 * Mock setup MUST happen before the module under test is imported (jest.mock
 * is hoisted to the top of the file by Babel/jest transforms).
 */

// Control variable: tests that need specific DNS resolution set this before
// calling assertPublicWebhookUrl.
let mockLookupResult: Array<{ address: string; family: number }> = [];
let mockLookupShouldThrow = false;

jest.mock('node:dns/promises', () => ({
  lookup: jest.fn((_hostname: string, _opts: unknown) => {
    if (mockLookupShouldThrow) throw new Error('ENOTFOUND');
    return Promise.resolve(mockLookupResult);
  }),
}));

import { assertPublicWebhookUrl, isPrivateIp, isPlaceholderWebhook } from '@/lib/security/url-guard';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Configure the DNS mock to return a single address. */
function mockDns(address: string, family: 4 | 6 = 4) {
  mockLookupShouldThrow = false;
  mockLookupResult = [{ address, family }];
}

/** Configure the DNS mock to return multiple addresses. */
function mockDnsMulti(entries: Array<{ address: string; family: 4 | 6 }>) {
  mockLookupShouldThrow = false;
  mockLookupResult = entries;
}

/** Configure the DNS mock to simulate NXDOMAIN / lookup failure. */
function mockDnsEmpty() {
  mockLookupShouldThrow = false;
  mockLookupResult = [];
}

// ---------------------------------------------------------------------------
// isPrivateIp — pure function, no DNS involved
// ---------------------------------------------------------------------------

describe('isPrivateIp', () => {
  it.each([
    '127.0.0.1',
    '10.0.0.5',
    '172.16.0.1',
    '172.31.255.255',
    '192.168.1.1',
    '169.254.169.254',
    '0.0.0.0',
    '::1',
    'fd00::1',
    'fe80::1',
  ])('flags %s as private', (ip) => expect(isPrivateIp(ip)).toBe(true));

  it.each([
    '8.8.8.8',
    '1.1.1.1',
    '93.184.216.34',
    '2606:4700:4700::1111',
  ])('allows %s as public', (ip) => expect(isPrivateIp(ip)).toBe(false));

  // Edge cases from spec
  it('flags IPv4-mapped v6 address ::ffff:10.0.0.1 as private', () => {
    expect(isPrivateIp('::ffff:10.0.0.1')).toBe(true);
  });

  it('flags IPv4-mapped v6 address ::ffff:127.0.0.1 as private', () => {
    expect(isPrivateIp('::ffff:127.0.0.1')).toBe(true);
  });

  it('allows IPv4-mapped v6 address ::ffff:8.8.8.8 as public', () => {
    expect(isPrivateIp('::ffff:8.8.8.8')).toBe(false);
  });

  it('flags CGNAT range 100.64.0.1 as private', () => {
    expect(isPrivateIp('100.64.0.1')).toBe(true);
  });

  it('flags CGNAT range 100.127.255.255 as private', () => {
    expect(isPrivateIp('100.127.255.255')).toBe(true);
  });

  it('allows 100.128.0.1 (outside CGNAT) as public', () => {
    expect(isPrivateIp('100.128.0.1')).toBe(false);
  });

  it('flags :: (unspecified) as private', () => {
    expect(isPrivateIp('::')).toBe(true);
  });

  // TG-001: full fe80::/10 link-local range, not just fe80::/16
  it.each(['fe80::1', 'fe90::1', 'feaf::1', 'febf::1'])(
    'flags %s as private (link-local fe80::/10)',
    (ip) => expect(isPrivateIp(ip)).toBe(true)
  );

  it('allows fec0::1 as public (outside /10 — deprecated site-local, not link-local)', () => {
    expect(isPrivateIp('fec0::1')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isPlaceholderWebhook — deploy-only sentinel check
// ---------------------------------------------------------------------------

describe('isPlaceholderWebhook', () => {
  it('flags the exact display sentinel', () => {
    expect(isPlaceholderWebhook('https://example.com/webhook')).toBe(true);
  });

  it.each([
    'https://example.com/anything',
    'https://api.example.com/webhook',
    'http://example.com/webhook',
  ])('flags %s (example.com domain)', (url) =>
    expect(isPlaceholderWebhook(url)).toBe(true)
  );

  it.each([
    'https://n8n.mycompany.com/webhook/abc',
    'https://hooks.example.org/webhook',
  ])('allows real endpoint %s', (url) =>
    expect(isPlaceholderWebhook(url)).toBe(false)
  );

  it('returns false for an unparseable URL', () => {
    expect(isPlaceholderWebhook('not-a-url')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// assertPublicWebhookUrl
// ---------------------------------------------------------------------------

describe('assertPublicWebhookUrl', () => {
  beforeEach(() => {
    // Default: hostname resolves to a public IP
    mockDns('93.184.216.34', 4);
  });

  // ── Scheme enforcement ─────────────────────────────────────────────────

  it('rejects ftp:// scheme', async () => {
    await expect(assertPublicWebhookUrl('ftp://example.com/x')).rejects.toThrow(/https/i);
  });

  it('rejects javascript: scheme', async () => {
    await expect(assertPublicWebhookUrl('javascript:alert(1)')).rejects.toThrow();
  });

  it('rejects http:// to a non-localhost host (not dev-exempt)', async () => {
    await expect(assertPublicWebhookUrl('http://example.com/x')).rejects.toThrow(/https/i);
  });

  // ── Literal private IPs (no DNS lookup needed) ─────────────────────────

  it('rejects 169.254.169.254 (IMDS) without DNS lookup', async () => {
    await expect(
      assertPublicWebhookUrl('https://169.254.169.254/latest/meta-data')
    ).rejects.toThrow(/private/i);
  });

  it('rejects 10.0.0.1 without DNS lookup', async () => {
    await expect(assertPublicWebhookUrl('https://10.0.0.1/hook')).rejects.toThrow(/private/i);
  });

  it('rejects bracketed IPv6 ::1 in URL', async () => {
    // new URL('https://[::1]/x').hostname === '::1' (no brackets)
    await expect(assertPublicWebhookUrl('https://[::1]/x')).rejects.toThrow(/private/i);
  });

  it('rejects IPv4-mapped v6 literal ::ffff:10.0.0.1', async () => {
    await expect(
      assertPublicWebhookUrl('https://[::ffff:10.0.0.1]/hook')
    ).rejects.toThrow(/private/i);
  });

  // ── DNS-resolved hostnames ─────────────────────────────────────────────

  it('rejects a hostname resolving to a private IP (mocked)', async () => {
    mockDns('10.0.0.5', 4);
    await expect(
      assertPublicWebhookUrl('https://rebind.internal.test/hook')
    ).rejects.toThrow(/private/i);
  });

  it('rejects a hostname resolving to a single private IPv6 (TG-003)', async () => {
    mockDns('fe90::1', 6);
    await expect(
      assertPublicWebhookUrl('https://v6-linklocal.example.com/hook')
    ).rejects.toThrow(/private/i);
  });

  it('rejects when ANY resolved address is private (public + private mix)', async () => {
    // Even if one address is public, the presence of a private one must block
    mockDnsMulti([
      { address: '93.184.216.34', family: 4 },
      { address: '10.0.0.5', family: 4 },
    ]);
    await expect(
      assertPublicWebhookUrl('https://mixed-resolution.example.com/hook')
    ).rejects.toThrow(/private/i);
  });

  it('rejects https://localhost in production (resolves to 127.0.0.1 → private)', async () => {
    const prev = process.env.NODE_ENV;
    (process.env as Record<string, string>).NODE_ENV = 'production';
    // In production, localhost is NOT dev-exempt, goes through DNS lookup
    mockDns('127.0.0.1', 4);
    try {
      await expect(
        assertPublicWebhookUrl('https://localhost/webhook/test')
      ).rejects.toThrow(/private/i);
    } finally {
      (process.env as Record<string, string>).NODE_ENV = prev;
    }
  });

  // ── localhost dev exemption ────────────────────────────────────────────

  it('allows http://localhost in development', async () => {
    const prev = process.env.NODE_ENV;
    (process.env as Record<string, string>).NODE_ENV = 'development';
    try {
      await expect(
        assertPublicWebhookUrl('http://localhost:5678/webhook/test')
      ).resolves.toBeInstanceOf(URL);
    } finally {
      (process.env as Record<string, string>).NODE_ENV = prev;
    }
  });

  it('allows http://127.0.0.1 in development', async () => {
    const prev = process.env.NODE_ENV;
    (process.env as Record<string, string>).NODE_ENV = 'development';
    try {
      await expect(
        assertPublicWebhookUrl('http://127.0.0.1:5678/webhook/test')
      ).resolves.toBeInstanceOf(URL);
    } finally {
      (process.env as Record<string, string>).NODE_ENV = prev;
    }
  });

  it('rejects http://localhost in production', async () => {
    const prev = process.env.NODE_ENV;
    (process.env as Record<string, string>).NODE_ENV = 'production';
    try {
      await expect(
        assertPublicWebhookUrl('http://localhost:5678/webhook/test')
      ).rejects.toThrow(/https/i);
    } finally {
      (process.env as Record<string, string>).NODE_ENV = prev;
    }
  });

  // ── Happy path ─────────────────────────────────────────────────────────

  it('allows a normal public https URL (mocked DNS to 93.184.216.34)', async () => {
    mockDns('93.184.216.34', 4);
    await expect(
      assertPublicWebhookUrl('https://n8n.example.com/webhook/abc')
    ).resolves.toBeInstanceOf(URL);
  });

  it('allows a public https URL with IPv6 DNS result', async () => {
    mockDnsMulti([
      { address: '2606:4700:4700::1111', family: 6 },
      { address: '93.184.216.34', family: 4 },
    ]);
    await expect(
      assertPublicWebhookUrl('https://n8n.example.com/webhook/abc')
    ).resolves.toBeInstanceOf(URL);
  });

  it('returns a URL object with the correct href', async () => {
    mockDns('93.184.216.34', 4);
    const result = await assertPublicWebhookUrl('https://n8n.example.com/webhook/abc');
    expect(result.href).toBe('https://n8n.example.com/webhook/abc');
  });

  // ── Numeric-IP encodings (decimal/hex loopback) ────────────────────────
  // Node >= 20 normalises `https://2130706433/` and `https://0x7f000001/` to
  // hostname '127.0.0.1' (isIP === 4), so these are caught by the IP-literal
  // private check WITHOUT a DNS lookup. Hermetic — no network involved.
  it('rejects https://2130706433/ (decimal-encoded loopback)', async () => {
    await expect(
      assertPublicWebhookUrl('https://2130706433/')
    ).rejects.toThrow(/private/i);
  });

  it('rejects https://0x7f000001/ (hex-encoded loopback)', async () => {
    await expect(
      assertPublicWebhookUrl('https://0x7f000001/')
    ).rejects.toThrow(/private/i);
  });

  // ── Malformed input ────────────────────────────────────────────────────

  it('rejects a completely invalid URL string', async () => {
    await expect(assertPublicWebhookUrl('not-a-url')).rejects.toThrow(/valid URL/i);
  });
});
