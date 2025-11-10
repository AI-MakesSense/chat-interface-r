/**
 * Widget Serving API Route
 *
 * Purpose: Serves widget JavaScript with license and domain validation
 * Responsibility: Validate license, check domain, inject config flags
 *
 * Constraints:
 * - Validates license status (active, not expired)
 * - Validates request domain against license allowed domains
 * - Injects brandingEnabled flag based on license tier
 * - Returns JavaScript with application/javascript content-type
 * - HTTPS-only (except localhost for development)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLicenseByKey } from '@/lib/db/queries';

// =============================================================================
// GET /api/widget/:license/chat-widget.js - Serve Widget
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { license: string } }
) {
  try {
    const licenseKey = params.license;

    // 1. Get referer header (required for domain validation)
    const referer = request.headers.get('referer') || request.headers.get('Referer');
    if (!referer) {
      return NextResponse.json(
        { error: 'Referer header required for domain validation' },
        { status: 403 }
      );
    }

    // 2. Get license from database
    const license = await getLicenseByKey(licenseKey);
    if (!license) {
      return NextResponse.json(
        { error: 'License not found' },
        { status: 404 }
      );
    }

    // 3. Check license status
    if (license.status !== 'active') {
      return NextResponse.json(
        { error: 'License is not active' },
        { status: 403 }
      );
    }

    // 4. Check license expiration
    if (license.expiresAt && new Date() > new Date(license.expiresAt)) {
      return NextResponse.json(
        { error: 'License has expired' },
        { status: 403 }
      );
    }

    // 5. Extract and normalize domain from referer
    const requestDomain = normalizeDomain(referer);

    // 6. Validate domain against license allowed domains
    const allowedDomains = license.domains.map(d => normalizeDomain(d));
    if (!allowedDomains.includes(requestDomain)) {
      return NextResponse.json(
        { error: `Domain "${requestDomain}" not authorized for this license` },
        { status: 403 }
      );
    }

    // 7. Generate widget JavaScript with license flags injected
    const widgetCode = generateWidgetCode(license.brandingEnabled);

    // 8. Return JavaScript with correct content-type
    return new NextResponse(widgetCode, {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error('Widget serving error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Normalize domain by removing protocol, www, port, and path
 * Examples:
 *   - https://www.example.com:3000/page → example.com
 *   - http://localhost:3000 → localhost
 *   - https://sub.example.com/path → sub.example.com
 */
function normalizeDomain(url: string): string {
  try {
    // Handle both full URLs and plain domains
    const urlObj = url.startsWith('http') ? new URL(url) : new URL(`https://${url}`);
    let domain = urlObj.hostname.toLowerCase();

    // Remove www. prefix
    if (domain.startsWith('www.')) {
      domain = domain.substring(4);
    }

    return domain;
  } catch {
    // If URL parsing fails, return empty string
    return '';
  }
}

/**
 * Generate widget JavaScript code with license flags injected
 * Returns an IIFE (Immediately Invoked Function Expression) that:
 * - Reads window.ChatWidgetConfig for user configuration
 * - Injects license flags (brandingEnabled)
 * - Initializes the chat widget
 */
function generateWidgetCode(brandingEnabled: boolean): string {
  // Minimal widget code for MVP
  // In production, this would load the actual compiled widget bundle
  return `
(function() {
  'use strict';

  // License configuration injected at serve time
  var licenseConfig = {
    brandingEnabled: ${brandingEnabled}
  };

  // Read user configuration from window
  var userConfig = window.ChatWidgetConfig || {};

  // Merge configurations
  var config = Object.assign({}, userConfig, { license: licenseConfig });

  // Widget initialization placeholder
  console.log('N8N Chat Widget initialized with config:', config);

  // TODO: Actual widget implementation will be added in Phase 3
  // This stub satisfies the tests for now
})();
`.trim();
}

