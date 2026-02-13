'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Save, RotateCcw } from 'lucide-react';
import { WidgetConfig, StarterPrompt } from '@/stores/widget-store';
import {
  // Communication
  MessageCircle,
  Mail,
  Phone,
  Send,
  AtSign,
  MessageSquare,
  MessagesSquare,
  // General
  HelpCircle,
  Info,
  AlertCircle,
  CheckCircle,
  XCircle,
  // Objects
  Box,
  Gift,
  ShoppingCart,
  ShoppingBag,
  Package,
  // Creative
  Sparkles,
  Wand2,
  Palette,
  PenTool,
  Pencil,
  Edit3,
  // Tech
  Server,
  Cpu,
  Database,
  Terminal,
  Code,
  Code2,
  Braces,
  FileCode,
  // Energy/Action
  Zap,
  Rocket,
  Target,
  TrendingUp,
  Activity,
  Play,
  // Media
  Image,
  Camera,
  Video,
  Music,
  Mic,
  Film,
  // Navigation
  Compass,
  MapPin,
  Map,
  Navigation,
  Home,
  Building,
  Building2,
  // Nature/Weather
  Sun,
  Moon,
  Cloud,
  CloudRain,
  Leaf,
  Flower2,
  Trees,
  // People
  User,
  Users,
  UserPlus,
  UserCheck,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Smile,
  // Time
  Calendar,
  Clock,
  Timer,
  History,
  // Business
  Briefcase,
  CreditCard,
  DollarSign,
  PiggyBank,
  Receipt,
  FileText,
  // Tools
  Wrench,
  Settings,
  Cog,
  SlidersHorizontal,
  Filter,
  // Security
  Shield,
  Lock,
  Key,
  Eye,
  EyeOff,
  // Learning
  BookOpen,
  GraduationCap,
  Library,
  Lightbulb,
  Brain,
  // Web
  Globe,
  Link,
  ExternalLink,
  Share2,
  Wifi,
  // Files
  File,
  Folder,
  FolderOpen,
  Download,
  Upload,
  // Misc
  Bell,
  Flag,
  Star,
  Award,
  Crown,
  Flame,
  Coffee,
  Search,
  LucideIcon
} from 'lucide-react';
import { CHATKIT_UI_ENABLED } from '@/lib/feature-flags';

interface ConfigSidebarProps {
  config: WidgetConfig;
  onChange: (config: WidgetConfig) => void;
  onOpenCode: () => void;
  onReset?: () => void;
  widgetName?: string;
  /** Lock provider selection - used when navigating from /configurator/chatkit or /configurator/n8n */
  lockedProvider?: 'chatkit' | 'n8n';
}

const FONT_OPTIONS = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Poppins',
  'Space Grotesk',
  'Comfortaa',
  'Bricolage Grotesque',
  'OpenAI Sans',
  'System'
];

const RADIUS_OPTIONS = ['none', 'small', 'medium', 'large', 'pill'] as const;
const DENSITY_OPTIONS = ['compact', 'normal', 'spacious'] as const;

// Help Icon SVG
const HelpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" height="1em" fill="currentColor" viewBox="0 0 24 24" style={{ width: 14, height: 14, opacity: 0.4 }}>
    <path d="M13 12a1 1 0 1 0-2 0v4a1 1 0 1 0 2 0v-4Zm-1-2.5A1.25 1.25 0 1 0 12 7a1.25 1.25 0 0 0 0 2.5Z"></path>
    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2ZM4 12a8 8 0 1 1 16 0 8 8 0 0 1-16 0Z" clipRule="evenodd"></path>
  </svg>
);

// Section component
const Section = ({ children, className = '', isDark }: { children?: React.ReactNode; className?: string; isDark: boolean }) => (
  <div className={`p-4 border-b ${isDark ? 'border-[#ffffff0f]' : 'border-neutral-100'} ${className}`}>{children}</div>
);

// Row component
const Row = ({ children, className = '' }: { children?: React.ReactNode; className?: string }) => (
  <div className={`flex items-center justify-between gap-3 ${className}`}>{children}</div>
);

// Label component with help icon
const Label = ({ children, icon = true, isDark }: { children?: React.ReactNode; icon?: boolean; isDark: boolean }) => (
  <div className={`flex items-center font-semibold text-sm cursor-pointer select-none ${isDark ? 'text-[#e5e5e5]' : 'text-neutral-900'}`}>
    {children}
    {icon && <div className={`ml-2 flex items-center ${isDark ? 'text-[#dcdcdc]' : 'text-neutral-400'}`}><HelpIcon /></div>}
  </div>
);

// Toggle component
const Toggle = ({ checked, onChange, isDark }: { checked: boolean; onChange: (v: boolean) => void; isDark: boolean }) => (
  <button
    onClick={() => onChange(!checked)}
    className={`relative w-8 h-[19px] rounded-full transition-colors duration-200 ease-in-out ${checked ? (isDark ? 'bg-[#0285FF]' : 'bg-blue-600') : (isDark ? 'bg-[#414141]' : 'bg-neutral-200')
      }`}
  >
    <span
      className={`absolute top-[2px] left-[2px] w-[15px] h-[15px] bg-white rounded-full shadow-sm transition-transform duration-200 ease-in-out ${checked ? 'translate-x-[13px]' : 'translate-x-0'
        }`}
    />
  </button>
);

// Slider component (matches original playground layout exactly)
const Slider = ({ value, max, onChange, gradient = false, isDark }: {
  value: number;
  max: number;
  onChange: (v: number) => void;
  gradient?: boolean;
  isDark: boolean;
}) => {
  const percentage = (value / max) * 100;
  return (
    <div className="flex-1 h-6 flex items-center group relative">
      <input
        type="range"
        min="0"
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />
      <div
        className="w-full h-1 rounded-full relative"
        style={{
          background: gradient
            ? 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)'
            : (isDark ? '#404040' : '#e5e7eb')
        }}
      >
        {!gradient && (
          <div
            className={`absolute top-0 left-0 h-full rounded-full ${isDark ? 'bg-[#e5e5e5]' : 'bg-neutral-800'}`}
            style={{ width: `${percentage}%` }}
          />
        )}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md border border-black/10 transition-transform duration-100 ease-out"
          style={{ left: `calc(${percentage}% - 8px)` }}
        />
      </div>
    </div>
  );
};

// Select display component
const SelectValue = ({ value, isDark }: { value: string | number; isDark: boolean }) => (
  <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-[#afafaf]' : 'text-neutral-500'}`}>
    <span className="truncate max-w-[100px]">{value}</span>
    <div className="rotate-180 opacity-75">
      <svg width="8" height="12" viewBox="0 0 10 16" fill="currentColor">
        <path fillRule="evenodd" clipRule="evenodd" d="M4.34151 0.747423C4.71854 0.417526 5.28149 0.417526 5.65852 0.747423L9.65852 4.24742C10.0742 4.61111 10.1163 5.24287 9.75259 5.6585C9.38891 6.07414 8.75715 6.11626 8.34151 5.75258L5.00001 2.82877L1.65852 5.75258C1.24288 6.11626 0.61112 6.07414 0.247438 5.6585C-0.116244 5.24287 -0.0741267 4.61111 0.34151 4.24742L4.34151 0.747423ZM0.246065 10.3578C0.608879 9.94139 1.24055 9.89795 1.65695 10.2608L5.00001 13.1737L8.34308 10.2608C8.75948 9.89795 9.39115 9.94139 9.75396 10.3578C10.1168 10.7742 10.0733 11.4058 9.65695 11.7687L5.65695 15.2539C5.28043 15.582 4.7196 15.582 4.34308 15.2539L0.343082 11.7687C-0.0733128 11.4058 -0.116749 10.7742 0.246065 10.3578Z" />
      </svg>
    </div>
  </div>
);

// Input component - MUST be outside ConfigSidebar to prevent re-creation on each render
const SidebarInput = ({ isDark, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { isDark: boolean }) => (
  <input
    {...props}
    className={`bg-transparent border rounded-md px-2 py-1 text-sm focus:outline-none focus:border-blue-500 transition-colors ${isDark ? 'text-[#e5e5e5] border-[#ffffff1a]' : 'text-neutral-900 border-neutral-200'} ${props.className || ''}`}
  />
);

// Color Picker component - MUST be outside ConfigSidebar to prevent re-creation on each render
const ColorPicker = ({ label, value, onColorChange, isDark }: { label: string; value: string; onColorChange: (v: string) => void; isDark: boolean }) => (
  <Row>
    <div className={isDark ? 'text-[#afafaf]' : 'text-neutral-500'}>{label}</div>
    <div className="flex items-center gap-2">
      <div className="relative flex items-center justify-center">
        <div
          className={`w-6 h-6 rounded-[4px] border shadow-sm ${isDark ? 'border-white/10' : 'border-black/10'}`}
          style={{ backgroundColor: value }}
        />
        <input
          type="color"
          value={value}
          onChange={(e) => onColorChange(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        />
      </div>
      <SidebarInput
        type="text"
        value={value}
        onChange={(e) => onColorChange(e.target.value)}
        className="w-24 uppercase"
        isDark={isDark}
      />
    </div>
  </Row>
);

// Icon Picker with categorized icons for better UX
interface IconCategory {
  label: string;
  icons: { id: string; icon: LucideIcon; label: string }[];
}

const ICON_CATEGORIES: IconCategory[] = [
  {
    label: 'Popular',
    icons: [
      { id: 'sparkles', icon: Sparkles, label: 'Sparkles' },
      { id: 'message', icon: MessageCircle, label: 'Message' },
      { id: 'lightbulb', icon: Lightbulb, label: 'Idea' },
      { id: 'rocket', icon: Rocket, label: 'Rocket' },
      { id: 'zap', icon: Zap, label: 'Zap' },
      { id: 'star', icon: Star, label: 'Star' },
      { id: 'heart', icon: Heart, label: 'Heart' },
      { id: 'search', icon: Search, label: 'Search' },
    ]
  },
  {
    label: 'Communication',
    icons: [
      { id: 'messageSquare', icon: MessageSquare, label: 'Chat' },
      { id: 'messagesSquare', icon: MessagesSquare, label: 'Conversation' },
      { id: 'mail', icon: Mail, label: 'Email' },
      { id: 'phone', icon: Phone, label: 'Phone' },
      { id: 'send', icon: Send, label: 'Send' },
      { id: 'atSign', icon: AtSign, label: 'Mention' },
    ]
  },
  {
    label: 'Actions',
    icons: [
      { id: 'target', icon: Target, label: 'Target' },
      { id: 'trendingUp', icon: TrendingUp, label: 'Growth' },
      { id: 'activity', icon: Activity, label: 'Activity' },
      { id: 'play', icon: Play, label: 'Play' },
      { id: 'wand', icon: Wand2, label: 'Magic' },
      { id: 'flame', icon: Flame, label: 'Fire' },
    ]
  },
  {
    label: 'Tech',
    icons: [
      { id: 'code', icon: Code2, label: 'Code' },
      { id: 'terminal', icon: Terminal, label: 'Terminal' },
      { id: 'server', icon: Server, label: 'Server' },
      { id: 'cpu', icon: Cpu, label: 'CPU' },
      { id: 'database', icon: Database, label: 'Database' },
      { id: 'braces', icon: Braces, label: 'API' },
      { id: 'fileCode', icon: FileCode, label: 'Script' },
      { id: 'globe', icon: Globe, label: 'Web' },
      { id: 'wifi', icon: Wifi, label: 'Network' },
    ]
  },
  {
    label: 'Creative',
    icons: [
      { id: 'pen', icon: PenTool, label: 'Design' },
      { id: 'pencil', icon: Pencil, label: 'Write' },
      { id: 'edit', icon: Edit3, label: 'Edit' },
      { id: 'palette', icon: Palette, label: 'Colors' },
      { id: 'image', icon: Image, label: 'Image' },
      { id: 'camera', icon: Camera, label: 'Camera' },
      { id: 'video', icon: Video, label: 'Video' },
      { id: 'music', icon: Music, label: 'Audio' },
      { id: 'mic', icon: Mic, label: 'Mic' },
      { id: 'film', icon: Film, label: 'Film' },
    ]
  },
  {
    label: 'Business',
    icons: [
      { id: 'briefcase', icon: Briefcase, label: 'Work' },
      { id: 'creditCard', icon: CreditCard, label: 'Payment' },
      { id: 'dollar', icon: DollarSign, label: 'Money' },
      { id: 'piggyBank', icon: PiggyBank, label: 'Savings' },
      { id: 'receipt', icon: Receipt, label: 'Receipt' },
      { id: 'fileText', icon: FileText, label: 'Document' },
      { id: 'shoppingCart', icon: ShoppingCart, label: 'Cart' },
      { id: 'shoppingBag', icon: ShoppingBag, label: 'Shop' },
    ]
  },
  {
    label: 'Learning',
    icons: [
      { id: 'book', icon: BookOpen, label: 'Book' },
      { id: 'graduationCap', icon: GraduationCap, label: 'Education' },
      { id: 'library', icon: Library, label: 'Library' },
      { id: 'brain', icon: Brain, label: 'AI/Think' },
    ]
  },
  {
    label: 'People',
    icons: [
      { id: 'user', icon: User, label: 'User' },
      { id: 'users', icon: Users, label: 'Team' },
      { id: 'userPlus', icon: UserPlus, label: 'Add User' },
      { id: 'userCheck', icon: UserCheck, label: 'Verified' },
      { id: 'smile', icon: Smile, label: 'Happy' },
      { id: 'thumbsUp', icon: ThumbsUp, label: 'Like' },
      { id: 'thumbsDown', icon: ThumbsDown, label: 'Dislike' },
    ]
  },
  {
    label: 'Navigation',
    icons: [
      { id: 'compass', icon: Compass, label: 'Explore' },
      { id: 'mapPin', icon: MapPin, label: 'Location' },
      { id: 'map', icon: Map, label: 'Map' },
      { id: 'navigation', icon: Navigation, label: 'Navigate' },
      { id: 'home', icon: Home, label: 'Home' },
      { id: 'building', icon: Building2, label: 'Office' },
    ]
  },
  {
    label: 'Time',
    icons: [
      { id: 'calendar', icon: Calendar, label: 'Date' },
      { id: 'clock', icon: Clock, label: 'Time' },
      { id: 'timer', icon: Timer, label: 'Timer' },
      { id: 'history', icon: History, label: 'History' },
    ]
  },
  {
    label: 'Tools',
    icons: [
      { id: 'wrench', icon: Wrench, label: 'Tools' },
      { id: 'settings', icon: Settings, label: 'Settings' },
      { id: 'cog', icon: Cog, label: 'Config' },
      { id: 'sliders', icon: SlidersHorizontal, label: 'Adjust' },
      { id: 'filter', icon: Filter, label: 'Filter' },
    ]
  },
  {
    label: 'Security',
    icons: [
      { id: 'shield', icon: Shield, label: 'Secure' },
      { id: 'lock', icon: Lock, label: 'Lock' },
      { id: 'key', icon: Key, label: 'Key' },
      { id: 'eye', icon: Eye, label: 'View' },
      { id: 'eyeOff', icon: EyeOff, label: 'Hide' },
    ]
  },
  {
    label: 'Status',
    icons: [
      { id: 'help', icon: HelpCircle, label: 'Help' },
      { id: 'info', icon: Info, label: 'Info' },
      { id: 'alert', icon: AlertCircle, label: 'Warning' },
      { id: 'check', icon: CheckCircle, label: 'Success' },
      { id: 'x', icon: XCircle, label: 'Error' },
      { id: 'bell', icon: Bell, label: 'Notify' },
    ]
  },
  {
    label: 'Nature',
    icons: [
      { id: 'sun', icon: Sun, label: 'Sun' },
      { id: 'moon', icon: Moon, label: 'Moon' },
      { id: 'cloud', icon: Cloud, label: 'Cloud' },
      { id: 'cloudRain', icon: CloudRain, label: 'Rain' },
      { id: 'leaf', icon: Leaf, label: 'Eco' },
      { id: 'flower', icon: Flower2, label: 'Flower' },
      { id: 'tree', icon: Trees, label: 'Nature' },
    ]
  },
  {
    label: 'Objects',
    icons: [
      { id: 'box', icon: Box, label: 'Box' },
      { id: 'gift', icon: Gift, label: 'Gift' },
      { id: 'package', icon: Package, label: 'Package' },
      { id: 'coffee', icon: Coffee, label: 'Coffee' },
      { id: 'flag', icon: Flag, label: 'Flag' },
      { id: 'award', icon: Award, label: 'Award' },
      { id: 'crown', icon: Crown, label: 'Premium' },
    ]
  },
  {
    label: 'Files',
    icons: [
      { id: 'file', icon: File, label: 'File' },
      { id: 'folder', icon: Folder, label: 'Folder' },
      { id: 'folderOpen', icon: FolderOpen, label: 'Open' },
      { id: 'download', icon: Download, label: 'Download' },
      { id: 'upload', icon: Upload, label: 'Upload' },
      { id: 'link', icon: Link, label: 'Link' },
      { id: 'share', icon: Share2, label: 'Share' },
      { id: 'externalLink', icon: ExternalLink, label: 'External' },
    ]
  },
];

// Flat list for lookups
const ALL_ICONS = ICON_CATEGORIES.flatMap(cat => cat.icons);

// ChatKit only supports these 23 icons - map our icon IDs to the ones that work
const CHATKIT_SUPPORTED_ICON_IDS = new Set([
  // Direct matches
  'sparkle', 'sparkles', 'lightbulb', 'mail', 'phone', 'calendar', 'globe',
  'search', 'star', 'check', 'info', 'compass', 'mapPin', 'user', 'bug',
  // Icons that map to supported ChatKit icons
  'message', 'messageSquare', 'messagesSquare', 'send', 'atSign', // → sparkle/mail
  'rocket', 'zap', 'play', 'flame', 'bolt', // → bolt
  'heart', 'award', 'crown', // → star
  'target', 'map', 'navigation', // → compass
  'trendingUp', 'activity', 'dollar', 'piggyBank', 'chart', // → chart
  'code', 'terminal', 'server', 'cpu', 'database', 'braces', 'wrench',
  'settings', 'cog', 'sliders', 'box', 'gift', 'package', 'shoppingCart',
  'shoppingBag', 'cube', // → cube
  'fileCode', 'receipt', 'fileText', 'file', 'folder', 'folderOpen',
  'download', 'upload', 'document', // → document
  'wifi', 'cloud', 'cloudRain', 'link', 'share', 'externalLink', // → globe
  'pen', 'pencil', 'edit', 'write', // → write
  'book', 'graduationCap', 'library', // → book-open
  'brain', // → lightbulb
  'users', 'userPlus', 'userCheck', 'smile', // → user
  'thumbsUp', // → check
  'thumbsDown', 'help', 'alert', 'x', 'bell', 'flag', // → info
  'filter', 'eye', 'eyeOff', // → search
  'creditCard', 'shield', 'lock', 'key', 'keys', // → keys
  'briefcase', 'home', 'building', 'profile', // → profile
  'clock', 'timer', 'history', // → calendar
  'wand', 'palette', 'image', 'camera', 'video', 'music', 'film',
  'sun', 'moon', 'leaf', 'flower', 'tree', 'coffee', // → sparkle
  'mic', // → phone
  'notebook', // → notebook
]);

const IconPicker = ({ value, onChange, isDark, provider }: { value: string; onChange: (val: string) => void; isDark: boolean; provider?: 'chatkit' | 'n8n' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const SelectedIcon = ALL_ICONS.find(i => i.id === value)?.icon || MessageCircle;
  const selectedLabel = ALL_ICONS.find(i => i.id === value)?.label || 'Select icon';

  // Mount state for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate position when opening
  const calculatePosition = useCallback(() => {
    if (!containerRef.current) return;

    const button = containerRef.current.getBoundingClientRect();
    const dropdownWidth = 320;
    const dropdownHeight = 400;
    const padding = 8;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Position to the right of the button, or left if not enough space
    let left = button.right + 8;
    if (left + dropdownWidth + padding > viewportWidth) {
      // Try left side
      left = button.left - dropdownWidth - 8;
      if (left < padding) {
        // Fallback: align with right edge of viewport
        left = viewportWidth - dropdownWidth - padding;
      }
    }

    // Vertical: align top with button, adjust if near bottom
    let top = button.top;
    if (top + dropdownHeight + padding > viewportHeight) {
      top = viewportHeight - dropdownHeight - padding;
    }
    if (top < padding) {
      top = padding;
    }

    setPosition({ top, left });
  }, []);

  useEffect(() => {
    if (isOpen) {
      calculatePosition();
    }
  }, [isOpen, calculatePosition]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm('');
        setActiveCategory(null);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      // Small delay to ensure portal is rendered
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Filter icons based on provider (ChatKit has limited icon support)
  const isChatKit = CHATKIT_UI_ENABLED && provider === 'chatkit';
  const filterByProvider = (icons: typeof ALL_ICONS) =>
    isChatKit ? icons.filter(icon => CHATKIT_SUPPORTED_ICON_IDS.has(icon.id)) : icons;

  // Filter categories for ChatKit - only show categories that have supported icons
  const availableCategories = isChatKit
    ? ICON_CATEGORIES.map(cat => ({
        ...cat,
        icons: cat.icons.filter(icon => CHATKIT_SUPPORTED_ICON_IDS.has(icon.id))
      })).filter(cat => cat.icons.length > 0)
    : ICON_CATEGORIES;

  const availableIcons = filterByProvider(ALL_ICONS);

  // Filter icons by search term
  const filteredCategories = searchTerm
    ? [{
        label: 'Search Results',
        icons: availableIcons.filter(icon =>
          icon.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          icon.id.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }]
    : activeCategory
      ? availableCategories.filter(cat => cat.label === activeCategory)
      : availableCategories;

  const buttonClass = isDark
    ? 'bg-[#2a2a2a] border-[#ffffff1a] hover:border-white/40 text-[#afafaf]'
    : 'bg-white border-neutral-200 hover:border-neutral-400 text-neutral-500';

  const dropdownClass = isDark
    ? 'bg-[#1a1a1a] border-[#ffffff1a]'
    : 'bg-white border-neutral-200';

  const itemClass = (isSelected: boolean) => isDark
    ? (isSelected ? 'bg-blue-500/30 text-blue-400 ring-1 ring-blue-500/50' : 'text-[#afafaf] hover:bg-white/10 hover:text-white')
    : (isSelected ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200' : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700');

  const categoryClass = (isActive: boolean) => isDark
    ? (isActive ? 'bg-white/20 text-white' : 'text-[#888] hover:text-white hover:bg-white/10')
    : (isActive ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50');

  const dropdown = isOpen && mounted && (
    <div
      ref={dropdownRef}
      className={`fixed w-[320px] border rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 ${dropdownClass}`}
      style={{
        top: position.top,
        left: position.left,
        zIndex: 9999,
      }}
    >
      {/* Search bar */}
      <div className={`p-2 border-b ${isDark ? 'border-white/10' : 'border-neutral-100'}`}>
        <div className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${isDark ? 'bg-white/5' : 'bg-neutral-50'}`}>
          <Search size={14} className={isDark ? 'text-[#666]' : 'text-neutral-400'} />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search icons..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setActiveCategory(null);
            }}
            className={`flex-1 bg-transparent text-sm outline-none placeholder:text-neutral-400 ${isDark ? 'text-white' : 'text-neutral-900'}`}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className={`p-0.5 rounded ${isDark ? 'hover:bg-white/10' : 'hover:bg-neutral-200'}`}>
              <XCircle size={12} className={isDark ? 'text-[#666]' : 'text-neutral-400'} />
            </button>
          )}
        </div>
      </div>

      {/* Category tabs - horizontal scrollable */}
      {!searchTerm && (
        <div className={`flex gap-1 p-2 overflow-x-auto border-b ${isDark ? 'border-white/10' : 'border-neutral-100'} custom-scrollbar`}>
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-2 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${categoryClass(activeCategory === null)}`}
          >
            All
          </button>
          {availableCategories.map((cat) => (
            <button
              key={cat.label}
              onClick={() => setActiveCategory(cat.label)}
              className={`px-2 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${categoryClass(activeCategory === cat.label)}`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Icons grid */}
      <div className="max-h-[280px] overflow-y-auto custom-scrollbar p-2">
        {filteredCategories.map((category) => (
          <div key={category.label} className="mb-3 last:mb-0">
            {(!activeCategory || searchTerm) && (
              <div className={`text-[10px] font-semibold uppercase tracking-wider mb-1.5 px-1 ${isDark ? 'text-[#666]' : 'text-neutral-400'}`}>
                {category.label} {searchTerm && `(${category.icons.length})`}
              </div>
            )}
            <div className="grid grid-cols-8 gap-1">
              {category.icons.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onChange(item.id);
                    setIsOpen(false);
                    setSearchTerm('');
                    setActiveCategory(null);
                  }}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${itemClass(value === item.id)}`}
                  title={item.label}
                >
                  <item.icon size={16} />
                </button>
              ))}
            </div>
          </div>
        ))}
        {searchTerm && filteredCategories[0]?.icons.length === 0 && (
          <div className={`text-center py-6 ${isDark ? 'text-[#666]' : 'text-neutral-400'}`}>
            <Search size={24} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No icons found</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-8 h-8 flex items-center justify-center border rounded transition-all ${buttonClass}`}
        title={selectedLabel}
      >
        <SelectedIcon size={14} />
      </button>

      {mounted && dropdown && createPortal(dropdown, document.body)}
    </div>
  );
};

export const ConfigSidebar: React.FC<ConfigSidebarProps> = ({
  config,
  onChange,
  onOpenCode,
  onReset,
  widgetName = 'Widget',
  lockedProvider
}) => {
  const [customFontUrl, setCustomFontUrl] = useState(config.customFontCss || '');
  const [customFontName, setCustomFontName] = useState(config.customFontName || '');

  const isDark = config.themeMode === 'dark';
  const resolvedProvider =
    CHATKIT_UI_ENABLED
      ? (lockedProvider || config.connection?.provider || 'n8n')
      : 'n8n';
  const availableFontOptions = CHATKIT_UI_ENABLED
    ? FONT_OPTIONS
    : FONT_OPTIONS.filter((font) => font !== 'OpenAI Sans');
  const selectedFontFamily =
    !CHATKIT_UI_ENABLED && config.fontFamily === 'OpenAI Sans'
      ? 'Inter'
      : (config.fontFamily || 'system-ui');

  // Dynamic Theme Classes
  const theme = {
    bg: isDark ? 'bg-[#212121]' : 'bg-white',
    border: isDark ? 'border-[#ffffff0f]' : 'border-neutral-200',
    text: isDark ? 'text-[#e5e5e5]' : 'text-neutral-900',
    textMuted: isDark ? 'text-[#afafaf]' : 'text-neutral-500',
    inputBg: isDark ? 'bg-[#212121]' : 'bg-white',
    inputBorder: isDark ? 'border-[#ffffff1a]' : 'border-neutral-200',
    hover: isDark ? 'hover:bg-white/10' : 'hover:bg-neutral-100',
    buttonIcon: isDark ? 'text-white' : 'text-neutral-600',
    buttonBg: isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-neutral-100 hover:bg-neutral-200',
  };

  const handleChange = <K extends keyof WidgetConfig>(key: K, value: WidgetConfig[K]) => {
    onChange({ ...config, [key]: value });
  };

  const updatePrompt = (index: number, field: 'label' | 'icon', value: string) => {
    const newPrompts = [...(config.starterPrompts || [])];
    newPrompts[index] = { ...newPrompts[index], [field]: value };
    handleChange('starterPrompts', newPrompts);
  };

  // Use ref to track last processed prompt count to avoid duplicate processing
  const lastPromptCountRef = useRef((config.starterPrompts || []).length);

  // Sync ref when config changes externally (e.g., loading saved widget)
  useEffect(() => {
    lastPromptCountRef.current = (config.starterPrompts || []).length;
  }, [config.starterPrompts]);

  const handlePromptCountChange = (count: number) => {
    // Skip if count hasn't changed (prevents duplicate processing from rapid slider events)
    if (count === lastPromptCountRef.current) {
      return;
    }
    lastPromptCountRef.current = count;

    // Build array of exactly 'count' prompts
    // Preserve existing prompts where possible, add new ones if needed
    const existing = config.starterPrompts || [];
    const newPrompts: StarterPrompt[] = [];

    for (let i = 0; i < count; i++) {
      if (i < existing.length) {
        // Keep existing prompt
        newPrompts.push(existing[i]);
      } else {
        // Add new prompt
        newPrompts.push({ label: 'New prompt', icon: 'message' });
      }
    }

    handleChange('starterPrompts', newPrompts);
  };

  const handleSaveCustomFont = () => {
    if (customFontUrl && customFontName) {
      onChange({
        ...config,
        customFontCss: customFontUrl,
        customFontName: customFontName,
        fontFamily: customFontName
      });
    }
  };

  const handleToggleCustomFont = (enabled: boolean) => {
    onChange({
      ...config,
      useCustomFont: enabled,
      fontFamily: (!enabled && config.fontFamily === config.customFontName) ? 'Inter' : config.fontFamily
    });
  };

  return (
    <aside className={`w-[380px] flex-shrink-0 flex flex-col h-full border-r text-sm select-none z-20 shadow-xl transition-colors duration-300 ${theme.bg} ${theme.border}`}>
      {/* Header */}
      <div className={`h-[60px] flex items-center justify-between px-3 border-b ${theme.border}`}>
        <div className={`flex items-center gap-2 px-2 ${theme.text}`}>
          <span className="font-semibold text-lg truncate max-w-[200px]">{widgetName}</span>
        </div>
        <div className="flex items-center gap-1">
          {onReset && (
            <button
              onClick={() => {
                if (window.confirm('Reset all changes to last saved state?')) {
                  onReset();
                }
              }}
              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${theme.buttonBg} ${theme.buttonIcon}`}
              title="Reset to Default"
            >
              <RotateCcw size={16} />
            </button>
          )}
          <button
            onClick={onOpenCode}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${theme.buttonBg} ${theme.buttonIcon}`}
            title={widgetName === 'Widget' ? 'Save widget first to get embed code' : 'View Code'}
            disabled={widgetName === 'Widget'}
            style={widgetName === 'Widget' ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
          >
            <Code size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Color Scheme */}
        <Section isDark={isDark}>
          <Row>
            <div className={`font-semibold ${theme.text}`}>Color scheme</div>
            <div className={`p-0.5 rounded-md flex relative ${isDark ? 'bg-[#0D0D0D]' : 'bg-neutral-100'}`}>
              {/* Animated background pill */}
              <div
                className={`absolute top-[2px] bottom-[2px] rounded-[4px] transition-all duration-200 ease-in-out w-[calc(50%-4px)] shadow-sm ${isDark ? 'bg-[#303030]' : 'bg-white'}`}
                style={{ left: config.themeMode === 'light' ? '2px' : 'calc(50% + 2px)' }}
              />
              <button
                onClick={() => handleChange('themeMode', 'light')}
                className={`relative z-10 px-3 py-0.5 text-xs font-medium rounded-[4px] w-[50px] text-center transition-colors ${config.themeMode === 'light' ? (isDark ? 'text-[#afafaf]' : 'text-neutral-900') : (isDark ? 'text-white' : 'text-neutral-500')
                  }`}
              >
                Light
              </button>
              <button
                onClick={() => handleChange('themeMode', 'dark')}
                className={`relative z-10 px-3 py-0.5 text-xs font-medium rounded-[4px] w-[50px] text-center transition-colors ${config.themeMode === 'dark' ? (isDark ? 'text-white' : 'text-neutral-900') : (isDark ? 'text-[#afafaf]' : 'text-neutral-500')
                  }`}
              >
                Dark
              </button>
            </div>
          </Row>
        </Section>

        {/* Color Toggles */}
        <Section isDark={isDark}>
          {resolvedProvider === 'chatkit' ? (
            // ChatKit Specific Controls - Using ChatKit API ranges
            <div className="space-y-6">
              {/* Grayscale Controls */}
              <div className="space-y-4">
                <div className={`font-medium ${theme.text}`}>Grayscale</div>

                <Row>
                  <div className={`w-12 ${theme.textMuted}`}>Hue</div>
                  <Slider value={config.chatkitGrayscaleHue || 0} max={360} onChange={(v) => handleChange('chatkitGrayscaleHue', v)} gradient isDark={isDark} />
                  <div className={`w-8 text-right ${theme.textMuted}`}>{config.chatkitGrayscaleHue || 0}°</div>
                </Row>

                <Row>
                  <div className={`w-12 ${theme.textMuted}`}>Tint</div>
                  <Slider value={config.chatkitGrayscaleTint ?? 6} max={9} onChange={(v) => handleChange('chatkitGrayscaleTint', v)} isDark={isDark} />
                  <div className={`w-8 text-right ${theme.textMuted}`}>{config.chatkitGrayscaleTint ?? 6}</div>
                </Row>

                <Row>
                  <div className={`w-12 ${theme.textMuted}`}>Shade</div>
                  <Slider value={(config.chatkitGrayscaleShade ?? -4) + 4} max={8} onChange={(v) => handleChange('chatkitGrayscaleShade', v - 4)} isDark={isDark} />
                  <div className={`w-8 text-right ${theme.textMuted}`}>{config.chatkitGrayscaleShade ?? -4}</div>
                </Row>
              </div>

              {/* Accent Controls */}
              <div className="space-y-4">
                <div className={`font-medium ${theme.text}`}>Accent</div>

                <Row>
                  <div className={`w-12 ${theme.textMuted}`}>Color</div>
                  <div className="flex-1 flex justify-end">
                    <div className="flex items-center gap-2">
                      <div className="relative flex items-center justify-center">
                        <div
                          className={`w-6 h-6 rounded-[4px] border shadow-sm ${isDark ? 'border-white/10' : 'border-black/10'}`}
                          style={{ backgroundColor: config.chatkitAccentPrimary || '#0f172a' }}
                        />
                        <input
                          type="color"
                          value={config.chatkitAccentPrimary || '#0f172a'}
                          onChange={(e) => handleChange('chatkitAccentPrimary', e.target.value)}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                      </div>
                      <SidebarInput
                        type="text"
                        value={config.chatkitAccentPrimary || '#0f172a'}
                        onChange={(e) => handleChange('chatkitAccentPrimary', e.target.value)}
                        className="w-24 uppercase"
                        isDark={isDark}
                      />
                    </div>
                  </div>
                </Row>

                <Row>
                  <div className={`w-12 ${theme.textMuted}`}>Level</div>
                  <Slider value={config.chatkitAccentLevel ?? 1} max={3} onChange={(v) => handleChange('chatkitAccentLevel', v)} isDark={isDark} />
                  <div className={`w-8 text-right ${theme.textMuted}`}>{config.chatkitAccentLevel ?? 1}</div>
                </Row>
              </div>

              {/* Surface Colors - ChatKit supports this too */}
              <div className="space-y-4">
                <Row className={config.useCustomSurfaceColors ? 'mb-0' : ''}>
                  <div className={`font-medium ${theme.text}`}>Custom surface colors</div>
                  <Toggle checked={config.useCustomSurfaceColors || false} onChange={(v) => handleChange('useCustomSurfaceColors', v)} isDark={isDark} />
                </Row>
                {config.useCustomSurfaceColors && (
                  <div className="animate-in slide-in-from-top-2 fade-in duration-200 space-y-4">
                    <ColorPicker label="Background" value={config.surfaceBackgroundColor || '#ffffff'} onColorChange={(v) => handleChange('surfaceBackgroundColor', v)} isDark={isDark} />
                    <ColorPicker label="Foreground" value={config.surfaceForegroundColor || '#f8fafc'} onColorChange={(v) => handleChange('surfaceForegroundColor', v)} isDark={isDark} />
                  </div>
                )}
              </div>
            </div>
          ) : (
            // N8n Specific Controls (Existing)
            <>
              {/* Accent */}
              <Row className={config.useAccent ? 'mb-0' : 'mb-4'}>
                <Label isDark={isDark}>Accent</Label>
                <Toggle checked={config.useAccent || false} onChange={(v) => handleChange('useAccent', v)} isDark={isDark} />
              </Row>
              {config.useAccent && (
                <div className="mt-3 mb-4 pl-0 animate-in slide-in-from-top-2 fade-in duration-200">
                  <ColorPicker label="Color" value={config.accentColor || '#0ea5e9'} onColorChange={(v) => handleChange('accentColor', v)} isDark={isDark} />
                </div>
              )}

              {/* Tinted Grayscale */}
              <Row className={config.useTintedGrayscale ? 'mb-0' : 'mb-4'}>
                <Label isDark={isDark}>Tinted grayscale</Label>
                <Toggle checked={config.useTintedGrayscale || false} onChange={(v) => handleChange('useTintedGrayscale', v)} isDark={isDark} />
              </Row>
              {config.useTintedGrayscale && (
                <div className="animate-in slide-in-from-top-2 fade-in duration-200 space-y-4 mt-4 mb-2">
                  <Row>
                    <div className={`w-12 ${theme.textMuted}`}>Hue</div>
                    <Slider value={config.tintHue || 220} max={360} onChange={(v) => handleChange('tintHue', v)} gradient isDark={isDark} />
                    <div className={`w-6 text-right ${theme.textMuted}`}>{config.tintHue || 220}°</div>
                  </Row>
                  <Row>
                    <div className={`w-12 ${theme.textMuted}`}>Tint</div>
                    <Slider value={config.tintLevel || 10} max={20} onChange={(v) => handleChange('tintLevel', v)} isDark={isDark} />
                    <div className={`w-6 text-right ${theme.textMuted}`}>{config.tintLevel || 10}</div>
                  </Row>
                  <Row>
                    <div className={`w-12 ${theme.textMuted}`}>Shade</div>
                    <Slider value={config.shadeLevel ?? 10} max={20} onChange={(v) => handleChange('shadeLevel', v)} isDark={isDark} />
                    <div className={`w-6 text-right ${theme.textMuted}`}>{config.shadeLevel ?? 10}</div>
                  </Row>
                </div>
              )}

              {/* Custom Surface Colors */}
              <Row className={config.useCustomSurfaceColors ? 'mb-0' : 'mt-4'}>
                <Label isDark={isDark}>Custom surface colors</Label>
                <Toggle checked={config.useCustomSurfaceColors || false} onChange={(v) => handleChange('useCustomSurfaceColors', v)} isDark={isDark} />
              </Row>
              {config.useCustomSurfaceColors && (
                <div className="animate-in slide-in-from-top-2 fade-in duration-200 space-y-4 mt-4">
                  <ColorPicker label="Surface background" value={config.surfaceBackgroundColor || '#ffffff'} onColorChange={(v) => handleChange('surfaceBackgroundColor', v)} isDark={isDark} />
                  <ColorPicker label="Surface foreground" value={config.surfaceForegroundColor || '#f8fafc'} onColorChange={(v) => handleChange('surfaceForegroundColor', v)} isDark={isDark} />
                </div>
              )}

              {/* Custom Text Color */}
              <Row className={config.useCustomTextColor ? 'mb-0' : 'mt-4'}>
                <Label isDark={isDark}>Custom text color</Label>
                <Toggle checked={config.useCustomTextColor || false} onChange={(v) => handleChange('useCustomTextColor', v)} isDark={isDark} />
              </Row>
              {config.useCustomTextColor && (
                <div className="animate-in slide-in-from-top-2 fade-in duration-200 mt-4">
                  <ColorPicker label="Text color" value={config.customTextColor || '#1e293b'} onColorChange={(v) => handleChange('customTextColor', v)} isDark={isDark} />
                </div>
              )}

              {/* Custom Icon Color */}
              <Row className={config.useCustomIconColor ? 'mb-0' : 'mt-4'}>
                <Label isDark={isDark}>Custom icon color</Label>
                <Toggle checked={config.useCustomIconColor || false} onChange={(v) => handleChange('useCustomIconColor', v)} isDark={isDark} />
              </Row>
              {config.useCustomIconColor && (
                <div className="animate-in slide-in-from-top-2 fade-in duration-200 mt-4">
                  <ColorPicker label="Icon color" value={config.customIconColor || '#64748b'} onColorChange={(v) => handleChange('customIconColor', v)} isDark={isDark} />
                </div>
              )}

              {/* User Message Colors */}
              <Row className={config.useCustomUserMessageColors ? 'mb-0' : 'mt-4'}>
                <Label isDark={isDark}>User message colors</Label>
                <Toggle checked={config.useCustomUserMessageColors || false} onChange={(v) => handleChange('useCustomUserMessageColors', v)} isDark={isDark} />
              </Row>
              {config.useCustomUserMessageColors && (
                <div className="animate-in slide-in-from-top-2 fade-in duration-200 mt-4 space-y-4">
                  <ColorPicker label="Message Text" value={config.customUserMessageTextColor || '#ffffff'} onColorChange={(v) => handleChange('customUserMessageTextColor', v)} isDark={isDark} />
                  <ColorPicker label="Message Background" value={config.customUserMessageBackgroundColor || '#0ea5e9'} onColorChange={(v) => handleChange('customUserMessageBackgroundColor', v)} isDark={isDark} />
                </div>
              )}
            </>
          )}
        </Section>

        {/* Typography */}
        <Section isDark={isDark}>
          <Row className="mb-3">
            <Label isDark={isDark}>Typography</Label>
          </Row>
          <div className="space-y-3 pl-0">
            <Row>
              <div className={theme.textMuted}>Font family</div>
              <div className="relative">
                <select
                  value={selectedFontFamily}
                  onChange={(e) => handleChange('fontFamily', e.target.value)}
                  className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                >
                  {availableFontOptions.map((f) => (
                    <option key={f} value={f} className="text-black">{f}</option>
                  ))}
                  {config.useCustomFont && config.customFontName && (
                    <option value={config.customFontName} className="text-black">{config.customFontName} (Custom)</option>
                  )}
                </select>
                <SelectValue value={selectedFontFamily} isDark={isDark} />
              </div>
            </Row>
            <Row>
              <div className={theme.textMuted}>Font size</div>
              <div className="relative">
                <select
                  value={config.fontSize || 16}
                  onChange={(e) => handleChange('fontSize', Number(e.target.value))}
                  className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                >
                  <option value={14} className="text-black">14px</option>
                  <option value={16} className="text-black">16px</option>
                  <option value={18} className="text-black">18px</option>
                </select>
                <SelectValue value={`${config.fontSize || 16}px`} isDark={isDark} />
              </div>
            </Row>

            {/* Custom Font Toggle */}
            <Row className={config.useCustomFont ? 'mt-4 mb-0' : 'mt-4'}>
              <Label isDark={isDark}>Custom font</Label>
              <Toggle checked={config.useCustomFont || false} onChange={handleToggleCustomFont} isDark={isDark} />
            </Row>

            {/* Custom Font Importer */}
            {config.useCustomFont && (
              <div className={`mt-4 pt-2 border-t animate-in slide-in-from-top-2 fade-in duration-200 ${theme.border}`}>
                <div className={`text-xs font-semibold mb-2 ${theme.text}`}>Import Custom Font</div>
                <div className="space-y-2">
                  <SidebarInput
                    type="text"
                    value={customFontUrl}
                    onChange={(e) => setCustomFontUrl(e.target.value)}
                    className="w-full"
                    placeholder="@import url('...');"
                    isDark={isDark}
                  />
                  <div className="flex gap-2">
                    <SidebarInput
                      type="text"
                      value={customFontName}
                      onChange={(e) => setCustomFontName(e.target.value)}
                      className="flex-1"
                      placeholder="Family Name (e.g. Satoshi)"
                      isDark={isDark}
                    />
                    <button
                      onClick={handleSaveCustomFont}
                      disabled={!customFontUrl || !customFontName}
                      className="bg-blue-600 hover:bg-blue-500 text-white p-1.5 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Save Custom Font"
                    >
                      <Save size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* Style */}
        <Section isDark={isDark}>
          <Row className="mb-3">
            <Label isDark={isDark}>Style</Label>
          </Row>
          <div className="space-y-3">
            <Row>
              <div className={theme.textMuted}>Radius</div>
              <div className="relative">
                <select
                  value={config.radius || 'medium'}
                  onChange={(e) => handleChange('radius', e.target.value as typeof RADIUS_OPTIONS[number])}
                  className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                >
                  {RADIUS_OPTIONS.map((r) => (
                    <option key={r} value={r} className="text-black capitalize">{r}</option>
                  ))}
                </select>
                <SelectValue value={(config.radius || 'medium').charAt(0).toUpperCase() + (config.radius || 'medium').slice(1)} isDark={isDark} />
              </div>
            </Row>
            <Row>
              <div className={theme.textMuted}>Density</div>
              <div className="relative">
                <select
                  value={config.density || 'normal'}
                  onChange={(e) => handleChange('density', e.target.value as typeof DENSITY_OPTIONS[number])}
                  className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                >
                  {DENSITY_OPTIONS.map((r) => (
                    <option key={r} value={r} className="text-black capitalize">{r}</option>
                  ))}
                </select>
                <SelectValue value={(config.density || 'normal').charAt(0).toUpperCase() + (config.density || 'normal').slice(1)} isDark={isDark} />
              </div>
            </Row>
          </div>
        </Section>

        {/* Start Screen */}
        <Section isDark={isDark}>
          <Row className="mb-3">
            <Label isDark={isDark}>Start screen</Label>
          </Row>
          <div className="space-y-4">
            <Row>
              <div className={`${theme.textMuted} font-medium`}>Greeting</div>
              <SidebarInput
                type="text"
                value={config.greeting || ''}
                onChange={(e) => handleChange('greeting', e.target.value)}
                className="text-right w-40"
                isDark={isDark}
              />
            </Row>

            {/* Prompts Count Slider */}
            <Row>
              <div className={`${theme.textMuted} font-medium w-24`}>Prompts</div>
              <Slider
                value={(config.starterPrompts || []).length}
                max={5}
                onChange={handlePromptCountChange}
                isDark={isDark}
              />
              <div className={`w-6 text-right ${theme.textMuted}`}>{(config.starterPrompts || []).length}</div>
            </Row>

            {/* Prompt List Editor */}
            {(config.starterPrompts || []).length > 0 && (
              <div className="space-y-2 mt-2">
                {(config.starterPrompts || []).map((prompt: StarterPrompt, index: number) => (
                  <div key={index} className="flex gap-2 animate-in slide-in-from-top-1 fade-in duration-200">
                    <IconPicker value={prompt.icon} onChange={(val) => updatePrompt(index, 'icon', val)} isDark={isDark} provider={resolvedProvider} />
                    <SidebarInput
                      type="text"
                      value={prompt.label}
                      onChange={(e) => updatePrompt(index, 'label', e.target.value)}
                      className="flex-1"
                      placeholder="Prompt text..."
                      isDark={isDark}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </Section>

        {/* Composer */}
        <Section isDark={isDark}>
          <Row className="mb-3">
            <Label isDark={isDark}>Composer</Label>
          </Row>
          <div className="space-y-3">
            <Row>
              <div className={`${theme.textMuted} font-medium`}>Placeholder</div>
              <SidebarInput
                type="text"
                value={config.placeholder || ''}
                onChange={(e) => handleChange('placeholder', e.target.value)}
                className="text-right w-40"
                isDark={isDark}
              />
            </Row>
            <Row>
              <div className={`${theme.textMuted} font-medium`}>Disclaimer</div>
              <SidebarInput
                type="text"
                value={config.disclaimer || ''}
                onChange={(e) => handleChange('disclaimer', e.target.value)}
                className="text-right w-40"
                isDark={isDark}
              />
            </Row>
            <Row>
              <div className={`${theme.textMuted} font-medium`}>Attachments</div>
              <Toggle checked={config.enableAttachments || false} onChange={(v) => handleChange('enableAttachments', v)} isDark={isDark} />
            </Row>
          </div>
        </Section>

        {/* Model Picker */}
        <Section isDark={isDark}>
          <Row>
            <Label isDark={isDark}>Model picker</Label>
            <Toggle checked={config.enableModelPicker || false} onChange={(v) => handleChange('enableModelPicker', v)} isDark={isDark} />
          </Row>
        </Section>

        {/* Connect */}
        <Section isDark={isDark}>
          <Row className="mb-3">
            <Label isDark={isDark}>Connect</Label>
          </Row>
          <div className="space-y-4">
            {/* Provider Selection - only show if not locked */}
            {!lockedProvider && (
            <div className="space-y-2">
              {/* n8n Option */}
              {(() => {
                const isN8nSelected = !CHATKIT_UI_ENABLED || config.connection?.provider === 'n8n' || !config.connection?.provider;
                return (
                  <div
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${isN8nSelected
                      ? isDark
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-blue-500 bg-blue-50'
                      : isDark
                        ? 'border-neutral-700 hover:border-neutral-600'
                        : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    onClick={() => {
                      onChange({
                        ...config,
                        connection: {
                          ...config.connection,
                          provider: 'n8n',
                          webhookUrl: config.connection?.webhookUrl || '',
                        }
                      });
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        onChange({
                          ...config,
                          connection: {
                            ...config.connection,
                            provider: 'n8n',
                            webhookUrl: config.connection?.webhookUrl || '',
                          }
                        });
                      }
                    }}
                  >
                    <Row>
                      <div className={`font-medium ${isN8nSelected ? (isDark ? 'text-blue-400' : 'text-blue-600') : theme.textMuted}`}>
                        n8n Webhook
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isN8nSelected
                        ? 'border-blue-500 bg-blue-500'
                        : isDark ? 'border-neutral-600' : 'border-neutral-300'
                        }`}>
                        {isN8nSelected && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                    </Row>
                    {isN8nSelected && (
                      <div className="mt-3 animate-in slide-in-from-top-1 fade-in duration-200">
                        <SidebarInput
                          type="url"
                          value={config.connection?.webhookUrl || ''}
                          onChange={(e) => onChange({
                            ...config,
                            connection: {
                              ...config.connection,
                              provider: 'n8n',
                              webhookUrl: e.target.value,
                            }
                          })}
                          className="w-full"
                          placeholder="https://your-n8n-instance.com/webhook/..."
                          isDark={isDark}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ChatKit Option */}
              {CHATKIT_UI_ENABLED && (() => {
                const isChatKitSelected = config.connection?.provider === 'chatkit';
                return (
                  <div
                    className={`p-3 rounded-lg border cursor-pointer transition-all mt-2 ${isChatKitSelected
                      ? isDark
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-green-500 bg-green-50'
                      : isDark
                        ? 'border-neutral-700 hover:border-neutral-600'
                        : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    onClick={() => {
                      onChange({
                        ...config,
                        connection: {
                          ...config.connection,
                          provider: 'chatkit',
                          workflowId: config.connection?.workflowId || '',
                          apiKey: config.connection?.apiKey || '',
                        },
                        // Set defaults for ChatKit if switching
                        chatkitGrayscaleHue: config.chatkitGrayscaleHue ?? 220,
                        chatkitGrayscaleTint: config.chatkitGrayscaleTint ?? 6,
                        chatkitGrayscaleShade: config.chatkitGrayscaleShade ?? (config.themeMode === 'dark' ? -1 : -4),
                        chatkitAccentPrimary: config.chatkitAccentPrimary ?? (config.themeMode === 'dark' ? '#f1f5f9' : '#0f172a'),
                        chatkitAccentLevel: config.chatkitAccentLevel ?? 1,
                      });
                    }}
                  >
                    <Row>
                      <div className={`font-medium ${isChatKitSelected ? (isDark ? 'text-green-400' : 'text-green-600') : theme.textMuted}`}>
                        OpenAI ChatKit
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isChatKitSelected
                        ? 'border-green-500 bg-green-500'
                        : isDark ? 'border-neutral-600' : 'border-neutral-300'
                        }`}>
                        {isChatKitSelected && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                    </Row>
                    {isChatKitSelected && (
                      <div className="mt-3 space-y-3 animate-in slide-in-from-top-1 fade-in duration-200">
                        <div className="space-y-1">
                          <label className={`text-xs font-medium ${theme.textMuted}`}>Workflow ID</label>
                          <SidebarInput
                            type="text"
                            value={config.connection?.workflowId || ''}
                            onChange={(e) => onChange({
                              ...config,
                              connection: {
                                ...config.connection,
                                provider: 'chatkit',
                                workflowId: e.target.value,
                              }
                            })}
                            className="w-full font-mono text-xs"
                            placeholder="wf_..."
                            isDark={isDark}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className={`text-xs font-medium ${theme.textMuted}`}>API Key</label>
                          <SidebarInput
                            type="password"
                            value={config.connection?.apiKey || ''}
                            onChange={(e) => onChange({
                              ...config,
                              connection: {
                                ...config.connection,
                                provider: 'chatkit',
                                apiKey: e.target.value,
                              }
                            })}
                            className="w-full font-mono text-xs"
                            placeholder="sk-..."
                            isDark={isDark}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

            </div>
            )}

            {/* Locked Provider - show only the relevant input */}
            {lockedProvider === 'n8n' && (
              <div className="space-y-2">
                <div className={`text-sm font-medium ${theme.textMuted}`}>n8n Webhook URL</div>
                <SidebarInput
                  type="text"
                  value={config.connection?.webhookUrl || ''}
                  onChange={(e) => onChange({
                    ...config,
                    connection: {
                      ...config.connection,
                      provider: 'n8n',
                      webhookUrl: e.target.value,
                    }
                  })}
                  className="w-full"
                  placeholder="https://your-n8n-instance.com/webhook/..."
                  isDark={isDark}
                />
              </div>
            )}

            {CHATKIT_UI_ENABLED && lockedProvider === 'chatkit' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className={`text-xs font-medium ${theme.textMuted}`}>Workflow ID</label>
                  <SidebarInput
                    type="text"
                    value={config.connection?.workflowId || ''}
                    onChange={(e) => onChange({
                      ...config,
                      connection: {
                        ...config.connection,
                        provider: 'chatkit',
                        workflowId: e.target.value,
                      }
                    })}
                    className="w-full font-mono text-xs"
                    placeholder="wf_..."
                    isDark={isDark}
                  />
                </div>
                <div className="space-y-1">
                  <label className={`text-xs font-medium ${theme.textMuted}`}>API Key</label>
                  <SidebarInput
                    type="password"
                    value={config.connection?.apiKey || ''}
                    onChange={(e) => onChange({
                      ...config,
                      connection: {
                        ...config.connection,
                        provider: 'chatkit',
                        apiKey: e.target.value,
                      }
                    })}
                    className="w-full font-mono text-xs"
                    placeholder="sk-..."
                    isDark={isDark}
                  />
                </div>
              </div>
            )}
          </div>
        </Section>
      </div >
    </aside >
  );
};
