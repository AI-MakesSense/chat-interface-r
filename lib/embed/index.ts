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
  getPrimaryEmbedCode,
  resolveEmbedBaseUrl,
  isLikelyVercelPreviewHostname,
  generateWidgetKey,
  isValidWidgetKey,
  getEmbedTypeInfo,
  EMBED_TYPES,
} from './generate-embed-code';
