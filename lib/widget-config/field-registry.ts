/**
 * Declarative field registry for the configurator sidebar.
 *
 * Each entry binds a canonical config path (into ChatWidgetConfig) to a UI
 * control. Task 22 GENERATES the sidebar from this list — to add a config
 * option: add it to lib/widget-config/schema.ts, then add one line here.
 *
 * INVARIANT (enforced by tests/lib/widget-config/field-registry.test.ts):
 *   - every `path` resolves in chatWidgetConfigSchema.parse({})
 *   - every `section` is a declared SECTIONS id
 *   - every `select` field's `options` match the schema enum
 *   - slider min/max/step mirror the schema's .min()/.max()
 *
 * The registry only covers fields the UI exposes; schema fields without a
 * registry entry simply don't appear in the configurator yet (registry ⊆ schema).
 */
import type { ChatWidgetConfig } from './schema';

export type SectionId =
  | 'branding'
  | 'theme'
  | 'colorSystem'
  | 'layout'
  | 'typography'
  | 'startScreen'
  | 'composer'
  | 'behavior'
  | 'advancedStyling'
  | 'features'
  | 'connection'
  | 'chatkit'
  | 'advanced';

export const SECTIONS: { id: SectionId; title: string; tierGate?: 'pro' }[] = [
  { id: 'branding', title: 'Branding' },
  { id: 'theme', title: 'Colors & Theme' },
  { id: 'colorSystem', title: 'Color System' },
  { id: 'layout', title: 'Position & Size' },
  { id: 'typography', title: 'Typography' },
  { id: 'startScreen', title: 'Start Screen' },
  { id: 'composer', title: 'Composer' },
  { id: 'behavior', title: 'Behavior' },
  { id: 'advancedStyling', title: 'Advanced Styling', tierGate: 'pro' },
  { id: 'features', title: 'Features' },
  { id: 'connection', title: 'Connection' },
  { id: 'chatkit', title: 'ChatKit' },
  { id: 'advanced', title: 'Advanced' },
];

export interface FieldDef {
  path: string; // dot-path into ChatWidgetConfig
  label: string;
  section: SectionId;
  control: 'text' | 'textarea' | 'color' | 'toggle' | 'slider' | 'select' | 'url' | 'icon-picker' | 'prompt-list';
  tierGate?: 'pro'; // hidden + locked below this tier
  min?: number;
  max?: number;
  step?: number;
  options?: { value: string; label: string }[];
  placeholder?: string;
  help?: string;
  showIf?: (cfg: ChatWidgetConfig) => boolean;
}

export const CHAT_FIELD_REGISTRY: FieldDef[] = [
  // ---------- Branding ----------
  { path: 'branding.companyName', label: 'Company name', section: 'branding', control: 'text' },
  { path: 'branding.welcomeText', label: 'Welcome text', section: 'branding', control: 'textarea' },
  { path: 'branding.logoUrl', label: 'Logo URL', section: 'branding', control: 'url' },
  { path: 'branding.responseTimeText', label: 'Response time text', section: 'branding', control: 'text' },
  { path: 'branding.firstMessage', label: 'First message', section: 'branding', control: 'textarea' },
  { path: 'branding.inputPlaceholder', label: 'Input placeholder', section: 'branding', control: 'text' },
  {
    path: 'branding.launcherIcon',
    label: 'Launcher icon',
    section: 'branding',
    control: 'select',
    options: [
      { value: 'chat', label: 'Chat bubble' },
      { value: 'support', label: 'Support' },
      { value: 'bot', label: 'Bot' },
      { value: 'custom', label: 'Custom…' },
    ],
  },
  {
    path: 'branding.customLauncherIconUrl',
    label: 'Custom icon URL',
    section: 'branding',
    control: 'url',
    showIf: (c) => c.branding.launcherIcon === 'custom',
  },
  {
    path: 'branding.brandingEnabled',
    label: 'Show "Powered by" branding',
    section: 'branding',
    control: 'toggle',
    tierGate: 'pro',
    help: 'Pro and Agency plans can disable branding.',
  },

  // ---------- Theme ----------
  {
    path: 'theme.mode',
    label: 'Theme mode',
    section: 'theme',
    control: 'select',
    options: [
      { value: 'light', label: 'Light' },
      { value: 'dark', label: 'Dark' },
      { value: 'auto', label: 'Auto' },
    ],
  },
  { path: 'theme.colors.primary', label: 'Primary color', section: 'theme', control: 'color' },
  { path: 'theme.colors.secondary', label: 'Secondary color', section: 'theme', control: 'color' },
  { path: 'theme.colors.background', label: 'Background', section: 'theme', control: 'color' },
  { path: 'theme.colors.userMessage', label: 'User message bubble', section: 'theme', control: 'color' },
  { path: 'theme.colors.botMessage', label: 'Bot message bubble', section: 'theme', control: 'color' },
  { path: 'theme.colors.text', label: 'Text color', section: 'theme', control: 'color' },
  { path: 'theme.colors.textSecondary', label: 'Secondary text', section: 'theme', control: 'color' },
  { path: 'theme.colors.border', label: 'Border color', section: 'theme', control: 'color' },
  { path: 'theme.colors.inputBackground', label: 'Input background', section: 'theme', control: 'color' },
  { path: 'theme.colors.inputText', label: 'Input text', section: 'theme', control: 'color' },
  { path: 'theme.cornerRadius', label: 'Corner radius', section: 'theme', control: 'slider', min: 0, max: 20, step: 1 },
  {
    path: 'theme.radius',
    label: 'Radius preset',
    section: 'theme',
    control: 'select',
    options: [
      { value: 'none', label: 'None' },
      { value: 'small', label: 'Small' },
      { value: 'medium', label: 'Medium' },
      { value: 'large', label: 'Large' },
      { value: 'pill', label: 'Pill' },
    ],
  },
  {
    path: 'theme.density',
    label: 'Density',
    section: 'theme',
    control: 'select',
    options: [
      { value: 'compact', label: 'Compact' },
      { value: 'normal', label: 'Normal' },
      { value: 'spacious', label: 'Spacious' },
    ],
  },

  // ---------- Color System (Task-4a) ----------
  { path: 'colorSystem.useAccent', label: 'Use accent color', section: 'colorSystem', control: 'toggle' },
  {
    path: 'colorSystem.accentColor',
    label: 'Accent color',
    section: 'colorSystem',
    control: 'color',
    showIf: (c) => c.colorSystem.useAccent,
  },
  { path: 'colorSystem.useTintedGrayscale', label: 'Tinted grayscale', section: 'colorSystem', control: 'toggle' },
  {
    path: 'colorSystem.tintHue',
    label: 'Tint hue',
    section: 'colorSystem',
    control: 'slider',
    min: 0,
    max: 360,
    step: 1,
    showIf: (c) => c.colorSystem.useTintedGrayscale,
  },
  {
    path: 'colorSystem.tintLevel',
    label: 'Tint level',
    section: 'colorSystem',
    control: 'slider',
    min: 0,
    max: 20,
    step: 1,
    showIf: (c) => c.colorSystem.useTintedGrayscale,
  },
  {
    path: 'colorSystem.shadeLevel',
    label: 'Shade level',
    section: 'colorSystem',
    control: 'slider',
    min: 0,
    max: 20,
    step: 1,
    showIf: (c) => c.colorSystem.useTintedGrayscale,
  },
  { path: 'colorSystem.useCustomSurfaceColors', label: 'Custom surface colors', section: 'colorSystem', control: 'toggle' },
  {
    path: 'colorSystem.surfaceBackgroundColor',
    label: 'Surface background',
    section: 'colorSystem',
    control: 'color',
    showIf: (c) => c.colorSystem.useCustomSurfaceColors,
  },
  {
    path: 'colorSystem.surfaceForegroundColor',
    label: 'Surface foreground',
    section: 'colorSystem',
    control: 'color',
    showIf: (c) => c.colorSystem.useCustomSurfaceColors,
  },
  { path: 'colorSystem.useCustomTextColor', label: 'Custom text color', section: 'colorSystem', control: 'toggle' },
  {
    path: 'colorSystem.customTextColor',
    label: 'Text color',
    section: 'colorSystem',
    control: 'color',
    showIf: (c) => c.colorSystem.useCustomTextColor,
  },
  { path: 'colorSystem.useCustomIconColor', label: 'Custom icon color', section: 'colorSystem', control: 'toggle' },
  {
    path: 'colorSystem.customIconColor',
    label: 'Icon color',
    section: 'colorSystem',
    control: 'color',
    showIf: (c) => c.colorSystem.useCustomIconColor,
  },
  { path: 'colorSystem.useCustomUserMessageColors', label: 'Custom user message colors', section: 'colorSystem', control: 'toggle' },
  {
    path: 'colorSystem.customUserMessageTextColor',
    label: 'User message text',
    section: 'colorSystem',
    control: 'color',
    showIf: (c) => c.colorSystem.useCustomUserMessageColors,
  },
  {
    path: 'colorSystem.customUserMessageBackgroundColor',
    label: 'User message background',
    section: 'colorSystem',
    control: 'color',
    showIf: (c) => c.colorSystem.useCustomUserMessageColors,
  },

  // ---------- Layout (Position & Size) ----------
  {
    path: 'theme.position.position',
    label: 'Position',
    section: 'layout',
    control: 'select',
    options: [
      { value: 'bottom-right', label: 'Bottom right' },
      { value: 'bottom-left', label: 'Bottom left' },
      { value: 'top-right', label: 'Top right' },
      { value: 'top-left', label: 'Top left' },
    ],
  },
  { path: 'theme.position.offsetX', label: 'Horizontal offset', section: 'layout', control: 'slider', min: 0, max: 500, step: 4 },
  { path: 'theme.position.offsetY', label: 'Vertical offset', section: 'layout', control: 'slider', min: 0, max: 500, step: 4 },
  {
    path: 'theme.size.mode',
    label: 'Size',
    section: 'layout',
    control: 'select',
    options: [
      { value: 'compact', label: 'Compact' },
      { value: 'standard', label: 'Standard' },
      { value: 'expanded', label: 'Expanded' },
    ],
  },
  { path: 'theme.size.fullscreenOnMobile', label: 'Fullscreen on mobile', section: 'layout', control: 'toggle' },
  { path: 'theme.size.inlineWidth', label: 'Inline width', section: 'layout', control: 'slider', min: 300, max: 1200, step: 10 },
  { path: 'theme.size.inlineHeight', label: 'Inline height', section: 'layout', control: 'slider', min: 400, max: 900, step: 10 },

  // ---------- Typography ----------
  { path: 'theme.typography.fontFamily', label: 'Font family', section: 'typography', control: 'text', placeholder: 'system-ui' },
  { path: 'theme.typography.fontSize', label: 'Font size', section: 'typography', control: 'slider', min: 12, max: 20, step: 1 },
  { path: 'theme.typography.fontUrl', label: 'Custom font URL', section: 'typography', control: 'url' },
  { path: 'theme.typography.useCustomFont', label: 'Use custom font', section: 'typography', control: 'toggle' },
  {
    path: 'theme.typography.customFontName',
    label: 'Custom font name',
    section: 'typography',
    control: 'text',
    showIf: (c) => c.theme.typography.useCustomFont,
  },
  {
    path: 'theme.typography.customFontCss',
    label: 'Custom font CSS',
    section: 'typography',
    control: 'textarea',
    help: '@font-face CSS or font URL.',
    showIf: (c) => c.theme.typography.useCustomFont,
  },

  // ---------- Start screen ----------
  { path: 'startScreen.greeting', label: 'Greeting', section: 'startScreen', control: 'textarea' },
  { path: 'startScreen.starterPrompts', label: 'Starter prompts', section: 'startScreen', control: 'prompt-list' },

  // ---------- Composer ----------
  { path: 'composer.placeholder', label: 'Input placeholder', section: 'composer', control: 'text' },
  { path: 'composer.disclaimer', label: 'Disclaimer text', section: 'composer', control: 'textarea' },

  // ---------- Behavior ----------
  { path: 'behavior.autoOpen', label: 'Auto-open', section: 'behavior', control: 'toggle' },
  {
    path: 'behavior.autoOpenDelay',
    label: 'Auto-open delay (s)',
    section: 'behavior',
    control: 'slider',
    min: 0,
    max: 60,
    step: 1,
    showIf: (c) => c.behavior.autoOpen,
  },
  { path: 'behavior.showCloseButton', label: 'Show close button', section: 'behavior', control: 'toggle' },
  { path: 'behavior.persistMessages', label: 'Persist messages', section: 'behavior', control: 'toggle' },
  { path: 'behavior.enableSoundNotifications', label: 'Sound notifications', section: 'behavior', control: 'toggle' },
  { path: 'behavior.enableTypingIndicator', label: 'Typing indicator', section: 'behavior', control: 'toggle' },

  // ---------- Advanced styling (Pro+) ----------
  { path: 'advancedStyling.enabled', label: 'Enable advanced styling', section: 'advancedStyling', control: 'toggle', tierGate: 'pro' },
  {
    path: 'advancedStyling.messages.userMessageBackground',
    label: 'User bubble background',
    section: 'advancedStyling',
    control: 'color',
    tierGate: 'pro',
    showIf: (c) => c.advancedStyling.enabled,
  },
  {
    path: 'advancedStyling.messages.userMessageText',
    label: 'User bubble text',
    section: 'advancedStyling',
    control: 'color',
    tierGate: 'pro',
    showIf: (c) => c.advancedStyling.enabled,
  },
  {
    path: 'advancedStyling.messages.botMessageBackground',
    label: 'Bot bubble background',
    section: 'advancedStyling',
    control: 'color',
    tierGate: 'pro',
    showIf: (c) => c.advancedStyling.enabled,
  },
  {
    path: 'advancedStyling.messages.botMessageText',
    label: 'Bot bubble text',
    section: 'advancedStyling',
    control: 'color',
    tierGate: 'pro',
    showIf: (c) => c.advancedStyling.enabled,
  },
  {
    path: 'advancedStyling.messages.messageSpacing',
    label: 'Message spacing',
    section: 'advancedStyling',
    control: 'slider',
    min: 0,
    max: 50,
    step: 1,
    tierGate: 'pro',
    showIf: (c) => c.advancedStyling.enabled,
  },
  {
    path: 'advancedStyling.messages.bubblePadding',
    label: 'Bubble padding',
    section: 'advancedStyling',
    control: 'slider',
    min: 5,
    max: 30,
    step: 1,
    tierGate: 'pro',
    showIf: (c) => c.advancedStyling.enabled,
  },
  {
    path: 'advancedStyling.messages.showAvatar',
    label: 'Show avatar',
    section: 'advancedStyling',
    control: 'toggle',
    tierGate: 'pro',
    showIf: (c) => c.advancedStyling.enabled,
  },
  {
    path: 'advancedStyling.messages.avatarUrl',
    label: 'Avatar URL',
    section: 'advancedStyling',
    control: 'url',
    tierGate: 'pro',
    showIf: (c) => c.advancedStyling.enabled && c.advancedStyling.messages.showAvatar,
  },
  {
    path: 'advancedStyling.markdown.codeBlockBackground',
    label: 'Code block background',
    section: 'advancedStyling',
    control: 'color',
    tierGate: 'pro',
    showIf: (c) => c.advancedStyling.enabled,
  },
  {
    path: 'advancedStyling.markdown.codeBlockText',
    label: 'Code block text',
    section: 'advancedStyling',
    control: 'color',
    tierGate: 'pro',
    showIf: (c) => c.advancedStyling.enabled,
  },
  {
    path: 'advancedStyling.markdown.inlineCodeBackground',
    label: 'Inline code background',
    section: 'advancedStyling',
    control: 'color',
    tierGate: 'pro',
    showIf: (c) => c.advancedStyling.enabled,
  },
  {
    path: 'advancedStyling.markdown.inlineCodeText',
    label: 'Inline code text',
    section: 'advancedStyling',
    control: 'color',
    tierGate: 'pro',
    showIf: (c) => c.advancedStyling.enabled,
  },
  {
    path: 'advancedStyling.markdown.linkColor',
    label: 'Link color',
    section: 'advancedStyling',
    control: 'color',
    tierGate: 'pro',
    showIf: (c) => c.advancedStyling.enabled,
  },
  {
    path: 'advancedStyling.markdown.tableBorderColor',
    label: 'Table border',
    section: 'advancedStyling',
    control: 'color',
    tierGate: 'pro',
    showIf: (c) => c.advancedStyling.enabled,
  },

  // ---------- Features ----------
  { path: 'features.attachments.enabled', label: 'File attachments', section: 'features', control: 'toggle' },
  {
    path: 'features.attachments.maxFileSizeMB',
    label: 'Max file size (MB)',
    section: 'features',
    control: 'slider',
    min: 1,
    max: 50,
    step: 1,
    showIf: (c) => c.features.attachments.enabled,
  },
  { path: 'features.emailTranscript', label: 'Email transcript', section: 'features', control: 'toggle', tierGate: 'pro' },
  { path: 'features.printTranscript', label: 'Print transcript', section: 'features', control: 'toggle' },
  { path: 'features.ratingPrompt', label: 'Rating prompt', section: 'features', control: 'toggle', tierGate: 'pro' },
  { path: 'features.pdfLightbox', label: 'PDF lightbox', section: 'features', control: 'toggle' },

  // ---------- Connection ----------
  {
    path: 'connection.provider',
    label: 'Provider',
    section: 'connection',
    control: 'select',
    options: [
      { value: 'n8n', label: 'n8n' },
      { value: 'chatkit', label: 'ChatKit' },
    ],
  },
  {
    path: 'connection.webhookUrl',
    label: 'N8n webhook URL',
    section: 'connection',
    control: 'url',
    placeholder: 'https://your-n8n.example.com/webhook/…',
    showIf: (c) => c.connection.provider === 'n8n',
  },
  { path: 'connection.route', label: 'Route parameter', section: 'connection', control: 'text' },
  { path: 'connection.timeoutSeconds', label: 'Timeout (s)', section: 'connection', control: 'slider', min: 10, max: 60, step: 5 },
  { path: 'connection.captureContext', label: 'Capture page context', section: 'connection', control: 'toggle' },
  {
    path: 'connection.workflowId',
    label: 'Workflow ID',
    section: 'connection',
    control: 'text',
    showIf: (c) => c.connection.provider === 'chatkit',
  },
  {
    path: 'connection.apiKey',
    label: 'API key',
    section: 'connection',
    control: 'text',
    showIf: (c) => c.connection.provider === 'chatkit',
  },

  // ---------- ChatKit (Task-4a) ----------
  { path: 'chatkit.grayscaleHue', label: 'Grayscale hue', section: 'chatkit', control: 'slider', min: 0, max: 360, step: 1 },
  { path: 'chatkit.grayscaleTint', label: 'Grayscale tint', section: 'chatkit', control: 'slider', min: 0, max: 9, step: 1 },
  { path: 'chatkit.grayscaleShade', label: 'Grayscale shade', section: 'chatkit', control: 'slider', min: -4, max: 4, step: 1 },
  { path: 'chatkit.accentPrimary', label: 'Accent color', section: 'chatkit', control: 'color' },
  { path: 'chatkit.accentLevel', label: 'Accent level', section: 'chatkit', control: 'slider', min: 0, max: 3, step: 1 },
  { path: 'chatkit.enableModelPicker', label: 'Enable model picker', section: 'chatkit', control: 'toggle' },

  // ---------- Advanced (Pro+) ----------
  {
    path: 'advanced.customCss',
    label: 'Custom CSS',
    section: 'advanced',
    control: 'textarea',
    tierGate: 'pro',
    help: 'Owner-controlled CSS injected into the widget. Never populated from untrusted sources.',
  },
];
