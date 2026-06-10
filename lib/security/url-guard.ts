/**
 * SSRF guard for user-supplied webhook URLs.
 * Enforces: https only (http://localhost allowed outside production), public IPs only.
 *
 * Redirect-following SSRF (a public webhook 3xx-bouncing the server to a private
 * IP) is blocked at the relay: it fetches with `redirect: 'manual'` and rejects
 * any 3xx / opaque-redirect response instead of following the Location (Task 13).
 *
 * Residual risk (accepted): DNS rebinding between validation and fetch — mitigated by
 * the relay's fetch timeout (Task 13). Full mitigation needs fetch-by-pinned-IP which
 * n8n's TLS setup doesn't support cleanly.
 *
 * Known bypass residuals (not fixed here — document for Task 13):
 * - Decimal/octal/hex IP encodings (e.g. http://2130706433/ = 127.0.0.1, http://0x7f000001/)
 *   are NOT caught because new URL() normalises them to dotted-decimal in Chrome/Node >= 20
 *   but NOT in older Node 18 (URL spec bug). isIP() on the non-normalised string will fail
 *   (isIP returns 0) so the hostname goes through DNS lookup — where the OS resolver will
 *   resolve the numeric literal to the loopback address, and isPrivateIp will catch it.
 *   Effectively caught in Node 18 via the DNS path, but coverage is indirect.
 * - Internationalised domain names (IDN) that look like public but resolve to private —
 *   caught by the DNS lookup step just like any other hostname.
 * - DNS rebinding after validation — not fixed (accepted residual, see above).
 */
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

const PRIVATE_V4: RegExp[] = [
  /^0\./,                                          // 0.0.0.0/8
  /^10\./,                                         // 10.0.0.0/8
  /^127\./,                                        // 127.0.0.0/8 (loopback)
  /^169\.254\./,                                   // 169.254.0.0/16 (link-local / IMDS)
  /^172\.(1[6-9]|2\d|3[01])\./,                   // 172.16.0.0/12 (private)
  /^192\.168\./,                                   // 192.168.0.0/16 (private)
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,    // 100.64.0.0/10 (CGNAT)
];

/**
 * Returns true if the given IP address string (v4 or v6) is in a private/reserved range.
 * Accepts bare dotted-decimal v4, bare v6 (no brackets), and v4-mapped v6 (::ffff:a.b.c.d).
 */
export function isPrivateIp(ip: string): boolean {
  const version = isIP(ip);

  if (version === 4) {
    return PRIVATE_V4.some((re) => re.test(ip));
  }

  if (version === 6) {
    const lower = ip.toLowerCase();

    // Loopback (::1) and unspecified (::)
    if (lower === '::1' || lower === '::') return true;

    // Unique-local fc00::/7 (fc and fd prefixes)
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true;

    // Link-local fe80::/10 (first 10 bits 1111111010 → fe80:: through febf::)
    const head = parseInt(lower.split(':')[0] || '', 16);
    if (!isNaN(head) && (head & 0xffc0) === 0xfe80) return true;

    // v4-mapped ::ffff:x.x.x.x — strip prefix and recurse.
    // Only the standard 2-hextet (::ffff:a00:1) and dotted (::ffff:10.0.0.1)
    // forms are treated as v4-mapped; any other ::ffff: shape falls through and
    // is handled as an ordinary IPv6 address (correctly classified public).
    if (lower.startsWith('::ffff:')) {
      const v4part = lower.slice('::ffff:'.length);
      // v4part may be dotted-decimal (::ffff:10.0.0.1) or compressed hex (::ffff:a00:1)
      if (isIP(v4part) === 4) return isPrivateIp(v4part);
      // Hex form: convert to dotted-decimal
      const hexMatch = v4part.match(/^([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
      if (hexMatch) {
        const hi = parseInt(hexMatch[1], 16);
        const lo = parseInt(hexMatch[2], 16);
        const dotted = `${(hi >> 8) & 0xff}.${hi & 0xff}.${(lo >> 8) & 0xff}.${lo & 0xff}`;
        return isPrivateIp(dotted);
      }
    }

    return false;
  }

  // isIP returned 0 — not a recognised IP literal; caller should DNS-resolve
  return false;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Strips IPv6 brackets from a URL hostname.
 * new URL('https://[::1]/x').hostname === '[::1]' in Node — not '::1'.
 */
function stripBrackets(hostname: string): string {
  if (hostname.startsWith('[') && hostname.endsWith(']')) {
    return hostname.slice(1, -1);
  }
  return hostname;
}

/**
 * Returns true when the URL targets localhost and we're NOT in production.
 * The relay explicitly allows http://localhost for local n8n development.
 */
function isDevLocalhost(u: URL): boolean {
  if (process.env.NODE_ENV === 'production') return false;
  const h = stripBrackets(u.hostname);
  return h === 'localhost' || h === '127.0.0.1';
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Validates that `raw` is a safe, publicly-routable webhook URL.
 *
 * Rules:
 *  1. Must be a valid URL.
 *  2. Must use https:// — except http://localhost (non-production only).
 *  3. If the hostname is an IP literal, it must not be in a private range.
 *  4. If the hostname is a name, ALL resolved addresses must be public.
 *
 * Throws an Error with a descriptive message on any violation.
 * Returns the parsed URL on success.
 */
/**
 * Returns true when `raw` is the must-replace placeholder webhook sentinel that
 * createDefaultDisplayConfig seeds ('https://example.com/webhook'), or any URL on
 * the example.com reserved domain.
 *
 * assertPublicWebhookUrl ALLOWS this URL (example.com resolves to a public IP), so
 * SSRF won't block it — but a widget must never DEPLOY pointing at the placeholder.
 * This check is used ONLY by the deploy route; SAVE/create allows it (mid-setup).
 */
export function isPlaceholderWebhook(raw: string): boolean {
  if (raw === 'https://example.com/webhook') return true;
  try {
    const host = stripBrackets(new URL(raw).hostname).toLowerCase();
    return host === 'example.com' || host.endsWith('.example.com');
  } catch {
    return false;
  }
}

export async function assertPublicWebhookUrl(raw: string): Promise<URL> {
  // 1. Parse
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error('Webhook URL is not a valid URL');
  }

  // 2. Scheme check
  const isHttps = url.protocol === 'https:';
  const isDevHttp = url.protocol === 'http:' && isDevLocalhost(url);

  if (!isHttps && !isDevHttp) {
    throw new Error('Webhook URL must use https');
  }

  // Localhost in dev — allow immediately (it won't have a public DNS record)
  if (isDevHttp) return url;

  // 3. IP literal check.
  // new URL() preserves brackets for IPv6: 'https://[::1]/x'.hostname === '[::1]'.
  // Strip brackets so isIP() and isPrivateIp() can recognise the address.
  const bareHostname = stripBrackets(url.hostname);
  if (isIP(bareHostname) !== 0) {
    if (isPrivateIp(bareHostname)) {
      throw new Error('Webhook URL resolves to a private address');
    }
    return url;
  }

  // 4. DNS lookup — every resolved address must be public
  // (https://localhost in production also goes through this path: lookup returns
  //  127.0.0.1 → private → rejected)
  // Race the resolver against a 5s timeout so a slow/hung DNS server can't pin
  // the relay handler open. Timeout = treated as rejection (fail-closed): a
  // webhook we can't resolve must not be fetched.
  const addrs = await Promise.race([
    lookup(url.hostname, { all: true }),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Webhook URL DNS resolution timed out')), 5000)
    ),
  ]);
  if (addrs.length === 0) {
    throw new Error('Webhook URL hostname did not resolve');
  }
  for (const a of addrs) {
    if (isPrivateIp(a.address)) {
      throw new Error('Webhook URL resolves to a private address');
    }
  }

  return url;
}
