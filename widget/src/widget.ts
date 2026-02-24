/**
 * Chat Widget Core - Matching Configurator Preview Design
 *
 * Purpose: Main widget UI and interaction logic
 * Responsibility: Create chat bubble, message list, input, handle sending/receiving
 *
 * Design: Matches the React configurator preview exactly:
 * - No header with company name - just icons in corner
 * - Start screen with centered greeting + prompts
 * - Prompts disappear when messages exist
 * - Clean, modern design
 */

import { WidgetRuntimeConfig, WidgetConfig, Message } from './types';
import { renderMarkdown } from './markdown';
import { MarkdownCache } from './utils/markdown-cache';
import { buildRelayPayload } from './services/messaging/payload';
import { SessionManager } from './services/messaging/session-manager';
import { createCSSVariables, createFontFaceCSS } from './theming/css-variables';
import { isPdfUrl } from './utils/link-detector';
import { PdfLightbox } from './ui/pdf-lightbox';
import type { FileAttachment } from './services/messaging/types';

// Shared markdown cache instance (100 entries, 5MB, 5-minute TTL)
const mdCache = new MarkdownCache({ maxEntries: 100, maxMemory: 5 * 1024 * 1024, ttl: 5 * 60 * 1000 });

function cachedRenderMarkdown(content: string): string {
  const cached = mdCache.get(content);
  if (cached) return cached;
  const html = renderMarkdown(content);
  mdCache.set(content, html);
  return html;
}

// Icon SVG paths mapping - matching Lucide icons from preview
// Comprehensive icon set organized by category for starter prompts
const ICON_SVGS: Record<string, string> = {
  // Popular
  sparkles: '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>',
  message: '<path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/>',
  lightbulb: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
  rocket: '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',
  zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',

  // Communication
  messageSquare: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  messagesSquare: '<path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z"/><path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  send: '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
  atSign: '<circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/>',

  // Actions
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  trendingUp: '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
  activity: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
  play: '<polygon points="5 3 19 12 5 21 5 3"/>',
  wand: '<path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/><path d="M17.8 11.8 19 13"/><path d="M15 9h0"/><path d="M17.8 6.2 19 5"/><path d="m3 21 9-9"/><path d="M12.2 6.2 11 5"/>',
  flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',

  // Tech
  code: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
  terminal: '<polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>',
  server: '<rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>',
  cpu: '<rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>',
  database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>',
  braces: '<path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1"/><path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"/>',
  fileCode: '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="m10 13-2 2 2 2"/><path d="m14 17 2-2-2-2"/>',
  globe: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  wifi: '<path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>',

  // Creative
  pen: '<path d="m12 19 7-7 3 3-7 7-3-3z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="m2 2 7.586 7.586"/><circle cx="11" cy="11" r="2"/>',
  pencil: '<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>',
  palette: '<circle cx="13.5" cy="6.5" r="0.5"/><circle cx="17.5" cy="10.5" r="0.5"/><circle cx="8.5" cy="7.5" r="0.5"/><circle cx="6.5" cy="12.5" r="0.5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
  camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
  video: '<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>',
  music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  mic: '<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>',
  film: '<rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/>',

  // Business
  briefcase: '<rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  creditCard: '<rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>',
  dollar: '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  piggyBank: '<path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2h0V5z"/><path d="M2 9v1c0 1.1.9 2 2 2h1"/><path d="M16 11h0"/>',
  receipt: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>',
  fileText: '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/>',
  shoppingCart: '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>',
  shoppingBag: '<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>',

  // Learning
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  graduationCap: '<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>',
  library: '<path d="m16 6 4 14"/><path d="M12 6v14"/><path d="M8 8v12"/><path d="M4 4v16"/>',
  brain: '<path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>',

  // People
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  userPlus: '<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>',
  userCheck: '<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/>',
  smile: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>',
  thumbsUp: '<path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/>',
  thumbsDown: '<path d="M17 14V2"/><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z"/>',

  // Navigation
  compass: '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>',
  mapPin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
  map: '<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>',
  navigation: '<polygon points="3 11 22 2 13 21 11 13 3 11"/>',
  home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  building: '<rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>',

  // Time
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  timer: '<line x1="10" y1="2" x2="14" y2="2"/><line x1="12" y1="14" x2="12" y2="8"/><circle cx="12" cy="14" r="8"/>',
  history: '<path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/>',

  // Tools
  wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  cog: '<path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"/><path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="M12 2v2"/><path d="M12 22v-2"/><path d="m17 20.66-1-1.73"/><path d="M11 10.27 7 3.34"/><path d="m20.66 17-1.73-1"/><path d="m3.34 7 1.73 1"/><path d="M14 12h8"/><path d="M2 12h2"/><path d="m20.66 7-1.73 1"/><path d="m3.34 17 1.73-1"/><path d="m17 3.34-1 1.73"/><path d="m11 13.73-4 6.93"/>',
  sliders: '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
  filter: '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',

  // Security
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  key: '<path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"/>',
  eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>',

  // Status
  help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
  alert: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
  check: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
  x: '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
  bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',

  // Nature
  sun: '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>',
  moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
  cloud: '<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>',
  cloudRain: '<line x1="16" y1="13" x2="16" y2="21"/><line x1="8" y1="13" x2="8" y2="21"/><line x1="12" y1="15" x2="12" y2="23"/><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/>',
  leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
  flower: '<path d="M12 7.5a4.5 4.5 0 1 1 4.5 4.5M12 7.5A4.5 4.5 0 1 0 7.5 12M12 7.5V9m-4.5 3a4.5 4.5 0 1 0 4.5 4.5M7.5 12H9m7.5 0a4.5 4.5 0 1 1-4.5 4.5m4.5-4.5H15m-3 4.5V15"/><circle cx="12" cy="12" r="3"/><path d="m8 16 1.5-1.5"/><path d="M14.5 9.5 16 8"/><path d="m8 8 1.5 1.5"/><path d="M14.5 14.5 16 16"/>',
  tree: '<path d="M10 10v.2A3 3 0 0 1 8.9 16v0H5v0h0a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z"/><path d="M7 16v6"/><path d="M13 19v3"/><path d="M10.3 14a9.8 9.8 0 0 0 2.57-6.7c0-2.2.13-5.3 5.13-5.3 2.5 0 3 1.56 3 3v1.9a9.8 9.8 0 0 1-2.57 6.7A4.6 4.6 0 0 1 15.8 15a3 3 0 0 1-3 3v0H10v0a3 3 0 0 1-.7-5.92Z"/>',

  // Objects
  box: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
  gift: '<polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>',
  package: '<line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
  coffee: '<path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/>',
  flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>',
  award: '<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>',
  crown: '<path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/>',

  // Files
  file: '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/>',
  folder: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
  folderOpen: '<path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>',
  externalLink: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
};

// Helper to get icon SVG for a given icon name
function getIconSVG(iconName: string): string {
  return ICON_SVGS[iconName] || ICON_SVGS.message;
}

// Escape HTML to prevent XSS in user-provided strings
function escapeHTML(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export interface WidgetCleanup {
  destroy: () => void;
}

export function createChatWidget(runtimeConfig: WidgetRuntimeConfig): WidgetCleanup {
  const messages: Message[] = [];
  let isOpen = false;
  let messageIdCounter = 0;
  let selectedFiles: File[] = [];
  const config = runtimeConfig.uiConfig || ({} as WidgetConfig);

  // AbortController for all event listeners — call abort() to remove them all
  const ac = new AbortController();
  const signal = ac.signal;

  // Initialize SessionManager for session continuity
  const sessionManager = new SessionManager(runtimeConfig.relay.licenseKey || 'default');

  // Determine color scheme from extended theme or legacy style
  const colorScheme = config.theme?.colorScheme || config.style?.theme || 'light';
  const isDark = colorScheme === 'dark';

  // Font family mapping - matching preview exactly
  const getFontFamily = (f: string): string => {
    switch (f) {
      case 'System':
        return '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
      case 'Space Grotesk':
        return '"Space Grotesk", sans-serif';
      case 'Comfortaa':
        return '"Comfortaa", cursive';
      case 'Bricolage Grotesque':
        return '"Bricolage Grotesque", sans-serif';
      case 'OpenAI Sans':
        return '"Inter", sans-serif';
      case 'system-ui':
        return '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
      default:
        return f ? `"${f}", sans-serif` : '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    }
  };

  // Get font family from config
  const rawFontFamily = config.theme?.typography?.fontFamily || config.style?.fontFamily || 'System';
  const fontFamily = getFontFamily(rawFontFamily);
  const fontSize = config.theme?.typography?.baseSize || config.style?.fontSize || 16;

  // Apply default config with extended theme support
  const mergedConfig: WidgetConfig = {
    branding: {
      companyName: config.branding?.companyName || 'Support',
      welcomeText: config.branding?.welcomeText || config.startScreen?.greeting || 'How can we help you?',
      firstMessage: config.branding?.firstMessage || '',
      logoUrl: config.branding?.logoUrl,
    },
    style: {
      theme: colorScheme as 'light' | 'dark' | 'auto',
      primaryColor: config.theme?.color?.accent?.primary || config.style?.primaryColor || '#0ea5e9',
      backgroundColor: config.theme?.color?.surface?.background || config.style?.backgroundColor || (isDark ? '#1a1a1a' : '#ffffff'),
      textColor: config.style?.textColor || (isDark ? '#e5e5e5' : '#1f2937'),
      fontFamily: fontFamily,
      fontSize: fontSize,
      position: config.style?.position || 'bottom-right',
      cornerRadius: config.style?.cornerRadius || 12,
    },
    features: {
      // Unified: new path (composer.attachments.enabled) + legacy (features.fileAttachmentsEnabled)
      fileAttachmentsEnabled: config.composer?.attachments?.enabled || config.features?.fileAttachmentsEnabled || false,
      allowedExtensions: config.composer?.attachments?.accept || config.features?.allowedExtensions || ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'],
      maxFileSizeKB: config.composer?.attachments?.maxSize ? config.composer.attachments.maxSize / 1024 : config.features?.maxFileSizeKB || 5000,
    },
    connection: config.connection,
    license: config.license,
    theme: config.theme,
    startScreen: config.startScreen,
    composer: config.composer,
  };

  // Get greeting - use startScreen.greeting, then fall back to legacy welcomeText
  const greeting = config.startScreen?.greeting || config.branding?.welcomeText || 'How can I help you today?';

  // Generate CSS variables
  const cssVariables = createCSSVariables(mergedConfig);
  const fontFaceCSS = createFontFaceCSS(mergedConfig);

  // Calculate colors based on config (matching preview logic)
  let bg: string, text: string, subText: string, border: string, surface: string, composerSurface: string, hoverSurface: string;

  const tintedGrayscale = config.theme?.color?.grayscale;
  const customSurface = config.theme?.color?.surface;

  if (tintedGrayscale) {
    const h = tintedGrayscale.hue || 220;
    const tLevel = tintedGrayscale.tint || 10;
    const sLevel = tintedGrayscale.shade || 50;

    if (isDark) {
      const sat = 5 + tLevel * 2;
      const lit = 10 + sLevel * 0.5;
      bg = `hsl(${h}, ${sat}%, ${lit}%)`;
      surface = `hsl(${h}, ${sat}%, ${lit + 5}%)`;
      composerSurface = surface;
      border = `hsla(${h}, ${sat}%, 90%, 0.08)`;
      text = `hsl(${h}, ${Math.max(0, sat - 10)}%, 90%)`;
      subText = `hsl(${h}, ${Math.max(0, sat - 10)}%, 60%)`;
      hoverSurface = `hsla(${h}, ${sat}%, 90%, 0.05)`;
    } else {
      const sat = 10 + tLevel * 3;
      const lit = 98 - sLevel * 2;
      bg = `hsl(${h}, ${sat}%, ${lit}%)`;
      surface = `hsl(${h}, ${sat}%, ${lit - 5}%)`;
      composerSurface = `hsl(${h}, ${sat}%, 100%)`;
      border = `hsla(${h}, ${sat}%, 10%, 0.08)`;
      text = `hsl(${h}, ${sat}%, 10%)`;
      subText = `hsl(${h}, ${sat}%, 40%)`;
      hoverSurface = `hsla(${h}, ${sat}%, 10%, 0.05)`;
    }
  } else if (customSurface) {
    bg = customSurface.background || (isDark ? '#1a1a1a' : '#ffffff');
    surface = customSurface.foreground || (isDark ? '#262626' : '#f8fafc');
    composerSurface = surface;
    border = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
    text = isDark ? '#e5e5e5' : '#111827';
    subText = isDark ? '#a1a1aa' : '#6b7280';
    hoverSurface = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  } else {
    bg = isDark ? '#1a1a1a' : '#ffffff';
    text = isDark ? '#e5e5e5' : '#111827';
    subText = isDark ? '#a1a1aa' : '#6b7280';
    border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
    surface = isDark ? '#262626' : '#f3f4f6';
    composerSurface = isDark ? '#262626' : '#ffffff';
    hoverSurface = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  }

  // Custom text color override (matching preview)
  if (config.theme?.color?.text) {
    text = config.theme.color.text;
  }

  // Custom icon/subText color override (matching preview)
  if (config.theme?.color?.icon) {
    subText = config.theme.color.icon;
  }

  // Accent colors
  const accentColor = config.theme?.color?.accent?.primary || mergedConfig.style.primaryColor;
  const hasAccent = !!config.theme?.color?.accent;

  // User message colors
  let userMsgBg = hasAccent ? accentColor : surface;
  let userMsgText = hasAccent ? '#ffffff' : text;

  if (config.theme?.color?.userMessage) {
    userMsgBg = config.theme.color.userMessage.background || userMsgBg;
    userMsgText = config.theme.color.userMessage.text || userMsgText;
  }

  // Radius
  const getRadius = () => {
    const r = config.theme?.radius || 'medium';
    switch (r) {
      case 'none': return '0px';
      case 'small': return '4px';
      case 'medium': return '8px';
      case 'large': return '16px';
      case 'pill': return '24px';
      default: return '12px';
    }
  };
  const elementRadius = config.theme?.radius === 'pill' ? '20px' : getRadius();

  // Density
  const getDensityPadding = () => {
    const d = config.theme?.density || 'normal';
    switch (d) {
      case 'compact': return '1rem';
      case 'spacious': return '2.5rem';
      default: return '1.5rem';
    }
  };
  const padding = getDensityPadding();

  // Density-aware message bubble padding (matching preview getBubblePadding)
  const getMessagePadding = () => {
    const d = config.theme?.density || 'normal';
    switch (d) {
      case 'compact': return '8px 12px';
      case 'spacious': return '14px 20px';
      default: return '10px 16px';
    }
  };
  const messagePadding = getMessagePadding();

  // Density-aware message spacing (matching preview getMessageVerticalSpacing)
  const getMessageGap = () => {
    const d = config.theme?.density || 'normal';
    switch (d) {
      case 'compact': return '12px';
      case 'spacious': return '32px';
      default: return '24px';
    }
  };
  const messageGap = getMessageGap();

  // Inject Google Fonts for known font families
  const googleFonts: Record<string, string> = {
    'Space Grotesk': 'Space+Grotesk:wght@400;500;600;700',
    'Comfortaa': 'Comfortaa:wght@400;500;600;700',
    'Bricolage Grotesque': 'Bricolage+Grotesque:wght@400;500;600;700',
    'Inter': 'Inter:wght@400;500;600;700',
  };

  if (googleFonts[rawFontFamily]) {
    const linkEl = document.createElement('link');
    linkEl.rel = 'stylesheet';
    linkEl.href = `https://fonts.googleapis.com/css2?family=${googleFonts[rawFontFamily]}&display=swap`;
    document.head.appendChild(linkEl);
  }

  // Inject custom font CSS if provided (from config.theme.typography.fontSources)
  const fontSources = config.theme?.typography?.fontSources;
  if (fontSources && fontSources.length > 0) {
    fontSources.forEach(source => {
      if (source.src) {
        const customFontStyle = document.createElement('style');
        customFontStyle.textContent = source.src;
        document.head.appendChild(customFontStyle);
      }
    });
  }

  // Re-initialization safety: replace prior style/container before rendering.
  document.getElementById('n8n-chat-widget-styles')?.remove();
  document.getElementById('n8n-chat-widget-container')?.remove();

  // Inject CSS styles
  const styleEl = document.createElement('style');
  styleEl.id = 'n8n-chat-widget-styles';
  styleEl.textContent = `
    ${fontFaceCSS}

    #n8n-chat-widget-container {
      ${Object.entries(cssVariables).map(([key, value]) => `${key}: ${value};`).join('\n      ')}
    }

    /* Typing animation */
    .n8n-typing-container {
      display: flex;
      gap: 4px;
      padding: 4px 0;
    }
    .n8n-typing-dot {
      width: 6px;
      height: 6px;
      background: currentColor;
      border-radius: 50%;
      opacity: 0.6;
      animation: n8n-bounce 1.4s infinite ease-in-out both;
    }
    .n8n-typing-dot:nth-child(1) { animation-delay: -0.32s; }
    .n8n-typing-dot:nth-child(2) { animation-delay: -0.16s; }
    @keyframes n8n-bounce {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-4px); }
    }

    /* Scrollbar styling */
    #n8n-chat-messages::-webkit-scrollbar {
      width: 6px;
    }
    #n8n-chat-messages::-webkit-scrollbar-track {
      background: transparent;
    }
    #n8n-chat-messages::-webkit-scrollbar-thumb {
      background: ${border};
      border-radius: 3px;
    }

    /* Starter prompts - matching preview */
    .n8n-starter-prompt {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 8px;
      background: transparent;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      color: ${text};
      text-align: left;
      transition: background 0.15s;
    }
    .n8n-starter-prompt:hover {
      background: ${hoverSurface};
    }
    .n8n-starter-prompt-icon {
      color: ${subText};
      opacity: 0.7;
      transition: opacity 0.15s;
    }
    .n8n-starter-prompt:hover .n8n-starter-prompt-icon {
      opacity: 1;
    }

    /* Wide mode: card grid layout for starter prompts (≥500px) */
    .n8n-prompts-wide {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 12px;
    }
    .n8n-prompts-wide .n8n-starter-prompt {
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      width: 140px;
      height: 120px;
      padding: 16px;
      border-radius: 12px;
      border: 1px solid ${border};
      background: ${surface};
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
      gap: 12px;
    }
    .n8n-prompts-wide .n8n-starter-prompt:hover {
      transform: translateY(-2px);
    }
    .n8n-prompts-wide .n8n-starter-prompt-icon svg {
      width: 24px;
      height: 24px;
    }
    .n8n-prompts-wide .n8n-starter-prompt span:last-child {
      font-size: 12px;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    /* Narrow mode greeting: left-aligned */
    .n8n-greeting-narrow {
      text-align: left;
    }
    /* Wide mode greeting: centered */
    .n8n-greeting-wide {
      text-align: center;
    }
    .n8n-start-screen-wide {
      align-items: center;
    }
    .n8n-start-screen-wide .n8n-greeting-wrap {
      width: 100%;
      max-width: 42rem;
      padding: 0 2rem;
    }

    /* Markdown content styling */
    .n8n-message-content p { margin: 0 0 0.5em 0; }
    .n8n-message-content p:last-child { margin-bottom: 0; }
    .n8n-message-content code {
      background: ${surface};
      padding: 2px 6px;
      border-radius: 4px;
      font-family: ui-monospace, monospace;
      font-size: 0.9em;
    }
    .n8n-message-content pre {
      background: ${isDark ? '#0d0d0d' : '#f1f5f9'};
      color: ${isDark ? '#e2e8f0' : '#334155'};
      padding: 12px;
      border-radius: 8px;
      overflow-x: auto;
      margin: 0.5em 0;
    }
    .n8n-message-content pre code {
      background: none;
      padding: 0;
      color: inherit;
    }
    .n8n-message-content h1,
    .n8n-message-content h2,
    .n8n-message-content h3,
    .n8n-message-content h4,
    .n8n-message-content h5,
    .n8n-message-content h6 {
      margin: 0.6em 0 0.3em 0;
      font-weight: 600;
      line-height: 1.3;
    }
    .n8n-message-content h1 { font-size: 1.4em; }
    .n8n-message-content h2 { font-size: 1.25em; }
    .n8n-message-content h3 { font-size: 1.1em; }
    .n8n-message-content h4,
    .n8n-message-content h5,
    .n8n-message-content h6 { font-size: 1em; }
    .n8n-message-content ul,
    .n8n-message-content ol {
      margin: 0.4em 0;
      padding-left: 1.5em;
    }
    .n8n-message-content ul { list-style: disc; }
    .n8n-message-content ol { list-style: decimal; }
    .n8n-message-content li { margin: 0.15em 0; }
    .n8n-message-content blockquote {
      border-left: 3px solid ${isDark ? '#4b5563' : '#d1d5db'};
      padding: 0.3em 0.8em;
      margin: 0.4em 0;
      color: ${isDark ? '#9ca3af' : '#6b7280'};
      background: ${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'};
      border-radius: 0 4px 4px 0;
    }
    .n8n-message-content hr {
      border: none;
      border-top: 1px solid ${isDark ? '#374151' : '#e5e7eb'};
      margin: 0.6em 0;
    }
    .n8n-message-content table {
      border-collapse: collapse;
      width: 100%;
      margin: 0.5em 0;
      font-size: 0.9em;
    }
    .n8n-message-content th,
    .n8n-message-content td {
      border: 1px solid ${isDark ? '#374151' : '#d1d5db'};
      padding: 6px 10px;
      text-align: left;
    }
    .n8n-message-content th {
      background: ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'};
      font-weight: 600;
    }
    .n8n-message-content tbody tr:nth-child(even) {
      background: ${isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)'};
    }

    /* Composer focus ring — matching preview focus-within:ring-1 */
    #n8n-composer-form:focus-within {
      outline: 2px solid ${hasAccent ? accentColor : 'rgba(59, 130, 246, 0.5)'};
    }

    /* Animation — slide-in from bottom matching preview */
    @keyframes n8n-slide-in {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .n8n-animate-in {
      animation: n8n-slide-in 0.3s ease-out;
    }
  `;
  document.head.appendChild(styleEl);

  // Determine display mode (popup default, inline/portal from embed attributes)
  const displayMode = runtimeConfig.display?.mode || 'popup';
  const isInlineEmbed = displayMode === 'inline';
  const isPortalEmbed = displayMode === 'portal';
  const isPopupEmbed = !isInlineEmbed && !isPortalEmbed;

  let mountTarget: HTMLElement = document.body;
  if (isInlineEmbed) {
    const inlineContainerId = runtimeConfig.display?.containerId || 'chat-widget';
    const inlineTarget = document.getElementById(inlineContainerId);
    if (!inlineTarget) {
      console.warn(`[N8n Chat Widget] Inline container not found: #${inlineContainerId}`);
      return;
    }
    mountTarget = inlineTarget;
    mountTarget.innerHTML = '';
  } else if (isPortalEmbed) {
    mountTarget = document.getElementById(runtimeConfig.display?.containerId || 'chat-portal') || document.body;
  }

  // Create container - popup stacks window above launcher, inline/portal fill target
  const container = document.createElement('div');
  container.id = 'n8n-chat-widget-container';

  if (isPopupEmbed) {
    container.style.cssText = `
      position: fixed;
      ${mergedConfig.style.position === 'bottom-right' ? 'right: 24px;' : 'left: 24px;'}
      bottom: 24px;
      z-index: 999999;
      font-family: ${mergedConfig.style.fontFamily};
      font-size: ${mergedConfig.style.fontSize}px;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    `;
  } else if (isInlineEmbed) {
    container.style.cssText = `
      position: relative;
      width: 100%;
      height: 100%;
      min-height: 420px;
      z-index: 999999;
      font-family: ${mergedConfig.style.fontFamily};
      font-size: ${mergedConfig.style.fontSize}px;
      display: flex;
      flex-direction: column;
      align-items: stretch;
    `;
  } else {
    // Portal / fullpage mode — fill the viewport with the widget background
    // so the host page's own background (e.g. dark-mode body) never bleeds through.
    container.style.cssText = `
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100%;
      z-index: 999999;
      font-family: ${mergedConfig.style.fontFamily};
      font-size: ${mergedConfig.style.fontSize}px;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      background: ${bg};
    `;
  }

  mountTarget.appendChild(container);

  // Calculate launcher button colors (matching preview-canvas.tsx getLauncherStyle)
  let launcherBg: string, launcherColor: string;
  if (hasAccent) {
    launcherBg = accentColor;
    launcherColor = '#ffffff';
  } else if (customSurface) {
    launcherBg = customSurface.foreground || '#f8fafc';
    launcherColor = isDark ? '#e5e5e5' : '#111827';
  } else {
    launcherBg = isDark ? '#ffffff' : '#000000';
    launcherColor = isDark ? '#000000' : '#ffffff';
  }

  let bubble: HTMLButtonElement | null = null;
  let msgIconSvg: SVGElement | null = null;
  let closeIconSvg: SVGElement | null = null;

  // Create chat bubble launcher only for popup embeds
  if (isPopupEmbed) {
    bubble = document.createElement('button');
    bubble.id = 'n8n-chat-bubble';
    bubble.setAttribute('aria-label', 'Open chat');
    bubble.style.cssText = `
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: ${launcherBg};
      border: none;
      cursor: pointer;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.3s, box-shadow 0.3s;
      position: relative;
    `;

    const iconContainer = document.createElement('div');
    iconContainer.style.cssText = `position: relative; width: 24px; height: 24px;`;

    // MessageCircle icon (stroke-based, matching Lucide)
    const messageIcon = document.createElement('span');
    messageIcon.id = 'n8n-bubble-message-icon';
    messageIcon.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${launcherColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="position: absolute; inset: 0; transition: all 0.3s; opacity: 1; transform: rotate(0deg) scale(1);">
        <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/>
      </svg>
    `;

    // X close icon
    const closeIconEl = document.createElement('span');
    closeIconEl.id = 'n8n-bubble-close-icon';
    closeIconEl.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${launcherColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="position: absolute; inset: 0; transition: all 0.3s; opacity: 0; transform: rotate(-90deg) scale(0.5);">
        <path d="M18 6 6 18"/>
        <path d="m6 6 12 12"/>
      </svg>
    `;

    iconContainer.appendChild(messageIcon);
    iconContainer.appendChild(closeIconEl);
    bubble.appendChild(iconContainer);

    // References for icon animation
    msgIconSvg = messageIcon.querySelector('svg');
    closeIconSvg = closeIconEl.querySelector('svg');

    bubble.addEventListener('mouseenter', () => {
      if (bubble) bubble.style.transform = 'scale(1.05)';
    }, { signal });
    bubble.addEventListener('mouseleave', () => {
      if (bubble) bubble.style.transform = 'scale(1)';
    }, { signal });
    bubble.addEventListener('click', toggleChat, { signal });
  }

  // Create chat window - matches preview layout (380x600, 24px radius)
  // Added BEFORE bubble so it appears above in flexbox column layout
  const chatWindow = document.createElement('div');
  chatWindow.id = 'n8n-chat-window';
  chatWindow.style.cssText = `
    box-sizing: border-box;
    display: ${isPopupEmbed ? 'none' : 'flex'};
    width: ${isPopupEmbed ? '380px' : '100%'};
    height: ${isPopupEmbed ? '600px' : '100%'};
    max-height: ${isPopupEmbed ? '80vh' : 'none'};
    background: ${bg};
    color: ${text};
    border-radius: ${isPortalEmbed ? '0' : (isPopupEmbed ? '24px' : `${mergedConfig.style.cornerRadius || 12}px`)};
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    flex-direction: column;
    overflow: hidden;
    margin-bottom: ${isPopupEmbed ? '16px' : '0'};
    border: ${isPortalEmbed ? 'none' : `1px solid ${border}`};
    position: relative;
    transform-origin: ${isPopupEmbed ? 'bottom right' : 'center'};
  `;
  container.appendChild(chatWindow);

  // Add bubble AFTER chat window so it appears below in flexbox
  if (bubble) {
    container.appendChild(bubble);
  }

  // Header icons (top right) - matching preview
  const headerIcons = document.createElement('div');
  headerIcons.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    padding: 16px;
    z-index: 10;
    display: flex;
    justify-content: space-between;
    pointer-events: none;
  `;
  // Only clear history button - close is done via toggle button (matching preview)
  headerIcons.innerHTML = `
    <div style="pointer-events: auto;"></div>
    <div style="display: flex; align-items: center; gap: 4px; pointer-events: auto;">
      <button id="n8n-clear-history" style="
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: transparent;
        border: none;
        cursor: pointer;
        color: ${subText};
        transition: background 0.15s;
      " title="Clear History">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
          <path d="M3 3v5h5"/>
        </svg>
      </button>
    </div>
  `;
  chatWindow.appendChild(headerIcons);

  // Create main content area (scrollable)
  const mainContent = document.createElement('div');
  mainContent.id = 'n8n-chat-messages';
  mainContent.style.cssText = `
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    padding: ${padding};
  `;
  chatWindow.appendChild(mainContent);

  // Create start screen (greeting + prompts) - shown when no messages
  const startScreen = document.createElement('div');
  startScreen.id = 'n8n-start-screen';
  startScreen.style.cssText = `
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
  `;

  // Greeting wrapper (for responsive centering)
  const greetingWrap = document.createElement('div');
  greetingWrap.className = 'n8n-greeting-wrap';

  const greetingEl = document.createElement('h2');
  greetingEl.id = 'n8n-greeting';
  greetingEl.className = 'n8n-greeting-narrow';
  greetingEl.style.cssText = `
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
    line-height: 1.3;
    letter-spacing: -0.01em;
    color: ${text};
  `;
  greetingEl.textContent = greeting;
  greetingWrap.appendChild(greetingEl);
  startScreen.appendChild(greetingWrap);

  // Starter prompts
  const starterPrompts = mergedConfig.startScreen?.prompts || [];
  if (starterPrompts.length > 0) {
    const promptsContainer = document.createElement('div');
    promptsContainer.id = 'n8n-prompts-container';
    promptsContainer.style.cssText = `display: flex; flex-direction: column; gap: 4px;`;

    starterPrompts.forEach((prompt) => {
      const promptBtn = document.createElement('button');
      promptBtn.className = 'n8n-starter-prompt';
      // Get the icon SVG for this prompt (matching preview's icon picker)
      const iconSvg = getIconSVG(prompt.icon || 'message');
      promptBtn.innerHTML = `
        <span class="n8n-starter-prompt-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            ${iconSvg}
          </svg>
        </span>
        <span style="font-weight: 500;">${escapeHTML(prompt.label)}</span>
      `;
      promptBtn.addEventListener('click', () => {
        handleSendMessage(prompt.prompt || prompt.label);
      }, { signal });
      promptsContainer.appendChild(promptBtn);
    });

    greetingWrap.appendChild(promptsContainer);
  }

  mainContent.appendChild(startScreen);

  // Responsive prompt layout: switch between narrow (list) and wide (card grid)
  // when the chat window width crosses the 500px breakpoint, matching the preview.
  let resizeObserver: ResizeObserver | null = null;
  if (typeof ResizeObserver !== 'undefined') {
    let wasWide = false;
    const promptsEl = document.getElementById('n8n-prompts-container');
    const greetingH2 = document.getElementById('n8n-greeting');

    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      const isWide = w >= 500;
      if (isWide === wasWide) return;
      wasWide = isWide;

      if (isWide) {
        startScreen.classList.add('n8n-start-screen-wide');
        if (greetingH2) {
          greetingH2.classList.remove('n8n-greeting-narrow');
          greetingH2.classList.add('n8n-greeting-wide');
        }
        if (promptsEl) {
          promptsEl.classList.add('n8n-prompts-wide');
          promptsEl.style.cssText = '';
        }
      } else {
        startScreen.classList.remove('n8n-start-screen-wide');
        if (greetingH2) {
          greetingH2.classList.remove('n8n-greeting-wide');
          greetingH2.classList.add('n8n-greeting-narrow');
        }
        if (promptsEl) {
          promptsEl.classList.remove('n8n-prompts-wide');
          promptsEl.style.cssText = 'display: flex; flex-direction: column; gap: 4px;';
        }
      }
    });
    ro.observe(chatWindow);
    resizeObserver = ro;
  }

  // Messages container (hidden initially, shown when messages exist)
  const messagesContainer = document.createElement('div');
  messagesContainer.id = 'n8n-messages-list';
  messagesContainer.style.cssText = `
    display: none;
    flex: 1;
    flex-direction: column;
    padding-top: 48px;
    gap: ${messageGap};
  `;
  mainContent.appendChild(messagesContainer);

  // PDF Lightbox: intercept clicks on PDF links in assistant messages
  const pdfLightbox = new PdfLightbox();
  messagesContainer.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const link = target.closest('a') as HTMLAnchorElement | null;
    if (link && isPdfUrl(link.href)) {
      e.preventDefault();
      e.stopPropagation();
      pdfLightbox.open(link.href);
    }
  });

  // Composer area - matching preview
  const composerArea = document.createElement('div');
  composerArea.style.cssText = `
    padding: ${padding};
    padding-top: 0;
  `;

  const composerRadius = config.theme?.radius === 'none' ? '0px' : '999px';
  const inputPlaceholder = mergedConfig.composer?.placeholder || 'Type a message...';

  let composerHTML = `
    <form id="n8n-composer-form" style="
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px;
      background: ${composerSurface};
      border-radius: ${composerRadius};
      border: 1px solid ${border};
      box-shadow: ${isDark ? 'none' : '0 4px 12px rgba(0,0,0,0.05)'};
      transition: box-shadow 0.15s, outline 0.15s;
      outline: 2px solid transparent;
      outline-offset: 1px;
    ">
  `;

  // Attachment button
  if (mergedConfig.features.fileAttachmentsEnabled) {
    composerHTML += `
      <input type="file" id="n8n-file-input" multiple accept="${mergedConfig.features.allowedExtensions.map(e => '.' + e).join(',')}" style="display: none;" />
      <button type="button" id="n8n-attach-btn" style="
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: transparent;
        border: none;
        cursor: pointer;
        color: ${subText};
        transition: background 0.15s;
        flex-shrink: 0;
      ">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>
    `;
  } else {
    composerHTML += `<div style="width: 8px;"></div>`;
  }

  // Input
  composerHTML += `
    <input type="text" id="n8n-chat-input" placeholder="${escapeHTML(inputPlaceholder)}" style="
      flex: 1;
      border: none;
      background: transparent;
      outline: none;
      font-size: 14px;
      font-family: inherit;
      color: ${text};
      padding: 4px 8px;
    " />
  `;

  // Send button
  composerHTML += `
    <button type="submit" id="n8n-send-btn" style="
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: ${surface};
      border: none;
      cursor: pointer;
      color: ${subText};
      transition: background 0.15s, color 0.15s;
      flex-shrink: 0;
      opacity: 0.5;
    ">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="19" x2="12" y2="5"/>
        <polyline points="5 12 12 5 19 12"/>
      </svg>
    </button>
  </form>
  `;

  composerArea.innerHTML = composerHTML;
  chatWindow.appendChild(composerArea);

  // Footer with disclaimer
  if (mergedConfig.composer?.disclaimer) {
    const footer = document.createElement('div');
    footer.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 8px ${padding};
      font-size: 10px;
      color: ${subText};
      opacity: 0.7;
    `;
    footer.textContent = mergedConfig.composer.disclaimer;
    chatWindow.appendChild(footer);
  }

  // Event handlers
  const form = composerArea.querySelector('#n8n-composer-form') as HTMLFormElement;
  const input = composerArea.querySelector('#n8n-chat-input') as HTMLInputElement;
  const sendBtn = composerArea.querySelector('#n8n-send-btn') as HTMLButtonElement;
  const attachBtn = composerArea.querySelector('#n8n-attach-btn') as HTMLButtonElement;
  const fileInput = composerArea.querySelector('#n8n-file-input') as HTMLInputElement;
  const clearBtn = headerIcons.querySelector('#n8n-clear-history') as HTMLButtonElement;

  // Update send button style based on input (theme-aware, matching preview)
  function updateSendButtonStyle() {
    const hasText = input.value.trim().length > 0;
    if (hasText) {
      sendBtn.style.background = hasAccent ? accentColor : (isDark ? '#e5e5e5' : '#171717');
      sendBtn.style.color = hasAccent ? '#ffffff' : (isDark ? '#171717' : '#ffffff');
      sendBtn.style.opacity = '1';
    } else {
      sendBtn.style.background = surface;
      sendBtn.style.color = subText;
      sendBtn.style.opacity = '0.5';
    }
  }

  input.addEventListener('input', updateSendButtonStyle, { signal });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    handleSendMessage();
  }, { signal });

  clearBtn.addEventListener('click', () => {
    messages.length = 0;
    messagesContainer.innerHTML = '';
    messagesContainer.style.display = 'none';
    startScreen.style.display = 'flex';
  }, { signal });

  if (attachBtn && fileInput) {
    attachBtn.addEventListener('click', () => fileInput.click(), { signal });
    fileInput.addEventListener('change', (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) selectedFiles = Array.from(files);
    }, { signal });
  }

  // Toggle chat window - with icon animation matching preview
  function toggleChat() {
    if (!isPopupEmbed) {
      return;
    }

    isOpen = !isOpen;
    if (isOpen) {
      // Show chat window with animation
      chatWindow.style.display = 'flex';
      chatWindow.style.opacity = '0';
      chatWindow.style.transform = 'scale(0.95) translateY(16px)';
      requestAnimationFrame(() => {
        chatWindow.style.transition = 'opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
        chatWindow.style.opacity = '1';
        chatWindow.style.transform = 'scale(1) translateY(0)';
      });

      // Animate icons - show X, hide message
      if (msgIconSvg) {
        msgIconSvg.style.opacity = '0';
        msgIconSvg.style.transform = 'rotate(90deg) scale(0.5)';
      }
      if (closeIconSvg) {
        closeIconSvg.style.opacity = '1';
        closeIconSvg.style.transform = 'rotate(0deg) scale(1)';
      }

      input.focus();
    } else {
      // Hide chat window with animation
      chatWindow.style.transition = 'opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
      chatWindow.style.opacity = '0';
      chatWindow.style.transform = 'scale(0.95) translateY(16px)';
      setTimeout(() => {
        chatWindow.style.display = 'none';
      }, 300);

      // Animate icons - show message, hide X
      if (msgIconSvg) {
        msgIconSvg.style.opacity = '1';
        msgIconSvg.style.transform = 'rotate(0deg) scale(1)';
      }
      if (closeIconSvg) {
        closeIconSvg.style.opacity = '0';
        closeIconSvg.style.transform = 'rotate(-90deg) scale(0.5)';
      }
    }
  }

  // Inline and portal modes are always visible (no launcher/toggle).
  if (!isPopupEmbed) {
    isOpen = true;
    chatWindow.style.display = 'flex';
    chatWindow.style.opacity = '1';
    chatWindow.style.transform = 'none';
    input.focus();
  }

  // Show messages view (hide start screen)
  function showMessagesView() {
    startScreen.style.display = 'none';
    messagesContainer.style.display = 'flex';
  }

  // Add message to UI
  function addMessage(role: 'user' | 'assistant', content: string, isLoading = false): Message {
    // Hide start screen, show messages
    if (messages.length === 0) {
      showMessagesView();
    }

    const message: Message = {
      id: `msg-${++messageIdCounter}`,
      role,
      content,
      timestamp: Date.now(),
    };
    messages.push(message);

    const messageEl = document.createElement('div');
    messageEl.id = message.id;
    messageEl.className = 'n8n-animate-in';
    messageEl.style.cssText = `
      display: flex;
      flex-direction: column;
      ${role === 'user' ? 'align-items: flex-end;' : 'align-items: flex-start;'}
    `;

    const bubbleEl = document.createElement('div');
    bubbleEl.className = 'n8n-message-content';
    bubbleEl.style.cssText = `
      max-width: 85%;
      padding: ${messagePadding};
      border-radius: ${elementRadius};
      line-height: 1.5;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      ${role === 'user'
        ? `background: ${userMsgBg}; color: ${userMsgText};`
        : `background: transparent; color: ${text};`}
    `;

    if (role === 'assistant') {
      if (isLoading) {
        bubbleEl.innerHTML = `
          <div class="n8n-typing-container">
            <div class="n8n-typing-dot"></div>
            <div class="n8n-typing-dot"></div>
            <div class="n8n-typing-dot"></div>
          </div>
        `;
      } else {
        bubbleEl.innerHTML = cachedRenderMarkdown(content);
      }
    } else {
      bubbleEl.textContent = content;
    }

    messageEl.appendChild(bubbleEl);
    messagesContainer.appendChild(messageEl);

    // Scroll so the top of the new message is visible (not the bottom)
    messageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

    return message;
  }

  // Update message content — scroll to top of message so user reads from start
  function updateMessage(messageId: string, content: string) {
    const messageEl = messagesContainer.querySelector(`#${messageId}`) as HTMLElement;
    if (!messageEl) return;

    const bubbleEl = messageEl.querySelector('.n8n-message-content');
    if (bubbleEl) {
      bubbleEl.innerHTML = cachedRenderMarkdown(content);
    }

    const message = messages.find(m => m.id === messageId);
    if (message) message.content = content;

    // Scroll to top of the updated message
    messageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Handle sending message
  async function handleSendMessage(textOverride?: string) {
    const text = textOverride || input.value.trim();
    if (!text) return;

    addMessage('user', text);
    input.value = '';
    updateSendButtonStyle();

    const assistantMessage = addMessage('assistant', '', true);

    try {
      await streamResponse(text, assistantMessage.id);
    } catch (error) {
      console.error('[N8n Chat Widget] Error sending message:', error);
      updateMessage(assistantMessage.id, 'Sorry, there was an error processing your message. Please try again.');
    }
  }

  // Capture page context
  function capturePageContext() {
    try {
      const url = new URL(window.location.href);
      return {
        pageUrl: window.location.href,
        pagePath: window.location.pathname,
        pageTitle: document.title,
        queryParams: Object.fromEntries(url.searchParams),
        domain: window.location.hostname,
      };
    } catch {
      return {
        pageUrl: window.location.href,
        pagePath: window.location.pathname,
        pageTitle: document.title,
        queryParams: {},
        domain: window.location.hostname,
      };
    }
  }

  // Encode file as base64
  async function encodeFile(file: File): Promise<FileAttachment> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64Data = result.split(',')[1];
        resolve({ name: file.name, type: file.type, data: base64Data, size: file.size });
      };
      reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
      reader.readAsDataURL(file);
    });
  }

  // Send message to relay
  async function streamResponse(userMessage: string, assistantMessageId: string) {
    const relayUrl = runtimeConfig.relay.relayUrl;
    const sessionId = sessionManager.getSessionId();

    try {
      const shouldCaptureContext = mergedConfig.connection?.captureContext !== false;

      let fileAttachments: FileAttachment[] | undefined;
      if (selectedFiles.length > 0 && mergedConfig.features.fileAttachmentsEnabled) {
        fileAttachments = await Promise.all(selectedFiles.map(encodeFile));
        selectedFiles = [];
        if (fileInput) fileInput.value = '';
      }

      const payload = buildRelayPayload(runtimeConfig, {
        message: userMessage,
        sessionId,
        context: shouldCaptureContext ? capturePageContext() : undefined,
        customContext: mergedConfig.connection?.customContext,
        extraInputs: mergedConfig.connection?.extraInputs,
        attachments: fileAttachments,
      });

      const response = await fetch(relayUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const assistantResponse = data.response || data.message || data.output || 'No response received';
      updateMessage(assistantMessageId, assistantResponse);

    } catch (error) {
      console.error('[N8n Chat Widget] Error sending message:', error);
      updateMessage(assistantMessageId, 'Sorry, there was an error connecting to the server. Please try again.');
      throw error;
    }
  }

  // Return cleanup handle for SPA environments
  return {
    destroy() {
      // Remove all event listeners at once
      ac.abort();
      // Disconnect ResizeObserver
      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      }
      // Remove DOM elements
      document.getElementById('n8n-chat-widget-styles')?.remove();
      document.getElementById('n8n-chat-widget-container')?.remove();
    },
  };
}
