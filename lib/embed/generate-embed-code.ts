/**
 * Embed Code Generator
 *
 * Purpose: Generate embed codes for different widget deployment types
 *
 * Embed Types:
 * - popup: Floating chat bubble (default) - script tag
 * - inline: Embedded in container - script tag with data attributes
 * - fullpage: Full viewport chat - iframe
 * - portal: Shareable direct URL
 *
 * Uses widgetKey (16-char alphanumeric) instead of licenseKey (32-char hex)
 */

export type EmbedType = 'popup' | 'inline' | 'fullpage' | 'portal';

export interface EmbedCodeResult {
  type: EmbedType;
  title: string;
  description: string;
  code: string;
  language: 'html' | 'url';
  icon: string;
}

export interface WidgetForEmbed {
  widgetKey: string;
  name?: string;
  embedType?: EmbedType;
}

// ---------------------------------------------------------------------------
// Shared URL helpers (used by both client-side code-modal and server-side API)
// ---------------------------------------------------------------------------

/**
 * Remove trailing slash to avoid accidental double slashes in generated snippets.
 */
export function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

/**
 * Ensure a URL has a protocol prefix.
 * Vercel auto-sets VERCEL_PROJECT_PRODUCTION_URL *without* a protocol.
 */
export function ensureProtocol(url: string): string {
  return url.startsWith('http') ? url : `https://${url}`;
}

/**
 * Read the configured public URL from env vars.
 *
 * NEXT_PUBLIC_APP_URL is available both server- and client-side (embedded at
 * build time by Next.js).  VERCEL_PROJECT_PRODUCTION_URL is server-only.
 */
export function getConfiguredPublicUrl(): string | undefined {
  const envPublic = process.env.NEXT_PUBLIC_APP_URL;
  if (envPublic) return normalizeBaseUrl(envPublic);

  const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelProd) return normalizeBaseUrl(ensureProtocol(vercelProd));

  return undefined;
}

/**
 * Heuristic detection for Vercel preview hostnames.
 *
 * Preview deployments follow the pattern:
 *   <project>-<hash>-<team>.vercel.app
 * where <hash> is a 7-12 char lowercase alphanumeric string that contains
 * at least one digit (to distinguish from normal project-name dashes).
 *
 * Examples that SHOULD match (preview):
 *   chat-interface-fk7f9c83w-polingerai.vercel.app
 *   myapp-abc1234f-team.vercel.app
 *
 * Examples that should NOT match (production):
 *   chat-interface-r.vercel.app
 *   my-cool-app.vercel.app
 */
export function isLikelyVercelPreviewHostname(hostname: string): boolean {
  if (!hostname || !hostname.endsWith('.vercel.app')) {
    return false;
  }

  const subdomain = hostname.slice(0, -'.vercel.app'.length);

  // Match: project-<alphanumeric hash with at least one digit>-team
  // The hash segment is 7-12 lowercase alphanumeric chars containing ≥1 digit.
  // The digit requirement prevents false positives on names like "my-cool-app".
  return /^.+-(?=[a-z0-9]*[0-9])[a-z0-9]{7,12}-.+$/.test(subdomain);
}

/**
 * Resolve the public base URL for embed snippets (client-side).
 *
 * Priority:
 * 1) Explicit override
 * 2) If running in browser:
 *    - use configured public URL when current host is a Vercel preview hostname
 *    - otherwise use current origin
 * 3) Configured public URL (NEXT_PUBLIC_APP_URL or VERCEL_PROJECT_PRODUCTION_URL)
 * 4) localhost fallback
 */
export function resolveEmbedBaseUrl(override?: string): string {
  if (override) return normalizeBaseUrl(override);

  const configuredPublic = getConfiguredPublicUrl();

  if (typeof window !== 'undefined' && window.location?.origin) {
    if (configuredPublic && isLikelyVercelPreviewHostname(window.location.hostname)) {
      return configuredPublic;
    }
    return normalizeBaseUrl(window.location.origin);
  }

  if (configuredPublic) return configuredPublic;

  return 'http://localhost:3000';
}

/**
 * Resolve the public base URL from a server-side request.
 *
 * Priority: NEXT_PUBLIC_APP_URL → VERCEL_PROJECT_PRODUCTION_URL → request origin
 */
export function resolveEmbedBaseUrlFromRequest(requestUrl: string): string {
  return getConfiguredPublicUrl() || normalizeBaseUrl(new URL(requestUrl).origin);
}

/**
 * Generate embed code for a specific embed type
 */
export function generateEmbedCode(
  widget: WidgetForEmbed,
  type: EmbedType,
  options?: { baseUrl?: string }
): EmbedCodeResult {
  const baseUrl = resolveEmbedBaseUrl(options?.baseUrl);
  const key = widget.widgetKey;

  switch (type) {
    case 'popup':
      return {
        type: 'popup',
        title: 'Popup Widget',
        description: 'Floating chat bubble that opens a chat window. Best for websites.',
        language: 'html',
        icon: 'message-circle',
        code: `<!-- Chat Widget -->
<script src="${baseUrl}/w/${key}.js" crossorigin="anonymous" async></script>`,
      };

    case 'inline':
      return {
        type: 'inline',
        title: 'Inline Widget',
        description: 'Embedded in a container. Best for sidebars or dedicated sections.',
        language: 'html',
        icon: 'layout',
        code: `<!-- Chat Widget (Inline) -->
<div id="chat-widget" style="width: 400px; height: 600px;"></div>
<script
  src="${baseUrl}/w/${key}.js"
  crossorigin="anonymous"
  data-mode="inline"
  data-container="chat-widget"
  async
></script>`,
      };

    case 'fullpage':
      return {
        type: 'fullpage',
        title: 'Fullpage Widget',
        description: 'Full viewport chat. Use iFrame to embed in other sites.',
        language: 'html',
        icon: 'maximize',
        code: `<!-- Chat Widget (Fullpage) -->
<iframe
  src="${baseUrl}/chat/${key}"
  style="width: 100%; height: 100vh; border: none;"
  allow="microphone; clipboard-write"
  title="Chat"
></iframe>`,
      };

    case 'portal':
      return {
        type: 'portal',
        title: 'Shareable Link',
        description: 'Direct URL to chat. Share via email, QR code, or links.',
        language: 'url',
        icon: 'link',
        code: `${baseUrl}/chat/${key}`,
      };
  }
}

/**
 * Generate all embed code variants for a widget
 */
export function generateAllEmbedCodes(
  widget: WidgetForEmbed,
  options?: { baseUrl?: string }
): EmbedCodeResult[] {
  const types: EmbedType[] = ['popup', 'inline', 'fullpage', 'portal'];
  return types.map(type => generateEmbedCode(widget, type, options));
}

/**
 * Get the primary embed code for a widget based on its configured embed type
 */
export function getPrimaryEmbedCode(
  widget: WidgetForEmbed,
  options?: { baseUrl?: string }
): EmbedCodeResult {
  const type = widget.embedType || 'popup';
  return generateEmbedCode(widget, type, options);
}

/**
 * Generate widget key (16-char alphanumeric)
 * Cryptographically secure random string
 */
export function generateWidgetKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  // Use crypto API if available (browser or Node.js)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(array[i] % chars.length);
    }
  } else {
    // Fallback for environments without crypto
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }

  return result;
}

/**
 * Validate a widget key format
 */
export function isValidWidgetKey(key: string): boolean {
  if (!key || typeof key !== 'string') return false;
  if (key.length !== 16) return false;
  return /^[A-Za-z0-9]{16}$/.test(key);
}

/**
 * Get embed type display info for UI
 */
export function getEmbedTypeInfo(type: EmbedType): {
  label: string;
  shortDescription: string;
  tier: 'free' | 'basic' | 'pro' | 'agency';
} {
  switch (type) {
    case 'popup':
      return {
        label: 'Popup',
        shortDescription: 'Floating chat bubble',
        tier: 'free',
      };
    case 'inline':
      return {
        label: 'Inline',
        shortDescription: 'Embedded in page',
        tier: 'basic',
      };
    case 'fullpage':
      return {
        label: 'Fullpage',
        shortDescription: 'Full viewport',
        tier: 'pro',
      };
    case 'portal':
      return {
        label: 'Portal',
        shortDescription: 'Shareable link',
        tier: 'basic',
      };
  }
}

/**
 * All available embed types with their info
 */
export const EMBED_TYPES: EmbedType[] = ['popup', 'inline', 'fullpage', 'portal'];
