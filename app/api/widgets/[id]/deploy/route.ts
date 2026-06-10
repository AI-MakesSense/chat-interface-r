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
import { getWidgetById, getUserById, deployWidget } from '@/lib/db/queries';
import { getWidgetConfigSchemaForKind, normalizeTier } from '@/lib/validation/widget-schema';
import { assertPublicWebhookUrl, isPlaceholderWebhook } from '@/lib/security/url-guard';
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

    // 3. Resolve widget + owner. Tier is always sourced from users.tier
    //    (the canonical tier per the account model), never from a license.
    const widget = await getWidgetById(widgetId);
    if (!widget) {
      return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
    }
    const widgetUser = await getUserById(widget.userId);
    if (!widgetUser) {
      // The widget's owner account has been deleted — return 404 rather
      // than falling through to a misleading 'free' tier validation failure.
      return NextResponse.json({ error: 'Widget owner not found' }, { status: 404 });
    }
    const ownerUserId = widget.userId;
    const tier = widgetUser.tier ?? 'free';

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
    const configSchema = getWidgetConfigSchemaForKind(widgetKind, normalizeTier(tier), false);

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

    // The display sentinel ('https://example.com/webhook') is allowed at SAVE
    // time (user is mid-setup) but a widget must NOT deploy pointing at the
    // placeholder. Reject it with a clear message before the SSRF guard (which
    // would otherwise let example.com through as a public host).
    if (isPlaceholderWebhook(webhookUrl)) {
      return NextResponse.json(
        {
          error: 'Widget configuration is not ready for deployment',
          details: [
            {
              path: ['connection', 'webhookUrl'],
              message: 'Configure your webhook URL before deploying (the placeholder URL is not a real endpoint)',
            },
          ],
        },
        { status: 400 }
      );
    }

    // SSRF + scheme validation. Replaces the old protocol-only check:
    // assertPublicWebhookUrl enforces https (localhost exempt outside production)
    // AND rejects private-IP literals / hostnames that DNS-resolve to private
    // addresses. Applied provider-agnostically: any widget carrying a non-empty
    // connection.webhookUrl must point at a public endpoint to deploy, regardless
    // of provider (display/chatkit must not deploy a private-IP webhook either —
    // defense-in-depth, consistent with the save-time guard).
    try {
      await assertPublicWebhookUrl(webhookUrl);
    } catch (err) {
      return NextResponse.json(
        {
          error: 'Widget configuration is not ready for deployment',
          details: [
            {
              path: ['connection', 'webhookUrl'],
              message: (err as Error).message,
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
