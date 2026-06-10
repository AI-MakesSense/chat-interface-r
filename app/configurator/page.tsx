'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, FileText, Webhook } from 'lucide-react';
import { CHATKIT_UI_ENABLED } from '@/lib/feature-flags';

export default function ConfiguratorSelectionPage() {
    const router = useRouter();
    const [chatKitName, setChatKitName] = useState('');
    const [n8nName, setN8nName] = useState('');
    const [displayName, setDisplayName] = useState('');

    const handleCreate = (type: 'chatkit' | 'n8n' | 'display') => {
        const selectedType = !CHATKIT_UI_ENABLED && type === 'chatkit' ? 'n8n' : type;
        const name =
            selectedType === 'chatkit' ? chatKitName :
            selectedType === 'display' ? displayName :
            n8nName;
        const path =
            selectedType === 'chatkit' ? '/configurator/chatkit' :
            selectedType === 'display' ? '/configurator/display' :
            '/configurator/n8n';
        const query = name.trim() ? `?name=${encodeURIComponent(name.trim())}` : '';
        router.push(`${path}${query}`);
    };

    return (
        <div className="container mx-auto py-10 px-4 max-w-5xl">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold tracking-tight mb-4">
                    {CHATKIT_UI_ENABLED ? 'Choose Your Interface' : 'Build Your n8n Widget'}
                </h1>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                    {CHATKIT_UI_ENABLED
                        ? 'Select the type of widget you want to build. Each interface is optimized for specific use cases.'
                        : 'Create and customize an n8n widget for your workflow.'}
                </p>
            </div>

            <div className={`grid gap-8 ${CHATKIT_UI_ENABLED ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
                {/* ChatKit Option */}
                {CHATKIT_UI_ENABLED && (
                <Card className="h-full transition-all duration-300 hover:border-primary hover:shadow-lg bg-card/50 backdrop-blur-sm flex flex-col">
                    <CardHeader>
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                            <Bot className="w-6 h-6 text-primary" />
                        </div>
                        <CardTitle className="text-2xl">ChatKit Interface</CardTitle>
                        <CardDescription className="text-base">
                            Powered by OpenAI Assistants
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                        <ul className="space-y-2 text-muted-foreground mb-6 flex-1">
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                Native OpenAI Agent integration
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                Streaming responses & file uploads
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                Client-side connection architecture
                            </li>
                        </ul>
                        <div className="space-y-3 mt-auto">
                            <Input
                                placeholder="Agent Name (Optional)"
                                value={chatKitName}
                                onChange={(e) => setChatKitName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCreate('chatkit')}
                            />
                            <Button
                                className="w-full"
                                onClick={() => handleCreate('chatkit')}
                            >
                                Build Agent Interface
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                )}

                {/* N8n Option */}
                <Card className="h-full transition-all duration-300 hover:border-blue-500 hover:shadow-lg bg-card/50 backdrop-blur-sm flex flex-col">
                    <CardHeader>
                        <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                            <Webhook className="w-6 h-6 text-blue-500" />
                        </div>
                        <CardTitle className="text-2xl">N8n Interface</CardTitle>
                        <CardDescription className="text-base">
                            Powered by N8n Webhooks
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                        <ul className="space-y-2 text-muted-foreground mb-6 flex-1">
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                Connect to any N8n workflow
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                Full control over logic & data
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                Server-side relay architecture
                            </li>
                        </ul>
                        <div className="space-y-3 mt-auto">
                            <Input
                                placeholder="Widget Name (Optional)"
                                value={n8nName}
                                onChange={(e) => setN8nName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCreate('n8n')}
                            />
                            <Button
                                variant="outline"
                                className="w-full border-blue-500/20 text-blue-500 hover:bg-blue-500 hover:text-white"
                                onClick={() => handleCreate('n8n')}
                            >
                                Build Workflow Interface
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Document Display Option */}
                <Card className="h-full transition-all duration-300 hover:border-emerald-500 hover:shadow-lg bg-card/50 backdrop-blur-sm flex flex-col">
                    <CardHeader>
                        <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4">
                            <FileText className="w-6 h-6 text-emerald-500" />
                        </div>
                        <CardTitle className="text-2xl">Document Display</CardTitle>
                        <CardDescription className="text-base">
                            Auto-load documents from your n8n workflow
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                        <ul className="space-y-2 text-muted-foreground mb-6 flex-1">
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Auto-fires on page load
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Renders documents as clickable cards
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Same n8n payload as chat widget
                            </li>
                        </ul>
                        <div className="space-y-3 mt-auto">
                            <Input
                                placeholder="Widget Name (Optional)"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCreate('display')}
                            />
                            <Button
                                variant="outline"
                                className="w-full border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white"
                                onClick={() => handleCreate('display')}
                            >
                                Build Document Display
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
