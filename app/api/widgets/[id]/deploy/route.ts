/**
 * Widget Deployment API Route
 *
 * Purpose: Validates widget config for production deployment
 * Responsibility: Ensures widget is deployment-ready before activation
 *
 * Constraints:
 * - Requires authentication
 * - Verifies widget ownership through license
 * - Validates config with strict rules (no defaults allowed)
 * - Enforces HTTPS webhookUrl (except localhost)
 * - Sets deployedAt timestamp on first deployment
 * - Idempotent (re-deploying preserves original deployedAt)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guard';
import { getWidgetWithLicense, getWidgetById, getUserById, deployWidget } from '@/lib/db/queries';
import { getWidgetConfigSchemaForKind } from '@/lib/validation/widget-schema';
import { z } from 'zod';

// =============================================================================
// POST /api/widgets/[id]/deploy - Deploy Widget
// =============================================================================

export async function POST(
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

    // 3. Get widget with license information (legacy path)
    //    V2.0 widgets have licenseId = NULL so the inner join returns null — fall back to direct lookup.
    const widgetWithLicense = await getWidgetWithLicense(widgetId);

    let ownerUserId: string;
    let tier: string;
    // `widget` holds only the base Widget columns (status, kind, config) used below.
    // Both paths produce a value that satisfies this shape.
    let widget: { status: string; kind: string; config: unknown };

    if (widgetWithLicense) {
      // Legacy path: widget is associated with a license
      ownerUserId = widgetWithLicense.license.userId;
      tier = widgetWithLicense.license.tier;
      widget = widgetWithLicense;
    } else {
      // V2.0 path: widget is associated directly with a user (licenseId is NULL)
      const v2Widget = await getWidgetById(widgetId);
      if (!v2Widget) {
        return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
      }
      if (!v2Widget.userId) {
        // Widget exists but has neither a license nor a userId — data integrity issue
        return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
      }
      const widgetUser = await getUserById(v2Widget.userId);
      ownerUserId = v2Widget.userId;
      tier = widgetUser?.tier ?? 'free';
      widget = v2Widget;
    }

    // 4. Verify ownership
    if (ownerUserId !== user.sub) {
      return NextResponse.json({ error: 'You do not own this widget' }, { status: 403 });
    }

    // 5. Cannot deploy deleted widgets
    if (widget.status === 'deleted') {
      return NextResponse.json(
        { error: 'Cannot deploy deleted widget' },
        { status: 400 }
      );
    }

    // 6. Validate config is deployment-ready (strict validation - no defaults)
    // Use the existing widget's kind to select the right schema.
    const widgetKind: 'chat' | 'display' = (widget.kind === 'display') ? 'display' : 'chat';
    const configSchema = getWidgetConfigSchemaForKind(widgetKind, tier as any, false);

    try {
      configSchema.parse(widget.config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: 'Widget configuration is not ready for deployment',
            details: (error as any).errors,
          },
          { status: 400 }
        );
      }
      throw error;
    }

    // 7. Additional deployment validation: webhookUrl must be HTTPS (or localhost)
    const webhookUrl = (widget.config as any)?.connection?.webhookUrl;
    if (!webhookUrl) {
      return NextResponse.json(
        {
          error: 'Widget configuration is not ready for deployment',
          details: [
            {
              path: ['connection', 'webhookUrl'],
              message: 'Webhook URL is required for deployment',
            },
          ],
        },
        { status: 400 }
      );
    }

    // Check if webhookUrl is HTTPS or localhost (use URL-parse to prevent substring-match bypasses)
    const isValidDeployUrl = (() => {
      try {
        const parsed = new URL(webhookUrl);
        if (parsed.protocol === 'https:') return true;
        if (parsed.protocol === 'http:' && (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1')) return true;
        return false;
      } catch {
        return false;
      }
    })();

    if (!isValidDeployUrl) {
      return NextResponse.json(
        {
          error: 'Widget configuration is not ready for deployment',
          details: [
            {
              path: ['connection', 'webhookUrl'],
              message: 'Webhook URL must use HTTPS (or localhost for development)',
            },
          ],
        },
        { status: 400 }
      );
    }

    // 8. Deploy widget (sets deployedAt if not already set, activates if paused)
    const deployedWidget = await deployWidget(widgetId);

    if (!deployedWidget) {
      return NextResponse.json(
        { error: 'Failed to deploy widget' },
        { status: 500 }
      );
    }

    // 9. Return success response
    return NextResponse.json({
      message: 'Widget deployed successfully',
      widget: {
        id: deployedWidget.id,
        status: deployedWidget.status,
        deployedAt: deployedWidget.deployedAt,
        version: deployedWidget.version,
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid widget ID format' },
        { status: 400 }
      );
    }

    // Handle auth errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage === 'Authentication required' || errorMessage === 'Invalid or expired token') {
      return NextResponse.json({ error: errorMessage }, { status: 401 });
    }

    // Log unexpected errors
    console.error('Widget deployment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
