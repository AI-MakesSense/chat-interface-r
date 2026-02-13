/**
 * Widget Management API Routes
 *
 * Purpose: Handles widget creation and listing operations
 * Responsibility: CRUD operations for widgets with authentication and authorization
 *
 * Schema v2.0: Supports both legacy (license-based) and new (user-direct) widget creation
 *
 * Constraints:
 * - Enforces widget limits per tier (free: 3, basic: 5, pro: unlimited, agency: unlimited)
 * - Validates widget configurations against tier restrictions
 * - Requires authentication for all operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guard';
import { db } from '@/lib/db/client';
import { licenses, widgets, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { logActivity } from '@/lib/db/admin-queries';
import {
  createWidget,
  createWidgetV2,
  getActiveWidgetCount,
  getActiveWidgetCountForUser,
  getWidgetsPaginated,
  getWidgetsPaginatedV2,
  getUserById,
} from '@/lib/db/queries';
import { createDefaultConfig } from '@/lib/config/defaults';
import { createWidgetConfigSchema } from '@/lib/validation/widget-schema';
import { deepMerge, forceN8nProviderConfig, stripLegacyConfigProperties } from '@/lib/utils/config-helpers';
import { CHATKIT_SERVER_ENABLED } from '@/lib/feature-flags';
import { generateEmbedCode, resolveEmbedBaseUrlFromRequest, type EmbedType as GeneratedEmbedType } from '@/lib/embed';
import { z } from 'zod';

// =============================================================================
// Tier Features Configuration (Schema v2.0)
// =============================================================================

const TIER_LIMITS = {
  free: { widgetLimit: 3 },
  basic: { widgetLimit: 5 },
  pro: { widgetLimit: -1 }, // Unlimited
  agency: { widgetLimit: -1 }, // Unlimited
} as const;

type SubscriptionTier = keyof typeof TIER_LIMITS;

// =============================================================================
// Request Validation Schemas
// =============================================================================

const CreateWidgetSchema = z.object({
  // Schema v2.0: licenseId is now optional
  licenseId: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  config: z.any().optional(),
  // Schema v2.0: New fields
  embedType: z.enum(['popup', 'inline', 'fullpage', 'portal']).optional(),
  allowedDomains: z.array(z.string()).optional(),
  widgetType: z.enum(['n8n', 'chatkit']).optional(),
});

// =============================================================================
// POST /api/widgets - Create Widget
// Schema v2.0: Supports both legacy (licenseId) and new (user-direct) creation
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const authUser = await requireAuth(request);

    // 2. Parse and validate request body
    const body = await request.json();
    const { licenseId, name, config: userConfig, embedType, allowedDomains, widgetType: requestWidgetType } = CreateWidgetSchema.parse(body);

    // Force n8n-only mode when ChatKit is disabled.
    if (!CHATKIT_SERVER_ENABLED) {
      const requestedProvider = (userConfig as any)?.connection?.provider;
      if (requestWidgetType === 'chatkit' || requestedProvider === 'chatkit') {
        return NextResponse.json(
          { error: 'ChatKit provider is disabled' },
          { status: 400 }
        );
      }
    }

    // 3. Get user data for tier information
    const user = await getUserById(authUser.sub);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get tier from user (Schema v2.0) or 'free' default
    const userTier = (user.tier || 'free') as SubscriptionTier;

    // 4. Determine widget limit and check quota
    let tier: SubscriptionTier;
    let limit: number;
    let activeCount: number;
    let license: any = null;

    if (licenseId) {
      // Legacy path: Use license-based limits
      const [foundLicense] = await db
        .select()
        .from(licenses)
        .where(eq(licenses.id, licenseId))
        .limit(1);

      if (!foundLicense) {
        return NextResponse.json({ error: 'License not found' }, { status: 404 });
      }

      if (foundLicense.userId !== authUser.sub) {
        return NextResponse.json({ error: 'You do not own this license' }, { status: 403 });
      }

      license = foundLicense;
      tier = license.tier as SubscriptionTier;
      limit = license.widgetLimit;
      activeCount = await getActiveWidgetCount(licenseId);
    } else {
      // Schema v2.0 path: Use user-level tier limits
      tier = userTier;
      limit = TIER_LIMITS[tier].widgetLimit;
      activeCount = await getActiveWidgetCountForUser(authUser.sub);
    }

    // Check widget limit
    if (limit !== -1 && activeCount >= limit) {
      return NextResponse.json(
        { error: `Widget limit exceeded for ${tier} tier (max: ${limit})` },
        { status: 403 }
      );
    }

    // 5. Generate config (use defaults if not provided, merge if provided)
    let finalConfig;
    if (userConfig) {
      // Deep merge user config with defaults
      const defaults = createDefaultConfig(tier as any);
      finalConfig = deepMerge(defaults, userConfig);
    } else {
      finalConfig = createDefaultConfig(tier as any);
    }

    // 6. Validate final config against tier restrictions
    const configSchema = createWidgetConfigSchema(tier as any, true);
    configSchema.parse(finalConfig);

    // 7. Clean legacy properties that might conflict with new structure
    let cleanedConfig = stripLegacyConfigProperties(finalConfig);
    if (!CHATKIT_SERVER_ENABLED) {
      cleanedConfig = forceN8nProviderConfig(cleanedConfig);
    }

    // 8. Determine widget type
    const finalWidgetType = CHATKIT_SERVER_ENABLED
      ? (requestWidgetType || (cleanedConfig.connection?.provider === 'chatkit' ? 'chatkit' : 'n8n'))
      : 'n8n';

    // 9. Create widget using appropriate method
    let widget;
    if (licenseId && license) {
      // Legacy path: Create with licenseId
      widget = await createWidget({
        licenseId,
        name,
        config: cleanedConfig,
        widgetType: finalWidgetType,
      });
    } else {
      // Schema v2.0 path: Create with userId directly
      widget = await createWidgetV2({
        userId: authUser.sub,
        name,
        config: cleanedConfig,
        embedType: embedType || 'popup',
        allowedDomains: allowedDomains || undefined,
        widgetType: finalWidgetType,
      });
    }

    // 10. Generate embed codes for Schema v2.0 widgets
    const baseUrl = resolveEmbedBaseUrlFromRequest(request.url);
    const widgetKey = (widget as any).widgetKey;
    const embedCodes = widgetKey ? generateEmbedCodes(baseUrl, widgetKey, (widget as any).embedType || 'popup', (widget as any).config) : null;

    // Log activity
    void logActivity(authUser.sub, 'widget_created', { widgetId: widget.id, name: widget.name });

    // 11. Return 201 Created with widget data
    return NextResponse.json({
      widget: {
        ...widget,
        // Legacy support
        licenseKey: license?.licenseKey || null,
        // Schema v2.0 embed codes
        ...(embedCodes && { embedCodes }),
      }
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: (error as any).errors }, { status: 400 });
    }

    // Handle auth errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage === 'Authentication required' || errorMessage === 'Invalid or expired token') {
      return NextResponse.json({ error: errorMessage }, { status: 401 });
    }

    // Log unexpected errors
    console.error('Widget creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// =============================================================================
// GET /api/widgets - List Widgets (Paginated)
// Schema v2.0: Returns widgets with embedType and embedCodes
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const authUser = await requireAuth(request);

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const licenseId = searchParams.get('licenseId') || undefined;
    const embedType = searchParams.get('embedType') || undefined;
    const includeDeleted = searchParams.get('includeDeleted') === 'true';
    const useLegacy = searchParams.get('legacy') === 'true'; // Force legacy query

    // Parse pagination with defaults for invalid values
    let page = parseInt(searchParams.get('page') || '1', 10);
    let limit = parseInt(searchParams.get('limit') || '20', 10);

    // Default to page 1 if invalid
    if (isNaN(page) || page < 1) {
      page = 1;
    }

    // Validate and constrain limit
    if (isNaN(limit) || limit < 1) {
      limit = 20;
    } else if (limit > 100) {
      limit = 100;
    }

    // 3. If licenseId filter provided, verify ownership (legacy support)
    if (licenseId) {
      const [license] = await db
        .select()
        .from(licenses)
        .where(eq(licenses.id, licenseId))
        .limit(1);

      if (!license) {
        return NextResponse.json({ error: 'License not found' }, { status: 404 });
      }

      if (license.userId !== authUser.sub) {
        return NextResponse.json({ error: 'You do not own this license' }, { status: 403 });
      }
    }

    // 4. Get paginated widgets for the user
    const baseUrl = resolveEmbedBaseUrlFromRequest(request.url);

    // Use legacy query if licenseId provided or legacy flag set
    if (licenseId || useLegacy) {
      const result = await getWidgetsPaginated(authUser.sub, {
        page,
        limit,
        licenseId,
        includeDeleted,
      });

      // 5. Build pagination metadata
      const totalPages = Math.ceil(result.total / limit);

      // 6. Return 200 OK with widgets and pagination
      return NextResponse.json({
        widgets: result.widgets.map(w => {
          const widgetKey = (w as any).widgetKey;
          const widgetEmbedType = (w as any).embedType || 'popup';
          const normalizedConfig = !CHATKIT_SERVER_ENABLED
            ? forceN8nProviderConfig((w as any).config)
            : (w as any).config;
          return {
            ...w,
            config: normalizedConfig,
            widgetType: !CHATKIT_SERVER_ENABLED ? 'n8n' : (w as any).widgetType,
            licenseKey: (w as any).licenseKey || w.license?.licenseKey,
            // Compute isDeployed from deployedAt
            isDeployed: !!(w as any).deployedAt,
            // Schema v2.0: Add embed codes if widgetKey exists
            ...(widgetKey && { embedCodes: generateEmbedCodes(baseUrl, widgetKey, widgetEmbedType, normalizedConfig) }),
          };
        }),
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages,
        },
      });
    } else {
      // Schema v2.0: Direct user query
      const result = await getWidgetsPaginatedV2(authUser.sub, {
        page,
        limit,
        includeDeleted,
        embedType,
      });

      // 5. Build pagination metadata
      const totalPages = Math.ceil(result.total / limit);

      // 6. Return 200 OK with widgets and pagination
      return NextResponse.json({
        widgets: result.widgets.map(w => {
          const widgetKey = (w as any).widgetKey;
          const widgetEmbedType = (w as any).embedType || 'popup';
          const normalizedConfig = !CHATKIT_SERVER_ENABLED
            ? forceN8nProviderConfig((w as any).config)
            : (w as any).config;
          return {
            ...w,
            config: normalizedConfig,
            widgetType: !CHATKIT_SERVER_ENABLED ? 'n8n' : (w as any).widgetType,
            // Compute isDeployed from deployedAt
            isDeployed: !!(w as any).deployedAt,
            // Schema v2.0: Add embed codes if widgetKey exists
            ...(widgetKey && { embedCodes: generateEmbedCodes(baseUrl, widgetKey, widgetEmbedType, normalizedConfig) }),
          };
        }),
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages,
        },
      });
    }

  } catch (error) {
    // Handle auth errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage === 'Authentication required' || errorMessage === 'Invalid or expired token') {
      return NextResponse.json({ error: errorMessage }, { status: 401 });
    }

    // Log unexpected errors
    console.error('Widget listing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Generate embed codes for all embed types (Schema v2.0)
 * Returns an object with code snippets for each embed type
 */
function generateEmbedCodes(baseUrl: string, widgetKey: string, primaryEmbedType: string, config?: any) {
  const widget = { widgetKey };
  const validTypes: GeneratedEmbedType[] = ['popup', 'inline', 'fullpage', 'portal'];
  const normalizedPrimary = validTypes.includes(primaryEmbedType as GeneratedEmbedType)
    ? (primaryEmbedType as GeneratedEmbedType)
    : 'popup';
  const opts = { baseUrl, inlineWidth: config?.inlineWidth, inlineHeight: config?.inlineHeight };
  const popup = generateEmbedCode(widget, 'popup', opts).code;
  const inline = generateEmbedCode(widget, 'inline', opts).code;
  const fullpage = generateEmbedCode(widget, 'fullpage', opts).code;
  const portal = generateEmbedCode(widget, 'portal', opts).code;

  return {
    primary: normalizedPrimary,
    popup,
    inline,
    fullpage,
    portal,
  };
}
