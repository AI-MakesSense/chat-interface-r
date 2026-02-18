'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { WidgetConfig, StarterPrompt } from '@/stores/widget-store';
import { History, Plus, ArrowUp, ChevronDown } from 'lucide-react';
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
  MessageSquare,
  MessagesSquare,
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
  Mail,
  Send,
  AtSign,
  Target,
  TrendingUp,
  Activity,
  Play,
  Wand2,
  Flame,
  Code2,
  Braces,
  FileCode,
  Wifi,
  Pencil,
  Edit3,
  Palette,
  Video,
  Music,
  Film,
  DollarSign,
  PiggyBank,
  Receipt,
  FileText,
  ShoppingCart,
  ShoppingBag,
  GraduationCap,
  Library,
  Brain,
  Users,
  UserPlus,
  UserCheck,
  Smile,
  ThumbsUp,
  ThumbsDown,
  Map,
  Navigation,
  Home,
  Building2,
  Timer,
  History as HistoryIcon,
  Settings,
  Cog,
  SlidersHorizontal,
  Filter,
  Lock,
  Key,
  Eye,
  EyeOff,
  Info,
  AlertCircle,
  CheckCircle,
  XCircle,
  Sun,
  Moon,
  CloudRain,
  Leaf,
  Flower2,
  Trees,
  Package,
  Award,
  Crown,
  File,
  Folder,
  FolderOpen,
  Download,
  Upload,
  Link,
  Share2,
  ExternalLink,
  Star,
  LucideIcon
} from 'lucide-react';

interface ChatPreviewProps {
  config: WidgetConfig;
}

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  isLoading?: boolean;
}

// Icon mapping - must match all icon IDs from config-sidebar ICON_CATEGORIES
const ICON_MAP: Record<string, LucideIcon> = {
  // Popular
  sparkles: Sparkles,
  message: MessageCircle,
  lightbulb: Lightbulb,
  rocket: Rocket,
  zap: Zap,
  star: Star,
  heart: Heart,
  search: Search,
  // Communication
  messageSquare: MessageSquare,
  messagesSquare: MessagesSquare,
  mail: Mail,
  phone: Phone,
  send: Send,
  atSign: AtSign,
  // Actions
  target: Target,
  trendingUp: TrendingUp,
  activity: Activity,
  play: Play,
  wand: Wand2,
  flame: Flame,
  // Tech
  code: Code2,
  terminal: Terminal,
  server: Server,
  cpu: Cpu,
  database: Database,
  braces: Braces,
  fileCode: FileCode,
  globe: Globe,
  wifi: Wifi,
  // Creative
  pen: PenTool,
  pencil: Pencil,
  edit: Edit3,
  palette: Palette,
  image: Image,
  camera: Camera,
  video: Video,
  music: Music,
  mic: Mic,
  film: Film,
  // Business
  briefcase: Briefcase,
  creditCard: CreditCard,
  dollar: DollarSign,
  piggyBank: PiggyBank,
  receipt: Receipt,
  fileText: FileText,
  shoppingCart: ShoppingCart,
  shoppingBag: ShoppingBag,
  // Learning
  book: BookOpen,
  graduationCap: GraduationCap,
  library: Library,
  brain: Brain,
  // People
  user: User,
  users: Users,
  userPlus: UserPlus,
  userCheck: UserCheck,
  smile: Smile,
  thumbsUp: ThumbsUp,
  thumbsDown: ThumbsDown,
  // Navigation
  compass: Compass,
  mapPin: MapPin,
  map: Map,
  navigation: Navigation,
  home: Home,
  building: Building2,
  // Time
  calendar: Calendar,
  clock: Clock,
  timer: Timer,
  history: HistoryIcon,
  // Tools
  wrench: Wrench,
  settings: Settings,
  cog: Cog,
  sliders: SlidersHorizontal,
  filter: Filter,
  // Security
  shield: Shield,
  lock: Lock,
  key: Key,
  eye: Eye,
  eyeOff: EyeOff,
  // Status
  help: HelpCircle,
  info: Info,
  alert: AlertCircle,
  check: CheckCircle,
  x: XCircle,
  bell: Bell,
  // Nature
  sun: Sun,
  moon: Moon,
  cloud: Cloud,
  cloudRain: CloudRain,
  leaf: Leaf,
  flower: Flower2,
  tree: Trees,
  // Objects
  box: Box,
  gift: Gift,
  package: Package,
  coffee: Coffee,
  flag: Flag,
  award: Award,
  crown: Crown,
  // Files
  file: File,
  folder: Folder,
  folderOpen: FolderOpen,
  download: Download,
  upload: Upload,
  link: Link,
  share: Share2,
  externalLink: ExternalLink,
};

const getIconByName = (iconName: string): LucideIcon => {
  return ICON_MAP[iconName] || MessageCircle;
};

// Simple markdown renderer
function renderMarkdown(text: string): string {
  if (!text) return '';
  try {
    let html = escapeHtml(text);
    // Code Blocks
    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    // Inline Code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    // Bold
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // Italic
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    // Links (supports both absolute and relative URLs)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-500 underline">$1</a>');
    // Newlines
    html = html.replace(/\n/g, '<br>');
    return html;
  } catch {
    return text;
  }
}

function escapeHtml(unsafe: string): string {
  const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return unsafe.replace(/[&<>"']/g, (char) => map[char] || char);
}

// Typing indicator component
const TypingIndicator = () => (
  <div className="flex items-center gap-1 py-1">
    <div className="w-[6px] h-[6px] bg-current rounded-full animate-bounce opacity-60" style={{ animationDelay: '-0.32s' }} />
    <div className="w-[6px] h-[6px] bg-current rounded-full animate-bounce opacity-60" style={{ animationDelay: '-0.16s' }} />
    <div className="w-[6px] h-[6px] bg-current rounded-full animate-bounce opacity-60" />
  </div>
);

export const ChatPreview: React.FC<ChatPreviewProps> = ({ config }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [width, setWidth] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Generate session ID once per component mount
  const sessionId = useMemo(() => 'preview-' + Math.random().toString(36).substring(7), []);

  const isDark = config.themeMode === 'dark';
  const hasMessages = messages.length > 0;

  // Responsive breakpoint
  const isWide = width > 500;

  useEffect(() => {
    if (!rootRef.current) return;
    const observer = new ResizeObserver((entries) => {
      setWidth(entries[0].contentRect.width);
    });
    observer.observe(rootRef.current);
    return () => observer.disconnect();
  }, []);

  // --- Typography Logic ---
  const getFontFamily = (f: string) => {
    switch (f) {
      case 'System':
        return '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
      case 'Space Grotesk':
        return '"Space Grotesk", sans-serif';
      case 'Comfortaa':
        return '"Comfortaa", cursive';
      case 'Bricolage Grotesque':
        return '"Bricolage Grotesque", sans-serif';
      case 'OpenAI Sans':
        return '"Inter", sans-serif';
      default:
        return `"${f}", sans-serif`;
    }
  };

  // --- Style Logic (Radius) ---
  const getRadius = () => {
    switch (config.radius) {
      case 'none':
        return '0px';
      case 'small':
        return '4px';
      case 'medium':
        return '8px';
      case 'large':
        return '16px';
      case 'pill':
        return '24px';
      default:
        return '12px';
    }
  };

  const elementRadius = config.radius === 'pill' ? '20px' : getRadius();

  // --- Density Logic ---
  const getContainerPadding = () => {
    switch (config.density) {
      case 'compact':
        return '1rem';
      case 'spacious':
        return '2.5rem';
      default:
        return '1.5rem';
    }
  };

  const getMessageVerticalSpacing = () => {
    switch (config.density) {
      case 'compact':
        return 'space-y-3';
      case 'spacious':
        return 'space-y-8';
      default:
        return 'space-y-6';
    }
  };

  const getBubblePadding = () => {
    switch (config.density) {
      case 'compact':
        return 'px-3 py-2';
      case 'spacious':
        return 'px-5 py-3.5';
      default:
        return 'px-4 py-2.5';
    }
  };

  const padding = getContainerPadding();
  const messageSpacing = getMessageVerticalSpacing();
  const bubblePadding = getBubblePadding();

  // --- Color Logic ---
  let bg: string,
    text: string,
    subText: string,
    border: string,
    surface: string,
    composerSurface: string,
    hoverSurface: string;

  if (config.useTintedGrayscale) {
    const h = config.tintHue || 220;
    const tLevel = config.tintLevel || 10;
    const sLevel = config.shadeLevel || 50;

    if (isDark) {
      const sat = 5 + tLevel * 2;
      const lit = 10 + sLevel * 0.5;

      bg = `hsl(${h}, ${sat}%, ${lit}%)`;
      surface = `hsl(${h}, ${sat}%, ${lit + 5}%)`;
      composerSurface = surface;
      border = `hsla(${h}, ${sat}%, 90%, 0.08)`;
      text = `hsl(${h}, ${Math.max(0, sat - 10)}%, 90%)`;
      subText = `hsl(${h}, ${Math.max(0, sat - 10)}%, 60%)`;
      hoverSurface = `hsla(${h}, ${sat}%, 90%, 0.05)`;
    } else {
      const sat = 10 + tLevel * 3;
      const lit = 98 - sLevel * 2;

      bg = `hsl(${h}, ${sat}%, ${lit}%)`;
      surface = `hsl(${h}, ${sat}%, ${lit - 5}%)`;
      composerSurface = `hsl(${h}, ${sat}%, 100%)`;
      border = `hsla(${h}, ${sat}%, 10%, 0.08)`;
      text = `hsl(${h}, ${sat}%, 10%)`;
      subText = `hsl(${h}, ${sat}%, 40%)`;
      hoverSurface = `hsla(${h}, ${sat}%, 10%, 0.05)`;
    }
  } else if (config.useCustomSurfaceColors) {
    bg = config.surfaceBackgroundColor || '#ffffff';
    surface = config.surfaceForegroundColor || '#f8fafc';
    composerSurface = config.surfaceForegroundColor || '#f8fafc';

    if (isDark) {
      border = 'rgba(255,255,255,0.1)';
      text = '#e5e5e5';
      subText = '#a1a1aa';
      hoverSurface = 'rgba(255,255,255,0.05)';
    } else {
      border = 'rgba(0,0,0,0.08)';
      text = '#111827';
      subText = '#6b7280';
      hoverSurface = 'rgba(0,0,0,0.05)';
    }
  } else {
    bg = isDark ? '#1a1a1a' : '#ffffff';
    text = isDark ? '#e5e5e5' : '#111827';
    subText = isDark ? '#a1a1aa' : '#6b7280';
    border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
    surface = isDark ? '#262626' : '#f3f4f6';
    composerSurface = isDark ? '#262626' : '#ffffff';
    hoverSurface = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  }

  // Custom Text Color Override
  if (config.useCustomTextColor) {
    text = config.customTextColor || text;
  }

  // Custom Icon Color Override
  if (config.useCustomIconColor) {
    subText = config.customIconColor || subText;
  }

  // --- Accent & Message Logic ---
  const accentColor = config.accentColor || '#0ea5e9';
  const useAccent = config.useAccent || false;

  let userMsgBg = useAccent ? accentColor : surface;
  let userMsgText = useAccent ? '#ffffff' : text;
  let userMsgBorder = useAccent ? 'transparent' : isDark ? border : 'transparent';

  // Custom User Message Colors
  if (config.useCustomUserMessageColors) {
    userMsgBg = config.customUserMessageBackgroundColor || userMsgBg;
    userMsgText = config.customUserMessageTextColor || userMsgText;
    userMsgBorder = 'transparent';
  }

  const handleSend = async (e?: React.FormEvent, textOverride?: string) => {
    e?.preventDefault();
    const txt = textOverride || inputValue;
    if (!txt.trim() || isLoading) return;

    // Add user message
    const userMsgId = Date.now();
    setMessages((prev) => [...prev, { id: userMsgId, text: txt, isUser: true }]);
    setInputValue('');
    setIsLoading(true);

    // Add loading message
    const loadingMsgId = Date.now() + 1;
    setMessages((prev) => [...prev, { id: loadingMsgId, text: '', isUser: false, isLoading: true }]);

    // Check which connection mode is active
    const webhookUrl = config.connection?.webhookUrl;
    const isN8nMode = (config.connection?.provider === 'n8n' || !config.connection?.provider) && webhookUrl;

    if (!isN8nMode) {
      // No connection configured - simulate response
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === loadingMsgId
              ? { ...msg, text: 'This is a simulated response. Configure a connection in the Connect section to enable real responses.', isLoading: false }
              : msg
          )
        );
        setIsLoading(false);
      }, 800);
      return;
    }

    try {
      let response: Response;

      // Call the n8n webhook
      response = await fetch(webhookUrl!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: txt,
          chatInput: txt,
          sessionId: sessionId,
          widgetId: 'preview-widget',
          licenseKey: 'preview-license',
          metadata: { source: 'preview_mode' }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const reply = data.output || data.text || data.message || JSON.stringify(data);

      // Update the loading message with the actual response
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingMsgId
            ? { ...msg, text: reply, isLoading: false }
            : msg
        )
      );
    } catch (error) {
      console.error('Preview Error:', error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingMsgId
            ? { ...msg, text: `Error: ${error instanceof Error ? error.message : 'Failed to get response'}`, isLoading: false }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (messages.length === 0) return;
    // Scroll to the top of the last message so the user can read from the start
    const container = scrollContainerRef.current;
    if (container) {
      const messageEls = container.querySelectorAll('[data-chat-message]');
      const lastMsg = messageEls[messageEls.length - 1] as HTMLElement | undefined;
      if (lastMsg) {
        lastMsg.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    // Fallback to bottom sentinel
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // PDF Lightbox demo: inject/remove a demo PDF message when toggle changes
  useEffect(() => {
    const DEMO_PDF_MSG_ID = -999;
    if (config.enablePdfLightbox) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === DEMO_PDF_MSG_ID)) return prev;
        return [
          ...prev,
          {
            id: DEMO_PDF_MSG_ID,
            text: "Here's a document for you to review:\n\n[📄 View Demo PDF](/widget/demo-document.pdf)",
            isUser: false,
          },
        ];
      });
    } else {
      setMessages((prev) => prev.filter((m) => m.id !== DEMO_PDF_MSG_ID));
    }
  }, [config.enablePdfLightbox]);

  return (
    <div
      ref={rootRef}
      className="flex flex-col h-full w-full overflow-hidden transition-all duration-300 relative"
      style={{
        backgroundColor: bg,
        color: text,
        fontFamily: getFontFamily(config.fontFamily || 'system-ui'),
        fontSize: `${config.fontSize || 16}px`
      }}
    >
      {/* Inject Custom Font CSS */}
      {/* Intentional: Allow admins to inject custom CSS for advanced styling */}
      {config.useCustomFont && config.customFontCss && (
        <style dangerouslySetInnerHTML={{ __html: config.customFontCss }} />
      )}

      {/* Typing Animation Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
        .animate-bounce {
          animation: bounce 1.4s infinite ease-in-out both;
        }
        pre { background: #f1f5f9; padding: 12px; border-radius: 8px; overflow-x: auto; margin: 8px 0; font-family: monospace; font-size: 13px; }
        code { background: #f1f5f9; padding: 2px 4px; border-radius: 4px; font-family: monospace; font-size: 13px; }
        pre code { background: transparent; padding: 0; }
      `}} />

      {/* Header Icons */}
      <div className="absolute top-0 left-0 right-0 p-4 z-10 flex justify-between pointer-events-none">
        <div className="pointer-events-auto flex gap-1" />
        <div className="flex items-center gap-1 pointer-events-auto">
          <button
            className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
            style={{ color: subText }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = hoverSurface)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            onClick={() => setMessages([])}
            title="Clear History"
          >
            <History size={18} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto custom-scrollbar flex flex-col"
        style={{ padding: padding }}
      >
        {!hasMessages ? (
          // Start Screen
          <div
            className={`flex-1 flex flex-col justify-center animate-in fade-in duration-500 ${isWide ? 'items-center' : ''
              }`}
          >
            <div className={`mb-8 ${isWide ? 'w-full max-w-2xl px-8' : ''}`}>
              <h2
                className={`text-2xl font-semibold mb-6 leading-tight tracking-tight ${isWide ? 'text-center' : ''
                  }`}
                style={{ color: text }}
              >
                {config.greeting || 'How can I help you today?'}
              </h2>

              {config.starterPrompts && config.starterPrompts.length > 0 && (
                <div
                  className={
                    isWide
                      ? 'flex flex-wrap justify-center gap-3'
                      : config.density === 'compact'
                        ? 'space-y-1'
                        : 'space-y-2'
                  }
                >
                  {config.starterPrompts.map((item: StarterPrompt, i: number) => {
                    const IconComp = getIconByName(item.icon);
                    return (
                      <button
                        key={i}
                        onClick={() => handleSend(undefined, item.label)}
                        className={
                          isWide
                            ? 'flex flex-col items-center justify-center gap-3 p-4 rounded-xl border transition-all group text-center w-[140px] h-[120px] shadow-sm'
                            : 'flex items-center gap-3 w-full p-2 rounded-lg transition-all group text-left'
                        }
                        style={{
                          color: subText,
                          borderColor: isWide ? border : 'transparent',
                          backgroundColor: isWide ? surface : 'transparent'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = hoverSurface;
                          e.currentTarget.style.transform = isWide ? 'translateY(-2px)' : 'none';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = isWide ? surface : 'transparent';
                          e.currentTarget.style.transform = 'none';
                        }}
                      >
                        <IconComp
                          size={isWide ? 24 : 18}
                          className="opacity-70 group-hover:opacity-100 transition-opacity"
                        />
                        <span
                          className={`font-medium transition-colors ${isWide ? 'text-xs leading-relaxed line-clamp-2' : 'text-sm'
                            }`}
                          style={{ color: text }}
                        >
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          // Message History
          <div className={`flex-1 flex flex-col pt-12 pb-4 ${messageSpacing}`}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                data-chat-message
                className={`flex flex-col ${msg.isUser ? 'items-end' : 'items-start'
                  } animate-in slide-in-from-bottom-2 duration-300`}
              >
                <div
                  className={`max-w-[85%] leading-relaxed shadow-sm transition-colors duration-300 ${bubblePadding}`}
                  style={{
                    borderRadius: elementRadius,
                    backgroundColor: msg.isUser ? userMsgBg : 'transparent',
                    color: msg.isUser ? userMsgText : text,
                    border: msg.isUser ? `1px solid ${userMsgBorder}` : 'none'
                  }}
                >
                  {msg.isLoading ? (
                    <TypingIndicator />
                  ) : msg.isUser ? (
                    msg.text
                  ) : (
                    <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }} />
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Composer Area */}
      <div className="shrink-0 z-20" style={{ padding: padding, paddingTop: 0 }}>
        <form
          onSubmit={(e) => handleSend(e)}
          className="flex items-center gap-2 p-1.5 transition-all focus-within:ring-1 focus-within:ring-blue-500/50"
          style={{
            backgroundColor: composerSurface,
            borderRadius: config.radius === 'none' ? '0px' : '999px',
            border: `1px solid ${border}`,
            boxShadow: isDark ? 'none' : '0 4px 12px rgba(0,0,0,0.05)'
          }}
        >
          {config.enableAttachments ? (
            <button
              type="button"
              className="w-8 h-8 flex items-center justify-center rounded-full transition-colors shrink-0"
              style={{ color: subText }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = hoverSurface)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <Plus size={18} />
            </button>
          ) : (
            <div className="w-2" />
          )}

          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={config.placeholder || 'Type a message...'}
            className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none px-2 text-sm"
            style={{ color: text }}
            disabled={isLoading}
          />

          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="w-8 h-8 flex items-center justify-center rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: inputValue.trim() && !isLoading
                ? useAccent
                  ? accentColor
                  : isDark
                    ? '#e5e5e5'
                    : '#171717'
                : isDark
                  ? '#404040'
                  : '#f3f4f6',
              color: inputValue.trim() && !isLoading
                ? useAccent
                  ? '#ffffff'
                  : isDark
                    ? '#171717'
                    : '#ffffff'
                : isDark
                  ? '#737373'
                  : '#a3a3a3'
            }}
          >
            <ArrowUp size={16} strokeWidth={3} />
          </button>
        </form>

        {/* Footer Info */}
        <div className="flex items-center justify-between mt-3 px-2 h-5">
          <div
            className="flex items-center gap-2"
            style={{
              opacity: config.enableModelPicker ? 1 : 0,
              pointerEvents: config.enableModelPicker ? 'auto' : 'none'
            }}
          >
            <button
              className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded transition-colors"
              style={{ color: subText }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = hoverSurface)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <span>GPT-4o</span>
              <ChevronDown size={12} />
            </button>
          </div>

          {config.disclaimer && (
            <div
              className="text-[10px] select-none truncate max-w-[150px]"
              style={{ color: subText, opacity: 0.7 }}
            >
              {config.disclaimer}
            </div>
          )}

          <div className="w-10" />
        </div>
      </div>
    </div>
  );
};
