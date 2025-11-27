/**
 * Widget Management API Routes
 *
 * Purpose: Handles widget creation and listing operations
 * Responsibility: CRUD operations for widgets with authentication and authorization
 *
 * Constraints:
 * - Enforces widget limits per tier (Basic: 1, Pro: 3, Agency: unlimited)
 * - Validates widget configurations against tier restrictions
 * - Requires authentication for all operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guard';
import { db } from '@/lib/db/client';
import { licenses, widgets } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createWidget, getActiveWidgetCount, getWidgetsPaginated } from '@/lib/db/queries';
import { createDefaultConfig } from '@/lib/config/defaults';
import { createWidgetConfigSchema } from '@/lib/validation/widget-schema';
import { z } from 'zod';

// =============================================================================
// Request Validation Schemas
// =============================================================================

const CreateWidgetSchema = z.object({
  licenseId: z.string().uuid(),
  name: z.string().min(1).max(100),
  config: z.any().optional(),
});

// =============================================================================
// POST /api/widgets - Create Widget
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await requireAuth(request);

    // 2. Parse and validate request body
    const body = await request.json();
    const { licenseId, name, config: userConfig } = CreateWidgetSchema.parse(body);

    // 3. Get license and verify ownership
    const [license] = await db
      .select()
      .from(licenses)
      .where(eq(licenses.id, licenseId))
      .limit(1);

    if (!license) {
      return NextResponse.json({ error: 'License not found' }, { status: 404 });
    }

    if (license.userId !== user.sub) {
      return NextResponse.json({ error: 'You do not own this license' }, { status: 403 });
    }

    // 4. Check widget limit based on tier
    const activeCount = await getActiveWidgetCount(licenseId);
    const limit = license.widgetLimit;

    if (limit !== -1 && activeCount >= limit) {
      return NextResponse.json(
        { error: `Widget limit exceeded for ${license.tier} tier (max: ${limit})` },
        { status: 403 }
      );
    }

    // 5. Generate config (use defaults if not provided, merge if provided)
    let finalConfig;
    if (userConfig) {
      // Deep merge user config with defaults
      const defaults = createDefaultConfig(license.tier as any);
      finalConfig = deepMerge(defaults, userConfig);
    } else {
      finalConfig = createDefaultConfig(license.tier as any);
    }

    // 6. Validate final config against tier restrictions
    const configSchema = createWidgetConfigSchema(license.tier as any, true);
    configSchema.parse(finalConfig);

    // 7. Clean legacy properties that might conflict with new structure
    const cleanedConfig = stripLegacyConfigProperties(finalConfig);

    // 8. Create widget in database
    const widget = await createWidget({
      licenseId,
      name,
      config: cleanedConfig,
      widgetType: cleanedConfig.connection?.provider === 'chatkit' ? 'chatkit' : 'n8n',
    });

    // 8. Return 201 Created with widget data
    return NextResponse.json({
      widget: {
        ...widget,
        licenseKey: license.licenseKey
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
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await requireAuth(request);

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const licenseId = searchParams.get('licenseId') || undefined;
    const includeDeleted = searchParams.get('includeDeleted') === 'true';

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

    // 3. If licenseId filter provided, verify ownership
    if (licenseId) {
      const [license] = await db
        .select()
        .from(licenses)
        .where(eq(licenses.id, licenseId))
        .limit(1);

      if (!license) {
        return NextResponse.json({ error: 'License not found' }, { status: 404 });
      }

      if (license.userId !== user.sub) {
        return NextResponse.json({ error: 'You do not own this license' }, { status: 403 });
      }
    }

    // 4. Get paginated widgets for the user
    const result = await getWidgetsPaginated(user.sub, {
      page,
      limit,
      licenseId,
      includeDeleted,
    });

    // 5. Build pagination metadata
    const totalPages = Math.ceil(result.total / limit);

    // 6. Return 200 OK with widgets and pagination
    return NextResponse.json({
      widgets: result.widgets.map(w => ({
        ...w,
        licenseKey: (w as any).licenseKey || w.license?.licenseKey
      })),
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages,
      },
    });

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
 * Deep merge two objects recursively
 * Used to merge user config with defaults while preserving nested structure
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