'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, Webhook } from 'lucide-react';
import Link from 'next/link';

export default function ConfiguratorSelectionPage() {
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
                <Link href="/configurator/chatkit" className="group">
                    <Card className="h-full transition-all duration-300 hover:border-primary hover:shadow-lg cursor-pointer bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                                <Bot className="w-6 h-6 text-primary" />
                            </div>
                            <CardTitle className="text-2xl">ChatKit Interface</CardTitle>
                            <CardDescription className="text-base">
                                Powered by OpenAI Assistants
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2 text-muted-foreground mb-6">
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
                            <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground">
                                Build Agent Interface
                            </Button>
                        </CardContent>
                    </Card>
                </Link>

                {/* N8n Option */}
                <Link href="/configurator/n8n" className="group">
                    <Card className="h-full transition-all duration-300 hover:border-blue-500 hover:shadow-lg cursor-pointer bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                            <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
                                <Webhook className="w-6 h-6 text-blue-500" />
                            </div>
                            <CardTitle className="text-2xl">N8n Interface</CardTitle>
                            <CardDescription className="text-base">
                                Powered by N8n Webhooks
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2 text-muted-foreground mb-6">
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
                            <Button variant="outline" className="w-full border-blue-500/20 text-blue-500 hover:bg-blue-500 hover:text-white">
                                Build Workflow Interface
                            </Button>
                        </CardContent>
                    </Card>
                </Link>
            </div>
        </div>
    );
}
