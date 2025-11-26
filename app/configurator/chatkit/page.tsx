'use client';

import React, { useEffect } from 'react';
import { useWidgetStore } from '@/stores/widget-store';
import { ChatKitPreview } from '@/components/configurator/chatkit-preview';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Code, Bot, Palette, MessageSquare, Settings } from 'lucide-react';
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
                // Set some ChatKit-friendly defaults
                greeting: 'Hello! I am your AI assistant.',
                enableAttachments: true,
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
                            <TabsList className="w-full grid grid-cols-4 h-9">
                                <TabsTrigger value="connection" title="Connection"><Bot size={16} /></TabsTrigger>
                                <TabsTrigger value="theme" title="Theme"><Palette size={16} /></TabsTrigger>
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
                                                onClick={() => updateConfig({ themeMode: 'light' })}
                                                className="justify-start"
                                            >
                                                Light
                                            </Button>
                                            <Button
                                                variant={currentConfig.themeMode === 'dark' ? 'default' : 'outline'}
                                                onClick={() => updateConfig({ themeMode: 'dark' })}
                                                className="justify-start"
                                            >
                                                Dark
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Accent Color</Label>
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={currentConfig.useAccent}
                                                onCheckedChange={(checked) => updateConfig({ useAccent: checked })}
                                            />
                                            <span className="text-sm text-muted-foreground">Use custom accent</span>
                                        </div>
                                        {currentConfig.useAccent && (
                                            <div className="flex gap-2 items-center mt-2">
                                                <Input
                                                    type="color"
                                                    value={currentConfig.accentColor || '#0ea5e9'}
                                                    onChange={(e) => updateConfig({ accentColor: e.target.value })}
                                                    className="w-10 h-10 p-1 rounded-md cursor-pointer"
                                                />
                                                <Input
                                                    type="text"
                                                    value={currentConfig.accentColor || '#0ea5e9'}
                                                    onChange={(e) => updateConfig({ accentColor: e.target.value })}
                                                    className="flex-1 font-mono"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Corner Radius</Label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {['none', 'medium', 'pill'].map((r) => (
                                                <Button
                                                    key={r}
                                                    variant={currentConfig.radius === r ? 'default' : 'outline'}
                                                    onClick={() => updateConfig({ radius: r as any })}
                                                    className="capitalize"
                                                >
                                                    {r}
                                                </Button>
                                            ))}
                                        </div>
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
