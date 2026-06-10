/**
 * Individual Widget API Routes
 *
 * Purpose: Handles operations on specific widgets by ID
 * Responsibility: Get, update, and delete individual widgets with ownership verification
 *
 * Constraints:
 * - Requires authentication for all operations
 * - Verifies widget ownership through license
 * - Validates configuration updates against tier restrictions
 * - Increments version only on config changes
 * - Uses soft delete (sets status='deleted', preserves data)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guard';
import { getWidgetById, getWidgetWithLicense, updateWidget, deleteWidget, getUserById } from '@/lib/db/queries';
import { getSchemaForKind, normalizeTier } from '@/lib/widget-config/schema';
import { migrateConfig } from '@/lib/widget-config/migrate';
import { deepMerge, sanitizeConfig, forceN8nProviderConfig } from '@/lib/utils/config-helpers';
import { CHATKIT_SERVER_ENABLED } from '@/lib/feature-flags';
import { logActivity } from '@/lib/db/admin-queries';
import { z } from 'zod';

// =============================================================================
// Helper: Get widget and verify ownership (supports both v1 and v2.0 schema)
// =============================================================================

async function getWidgetWithOwnership(widgetId: string, userId: string): Promise<{
  widget: any;
  tier: string;
  licenseKey?: string | null;
} | null> {
  // First try: Get widget by ID directly
  const widget = await getWidgetById(widgetId);

  if (!widget) {
    return null;
  }

  // Schema v2.0: Check direct userId ownership
  if (widget.userId) {
    if (widget.userId !== userId) {
      return null; // Not owner
    }

    // Get user tier from user record
    const user = await getUserById(userId);
    const tier = user?.tier || 'free';

    return {
      widget,
      tier,
      licenseKey: widget.widgetKey, // Use widgetKey for v2.0
    };
  }

  // Legacy (v1): Check ownership through license
  if (widget.licenseId) {
    const widgetWithLicense = await getWidgetWithLicense(widgetId);
    if (!widgetWithLicense || widgetWithLicense.license.userId !== userId) {
      return null; // Not owner
    }

    return {
      widget: widgetWithLicense,
      tier: widgetWithLicense.license.tier,
      licenseKey: widgetWithLicense.license.licenseKey,
    };
  }

  // Widget has neither userId nor licenseId - orphaned
  return null;
}

// =============================================================================
// Request Validation Schemas
// =============================================================================

const UpdateWidgetSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  config: z.any().optional(),
  embedType: z.enum(['popup', 'inline', 'fullpage', 'portal']).optional(),
  allowedDomains: z.array(z.string().min(1)).optional(),
  status: z.enum(['active', 'paused']).optional(),
});

// =============================================================================
// GET /api/widgets/[id] - Get Single Widget
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Extract widget ID from route params (await for Next.js 16)
    const { id } = await params;

    // 1. Authenticate user
    const user = await requireAuth(request);

    // 2. Validate widget ID format
    const idSchema = z.string().uuid();
    const widgetId = idSchema.parse(id);

    // 3. Get widget and verify ownership (supports both v1 and v2.0)
    const result = await getWidgetWithOwnership(widgetId, user.sub);

    if (!result) {
      return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
    }

    // 4. READ boundary: migrate chat-kind configs to canonical shape on the way out
    const rawConfig = (result.widget as any).config;
    const widgetKind: 'chat' | 'display' = (result.widget as any).kind === 'display' ? 'display' : 'chat';
    const migratedConfig = widgetKind === 'chat' ? migrateConfig(rawConfig) : rawConfig;

    const normalizedWidget = !CHATKIT_SERVER_ENABLED
      ? {
          ...result.widget,
          config: forceN8nProviderConfig(migratedConfig),
          widgetType: 'n8n',
        }
      : {
          ...result.widget,
          config: migratedConfig,
        };

    return NextResponse.json({
      widget: {
        ...normalizedWidget,
        licenseKey: result.licenseKey
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid widget ID format' }, { status: 400 });
    }

    // Handle auth errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage === 'Authentication required' || errorMessage === 'Invalid or expired token') {
      return NextResponse.json({ error: errorMessage }, { status: 401 });
    }

    // Log unexpected errors
    console.error('Widget retrieval error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// =============================================================================
// PATCH /api/widgets/[id] - Update Widget
// =============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Extract widget ID from route params (await for Next.js 16)
    const { id } = await params;

    // 1. Authenticate user
    const user = await requireAuth(request);

    // 2. Validate widget ID format
    const idSchema = z.string().uuid();
    const widgetId = idSchema.parse(id);

    // 3. Parse and validate request body
    const rawBody = await request.json();

    // Guard: kind is immutable — reject attempts to change it via PATCH
    if ('kind' in rawBody) {
      // We need the existing widget to compare — do a lightweight fetch first
      const checkWidget = await getWidgetById(widgetId);
      if (checkWidget && rawBody.kind !== checkWidget.kind) {
        return NextResponse.json(
          { error: 'kind cannot be changed via PATCH; create a new widget instead' },
          { status: 400 }
        );
      }
    }

    const updates = UpdateWidgetSchema.parse(rawBody);

    // 4. Get widget and verify ownership (supports both v1 and v2.0)
    const result = await getWidgetWithOwnership(widgetId, user.sub);

    if (!result) {
      return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
    }

    const { widget, tier } = result;

    // 5. Prepare update data
    const updateData: any = {};

    // Update name if provided
    if (updates.name !== undefined) {
      updateData.name = updates.name;
    }

    // Update status if provided
    if (updates.status !== undefined) {
      updateData.status = updates.status;
    }

    // Update embed type if provided
    if (updates.embedType !== undefined) {
      updateData.embedType = updates.embedType;
    }

    // Update allowed domains if provided (empty array means allow all)
    if (updates.allowedDomains !== undefined) {
      updateData.allowedDomains = updates.allowedDomains;
    }

    // Handle config updates with deep merge and validation
    if (updates.config !== undefined) {
      // Determine the widget's kind from the existing row — never trust the request body for this
      const existingKind: 'chat' | 'display' = (widget.kind === 'display') ? 'display' : 'chat';

      // WRITE boundary: migrate existing config FIRST (canonical shape), then deep-merge
      // the incoming partial on top. This ensures a legacy stored config is normalized
      // before the merge so canonical paths always win.
      const existingCanonical = existingKind === 'chat'
        ? migrateConfig(widget.config)
        : widget.config;
      const mergedConfig = deepMerge(existingCanonical, updates.config);

      // SANITIZATION: Enforce tier restrictions and fix data integrity
      const sanitizedConfig = sanitizeConfig(mergedConfig, tier, existingKind);

      // Validate merged config against tier restrictions using canonical schema.
      // brandingRequired = true for basic/free tiers.
      const normalizedTier = normalizeTier(tier);
      const brandingRequired = normalizedTier === 'basic';
      const configSchema = getSchemaForKind(existingKind, normalizedTier, brandingRequired);
      const parsed = configSchema.safeParse(sanitizedConfig);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid widget configuration', details: parsed.error.flatten() },
          { status: 400 }
        );
      }

      let cleanedConfig: any = parsed.data;
      if (!CHATKIT_SERVER_ENABLED) {
        cleanedConfig = forceN8nProviderConfig(cleanedConfig);
      }

      updateData.config = cleanedConfig;
      // Increment version only when config changes
      updateData.version = widget.version + 1;

      // Also update widgetType based on provider
      if (cleanedConfig.connection?.provider) {
        updateData.widgetType = cleanedConfig.connection.provider === 'chatkit' ? 'chatkit' : 'n8n';
      }
      if (!CHATKIT_SERVER_ENABLED) {
        updateData.widgetType = 'n8n';
      }
    }

    // 6. Update widget in database
    const updatedWidget = await updateWidget(widgetId, updateData);

    // 7. Return updated widget
    return NextResponse.json({ widget: updatedWidget });

  } catch (error) {
    if (error instanceof z.ZodError) {
      // Extract the first error message for user-friendly response
      const firstError = (error as any).errors?.[0];
      const errorMessage = firstError?.message || 'Validation failed';

      // Log full error details
      console.error('[Widget Update] Zod Validation Error:', {
        error: errorMessage,
        allErrors: (error as any).errors,
        errorCount: (error as any).errors?.length
      });

      return NextResponse.json({
        error: errorMessage,
        details: (error as any).errors,
        fieldPath: firstError?.path?.join('.') || 'unknown'
      }, { status: 400 });
    }

    // Handle auth errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage === 'Authentication required' || errorMessage === 'Invalid or expired token') {
      return NextResponse.json({ error: errorMessage }, { status: 401 });
    }

    // Log unexpected errors
    console.error('Widget update error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// =============================================================================
// PUT /api/widgets/[id] - Update Widget (Alias for PATCH)
// =============================================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return PATCH(request, { params });
}

// =============================================================================
// DELETE /api/widgets/[id] - Delete Widget (Soft Delete)
// =============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Extract widget ID from route params (await for Next.js 16)
    const { id } = await params;

    // 1. Authenticate user
    const user = await requireAuth(request);

    // 2. Validate widget ID format
    const idSchema = z.string().uuid();
    const widgetId = idSchema.parse(id);

    // 3. Get widget and verify ownership (supports both v1 and v2.0)
    const result = await getWidgetWithOwnership(widgetId, user.sub);

    if (!result) {
      return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
    }

    // 4. Soft delete widget (sets status='deleted')
    await deleteWidget(widgetId);

    // Log activity
    void logActivity(user.sub, 'widget_deleted', { widgetId });

    // 5. Return 204 No Content on success
    return new NextResponse(null, { status: 204 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid widget ID format' }, { status: 400 });
    }

    // Handle auth errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage === 'Authentication required' || errorMessage === 'Invalid or expired token') {
      return NextResponse.json({ error: errorMessage }, { status: 401 });
    }

    // Log unexpected errors
    console.error('Widget deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
