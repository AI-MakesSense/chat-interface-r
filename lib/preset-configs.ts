/**
 * Preset widget configurations for showcase purposes.
 * Used by hero preview, auth layout, and demo page.
 */

import { WidgetConfig } from '@/stores/widget-store';

/** Base config shared across all presets */
const base: WidgetConfig = {
  branding: { companyName: 'ChatKit', welcomeText: '' },
  style: { theme: 'light', primaryColor: '#0ea5e9', position: 'bottom-right' },
  connection: { provider: 'n8n', webhookUrl: '' },
  themeMode: 'light',
  useAccent: true,
  accentColor: '#0ea5e9',
  useTintedGrayscale: false,
  tintHue: 220,
  tintLevel: 10,
  shadeLevel: 10,
  useCustomSurfaceColors: false,
  surfaceBackgroundColor: '#ffffff',
  surfaceForegroundColor: '#f8fafc',
  useCustomTextColor: false,
  customTextColor: '#1e293b',
  useCustomIconColor: false,
  customIconColor: '#64748b',
  useCustomUserMessageColors: false,
  customUserMessageTextColor: '#ffffff',
  customUserMessageBackgroundColor: '#0ea5e9',
  fontFamily: 'system-ui',
  fontSize: 16,
  useCustomFont: false,
  customFontName: '',
  customFontCss: '',
  customCss: '',
  radius: 'medium',
  density: 'normal',
  greeting: 'How can I help you today?',
  starterPrompts: [],
  placeholder: 'Type a message...',
  disclaimer: '',
  enableAttachments: false,
  enableModelPicker: false,
  inlineWidth: 400,
  inlineHeight: 600,
  chatkitGrayscaleHue: 220,
  chatkitGrayscaleTint: 6,
  chatkitGrayscaleShade: -1,
  chatkitAccentPrimary: '#0f172a',
  chatkitAccentLevel: 1,
};

export const PRESET_CONFIGS: WidgetConfig[] = [
  {
    // 1. Clean blue on white — default friendly look
    ...base,
    greeting: 'What can I help you with?',
    starterPrompts: [
      { label: 'Write a blog post', icon: 'pen' },
      { label: 'Summarize a document', icon: 'fileText' },
      { label: 'Generate ideas', icon: 'lightbulb' },
    ],
    accentColor: '#6366f1',
    useAccent: true,
    radius: 'large',
  },
  {
    // 2. Dark mode — sleek dev vibe
    ...base,
    themeMode: 'dark',
    style: { ...base.style, theme: 'dark' },
    greeting: 'Ready to build something?',
    starterPrompts: [
      { label: 'Debug this code', icon: 'code' },
      { label: 'Explain an error', icon: 'alert' },
      { label: 'Write a function', icon: 'terminal' },
    ],
    accentColor: '#22d3ee',
    useAccent: true,
    radius: 'medium',
  },
  {
    // 3. Warm tinted — support / CX aesthetic
    ...base,
    greeting: 'Hi there! How can we assist?',
    starterPrompts: [
      { label: 'Track my order', icon: 'shoppingBag' },
      { label: 'Return an item', icon: 'package' },
      { label: 'Talk to a human', icon: 'user' },
    ],
    useTintedGrayscale: true,
    tintHue: 30,
    tintLevel: 12,
    shadeLevel: 8,
    useAccent: true,
    accentColor: '#f97316',
    radius: 'pill',
  },
  {
    // 4. Purple dark mode — modern SaaS
    ...base,
    themeMode: 'dark',
    style: { ...base.style, theme: 'dark' },
    greeting: 'Ask me anything',
    starterPrompts: [
      { label: 'Analyze my data', icon: 'trendingUp' },
      { label: 'Create a report', icon: 'fileText' },
      { label: 'Automate a workflow', icon: 'zap' },
    ],
    useTintedGrayscale: true,
    tintHue: 270,
    tintLevel: 15,
    shadeLevel: 12,
    useAccent: true,
    accentColor: '#a855f7',
    radius: 'large',
  },
];
