/**
 * Chat Widget Core - Matching Configurator Preview Design
 *
 * Purpose: Main widget UI and interaction logic
 * Responsibility: Create chat bubble, message list, input, handle sending/receiving
 *
 * Design: Matches the React configurator preview exactly:
 * - No header with company name - just icons in corner
 * - Start screen with centered greeting + prompts
 * - Prompts disappear when messages exist
 * - Clean, modern design
 */

import { WidgetRuntimeConfig, WidgetConfig, Message } from './types';
import { renderMarkdown } from './markdown';
import { buildRelayPayload } from './services/messaging/payload';
import { SessionManager } from './services/messaging/session-manager';
import { createCSSVariables, createFontFaceCSS } from './theming/css-variables';
import type { FileAttachment } from './services/messaging/types';

// Icon SVG paths mapping - matching Lucide icons from preview
const ICON_SVGS: Record<string, string> = {
  help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  box: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
  sparkles: '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>',
  pen: '<path d="m12 19 7-7 3 3-7 7-3-3z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="m2 2 7.586 7.586"/><circle cx="11" cy="11" r="2"/>',
  server: '<rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>',
  zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
  terminal: '<polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>',
  flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>',
  heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  message: '<path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/>',
  rocket: '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',
  lightbulb: '<line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>',
  search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  globe: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  cpu: '<rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>',
  database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>',
  wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  compass: '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>',
  mapPin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
  camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
  mic: '<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  briefcase: '<rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  coffee: '<path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/>',
  cloud: '<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  gift: '<polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>',
  creditCard: '<rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
};

// Helper to get icon SVG for a given icon name
function getIconSVG(iconName: string): string {
  return ICON_SVGS[iconName] || ICON_SVGS.message;
}

export function createChatWidget(runtimeConfig: WidgetRuntimeConfig): void {
  const messages: Message[] = [];
  let isOpen = false;
  let messageIdCounter = 0;
  let selectedFiles: File[] = [];
  const config = runtimeConfig.uiConfig || ({} as WidgetConfig);

  // Initialize SessionManager for session continuity
  const sessionManager = new SessionManager(runtimeConfig.relay.licenseKey || 'default');

  // Determine color scheme from extended theme or legacy style
  const colorScheme = config.theme?.colorScheme || config.style?.theme || 'light';
  const isDark = colorScheme === 'dark';

  // Font family mapping - matching preview exactly
  const getFontFamily = (f: string): string => {
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
      case 'system-ui':
        return '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
      default:
        return f ? `"${f}", sans-serif` : '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    }
  };

  // Get font family from config
  const rawFontFamily = config.theme?.typography?.fontFamily || config.style?.fontFamily || 'System';
  const fontFamily = getFontFamily(rawFontFamily);
  const fontSize = config.theme?.typography?.baseSize || config.style?.fontSize || 16;

  // Apply default config with extended theme support
  const mergedConfig: WidgetConfig = {
    branding: {
      companyName: config.branding?.companyName || 'Support',
      welcomeText: config.branding?.welcomeText || config.startScreen?.greeting || 'How can we help you?',
      firstMessage: config.branding?.firstMessage || '',
      logoUrl: config.branding?.logoUrl,
    },
    style: {
      theme: colorScheme as 'light' | 'dark' | 'auto',
      primaryColor: config.theme?.color?.accent?.primary || config.style?.primaryColor || '#0ea5e9',
      backgroundColor: config.theme?.color?.surface?.background || config.style?.backgroundColor || (isDark ? '#1a1a1a' : '#ffffff'),
      textColor: config.style?.textColor || (isDark ? '#e5e5e5' : '#1f2937'),
      fontFamily: fontFamily,
      fontSize: fontSize,
      position: config.style?.position || 'bottom-right',
      cornerRadius: config.style?.cornerRadius || 12,
    },
    features: {
      fileAttachmentsEnabled: config.composer?.attachments?.enabled || config.features?.fileAttachmentsEnabled || false,
      allowedExtensions: config.composer?.attachments?.accept || config.features?.allowedExtensions || ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'],
      maxFileSizeKB: config.composer?.attachments?.maxSize ? config.composer.attachments.maxSize / 1024 : config.features?.maxFileSizeKB || 5000,
    },
    connection: config.connection,
    license: config.license,
    theme: config.theme,
    startScreen: config.startScreen,
    composer: config.composer,
  };

  // Get greeting - use startScreen.greeting, then fall back to legacy welcomeText
  const greeting = config.startScreen?.greeting || config.branding?.welcomeText || 'How can I help you today?';

  // Generate CSS variables
  const cssVariables = createCSSVariables(mergedConfig);
  const fontFaceCSS = createFontFaceCSS(mergedConfig);

  // Calculate colors based on config (matching preview logic)
  let bg: string, text: string, subText: string, border: string, surface: string, composerSurface: string, hoverSurface: string;

  const tintedGrayscale = config.theme?.color?.grayscale;
  const customSurface = config.theme?.color?.surface;

  if (tintedGrayscale) {
    const h = tintedGrayscale.hue || 220;
    const tLevel = tintedGrayscale.tint || 10;
    const sLevel = tintedGrayscale.shade || 50;

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
  } else if (customSurface) {
    bg = customSurface.background || (isDark ? '#1a1a1a' : '#ffffff');
    surface = customSurface.foreground || (isDark ? '#262626' : '#f8fafc');
    composerSurface = surface;
    border = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
    text = isDark ? '#e5e5e5' : '#111827';
    subText = isDark ? '#a1a1aa' : '#6b7280';
    hoverSurface = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  } else {
    bg = isDark ? '#1a1a1a' : '#ffffff';
    text = isDark ? '#e5e5e5' : '#111827';
    subText = isDark ? '#a1a1aa' : '#6b7280';
    border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
    surface = isDark ? '#262626' : '#f3f4f6';
    composerSurface = isDark ? '#262626' : '#ffffff';
    hoverSurface = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  }

  // Custom text color override (matching preview)
  if (config.theme?.color?.text) {
    text = config.theme.color.text;
  }

  // Custom icon/subText color override (matching preview)
  if (config.theme?.color?.icon) {
    subText = config.theme.color.icon;
  }

  // Accent colors
  const accentColor = config.theme?.color?.accent?.primary || mergedConfig.style.primaryColor;
  const hasAccent = !!config.theme?.color?.accent;

  // User message colors
  let userMsgBg = hasAccent ? accentColor : surface;
  let userMsgText = hasAccent ? '#ffffff' : text;

  if (config.theme?.color?.userMessage) {
    userMsgBg = config.theme.color.userMessage.background || userMsgBg;
    userMsgText = config.theme.color.userMessage.text || userMsgText;
  }

  // Radius
  const getRadius = () => {
    const r = config.theme?.radius || 'medium';
    switch (r) {
      case 'none': return '0px';
      case 'small': return '4px';
      case 'medium': return '8px';
      case 'large': return '16px';
      case 'pill': return '24px';
      default: return '12px';
    }
  };
  const elementRadius = config.theme?.radius === 'pill' ? '20px' : getRadius();

  // Density
  const getDensityPadding = () => {
    const d = config.theme?.density || 'normal';
    switch (d) {
      case 'compact': return '1rem';
      case 'spacious': return '2.5rem';
      default: return '1.5rem';
    }
  };
  const padding = getDensityPadding();

  // Inject Google Fonts for known font families
  const googleFonts: Record<string, string> = {
    'Space Grotesk': 'Space+Grotesk:wght@400;500;600;700',
    'Comfortaa': 'Comfortaa:wght@400;500;600;700',
    'Bricolage Grotesque': 'Bricolage+Grotesque:wght@400;500;600;700',
    'Inter': 'Inter:wght@400;500;600;700',
  };

  if (googleFonts[rawFontFamily]) {
    const linkEl = document.createElement('link');
    linkEl.rel = 'stylesheet';
    linkEl.href = `https://fonts.googleapis.com/css2?family=${googleFonts[rawFontFamily]}&display=swap`;
    document.head.appendChild(linkEl);
  }

  // Inject custom font CSS if provided (from config.theme.typography.fontSources)
  const fontSources = config.theme?.typography?.fontSources;
  if (fontSources && fontSources.length > 0) {
    fontSources.forEach(source => {
      if (source.src) {
        const customFontStyle = document.createElement('style');
        customFontStyle.textContent = source.src;
        document.head.appendChild(customFontStyle);
      }
    });
  }

  // Inject CSS styles
  const styleEl = document.createElement('style');
  styleEl.id = 'n8n-chat-widget-styles';
  styleEl.textContent = `
    ${fontFaceCSS}

    #n8n-chat-widget-container {
      ${Object.entries(cssVariables).map(([key, value]) => `${key}: ${value};`).join('\n      ')}
    }

    /* Typing animation */
    .n8n-typing-container {
      display: flex;
      gap: 4px;
      padding: 4px 0;
    }
    .n8n-typing-dot {
      width: 6px;
      height: 6px;
      background: currentColor;
      border-radius: 50%;
      opacity: 0.6;
      animation: n8n-bounce 1.4s infinite ease-in-out both;
    }
    .n8n-typing-dot:nth-child(1) { animation-delay: -0.32s; }
    .n8n-typing-dot:nth-child(2) { animation-delay: -0.16s; }
    @keyframes n8n-bounce {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-4px); }
    }

    /* Scrollbar styling */
    #n8n-chat-messages::-webkit-scrollbar {
      width: 6px;
    }
    #n8n-chat-messages::-webkit-scrollbar-track {
      background: transparent;
    }
    #n8n-chat-messages::-webkit-scrollbar-thumb {
      background: ${border};
      border-radius: 3px;
    }

    /* Starter prompts - matching preview */
    .n8n-starter-prompt {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 8px;
      background: transparent;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      color: ${text};
      text-align: left;
      transition: background 0.15s;
    }
    .n8n-starter-prompt:hover {
      background: ${hoverSurface};
    }
    .n8n-starter-prompt-icon {
      color: ${subText};
      opacity: 0.7;
      transition: opacity 0.15s;
    }
    .n8n-starter-prompt:hover .n8n-starter-prompt-icon {
      opacity: 1;
    }

    /* Markdown content styling */
    .n8n-message-content p { margin: 0 0 0.5em 0; }
    .n8n-message-content p:last-child { margin-bottom: 0; }
    .n8n-message-content code {
      background: ${surface};
      padding: 2px 6px;
      border-radius: 4px;
      font-family: ui-monospace, monospace;
      font-size: 0.9em;
    }
    .n8n-message-content pre {
      background: ${isDark ? '#0d0d0d' : '#1e293b'};
      color: #e2e8f0;
      padding: 12px;
      border-radius: 8px;
      overflow-x: auto;
      margin: 0.5em 0;
    }
    .n8n-message-content pre code {
      background: none;
      padding: 0;
      color: inherit;
    }

    /* Animation */
    @keyframes n8n-fade-in {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .n8n-animate-in {
      animation: n8n-fade-in 0.3s ease-out;
    }
  `;
  document.head.appendChild(styleEl);

  // Create container - using flexbox to stack chat window above button (matching preview)
  const container = document.createElement('div');
  container.id = 'n8n-chat-widget-container';
  container.style.cssText = `
    position: fixed;
    ${mergedConfig.style.position === 'bottom-right' ? 'right: 24px;' : 'left: 24px;'}
    bottom: 24px;
    z-index: 999999;
    font-family: ${mergedConfig.style.fontFamily};
    font-size: ${mergedConfig.style.fontSize}px;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  `;
  document.body.appendChild(container);

  // Calculate launcher button colors (matching preview-canvas.tsx getLauncherStyle)
  let launcherBg: string, launcherColor: string;
  if (hasAccent) {
    launcherBg = accentColor;
    launcherColor = '#ffffff';
  } else if (customSurface) {
    launcherBg = customSurface.foreground || '#f8fafc';
    launcherColor = isDark ? '#e5e5e5' : '#111827';
  } else {
    launcherBg = isDark ? '#ffffff' : '#000000';
    launcherColor = isDark ? '#000000' : '#ffffff';
  }

  // Create chat bubble button - matching preview exactly (56px, stroke icon)
  const bubble = document.createElement('button');
  bubble.id = 'n8n-chat-bubble';
  bubble.setAttribute('aria-label', 'Open chat');
  bubble.style.cssText = `
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: ${launcherBg};
    border: none;
    cursor: pointer;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.3s, box-shadow 0.3s;
    position: relative;
  `;

  // Icon container for animation
  const iconContainer = document.createElement('div');
  iconContainer.style.cssText = `position: relative; width: 24px; height: 24px;`;

  // MessageCircle icon (stroke-based, matching Lucide)
  const messageIcon = document.createElement('span');
  messageIcon.id = 'n8n-bubble-message-icon';
  messageIcon.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${launcherColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="position: absolute; inset: 0; transition: all 0.3s; opacity: 1; transform: rotate(0deg) scale(1);">
      <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/>
    </svg>
  `;

  // X close icon
  const closeIconEl = document.createElement('span');
  closeIconEl.id = 'n8n-bubble-close-icon';
  closeIconEl.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${launcherColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="position: absolute; inset: 0; transition: all 0.3s; opacity: 0; transform: rotate(-90deg) scale(0.5);">
      <path d="M18 6 6 18"/>
      <path d="m6 6 12 12"/>
    </svg>
  `;

  iconContainer.appendChild(messageIcon);
  iconContainer.appendChild(closeIconEl);
  bubble.appendChild(iconContainer);

  // References for icon animation
  const msgIconSvg = messageIcon.querySelector('svg') as SVGElement;
  const closeIconSvg = closeIconEl.querySelector('svg') as SVGElement;

  bubble.addEventListener('mouseenter', () => { bubble.style.transform = 'scale(1.05)'; });
  bubble.addEventListener('mouseleave', () => { bubble.style.transform = 'scale(1)'; });
  bubble.addEventListener('click', toggleChat);

  // Create chat window - matches preview layout (380x600, 24px radius)
  // Added BEFORE bubble so it appears above in flexbox column layout
  const chatWindow = document.createElement('div');
  chatWindow.id = 'n8n-chat-window';
  chatWindow.style.cssText = `
    display: none;
    width: 380px;
    height: 600px;
    max-height: 80vh;
    background: ${bg};
    color: ${text};
    border-radius: 24px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    flex-direction: column;
    overflow: hidden;
    margin-bottom: 16px;
    border: 1px solid ${border};
    position: relative;
    transform-origin: bottom right;
  `;
  container.appendChild(chatWindow);

  // Add bubble AFTER chat window so it appears below in flexbox
  container.appendChild(bubble);

  // Header icons (top right) - matching preview
  const headerIcons = document.createElement('div');
  headerIcons.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    padding: 16px;
    z-index: 10;
    display: flex;
    justify-content: space-between;
    pointer-events: none;
  `;
  // Only clear history button - close is done via toggle button (matching preview)
  headerIcons.innerHTML = `
    <div style="pointer-events: auto;"></div>
    <div style="display: flex; align-items: center; gap: 4px; pointer-events: auto;">
      <button id="n8n-clear-history" style="
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: transparent;
        border: none;
        cursor: pointer;
        color: ${subText};
        transition: background 0.15s;
      " title="Clear History">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
          <path d="M3 3v5h5"/>
        </svg>
      </button>
    </div>
  `;
  chatWindow.appendChild(headerIcons);

  // Create main content area (scrollable)
  const mainContent = document.createElement('div');
  mainContent.id = 'n8n-chat-messages';
  mainContent.style.cssText = `
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    padding: ${padding};
  `;
  chatWindow.appendChild(mainContent);

  // Create start screen (greeting + prompts) - shown when no messages
  const startScreen = document.createElement('div');
  startScreen.id = 'n8n-start-screen';
  startScreen.style.cssText = `
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
  `;

  // Greeting
  const greetingEl = document.createElement('h2');
  greetingEl.style.cssText = `
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
    line-height: 1.3;
    letter-spacing: -0.01em;
    color: ${text};
  `;
  greetingEl.textContent = greeting;
  startScreen.appendChild(greetingEl);

  // Starter prompts
  const starterPrompts = mergedConfig.startScreen?.prompts || [];
  if (starterPrompts.length > 0) {
    const promptsContainer = document.createElement('div');
    promptsContainer.style.cssText = `display: flex; flex-direction: column; gap: 4px;`;

    starterPrompts.forEach((prompt) => {
      const promptBtn = document.createElement('button');
      promptBtn.className = 'n8n-starter-prompt';
      // Get the icon SVG for this prompt (matching preview's icon picker)
      const iconSvg = getIconSVG(prompt.icon || 'message');
      promptBtn.innerHTML = `
        <span class="n8n-starter-prompt-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            ${iconSvg}
          </svg>
        </span>
        <span style="font-weight: 500;">${prompt.label}</span>
      `;
      promptBtn.addEventListener('click', () => {
        handleSendMessage(prompt.prompt || prompt.label);
      });
      promptsContainer.appendChild(promptBtn);
    });

    startScreen.appendChild(promptsContainer);
  }

  mainContent.appendChild(startScreen);

  // Messages container (hidden initially, shown when messages exist)
  const messagesContainer = document.createElement('div');
  messagesContainer.id = 'n8n-messages-list';
  messagesContainer.style.cssText = `
    display: none;
    flex: 1;
    flex-direction: column;
    padding-top: 48px;
    gap: 16px;
  `;
  mainContent.appendChild(messagesContainer);

  // Composer area - matching preview
  const composerArea = document.createElement('div');
  composerArea.style.cssText = `
    padding: ${padding};
    padding-top: 0;
  `;

  const composerRadius = config.theme?.radius === 'none' ? '0px' : '999px';
  const inputPlaceholder = mergedConfig.composer?.placeholder || 'Type a message...';

  let composerHTML = `
    <form id="n8n-composer-form" style="
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px;
      background: ${composerSurface};
      border-radius: ${composerRadius};
      border: 1px solid ${border};
      box-shadow: ${isDark ? 'none' : '0 4px 12px rgba(0,0,0,0.05)'};
      transition: box-shadow 0.15s;
    ">
  `;

  // Attachment button
  if (mergedConfig.features.fileAttachmentsEnabled) {
    composerHTML += `
      <input type="file" id="n8n-file-input" multiple accept="${mergedConfig.features.allowedExtensions.map(e => '.' + e).join(',')}" style="display: none;" />
      <button type="button" id="n8n-attach-btn" style="
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: transparent;
        border: none;
        cursor: pointer;
        color: ${subText};
        transition: background 0.15s;
        flex-shrink: 0;
      ">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>
    `;
  } else {
    composerHTML += `<div style="width: 8px;"></div>`;
  }

  // Input
  composerHTML += `
    <input type="text" id="n8n-chat-input" placeholder="${inputPlaceholder}" style="
      flex: 1;
      border: none;
      background: transparent;
      outline: none;
      font-size: 14px;
      font-family: inherit;
      color: ${text};
      padding: 4px 8px;
    " />
  `;

  // Send button
  composerHTML += `
    <button type="submit" id="n8n-send-btn" style="
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: ${isDark ? '#404040' : '#f3f4f6'};
      border: none;
      cursor: pointer;
      color: ${isDark ? '#737373' : '#a3a3a3'};
      transition: background 0.15s, color 0.15s;
      flex-shrink: 0;
    ">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="19" x2="12" y2="5"/>
        <polyline points="5 12 12 5 19 12"/>
      </svg>
    </button>
  </form>
  `;

  composerArea.innerHTML = composerHTML;
  chatWindow.appendChild(composerArea);

  // Footer with disclaimer
  if (mergedConfig.composer?.disclaimer) {
    const footer = document.createElement('div');
    footer.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 8px ${padding};
      font-size: 10px;
      color: ${subText};
      opacity: 0.7;
    `;
    footer.textContent = mergedConfig.composer.disclaimer;
    chatWindow.appendChild(footer);
  }

  // Event handlers
  const form = composerArea.querySelector('#n8n-composer-form') as HTMLFormElement;
  const input = composerArea.querySelector('#n8n-chat-input') as HTMLInputElement;
  const sendBtn = composerArea.querySelector('#n8n-send-btn') as HTMLButtonElement;
  const attachBtn = composerArea.querySelector('#n8n-attach-btn') as HTMLButtonElement;
  const fileInput = composerArea.querySelector('#n8n-file-input') as HTMLInputElement;
  const clearBtn = headerIcons.querySelector('#n8n-clear-history') as HTMLButtonElement;

  // Update send button style based on input
  function updateSendButtonStyle() {
    const hasText = input.value.trim().length > 0;
    if (hasText) {
      sendBtn.style.background = hasAccent ? accentColor : (isDark ? '#e5e5e5' : '#171717');
      sendBtn.style.color = hasAccent ? '#ffffff' : (isDark ? '#171717' : '#ffffff');
    } else {
      sendBtn.style.background = isDark ? '#404040' : '#f3f4f6';
      sendBtn.style.color = isDark ? '#737373' : '#a3a3a3';
    }
  }

  input.addEventListener('input', updateSendButtonStyle);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    handleSendMessage();
  });

  clearBtn.addEventListener('click', () => {
    messages.length = 0;
    messagesContainer.innerHTML = '';
    messagesContainer.style.display = 'none';
    startScreen.style.display = 'flex';
  });

  if (attachBtn && fileInput) {
    attachBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) selectedFiles = Array.from(files);
    });
  }

  // Toggle chat window - with icon animation matching preview
  function toggleChat() {
    isOpen = !isOpen;
    if (isOpen) {
      // Show chat window with animation
      chatWindow.style.display = 'flex';
      chatWindow.style.opacity = '0';
      chatWindow.style.transform = 'scale(0.95) translateY(16px)';
      requestAnimationFrame(() => {
        chatWindow.style.transition = 'opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
        chatWindow.style.opacity = '1';
        chatWindow.style.transform = 'scale(1) translateY(0)';
      });

      // Animate icons - show X, hide message
      if (msgIconSvg) {
        msgIconSvg.style.opacity = '0';
        msgIconSvg.style.transform = 'rotate(90deg) scale(0.5)';
      }
      if (closeIconSvg) {
        closeIconSvg.style.opacity = '1';
        closeIconSvg.style.transform = 'rotate(0deg) scale(1)';
      }

      input.focus();
    } else {
      // Hide chat window with animation
      chatWindow.style.transition = 'opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
      chatWindow.style.opacity = '0';
      chatWindow.style.transform = 'scale(0.95) translateY(16px)';
      setTimeout(() => {
        chatWindow.style.display = 'none';
      }, 300);

      // Animate icons - show message, hide X
      if (msgIconSvg) {
        msgIconSvg.style.opacity = '1';
        msgIconSvg.style.transform = 'rotate(0deg) scale(1)';
      }
      if (closeIconSvg) {
        closeIconSvg.style.opacity = '0';
        closeIconSvg.style.transform = 'rotate(-90deg) scale(0.5)';
      }
    }
  }

  // Show messages view (hide start screen)
  function showMessagesView() {
    startScreen.style.display = 'none';
    messagesContainer.style.display = 'flex';
  }

  // Add message to UI
  function addMessage(role: 'user' | 'assistant', content: string, isLoading = false): Message {
    // Hide start screen, show messages
    if (messages.length === 0) {
      showMessagesView();
    }

    const message: Message = {
      id: `msg-${++messageIdCounter}`,
      role,
      content,
      timestamp: Date.now(),
    };
    messages.push(message);

    const messageEl = document.createElement('div');
    messageEl.id = message.id;
    messageEl.className = 'n8n-animate-in';
    messageEl.style.cssText = `
      display: flex;
      flex-direction: column;
      ${role === 'user' ? 'align-items: flex-end;' : 'align-items: flex-start;'}
    `;

    const bubbleEl = document.createElement('div');
    bubbleEl.className = 'n8n-message-content';
    bubbleEl.style.cssText = `
      max-width: 85%;
      padding: 10px 14px;
      border-radius: ${elementRadius};
      line-height: 1.5;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      ${role === 'user'
        ? `background: ${userMsgBg}; color: ${userMsgText};`
        : `background: transparent; color: ${text};`}
    `;

    if (role === 'assistant') {
      if (isLoading) {
        bubbleEl.innerHTML = `
          <div class="n8n-typing-container">
            <div class="n8n-typing-dot"></div>
            <div class="n8n-typing-dot"></div>
            <div class="n8n-typing-dot"></div>
          </div>
        `;
      } else {
        bubbleEl.innerHTML = renderMarkdown(content);
      }
    } else {
      bubbleEl.textContent = content;
    }

    messageEl.appendChild(bubbleEl);
    messagesContainer.appendChild(messageEl);
    mainContent.scrollTop = mainContent.scrollHeight;

    return message;
  }

  // Update message content
  function updateMessage(messageId: string, content: string) {
    const messageEl = messagesContainer.querySelector(`#${messageId}`) as HTMLElement;
    if (!messageEl) return;

    const bubbleEl = messageEl.querySelector('.n8n-message-content');
    if (bubbleEl) {
      bubbleEl.innerHTML = renderMarkdown(content);
    }

    const message = messages.find(m => m.id === messageId);
    if (message) message.content = content;

    mainContent.scrollTop = mainContent.scrollHeight;
  }

  // Handle sending message
  async function handleSendMessage(textOverride?: string) {
    const text = textOverride || input.value.trim();
    if (!text) return;

    addMessage('user', text);
    input.value = '';
    updateSendButtonStyle();

    const assistantMessage = addMessage('assistant', '', true);

    try {
      await streamResponse(text, assistantMessage.id);
    } catch (error) {
      console.error('[N8n Chat Widget] Error sending message:', error);
      updateMessage(assistantMessage.id, 'Sorry, there was an error processing your message. Please try again.');
    }
  }

  // Capture page context
  function capturePageContext() {
    try {
      const url = new URL(window.location.href);
      return {
        pageUrl: window.location.href,
        pagePath: window.location.pathname,
        pageTitle: document.title,
        queryParams: Object.fromEntries(url.searchParams),
        domain: window.location.hostname,
      };
    } catch {
      return {
        pageUrl: window.location.href,
        pagePath: window.location.pathname,
        pageTitle: document.title,
        queryParams: {},
        domain: window.location.hostname,
      };
    }
  }

  // Encode file as base64
  async function encodeFile(file: File): Promise<FileAttachment> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64Data = result.split(',')[1];
        resolve({ name: file.name, type: file.type, data: base64Data, size: file.size });
      };
      reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
      reader.readAsDataURL(file);
    });
  }

  // Send message to relay
  async function streamResponse(userMessage: string, assistantMessageId: string) {
    const relayUrl = runtimeConfig.relay.relayUrl;
    const sessionId = sessionManager.getSessionId();

    try {
      const shouldCaptureContext = mergedConfig.connection?.captureContext !== false;

      let fileAttachments: FileAttachment[] | undefined;
      if (selectedFiles.length > 0 && mergedConfig.features.fileAttachmentsEnabled) {
        fileAttachments = await Promise.all(selectedFiles.map(encodeFile));
        selectedFiles = [];
        if (fileInput) fileInput.value = '';
      }

      const payload = buildRelayPayload(runtimeConfig, {
        message: userMessage,
        sessionId,
        context: shouldCaptureContext ? capturePageContext() : undefined,
        customContext: mergedConfig.connection?.customContext,
        extraInputs: mergedConfig.connection?.extraInputs,
        attachments: fileAttachments,
      });

      const response = await fetch(relayUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const assistantResponse = data.response || data.message || data.output || 'No response received';
      updateMessage(assistantMessageId, assistantResponse);

    } catch (error) {
      console.error('[N8n Chat Widget] Error sending message:', error);
      updateMessage(assistantMessageId, 'Sorry, there was an error connecting to the server. Please try again.');
      throw error;
    }
  }
}
