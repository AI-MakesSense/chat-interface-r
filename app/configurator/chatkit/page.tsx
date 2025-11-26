'use client';

import React, { useEffect } from 'react';
import { useWidgetStore } from '@/stores/widget-store';
import { ChatKitPreview } from '@/components/configurator/chatkit-preview';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft, Save, Code, Bot, Palette, MessageSquare, Settings, Sliders } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { CodeModal } from '@/components/configurator/code-modal';

export default function ChatKitConfiguratorPage() {
    const { currentConfig, updateConfig, saveConfig, isSaving, currentWidget } = useWidgetStore();
    const [isCodeModalOpen, setIsCodeModalOpen] = React.useState(false);

    // Initialize with ChatKit defaults if needed
    useEffect(() => {
        if (currentConfig.connection?.provider !== 'chatkit') {
            updateConfig({
                connection: {
                    ...currentConfig.connection,
                    provider: 'chatkit',
                },
                greeting: 'How can I help you today?',
                enableAttachments: true,
                // Set ChatKit-specific defaults if not already set
                chatkitGrayscaleHue: currentConfig.chatkitGrayscaleHue ?? 220,
                chatkitGrayscaleTint: currentConfig.chatkitGrayscaleTint ?? 6,
                chatkitGrayscaleShade: currentConfig.chatkitGrayscaleShade ?? (currentConfig.themeMode === 'dark' ? -1 : -4),
                chatkitAccentPrimary: currentConfig.chatkitAccentPrimary ?? (currentConfig.themeMode === 'dark' ? '#f1f5f9' : '#0f172a'),
                chatkitAccentLevel: currentConfig.chatkitAccentLevel ?? 1,
            });
        }
    }, []);

    const handleSave = async () => {
        try {
            await saveConfig();
            toast.success('Configuration saved successfully');
        } catch (error) {
            toast.error('Failed to save configuration');
        }
    };

    return (
        <div className="flex h-screen bg-neutral-50 overflow-hidden">
            {/* Sidebar Configurator */}
            <div className="w-[400px] flex flex-col border-r bg-white h-full shadow-sm z-10">
                {/* Header */}
                <div className="p-4 border-b flex items-center justify-between bg-white shrink-0">
                    <div className="flex items-center gap-3">
                        <Link href="/configurator" className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                            <ArrowLeft size={18} className="text-neutral-600" />
                        </Link>
                        <div>
                            <h1 className="font-semibold text-neutral-900">Agent Builder</h1>
                            <p className="text-xs text-neutral-500">OpenAI ChatKit</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setIsCodeModalOpen(true)}
                            title="Get Code"
                        >
                            <Code size={18} />
                        </Button>
                        <Button
                            size="icon"
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-primary hover:bg-primary/90"
                            title="Save Changes"
                        >
                            <Save size={18} />
                        </Button>
                    </div>
                </div>

                {/* Config Tabs */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <Tabs defaultValue="connection" className="w-full">
                        <div className="px-4 pt-4 sticky top-0 bg-white z-10 pb-2 border-b mb-4">
                            <TabsList className="w-full grid grid-cols-5 h-9">
                                <TabsTrigger value="connection" title="Connection"><Bot size={16} /></TabsTrigger>
                                <TabsTrigger value="theme" title="Theme"><Palette size={16} /></TabsTrigger>
                                <TabsTrigger value="colors" title="Colors"><Sliders size={16} /></TabsTrigger>
                                <TabsTrigger value="start" title="Start Screen"><MessageSquare size={16} /></TabsTrigger>
                                <TabsTrigger value="settings" title="Settings"><Settings size={16} /></TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="px-4 pb-8 space-y-6">
                            {/* Connection Tab */}
                            <TabsContent value="connection" className="space-y-6 mt-0">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>OpenAI Workflow ID</Label>
                                        <Input
                                            placeholder="wf_..."
                                            value={currentConfig.connection?.workflowId || ''}
                                            onChange={(e) => updateConfig({
                                                connection: { ...currentConfig.connection, workflowId: e.target.value }
                                            })}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Found in the OpenAI Agent Builder URL or settings.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>OpenAI API Key</Label>
                                        <Input
                                            type="password"
                                            placeholder="sk-..."
                                            value={currentConfig.connection?.apiKey || ''}
                                            onChange={(e) => updateConfig({
                                                connection: { ...currentConfig.connection, apiKey: e.target.value }
                                            })}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Used securely on the server to create sessions. Never exposed to the client.
                                        </p>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Theme Tab */}
                            <TabsContent value="theme" className="space-y-6 mt-0">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Theme Mode</Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Button
                                                variant={currentConfig.themeMode === 'light' ? 'default' : 'outline'}
                                                onClick={() => updateConfig({
                                                    themeMode: 'light',
                                                    chatkitGrayscaleShade: -4,
                                                    chatkitAccentPrimary: '#0f172a',
                                                })}
                                                className="justify-start"
                                            >
                                                Light
                                            </Button>
                                            <Button
                                                variant={currentConfig.themeMode === 'dark' ? 'default' : 'outline'}
                                                onClick={() => updateConfig({
                                                    themeMode: 'dark',
                                                    chatkitGrayscaleShade: -1,
                                                    chatkitAccentPrimary: '#f1f5f9',
                                                })}
                                                className="justify-start"
                                            >
                                                Dark
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Font Family</Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                'System',
                                                'OpenAI Sans',
                                                'Space Grotesk',
                                                'Inter',
                                            ].map((font) => (
                                                <Button
                                                    key={font}
                                                    variant={currentConfig.fontFamily === font ? 'default' : 'outline'}
                                                    onClick={() => updateConfig({ fontFamily: font })}
                                                    className="justify-start text-xs truncate"
                                                    title={font}
                                                >
                                                    {font}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Density</Label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { value: 'compact', label: 'Compact' },
                                                { value: 'default', label: 'Default' },
                                                { value: 'spacious', label: 'Spacious' },
                                            ].map((d) => (
                                                <Button
                                                    key={d.value}
                                                    variant={currentConfig.density === d.value ? 'default' : 'outline'}
                                                    onClick={() => updateConfig({ density: d.value as any })}
                                                    className="capitalize text-xs"
                                                >
                                                    {d.label}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Corner Radius</Label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {[
                                                { value: 'sharp', label: 'Sharp' },
                                                { value: 'soft', label: 'Soft' },
                                                { value: 'round', label: 'Round' },
                                                { value: 'pill', label: 'Pill' },
                                            ].map((r) => (
                                                <Button
                                                    key={r.value}
                                                    variant={currentConfig.radius === r.value ? 'default' : 'outline'}
                                                    onClick={() => updateConfig({ radius: r.value as any })}
                                                    className="capitalize text-xs"
                                                >
                                                    {r.label}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Colors Tab - Advanced Color System */}
                            <TabsContent value="colors" className="space-y-6 mt-0">
                                <div className="space-y-6">
                                    {/* Grayscale Hue */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label>Grayscale Hue</Label>
                                            <span className="text-xs text-muted-foreground font-mono">
                                                {currentConfig.chatkitGrayscaleHue ?? 220}°
                                            </span>
                                        </div>
                                        <Slider
                                            value={[currentConfig.chatkitGrayscaleHue ?? 220]}
                                            onValueChange={([value]) => updateConfig({ chatkitGrayscaleHue: value })}
                                            min={0}
                                            max={360}
                                            step={1}
                                            className="w-full"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Adjusts the color tone of gray UI elements (0-360°)
                                        </p>
                                    </div>

                                    {/* Grayscale Tint */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label>Grayscale Tint</Label>
                                            <span className="text-xs text-muted-foreground font-mono">
                                                {currentConfig.chatkitGrayscaleTint ?? 6}
                                            </span>
                                        </div>
                                        <Slider
                                            value={[currentConfig.chatkitGrayscaleTint ?? 6]}
                                            onValueChange={([value]) => updateConfig({ chatkitGrayscaleTint: value })}
                                            min={0}
                                            max={20}
                                            step={1}
                                            className="w-full"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Color saturation level for grayscale elements
                                        </p>
                                    </div>

                                    {/* Grayscale Shade */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label>Grayscale Shade</Label>
                                            <span className="text-xs text-muted-foreground font-mono">
                                                {currentConfig.chatkitGrayscaleShade ?? -1}
                                            </span>
                                        </div>
                                        <Slider
                                            value={[currentConfig.chatkitGrayscaleShade ?? -1]}
                                            onValueChange={([value]) => updateConfig({ chatkitGrayscaleShade: value })}
                                            min={-10}
                                            max={10}
                                            step={1}
                                            className="w-full"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Brightness adjustment for grayscale elements
                                        </p>
                                    </div>

                                    <div className="border-t pt-4" />

                                    {/* Accent Color */}
                                    <div className="space-y-3">
                                        <Label>Accent Color</Label>
                                        <div className="flex gap-2 items-center">
                                            <Input
                                                type="color"
                                                value={currentConfig.chatkitAccentPrimary || '#0f172a'}
                                                onChange={(e) => updateConfig({ chatkitAccentPrimary: e.target.value })}
                                                className="w-14 h-10 p-1 rounded-md cursor-pointer"
                                            />
                                            <Input
                                                type="text"
                                                value={currentConfig.chatkitAccentPrimary || '#0f172a'}
                                                onChange={(e) => updateConfig({ chatkitAccentPrimary: e.target.value })}
                                                className="flex-1 font-mono text-sm"
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Primary accent color for interactive elements
                                        </p>
                                    </div>

                                    {/* Accent Level */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label>Accent Intensity</Label>
                                            <span className="text-xs text-muted-foreground font-mono">
                                                Level {currentConfig.chatkitAccentLevel ?? 1}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[1, 2, 3].map((level) => (
                                                <Button
                                                    key={level}
                                                    variant={currentConfig.chatkitAccentLevel === level ? 'default' : 'outline'}
                                                    onClick={() => updateConfig({ chatkitAccentLevel: level })}
                                                    className="text-xs"
                                                >
                                                    Level {level}
                                                </Button>
                                            ))}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Intensity of the accent color application (1-3)
                                        </p>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Start Screen Tab */}
                            <TabsContent value="start" className="space-y-6 mt-0">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Greeting Message</Label>
                                        <Input
                                            value={currentConfig.greeting || ''}
                                            onChange={(e) => updateConfig({ greeting: e.target.value })}
                                            placeholder="How can I help you today?"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            First message users see when opening the chat
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Input Placeholder</Label>
                                        <Input
                                            value={currentConfig.placeholder || ''}
                                            onChange={(e) => updateConfig({ placeholder: e.target.value })}
                                            placeholder="Ask anything..."
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Placeholder text in the message input field
                                        </p>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Settings Tab */}
                            <TabsContent value="settings" className="space-y-6 mt-0">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>File Uploads</Label>
                                            <p className="text-xs text-muted-foreground">Allow users to upload files</p>
                                        </div>
                                        <Switch
                                            checked={currentConfig.enableAttachments}
                                            onCheckedChange={(checked) => updateConfig({ enableAttachments: checked })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Custom CSS</Label>
                                        <textarea
                                            className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                                            placeholder=".chatkit-container { ... }"
                                            value={currentConfig.customCss || ''}
                                            onChange={(e) => updateConfig({ customCss: e.target.value })}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Inject custom CSS styles into the widget container.
                                        </p>
                                    </div>
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>
            </div>

            {/* Preview Area */}
            <div className="flex-1 bg-neutral-100 p-8 flex items-center justify-center overflow-hidden relative">
                <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-50" />

                <div className="w-full max-w-[400px] h-[700px] relative z-10 shadow-2xl rounded-xl overflow-hidden border border-neutral-200 bg-white">
                    <ChatKitPreview config={currentConfig} />
                </div>
            </div>

            <CodeModal
                isOpen={isCodeModalOpen}
                onClose={() => setIsCodeModalOpen(false)}
                config={currentConfig}
                licenseKey={currentWidget?.licenseKey}
            />
        </div>
    );
}
