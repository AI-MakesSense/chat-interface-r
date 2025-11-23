/**
 * Widget Type Definitions
 *
 * Purpose: Defines TypeScript types for widget configuration and internal state
 * Responsibility: Type safety and IntelliSense support
 */

export interface WidgetConfig {
  widgetId?: string; // Widget ID for relay API
  branding: BrandingConfig;
  style: StyleConfig;
  features: FeaturesConfig;
  connection?: ConnectionConfig;
  license?: LicenseConfig; // Injected by server at serve time
  portal?: PortalConfig;
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
  webhookUrl: string;
  relayEndpoint?: string;
  [key: string]: any;
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
