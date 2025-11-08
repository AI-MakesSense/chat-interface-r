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

import { pgTable, uuid, varchar, text, boolean, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * Users Table
 * Stores user account information and authentication data
 */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 100 }),
  emailVerified: boolean('email_verified').default(false),
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
  passwordResetTokens: many(passwordResetTokens),
}));

export const licensesRelations = relations(licenses, ({ one, many }) => ({
  user: one(users, {
    fields: [licenses.userId],
    references: [users.id],
  }),
  widgetConfig: one(widgetConfigs),
  analyticsEvents: many(analyticsEvents),
}));

export const widgetConfigsRelations = relations(widgetConfigs, ({ one }) => ({
  license: one(licenses, {
    fields: [widgetConfigs.licenseId],
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

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type NewAnalyticsEvent = typeof analyticsEvents.$inferInsert;

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type NewPasswordResetToken = typeof passwordResetTokens.$inferInsert;
