'use client';

/**
 * Create Widget Modal
 *
 * Simplified widget creation flow.
 * Schema v2.0: No license required, widgets belong directly to users.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bot, Webhook, Plus, MessageCircle, Layout, Maximize, Link } from 'lucide-react';
import type { EmbedType } from '@/stores/widget-store';
import { CHATKIT_UI_ENABLED } from '@/lib/feature-flags';

interface CreateWidgetModalProps {
    children?: React.ReactNode;
}

const EMBED_OPTIONS: { value: EmbedType; label: string; icon: React.ElementType; description: string }[] = [
    { value: 'popup', label: 'Popup', icon: MessageCircle, description: 'Floating chat bubble' },
    { value: 'inline', label: 'Inline', icon: Layout, description: 'Embedded in a section' },
    { value: 'fullpage', label: 'Fullpage', icon: Maximize, description: 'Standalone page' },
    { value: 'portal', label: 'Portal', icon: Link, description: 'Shareable link' },
];

export function CreateWidgetModal({ children }: CreateWidgetModalProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState('');
    const [type, setType] = useState<'chatkit' | 'n8n'>(CHATKIT_UI_ENABLED ? 'chatkit' : 'n8n');
    const [embedType, setEmbedType] = useState<EmbedType>('popup');

    const handleCreate = () => {
        const selectedType = !CHATKIT_UI_ENABLED && type === 'chatkit' ? 'n8n' : type;
        const path = selectedType === 'chatkit' ? '/configurator/chatkit' : '/configurator/n8n';
        const params = new URLSearchParams();
        if (name.trim()) params.set('name', name.trim());
        if (embedType !== 'popup') params.set('embedType', embedType);
        const query = params.toString() ? `?${params.toString()}` : '';
        setIsOpen(false);
        router.push(`${path}${query}`);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Create Widget
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-zinc-950 border-zinc-800 text-white">
                <DialogHeader>
                    <DialogTitle>Create New Interface</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        {CHATKIT_UI_ENABLED
                            ? 'Choose your interface type and give it a name to get started.'
                            : 'Create your n8n interface and give it a name to get started.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="type" className="text-zinc-300">Interface Type</Label>
                        <div className={`grid gap-4 ${CHATKIT_UI_ENABLED ? 'grid-cols-2' : 'grid-cols-1'}`}>
                            {CHATKIT_UI_ENABLED && (
                            <div
                                className={`cursor-pointer rounded-lg border p-4 hover:bg-zinc-900 transition-colors ${type === 'chatkit' ? 'border-indigo-500 bg-zinc-900 ring-1 ring-indigo-500' : 'border-zinc-800 bg-black'}`}
                                onClick={() => setType('chatkit')}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <Bot className={`h-5 w-5 ${type === 'chatkit' ? 'text-indigo-400' : 'text-zinc-500'}`} />
                                    <span className={`font-medium ${type === 'chatkit' ? 'text-white' : 'text-zinc-400'}`}>ChatKit</span>
                                </div>
                                <p className="text-xs text-zinc-500">Native OpenAI Agent integration with streaming.</p>
                            </div>
                            )}

                            <div
                                className={`cursor-pointer rounded-lg border p-4 hover:bg-zinc-900 transition-colors ${type === 'n8n' ? 'border-blue-500 bg-zinc-900 ring-1 ring-blue-500' : 'border-zinc-800 bg-black'}`}
                                onClick={() => setType('n8n')}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <Webhook className={`h-5 w-5 ${type === 'n8n' ? 'text-blue-400' : 'text-zinc-500'}`} />
                                    <span className={`font-medium ${type === 'n8n' ? 'text-white' : 'text-zinc-400'}`}>N8n</span>
                                </div>
                                <p className="text-xs text-zinc-500">Connect to any N8n workflow via webhooks.</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="name" className="text-zinc-300">Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={type === 'chatkit' && CHATKIT_UI_ENABLED ? "My Support Agent" : "My Workflow Widget"}
                            className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-indigo-500"
                            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label className="text-zinc-300">Embed Type</Label>
                        <div className="grid grid-cols-4 gap-2">
                            {EMBED_OPTIONS.map((option) => {
                                const Icon = option.icon;
                                const isSelected = embedType === option.value;
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => setEmbedType(option.value)}
                                        className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-colors ${
                                            isSelected
                                                ? 'border-indigo-500 bg-zinc-900 ring-1 ring-indigo-500'
                                                : 'border-zinc-800 bg-black hover:bg-zinc-900'
                                        }`}
                                    >
                                        <Icon className={`h-4 w-4 ${isSelected ? 'text-indigo-400' : 'text-zinc-500'}`} />
                                        <span className={`text-xs font-medium ${isSelected ? 'text-white' : 'text-zinc-400'}`}>
                                            {option.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-xs text-zinc-500">
                            {EMBED_OPTIONS.find(o => o.value === embedType)?.description}
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <Button variant="ghost" onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-white hover:bg-zinc-900">
                        Cancel
                    </Button>
                    <Button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                        Create {type === 'chatkit' && CHATKIT_UI_ENABLED ? 'Agent' : 'Widget'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
