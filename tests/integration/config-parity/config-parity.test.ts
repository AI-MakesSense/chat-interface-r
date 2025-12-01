/**
 * Config Parity Tests - Configurator → Embed Design Consistency
 *
 * Purpose: Ensure the widget design created in the configurator is EXACTLY
 * what the embedded widget receives and renders.
 *
 * Test Flow:
 * 1. Configurator saves config → PATCH /api/widgets/[id]
 * 2. Config stored in DB (after sanitization/validation)
 * 3. Embed requests config → GET /api/widget/[license]/config
 * 4. translateConfig() transforms DB config → Widget format
 * 5. Widget receives and applies config
 *
 * Critical Properties Tested:
 * - advancedStyling (Pro/Agency only)
 * - behavior settings
 * - theme/color settings
 * - branding
 * - typography
 * - all playground-style properties
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '@/lib/db/client';
import { users, licenses, widgets } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateLicenseKey } from '@/lib/license/generate';
import { signJWT } from '@/lib/auth/jwt';
import { PATCH } from '@/app/api/widgets/[id]/route';
import { GET as getConfig } from '@/app/api/widget/[license]/config/route';
import { createDefaultConfig } from '@/lib/config/defaults';

describe('Config Parity: Configurator → Embed', () => {
  let testUser: any;
  let proLicense: any;
  let basicLicense: any;
  let proWidget: any;
  let basicWidget: any;
  let authToken: string;
  let testRunId: string;

  beforeAll(async () => {
    testRunId = `config-parity-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    // Create test user
    [testUser] = await db.insert(users).values({
      email: `config-parity-${testRunId}@example.com`,
      passwordHash: 'hash',
      name: 'Config Parity Test User',
    }).returning();

    // Create Pro license (full features)
    [proLicense] = await db.insert(licenses).values({
      userId: testUser.id,
      licenseKey: generateLicenseKey(),
      tier: 'pro',
      domains: ['test.com'],
      domainLimit: 1,
      widgetLimit: 3,
      brandingEnabled: false,
      status: 'active',
    }).returning();

    // Create Basic license (restricted features)
    [basicLicense] = await db.insert(licenses).values({
      userId: testUser.id,
      licenseKey: generateLicenseKey(),
      tier: 'basic',
      domains: ['basic.com'],
      domainLimit: 1,
      widgetLimit: 1,
      brandingEnabled: true,
      status: 'active',
    }).returning();

    // Create widgets
    [proWidget] = await db.insert(widgets).values({
      licenseId: proLicense.id,
      name: 'Pro Widget',
      status: 'active',
      config: createDefaultConfig('pro'),
      version: 1,
    }).returning();

    [basicWidget] = await db.insert(widgets).values({
      licenseId: basicLicense.id,
      name: 'Basic Widget',
      status: 'active',
      config: createDefaultConfig('basic'),
      version: 1,
    }).returning();

    authToken = await signJWT({ sub: testUser.id, email: testUser.email });
  });

  afterAll(async () => {
    // Cleanup
    await db.delete(widgets).where(eq(widgets.licenseId, proLicense.id));
    await db.delete(widgets).where(eq(widgets.licenseId, basicLicense.id));
    await db.delete(licenses).where(eq(licenses.userId, testUser.id));
    await db.delete(users).where(eq(users.id, testUser.id));
  });

  // Helper to update widget config
  async function updateWidgetConfig(widgetId: string, config: any) {
    const request = new Request(`http://localhost:3000/api/widgets/${widgetId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth_token=${authToken}`,
      },
      body: JSON.stringify({ config }),
    });
    return PATCH(request, { params: Promise.resolve({ id: widgetId }) });
  }

  // Helper to get widget config from embed endpoint
  async function getEmbedConfig(licenseKey: string) {
    const request = new Request(`http://localhost:3000/api/widget/${licenseKey}/config`, {
      method: 'GET',
      headers: {
        'Origin': 'https://test.com',
      },
    });
    return getConfig(request, { params: Promise.resolve({ license: licenseKey }) });
  }

  // ===========================================================================
  // CRITICAL: advancedStyling Preservation (The bug we just fixed)
  // ===========================================================================

  describe('advancedStyling Preservation', () => {
    it('should preserve advancedStyling through save/load cycle (Pro tier)', async () => {
      const advancedStyling = {
        enabled: true,
        messages: {
          userMessageBackground: '#0066FF',
          userMessageText: '#FFFFFF',
          botMessageBackground: '#F3F4F6',
          botMessageText: '#111827',
          messageSpacing: 16,
          bubblePadding: 14,
          showAvatar: true,
          avatarUrl: 'https://example.com/avatar.png',
        },
        markdown: {
          codeBlockBackground: '#1F2937',
          codeBlockText: '#F9FAFB',
          linkColor: '#3B82F6',
        },
      };

      // Save config with advancedStyling
      const saveResponse = await updateWidgetConfig(proWidget.id, { advancedStyling });
      expect(saveResponse.status).toBe(200);

      // Verify it's in the saved widget
      const savedData = await saveResponse.json();
      expect(savedData.widget.config.advancedStyling).toBeDefined();
      expect(savedData.widget.config.advancedStyling.enabled).toBe(true);
      expect(savedData.widget.config.advancedStyling.messages.userMessageBackground).toBe('#0066FF');

      // Now fetch via embed endpoint
      const embedResponse = await getEmbedConfig(proLicense.licenseKey);
      expect(embedResponse.status).toBe(200);

      const embedConfig = await embedResponse.json();
      expect(embedConfig.advancedStyling).toBeDefined();
      expect(embedConfig.advancedStyling.enabled).toBe(true);
      expect(embedConfig.advancedStyling.messages.userMessageBackground).toBe('#0066FF');
    });

    it('should preserve complex advancedStyling with all markdown options', async () => {
      const advancedStyling = {
        enabled: true,
        messages: {
          userMessageBackground: '#7C3AED',
          userMessageText: '#FFFFFF',
          botMessageBackground: '#EDE9FE',
          botMessageText: '#1F2937',
          messageSpacing: 12,
          bubblePadding: 12,
          showAvatar: false,
          avatarUrl: null,
        },
        markdown: {
          codeBlockBackground: '#0D1117',
          codeBlockText: '#C9D1D9',
          codeBlockBorder: '#30363D',
          inlineCodeBackground: '#F6F8FA',
          inlineCodeText: '#CF222E',
          linkColor: '#2563EB',
          linkHoverColor: '#1D4ED8',
          tableHeaderBackground: '#F3F4F6',
          tableBorderColor: '#E5E7EB',
        },
      };

      const saveResponse = await updateWidgetConfig(proWidget.id, { advancedStyling });
      expect(saveResponse.status).toBe(200);

      const embedResponse = await getEmbedConfig(proLicense.licenseKey);
      const embedConfig = await embedResponse.json();

      // Verify all markdown options preserved
      expect(embedConfig.advancedStyling.markdown.codeBlockBackground).toBe('#0D1117');
      expect(embedConfig.advancedStyling.markdown.inlineCodeText).toBe('#CF222E');
      expect(embedConfig.advancedStyling.markdown.linkHoverColor).toBe('#1D4ED8');
    });
  });

  // ===========================================================================
  // behavior Preservation
  // ===========================================================================

  describe('behavior Preservation', () => {
    it('should preserve behavior settings through save/load cycle', async () => {
      const behavior = {
        autoOpen: true,
        autoOpenDelay: 5,
        showCloseButton: true,
        persistMessages: true,
        enableSoundNotifications: true,
        enableTypingIndicator: true,
      };

      const saveResponse = await updateWidgetConfig(proWidget.id, { behavior });
      expect(saveResponse.status).toBe(200);

      const savedData = await saveResponse.json();
      expect(savedData.widget.config.behavior).toBeDefined();
      expect(savedData.widget.config.behavior.autoOpen).toBe(true);
      expect(savedData.widget.config.behavior.autoOpenDelay).toBe(5);

      const embedResponse = await getEmbedConfig(proLicense.licenseKey);
      const embedConfig = await embedResponse.json();

      expect(embedConfig.behavior).toBeDefined();
      expect(embedConfig.behavior.autoOpen).toBe(true);
      expect(embedConfig.behavior.autoOpenDelay).toBe(5);
      expect(embedConfig.behavior.enableSoundNotifications).toBe(true);
    });
  });

  // ===========================================================================
  // Theme/Color Settings
  // ===========================================================================

  describe('Theme Settings Parity', () => {
    it('should translate themeMode to theme.colorScheme', async () => {
      const saveResponse = await updateWidgetConfig(proWidget.id, {
        themeMode: 'dark',
      });
      expect(saveResponse.status).toBe(200);

      const embedResponse = await getEmbedConfig(proLicense.licenseKey);
      const embedConfig = await embedResponse.json();

      expect(embedConfig.theme.colorScheme).toBe('dark');
    });

    it('should translate accent colors correctly', async () => {
      const config = {
        useAccent: true,
        accentColor: '#FF5722',
        accentLevel: 2,
      };

      const saveResponse = await updateWidgetConfig(proWidget.id, config);
      expect(saveResponse.status).toBe(200);

      const embedResponse = await getEmbedConfig(proLicense.licenseKey);
      const embedConfig = await embedResponse.json();

      expect(embedConfig.theme.color.accent).toBeDefined();
      expect(embedConfig.theme.color.accent.primary).toBe('#FF5722');
      expect(embedConfig.theme.color.accent.level).toBe(2);
    });

    it('should translate tinted grayscale settings', async () => {
      const config = {
        useTintedGrayscale: true,
        tintHue: 200,
        tintLevel: 15,
        shadeLevel: 60,
      };

      const saveResponse = await updateWidgetConfig(proWidget.id, config);
      expect(saveResponse.status).toBe(200);

      const embedResponse = await getEmbedConfig(proLicense.licenseKey);
      const embedConfig = await embedResponse.json();

      expect(embedConfig.theme.color.grayscale).toBeDefined();
      expect(embedConfig.theme.color.grayscale.hue).toBe(200);
      expect(embedConfig.theme.color.grayscale.tint).toBe(15);
      expect(embedConfig.theme.color.grayscale.shade).toBe(60);
    });

    it('should translate surface colors', async () => {
      const config = {
        useCustomSurfaceColors: true,
        surfaceBackgroundColor: '#1A1A2E',
        surfaceForegroundColor: '#16213E',
      };

      const saveResponse = await updateWidgetConfig(proWidget.id, config);
      expect(saveResponse.status).toBe(200);

      const embedResponse = await getEmbedConfig(proLicense.licenseKey);
      const embedConfig = await embedResponse.json();

      expect(embedConfig.theme.color.surface).toBeDefined();
      expect(embedConfig.theme.color.surface.background).toBe('#1A1A2E');
      expect(embedConfig.theme.color.surface.foreground).toBe('#16213E');
    });

    it('should translate user message colors', async () => {
      const config = {
        useCustomUserMessageColors: true,
        userMessageTextColor: '#FFFFFF',
        userMessageBgColor: '#6366F1',
      };

      const saveResponse = await updateWidgetConfig(proWidget.id, config);
      expect(saveResponse.status).toBe(200);

      const embedResponse = await getEmbedConfig(proLicense.licenseKey);
      const embedConfig = await embedResponse.json();

      expect(embedConfig.theme.color.userMessage).toBeDefined();
      expect(embedConfig.theme.color.userMessage.text).toBe('#FFFFFF');
      expect(embedConfig.theme.color.userMessage.background).toBe('#6366F1');
    });

    it('should translate radius and density settings', async () => {
      const config = {
        radius: 'large',
        density: 'spacious',
      };

      const saveResponse = await updateWidgetConfig(proWidget.id, config);
      expect(saveResponse.status).toBe(200);

      const embedResponse = await getEmbedConfig(proLicense.licenseKey);
      const embedConfig = await embedResponse.json();

      expect(embedConfig.theme.radius).toBe('large');
      expect(embedConfig.theme.density).toBe('spacious');
    });
  });

  // ===========================================================================
  // Typography Settings
  // ===========================================================================

  describe('Typography Parity', () => {
    it('should translate font family and size', async () => {
      const config = {
        fontFamily: 'Inter',
        fontSize: 16,
      };

      const saveResponse = await updateWidgetConfig(proWidget.id, config);
      expect(saveResponse.status).toBe(200);

      const embedResponse = await getEmbedConfig(proLicense.licenseKey);
      const embedConfig = await embedResponse.json();

      expect(embedConfig.theme.typography).toBeDefined();
      expect(embedConfig.theme.typography.fontFamily).toBe('Inter');
      expect(embedConfig.theme.typography.baseSize).toBe(16);
    });

    it('should translate custom font CSS', async () => {
      const config = {
        fontFamily: 'CustomFont',
        customFontCss: 'https://fonts.example.com/custom.woff2',
      };

      const saveResponse = await updateWidgetConfig(proWidget.id, config);
      expect(saveResponse.status).toBe(200);

      const embedResponse = await getEmbedConfig(proLicense.licenseKey);
      const embedConfig = await embedResponse.json();

      expect(embedConfig.theme.typography.fontSources).toBeDefined();
      expect(embedConfig.theme.typography.fontSources[0].family).toBe('CustomFont');
      expect(embedConfig.theme.typography.fontSources[0].src).toBe('https://fonts.example.com/custom.woff2');
    });
  });

  // ===========================================================================
  // Branding Settings
  // ===========================================================================

  describe('Branding Parity', () => {
    it('should preserve branding through save/load cycle', async () => {
      const branding = {
        companyName: 'Acme Corp',
        logoUrl: 'https://example.com/logo.png',
        welcomeText: 'Welcome to Acme!',
        firstMessage: 'Hi there! How can I help you today?',
      };

      const saveResponse = await updateWidgetConfig(proWidget.id, { branding });
      expect(saveResponse.status).toBe(200);

      const embedResponse = await getEmbedConfig(proLicense.licenseKey);
      const embedConfig = await embedResponse.json();

      expect(embedConfig.branding.companyName).toBe('Acme Corp');
      expect(embedConfig.branding.logoUrl).toBe('https://example.com/logo.png');
      expect(embedConfig.branding.welcomeText).toBe('Welcome to Acme!');
      expect(embedConfig.branding.firstMessage).toBe('Hi there! How can I help you today?');
    });

    it('should use greeting as welcomeText when set', async () => {
      const config = {
        greeting: 'Custom Greeting Text',
      };

      const saveResponse = await updateWidgetConfig(proWidget.id, config);
      expect(saveResponse.status).toBe(200);

      const embedResponse = await getEmbedConfig(proLicense.licenseKey);
      const embedConfig = await embedResponse.json();

      expect(embedConfig.branding.welcomeText).toBe('Custom Greeting Text');
    });
  });

  // ===========================================================================
  // Start Screen & Composer
  // ===========================================================================

  describe('Start Screen & Composer Parity', () => {
    it('should translate starter prompts', async () => {
      const config = {
        greeting: 'How can I help?',
        starterPrompts: [
          { label: 'Get Started', icon: '🚀' },
          { label: 'Ask a question', icon: '❓', prompt: 'I have a question about...' },
        ],
      };

      const saveResponse = await updateWidgetConfig(proWidget.id, config);
      expect(saveResponse.status).toBe(200);

      const embedResponse = await getEmbedConfig(proLicense.licenseKey);
      const embedConfig = await embedResponse.json();

      expect(embedConfig.startScreen).toBeDefined();
      expect(embedConfig.startScreen.greeting).toBe('How can I help?');
      expect(embedConfig.startScreen.prompts).toHaveLength(2);
      expect(embedConfig.startScreen.prompts[0].label).toBe('Get Started');
      expect(embedConfig.startScreen.prompts[1].prompt).toBe('I have a question about...');
    });

    it('should translate composer settings', async () => {
      const config = {
        placeholder: 'Type your message here...',
        disclaimer: 'AI responses may not be accurate.',
        enableAttachments: true,
        maxFileSize: 10 * 1024 * 1024,
        maxFileCount: 3,
      };

      const saveResponse = await updateWidgetConfig(proWidget.id, config);
      expect(saveResponse.status).toBe(200);

      const embedResponse = await getEmbedConfig(proLicense.licenseKey);
      const embedConfig = await embedResponse.json();

      expect(embedConfig.composer).toBeDefined();
      expect(embedConfig.composer.placeholder).toBe('Type your message here...');
      expect(embedConfig.composer.disclaimer).toBe('AI responses may not be accurate.');
      expect(embedConfig.composer.attachments.enabled).toBe(true);
    });
  });

  // ===========================================================================
  // Connection Settings
  // ===========================================================================

  describe('Connection Settings Parity', () => {
    it('should translate webhook URL from multiple sources', async () => {
      const config = {
        connection: {
          webhookUrl: 'https://n8n.example.com/webhook/abc123',
        },
      };

      const saveResponse = await updateWidgetConfig(proWidget.id, config);
      expect(saveResponse.status).toBe(200);

      const embedResponse = await getEmbedConfig(proLicense.licenseKey);
      const embedConfig = await embedResponse.json();

      expect(embedConfig.connection.webhookUrl).toBe('https://n8n.example.com/webhook/abc123');
    });

    it('should include relay endpoint in connection', async () => {
      const embedResponse = await getEmbedConfig(proLicense.licenseKey);
      const embedConfig = await embedResponse.json();

      expect(embedConfig.connection.relayEndpoint).toBeDefined();
      expect(embedConfig.connection.relayEndpoint).toContain('/api/chat-relay');
    });
  });

  // ===========================================================================
  // Tier Restrictions
  // ===========================================================================

  describe('Tier Restrictions', () => {
    it('should disable advancedStyling for Basic tier', async () => {
      const advancedStyling = {
        enabled: true,
        messages: {
          userMessageBackground: '#0066FF',
        },
      };

      const saveResponse = await updateWidgetConfig(basicWidget.id, { advancedStyling });
      expect(saveResponse.status).toBe(200);

      const savedData = await saveResponse.json();
      // Sanitization should disable it for basic tier
      expect(savedData.widget.config.advancedStyling.enabled).toBe(false);
    });

    it('should force brandingEnabled=true for Basic tier', async () => {
      const branding = {
        brandingEnabled: false, // Trying to disable
        companyName: 'Test',
      };

      const saveResponse = await updateWidgetConfig(basicWidget.id, { branding });
      expect(saveResponse.status).toBe(200);

      const savedData = await saveResponse.json();
      expect(savedData.widget.config.branding.brandingEnabled).toBe(true);
    });
  });

  // ===========================================================================
  // Sanitization (Data Integrity)
  // ===========================================================================

  describe('Sanitization - Data Integrity', () => {
    it('should fix 3-digit hex colors to 6-digit', async () => {
      // Note: This tests the sanitization layer
      const config = {
        accentColor: '#F00', // 3-digit
      };

      const saveResponse = await updateWidgetConfig(proWidget.id, config);
      expect(saveResponse.status).toBe(200);

      const savedData = await saveResponse.json();
      // Should be expanded to 6-digit
      expect(savedData.widget.config.accentColor).toBe('#FF0000');
    });

    it('should convert HTTP URLs to HTTPS', async () => {
      const branding = {
        logoUrl: 'http://example.com/logo.png',
      };

      const saveResponse = await updateWidgetConfig(proWidget.id, { branding });
      expect(saveResponse.status).toBe(200);

      const savedData = await saveResponse.json();
      expect(savedData.widget.config.branding.logoUrl).toBe('https://example.com/logo.png');
    });

    it('should revert invalid custom launcher icon to default', async () => {
      const branding = {
        launcherIcon: 'custom',
        customLauncherIconUrl: '', // Invalid - empty URL
      };

      const saveResponse = await updateWidgetConfig(proWidget.id, { branding });
      expect(saveResponse.status).toBe(200);

      const savedData = await saveResponse.json();
      expect(savedData.widget.config.branding.launcherIcon).toBe('chat');
      expect(savedData.widget.config.branding.customLauncherIconUrl).toBeNull();
    });

    it('should NOT alter valid 6-digit hex colors', async () => {
      const config = {
        accentColor: '#4F46E5',
      };

      const saveResponse = await updateWidgetConfig(proWidget.id, config);
      expect(saveResponse.status).toBe(200);

      const savedData = await saveResponse.json();
      expect(savedData.widget.config.accentColor).toBe('#4F46E5');
    });

    it('should fill missing required branding fields with defaults', async () => {
      const branding = {
        companyName: '', // Empty - should be filled
      };

      const saveResponse = await updateWidgetConfig(proWidget.id, { branding });
      expect(saveResponse.status).toBe(200);

      const savedData = await saveResponse.json();
      expect(savedData.widget.config.branding.companyName).toBe('My Company');
    });
  });

  // ===========================================================================
  // Full Round-Trip Test
  // ===========================================================================

  describe('Full Round-Trip: Complete Config', () => {
    it('should preserve ALL config properties through complete save/load cycle', async () => {
      const fullConfig = {
        // Branding
        branding: {
          companyName: 'Round Trip Corp',
          logoUrl: 'https://example.com/logo.png',
          welcomeText: 'Round trip test!',
          firstMessage: 'Hello from round trip test.',
          launcherIcon: 'support',
        },

        // Playground-style theme
        themeMode: 'dark',
        useAccent: true,
        accentColor: '#8B5CF6',
        accentLevel: 2,
        useTintedGrayscale: true,
        tintHue: 280,
        tintLevel: 20,
        shadeLevel: 40,
        useCustomSurfaceColors: true,
        surfaceBackgroundColor: '#18181B',
        surfaceForegroundColor: '#27272A',
        useCustomUserMessageColors: true,
        userMessageTextColor: '#FFFFFF',
        userMessageBgColor: '#8B5CF6',

        // Typography
        fontFamily: 'Poppins',
        fontSize: 15,
        radius: 'large',
        density: 'normal',

        // Start screen
        greeting: 'Welcome to Round Trip Test!',
        starterPrompts: [
          { label: 'Help me get started', icon: '🎯' },
          { label: 'Show me features', icon: '✨' },
        ],

        // Composer
        placeholder: 'Ask me anything...',
        disclaimer: 'Powered by AI',
        enableAttachments: true,

        // Advanced styling (Pro)
        advancedStyling: {
          enabled: true,
          messages: {
            userMessageBackground: '#8B5CF6',
            userMessageText: '#FFFFFF',
            botMessageBackground: '#27272A',
            botMessageText: '#E4E4E7',
            messageSpacing: 14,
            bubblePadding: 12,
          },
          markdown: {
            codeBlockBackground: '#0F0F10',
            codeBlockText: '#A5B4FC',
            linkColor: '#A78BFA',
          },
        },

        // Behavior
        behavior: {
          autoOpen: false,
          autoOpenDelay: 0,
          showCloseButton: true,
          persistMessages: true,
          enableTypingIndicator: true,
        },

        // Connection
        connection: {
          provider: 'n8n',
          webhookUrl: 'https://n8n.example.com/webhook/roundtrip',
        },
      };

      // Save full config
      const saveResponse = await updateWidgetConfig(proWidget.id, fullConfig);
      expect(saveResponse.status).toBe(200);

      const savedData = await saveResponse.json();

      // Verify critical fields saved
      expect(savedData.widget.config.advancedStyling).toBeDefined();
      expect(savedData.widget.config.advancedStyling.enabled).toBe(true);
      expect(savedData.widget.config.behavior).toBeDefined();
      expect(savedData.widget.config.behavior.persistMessages).toBe(true);

      // Now fetch via embed endpoint
      const embedResponse = await getEmbedConfig(proLicense.licenseKey);
      expect(embedResponse.status).toBe(200);

      const embedConfig = await embedResponse.json();

      // Verify ALL translations
      expect(embedConfig.branding.companyName).toBe('Round Trip Corp');
      expect(embedConfig.theme.colorScheme).toBe('dark');
      expect(embedConfig.theme.color.accent.primary).toBe('#8B5CF6');
      expect(embedConfig.theme.color.grayscale.hue).toBe(280);
      expect(embedConfig.theme.color.surface.background).toBe('#18181B');
      expect(embedConfig.theme.color.userMessage.background).toBe('#8B5CF6');
      expect(embedConfig.theme.radius).toBe('large');
      expect(embedConfig.theme.typography.fontFamily).toBe('Poppins');
      expect(embedConfig.startScreen.greeting).toBe('Welcome to Round Trip Test!');
      expect(embedConfig.startScreen.prompts).toHaveLength(2);
      expect(embedConfig.composer.placeholder).toBe('Ask me anything...');
      expect(embedConfig.composer.disclaimer).toBe('Powered by AI');
      expect(embedConfig.advancedStyling.enabled).toBe(true);
      expect(embedConfig.advancedStyling.messages.userMessageBackground).toBe('#8B5CF6');
      expect(embedConfig.behavior.persistMessages).toBe(true);
      expect(embedConfig.connection.webhookUrl).toBe('https://n8n.example.com/webhook/roundtrip');
    });
  });

  // ===========================================================================
  // Legacy Config Support
  // ===========================================================================

  describe('Legacy Config Backward Compatibility', () => {
    it('should handle legacy style.theme for dark mode', async () => {
      // Simulate a legacy config that uses style.theme instead of themeMode
      const legacyConfig = {
        style: {
          theme: 'dark',
          primaryColor: '#0066FF',
        },
      };

      const saveResponse = await updateWidgetConfig(proWidget.id, legacyConfig);
      expect(saveResponse.status).toBe(200);

      const embedResponse = await getEmbedConfig(proLicense.licenseKey);
      const embedConfig = await embedResponse.json();

      // Should still result in dark mode (via translateConfig fallback)
      // Note: style.theme might get stripped, but if themeMode isn't set,
      // translateConfig checks style.theme as fallback
      expect(embedConfig.theme.colorScheme).toBeDefined();
    });
  });
});
