'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChatPreview } from '@/components/configurator/chat-preview';
import { PRESET_CONFIGS } from '@/lib/preset-configs';

/**
 * Animated hero preview — cycles through preset widget configs
 * with a smooth crossfade. Non-interactive (pointer-events: none).
 * Responsive: scales the 400×600 ChatPreview to fit the container.
 */
export function HeroPreview() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [scale, setScale] = useState(0.5);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % PRESET_CONFIGS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Responsive scale: fit 400×600 preview inside container
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      const scaleX = width / 400;
      const scaleY = height / 600;
      setScale(Math.min(scaleX, scaleY) * 0.85); // 85% of max to add breathing room
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="relative w-full aspect-[16/9] rounded-xl overflow-hidden">
      {PRESET_CONFIGS.map((config, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-700 ease-in-out"
          style={{
            opacity: i === activeIndex ? 1 : 0,
            pointerEvents: 'none',
          }}
        >
          <div
            className="absolute left-1/2 top-1/2 origin-center"
            style={{
              width: 400,
              height: 600,
              transform: `translate(-50%, -50%) scale(${scale})`,
            }}
          >
            <div className="w-full h-full rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
              <ChatPreview config={config} />
            </div>
          </div>
        </div>
      ))}

      {/* Dot indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {PRESET_CONFIGS.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === activeIndex
                ? 'w-6 bg-white'
                : 'w-2 bg-white/30 hover:bg-white/50'
            }`}
            style={{ pointerEvents: 'auto' }}
            aria-label={`Show preset ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
