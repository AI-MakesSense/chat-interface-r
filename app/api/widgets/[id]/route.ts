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
import { createWidgetConfigSchema } from '@/lib/validation/widget-schema';
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

    // 4. Return widget data with licenseKey/widgetKey
    return NextResponse.json({
      widget: {
        ...result.widget,
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
    const body = await request.json();
    const updates = UpdateWidgetSchema.parse(body);

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

    // Handle config updates with deep merge and validation
    if (updates.config !== undefined) {
      // Deep merge new config with existing config
      const mergedConfig = deepMerge(widget.config, updates.config);

      console.log('[Widget Update] Original config keys:', Object.keys(widget.config as object));
      console.log('[Widget Update] Update config keys:', Object.keys(updates.config as object));
      console.log('[Widget Update] Merged config keys:', Object.keys(mergedConfig));

      // SANITIZATION: Enforce tier restrictions and fix data integrity
      const sanitizedConfig = sanitizeConfig(mergedConfig, tier);

      console.log('[Widget Update] Post-sanitization config keys:', Object.keys(sanitizedConfig));
      console.log('[Widget Update] Sanitized config sample:', {
        branding: sanitizedConfig.branding,
        features: sanitizedConfig.features,
        connection: sanitizedConfig.connection
      });

      // Validate merged config against tier restrictions
      const configSchema = createWidgetConfigSchema(tier as any, true);

      try {
        configSchema.parse(sanitizedConfig);
      } catch (validationError) {
        console.error('[Widget Update] VALIDATION FAILED');
        console.error('[Widget Update] Tier:', tier);
        console.error('[Widget Update] Sanitized config:', JSON.stringify(sanitizedConfig, null, 2));
        if (validationError instanceof z.ZodError) {
          console.error('[Widget Update] Validation errors:', validationError.issues);
        }
        throw validationError;
      }

      // Strip legacy properties that might conflict with new structure
      const cleanedConfig = stripLegacyConfigProperties(sanitizedConfig);

      updateData.config = cleanedConfig;
      // Increment version only when config changes
      updateData.version = widget.version + 1;

      // Also update widgetType based on provider
      if (cleanedConfig.connection?.provider) {
        updateData.widgetType = cleanedConfig.connection.provider === 'chatkit' ? 'chatkit' : 'n8n';
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

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Deep merge two objects recursively
 * Used to merge config updates with existing config while preserving nested structure
 */
function deepMerge(target: any, source: any): any {
  const output = { ...target };

  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      // Recursively merge nested objects
      output[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      // Direct assignment for primitives and arrays
      output[key] = source[key];
    }
  }

  return output;
}

/**
 * Strip legacy config properties that conflict with new structure
 * 
 * Removes old nested objects like:
 * - theme.mode (old) vs themeMode (new)
 * - theme.colors (old) vs color system (new)
 * - behavior, advancedStyling, etc.
 */
function stripLegacyConfigProperties(config: any): any {
  const cleaned = { ...config };

  // Remove legacy nested theme object if it exists
  // The new structure uses flat properties like themeMode, not nested theme.mode
  if (cleaned.theme && typeof cleaned.theme === 'object') {
    delete cleaned.theme;
  }

  // Remove other legacy nested structures
  delete cleaned.behavior;
  delete cleaned.advancedStyling;

  return cleaned;
}

/**
 * Sanitize configuration to ensure it passes validation
 * Handles legacy data, invalid formats, and tier restrictions
 */
function sanitizeConfig(config: any, tier: string): any {
  const sanitized = JSON.parse(JSON.stringify(config)); // Deep clone

  // Helper to fix hex colors
  const fixColor = (color: any, defaultColor: string = '#000000') => {
    if (!color || typeof color !== 'string') return defaultColor;
    // Fix 3-digit hex
    if (/^#[0-9A-Fa-f]{3}$/.test(color)) {
      return '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
    }
    // Return if valid 6-digit hex
    if (/^#[0-9A-Fa-f]{6}$/.test(color)) return color;
    return defaultColor;
  };

  // Helper to fix URLs
  const fixUrl = (url: any) => {
    if (!url || typeof url !== 'string') return null;
    if (url.startsWith('http://')) return url.replace('http://', 'https://');
    if (url.startsWith('https://') || url.includes('localhost')) return url;
    return null;
  };

  // 1. Tier Restrictions (Basic)
  if (tier === 'basic') {
    if (sanitized.advancedStyling) sanitized.advancedStyling.enabled = false;
    if (sanitized.features) {
      sanitized.features.emailTranscript = false;
      sanitized.features.ratingPrompt = false;
    }
    if (sanitized.branding) sanitized.branding.brandingEnabled = true;
  }

  // 2. Data Integrity - Branding
  if (sanitized.branding) {
    if (!sanitized.branding.companyName) sanitized.branding.companyName = 'My Company';
    if (!sanitized.branding.welcomeText) sanitized.branding.welcomeText = 'How can we help?';
    if (!sanitized.branding.firstMessage) sanitized.branding.firstMessage = 'Hello! How can I assist you today?';

    // Fix launcher icon
    if (sanitized.branding.launcherIcon === 'custom') {
      const validUrl = fixUrl(sanitized.branding.customLauncherIconUrl);
      if (!validUrl) {
        sanitized.branding.launcherIcon = 'chat'; // Revert to default if URL invalid
        sanitized.branding.customLauncherIconUrl = null;
      } else {
        sanitized.branding.customLauncherIconUrl = validUrl;
      }
    } else {
      // Ensure it's null if not custom, to avoid validation errors
      sanitized.branding.customLauncherIconUrl = null;
    }

    sanitized.branding.logoUrl = fixUrl(sanitized.branding.logoUrl);
  }

  // 3. Data Integrity - Colors (Recursive fix for all color fields)
  const fixColorsInObject = (obj: any) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string' && obj[key].startsWith('#')) {
        obj[key] = fixColor(obj[key]);
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        fixColorsInObject(obj[key]);
      }
    }
  };

  if (sanitized.theme) fixColorsInObject(sanitized.theme);
  if (sanitized.advancedStyling) fixColorsInObject(sanitized.advancedStyling);

  // 4. Theme Mode
  if (sanitized.themeMode && !['light', 'dark'].includes(sanitized.themeMode)) {
    delete sanitized.themeMode; // Let it fall back to default
  }

  return sanitized;
}