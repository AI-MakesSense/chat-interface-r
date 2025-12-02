'use client';

import React from 'react';
import { useChatKit, ChatKit } from '@openai/chatkit-react';
import { WidgetConfig } from '@/stores/widget-store';

// ChatKit icon type
type ChatKitIcon = 'sparkle' | 'lightbulb' | 'mail' | 'phone' | 'calendar' | 'globe' | 'search' | 'star' | 'check' | 'info' | 'compass' | 'map-pin' | 'user' | 'write' | 'document' | 'book-open' | 'bug' | 'cube' | 'bolt' | 'chart' | 'keys' | 'notebook' | 'profile';

// Map our icon IDs to ChatKit icon names
const mapToChatKitIcon = (iconId: string): ChatKitIcon | undefined => {
    const iconMap: Record<string, ChatKitIcon> = {
        'sparkles': 'sparkle',
        'sparkle': 'sparkle',
        'message': 'sparkle', // fallback since ChatKit doesn't have message
        'messageSquare': 'sparkle',
        'lightbulb': 'lightbulb',
        'mail': 'mail',
        'phone': 'phone',
        'calendar': 'calendar',
        'globe': 'globe',
        'search': 'search',
        'star': 'star',
        'check': 'check',
        'info': 'info',
        'compass': 'compass',
        'mapPin': 'map-pin',
        'user': 'user',
        'pen': 'write',
        'pencil': 'write',
        'edit': 'write',
        'fileText': 'document',
        'book': 'book-open',
        'bug': 'bug',
        'cube': 'cube',
        'zap': 'bolt',
        'bolt': 'bolt',
        'chart': 'chart',
        'key': 'keys',
        'notebook': 'notebook',
        'profile': 'profile',
    };
    return iconMap[iconId];
};

// Google Fonts URL mapping for fonts that need to be loaded
const GOOGLE_FONT_SOURCES: Record<string, string> = {
    'Inter': 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
    'Roboto': 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap',
    'Open Sans': 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700&display=swap',
    'Lato': 'https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap',
    'Montserrat': 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap',
    'Poppins': 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap',
    'Space Grotesk': 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap',
    'Comfortaa': 'https://fonts.googleapis.com/css2?family=Comfortaa:wght@400;500;600;700&display=swap',
    'Bricolage Grotesque': 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700&display=swap',
};

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
    // Build font sources for Google Fonts and custom fonts
    const fontSources: { family: string; src: string; weight?: number; display?: 'swap' }[] = [];

    // Add Google Font source if needed
    const fontFamily = config.fontFamily || 'system-ui';
    if (GOOGLE_FONT_SOURCES[fontFamily]) {
        fontSources.push({
            family: fontFamily,
            src: GOOGLE_FONT_SOURCES[fontFamily],
            weight: 400,
            display: 'swap',
        });
    }

    // Add custom font source if configured
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
            prompts: config.starterPrompts?.map(p => {
                const mappedIcon = p.icon ? mapToChatKitIcon(p.icon) : undefined;
                return {
                    label: p.label,
                    prompt: p.label,
                    ...(mappedIcon ? { icon: mappedIcon } : {}),
                };
            }) || [],
        },
        composer: config.placeholder ? {
            placeholder: config.placeholder,
        } : undefined,
        // Disclaimer if configured
        ...(config.disclaimer ? {
            disclaimer: {
                text: config.disclaimer,
                highContrast: false,
            },
        } : {}),
    });

    return (
        <div className="h-full w-full overflow-hidden bg-transparent pointer-events-auto">
            {config.customCss && <style dangerouslySetInnerHTML={{ __html: config.customCss }} />}
            <ChatKit control={control} />
        </div>
    );
};
