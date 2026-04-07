/**
 * Database Schema Definition
 *
 * Purpose: Defines all database tables and relationships for the N8n Widget Designer platform
 *
 * Tables:
 * - users: User accounts with authentication
 * - licenses: Widget licenses with domain restrictions
 * - widget_configs: Widget configuration storage (JSONB)
 * - analytics_events: Usage tracking (optional for MVP)
 */

import { pgTable, uuid, varchar, text, boolean, timestamp, integer, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * Users Table
 * Stores user account information and authentication data
 *
 * Schema v2.0: Subscription fields moved from licenses to users (account-level)
 */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 100 }),
  emailVerified: boolean('email_verified').default(false),

  // Subscription (Schema v2.0 - moved from licenses)
  tier: varchar('tier', { length: 20 }).default('free'), // 'free' | 'basic' | 'pro' | 'agency'
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
  subscriptionStatus: varchar('subscription_status', { length: 20 }).default('active'), // 'active' | 'canceled' | 'past_due'
  currentPeriodEnd: timestamp('current_period_end'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Licenses Table
 * Stores widget licenses with tier information and domain restrictions
 *
 * Tiers:
 * - basic: $29/year, 1 domain, with branding
 * - pro: $49/year, 1 domain, white-label
 * - agency: $149/year, unlimited domains, white-label
 */
export const licenses = pgTable('licenses', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  licenseKey: varchar('license_key', { length: 32 }).notNull().unique(), // 32-char hex string
  tier: varchar('tier', { length: 20 }).notNull(), // 'basic' | 'pro' | 'agency'
  domains: text('domains').array().notNull().default([]), // Array of allowed domains
  domainLimit: integer('domain_limit').notNull(), // 1 for basic/pro, -1 for agency (unlimited)
  widgetLimit: integer('widget_limit').notNull().default(1), // 1 for basic, 3 for pro, -1 for agency (unlimited)
  brandingEnabled: boolean('branding_enabled').default(true), // false for pro/agency
  status: varchar('status', { length: 20 }).default('active'), // 'active' | 'expired' | 'cancelled'
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Widget Configurations Table
 * Stores the full widget configuration as JSONB for flexibility
 *
 * Config structure includes:
 * - branding: logo, company name, welcome text, etc.
 * - style: theme, colors, position, typography
 * - connection: N8n webhook URL
 * - features: file attachments, allowed extensions, etc.
 */
export const widgetConfigs = pgTable('widget_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  licenseId: uuid('license_id').references(() => licenses.id, { onDelete: 'cascade' }).notNull(),
  config: jsonb('config').notNull(), // Full configuration object
  version: integer('version').default(1).notNull(), // Version tracking for config changes
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Widgets Table (Schema v2.0)
 * Stores widget instances with their configurations
 *
 * Schema v2.0 Changes:
 * - Direct user relationship (userId) - widgets belong directly to users
 * - widgetKey: 16-char alphanumeric key for embed URLs
 * - embedType: How widget is deployed (popup/inline/fullpage/portal)
 * - allowedDomains: Per-widget domain whitelist (optional)
 * - licenseId: Now optional (kept for backward compatibility)
 *
 * JSONB Config Structure:
 * - branding: Company name, logo, welcome text
 * - theme: Colors, fonts, position, size
 * - behavior: Auto-open, triggers, welcome message
 * - connection: N8n webhook URL, route
 * - features: File attachments, allowed extensions
 */
export const widgets = pgTable('widgets', {
  // Primary Key
  id: uuid('id').primaryKey().defaultRandom(),

  // Direct user relationship (Schema v2.0)
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),

  // Widget identification (Schema v2.0)
  widgetKey: varchar('widget_key', { length: 16 }).unique(), // 16-char alphanumeric for embed URLs

  // Core Fields
  name: varchar('name', { length: 100 }).notNull(), // User-friendly name ("Homepage Chat", "Support Widget")
  status: varchar('status', { length: 20 }).default('active').notNull(), // 'active' | 'paused' | 'deleted'
  widgetType: varchar('widget_type', { length: 20 }).default('n8n').notNull(), // 'n8n' | 'chatkit'

  // Embed type (Schema v2.0) - determines embed code format
  embedType: varchar('embed_type', { length: 20 }).default('popup'), // 'popup' | 'inline' | 'fullpage' | 'portal'

  // Configuration (JSONB for flexibility)
  config: jsonb('config').notNull(), // Full widget configuration object

  // Domain whitelist (Schema v2.0) - optional, empty = allow all
  allowedDomains: text('allowed_domains').array(),

  // Metadata
  version: integer('version').default(1).notNull(), // Increment on config updates
  deployedAt: timestamp('deployed_at'), // Last deployment timestamp (null if never deployed)

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),

  // Legacy: Keep for backward compatibility during migration
  licenseId: uuid('license_id').references(() => licenses.id, { onDelete: 'cascade' }),
}, (table) => ({
  // Indexes for performance
  widgetKeyIdx: index('widgets_widget_key_idx').on(table.widgetKey),
  userIdIdx: index('widgets_user_id_idx').on(table.userId),
  licenseIdIdx: index('widgets_license_id_idx').on(table.licenseId),
  statusIdx: index('widgets_status_idx').on(table.status),
  embedTypeIdx: index('widgets_embed_type_idx').on(table.embedType),
  // GIN index for JSONB queries
  configIdx: index('widgets_config_idx').using('gin', table.config),
}));

/**
 * Analytics Events Table (Optional for MVP)
 * Tracks widget usage and events for analytics
 */
export const analyticsEvents = pgTable('analytics_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  licenseId: uuid('license_id').references(() => licenses.id, { onDelete: 'cascade' }),
  eventType: varchar('event_type', { length: 50 }).notNull(), // 'widget_load', 'message_sent', etc.
  domain: varchar('domain', { length: 255 }),
  metadata: jsonb('metadata'), // Flexible event data
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Password Reset Tokens Table
 * Stores temporary tokens for password reset flow
 */
export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations (for Drizzle query convenience)
export const usersRelations = relations(users, ({ many }) => ({
  licenses: many(licenses),
  widgets: many(widgets), // Schema v2.0: Direct user → widgets relationship
  passwordResetTokens: many(passwordResetTokens),
}));

export const licensesRelations = relations(licenses, ({ one, many }) => ({
  user: one(users, {
    fields: [licenses.userId],
    references: [users.id],
  }),
  widgetConfig: one(widgetConfigs),
  widgets: many(widgets), // NEW: One license → many widgets
  analyticsEvents: many(analyticsEvents),
}));

export const widgetConfigsRelations = relations(widgetConfigs, ({ one }) => ({
  license: one(licenses, {
    fields: [widgetConfigs.licenseId],
    references: [licenses.id],
  }),
}));

export const widgetsRelations = relations(widgets, ({ one }) => ({
  // Schema v2.0: Direct user relationship
  user: one(users, {
    fields: [widgets.userId],
    references: [users.id],
  }),
  // Legacy: License relationship (for backward compatibility)
  license: one(licenses, {
    fields: [widgets.licenseId],
    references: [licenses.id],
  }),
}));

export const analyticsEventsRelations = relations(analyticsEvents, ({ one }) => ({
  license: one(licenses, {
    fields: [analyticsEvents.licenseId],
    references: [licenses.id],
  }),
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.userId],
    references: [users.id],
  }),
}));

// Type exports for use in application code
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type License = typeof licenses.$inferSelect;
export type NewLicense = typeof licenses.$inferInsert;

export type WidgetConfig = typeof widgetConfigs.$inferSelect;
export type NewWidgetConfig = typeof widgetConfigs.$inferInsert;

export type Widget = typeof widgets.$inferSelect;
export type NewWidget = typeof widgets.$inferInsert;

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type NewAnalyticsEvent = typeof analyticsEvents.$inferInsert;

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type NewPasswordResetToken = typeof passwordResetTokens.$inferInsert;
