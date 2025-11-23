import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
    try {
        // Path to the compiled widget file
        // In production (Vercel), this might need adjustment depending on where the build output is
        // For now, we assume it's in public/widget/chat-widget.iife.js or similar
        // But since we are building it, we should probably read it from the build output directory

        // NOTE: The widget build process outputs to public/widget/chat-widget.iife.js
        // We will serve this file.
        const widgetPath = path.join(process.cwd(), 'public', 'widget', 'chat-widget.iife.js');

        if (!fs.existsSync(widgetPath)) {
            console.error('Widget bundle not found at:', widgetPath);
            return NextResponse.json(
                { error: 'Widget bundle not found' },
                { status: 404 }
            );
        }

        const fileBuffer = fs.readFileSync(widgetPath);

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': 'application/javascript',
                'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
                'Access-Control-Allow-Origin': '*',
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
