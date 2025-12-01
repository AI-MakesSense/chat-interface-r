'use client';

import React from 'react';
import { useChatKit, ChatKit } from '@openai/chatkit-react';
import { WidgetConfig } from '@/stores/widget-store';

// Font family helper
const getFontFamily = (f: string): string => {
    switch (f) {
        case 'System':
        case 'system-ui':
            return '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
        case 'Space Grotesk':
            return '"Space Grotesk", sans-serif';
        case 'OpenAI Sans':
        case 'Inter':
            return '"Inter", sans-serif';
        default:
            return `"${f}", sans-serif`;
    }
};

interface ChatKitEmbedProps {
    widgetId: string;
    config: WidgetConfig;
}

export const ChatKitEmbed: React.FC<ChatKitEmbedProps> = ({ widgetId, config }) => {
    // Build font sources for custom fonts
    const fontSources: { family: string; src: string; weight?: number; display?: 'swap' }[] = [];
    if (config.useCustomFont && config.customFontCss && config.customFontName) {
        // Extract URL from @import statement
        const urlMatch = config.customFontCss.match(/url\(['"]?([^'"]+)['"]?\)/);
        if (urlMatch) {
            fontSources.push({
                family: config.customFontName,
                src: urlMatch[1],
                weight: 400,
                display: 'swap',
            });
        }
    }

    const { control } = useChatKit({
        api: {
            getClientSecret: async () => {
                const res = await fetch('/api/chatkit/create-session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        widgetId,
                    }),
                });

                if (!res.ok) {
                    const error = await res.json();
                    throw new Error(error.error || 'Failed to create session');
                }

                const data = await res.json();
                return data.client_secret;
            },
        },
        theme: {
            colorScheme: config.themeMode || 'light',
            typography: {
                baseSize: (config.density === 'compact' ? 14 : config.density === 'spacious' ? 18 : 16) as 14 | 15 | 16 | 17 | 18,
                fontFamily: getFontFamily(config.fontFamily || 'System'),
                fontFamilyMono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                ...(fontSources.length > 0 ? { fontSources } : {}),
            },
            color: {
                grayscale: {
                    hue: config.chatkitGrayscaleHue ?? 0,
                    tint: Math.min(Math.max(config.chatkitGrayscaleTint ?? 6, 0), 9) as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9,
                    shade: Math.min(Math.max(config.chatkitGrayscaleShade ?? (config.themeMode === 'dark' ? -1 : -4), -4), 4) as -4 | -3 | -2 | -1 | 0 | 1 | 2 | 3 | 4,
                },
                accent: {
                    primary: config.chatkitAccentPrimary ?? (config.themeMode === 'dark' ? '#f1f5f9' : '#0f172a'),
                    level: Math.min(Math.max(config.chatkitAccentLevel ?? 1, 0), 3) as 0 | 1 | 2 | 3,
                },
                // Surface colors if custom colors are enabled
                ...(config.useCustomSurfaceColors && config.surfaceBackgroundColor && config.surfaceForegroundColor ? {
                    surface: {
                        background: config.surfaceBackgroundColor,
                        foreground: config.surfaceForegroundColor,
                    }
                } : {}),
            },
            radius: config.radius === 'pill' ? 'pill' : config.radius === 'none' ? 'sharp' : config.radius === 'medium' ? 'soft' : 'round',
            density: config.density || 'normal',
        },
        startScreen: {
            greeting: config.greeting,
            prompts: config.starterPrompts?.map(p => ({ label: p.label, prompt: p.label })) || [],
        },
        composer: config.placeholder ? {
            placeholder: config.placeholder,
        } : undefined,
    });

    return (
        <div className="h-full w-full overflow-hidden bg-transparent pointer-events-auto">
            {config.customCss && <style dangerouslySetInnerHTML={{ __html: config.customCss }} />}
            <ChatKit control={control} />
        </div>
    );
};
