'use client';

import React, { useState, useEffect } from 'react';
import { ChatPreview } from '@/components/configurator/chat-preview';
import { PRESET_CONFIGS } from '@/lib/preset-configs';
import { BRAND_NAME, BRAND_TAGLINE } from '@/lib/brand';
import { MessageSquare } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

/**
 * Split-screen auth layout.
 * Left: brand + form (always visible).
 * Right: cycling ChatPreview showcase (visible at lg+).
 */
export function AuthLayout({ children }: AuthLayoutProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % PRESET_CONFIGS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex bg-black">
      {/* Left — form side */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Brand */}
        <div className="flex items-center gap-2 mb-8">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">{BRAND_NAME}</span>
        </div>

        <p className="text-zinc-400 text-sm mb-8 text-center max-w-xs">{BRAND_TAGLINE}</p>

        {children}
      </div>

      {/* Right — preview showcase (lg+ only) */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-zinc-950 border-l border-white/5 relative overflow-hidden">
        {/* Subtle gradient bg */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5" />

        <div className="relative w-[340px] h-[520px]">
          {PRESET_CONFIGS.map((config, i) => (
            <div
              key={i}
              className="absolute inset-0 transition-opacity duration-700 ease-in-out rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10"
              style={{
                opacity: i === activeIndex ? 1 : 0,
                pointerEvents: 'none',
              }}
            >
              <ChatPreview config={config} />
            </div>
          ))}
        </div>

        {/* Dot indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
          {PRESET_CONFIGS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === activeIndex ? 'w-5 bg-white/60' : 'w-1.5 bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
