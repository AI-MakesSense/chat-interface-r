'use client';

import React, { useState, useRef, useEffect } from 'react';
import { WidgetConfig } from '@/stores/widget-store';
import { ChatPreview } from './chat-preview';
import { ChatKitPreview } from './chatkit-preview';
import { ChevronDown, MessageCircle, X, AppWindow, LayoutTemplate } from 'lucide-react';
import { CHATKIT_UI_ENABLED } from '@/lib/feature-flags';

interface PreviewCanvasProps {
  config: WidgetConfig;
  onDimensionsChange?: (width: number, height: number) => void;
}

type EmbedMode = 'inline' | 'full' | 'popup';

interface Dimensions {
  width: number;
  height: number;
}

export const PreviewCanvas: React.FC<PreviewCanvasProps> = ({ config, onDimensionsChange }) => {
  const [size, setSize] = useState<Dimensions>({
    width: config.inlineWidth || 400,
    height: config.inlineHeight || 600,
  });
  const [embedMode, setEmbedMode] = useState<EmbedMode>('inline');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const isDark = config.themeMode === 'dark';

  const resizeRef = useRef<{
    startX: number;
    startY: number;
    startW: number;
    startH: number;
    dir: 'e' | 's' | 'w' | null;
  }>({
    startX: 0,
    startY: 0,
    startW: 0,
    startH: 0,
    dir: null
  });

  // Keep a ref of the latest size so handleMouseUp can read it synchronously
  const sizeRef = useRef<Dimensions>(size);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleModeChange = (mode: EmbedMode) => {
    setEmbedMode(mode);
    setIsDropdownOpen(false);

    // Reset or preset sizes based on mode
    if (mode === 'full') {
      setSize({ width: 1000, height: 700 });
    } else if (mode === 'inline') {
      const w = config.inlineWidth || 400;
      const h = config.inlineHeight || 600;
      const next = { width: w, height: h };
      sizeRef.current = next;
      setSize(next);
    }
  };

  const handleMouseDown = (e: React.MouseEvent, direction: 'e' | 's' | 'w') => {
    e.preventDefault();
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startW: size.width,
      startH: size.height,
      dir: direction
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    const { startX, startY, startW, startH, dir } = resizeRef.current;

    let newWidth = startW;
    let newHeight = startH;

    if (dir === 'e') {
      newWidth = Math.max(300, Math.min(1200, startW + (e.clientX - startX) * 2));
    }
    if (dir === 'w') {
      newWidth = Math.max(300, Math.min(1200, startW + (startX - e.clientX) * 2));
    }
    if (dir === 's') {
      newHeight = Math.max(400, Math.min(900, startH + (e.clientY - startY)));
    }

    const next = { width: newWidth, height: newHeight };
    sizeRef.current = next;
    setSize(next);
  };

  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    // Persist final dimensions to widget config on drag end
    if (onDimensionsChange && (embedMode === 'inline' || embedMode === 'full')) {
      onDimensionsChange(sizeRef.current.width, sizeRef.current.height);
    }
  };

  // Cleanup event listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Determine styles for the launcher button based on config
  const getLauncherStyle = () => {
    if (config.useAccent) {
      return { backgroundColor: config.accentColor || '#0ea5e9', color: '#ffffff' };
    }
    if (config.useCustomSurfaceColors) {
      return {
        backgroundColor: config.surfaceForegroundColor || '#f8fafc',
        color: isDark ? '#e5e5e5' : '#111827'
      };
    }
    return {
      backgroundColor: isDark ? '#ffffff' : '#000000',
      color: isDark ? '#000000' : '#ffffff'
    };
  };

  const launcherStyle = getLauncherStyle();

  // Dynamic classes for PreviewCanvas UI (matching original playground exactly)
  const canvasBg = isDark ? 'bg-[#181818]' : 'bg-[#f9fafb]';
  const pillBg = isDark
    ? 'bg-[#212121] hover:bg-[#2a2a2a] text-[#afafaf] hover:text-[#e5e5e5] border-white/5'
    : 'bg-white hover:bg-gray-50 text-neutral-600 hover:text-neutral-900 border-black/5';
  const dropdownMenuBg = isDark ? 'bg-[#212121] border-white/10' : 'bg-white border-neutral-200';
  const dropdownItemBg = isDark ? 'hover:bg-white/5 text-[#afafaf]' : 'hover:bg-neutral-50 text-neutral-600';
  const dropdownItemActive = isDark ? 'text-white bg-white/5' : 'text-neutral-900 bg-neutral-100';
  const resizeHandle = isDark ? 'bg-white/20' : 'bg-black/10';
  const deviceRing = isDark ? 'ring-white/10' : 'ring-black/5';
  const deviceBg = isDark ? 'bg-[#212121]' : 'bg-white';

  const isChatKit = CHATKIT_UI_ENABLED && config.connection?.provider === 'chatkit';

  return (
    <main
      className={`flex-1 relative overflow-hidden flex flex-col items-center justify-center p-8 transition-colors duration-300 isolate ${canvasBg}`}
    >
      {/* Top Pill / Dropdown */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={`px-4 py-1.5 rounded-full flex items-center gap-2 text-sm font-medium transition-colors border shadow-sm min-w-[160px] justify-between ${pillBg}`}
        >
          <span className="flex items-center gap-2">
            {embedMode === 'inline' && <AppWindow size={14} />}
            {embedMode === 'full' && <LayoutTemplate size={14} />}
            {embedMode === 'popup' && <MessageCircle size={14} />}
            {embedMode === 'inline' ? 'Inline Embed' : embedMode === 'full' ? 'Full Page' : 'Website Chat'}
          </span>
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isDropdownOpen && (
          <div
            className={`absolute top-full left-0 right-0 mt-2 border rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col py-1 ${dropdownMenuBg}`}
          >
            <button
              onClick={() => handleModeChange('inline')}
              className={`flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${embedMode === 'inline' ? dropdownItemActive : dropdownItemBg
                }`}
            >
              <AppWindow size={14} />
              Inline Embed
            </button>
            <button
              onClick={() => handleModeChange('full')}
              className={`flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${embedMode === 'full' ? dropdownItemActive : dropdownItemBg
                }`}
            >
              <LayoutTemplate size={14} />
              Full Page
            </button>
            <button
              onClick={() => handleModeChange('popup')}
              className={`flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${embedMode === 'popup' ? dropdownItemActive : dropdownItemBg
                }`}
            >
              <MessageCircle size={14} />
              Website Chat
            </button>
          </div>
        )}
      </div>

      {/* Widget Container */}

      {/* CASE 1: Inline or Full Page (Resizable Centered Box) */}
      {(embedMode === 'inline' || embedMode === 'full') && (
        <div
          className="relative transition-all duration-300 ease-out"
          style={{
            width: size.width,
            height: size.height,
            maxWidth: '100%',
            maxHeight: '100%'
          }}
        >
          <div
            className={`h-full w-full rounded-[24px] shadow-2xl relative z-10 overflow-hidden ring-1 ${deviceBg} ${deviceRing}`}
          >
            {isChatKit ? (
              <ChatKitPreview config={config} />
            ) : (
              <ChatPreview config={config} />
            )}
          </div>

          {/* Resize Handles */}
          <div
            className="absolute top-0 bottom-0 -left-6 w-6 cursor-ew-resize flex items-center justify-center group z-20"
            onMouseDown={(e) => handleMouseDown(e, 'w')}
          >
            <div
              className={`w-[4px] h-[40px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${resizeHandle}`}
            />
          </div>

          <div
            className="absolute top-0 bottom-0 -right-6 w-6 cursor-ew-resize flex items-center justify-center group z-20"
            onMouseDown={(e) => handleMouseDown(e, 'e')}
          >
            <div
              className={`w-[4px] h-[40px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${resizeHandle}`}
            />
          </div>

          <div
            className="absolute -bottom-6 left-0 right-0 h-6 cursor-ns-resize flex items-center justify-center group z-20"
            onMouseDown={(e) => handleMouseDown(e, 's')}
          >
            <div
              className={`h-[4px] w-[40px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${resizeHandle}`}
            />
          </div>
        </div>
      )}

      {/* CASE 2: Popup / Website Chat (Bottom Right) */}
      {embedMode === 'popup' && (
        <div className="absolute inset-0 pointer-events-none p-6 flex flex-col items-end justify-end z-30">
          {/* Chat Window */}
          <div
            className={`
              pointer-events-auto transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] origin-bottom-right mb-4 rounded-[24px] shadow-2xl ring-1 overflow-hidden ${deviceBg} ${deviceRing}
              ${isPopupOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4 pointer-events-none'}
            `}
            style={{ width: 380, height: 600 }}
          >
            {isChatKit ? (
              <ChatKitPreview config={config} />
            ) : (
              <ChatPreview config={config} />
            )}
          </div>

          {/* Launcher Button */}
          <button
            onClick={() => setIsPopupOpen(!isPopupOpen)}
            className="pointer-events-auto w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 z-40"
            style={launcherStyle}
          >
            <div className="relative w-6 h-6">
              <MessageCircle
                className={`absolute inset-0 w-full h-full transition-all duration-300 ${isPopupOpen ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'
                  }`}
                strokeWidth={2.5}
              />
              <X
                className={`absolute inset-0 w-full h-full transition-all duration-300 ${isPopupOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
                  }`}
                strokeWidth={2.5}
              />
            </div>
          </button>
        </div>
      )}
    </main>
  );
};
