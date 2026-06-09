/**
 * @deprecated Import from '@/lib/widget-config' instead. Kept as a re-export shim.
 *
 * The canonical type definitions live in lib/widget-config/schema.ts.
 * Legacy type aliases are maintained here so existing imports keep compiling.
 */

export type {
  ChatWidgetConfig as WidgetConfig,
  BrandingConfig,
  ThemeConfig,
  AdvancedStylingConfig,
  BehaviorConfig,
  ConnectionConfig,
  FeaturesConfig,
} from '@/lib/widget-config/schema';

// -----------------------------------------------------------------------
// Types that had no canonical equivalent — kept inline for compatibility.
// These describe sub-shapes of ThemeConfig already inferred by the schema.
// -----------------------------------------------------------------------

/** @deprecated — these auxiliary types had no callers outside this file. */
export type ThemeMode = 'light' | 'dark' | 'auto';
export type WidgetPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
export type WidgetSize = 'compact' | 'standard' | 'expanded';

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  userMessage: string;
  botMessage: string;
  text: string;
  textSecondary: string;
  border: string;
  inputBackground: string;
  inputText: string;
}

export interface ThemeDarkOverride {
  enabled: boolean;
  colors: Partial<ThemeColors>;
}

export interface PositionConfig {
  position: WidgetPosition;
  offsetX: number;
  offsetY: number;
}

export interface SizeConfig {
  mode: WidgetSize;
  customWidth: number | null;
  customHeight: number | null;
  fullscreenOnMobile: boolean;
}

export interface TypographyConfig {
  fontFamily: string;
  fontSize: number;
  fontUrl: string | null;
  disableDefaultFont: boolean;
}

export interface MessageStylingConfig {
  userMessageBackground: string;
  userMessageText: string;
  botMessageBackground: string;
  botMessageText: string;
  messageSpacing: number;
  bubblePadding: number;
  showAvatar: boolean;
  avatarUrl: string | null;
}

export interface MarkdownStylingConfig {
  codeBlockBackground: string;
  codeBlockText: string;
  codeBlockBorder: string;
  inlineCodeBackground: string;
  inlineCodeText: string;
  linkColor: string;
  linkHoverColor: string;
  tableHeaderBackground: string;
  tableBorderColor: string;
}

export interface FileAttachmentsConfig {
  enabled: boolean;
  allowedExtensions: string[];
  maxFileSizeMB: number;
}

// Widget metadata types — unique to this file, kept for backward compat.
export interface WidgetMetadata {
  id: string;
  licenseId: string;
  name: string;
  status: 'active' | 'paused' | 'deleted';
  version: number;
  deployedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface WidgetWithConfig extends WidgetMetadata {
  config: import('@/lib/widget-config/schema').ChatWidgetConfig;
}
