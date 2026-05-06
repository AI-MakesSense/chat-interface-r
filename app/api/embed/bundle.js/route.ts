import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
    try {
        const widgetPath = path.join(process.cwd(), 'public', 'widget', 'chat-widget.iife.js');

        if (!fs.existsSync(widgetPath)) {
            console.error('Widget bundle not found at:', widgetPath);
            return NextResponse.json(
                { error: 'Widget bundle not found' },
                { status: 404 }
            );
        }

        const fileBuffer = fs.readFileSync(widgetPath);
        const etag = `"${createHash('md5').update(fileBuffer).digest('hex').slice(0, 16)}"`;

        // Return 304 if browser already has the current version
        const ifNoneMatch = request.headers.get('if-none-match');
        if (ifNoneMatch && ifNoneMatch === etag) {
            return new NextResponse(null, {
                status: 304,
                headers: {
                    'Content-Type': 'application/javascript; charset=utf-8',
                    'Cache-Control': 'public, no-cache',
                    'Access-Control-Allow-Origin': '*',
                    'ETag': etag,
                },
            });
        }

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': 'application/javascript; charset=utf-8',
                'Cache-Control': 'public, no-cache',
                'Access-Control-Allow-Origin': '*',
                'ETag': etag,
            },
        });

    } catch (error) {
        console.error('Error serving widget bundle:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
