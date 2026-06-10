/**
 * Shared canonical → runtime config translation.
 *
 * Translates a CANONICAL (schemaVersion 2) ChatWidgetConfig into the public
 * WidgetConfig runtime shape the widget bundle's renderers consume. All fields are
 * read exclusively from canonical paths — there are no legacy-field fallbacks. Call
 * migrateConfig() on a raw DB record before passing it here.
 *
 * SECURITY: webhookUrl and apiKey are NEVER included in this output.
 *
 * WHY THIS MODULE EXISTS (Phase 5):
 *   Both the widget config API route (`app/api/w/[widgetKey]/config/route.ts`) and the
 *   configurator preview need this translation. The configurator edits the canonical
 *   config but the real widget bundle (mounted in the preview iframe) consumes the
 *   TRANSLATED runtime shape. The widget bundle itself MUST stay Zod-free, so it cannot
 *   translate client-side. Instead the configurator (a Next-app context where Zod is
 *   fine) imports this module, translates, and posts the runtime config to the preview
 *   bridge. This module lives under lib/ and is intentionally NEVER imported from
 *   widget/src — it may pull in schema constants, but only Next-app callers use it.
 *
 *   It takes the chatkit-enabled flag as a parameter rather than importing the
 *   feature-flag module directly, so callers (route reads CHATKIT_SERVER_ENABLED;
 *   configurator reads CHATKIT_UI_ENABLED) stay in control and the function is pure.
 */
import { COMPOSER_DEFAULT_PLACEHOLDER } from '@/lib/widget-config/schema';
import type { ChatWidgetConfig } from '@/lib/widget-config/schema';
import type { WidgetConfig } from '@/widget/src/types';

export function translateConfig(
  cfg: ChatWidgetConfig,
  origin: string,
  widgetKey: string,
  userTier: string,
  chatkitEnabled: boolean
): WidgetConfig {
  // Theme mode: canonical theme.mode ('light' | 'dark' | 'auto')
  const themeMode: 'light' | 'dark' = cfg.theme.mode === 'dark' ? 'dark' : 'light';

  // Build theme configuration from canonical paths
  const theme: WidgetConfig['theme'] = {
    colorScheme: themeMode,
    radius: cfg.theme.radius,
    density: cfg.theme.density,
  };

  // Typography: canonical theme.typography.*
  const typo = cfg.theme.typography;
  if (typo.fontFamily !== 'system-ui' || typo.fontSize !== 14 || typo.customFontCss) {
    theme.typography = {
      fontFamily: typo.fontFamily,
      baseSize: typo.fontSize,
    };
    if (typo.useCustomFont && typo.customFontCss) {
      theme.typography.fontSources = [{
        family: typo.customFontName || typo.fontFamily,
        src: typo.customFontCss,
      }];
    }
  }

  // Colors: canonical colorSystem.*
  theme.color = {};
  const cs = cfg.colorSystem;

  if (cs.useTintedGrayscale) {
    theme.color.grayscale = {
      hue: cs.tintHue,
      // Canonical tintLevel is a 0-20 slider; runtime GrayscaleConfig.tint is
      // 0-9 (css-variables.ts applies tint*2 % saturation). Map linearly:
      // 0→0, 20→9. Same boundary-conversion rationale as shade below.
      tint: Math.round(cs.tintLevel * 0.45),
      // Canonical shadeLevel is a 0-20 slider (10 = neutral); the runtime
      // GrayscaleConfig.shade is -4..4 (css-variables.ts applies shade*2 %
      // lightness). Map linearly: 0→-4, 10→0, 20→+4. Conversion lives HERE,
      // at the canonical→runtime boundary, so stored configs and the sidebar
      // slider keep the 0-20 scale.
      shade: Math.round((cs.shadeLevel - 10) * 0.4),
    };
  }

  if (cs.useAccent) {
    theme.color.accent = {
      primary: cs.accentColor,
      level: cfg.chatkit.accentLevel,
    };
  }

  if (cs.useCustomSurfaceColors) {
    theme.color.surface = {
      background: cs.surfaceBackgroundColor,
      foreground: cs.surfaceForegroundColor,
    };
  }

  if (cs.useCustomTextColor) {
    theme.color.text = cs.customTextColor;
  }

  if (cs.useCustomIconColor) {
    theme.color.icon = cs.customIconColor;
  }

  if (cs.useCustomUserMessageColors) {
    theme.color.userMessage = {
      text: cs.customUserMessageTextColor,
      background: cs.customUserMessageBackgroundColor,
    };
  }

  // Start screen: canonical startScreen.*
  let startScreen: WidgetConfig['startScreen'];
  if (cfg.startScreen.greeting || cfg.startScreen.starterPrompts.length > 0) {
    startScreen = {
      greeting: cfg.startScreen.greeting || undefined,
      prompts: cfg.startScreen.starterPrompts.map((p) => ({
        label: p.label,
        icon: p.icon,
        // Match legacy translate: prefer the full prompt text when present
        prompt: p.prompt || p.label,
      })),
    };
  }

  // Composer: canonical composer.*
  let composer: WidgetConfig['composer'];
  const hasComposer = cfg.composer.placeholder !== COMPOSER_DEFAULT_PLACEHOLDER ||
    !!cfg.composer.disclaimer ||
    cfg.features.attachments.enabled;
  if (hasComposer) {
    composer = {
      placeholder: cfg.composer.placeholder,
      disclaimer: cfg.composer.disclaimer || undefined,
    };
    if (cfg.features.attachments.enabled) {
      composer.attachments = {
        enabled: true,
        maxSize: cfg.features.attachments.maxFileSizeMB * 1024 * 1024,
        maxCount: 5,
        accept: cfg.features.attachments.allowedExtensions,
      };
    }
  }

  return {
    widgetId: undefined, // not exposed in v2 (widgetKey is the identifier)
    license: {
      key: widgetKey,
      active: true,
      plan: userTier,
    },
    branding: {
      companyName: cfg.branding.companyName,
      logoUrl: cfg.branding.logoUrl ?? undefined,
      welcomeText: cfg.branding.welcomeText,
      firstMessage: cfg.branding.firstMessage,
    },
    style: {
      position: cfg.theme.position.position,
    },
    features: {
      fileAttachmentsEnabled: cfg.features.attachments.enabled,
      allowedExtensions: cfg.features.attachments.allowedExtensions,
      maxFileSizeKB: cfg.features.attachments.maxFileSizeMB * 1024,
    },
    connection: {
      relayEndpoint: `${origin}/api/chat-relay`,
      // The runtime message-sender reads connection.captureContext !== false;
      // forward the owner's canonical setting so it isn't forced ON by omission.
      captureContext: cfg.connection.captureContext,
    },
    agentKit: chatkitEnabled && cfg.connection.provider === 'chatkit' ? {
      enabled: true,
      relayEndpoint: `${origin}/api/chat-relay/openai`,
      hasWorkflowId: !!cfg.connection.workflowId,
      hasApiKey: !!cfg.connection.apiKey,
    } : {
      enabled: false,
    },
    theme,
    startScreen,
    composer,
    advancedStyling: cfg.advancedStyling,
    behavior: cfg.behavior,
  };
}
