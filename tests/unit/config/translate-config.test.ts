/**
 * Unit Tests for translateConfig Function
 *
 * Tests the transformation from database config format to widget-consumable format.
 * This is the critical function that bridges configurator output to embed input.
 *
 * Location: app/api/widget/[license]/config/route.ts
 */

import { describe, it, expect } from 'vitest';

// ===========================================================================
// translateConfig implementation (extracted from route.ts for testing)
// ===========================================================================

interface WidgetConfig {
  widgetId?: string;
  license?: any;
  branding: {
    companyName: string;
    logoUrl?: string;
    welcomeText: string;
    firstMessage: string;
  };
  style?: {
    position?: string;
  };
  features: {
    fileAttachmentsEnabled: boolean;
    allowedExtensions: string[];
    maxFileSizeKB: number;
  };
  connection?: {
    webhookUrl?: string;
    relayEndpoint?: string;
  };
  agentKit?: any;
  theme?: any;
  startScreen?: any;
  composer?: any;
  advancedStyling?: any;
  behavior?: any;
}

function translateConfig(dbConfig: any, requestUrl: string): WidgetConfig {
  // Map theme mode
  let themeMode = 'light';
  if (dbConfig.themeMode) {
    themeMode = dbConfig.themeMode === 'dark' ? 'dark' : 'light';
  } else if (dbConfig.style?.theme) {
    // Legacy support
    themeMode = dbConfig.style.theme === 'dark' ? 'dark' : 'light';
  }

  // Calculate primary color based on config
  let primaryColor = '#0066FF';
  if (dbConfig.useAccent && dbConfig.accentColor) {
    primaryColor = dbConfig.accentColor;
  } else if (dbConfig.style?.primaryColor) {
    primaryColor = dbConfig.style.primaryColor;
  }

  // Calculate background color
  let backgroundColor = themeMode === 'dark' ? '#1a1a1a' : '#ffffff';
  if (dbConfig.useCustomSurfaceColors && dbConfig.surfaceBackgroundColor) {
    backgroundColor = dbConfig.surfaceBackgroundColor;
  } else if (dbConfig.style?.backgroundColor) {
    backgroundColor = dbConfig.style.backgroundColor;
  }

  // Get radius option
  const radius = dbConfig.radius || 'medium';

  // Get webhook URL
  const webhookUrl = dbConfig.n8nWebhookUrl || dbConfig.connection?.webhookUrl || '';

  // Build theme configuration
  const theme: any = {
    colorScheme: themeMode as 'light' | 'dark',
    radius: radius,
    density: dbConfig.density || 'normal',
  };

  // Typography
  if (dbConfig.fontFamily || dbConfig.fontSize || dbConfig.customFontCss) {
    theme.typography = {
      fontFamily: dbConfig.fontFamily || 'system-ui',
      baseSize: dbConfig.fontSize || 16,
    };
    if (dbConfig.customFontCss) {
      theme.typography.fontSources = [{
        family: dbConfig.fontFamily || 'Custom',
        src: dbConfig.customFontCss,
      }];
    }
  }

  // Color configuration
  theme.color = {};

  // Grayscale with tinted hue
  if (dbConfig.useTintedGrayscale || dbConfig.tintHue !== undefined || dbConfig.grayHue !== undefined) {
    theme.color.grayscale = {
      hue: dbConfig.tintHue ?? dbConfig.grayHue ?? 220,
      tint: dbConfig.tintLevel ?? dbConfig.grayTint ?? 10,
      shade: dbConfig.shadeLevel ?? dbConfig.grayShade ?? 50,
    };
  }

  // Accent colors
  if (dbConfig.useAccent && dbConfig.accentColor) {
    theme.color.accent = {
      primary: dbConfig.accentColor,
      level: dbConfig.accentLevel ?? 1,
    };
  }

  // Surface colors
  if (dbConfig.useCustomSurfaceColors && (dbConfig.surfaceBackgroundColor || dbConfig.surfaceForegroundColor)) {
    theme.color.surface = {
      background: dbConfig.surfaceBackgroundColor || backgroundColor,
      foreground: dbConfig.surfaceForegroundColor || (themeMode === 'dark' ? '#2a2a2a' : '#f8fafc'),
    };
  }

  // Icon color
  if (dbConfig.iconColor) {
    theme.color.icon = dbConfig.iconColor;
  }

  // User message colors
  if (dbConfig.useCustomUserMessageColors && (dbConfig.userMessageTextColor || dbConfig.userMessageBgColor)) {
    theme.color.userMessage = {
      text: dbConfig.userMessageTextColor || '#ffffff',
      background: dbConfig.userMessageBgColor || primaryColor,
    };
  }

  // Start screen
  let startScreen: any;
  if (dbConfig.greeting || (dbConfig.starterPrompts && dbConfig.starterPrompts.length > 0)) {
    startScreen = {
      greeting: dbConfig.greeting,
      prompts: dbConfig.starterPrompts?.map((p: any) => ({
        label: typeof p === 'string' ? p : p.label,
        icon: typeof p === 'object' ? p.icon : undefined,
        prompt: typeof p === 'object' ? (p.prompt || p.label) : p,
      })),
    };
  }

  // Composer
  let composer: any;
  if (dbConfig.placeholder || dbConfig.disclaimer || dbConfig.enableAttachments) {
    composer = {
      placeholder: dbConfig.placeholder || 'Type your message...',
      disclaimer: dbConfig.disclaimer,
    };
    if (dbConfig.enableAttachments) {
      composer.attachments = {
        enabled: true,
        maxSize: dbConfig.maxFileSize || 5 * 1024 * 1024,
        maxCount: dbConfig.maxFileCount || 5,
        accept: dbConfig.allowedExtensions || ['pdf', 'doc', 'docx', 'txt', 'png', 'jpg', 'jpeg'],
      };
    }
  }

  return {
    widgetId: dbConfig.widgetId,
    license: dbConfig.license,
    branding: {
      companyName: dbConfig.branding?.companyName || 'Chat Assistant',
      logoUrl: dbConfig.branding?.logoUrl,
      welcomeText: dbConfig.greeting || dbConfig.branding?.welcomeText || 'How can I help you today?',
      firstMessage: dbConfig.branding?.firstMessage || '',
    },
    style: {
      position: dbConfig.style?.position || 'bottom-right',
    },
    features: {
      fileAttachmentsEnabled: dbConfig.enableAttachments || dbConfig.features?.fileAttachments || false,
      allowedExtensions: dbConfig.features?.allowedExtensions || ['pdf', 'doc', 'docx', 'txt', 'png', 'jpg', 'jpeg'],
      maxFileSizeKB: dbConfig.features?.maxFileSize || 5120,
    },
    connection: {
      webhookUrl: webhookUrl,
      relayEndpoint: `${new URL(requestUrl).origin}/api/chat-relay`,
    },
    agentKit: dbConfig.enableAgentKit ? {
      enabled: true,
      relayEndpoint: `${new URL(requestUrl).origin}/api/chat-relay/openai`,
      hasWorkflowId: !!dbConfig.agentKitWorkflowId,
      hasApiKey: !!dbConfig.agentKitApiKey,
    } : {
      enabled: false,
    },
    theme,
    startScreen,
    composer,
    advancedStyling: dbConfig.advancedStyling,
    behavior: dbConfig.behavior,
  };
}

// ===========================================================================
// Tests
// ===========================================================================

describe('translateConfig', () => {
  const baseUrl = 'https://example.com/api/widget/test/config';

  describe('Theme Mode Translation', () => {
    it('should translate themeMode to theme.colorScheme', () => {
      const dbConfig = { themeMode: 'dark' };
      const result = translateConfig(dbConfig, baseUrl);

      expect(result.theme.colorScheme).toBe('dark');
    });

    it('should default to light mode when themeMode not set', () => {
      const dbConfig = {};
      const result = translateConfig(dbConfig, baseUrl);

      expect(result.theme.colorScheme).toBe('light');
    });

    it('should use legacy style.theme as fallback', () => {
      const dbConfig = {
        style: { theme: 'dark' },
      };
      const result = translateConfig(dbConfig, baseUrl);

      expect(result.theme.colorScheme).toBe('dark');
    });

    it('should prefer themeMode over style.theme', () => {
      const dbConfig = {
        themeMode: 'light',
        style: { theme: 'dark' },
      };
      const result = translateConfig(dbConfig, baseUrl);

      expect(result.theme.colorScheme).toBe('light');
    });
  });

  describe('Accent Color Translation', () => {
    it('should translate accent color when useAccent is true', () => {
      const dbConfig = {
        useAccent: true,
        accentColor: '#FF5722',
        accentLevel: 2,
      };
      const result = translateConfig(dbConfig, baseUrl);

      expect(result.theme.color.accent).toBeDefined();
      expect(result.theme.color.accent.primary).toBe('#FF5722');
      expect(result.theme.color.accent.level).toBe(2);
    });

    it('should NOT include accent when useAccent is false', () => {
      const dbConfig = {
        useAccent: false,
        accentColor: '#FF5722',
      };
      const result = translateConfig(dbConfig, baseUrl);

      expect(result.theme.color.accent).toBeUndefined();
    });

    it('should default accentLevel to 1', () => {
      const dbConfig = {
        useAccent: true,
        accentColor: '#FF5722',
      };
      const result = translateConfig(dbConfig, baseUrl);

      expect(result.theme.color.accent.level).toBe(1);
    });
  });

  describe('Grayscale Translation', () => {
    it('should translate tinted grayscale settings', () => {
      const dbConfig = {
        useTintedGrayscale: true,
        tintHue: 200,
        tintLevel: 15,
        shadeLevel: 60,
      };
      const result = translateConfig(dbConfig, baseUrl);

      expect(result.theme.color.grayscale).toBeDefined();
      expect(result.theme.color.grayscale.hue).toBe(200);
      expect(result.theme.color.grayscale.tint).toBe(15);
      expect(result.theme.color.grayscale.shade).toBe(60);
    });

    it('should handle alternative naming (grayHue, grayTint, grayShade)', () => {
      const dbConfig = {
        grayHue: 180,
        grayTint: 20,
        grayShade: 40,
      };
      const result = translateConfig(dbConfig, baseUrl);

      expect(result.theme.color.grayscale.hue).toBe(180);
      expect(result.theme.color.grayscale.tint).toBe(20);
      expect(result.theme.color.grayscale.shade).toBe(40);
    });

    it('should prefer tintHue over grayHue', () => {
      const dbConfig = {
        tintHue: 250,
        grayHue: 100,
      };
      const result = translateConfig(dbConfig, baseUrl);

      expect(result.theme.color.grayscale.hue).toBe(250);
    });
  });

  describe('Surface Colors Translation', () => {
    it('should translate custom surface colors', () => {
      const dbConfig = {
        useCustomSurfaceColors: true,
        surfaceBackgroundColor: '#1A1A2E',
        surfaceForegroundColor: '#16213E',
      };
      const result = translateConfig(dbConfig, baseUrl);

      expect(result.theme.color.surface).toBeDefined();
      expect(result.theme.color.surface.background).toBe('#1A1A2E');
      expect(result.theme.color.surface.foreground).toBe('#16213E');
    });

    it('should NOT include surface when useCustomSurfaceColors is false', () => {
      const dbConfig = {
        useCustomSurfaceColors: false,
        surfaceBackgroundColor: '#1A1A2E',
      };
      const result = translateConfig(dbConfig, baseUrl);

      expect(result.theme.color.surface).toBeUndefined();
    });
  });

  describe('User Message Colors Translation', () => {
    it('should translate user message colors', () => {
      const dbConfig = {
        useCustomUserMessageColors: true,
        userMessageTextColor: '#FFFFFF',
        userMessageBgColor: '#6366F1',
      };
      const result = translateConfig(dbConfig, baseUrl);

      expect(result.theme.color.userMessage).toBeDefined();
      expect(result.theme.color.userMessage.text).toBe('#FFFFFF');
      expect(result.theme.color.userMessage.background).toBe('#6366F1');
    });
  });

  describe('Typography Translation', () => {
    it('should translate font settings', () => {
      const dbConfig = {
        fontFamily: 'Inter',
        fontSize: 16,
      };
      const result = translateConfig(dbConfig, baseUrl);

      expect(result.theme.typography).toBeDefined();
      expect(result.theme.typography.fontFamily).toBe('Inter');
      expect(result.theme.typography.baseSize).toBe(16);
    });

    it('should include font sources when customFontCss is set', () => {
      const dbConfig = {
        fontFamily: 'CustomFont',
        customFontCss: 'https://fonts.example.com/custom.woff2',
      };
      const result = translateConfig(dbConfig, baseUrl);

      expect(result.theme.typography.fontSources).toBeDefined();
      expect(result.theme.typography.fontSources[0].family).toBe('CustomFont');
      expect(result.theme.typography.fontSources[0].src).toBe('https://fonts.example.com/custom.woff2');
    });

    it('should NOT include typography when no font settings', () => {
      const dbConfig = {};
      const result = translateConfig(dbConfig, baseUrl);

      expect(result.theme.typography).toBeUndefined();
    });
  });

  describe('Radius and Density Translation', () => {
    it('should translate radius setting', () => {
      const dbConfig = { radius: 'large' };
      const result = translateConfig(dbConfig, baseUrl);

      expect(result.theme.radius).toBe('large');
    });

    it('should default radius to medium', () => {
      const dbConfig = {};
      const result = translateConfig(dbConfig, baseUrl);

      expect(result.theme.radius).toBe('medium');
    });

    it('should translate density setting', () => {
      const dbConfig = { density: 'spacious' };
      const result = translateConfig(dbConfig, baseUrl);

      expect(result.theme.density).toBe('spacious');
    });

    it('should default density to normal', () => {
      const dbConfig = {};
      const result = translateConfig(dbConfig, baseUrl);

      expect(result.theme.density).toBe('normal');
    });
  });

  describe('Branding Translation', () => {
    it('should translate branding fields', () => {
      const dbConfig = {
        branding: {
          companyName: 'Acme Corp',
          logoUrl: 'https://example.com/logo.png',
          welcomeText: 'Welcome!',
          firstMessage: 'Hello there!',
        },
      };
      const result = translateConfig(dbConfig, baseUrl);

      expect(result.branding.companyName).toBe('Acme Corp');
      expect(result.branding.logoUrl).toBe('https://example.com/logo.png');
      expect(result.branding.welcomeText).toBe('Welcome!');
      expect(result.branding.firstMessage).toBe('Hello there!');
    });

    it('should use greeting as welcomeText when set', () => {
      const dbConfig = {
        greeting: 'Custom Greeting',
        branding: {
          welcomeText: 'Original Welcome',
        },
      };
      const result = translateConfig(dbConfig, baseUrl);

      expect(result.branding.welcomeText).toBe('Custom Greeting');
    });

    it('should default companyName to Chat Assistant', () => {
      const dbConfig = {};
      const result = translateConfig(dbConfig, baseUrl);

      expect(result.branding.companyName).toBe('Chat Assistant');
    });
  });

  describe('Start Screen Translation', () => {
    it('should translate greeting and starter prompts', () => {
      const dbConfig = {
        greeting: 'How can I help?',
        starterPrompts: [
          { label: 'Get Started', icon: '🚀' },
          { label: 'Ask Question', icon: '❓', prompt: 'I have a question about...' },
        ],
      };
      const result = translateConfig(dbConfig, baseUrl);

      expect(result.startScreen).toBeDefined();
      expect(result.startScreen.greeting).toBe('How can I help?');
      expect(result.startScreen.prompts).toHaveLength(2);
      expect(result.startScreen.prompts[0].label).toBe('Get Started');
      expect(result.startScreen.prompts[0].icon).toBe('🚀');
      expect(result.startScreen.prompts[1].prompt).toBe('I have a question about...');
    });

    it('should handle string-only prompts', () => {
      const dbConfig = {
        starterPrompts: ['Hello', 'Help me'],
      };
      const result = translateConfig(dbConfig, baseUrl);

      expect(result.startScreen.prompts[0].label).toBe('Hello');
      expect(result.startScreen.prompts[0].prompt).toBe('Hello');
    });

    it('should NOT include startScreen when no greeting or prompts', () => {
      const dbConfig = {};
      const result = translateConfig(dbConfig, baseUrl);

      expect(result.startScreen).toBeUndefined();
    });
  });

  describe('Composer Translation', () => {
    it('should translate composer settings', () => {
      const dbConfig = {
        placeholder: 'Ask me anything...',
        disclaimer: 'AI may make mistakes.',
      };
      const result = translateConfig(dbConfig, baseUrl);

      expect(result.composer).toBeDefined();
      expect(result.composer.placeholder).toBe('Ask me anything...');
      expect(result.composer.disclaimer).toBe('AI may make mistakes.');
    });

    it('should translate attachment settings', () => {
      const dbConfig = {
        enableAttachments: true,
        maxFileSize: 10 * 1024 * 1024,
        maxFileCount: 3,
        allowedExtensions: ['pdf', 'png'],
      };
      const result = translateConfig(dbConfig, baseUrl);

      expect(result.composer.attachments).toBeDefined();
      expect(result.composer.attachments.enabled).toBe(true);
      expect(result.composer.attachments.maxSize).toBe(10 * 1024 * 1024);
      expect(result.composer.attachments.maxCount).toBe(3);
      expect(result.composer.attachments.accept).toEqual(['pdf', 'png']);
    });
  });

  describe('Connection Translation', () => {
    it('should translate webhook URL from connection', () => {
      const dbConfig = {
        connection: {
          webhookUrl: 'https://n8n.example.com/webhook/abc',
        },
      };
      const result = translateConfig(dbConfig, baseUrl);

      expect(result.connection?.webhookUrl).toBe('https://n8n.example.com/webhook/abc');
    });

    it('should prefer n8nWebhookUrl over connection.webhookUrl', () => {
      const dbConfig = {
        n8nWebhookUrl: 'https://primary.example.com/webhook',
        connection: {
          webhookUrl: 'https://secondary.example.com/webhook',
        },
      };
      const result = translateConfig(dbConfig, baseUrl);

      expect(result.connection?.webhookUrl).toBe('https://primary.example.com/webhook');
    });

    it('should include relay endpoint from request URL', () => {
      const dbConfig = {};
      const result = translateConfig(dbConfig, 'https://myapp.com/api/widget/abc/config');

      expect(result.connection?.relayEndpoint).toBe('https://myapp.com/api/chat-relay');
    });
  });

  describe('advancedStyling Passthrough', () => {
    it('should pass through advancedStyling unchanged', () => {
      const dbConfig = {
        advancedStyling: {
          enabled: true,
          messages: {
            userMessageBackground: '#0066FF',
            userMessageText: '#FFFFFF',
          },
          markdown: {
            codeBlockBackground: '#1F2937',
          },
        },
      };
      const result = translateConfig(dbConfig, baseUrl);

      expect(result.advancedStyling).toBeDefined();
      expect(result.advancedStyling.enabled).toBe(true);
      expect(result.advancedStyling.messages.userMessageBackground).toBe('#0066FF');
      expect(result.advancedStyling.markdown.codeBlockBackground).toBe('#1F2937');
    });

    it('should include advancedStyling even when empty', () => {
      const dbConfig = {
        advancedStyling: {},
      };
      const result = translateConfig(dbConfig, baseUrl);

      expect(result.advancedStyling).toEqual({});
    });
  });

  describe('behavior Passthrough', () => {
    it('should pass through behavior unchanged', () => {
      const dbConfig = {
        behavior: {
          autoOpen: true,
          autoOpenDelay: 5,
          persistMessages: true,
          enableTypingIndicator: true,
        },
      };
      const result = translateConfig(dbConfig, baseUrl);

      expect(result.behavior).toBeDefined();
      expect(result.behavior.autoOpen).toBe(true);
      expect(result.behavior.autoOpenDelay).toBe(5);
      expect(result.behavior.persistMessages).toBe(true);
    });
  });

  describe('AgentKit Translation', () => {
    it('should translate AgentKit settings when enabled', () => {
      const dbConfig = {
        enableAgentKit: true,
        agentKitWorkflowId: 'wf_123',
        agentKitApiKey: 'sk-xxx',
      };
      const result = translateConfig(dbConfig, baseUrl);

      expect(result.agentKit).toBeDefined();
      expect(result.agentKit.enabled).toBe(true);
      expect(result.agentKit.hasWorkflowId).toBe(true);
      expect(result.agentKit.hasApiKey).toBe(true);
      // Should NOT expose actual credentials
      expect(result.agentKit.apiKey).toBeUndefined();
      expect(result.agentKit.workflowId).toBeUndefined();
    });

    it('should indicate missing credentials', () => {
      const dbConfig = {
        enableAgentKit: true,
      };
      const result = translateConfig(dbConfig, baseUrl);

      expect(result.agentKit.hasWorkflowId).toBe(false);
      expect(result.agentKit.hasApiKey).toBe(false);
    });

    it('should be disabled when enableAgentKit is false', () => {
      const dbConfig = {
        enableAgentKit: false,
      };
      const result = translateConfig(dbConfig, baseUrl);

      expect(result.agentKit.enabled).toBe(false);
    });
  });

  describe('Full Config Translation', () => {
    it('should translate a complete config correctly', () => {
      const fullDbConfig = {
        widgetId: 'widget-123',
        license: { key: 'lic-123', plan: 'pro' },
        branding: {
          companyName: 'Full Test Corp',
          logoUrl: 'https://example.com/logo.png',
          welcomeText: 'Welcome!',
          firstMessage: 'Hello!',
        },
        themeMode: 'dark',
        useAccent: true,
        accentColor: '#8B5CF6',
        accentLevel: 2,
        useTintedGrayscale: true,
        tintHue: 280,
        tintLevel: 15,
        shadeLevel: 45,
        useCustomSurfaceColors: true,
        surfaceBackgroundColor: '#18181B',
        surfaceForegroundColor: '#27272A',
        useCustomUserMessageColors: true,
        userMessageTextColor: '#FFFFFF',
        userMessageBgColor: '#8B5CF6',
        fontFamily: 'Inter',
        fontSize: 15,
        radius: 'large',
        density: 'normal',
        greeting: 'How can I help?',
        starterPrompts: [{ label: 'Start', icon: '🚀' }],
        placeholder: 'Type here...',
        disclaimer: 'AI powered',
        enableAttachments: true,
        advancedStyling: {
          enabled: true,
          messages: { userMessageBackground: '#8B5CF6' },
        },
        behavior: {
          autoOpen: false,
          persistMessages: true,
        },
        connection: {
          webhookUrl: 'https://n8n.example.com/webhook',
        },
      };

      const result = translateConfig(fullDbConfig, baseUrl);

      // Verify all sections
      expect(result.widgetId).toBe('widget-123');
      expect(result.branding.companyName).toBe('Full Test Corp');
      expect(result.theme.colorScheme).toBe('dark');
      expect(result.theme.color.accent.primary).toBe('#8B5CF6');
      expect(result.theme.color.grayscale.hue).toBe(280);
      expect(result.theme.color.surface.background).toBe('#18181B');
      expect(result.theme.color.userMessage.background).toBe('#8B5CF6');
      expect(result.theme.typography.fontFamily).toBe('Inter');
      expect(result.theme.radius).toBe('large');
      expect(result.startScreen.greeting).toBe('How can I help?');
      expect(result.composer.placeholder).toBe('Type here...');
      expect(result.advancedStyling.enabled).toBe(true);
      expect(result.behavior.persistMessages).toBe(true);
      expect(result.connection?.webhookUrl).toBe('https://n8n.example.com/webhook');
    });
  });
});
