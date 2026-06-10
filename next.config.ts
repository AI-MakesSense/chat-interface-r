import {withSentryConfig} from "@sentry/nextjs";
import type { NextConfig } from "next";

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
  "frame-ancestors 'self' https: http://localhost:*",
  "script-src 'self' 'unsafe-inline' https://cdn.platform.openai.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https: wss:",
  "frame-src 'self' https:",
].join("; ");

/**
 * Security headers for application pages.
 *
 * Excluded paths (no CSP / Referrer-Policy applied):
 *   /w/          – widget JS bundle serving AND the public config endpoint at
 *                  /api/w/<key>/config (which also matches this prefix) — the config
 *                  route correctly emits CORS '*' from its handler, not the strict CSP
 *   /api/widget/ – legacy widget API
 *   /api/embed/  – embed bundle serving
 *   /widget/     – content-hashed bundles (/widget/v/*) and the stable loader.js
 *   /chat/       – fullpage widget iframe page (must be embeddable cross-origin)
 *   /chatkit/    – ChatKit widget iframe page
 */
const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply security headers to all routes EXCEPT widget-serving and embeddable paths
        source: "/((?!w/|api/widget/|api/embed/|chat/|chatkit/|widget/).*)",
        headers: securityHeaders,
      },
      {
        // Content-hashed widget bundles never change for a given URL — cache forever.
        source: "/widget/v/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          { key: "Access-Control-Allow-Origin", value: "*" },
        ],
      },
      {
        // Stable loader URL — short cache so loader fixes propagate quickly.
        source: "/widget/loader.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=300, stale-while-revalidate=3600" },
          { key: "Access-Control-Allow-Origin", value: "*" },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "polingerai",

  project: "chat-interfacer",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true
});
