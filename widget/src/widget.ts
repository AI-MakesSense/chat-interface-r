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
      fontFamily: config.theme?.typography?.fontFamily || config.style?.fontFamily || '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: config.theme?.typography?.baseSize || config.style?.fontSize || 14,
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
      promptBtn.innerHTML = `
        <span class="n8n-starter-prompt-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
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
