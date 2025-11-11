/**
 * Widget Type Definitions
 *
 * Purpose: Defines TypeScript types for widget configuration and internal state
 * Responsibility: Type safety and IntelliSense support
 */

export interface WidgetConfig {
  branding?: BrandingConfig;
  style?: StyleConfig;
  connection: ConnectionConfig;
  license?: LicenseConfig; // Injected by server at serve time
}

export interface BrandingConfig {
  companyName?: string;
  logoUrl?: string;
  welcomeText?: string;
  firstMessage?: string;
}

export interface StyleConfig {
  theme?: 'light' | 'dark' | 'auto';
  primaryColor?: string;
  position?: 'bottom-right' | 'bottom-left';
  cornerRadius?: number;
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
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}
