/**
 * Widget Download API Route
 *
 * Purpose: Generate and serve downloadable widget packages as zip files
 * Route: GET /api/widgets/[id]/download?type=website|portal
 *
 * Responsibility:
 * - Authenticate user and verify widget ownership
 * - Generate zip package using ZipGenerator
 * - Return zip file with proper headers
 *
 * Constraints:
 * - Requires authentication
 * - Verifies widget ownership through license
 * - Supports website and portal package types
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { getWidgetWithLicense } from '@/lib/db/queries';
import { ZipGenerator } from '@/lib/zip-generator';
import { z } from 'zod';

// =============================================================================
// Request Validation Schemas
// =============================================================================

const DownloadQuerySchema = z.object({
  type: z.enum(['website', 'portal', 'extension']).default('website'),
});

// =============================================================================
// GET /api/widgets/[id]/download - Download Widget Package
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate user
    const user = await requireAuth(request);

    // 2. Validate widget ID format
    const { id } = await params;
    const idSchema = z.string().uuid();
    const widgetId = idSchema.parse(id);

    // 3. Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryValidation = DownloadQuerySchema.safeParse({
      type: searchParams.get('type') || 'website',
    });

    if (!queryValidation.success) {
      return NextResponse.json(
        { error: 'Invalid package type', details: queryValidation.error.issues },
        { status: 400 }
      );
    }

    const { type } = queryValidation.data;

    // 4. Get widget with license information
    const widget = await getWidgetWithLicense(widgetId);

    if (!widget) {
      return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
    }

    // 5. Verify ownership through license
    if (widget.license.userId !== user.sub) {
      return NextResponse.json(
        { error: 'You do not own this widget' },
        { status: 403 }
      );
    }

    // 6. Verify widget and license are active
    if (widget.status !== 'active') {
      return NextResponse.json(
        { error: 'Widget is not active' },
        { status: 400 }
      );
    }

    if (widget.license.status !== 'active') {
      return NextResponse.json(
        { error: 'License is not active' },
        { status: 400 }
      );
    }

    // 7. Generate zip package based on type
    const generator = new ZipGenerator();
    const config = widget.config as any; // WidgetConfig from JSONB

    let zipBuffer: Buffer;
    let filename: string;

    if (type === 'extension') {
      zipBuffer = await generator.generateExtensionPackage(config, widgetId);
      filename = `${widget.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-extension.zip`;
    } else if (type === 'portal') {
      zipBuffer = await generator.generatePortalPackage(config, widgetId);
      filename = `${widget.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-portal.zip`;
    } else {
      zipBuffer = await generator.generateWebsitePackage(config);
      filename = `${widget.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-website.zip`;
    }

    // 8. Return zip file with appropriate headers
    // Convert Buffer to Uint8Array for NextResponse compatibility
    const uint8Array = new Uint8Array(zipBuffer);

    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': zipBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

  } catch (error) {
    console.error('[Download API] Error:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.issues },
        { status: 400 }
      );
    }

    // Handle zip generation errors
    if (error instanceof Error && error.message.includes('License key is required')) {
      return NextResponse.json(
        { error: 'Widget configuration is invalid' },
        { status: 400 }
      );
    }

    // Generic error response
    return NextResponse.json(
      { error: 'Failed to generate package' },
      { status: 500 }
    );
  }
}
