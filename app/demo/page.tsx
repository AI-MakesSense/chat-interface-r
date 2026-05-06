'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, MessageSquare } from 'lucide-react';
import { ChatPreview } from '@/components/configurator/chat-preview';
import { PRESET_CONFIGS } from '@/lib/preset-configs';
import { BRAND_NAME } from '@/lib/brand';
import { Button } from '@/components/ui/button';

const PRESET_LABELS = ['Indigo', 'Cyber', 'Warm', 'Purple'];

export default function DemoPage() {
    const [activeIndex, setActiveIndex] = useState(0);
    const config = PRESET_CONFIGS[activeIndex];

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Header */}
            <header className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <MessageSquare className="h-5 w-5 text-white" />
                        </div>
                        <span className="font-bold text-lg tracking-tight">{BRAND_NAME}</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <Link href="/auth/login">
                            <Button variant="ghost" className="text-zinc-400 hover:text-white hover:bg-white/10 text-sm">
                                Sign In
                            </Button>
                        </Link>
                        <Link href="/auth/signup">
                            <Button className="bg-indigo-600 hover:bg-indigo-700 text-sm">
                                Get Started
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-6 py-16">
                {/* Title */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold tracking-tight mb-4 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                        See it in action
                    </h1>
                    <p className="text-lg text-zinc-400 max-w-xl mx-auto">
                        Switch between themes to see how your chat widget can look. Every element is customizable in the configurator.
                    </p>
                </div>

                {/* Theme switcher */}
                <div className="flex justify-center gap-2 mb-10">
                    {PRESET_LABELS.map((label, i) => (
                        <button
                            key={i}
                            onClick={() => setActiveIndex(i)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                i === activeIndex
                                    ? 'bg-white text-black'
                                    : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* Preview */}
                <div className="flex justify-center mb-16">
                    <div className="w-full max-w-[400px] aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 transition-all duration-500">
                        <ChatPreview config={config} />
                    </div>
                </div>

                {/* CTA */}
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Ready to build your own?</h2>
                    <p className="text-zinc-400 mb-8 max-w-md mx-auto">
                        Create a free account and start customizing your chat widget in minutes.
                    </p>
                    <Link href="/auth/signup">
                        <Button size="lg" className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 border-0 gap-2">
                            Create Your Widget
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </main>
        </div>
    );
}
