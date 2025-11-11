/**
 * Chat Widget Core
 *
 * Purpose: Main widget UI and interaction logic
 * Responsibility: Create chat bubble, message list, input, handle sending/streaming
 *
 * Constraints:
 * - Vanilla JavaScript (no framework dependencies)
 * - Minimal DOM manipulation for performance
 * - SSE streaming for N8n responses
 * - Basic markdown rendering
 */

import { WidgetConfig, Message } from './types';
import { renderMarkdown } from './markdown';

export function createChatWidget(config: WidgetConfig): void {
  const messages: Message[] = [];
  let isOpen = false;
  let messageIdCounter = 0;

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
      position: config.style?.position || 'bottom-right',
      cornerRadius: config.style?.cornerRadius || 12,
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

  sendBtn.addEventListener('click', () => handleSendMessage());
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  });

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
  function addMessage(role: 'user' | 'assistant', content: string): Message {
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
      bubble.innerHTML = renderMarkdown(content);
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
    const assistantMessage = addMessage('assistant', '...');

    // Send to N8n webhook with SSE streaming
    try {
      await streamResponse(text, assistantMessage.id);
    } catch (error) {
      console.error('[N8n Chat Widget] Error sending message:', error);
      updateMessage(assistantMessage.id, 'Sorry, there was an error processing your message. Please try again.');
    }
  }

  // Stream response from N8n webhook using SSE
  async function streamResponse(userMessage: string, assistantMessageId: string) {
    const webhookUrl = mergedConfig.connection.webhookUrl;

    // Append route param if specified
    const url = mergedConfig.connection.routeParam
      ? `${webhookUrl}${webhookUrl.includes('?') ? '&' : '?'}${mergedConfig.connection.routeParam}`
      : webhookUrl;

    let accumulatedContent = '';

    // Use EventSource for SSE streaming
    const eventSource = new EventSource(`${url}&message=${encodeURIComponent(userMessage)}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // N8n sends chunks in { chunk: "..." } format
        if (data.chunk) {
          accumulatedContent += data.chunk;
          updateMessage(assistantMessageId, accumulatedContent);
        }

        // Check for completion signal
        if (data.done) {
          eventSource.close();
        }
      } catch (error) {
        console.error('[N8n Chat Widget] Error parsing SSE data:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('[N8n Chat Widget] SSE error:', error);
      eventSource.close();

      // Show error message if no content received
      if (!accumulatedContent) {
        updateMessage(assistantMessageId, 'Connection error. Please try again.');
      }
    };

    // Timeout after 30 seconds
    setTimeout(() => {
      if (eventSource.readyState !== EventSource.CLOSED) {
        eventSource.close();
        if (!accumulatedContent) {
          updateMessage(assistantMessageId, 'Request timed out. Please try again.');
        }
      }
    }, 30000);
  }
}
