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
import { licenses, widgets } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { logActivity } from '@/lib/db/admin-queries';
import {
  createWidget,
  createWidgetV2,
  getActiveWidgetCountForUser,
  getWidgetsPaginated,
  getWidgetsPaginatedV2,
  getUserById,
} from '@/lib/db/queries';
import { createDefaultConfig } from '@/lib/config/defaults';
import { getSchemaForKind, normalizeTier } from '@/lib/widget-config/schema';
import { migrateConfig } from '@/lib/widget-config/migrate';
import { TIER_LIMITS, canCreateWidget, normalizeUserTier } from '@/lib/license/tiers';
import { deepMerge, forceN8nProviderConfig } from '@/lib/utils/config-helpers';
import { CHATKIT_SERVER_ENABLED } from '@/lib/feature-flags';
import { generateEmbedCode, extractInlineDimensions, resolveEmbedBaseUrlFromRequest, type EmbedType as GeneratedEmbedType } from '@/lib/embed';
import { assertPublicWebhookUrl, isPlaceholderWebhook } from '@/lib/security/url-guard';
import { z } from 'zod';

/**
 * SAVE-time SSRF defense-in-depth: validate a configured webhook URL when one is
 * present. The display sentinel ('https://example.com/webhook') is ALLOWED here —
 * the user may be mid-setup. The placeholder is rejected only at DEPLOY time.
 * Returns a 400 NextResponse on rejection, or null when the URL is acceptable
 * (or absent).
 */
async function rejectUnsafeWebhook(config: any): Promise<NextResponse | null> {
  const webhookUrl = config?.connection?.webhookUrl;
  if (!webhookUrl || typeof webhookUrl !== 'string') return null;
  // Allow the placeholder at save/create time (deploy enforces a real URL).
  if (isPlaceholderWebhook(webhookUrl)) return null;
  try {
    await assertPublicWebhookUrl(webhookUrl);
    return null;
  } catch (err) {
    return NextResponse.json(
      {
        error: 'Invalid widget configuration',
        details: {
          fieldErrors: { 'connection.webhookUrl': [(err as Error).message] },
        },
      },
      { status: 400 }
    );
  }
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Apply the read-boundary transformations to a raw stored widget config.
 * Chat-kind configs are migrated to canonical schemaVersion 2 via migrateConfig.
 * When ChatKit is disabled, the provider is forced to n8n.
 * Display-kind configs pass through unchanged.
 */
function normalizeWidgetConfig(rawConfig: any, kind: string): any {
  const migratedConfig = kind === 'chat' ? migrateConfig(rawConfig) : rawConfig;
  return !CHATKIT_SERVER_ENABLED ? forceN8nProviderConfig(migratedConfig) : migratedConfig;
}

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
  kind: z.enum(['chat', 'display']).default('chat'),
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
    const { licenseId, name, config: userConfig, embedType, allowedDomains, widgetType: requestWidgetType, kind } = CreateWidgetSchema.parse(body);

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

    // Get tier from user (Schema v2.0) or 'free' default.
    // normalizeUserTier handles null/unknown → 'free'.
    const userTier = normalizeUserTier(user.tier);

    // 4. Determine active tier and check quota.
    // Both legacy and v2 paths count widgets per-user (not per-license) so the
    // limit reflects the user's actual usage across all widgets. The legacy
    // getActiveWidgetCount(licenseId) over-counted — it already resolved to the
    // user total anyway, but its name was misleading. We now call
    // getActiveWidgetCountForUser(userId) directly in both branches.
    let tier = userTier;
    let license: any = null;

    if (licenseId) {
      // Legacy path: licenseId provided — verify ownership, carry license for
      // response metadata. Tier comes from users.tier (v2 identity model).
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
      // Tier is always from users.tier; licenses.tier is billing metadata only.
    }

    // Count per-user (fix Task-8 over-count: getActiveWidgetCount resolved via
    // license → userId anyway, so semantics are the same, but using
    // getActiveWidgetCountForUser is explicit and correct for both paths).
    const activeCount = await getActiveWidgetCountForUser(authUser.sub);

    // Check widget limit via the central entitlements module.
    if (!canCreateWidget(tier, activeCount)) {
      const limit = TIER_LIMITS[tier].maxWidgets;
      // Render unbounded tiers (pro/agency) as "unlimited" instead of "Infinity".
      const limitLabel = Number.isFinite(limit) ? `max: ${limit}` : 'unlimited';
      return NextResponse.json(
        { error: `Widget limit exceeded for ${tier} tier (${limitLabel})` },
        { status: 403 }
      );
    }

    // 5. Generate config (use defaults if not provided, merge if provided)
    // For chat widgets: start from migrated defaults so the stored object is
    // always canonical (schemaVersion 2) regardless of what createDefaultConfig
    // returns. For display widgets: pass through as-is (migrateConfig is
    // chat-only).
    let finalConfig;
    if (userConfig) {
      if (kind === 'chat') {
        const defaults = migrateConfig(createDefaultConfig(tier as any, kind));
        finalConfig = deepMerge(defaults, userConfig);
      } else {
        const defaults = createDefaultConfig(tier as any, kind);
        finalConfig = deepMerge(defaults, userConfig);
      }
    } else {
      finalConfig = kind === 'chat'
        ? migrateConfig(createDefaultConfig(tier as any, kind))
        : createDefaultConfig(tier as any, kind);
    }

    // 6. Validate final config against tier restrictions using canonical schema.
    // brandingRequired = true when the tier does not allow branding removal.
    // normalizeTier maps 'free'/'garbage' → 'basic' for the config-schema layer
    // (LicenseTier); TIER_LIMITS drives the entitlement decision here.
    const normalizedTier = normalizeTier(tier);
    const brandingRequired = !TIER_LIMITS[normalizeUserTier(tier)].brandingRemovable;
    const configSchema = getSchemaForKind(kind, normalizedTier, brandingRequired);
    const parsed = configSchema.safeParse(finalConfig);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid widget configuration', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    // Use the canonical validated result — includes schemaVersion: 2 and all defaults
    let cleanedConfig: any = parsed.data;
    if (!CHATKIT_SERVER_ENABLED) {
      cleanedConfig = forceN8nProviderConfig(cleanedConfig);
    }

    // 7. SSRF defense-in-depth: reject a private/non-https webhook at save time
    // (placeholder sentinel allowed — see rejectUnsafeWebhook).
    const webhookRejection = await rejectUnsafeWebhook(cleanedConfig);
    if (webhookRejection) return webhookRejection;

    // 8. Determine widget type
    const finalWidgetType = CHATKIT_SERVER_ENABLED
      ? (requestWidgetType || (cleanedConfig.connection?.provider === 'chatkit' ? 'chatkit' : 'n8n'))
      : 'n8n';

    // 9. Create widget using appropriate method
    let widget;
    if (licenseId && license) {
      // Legacy path: licenseId was provided but widgets no longer carry licenseId —
      // create via userId directly. Task 9 will remove this branch entirely.
      widget = await createWidget({
        userId: authUser.sub,
        name,
        config: cleanedConfig,
        widgetType: finalWidgetType,
        kind,
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
        kind,
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
          // READ boundary: normalizeWidgetConfig handles migrate + chatkit-flag
          const normalizedConfig = normalizeWidgetConfig((w as any).config, (w as any).kind);
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
          // READ boundary: normalizeWidgetConfig handles migrate + chatkit-flag
          const normalizedConfig = normalizeWidgetConfig((w as any).config, (w as any).kind);
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
  // Canonical v2 stores inline dimensions at config.theme.size.*; extractInlineDimensions
  // reads the canonical path and falls back to the legacy flat path.
  const opts = { baseUrl, ...extractInlineDimensions(config) };
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
