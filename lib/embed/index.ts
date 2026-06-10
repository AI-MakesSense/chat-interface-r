/**
 * Embed Module
 *
 * Exports utilities for generating widget embed codes
 */

export {
  type EmbedType,
  type EmbedCodeResult,
  type WidgetForEmbed,
  generateEmbedCode,
  generateAllEmbedCodes,
  extractInlineDimensions,
  getPrimaryEmbedCode,
  resolveEmbedBaseUrl,
  resolveEmbedBaseUrlFromRequest,
  isLikelyVercelPreviewHostname,
  normalizeBaseUrl,
  ensureProtocol,
  getConfiguredPublicUrl,
  generateWidgetKey,
  isValidWidgetKey,
  getEmbedTypeInfo,
  EMBED_TYPES,
} from './generate-embed-code';
