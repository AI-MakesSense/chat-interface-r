/**
 * Chat Widget Core
 *
 * Purpose: Main widget UI and interaction logic
 * Responsibility: Create chat bubble, message list, input, handle sending/receiving
 *
 * Constraints:
 * - Vanilla JavaScript (no framework dependencies)
 * - Minimal DOM manipulation for performance
 * - POST requests to N8n webhook for responses
 * - Markdown rendering for assistant messages
 *
 * Extended to support ChatKit-compatible theming options.
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
      firstMessage: config.branding?.firstMessage || 'Hello! Ask me anything.',
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
    // Preserve extended config
    theme: config.theme,
    startScreen: config.startScreen,
    composer: config.composer,
  };

  // Generate CSS variables
  const cssVariables = createCSSVariables(mergedConfig);
  const fontFaceCSS = createFontFaceCSS(mergedConfig);

  // Inject CSS variables and styles
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
      width: 8px;
      height: 8px;
      background: var(--cw-icon-color, #64748b);
      border-radius: 50%;
      animation: n8n-typing 1.4s infinite ease-in-out both;
    }
    .n8n-typing-dot:nth-child(1) { animation-delay: -0.32s; }
    .n8n-typing-dot:nth-child(2) { animation-delay: -0.16s; }
    @keyframes n8n-typing {
      0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
      40% { transform: scale(1); opacity: 1; }
    }

    /* Scrollbar styling */
    #n8n-chat-messages::-webkit-scrollbar {
      width: 6px;
    }
    #n8n-chat-messages::-webkit-scrollbar-track {
      background: transparent;
    }
    #n8n-chat-messages::-webkit-scrollbar-thumb {
      background: var(--cw-border-color-strong, rgba(0,0,0,0.15));
      border-radius: 3px;
    }

    /* Starter prompts */
    .n8n-starter-prompt {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: var(--cw-spacing-sm, 8px) var(--cw-spacing-md, 12px);
      background: var(--cw-surface-fg, #f8fafc);
      border: 1px solid var(--cw-border-color, rgba(0,0,0,0.1));
      border-radius: var(--cw-radius-md, 12px);
      cursor: pointer;
      font-size: var(--cw-font-size-sm, 13px);
      color: var(--cw-text-color, #1f2937);
      transition: all 0.15s ease;
    }
    .n8n-starter-prompt:hover {
      background: var(--cw-accent-lighter, #f0f9ff);
      border-color: var(--cw-accent-primary, #0ea5e9);
    }

    /* Markdown content styling */
    .n8n-message-content p { margin: 0 0 0.5em 0; }
    .n8n-message-content p:last-child { margin-bottom: 0; }
    .n8n-message-content code {
      background: var(--cw-surface-fg, #f1f5f9);
      padding: 2px 6px;
      border-radius: 4px;
      font-family: var(--cw-font-family-mono, ui-monospace, monospace);
      font-size: 0.9em;
    }
    .n8n-message-content pre {
      background: ${isDark ? '#0d0d0d' : '#1e293b'};
      color: #e2e8f0;
      padding: var(--cw-spacing-md, 12px);
      border-radius: var(--cw-radius-sm, 8px);
      overflow-x: auto;
      margin: 0.5em 0;
    }
    .n8n-message-content pre code {
      background: none;
      padding: 0;
      color: inherit;
    }
  `;
  document.head.appendChild(styleEl);

  // Create container
  const container = document.createElement('div');
  container.id = 'n8n-chat-widget-container';
  container.style.cssText = `
    position: fixed;
    ${mergedConfig.style.position === 'bottom-right' ? 'right: 20px;' : 'left: 20px;'}
    bottom: 20px;
    z-index: 999999;
    font-family: var(--cw-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
    font-size: var(--cw-font-size, 14px);
  `;
  document.body.appendChild(container);

  // Create chat bubble button
  const bubble = document.createElement('button');
  bubble.id = 'n8n-chat-bubble';
  bubble.setAttribute('aria-label', 'Open chat');
  bubble.style.cssText = `
    width: 60px;
    height: 60px;
    border-radius: var(--cw-radius-full, 50%);
    background: var(--cw-accent-primary, ${mergedConfig.style.primaryColor});
    border: none;
    cursor: pointer;
    box-shadow: var(--cw-shadow-lg, 0 4px 12px rgba(0, 0, 0, 0.15));
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s, box-shadow 0.2s;
  `;
  bubble.innerHTML = `
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z"
        fill="white"/>
    </svg>
  `;
  bubble.addEventListener('mouseenter', () => {
    bubble.style.transform = 'scale(1.1)';
  });
  bubble.addEventListener('mouseleave', () => {
    bubble.style.transform = 'scale(1)';
  });
  bubble.addEventListener('click', toggleChat);
  container.appendChild(bubble);

  // Create chat window
  const chatWindow = document.createElement('div');
  chatWindow.id = 'n8n-chat-window';
  chatWindow.style.cssText = `
    display: none;
    width: 400px;
    height: 600px;
    max-height: 80vh;
    background: var(--cw-surface-bg, ${isDark ? '#1a1a1a' : '#ffffff'});
    color: var(--cw-text-color, ${isDark ? '#e5e5e5' : '#1f2937'});
    border-radius: var(--cw-radius-xl, ${mergedConfig.style.cornerRadius}px);
    box-shadow: var(--cw-shadow-lg, 0 8px 24px rgba(0, 0, 0, 0.15));
    flex-direction: column;
    overflow: hidden;
    margin-bottom: 12px;
    border: 1px solid var(--cw-border-color, ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'});
  `;
  container.appendChild(chatWindow);

  // Create header
  const header = document.createElement('div');
  header.style.cssText = `
    background: var(--cw-accent-primary, ${mergedConfig.style.primaryColor});
    color: white;
    padding: var(--cw-spacing-lg, 16px);
    display: flex;
    align-items: center;
    justify-content: space-between;
  `;
  header.innerHTML = `
    <div style="display: flex; align-items: center; gap: var(--cw-spacing-md, 12px);">
      ${mergedConfig.branding.logoUrl ? `<img src="${mergedConfig.branding.logoUrl}" alt="Logo" style="width: 36px; height: 36px; border-radius: var(--cw-radius-full, 50%); object-fit: cover;" />` : ''}
      <div>
        <div style="font-weight: 600; font-size: var(--cw-font-size-lg, 16px);">${mergedConfig.branding.companyName}</div>
        <div style="font-size: var(--cw-font-size-sm, 13px); opacity: 0.9;">${mergedConfig.branding.welcomeText}</div>
      </div>
    </div>
    <button id="n8n-chat-close" style="background: none; border: none; color: white; cursor: pointer; font-size: 24px; line-height: 1; padding: 0; width: 28px; height: 28px; opacity: 0.8; transition: opacity 0.15s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.8'">×</button>
  `;
  chatWindow.appendChild(header);

  // Close button handler
  const closeBtn = header.querySelector('#n8n-chat-close');
  closeBtn?.addEventListener('click', toggleChat);

  // Create messages container
  const messagesContainer = document.createElement('div');
  messagesContainer.id = 'n8n-chat-messages';
  messagesContainer.style.cssText = `
    flex: 1;
    overflow-y: auto;
    padding: var(--cw-spacing-lg, 16px);
    background: var(--cw-surface-fg, ${isDark ? '#0d0d0d' : '#f8fafc'});
  `;
  chatWindow.appendChild(messagesContainer);

  // Create starter prompts container (if prompts exist)
  const starterPrompts = mergedConfig.startScreen?.prompts || [];
  let starterPromptsContainer: HTMLElement | null = null;
  if (starterPrompts.length > 0) {
    starterPromptsContainer = document.createElement('div');
    starterPromptsContainer.id = 'n8n-starter-prompts';
    starterPromptsContainer.style.cssText = `
      padding: var(--cw-spacing-md, 12px) var(--cw-spacing-lg, 16px);
      display: flex;
      flex-wrap: wrap;
      gap: var(--cw-spacing-sm, 8px);
      background: var(--cw-surface-fg, ${isDark ? '#0d0d0d' : '#f8fafc'});
      border-top: 1px solid var(--cw-border-color, ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'});
    `;

    starterPrompts.forEach((prompt) => {
      const promptBtn = document.createElement('button');
      promptBtn.className = 'n8n-starter-prompt';
      promptBtn.innerHTML = `
        ${prompt.icon ? `<span style="font-size: 16px;">${prompt.icon}</span>` : ''}
        <span>${prompt.label}</span>
      `;
      promptBtn.addEventListener('click', () => {
        const input = document.getElementById('n8n-chat-input') as HTMLInputElement;
        if (input) {
          input.value = prompt.prompt || prompt.label;
          input.focus();
        }
      });
      starterPromptsContainer!.appendChild(promptBtn);
    });

    chatWindow.appendChild(starterPromptsContainer);
  }

  // Get placeholder from composer config or use default
  const inputPlaceholder = mergedConfig.composer?.placeholder || 'Type a message...';

  // Determine if we have accent enabled
  const hasAccent = !!mergedConfig.theme?.color?.accent;

  // Create input container - matches preview's pill-shaped composer
  const inputContainer = document.createElement('div');
  inputContainer.style.cssText = `
    padding: var(--cw-spacing-lg, 16px);
    padding-top: 0;
    background: var(--cw-surface-bg, ${isDark ? '#1a1a1a' : '#ffffff'});
  `;

  // Build composer form - pill shape like preview
  const composerRadius = mergedConfig.theme?.radius === 'none' ? '0px' : '999px';

  let inputAreaHTML = `
    <div style="
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px;
      background: var(--cw-composer-surface, var(--cw-surface-fg, ${isDark ? '#262626' : '#ffffff'}));
      border-radius: ${composerRadius};
      border: 1px solid var(--cw-border-color, ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'});
      box-shadow: ${isDark ? 'none' : '0 4px 12px rgba(0,0,0,0.05)'};
      transition: box-shadow 0.15s;
    ">
  `;

  // Attachment button (+ icon like preview)
  if (mergedConfig.features.fileAttachmentsEnabled) {
    inputAreaHTML += `
      <input
        type="file"
        id="n8n-chat-file-input"
        multiple
        accept="${mergedConfig.features.allowedExtensions.join(',')}"
        style="display: none;"
      />
      <button
        id="n8n-chat-attach"
        type="button"
        style="
          background: transparent;
          color: var(--cw-icon-color, ${isDark ? '#a1a1aa' : '#6b7280'});
          border: none;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          min-width: 32px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s;
        "
        title="Attach files"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
    `;
  } else {
    // Spacer to maintain layout
    inputAreaHTML += `<div style="width: 8px;"></div>`;
  }

  // Input field
  inputAreaHTML += `
      <input
        type="text"
        id="n8n-chat-input"
        placeholder="${inputPlaceholder}"
        style="
          flex: 1;
          border: none;
          background: transparent;
          outline: none;
          font-size: var(--cw-font-size-sm, 14px);
          font-family: inherit;
          color: var(--cw-text-color, ${isDark ? '#e5e5e5' : '#111827'});
          padding: 4px 8px;
        "
      />
  `;

  // Send button - matches preview styling
  inputAreaHTML += `
      <button
        id="n8n-chat-send"
        type="button"
        style="
          background: ${hasAccent ? `var(--cw-accent-primary, ${mergedConfig.style.primaryColor})` : (isDark ? '#e5e5e5' : '#171717')};
          color: ${hasAccent ? '#ffffff' : (isDark ? '#171717' : '#ffffff')};
          border: none;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          min-width: 32px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s, opacity 0.15s;
        "
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="19" x2="12" y2="5"></line>
          <polyline points="5 12 12 5 19 12"></polyline>
        </svg>
      </button>
    </div>
  `;

  inputContainer.innerHTML = inputAreaHTML;
  chatWindow.appendChild(inputContainer);

  // Add disclaimer if configured
  if (mergedConfig.composer?.disclaimer) {
    const disclaimer = document.createElement('div');
    disclaimer.style.cssText = `
      padding: var(--cw-spacing-xs, 4px) var(--cw-spacing-lg, 16px) var(--cw-spacing-sm, 8px);
      background: var(--cw-surface-bg, ${isDark ? '#1a1a1a' : '#ffffff'});
      font-size: var(--cw-font-size-sm, 12px);
      color: var(--cw-icon-color, ${isDark ? '#71717a' : '#9ca3af'});
      text-align: center;
    `;
    disclaimer.textContent = mergedConfig.composer.disclaimer;
    chatWindow.appendChild(disclaimer);
  }

  // Add branding footer if enabled
  if (mergedConfig.license?.brandingEnabled) {
    const footer = document.createElement('div');
    footer.style.cssText = `
      padding: var(--cw-spacing-sm, 8px) var(--cw-spacing-lg, 16px);
      background: var(--cw-surface-fg, ${isDark ? '#1a1a1a' : '#f8f9fa'});
      border-top: 1px solid var(--cw-border-color, ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'});
      text-align: center;
      font-size: var(--cw-font-size-sm, 12px);
      color: var(--cw-icon-color, ${isDark ? '#71717a' : '#6b7280'});
    `;
    footer.innerHTML = `Powered by <a href="https://n8n.io" target="_blank" style="color: var(--cw-accent-primary, ${mergedConfig.style.primaryColor}); text-decoration: none;">n8n</a>`;
    chatWindow.appendChild(footer);
  }

  // Input and send button handlers
  const input = inputContainer.querySelector('#n8n-chat-input') as HTMLInputElement;
  const sendBtn = inputContainer.querySelector('#n8n-chat-send') as HTMLButtonElement;
  const attachBtn = inputContainer.querySelector('#n8n-chat-attach') as HTMLButtonElement;
  const fileInput = inputContainer.querySelector('#n8n-chat-file-input') as HTMLInputElement;

  sendBtn.addEventListener('click', () => handleSendMessage());
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  });

  // File attachment handlers
  if (attachBtn && fileInput) {
    attachBtn.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        selectedFiles = Array.from(files);
        console.log(`[N8n Chat Widget] Selected ${selectedFiles.length} file(s)`);
      }
    });
  }

  // Toggle chat window
  function toggleChat() {
    isOpen = !isOpen;
    if (isOpen) {
      chatWindow.style.display = 'flex';
      bubble.style.display = 'none';

      // Add first message if no messages yet
      if (messages.length === 0 && mergedConfig.branding.firstMessage) {
        addMessage('assistant', mergedConfig.branding.firstMessage);
      }

      // Focus input
      input.focus();
    } else {
      chatWindow.style.display = 'none';
      bubble.style.display = 'flex';
    }
  }

  // Add message to UI
  function addMessage(role: 'user' | 'assistant', content: string, isLoading = false): Message {
    const message: Message = {
      id: `msg-${++messageIdCounter}`,
      role,
      content,
      timestamp: Date.now(),
    };
    messages.push(message);

    const messageEl = document.createElement('div');
    messageEl.id = message.id;
    messageEl.style.cssText = `
      margin-bottom: var(--cw-spacing-md, 12px);
      display: flex;
      ${role === 'user' ? 'justify-content: flex-end;' : 'justify-content: flex-start;'}
    `;

    const bubble = document.createElement('div');
    bubble.className = 'n8n-message-content';
    bubble.style.cssText = `
      max-width: 75%;
      padding: var(--cw-spacing-sm, 10px) var(--cw-spacing-md, 14px);
      border-radius: var(--cw-radius-lg, 12px);
      font-size: var(--cw-font-size, 14px);
      line-height: 1.5;
      ${role === 'user'
        ? `background: var(--cw-user-msg-bg, var(--cw-accent-primary, ${mergedConfig.style.primaryColor})); color: var(--cw-user-msg-text, #ffffff);`
        : `background: var(--cw-assistant-msg-bg, ${isDark ? '#2a2a2a' : '#f3f4f6'}); color: var(--cw-assistant-msg-text, ${isDark ? '#e5e5e5' : '#1f2937'}); box-shadow: var(--cw-shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05));`}
    `;

    // Render markdown for assistant messages
    if (role === 'assistant') {
      if (isLoading) {
        bubble.innerHTML = `
          <div class="n8n-typing-container">
            <div class="n8n-typing-dot"></div>
            <div class="n8n-typing-dot"></div>
            <div class="n8n-typing-dot"></div>
          </div>
        `;
      } else {
        bubble.innerHTML = renderMarkdown(content);
      }
    } else {
      bubble.textContent = content;
    }

    messageEl.appendChild(bubble);
    messagesContainer.appendChild(messageEl);

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    return message;
  }

  // Update message content (for streaming)
  function updateMessage(messageId: string, content: string) {
    const messageEl = messagesContainer.querySelector(`#${messageId}`) as HTMLElement;
    if (!messageEl) return;

    const bubble = messageEl.querySelector('div');
    if (bubble) {
      bubble.innerHTML = renderMarkdown(content);
    }

    // Update message in state
    const message = messages.find(m => m.id === messageId);
    if (message) {
      message.content = content;
    }

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Handle sending message
  async function handleSendMessage() {
    const text = input.value.trim();
    if (!text) return;

    // Add user message
    addMessage('user', text);
    input.value = '';

    // Create placeholder for assistant response
    const assistantMessage = addMessage('assistant', '', true);

    // Send to N8n webhook with SSE streaming
    try {
      await streamResponse(text, assistantMessage.id);
    } catch (error) {
      console.error('[N8n Chat Widget] Error sending message:', error);
      updateMessage(assistantMessage.id, 'Sorry, there was an error processing your message. Please try again.');
    }
  }

  // Capture page context (URL, query params, title, domain)
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
    } catch (error) {
      console.error('[N8n Chat Widget] Error capturing page context:', error);
      return {
        pageUrl: window.location.href,
        pagePath: window.location.pathname,
        pageTitle: document.title,
        queryParams: {},
        domain: window.location.hostname,
      };
    }
  }

  // Encode file as base64 for transmission
  async function encodeFile(file: File): Promise<FileAttachment> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (data:...;base64,)
        const base64Data = result.split(',')[1];

        resolve({
          name: file.name,
          type: file.type,
          data: base64Data,
          size: file.size,
        });
      };

      reader.onerror = () => {
        reject(new Error(`Failed to read file: ${file.name}`));
      };

      reader.readAsDataURL(file);
    });
  }

  // Send message to N8n webhook using POST
  async function streamResponse(userMessage: string, assistantMessageId: string) {
    const relayUrl = runtimeConfig.relay.relayUrl;
    const sessionId = sessionManager.getSessionId();

    try {
      const shouldCaptureContext = mergedConfig.connection?.captureContext !== false;

      // Encode file attachments if present
      let fileAttachments: FileAttachment[] | undefined;
      if (selectedFiles.length > 0 && mergedConfig.features.fileAttachmentsEnabled) {
        fileAttachments = await Promise.all(
          selectedFiles.map((file) => encodeFile(file))
        );
        // Clear selected files after encoding
        selectedFiles = [];
        if (fileInput) {
          fileInput.value = '';
        }
      }

      const payload = buildRelayPayload(runtimeConfig, {
        message: userMessage,
        sessionId,
        context: shouldCaptureContext ? capturePageContext() : undefined,
        customContext: mergedConfig.connection?.customContext,
        extraInputs: mergedConfig.connection?.extraInputs,
        attachments: fileAttachments,
      });

      // Send POST request to relay endpoint
      const response = await fetch(relayUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Parse JSON response
      const data = await response.json();

      // N8n webhook should return { response: "..." } or { message: "..." }
      const assistantResponse = data.response || data.message || data.output || 'No response received';

      // Update message with response
      updateMessage(assistantMessageId, assistantResponse);

    } catch (error) {
      console.error('[N8n Chat Widget] Error sending message:', error);
      updateMessage(assistantMessageId, 'Sorry, there was an error connecting to the server. Please try again.');
      throw error;
    }
  }
}
