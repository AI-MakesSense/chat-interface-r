import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    // Security headers for all routes
    const securityHeaders = [
      {
        // Prevent MIME type sniffing
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },
      {
        // XSS Protection (legacy browsers)
        key: 'X-XSS-Protection',
        value: '1; mode=block',
      },
      {
        // Control referrer information
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
      },
      {
        // Restrict browser features
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
      },
    ];

    // HSTS header - only in production
    if (process.env.NODE_ENV === 'production') {
      securityHeaders.push({
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains',
      });
    }

    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: [
          ...securityHeaders,
          {
            // Prevent clickjacking - default deny
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            // Content Security Policy for main application
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Required for Next.js
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https:",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
      {
        // Widget-serving endpoints need relaxed CSP for embedding
        source: '/api/widget/:license/chat-widget.js',
        headers: [
          ...securityHeaders,
          {
            // Allow embedding in any frame (widget must be embeddable)
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
          {
            // Relaxed CSP for widget JavaScript
            key: 'Content-Security-Policy',
            value: [
              "default-src 'none'",
              "script-src 'unsafe-inline'",
            ].join('; '),
          },
        ],
      },
      {
        // Widget config endpoint
        source: '/api/widget/:license/config',
        headers: [
          ...securityHeaders,
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
        ],
      },
      {
        // Embed bundle endpoint
        source: '/api/embed/bundle.js',
        headers: [
          ...securityHeaders,
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
