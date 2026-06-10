'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CHATKIT_UI_ENABLED } from '@/lib/feature-flags';
import {
  HelpCircle,
  Box,
  Sparkles,
  PenTool,
  Server,
  Zap,
  Image,
  Terminal,
  Flag,
  Heart,
  MessageCircle,
  Rocket,
  Lightbulb,
  Search,
  Globe,
  Cpu,
  Database,
  Wrench,
  Compass,
  MapPin,
  Camera,
  Mic,
  BookOpen,
  Briefcase,
  Coffee,
  Cloud,
  Shield,
  Bell,
  Calendar,
  Clock,
  Gift,
  CreditCard,
  User,
  Phone,
  LucideIcon
} from 'lucide-react';

export const AVAILABLE_ICONS: { id: string; icon: LucideIcon }[] = [
  { id: 'help', icon: HelpCircle },
  { id: 'box', icon: Box },
  { id: 'sparkles', icon: Sparkles },
  { id: 'pen', icon: PenTool },
  { id: 'server', icon: Server },
  { id: 'zap', icon: Zap },
  { id: 'image', icon: Image },
  { id: 'terminal', icon: Terminal },
  { id: 'flag', icon: Flag },
  { id: 'heart', icon: Heart },
  { id: 'message', icon: MessageCircle },
  { id: 'rocket', icon: Rocket },
  { id: 'lightbulb', icon: Lightbulb },
  { id: 'search', icon: Search },
  { id: 'globe', icon: Globe },
  { id: 'cpu', icon: Cpu },
  { id: 'database', icon: Database },
  { id: 'wrench', icon: Wrench },
  { id: 'compass', icon: Compass },
  { id: 'mapPin', icon: MapPin },
  { id: 'camera', icon: Camera },
  { id: 'mic', icon: Mic },
  { id: 'book', icon: BookOpen },
  { id: 'briefcase', icon: Briefcase },
  { id: 'coffee', icon: Coffee },
  { id: 'cloud', icon: Cloud },
  { id: 'shield', icon: Shield },
  { id: 'bell', icon: Bell },
  { id: 'calendar', icon: Calendar },
  { id: 'clock', icon: Clock },
  { id: 'gift', icon: Gift },
  { id: 'creditCard', icon: CreditCard },
  { id: 'user', icon: User },
  { id: 'phone', icon: Phone },
];

/**
 * ChatKit only renders a fixed set of built-in icons; ids outside this set are
 * dropped from the picker when the active provider is ChatKit. Ids here that
 * map (loosely) to a supported ChatKit glyph stay selectable. Kept as a guard
 * so adding ChatKit-unsupported icons to AVAILABLE_ICONS later won't silently
 * offer an icon ChatKit can't render.
 */
const CHATKIT_SUPPORTED_ICON_IDS = new Set<string>([
  'help', 'box', 'sparkles', 'pen', 'server', 'zap', 'image', 'terminal',
  'flag', 'heart', 'message', 'rocket', 'lightbulb', 'search', 'globe', 'cpu',
  'database', 'wrench', 'compass', 'mapPin', 'camera', 'mic', 'book',
  'briefcase', 'coffee', 'cloud', 'shield', 'bell', 'calendar', 'clock',
  'gift', 'creditCard', 'user', 'phone',
]);

interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
  /** Active connection provider; ChatKit limits the available icon set. */
  provider?: 'chatkit' | 'n8n' | string;
}

interface DropdownPosition {
  top: number;
  left: number;
}

export const IconPicker: React.FC<IconPickerProps> = ({ value, onChange, provider }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<DropdownPosition>({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const SelectedIcon = AVAILABLE_ICONS.find((i) => i.id === value)?.icon || HelpCircle;

  // ChatKit supports only a fixed glyph set; filter the grid when it's active.
  const isChatKit = CHATKIT_UI_ENABLED && provider === 'chatkit';
  const visibleIcons = isChatKit
    ? AVAILABLE_ICONS.filter((i) => CHATKIT_SUPPORTED_ICON_IDS.has(i.id))
    : AVAILABLE_ICONS;

  // Wait for client-side mount for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate optimal dropdown position using fixed positioning
  const calculatePosition = useCallback(() => {
    if (!containerRef.current) return;

    const button = containerRef.current.getBoundingClientRect();
    const dropdownWidth = 260;
    const dropdownHeight = 200;
    const padding = 8;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = button.bottom + 4; // 4px gap below button
    let left = button.left;

    // Horizontal: if dropdown would go off-screen right, align to right edge
    if (left + dropdownWidth + padding > viewportWidth) {
      left = button.right - dropdownWidth;
    }
    // If still off-screen left, align to left edge with padding
    if (left < padding) {
      left = padding;
    }

    // Vertical: if dropdown would go off-screen bottom, position above button
    if (top + dropdownHeight + padding > viewportHeight) {
      top = button.top - dropdownHeight - 4;
    }
    // If still off-screen top, position at top with padding
    if (top < padding) {
      top = padding;
    }

    setPosition({ top, left });
  }, []);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Calculate position when opening
  useEffect(() => {
    if (isOpen) {
      calculatePosition();
    }
  }, [isOpen, calculatePosition]);

  // Close on scroll
  useEffect(() => {
    if (!isOpen) return;
    const handleScroll = () => setIsOpen(false);
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [isOpen]);

  const dropdown = isOpen && mounted && (
    <div
      ref={dropdownRef}
      className="fixed w-[260px] border border-border rounded-lg shadow-xl p-2 grid grid-cols-6 gap-1 max-h-[200px] overflow-y-auto bg-popover animate-in fade-in zoom-in-95 duration-100"
      style={{
        top: position.top,
        left: position.left,
        zIndex: 9999,
      }}
    >
      {visibleIcons.map((item) => (
        <button
          key={item.id}
          onClick={() => {
            onChange(item.id);
            setIsOpen(false);
          }}
          className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
            value === item.id
              ? 'bg-primary/20 text-primary'
              : 'text-muted-foreground hover:bg-muted'
          }`}
          title={item.id}
        >
          <item.icon size={14} />
        </button>
      ))}
    </div>
  );

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 flex items-center justify-center border border-border rounded bg-background hover:border-muted-foreground transition-colors text-muted-foreground"
      >
        <SelectedIcon size={14} />
      </button>

      {mounted && dropdown && createPortal(dropdown, document.body)}
    </div>
  );
};

// Helper to get icon component by name
export const getIconByName = (iconName: string): LucideIcon => {
  return AVAILABLE_ICONS.find((i) => i.id === iconName)?.icon || MessageCircle;
};
