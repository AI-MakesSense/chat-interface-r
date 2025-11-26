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
            // accentColor: config.useAccent ? config.accentColor : undefined,
            radius: config.radius === 'pill' ? 'pill' : config.radius === 'none' ? 'sharp' : 'soft',
            // fontFamily: config.fontFamily === 'system-ui' ? undefined : config.fontFamily,
        },
        startScreen: {
            greeting: config.greeting,
            prompts: config.starterPrompts?.map(p => ({ label: p.label, prompt: p.label })) || [],
        },

    });

    return (
        <div className="h-full w-full overflow-hidden bg-transparent pointer-events-auto">
            <ChatKit control={control} />
        </div>
    );
};
