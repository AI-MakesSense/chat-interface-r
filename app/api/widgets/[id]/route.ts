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
import { getWidgetWithLicense, updateWidget, deleteWidget } from '@/lib/db/queries';
import { createWidgetConfigSchema } from '@/lib/validation/widget-schema';
import { z } from 'zod';

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

    // 3. Get widget with license information
    const widget = await getWidgetWithLicense(widgetId);

    if (!widget) {
      return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
    }

    // 4. Verify ownership through license
    if (widget.license.userId !== user.sub) {
      return NextResponse.json({ error: 'You do not own this widget' }, { status: 403 });
    }

    // 5. Return widget data with licenseKey
    return NextResponse.json({
      widget: {
        ...widget,
        licenseKey: widget.license.licenseKey
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

    // 4. Get widget with license information
    const widget = await getWidgetWithLicense(widgetId);

    if (!widget) {
      return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
    }

    // 5. Verify ownership through license
    if (widget.license.userId !== user.sub) {
      return NextResponse.json({ error: 'You do not own this widget' }, { status: 403 });
    }

    // 6. Prepare update data
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

      // Validate merged config against tier restrictions
      const configSchema = createWidgetConfigSchema(widget.license.tier as any, true);
      configSchema.parse(mergedConfig);

      updateData.config = mergedConfig;
      // Increment version only when config changes
      updateData.version = widget.version + 1;

      // Also update widgetType based on provider
      if (mergedConfig.connection?.provider) {
        updateData.widgetType = mergedConfig.connection.provider === 'chatkit' ? 'chatkit' : 'n8n';
      }
    }

    // 7. Update widget in database
    const updatedWidget = await updateWidget(widgetId, updateData);

    // 8. Return updated widget
    return NextResponse.json({ widget: updatedWidget });

  } catch (error) {
    if (error instanceof z.ZodError) {
      // Extract the first error message for user-friendly response
      const firstError = (error as any).errors?.[0];
      const errorMessage = firstError?.message || 'Validation failed';
      return NextResponse.json({ error: errorMessage, details: (error as any).errors }, { status: 400 });
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

    // 3. Get widget with license information
    const widget = await getWidgetWithLicense(widgetId);

    if (!widget) {
      return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
    }

    // 4. Verify ownership through license
    if (widget.license.userId !== user.sub) {
      return NextResponse.json({ error: 'You do not own this widget' }, { status: 403 });
    }

    // 5. Soft delete widget (sets status='deleted')
    await deleteWidget(widgetId);

    // 6. Return 204 No Content on success
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