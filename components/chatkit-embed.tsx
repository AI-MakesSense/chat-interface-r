'use client';

import React from 'react';
import { useChatKit, ChatKit } from '@openai/chatkit-react';
import { WidgetConfig } from '@/stores/widget-store';

interface ChatKitEmbedProps {
    widgetId: string;
    config: WidgetConfig;
}

export const ChatKitEmbed: React.FC<ChatKitEmbedProps> = ({ widgetId, config }) => {
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
            color: {
                grayscale: {
                    hue: Math.min(Math.max(config.chatkitGrayscaleHue ?? 220, 0), 9) as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9,
                    tint: Math.min(Math.max(config.chatkitGrayscaleTint ?? 6, 0), 4) as 0 | 1 | 2 | 3 | 4,
                    shade: Math.min(Math.max(config.chatkitGrayscaleShade ?? (config.themeMode === 'dark' ? -1 : -4), -4), 4) as -4 | -3 | -2 | -1 | 0 | 1 | 2 | 3 | 4,
                },
                accent: {
                    primary: config.chatkitAccentPrimary ?? (config.themeMode === 'dark' ? '#f1f5f9' : '#0f172a'),
                    level: Math.min(Math.max(config.chatkitAccentLevel ?? 1, 0), 3) as 0 | 1 | 2 | 3,
                },
            },
            radius: config.radius === 'pill' ? 'pill' : config.radius === 'none' ? 'sharp' : config.radius === 'medium' ? 'soft' : 'round',
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
            <ChatKit control={control} />
        </div>
    );
};

