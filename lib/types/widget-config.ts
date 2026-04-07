/**
 * Widget Configuration Type Definitions
 *
 * Purpose: Provides strongly-typed interfaces for widget configurations.
 * Responsibilities: Define all type interfaces for widget configuration objects
 * Assumptions:
 * - All color values are 6-digit hex codes (#RRGGBB)
 * - URLs are validated before storage
 * - Tier restrictions enforced at validation layer
 */

// ============================================================================
// Branding Configuration
// ============================================================================

export interface BrandingConfig {
  companyName: string;              // max 100 chars
  welcomeText: string;              // max 200 chars
  logoUrl: string | null;           // HTTPS URL or null
  responseTimeText: string;         // e.g., "Typically replies in minutes"
  firstMessage: string;             // Initial bot message
  inputPlaceholder: string;         // Textarea placeholder
  launcherIcon: 'chat' | 'support' | 'bot' | 'custom'; // Icon type
  customLauncherIconUrl: string | null; // HTTPS URL if launcherIcon='custom'
  brandingEnabled: boolean;         // "Powered by N8n Widget Designer" footer
}

// ============================================================================
// Theme Configuration
// ============================================================================

export type ThemeMode = 'light' | 'dark' | 'auto'; // auto = follows system preference

export interface ThemeColors {
  primary: string;                  // Hex color (buttons, launcher)
  secondary: string;                // Hex color (accents)
  background: string;               // Hex color (chat window background)
  userMessage: string;              // Hex color (user message bubble)
  botMessage: string;               // Hex color (bot message bubble)
  text: string;                     // Hex color (main text)
  textSecondary: string;            // Hex color (secondary text)
  border: string;                   // Hex color (borders)
  inputBackground: string;          // Hex color (input field background)
  inputText: string;                // Hex color (input field text)
}

export interface ThemeDarkOverride {
  enabled: boolean;                 // Whether to use dark theme overrides
  colors: Partial<ThemeColors>;     // Override specific colors for dark mode
}

export type WidgetPosition =
  | 'bottom-right'
  | 'bottom-left'
  | 'top-right'
  | 'top-left';

export interface PositionConfig {
  position: WidgetPosition;
  offsetX: number;                  // Pixels from edge (default 20)
  offsetY: number;                  // Pixels from edge (default 20)
}

export type WidgetSize = 'compact' | 'standard' | 'expanded';

export interface SizeConfig {
  mode: WidgetSize;
  customWidth: number | null;       // Pixels (if mode='custom')
  customHeight: number | null;      // Pixels (if mode='custom')
  fullscreenOnMobile: boolean;      // Force fullscreen on mobile
}

export interface TypographyConfig {
  fontFamily: string;               // Font family name
  fontSize: number;                 // Base font size in px (12-20)
  fontUrl: string | null;           // Google Fonts URL or null for system fonts
  disableDefaultFont: boolean;      // Use custom font only
}

export interface ThemeConfig {
  mode: ThemeMode;
  colors: ThemeColors;
  darkOverride: ThemeDarkOverride;
  position: PositionConfig;
  size: SizeConfig;
  typography: TypographyConfig;
  cornerRadius: number;             // Border radius in px (0-20)
}

// ============================================================================
// Advanced Styling (Pro/Agency only)
// ============================================================================

export interface MessageStylingConfig {
  userMessageBackground: string;    // Override theme.colors.userMessage
  userMessageText: string;          // Text color in user messages
  botMessageBackground: string;     // Override theme.colors.botMessage
  botMessageText: string;           // Text color in bot messages
  messageSpacing: number;           // Gap between messages in px
  bubblePadding: number;            // Padding inside message bubbles in px
  showAvatar: boolean;              // Show bot avatar
  avatarUrl: string | null;         // Custom avatar URL
}

export interface MarkdownStylingConfig {
  codeBlockBackground: string;      // Hex color
  codeBlockText: string;            // Hex color
  codeBlockBorder: string;          // Hex color
  inlineCodeBackground: string;     // Hex color
  inlineCodeText: string;           // Hex color
  linkColor: string;                // Hex color
  linkHoverColor: string;           // Hex color
  tableHeaderBackground: string;    // Hex color
  tableBorderColor: string;         // Hex color
}

export interface AdvancedStylingConfig {
  enabled: boolean;                 // Pro/Agency only
  messages: MessageStylingConfig;
  markdown: MarkdownStylingConfig;
}

// ============================================================================
// Behavior Configuration
// ============================================================================

export interface BehaviorConfig {
  autoOpen: boolean;                // Auto-open chat on page load
  autoOpenDelay: number;            // Delay in seconds (if autoOpen=true)
  showCloseButton: boolean;         // Show X button in header
  persistMessages: boolean;         // Save messages in localStorage
  enableSoundNotifications: boolean; // Play sound on new messages
  enableTypingIndicator: boolean;   // Show "..." when bot is typing
}

// ============================================================================
// Connection Configuration
// ============================================================================

export interface ConnectionConfig {
  webhookUrl: string;               // N8n webhook URL (HTTPS required)
  route: string | null;             // Optional route parameter
  timeoutSeconds: number;           // Request timeout (10-60 seconds)
}

// ============================================================================
// Features Configuration
// ============================================================================

export interface FileAttachmentsConfig {
  enabled: boolean;                 // Allow file uploads
  allowedExtensions: string[];      // e.g., ['.pdf', '.png', '.jpg']
  maxFileSizeMB: number;            // Max file size in MB (1-50)
}

export interface FeaturesConfig {
  attachments: FileAttachmentsConfig;
  emailTranscript: boolean;         // Allow users to email transcript (Pro/Agency)
  printTranscript: boolean;         // Allow users to print transcript
  ratingPrompt: boolean;            // Prompt for rating after conversation (Pro/Agency)
}

// ============================================================================
// Complete Widget Configuration
// ============================================================================

export interface WidgetConfig {
  branding: BrandingConfig;
  theme: ThemeConfig;
  advancedStyling: AdvancedStylingConfig;
  behavior: BehaviorConfig;
  connection: ConnectionConfig;
  features: FeaturesConfig;
}

// ============================================================================
// Widget Metadata (from database)
// ============================================================================

export interface WidgetMetadata {
  id: string;                       // UUID
  licenseId: string;                // UUID
  name: string;                     // User-friendly name
  status: 'active' | 'paused' | 'deleted';
  version: number;
  deployedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Complete Widget (metadata + config)
// ============================================================================

export interface WidgetWithConfig extends WidgetMetadata {
  config: WidgetConfig;
}
