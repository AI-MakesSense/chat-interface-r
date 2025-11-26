'use client';

import React from 'react';
import { useChatKit, ChatKit } from '@openai/chatkit-react';
import { WidgetConfig } from '@/stores/widget-store';

interface ChatKitPreviewProps {
    config: WidgetConfig;
}

export const ChatKitPreview: React.FC<ChatKitPreviewProps> = ({ config }) => {
    const { workflowId, apiKey } = config.connection || {};

    // Only initialize ChatKit if we have credentials
    const shouldInit = !!workflowId && !!apiKey;

    const { control } = useChatKit({
        enabled: shouldInit,
        api: {
            getClientSecret: async () => {
                const res = await fetch('/api/chatkit/create-session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        previewMode: true,
                        apiKey,
                        workflowId,
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
            accentColor: config.useAccent ? config.accentColor : undefined,
            radius: config.radius === 'pill' ? 'pill' : config.radius === 'none' ? 'sharp' : 'soft',
            fontFamily: config.fontFamily === 'system-ui' ? undefined : config.fontFamily,
        },
        startScreen: {
            greeting: config.greeting,
            prompts: config.starterPrompts?.map(p => ({ label: p.label })) || [],
        },
        configuration: {
            file_upload: {
                enabled: config.enableAttachments || false,
            },
        },
    });

    if (!shouldInit) {
        return (
            <div className="flex items-center justify-center h-full bg-neutral-50 text-neutral-500 p-8 text-center">
                <div>
                    <h3 className="text-lg font-medium mb-2">Configure Connection</h3>
                    <p className="text-sm">Enter your OpenAI Workflow ID and API Key to preview the agent.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full overflow-hidden border rounded-xl shadow-sm bg-white">
            <ChatKit control={control} />
        </div>
    );
};
