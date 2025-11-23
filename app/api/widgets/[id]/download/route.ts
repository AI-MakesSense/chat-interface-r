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
  // FIX: Removed 'Promise' wrapper for Next.js 14 compatibility
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authenticate user
    const user = await requireAuth(request);

    // 2. Validate widget ID format
    // FIX: No 'await' needed for params in Next.js 14
    const { id } = params;

    const widgetId = z.string().uuid().parse(id);

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

    // 5. Verify ownership
    if (widget.license.userId !== user.sub) {
      return NextResponse.json(
        { error: 'You do not own this widget' },
        { status: 403 }
      );
    }

    // 6. Verify status
    if (widget.status !== 'active' || widget.license.status !== 'active') {
      return NextResponse.json(
        { error: 'Widget or License is not active' },
        { status: 400 }
      );
    }

    // 7. Prepare Generator Data
    const generator = new ZipGenerator();
    const config = widget.config as any;
    const licenseKey = widget.license.licenseKey;

    // Dynamic Base URL detection
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host');
    const baseUrl = `${protocol}://${host}`;

    let zipBuffer: Buffer;
    let filename: string;

    // 8. Generate zip package
    if (type === 'extension') {
      zipBuffer = await generator.generateExtensionPackage(config, widgetId, licenseKey, baseUrl);
      filename = `${widget.name}-extension.zip`;
    } else if (type === 'portal') {
      zipBuffer = await generator.generatePortalPackage(config, widgetId, licenseKey, baseUrl);
      filename = `${widget.name}-portal.zip`;
    } else {
      zipBuffer = await generator.generateWebsitePackage(config, widgetId, licenseKey, baseUrl);
      filename = `${widget.name}-website.zip`;
    }

    // Sanitize filename
    filename = filename.replace(/[^a-z0-9-.]/gi, '-').toLowerCase();

    // 9. Return zip file
    return new NextResponse(new Uint8Array(zipBuffer), {
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

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate package' },
      { status: 500 }
    );
  }
}