'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, Webhook } from 'lucide-react';

export default function ConfiguratorSelectionPage() {
    const router = useRouter();
    const [chatKitName, setChatKitName] = useState('');
    const [n8nName, setN8nName] = useState('');

    const handleCreate = (type: 'chatkit' | 'n8n') => {
        const name = type === 'chatkit' ? chatKitName : n8nName;
        const path = type === 'chatkit' ? '/configurator/chatkit' : '/configurator/n8n';
        const query = name.trim() ? `?name=${encodeURIComponent(name.trim())}` : '';
        router.push(`${path}${query}`);
    };

    return (
        <div className="container mx-auto py-10 px-4 max-w-5xl">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold tracking-tight mb-4">Choose Your Interface</h1>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                    Select the type of chat widget you want to build. Each interface is optimized for specific use cases.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* ChatKit Option */}
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
            </div>
        </div>
    );
}
