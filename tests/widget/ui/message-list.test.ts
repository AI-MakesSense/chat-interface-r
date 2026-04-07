/**
 * Unit Tests for Message List Component
 *
 * Tests for widget/src/ui/message-list.ts
 *
 * Test Coverage:
 * - Rendering and DOM structure
 * - Empty state handling
 * - Message display
 * - Auto-scroll behavior
 * - User scroll detection
 * - Message types (user, assistant, error)
 * - State subscription
 * - ARIA attributes
 * - Performance
 * - Lifecycle and cleanup
 *
 * EXPECTED TO FAIL: MessageList class does not exist yet (RED phase)
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { MessageList } from '@/widget/src/ui/message-list';
import { WidgetConfig } from '@/widget/src/types';
import { StateManager, WidgetState, Message } from '@/widget/src/core/state';

describe('MessageList', () => {
  let config: WidgetConfig;
  let stateManager: StateManager;
  let messageList: MessageList;
  let container: HTMLElement;

  const defaultConfig: WidgetConfig = {
    branding: {
      companyName: 'Test Company',
      welcomeText: 'Hello!',
      firstMessage: 'How can I help?',
    },
    style: {
      theme: 'light',
      primaryColor: '#00bfff',
      backgroundColor: '#ffffff',
      textColor: '#000000',
      position: 'bottom-right',
      cornerRadius: 8,
      fontFamily: 'Arial',
      fontSize: 14,
    },
    features: {
      fileAttachmentsEnabled: false,
      allowedExtensions: [],
      maxFileSizeKB: 0,
    },
    connection: {
      webhookUrl: 'https://example.com/webhook',
    },
  };

  const defaultState: WidgetState = {
    isOpen: true,
    messages: [],
    isLoading: false,
    error: null,
    currentStreamingMessage: null,
    currentTheme: 'light',
  };

  const sampleMessages: Message[] = [
    {
      id: '1',
      role: 'user',
      content: 'Hello there!',
      timestamp: Date.now() - 2000,
    },
    {
      id: '2',
      role: 'assistant',
      content: 'Hi! How can I help you today?',
      timestamp: Date.now() - 1000,
    },
  ];

  beforeEach(() => {
    config = JSON.parse(JSON.stringify(defaultConfig));
    stateManager = new StateManager(defaultState);
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (messageList) {
      messageList.destroy();
    }
    document.body.removeChild(container);
    vi.clearAllMocks();
  });

  // ============================================================
  // Rendering Tests
  // ============================================================

  describe('render()', () => {
    test('should create message list element with correct class', () => {
      // FAILS: MessageList class does not exist
      messageList = new MessageList(config, stateManager);
      const element = messageList.render();

      expect(element.tagName).toBe('DIV');
      expect(element.classList.contains('cw-message-list')).toBe(true);
    });

    test('should have role="log" for accessibility', () => {
      // FAILS: ARIA role not set
      messageList = new MessageList(config, stateManager);
      const element = messageList.render();

      expect(element.getAttribute('role')).toBe('log');
    });

    test('should have aria-live="polite" for screen readers', () => {
      // FAILS: aria-live not set
      messageList = new MessageList(config, stateManager);
      const element = messageList.render();

      expect(element.getAttribute('aria-live')).toBe('polite');
    });

    test('should have aria-label describing message list', () => {
      // FAILS: aria-label not implemented
      messageList = new MessageList(config, stateManager);
      const element = messageList.render();

      const ariaLabel = element.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel).toMatch(/message|conversation/i);
    });

    test('should be scrollable', () => {
      // FAILS: Scrollable styles not applied
      messageList = new MessageList(config, stateManager);
      const element = messageList.render();

      const styles = window.getComputedStyle(element);
      expect(styles.overflowY).toBe('auto');
    });

    test('should have flex-grow to fill available space', () => {
      // FAILS: Flex styles not applied
      messageList = new MessageList(config, stateManager);
      const element = messageList.render();

      const styles = window.getComputedStyle(element);
      expect(styles.flexGrow).toBe('1');
    });
  });

  // ============================================================
  // Empty State Tests
  // ============================================================

  describe('empty state', () => {
    test('should render empty state when no messages', () => {
      // FAILS: Empty state not implemented
      stateManager = new StateManager({ ...defaultState, messages: [] });
      messageList = new MessageList(config, stateManager);
      const element = messageList.render();
      container.appendChild(element);

      const emptyState = element.querySelector('.cw-empty-state');
      expect(emptyState).toBeTruthy();
    });

    test('should show welcome message in empty state', () => {
      // FAILS: Welcome message not displayed
      config.branding.welcomeText = 'Welcome to our chat!';
      stateManager = new StateManager({ ...defaultState, messages: [] });
      messageList = new MessageList(config, stateManager);
      const element = messageList.render();
      container.appendChild(element);

      expect(element.textContent).toContain('Welcome to our chat!');
    });

    test('should show first message in empty state', () => {
      // FAILS: First message not displayed
      config.branding.firstMessage = 'How can I assist you?';
      stateManager = new StateManager({ ...defaultState, messages: [] });
      messageList = new MessageList(config, stateManager);
      const element = messageList.render();
      container.appendChild(element);

      expect(element.textContent).toContain('How can I assist you?');
    });

    test('should hide empty state when messages exist', () => {
      // FAILS: Empty state conditional logic not implemented
      stateManager = new StateManager({ ...defaultState, messages: sampleMessages });
      messageList = new MessageList(config, stateManager);
      const element = messageList.render();
      container.appendChild(element);

      const emptyState = element.querySelector('.cw-empty-state');
      expect(emptyState).toBeNull();
    });
  });

  // ============================================================
  // Message Rendering Tests
  // ============================================================

  describe('message rendering', () => {
    test('should render all messages from state', () => {
      // FAILS: Message rendering not implemented
      stateManager = new StateManager({ ...defaultState, messages: sampleMessages });
      messageList = new MessageList(config, stateManager);
      const element = messageList.render();
      container.appendChild(element);

      const messageElements = element.querySelectorAll('.cw-message');
      expect(messageElements.length).toBe(2);
    });

    test('should render user messages with correct class', () => {
      // FAILS: User message styling not implemented
      const userMessage: Message = {
        id: '1',
        role: 'user',
        content: 'Test user message',
        timestamp: Date.now(),
      };
      stateManager = new StateManager({ ...defaultState, messages: [userMessage] });
      messageList = new MessageList(config, stateManager);
      const element = messageList.render();
      container.appendChild(element);

      const messageElement = element.querySelector('.cw-message');
      expect(messageElement?.classList.contains('cw-message-user')).toBe(true);
    });

    test('should render assistant messages with correct class', () => {
      // FAILS: Assistant message styling not implemented
      const assistantMessage: Message = {
        id: '2',
        role: 'assistant',
        content: 'Test assistant message',
        timestamp: Date.now(),
      };
      stateManager = new StateManager({ ...defaultState, messages: [assistantMessage] });
      messageList = new MessageList(config, stateManager);
      const element = messageList.render();
      container.appendChild(element);

      const messageElement = element.querySelector('.cw-message');
      expect(messageElement?.classList.contains('cw-message-assistant')).toBe(true);
    });

    test('should render message content correctly', () => {
      // FAILS: Message content not displayed
      const message: Message = {
        id: '1',
        role: 'user',
        content: 'This is my test message',
        timestamp: Date.now(),
      };
      stateManager = new StateManager({ ...defaultState, messages: [message] });
      messageList = new MessageList(config, stateManager);
      const element = messageList.render();
      container.appendChild(element);

      expect(element.textContent).toContain('This is my test message');
    });

    test('should render messages in chronological order', () => {
      // FAILS: Message ordering not implemented
      const messages: Message[] = [
        { id: '1', role: 'user', content: 'First', timestamp: 1000 },
        { id: '2', role: 'assistant', content: 'Second', timestamp: 2000 },
        { id: '3', role: 'user', content: 'Third', timestamp: 3000 },
      ];
      stateManager = new StateManager({ ...defaultState, messages });
      messageList = new MessageList(config, stateManager);
      const element = messageList.render();
      container.appendChild(element);

      const messageElements = element.querySelectorAll('.cw-message');
      expect(messageElements[0].textContent).toContain('First');
      expect(messageElements[1].textContent).toContain('Second');
      expect(messageElements[2].textContent).toContain('Third');
    });

    test('should update when new message added to state', () => {
      // FAILS: State subscription for messages not implemented
      stateManager = new StateManager({ ...defaultState, messages: [sampleMessages[0]] });
      messageList = new MessageList(config, stateManager);
      const element = messageList.render();
      container.appendChild(element);

      expect(element.querySelectorAll('.cw-message').length).toBe(1);

      stateManager.setState({ messages: sampleMessages });

      expect(element.querySelectorAll('.cw-message').length).toBe(2);
    });

    test('should escape HTML in message content', () => {
      // FAILS: XSS protection not implemented
      const maliciousMessage: Message = {
        id: '1',
        role: 'user',
        content: '<script>alert("xss")</script>',
        timestamp: Date.now(),
      };
      stateManager = new StateManager({ ...defaultState, messages: [maliciousMessage] });
      messageList = new MessageList(config, stateManager);
      const element = messageList.render();
      container.appendChild(element);

      expect(element.innerHTML).not.toContain('<script>');
      expect(element.textContent).toContain('script');
    });
  });

  // ============================================================
  // Auto-Scroll Tests
  // ============================================================

  describe('auto-scroll', () => {
    test('should scroll to bottom on initial render with messages', () => {
      // FAILS: Auto-scroll not implemented
      stateManager = new StateManager({ ...defaultState, messages: sampleMessages });
      messageList = new MessageList(config, stateManager);
      const element = messageList.render();
      container.appendChild(element);

      // Mock scrollHeight to be greater than clientHeight
      Object.defineProperty(element, 'scrollHeight', { value: 1000, writable: true });
      Object.defineProperty(element, 'clientHeight', { value: 500, writable: true });
      Object.defineProperty(element, 'scrollTop', { value: 0, writable: true });

      // After render, should scroll to bottom
      expect(element.scrollTop).toBeGreaterThan(0);
    });

    test('should auto-scroll when new message added', () => {
      // FAILS: Auto-scroll on new message not implemented
      stateManager = new StateManager({ ...defaultState, messages: [sampleMessages[0]] });
      messageList = new MessageList(config, stateManager);
      const element = messageList.render();
      container.appendChild(element);

      Object.defineProperty(element, 'scrollHeight', { value: 1000, writable: true });
      Object.defineProperty(element, 'clientHeight', { value: 500, writable: true });

      const scrollSpy = vi.spyOn(element, 'scrollTo');

      stateManager.setState({ messages: sampleMessages });

      expect(scrollSpy).toHaveBeenCalled();
    });

    test('should not auto-scroll if user scrolled up', () => {
      // FAILS: Scroll position detection not implemented
      stateManager = new StateManager({ ...defaultState, messages: [sampleMessages[0]] });
      messageList = new MessageList(config, stateManager);
      const element = messageList.render();
      container.appendChild(element);

      Object.defineProperty(element, 'scrollHeight', { value: 1000, writable: true });
      Object.defineProperty(element, 'clientHeight', { value: 500, writable: true });
      Object.defineProperty(element, 'scrollTop', { value: 200, writable: true });

      const initialScrollTop = element.scrollTop;

      stateManager.setState({ messages: sampleMessages });

      // Should not auto-scroll if user scrolled up
      expect(element.scrollTop).toBe(initialScrollTop);
    });

    test('should detect when user is at bottom', () => {
      // FAILS: Bottom detection logic not implemented
      stateManager = new StateManager({ ...defaultState, messages: sampleMessages });
      messageList = new MessageList(config, stateManager);
      const element = messageList.render();
      container.appendChild(element);

      Object.defineProperty(element, 'scrollHeight', { value: 1000, writable: true });
      Object.defineProperty(element, 'clientHeight', { value: 500, writable: true });
      Object.defineProperty(element, 'scrollTop', { value: 500, writable: true });

      // User is at bottom (scrollTop + clientHeight = scrollHeight)
      const isAtBottom = element.scrollTop + element.clientHeight >= element.scrollHeight - 10;
      expect(isAtBottom).toBe(true);
    });
  });

  // ============================================================
  // Message Type Tests
  // ============================================================

  describe('message types', () => {
    test('should handle user message type', () => {
      // FAILS: User message rendering not implemented
      const userMessage: Message = {
        id: '1',
        role: 'user',
        content: 'User message',
        timestamp: Date.now(),
      };
      stateManager = new StateManager({ ...defaultState, messages: [userMessage] });
      messageList = new MessageList(config, stateManager);
      const element = messageList.render();
      container.appendChild(element);

      const messageElement = element.querySelector('.cw-message-user');
      expect(messageElement).toBeTruthy();
    });

    test('should handle assistant message type', () => {
      // FAILS: Assistant message rendering not implemented
      const assistantMessage: Message = {
        id: '2',
        role: 'assistant',
        content: 'Assistant message',
        timestamp: Date.now(),
      };
      stateManager = new StateManager({ ...defaultState, messages: [assistantMessage] });
      messageList = new MessageList(config, stateManager);
      const element = messageList.render();
      container.appendChild(element);

      const messageElement = element.querySelector('.cw-message-assistant');
      expect(messageElement).toBeTruthy();
    });

    test('should style user messages differently from assistant', () => {
      // FAILS: Different styling not implemented
      stateManager = new StateManager({ ...defaultState, messages: sampleMessages });
      messageList = new MessageList(config, stateManager);
      const element = messageList.render();
      container.appendChild(element);

      const userMessage = element.querySelector('.cw-message-user');
      const assistantMessage = element.querySelector('.cw-message-assistant');

      expect(userMessage?.classList.toString()).not.toBe(assistantMessage?.classList.toString());
    });

    test('should align user messages to right', () => {
      // FAILS: User message alignment not implemented
      const userMessage: Message = {
        id: '1',
        role: 'user',
        content: 'User message',
        timestamp: Date.now(),
      };
      stateManager = new StateManager({ ...defaultState, messages: [userMessage] });
      messageList = new MessageList(config, stateManager);
      const element = messageList.render();
      container.appendChild(element);

      const messageElement = element.querySelector('.cw-message-user') as HTMLElement;
      const styles = window.getComputedStyle(messageElement);

      // User messages should align right
      expect(styles.marginLeft || styles.textAlign || styles.alignSelf).toBeTruthy();
    });

    test('should align assistant messages to left', () => {
      // FAILS: Assistant message alignment not implemented
      const assistantMessage: Message = {
        id: '2',
        role: 'assistant',
        content: 'Assistant message',
        timestamp: Date.now(),
      };
      stateManager = new StateManager({ ...defaultState, messages: [assistantMessage] });
      messageList = new MessageList(config, stateManager);
      const element = messageList.render();
      container.appendChild(element);

      const messageElement = element.querySelector('.cw-message-assistant') as HTMLElement;
      const styles = window.getComputedStyle(messageElement);

      expect(styles.marginRight || styles.textAlign || styles.alignSelf).toBeTruthy();
    });
  });

  // ============================================================
  // State Subscription Tests
  // ============================================================

  describe('state subscription', () => {
    test('should subscribe to state changes on construction', () => {
      // FAILS: Subscribe not called
      const subscribeSpy = vi.spyOn(stateManager, 'subscribe');

      messageList = new MessageList(config, stateManager);
      messageList.render();

      expect(subscribeSpy).toHaveBeenCalled();
    });

    test('should re-render when messages state changes', () => {
      // FAILS: Message state listener not implemented
      stateManager = new StateManager({ ...defaultState, messages: [] });
      messageList = new MessageList(config, stateManager);
      const element = messageList.render();
      container.appendChild(element);

      expect(element.querySelectorAll('.cw-message').length).toBe(0);

      stateManager.setState({ messages: sampleMessages });

      expect(element.querySelectorAll('.cw-message').length).toBe(2);
    });

    test('should not re-render on irrelevant state changes', () => {
      // FAILS: Might re-render unnecessarily
      stateManager = new StateManager({ ...defaultState, messages: sampleMessages });
      messageList = new MessageList(config, stateManager);
      const element = messageList.render();
      container.appendChild(element);

      const initialHtml = element.innerHTML;

      stateManager.setState({ isLoading: true });

      // Should not re-render for irrelevant state
      expect(element.innerHTML).toBe(initialHtml);
    });

    test('should handle rapid message additions', () => {
      // FAILS: Performance optimization not implemented
      stateManager = new StateManager({ ...defaultState, messages: [] });
      messageList = new MessageList(config, stateManager);
      const element = messageList.render();
      container.appendChild(element);

      for (let i = 0; i < 10; i++) {
        const newMessage: Message = {
          id: `msg-${i}`,
          role: i % 2 === 0 ? 'user' : 'assistant',
          content: `Message ${i}`,
          timestamp: Date.now() + i,
        };
        stateManager.setState({
          messages: [...stateManager.getState().messages, newMessage],
        });
      }

      expect(element.querySelectorAll('.cw-message').length).toBe(10);
    });
  });

  // ============================================================
  // Styling Tests
  // ============================================================

  describe('styling', () => {
    test('should apply background color from config', () => {
      // FAILS: Background color not applied
      config.style.backgroundColor = '#f5f5f5';
      messageList = new MessageList(config, stateManager);
      const element = messageList.render();

      const styles = window.getComputedStyle(element);
      expect(styles.backgroundColor).toBeTruthy();
    });

    test('should apply text color from config', () => {
      // FAILS: Text color not applied
      config.style.textColor = '#333333';
      messageList = new MessageList(config, stateManager);
      const element = messageList.render();

      const styles = window.getComputedStyle(element);
      expect(styles.color).toBeTruthy();
    });

    test('should apply light theme class', () => {
      // FAILS: Theme class not added
      config.style.theme = 'light';
      messageList = new MessageList(config, stateManager);
      const element = messageList.render();

      expect(element.classList.contains('cw-theme-light')).toBe(true);
    });

    test('should apply dark theme class', () => {
      // FAILS: Dark theme not implemented
      config.style.theme = 'dark';
      messageList = new MessageList(config, stateManager);
      const element = messageList.render();

      expect(element.classList.contains('cw-theme-dark')).toBe(true);
    });

    test('should have proper message spacing', () => {
      // FAILS: Message spacing not implemented
      stateManager = new StateManager({ ...defaultState, messages: sampleMessages });
      messageList = new MessageList(config, stateManager);
      const element = messageList.render();
      container.appendChild(element);

      const firstMessage = element.querySelector('.cw-message') as HTMLElement;
      const styles = window.getComputedStyle(firstMessage);

      expect(styles.marginBottom || styles.gap || styles.padding).toBeTruthy();
    });
  });

  // ============================================================
  // Lifecycle Tests
  // ============================================================

  describe('lifecycle', () => {
    test('should clean up event listeners on destroy', () => {
      // FAILS: destroy() not implemented
      messageList = new MessageList(config, stateManager);
      const element = messageList.render();
      container.appendChild(element);

      messageList.destroy();

      stateManager.setState({ messages: sampleMessages });

      // Should not update after destroy
      expect(element.querySelectorAll('.cw-message').length).toBe(0);
    });

    test('should unsubscribe from state on destroy', () => {
      // FAILS: State unsubscribe not called
      const unsubscribeSpy = vi.fn();
      stateManager.subscribe = vi.fn(() => unsubscribeSpy);

      messageList = new MessageList(config, stateManager);
      messageList.render();

      messageList.destroy();

      expect(unsubscribeSpy).toHaveBeenCalled();
    });

    test('should handle multiple destroy calls safely', () => {
      // FAILS: Idempotent destroy not implemented
      messageList = new MessageList(config, stateManager);
      messageList.render();

      expect(() => {
        messageList.destroy();
        messageList.destroy();
      }).not.toThrow();
    });

    test('should remove scroll listener on destroy', () => {
      // FAILS: Scroll listener cleanup not implemented
      messageList = new MessageList(config, stateManager);
      const element = messageList.render();
      container.appendChild(element);

      const removeEventListenerSpy = vi.spyOn(element, 'removeEventListener');

      messageList.destroy();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
    });
  });

  // ============================================================
  // Edge Cases
  // ============================================================

  describe('edge cases', () => {
    test('should handle missing config gracefully', () => {
      // FAILS: Validation not implemented
      expect(() => {
        messageList = new MessageList(null as any, stateManager);
      }).toThrow();
    });

    test('should handle missing state manager gracefully', () => {
      // FAILS: StateManager validation not implemented
      expect(() => {
        messageList = new MessageList(config, null as any);
      }).toThrow();
    });

    test('should handle empty messages array', () => {
      // FAILS: Empty array handling not implemented
      stateManager = new StateManager({ ...defaultState, messages: [] });
      messageList = new MessageList(config, stateManager);
      const element = messageList.render();

      expect(element).toBeTruthy();
    });

    test('should handle very long message content', () => {
      // FAILS: Long content handling not implemented
      const longMessage: Message = {
        id: '1',
        role: 'user',
        content: 'A'.repeat(10000),
        timestamp: Date.now(),
      };
      stateManager = new StateManager({ ...defaultState, messages: [longMessage] });
      messageList = new MessageList(config, stateManager);
      const element = messageList.render();
      container.appendChild(element);

      expect(element.textContent).toContain('A');
    });

    test('should handle many messages efficiently', () => {
      // FAILS: Performance optimization not implemented
      const manyMessages: Message[] = Array.from({ length: 100 }, (_, i) => ({
        id: `msg-${i}`,
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i}`,
        timestamp: Date.now() + i,
      }));

      stateManager = new StateManager({ ...defaultState, messages: manyMessages });

      const startTime = performance.now();
      messageList = new MessageList(config, stateManager);
      messageList.render();
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should render in under 100ms
    });
  });
});
