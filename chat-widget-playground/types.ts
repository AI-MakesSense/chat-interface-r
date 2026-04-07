

export interface WidgetConfig {
  // Appearance
  themeMode: 'light' | 'dark';
  useAccent: boolean;
  accentColor: string;
  useTintedGrayscale: boolean;
  tintHue: number;
  tintLevel: number;
  shadeLevel: number;
  useCustomSurfaceColors: boolean;
  surfaceBackgroundColor: string;
  surfaceForegroundColor: string;
  useCustomTextColor: boolean;
  customTextColor: string;
  
  // Component Colors
  useCustomIconColor: boolean;
  customIconColor: string;
  useCustomUserMessageColors: boolean;
  customUserMessageTextColor: string;
  customUserMessageBackgroundColor: string;
  
  // Typography
  fontFamily: string;
  fontSize: number; // 14, 16, 18
  useCustomFont: boolean;
  customFontName?: string;
  customFontCss?: string;
  
  // Style
  radius: 'none' | 'small' | 'medium' | 'large' | 'pill';
  density: 'compact' | 'normal' | 'spacious';
  
  // Start Screen
  greeting: string;
  starterPrompts: { label: string; icon: string }[];
  
  // Composer
  placeholder: string;
  disclaimer: string;
  enableAttachments: boolean;
  enableModelPicker: boolean;

  // Connect
  enableN8n: boolean;
  n8nWebhookUrl: string;
  enableAgentKit: boolean;
  agentKitWorkflowId: string;
  agentKitApiKey: string;
}

export type ResizeDirection = 'horizontal' | 'vertical' | 'both' | null;

export interface Dimensions {
  width: number;
  height: number;
}