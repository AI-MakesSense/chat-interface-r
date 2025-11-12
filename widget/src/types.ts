/**
 * Widget Type Definitions
 *
 * Purpose: Defines TypeScript types for widget configuration and internal state
 * Responsibility: Type safety and IntelliSense support
 */

export interface WidgetConfig {
  branding: BrandingConfig;
  style: StyleConfig;
  features: FeaturesConfig;
  connection: ConnectionConfig;
  license?: LicenseConfig; // Injected by server at serve time
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
  routeParam?: string;
  captureContext?: boolean; // Capture page URL and query params
  customContext?: Record<string, any>; // User-defined metadata
}

export interface LicenseConfig {
  brandingEnabled: boolean;
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
