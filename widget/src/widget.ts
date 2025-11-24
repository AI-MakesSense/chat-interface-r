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
 */

import { WidgetRuntimeConfig, WidgetConfig, Message } from './types';
import { renderMarkdown } from './markdown';
import { buildRelayPayload } from './services/messaging/payload';
import { SessionManager } from './services/messaging/session-manager';
import type { FileAttachment } from './services/messaging/types';

export function createChatWidget(runtimeConfig: WidgetRuntimeConfig): void {
  const messages: Message[] = [];
  let isOpen = false;
  let messageIdCounter = 0;
  let selectedFiles: File[] = [];
  const config = runtimeConfig.uiConfig || ({} as WidgetConfig);

  // Initialize SessionManager for session continuity
  const sessionManager = new SessionManager(runtimeConfig.relay.licenseKey || 'default');

  // Apply default config
  const mergedConfig: WidgetConfig = {
    branding: {
      companyName: config.branding?.companyName || 'Support',
      welcomeText: config.branding?.welcomeText || 'How can we help you?',
      firstMessage: config.branding?.firstMessage || 'Hello! Ask me anything.',
      logoUrl: config.branding?.logoUrl,
    },
    style: {
      theme: config.style?.theme || 'light',
      primaryColor: config.style?.primaryColor || '#00bfff',
      backgroundColor: config.style?.backgroundColor || '#ffffff',
      textColor: config.style?.textColor || '#333333',
      fontFamily: config.style?.fontFamily || '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: config.style?.fontSize || 14,
      position: config.style?.position || 'bottom-right',
      cornerRadius: config.style?.cornerRadius || 12,
    },
    features: {
      fileAttachmentsEnabled: config.features?.fileAttachmentsEnabled || false,
      allowedExtensions: config.features?.allowedExtensions || ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'],
      maxFileSizeKB: config.features?.maxFileSizeKB || 5000,
    },
    connection: config.connection,
    license: config.license,
  };

  // Create container
  const container = document.createElement('div');
  container.id = 'n8n-chat-widget-container';
  container.style.cssText = `
    position: fixed;
    ${mergedConfig.style.position === 'bottom-right' ? 'right: 20px;' : 'left: 20px;'}
    bottom: 20px;
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;
  document.body.appendChild(container);

  // Create chat bubble button
  const bubble = document.createElement('button');
  bubble.id = 'n8n-chat-bubble';
  bubble.setAttribute('aria-label', 'Open chat');
  bubble.style.cssText = `
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: ${mergedConfig.style.primaryColor};
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s;
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
    width: 380px;
    height: 600px;
    max-height: 80vh;
    background: white;
    border-radius: ${mergedConfig.style.cornerRadius}px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    flex-direction: column;
    overflow: hidden;
    margin-bottom: 12px;
  `;
  container.appendChild(chatWindow);

  // Create header
  const header = document.createElement('div');
  header.style.cssText = `
    background: ${mergedConfig.style.primaryColor};
    color: white;
    padding: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  `;
  header.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px;">
      ${mergedConfig.branding.logoUrl ? `<img src="${mergedConfig.branding.logoUrl}" alt="Logo" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;" />` : ''}
      <div>
        <div style="font-weight: 600; font-size: 16px;">${mergedConfig.branding.companyName}</div>
        <div style="font-size: 13px; opacity: 0.9;">${mergedConfig.branding.welcomeText}</div>
      </div>
    </div>
    <button id="n8n-chat-close" style="background: none; border: none; color: white; cursor: pointer; font-size: 24px; line-height: 1; padding: 0; width: 28px; height: 28px;">×</button>
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
    padding: 16px;
    background: #f8f9fa;
  `;
  chatWindow.appendChild(messagesContainer);

  // Create input container
  const inputContainer = document.createElement('div');
  inputContainer.style.cssText = `
    padding: 16px;
    background: white;
    border-top: 1px solid #e5e7eb;
    display: flex;
    gap: 8px;
  `;
  inputContainer.innerHTML = `
    <input
      type="text"
      id="n8n-chat-input"
      placeholder="Type your message..."
      style="
        flex: 1;
        padding: 10px 14px;
        border: 1px solid #d1d5db;
        border-radius: 20px;
        outline: none;
        font-size: 14px;
      "
    />
    ${mergedConfig.features.fileAttachmentsEnabled ? `
    <input
      type="file"
      id="n8n-chat-file-input"
      multiple
      accept="${mergedConfig.features.allowedExtensions.join(',')}"
      style="display: none;"
    />
    <button
      id="n8n-chat-attach"
      style="
        background: transparent;
        color: ${mergedConfig.style.primaryColor};
        border: 1px solid ${mergedConfig.style.primaryColor};
        border-radius: 50%;
        width: 40px;
        height: 40px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
      "
      title="Attach files"
    >
      📎
    </button>
    ` : ''}
    <button
      id="n8n-chat-send"
      style="
        background: ${mergedConfig.style.primaryColor};
        color: white;
        border: none;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      "
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="white"/>
      </svg>
    </button>
  `;
  chatWindow.appendChild(inputContainer);

  // Add branding footer if enabled
  if (mergedConfig.license?.brandingEnabled) {
    const footer = document.createElement('div');
    footer.style.cssText = `
      padding: 8px 16px;
      background: #f8f9fa;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
    `;
    footer.innerHTML = `Powered by <a href="https://n8n.io" target="_blank" style="color: ${mergedConfig.style.primaryColor}; text-decoration: none;">n8n</a>`;
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
      margin-bottom: 12px;
      display: flex;
      ${role === 'user' ? 'justify-content: flex-end;' : 'justify-content: flex-start;'}
    `;

    const bubble = document.createElement('div');
    bubble.style.cssText = `
      max-width: 75%;
      padding: 10px 14px;
      border-radius: 12px;
      font-size: 14px;
      line-height: 1.4;
      ${role === 'user'
        ? `background: ${mergedConfig.style.primaryColor}; color: white;`
        : 'background: white; color: #1f2937; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);'}
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
