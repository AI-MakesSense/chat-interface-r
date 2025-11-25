'use client';

import React, { useState, useRef, useEffect } from 'react';
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

interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export const IconPicker: React.FC<IconPickerProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const SelectedIcon = AVAILABLE_ICONS.find((i) => i.id === value)?.icon || HelpCircle;

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 flex items-center justify-center border border-border rounded bg-background hover:border-muted-foreground transition-colors text-muted-foreground"
      >
        <SelectedIcon size={14} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-[260px] border border-border rounded-lg shadow-xl z-50 p-2 grid grid-cols-6 gap-1 max-h-[200px] overflow-y-auto bg-popover">
          {AVAILABLE_ICONS.map((item) => (
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
      )}
    </div>
  );
};

// Helper to get icon component by name
export const getIconByName = (iconName: string): LucideIcon => {
  return AVAILABLE_ICONS.find((i) => i.id === iconName)?.icon || MessageCircle;
};
