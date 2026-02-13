'use client';

/**
 * Create Widget Modal
 *
 * Streamlined widget creation — name field is prominent, advanced options collapsed.
 * Schema v2.0: No license required, widgets belong directly to users.
 */

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bot, Webhook, Plus, MessageCircle, Layout, Maximize, Link, ChevronDown } from 'lucide-react';
import type { EmbedType } from '@/stores/widget-store';
import { CHATKIT_UI_ENABLED } from '@/lib/feature-flags';

interface CreateWidgetModalProps {
    children?: React.ReactNode;
}

const EMBED_OPTIONS: { value: EmbedType; label: string; icon: React.ElementType }[] = [
    { value: 'popup', label: 'Popup', icon: MessageCircle },
    { value: 'inline', label: 'Inline', icon: Layout },
    { value: 'fullpage', label: 'Fullpage', icon: Maximize },
    { value: 'portal', label: 'Portal', icon: Link },
];

export function CreateWidgetModal({ children }: CreateWidgetModalProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState('');
    const [type, setType] = useState<'chatkit' | 'n8n'>(CHATKIT_UI_ENABLED ? 'chatkit' : 'n8n');
    const [embedType, setEmbedType] = useState<EmbedType>('popup');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-focus name input when modal opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            // Reset on close
            setName('');
            setShowAdvanced(false);
        }
    }, [isOpen]);

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
            <DialogContent className="sm:max-w-[440px] bg-zinc-950 border-zinc-800 text-white">
                <DialogHeader>
                    <DialogTitle className="text-white">Create New Interface</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Give your interface a name to get started.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-2">
                    {/* Name — primary input */}
                    <div className="grid gap-2">
                        <Label htmlFor="name" className="text-zinc-300">Name</Label>
                        <Input
                            ref={inputRef}
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="My Chat Widget"
                            className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-indigo-500 h-11"
                            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                        />
                    </div>

                    {/* Advanced options — collapsed by default */}
                    <button
                        type="button"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors py-1"
                    >
                        <ChevronDown className={`h-3 w-3 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                        Advanced options
                    </button>

                    {showAdvanced && (
                        <div className="grid gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                            {/* Interface Type */}
                            {CHATKIT_UI_ENABLED && (
                                <div className="grid gap-2">
                                    <Label className="text-zinc-300 text-xs">Interface Type</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${type === 'chatkit' ? 'border-indigo-500 bg-zinc-900 ring-1 ring-indigo-500' : 'border-zinc-800 bg-black hover:bg-zinc-900'}`}
                                            onClick={() => setType('chatkit')}
                                        >
                                            <Bot className={`h-4 w-4 ${type === 'chatkit' ? 'text-indigo-400' : 'text-zinc-500'}`} />
                                            <span className={`text-sm font-medium ${type === 'chatkit' ? 'text-white' : 'text-zinc-400'}`}>ChatKit</span>
                                        </button>
                                        <button
                                            type="button"
                                            className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${type === 'n8n' ? 'border-blue-500 bg-zinc-900 ring-1 ring-blue-500' : 'border-zinc-800 bg-black hover:bg-zinc-900'}`}
                                            onClick={() => setType('n8n')}
                                        >
                                            <Webhook className={`h-4 w-4 ${type === 'n8n' ? 'text-blue-400' : 'text-zinc-500'}`} />
                                            <span className={`text-sm font-medium ${type === 'n8n' ? 'text-white' : 'text-zinc-400'}`}>N8n</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Embed Type */}
                            <div className="grid gap-2">
                                <Label className="text-zinc-300 text-xs">Embed Type</Label>
                                <div className="grid grid-cols-4 gap-2">
                                    {EMBED_OPTIONS.map((option) => {
                                        const Icon = option.icon;
                                        const isSelected = embedType === option.value;
                                        return (
                                            <button
                                                key={option.value}
                                                type="button"
                                                onClick={() => setEmbedType(option.value)}
                                                className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border transition-colors ${
                                                    isSelected
                                                        ? 'border-indigo-500 bg-zinc-900 ring-1 ring-indigo-500'
                                                        : 'border-zinc-800 bg-black hover:bg-zinc-900'
                                                }`}
                                            >
                                                <Icon className={`h-4 w-4 ${isSelected ? 'text-indigo-400' : 'text-zinc-500'}`} />
                                                <span className={`text-xs ${isSelected ? 'text-white' : 'text-zinc-400'}`}>
                                                    {option.label}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="ghost" onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-white hover:bg-zinc-900">
                        Cancel
                    </Button>
                    <Button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                        Create
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
