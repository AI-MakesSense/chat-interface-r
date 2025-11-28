/**
 * Widget Type Definitions
 *
 * Purpose: Defines TypeScript types for widget configuration and internal state
 * Responsibility: Type safety and IntelliSense support
 */

export interface WidgetConfig {
  widgetId?: string; // Widget ID for relay API
  branding: BrandingConfig;
  style?: Partial<StyleConfig>; // Made partial for backward compatibility
  features: FeaturesConfig;
  connection?: ConnectionConfig;
  license?: LicenseConfig; // Injected by server at serve time
  portal?: PortalConfig;
  agentKit?: AgentKitConfig; // OpenAI Agent Builder / ChatKit integration

  // =========================================================================
  // Extended theming options (ChatKit-compatible)
  // =========================================================================
  theme?: ThemeConfig;
  startScreen?: StartScreenConfig;
  composer?: ComposerConfig;
  advancedStyling?: any; // Legacy/Pro styling
  behavior?: any; // Legacy behavior settings
}

export interface PortalConfig {
  showHeader?: boolean;
  headerTitle?: string;
  [key: string]: any;
}

export interface WidgetRuntimeConfig {
  uiConfig: WidgetConfig;
  relay: RelayConfig;
}

export interface BrandingConfig {
  companyName: string;
  logoUrl?: string;
  welcomeText: string;
  firstMessage: string;
}

export interface StyleConfig {
  theme: 'light' | 'dark' | 'auto';
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  cornerRadius: number;
  fontFamily: string;
  fontSize: number;
  customFontUrl?: string;
}

export interface FeaturesConfig {
  fileAttachmentsEnabled: boolean;
  allowedExtensions: string[];
  maxFileSizeKB: number;
}

export interface ConnectionConfig {
  provider?: 'n8n' | 'agentkit';
  webhookUrl?: string;
  relayEndpoint?: string;
  [key: string]: any;
}

export interface AgentKitConfig {
  /** Whether AgentKit/OpenAI mode is enabled */
  enabled: boolean;
  /** Relay endpoint for OpenAI requests */
  relayEndpoint?: string;
  /** Whether a workflow ID is configured (ID itself is never sent to client) */
  hasWorkflowId?: boolean;
  /** Whether an API key is configured (key itself is never sent to client) */
  hasApiKey?: boolean;
}

export interface LicenseConfig {
  key?: string;
  active?: boolean;
  plan?: string;
  [key: string]: any;
}

export interface RelayConfig {
  relayUrl: string;
  widgetId: string;
  licenseKey: string;
}

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: number;
}

export interface WidgetState {
  isOpen: boolean;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  currentStreamingMessage: string | null;
  currentTheme?: 'light' | 'dark';
  attachedFile?: File | null;
}

// =========================================================================
// Extended Theme Configuration (ChatKit-compatible)
// =========================================================================

export type ColorScheme = 'light' | 'dark';
export type RadiusOption = 'none' | 'small' | 'medium' | 'large' | 'pill';
export type DensityOption = 'compact' | 'normal' | 'spacious';

export interface ThemeConfig {
  /** Color scheme: light or dark */
  colorScheme?: ColorScheme;

  /** Corner radius style */
  radius?: RadiusOption;

  /** UI density/spacing */
  density?: DensityOption;

  /** Typography options */
  typography?: TypographyConfig;

  /** Color customization */
  color?: ColorConfig;
}

export interface TypographyConfig {
  /** Base font size in pixels (14-18) */
  baseSize?: number;

  /** Primary font family */
  fontFamily?: string;

  /** Monospace font family for code */
  fontFamilyMono?: string;

  /** Custom font sources */
  fontSources?: FontSource[];
}

export interface FontSource {
  family: string;
  src: string;
  weight?: number | string;
  style?: 'normal' | 'italic' | 'oblique';
  display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
}

export interface ColorConfig {
  /** Grayscale palette with tinted hue */
  grayscale?: GrayscaleConfig;

  /** Accent/primary color */
  accent?: AccentConfig;

  /** Surface background/foreground colors */
  surface?: SurfaceConfig;

  /** Icon color override */
  icon?: string;

  /** User message bubble colors */
  userMessage?: UserMessageColorConfig;
}

export interface GrayscaleConfig {
  /** Hue in degrees (0-360) */
  hue: number;

  /** Tint intensity (0-9) */
  tint: number;

  /** Shade adjustment (-4 to 4) */
  shade?: number;
}

export interface AccentConfig {
  /** Primary accent color (hex, rgb, hsl) */
  primary: string;

  /** Accent intensity level (0-3) */
  level?: number;
}

export interface SurfaceConfig {
  /** Background color for surfaces */
  background: string;

  /** Foreground color for surfaces */
  foreground: string;
}

export interface UserMessageColorConfig {
  /** Text color for user messages */
  text: string;

  /** Background color for user messages */
  background: string;
}

export interface StartScreenConfig {
  /** Greeting text shown in new thread view */
  greeting?: string;

  /** Starter prompts shown above composer */
  prompts?: StarterPrompt[];
}

export interface StarterPrompt {
  /** Display label */
  label: string;

  /** Icon name */
  icon?: string;

  /** Text inserted when clicked (defaults to label) */
  prompt?: string;
}

export interface ComposerConfig {
  /** Placeholder text in input */
  placeholder?: string;

  /** Disclaimer text below composer */
  disclaimer?: string;

  /** Enable file attachments */
  attachments?: {
    enabled: boolean;
    maxSize?: number;
    maxCount?: number;
    accept?: string[];
  };

  /** Show model picker */
  models?: ModelOption[];
}

export interface ModelOption {
  id: string;
  label: string;
  description?: string;
  default?: boolean;
}
