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

    if (!shouldInit) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-neutral-50/50 text-neutral-500 p-8 text-center animate-in fade-in duration-500">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-neutral-100 flex items-center justify-center mb-4">
                    <svg
                        className="w-8 h-8 text-neutral-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">Configure Connection</h3>
                <p className="text-sm text-neutral-500 max-w-[250px] leading-relaxed">
                    Enter your OpenAI Workflow ID and API Key in the <span className="font-medium text-neutral-700">Connection</span> tab to preview the agent.
                </p>
            </div>
        );
    }

    const { control } = useChatKit({
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

    const getFontFamily = (f: string) => {
        switch (f) {
            case 'System':
                return '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
            case 'Space Grotesk':
                return '"Space Grotesk", sans-serif';
            case 'OpenAI Sans':
                return '"Inter", sans-serif';
            default:
                return `"${f}", sans-serif`;
        }
    };

    const getFontSize = (d?: string) => {
        switch (d) {
            case 'compact': return '14px';
            case 'spacious': return '18px';
            default: return '16px';
        }
    };

    return (
        <div
            className="h-full w-full overflow-hidden border rounded-xl shadow-sm bg-white"
            style={{
                fontFamily: getFontFamily(config.fontFamily || 'System'),
                fontSize: getFontSize(config.density)
            }}
        >
            {/* Intentional: Allow admins to inject custom CSS for advanced styling */}
            {config.customCss && <style dangerouslySetInnerHTML={{ __html: config.customCss }} />}
            <ChatKit control={control} />
        </div>
    );
};
