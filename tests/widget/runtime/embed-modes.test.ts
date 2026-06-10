import { createChatWidget } from '@/widget/src/widget';
import type { WidgetRuntimeConfig } from '@/widget/src/types';

function createRuntimeConfig(overrides?: Partial<WidgetRuntimeConfig>): WidgetRuntimeConfig {
  return {
    uiConfig: {
      branding: {
        companyName: 'Test Support',
        welcomeText: 'Welcome',
        firstMessage: '',
      },
      style: {
        theme: 'light',
        primaryColor: '#0ea5e9',
        backgroundColor: '#ffffff',
        textColor: '#111827',
        position: 'bottom-right',
        cornerRadius: 12,
        fontFamily: 'System',
        fontSize: 16,
      },
      features: {
        fileAttachmentsEnabled: false,
        allowedExtensions: ['txt'],
        maxFileSizeKB: 1000,
      },
      connection: {
        webhookUrl: 'https://example.com/webhook',
      },
    },
    relay: {
      relayUrl: 'https://example.com/api/chat-relay',
      widgetId: 'widget-test',
      licenseKey: 'AbCdEfGh12345678',
    },
    ...overrides,
  };
}

describe('Widget runtime embed modes', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
  });

  it('renders popup mode with launcher bubble by default', () => {
    createChatWidget(createRuntimeConfig());

    const container = document.getElementById('n8n-chat-widget-container');
    const bubble = document.getElementById('n8n-chat-bubble');
    const chatWindow = document.getElementById('n8n-chat-window');

    expect(container).not.toBeNull();
    expect(bubble).not.toBeNull();
    expect(chatWindow).not.toBeNull();
    expect(chatWindow?.style.display).toBe('none');
  });

  it('renders inline mode inside target container without launcher bubble', () => {
    const mount = document.createElement('div');
    mount.id = 'inline-target';
    document.body.appendChild(mount);

    createChatWidget(
      createRuntimeConfig({
        display: {
          mode: 'inline',
          containerId: 'inline-target',
        },
      })
    );

    const container = document.getElementById('n8n-chat-widget-container');
    const bubble = document.getElementById('n8n-chat-bubble');
    const chatWindow = document.getElementById('n8n-chat-window');

    expect(container).not.toBeNull();
    expect(mount.contains(container as Node)).toBe(true);
    expect(bubble).toBeNull();
    expect(chatWindow?.style.display).toBe('flex');
  });

  it('renders portal mode full-screen without launcher bubble', () => {
    const portal = document.createElement('div');
    portal.id = 'chat-portal';
    document.body.appendChild(portal);

    createChatWidget(
      createRuntimeConfig({
        display: {
          mode: 'portal',
          containerId: 'chat-portal',
        },
      })
    );

    const container = document.getElementById('n8n-chat-widget-container');
    const bubble = document.getElementById('n8n-chat-bubble');
    const chatWindow = document.getElementById('n8n-chat-window');

    expect(container).not.toBeNull();
    expect(portal.contains(container as Node)).toBe(true);
    expect(bubble).toBeNull();
    expect(chatWindow?.style.display).toBe('flex');
    expect(container?.style.position).toBe('fixed');
  });
});
