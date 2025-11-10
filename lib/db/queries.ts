/**
 * Database Query Functions
 *
 * Purpose: Provides reusable, type-safe database query functions
 * Responsibility: Encapsulates common database operations
 *
 * Conventions:
 * - Use descriptive function names (getUserByEmail, not getUser)
 * - Return null for not found (don't throw)
 * - Use transactions for multi-step operations
 * - Keep queries focused (single responsibility)
 */

import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from './client';
import {
  users,
  licenses,
  widgets,
  widgetConfigs,
  analyticsEvents,
  passwordResetTokens,
  type User,
  type NewUser,
  type License,
  type NewLicense,
  type Widget,
  type NewWidget,
  type WidgetConfig,
  type NewWidgetConfig,
} from './schema';

// ============================================================
// USER QUERIES
// ============================================================

/**
 * Find user by email address
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  return user || null;
}

/**
 * Find user by ID
 */
export async function getUserById(id: string): Promise<User | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return user || null;
}

/**
 * Create a new user
 */
export async function createUser(data: NewUser): Promise<User> {
  const [user] = await db
    .insert(users)
    .values({
      ...data,
      email: data.email.toLowerCase(),
    })
    .returning();

  return user;
}

/**
 * Update user by ID
 */
export async function updateUser(
  id: string,
  data: Partial<Omit<User, 'id' | 'createdAt'>>
): Promise<User | null> {
  const [user] = await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();

  return user || null;
}

// ============================================================
// LICENSE QUERIES
// ============================================================

/**
 * Get all licenses for a user
 */
export async function getUserLicenses(userId: string): Promise<License[]> {
  return db
    .select()
    .from(licenses)
    .where(eq(licenses.userId, userId))
    .orderBy(desc(licenses.createdAt));
}

/**
 * Find license by ID
 */
export async function getLicenseById(id: string): Promise<License | null> {
  const [license] = await db
    .select()
    .from(licenses)
    .where(eq(licenses.id, id))
    .limit(1);

  return license || null;
}

/**
 * Find license by license key
 */
export async function getLicenseByKey(licenseKey: string): Promise<License | null> {
  const [license] = await db
    .select()
    .from(licenses)
    .where(eq(licenses.licenseKey, licenseKey))
    .limit(1);

  return license || null;
}

/**
 * Find license by Stripe subscription ID
 */
export async function getLicenseByStripeSubscriptionId(
  subscriptionId: string
): Promise<License | null> {
  const [license] = await db
    .select()
    .from(licenses)
    .where(eq(licenses.stripeSubscriptionId, subscriptionId))
    .limit(1);

  return license || null;
}

/**
 * Create a new license
 */
export async function createLicense(data: NewLicense): Promise<License> {
  const [license] = await db
    .insert(licenses)
    .values(data)
    .returning();

  return license;
}

/**
 * Update license domains
 */
export async function updateLicenseDomains(
  id: string,
  domains: string[]
): Promise<License | null> {
  const [license] = await db
    .update(licenses)
    .set({ domains, updatedAt: new Date() })
    .where(eq(licenses.id, id))
    .returning();

  return license || null;
}

/**
 * Update license status
 */
export async function updateLicenseStatus(
  id: string,
  status: 'active' | 'expired' | 'cancelled'
): Promise<License | null> {
  const [license] = await db
    .update(licenses)
    .set({ status, updatedAt: new Date() })
    .where(eq(licenses.id, id))
    .returning();

  return license || null;
}

/**
 * Delete license by ID
 */
export async function deleteLicense(id: string): Promise<boolean> {
  const result = await db
    .delete(licenses)
    .where(eq(licenses.id, id))
    .returning();

  return result.length > 0;
}

// ============================================================
// WIDGET CONFIG QUERIES
// ============================================================

/**
 * Get widget config by license ID
 */
export async function getConfigByLicenseId(licenseId: string): Promise<WidgetConfig | null> {
  const [config] = await db
    .select()
    .from(widgetConfigs)
    .where(eq(widgetConfigs.licenseId, licenseId))
    .limit(1);

  return config || null;
}

/**
 * Save or update widget configuration
 * Creates new config if doesn't exist, updates if it does
 */
export async function saveWidgetConfig(
  licenseId: string,
  config: any
): Promise<WidgetConfig> {
  // Check if config exists
  const existing = await getConfigByLicenseId(licenseId);

  if (existing) {
    // Update existing config
    const [updated] = await db
      .update(widgetConfigs)
      .set({
        config,
        version: existing.version + 1,
        updatedAt: new Date(),
      })
      .where(eq(widgetConfigs.licenseId, licenseId))
      .returning();

    return updated;
  } else {
    // Create new config
    const [newConfig] = await db
      .insert(widgetConfigs)
      .values({
        licenseId,
        config,
        version: 1,
      })
      .returning();

    return newConfig;
  }
}

/**
 * Update widget configuration
 */
export async function updateConfig(
  licenseId: string,
  config: any
): Promise<WidgetConfig | null> {
  const [updated] = await db
    .update(widgetConfigs)
    .set({
      config,
      updatedAt: new Date(),
    })
    .where(eq(widgetConfigs.licenseId, licenseId))
    .returning();

  return updated || null;
}

// ============================================================
// PASSWORD RESET TOKEN QUERIES
// ============================================================

/**
 * Create password reset token
 */
export async function createPasswordResetToken(
  userId: string,
  token: string,
  expiresAt: Date
) {
  const [resetToken] = await db
    .insert(passwordResetTokens)
    .values({
      userId,
      token,
      expiresAt,
    })
    .returning();

  return resetToken;
}

/**
 * Find valid password reset token
 */
export async function getValidPasswordResetToken(token: string) {
  const [resetToken] = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.token, token),
        // Token not expired
        // Note: This is a simplified check, you may want to use SQL functions
      )
    )
    .limit(1);

  if (!resetToken) return null;

  // Check if expired
  if (resetToken.expiresAt < new Date()) {
    return null;
  }

  return resetToken;
}

/**
 * Delete password reset token (after use)
 */
export async function deletePasswordResetToken(token: string) {
  await db
    .delete(passwordResetTokens)
    .where(eq(passwordResetTokens.token, token));
}

// ============================================================
// ANALYTICS QUERIES (Optional for MVP)
// ============================================================

/**
 * Log an analytics event
 */
export async function logAnalyticsEvent(
  licenseId: string,
  eventType: string,
  domain: string,
  metadata?: any
) {
  await db.insert(analyticsEvents).values({
    licenseId,
    eventType,
    domain,
    metadata,
  });
}

// ============================================================
// WIDGET QUERIES
// ============================================================

/**
 * Type for widget with joined license data
 */
export type WidgetWithLicense = Widget & {
  license: License;
};

/**
 * Get widget by ID
 * Returns widget including soft-deleted ones (status='deleted')
 * Throws error for invalid UUID format
 */
export async function getWidgetById(id: string): Promise<Widget | null> {
  const [widget] = await db
    .select()
    .from(widgets)
    .where(eq(widgets.id, id))
    .limit(1);

  return widget || null;
}

/**
 * Get widget with license data (joined query)
 * Returns widget with nested license object
 * Throws error for invalid UUID format
 */
export async function getWidgetWithLicense(id: string): Promise<WidgetWithLicense | null> {
  const result = await db
    .select()
    .from(widgets)
    .innerJoin(licenses, eq(widgets.licenseId, licenses.id))
    .where(eq(widgets.id, id))
    .limit(1);

  if (!result[0]) return null;

  return {
    ...result[0].widgets,
    license: result[0].licenses,
  };
}

/**
 * Create a new widget
 * Sets default status='active' and version=1 if not provided
 * Sets timestamps using client-side time for consistency
 */
export async function createWidget(data: {
  licenseId: string;
  name: string;
  config: any;
  status?: string;
  version?: number;
  deployedAt?: Date | null;
}): Promise<Widget> {
  const now = new Date();
  const [widget] = await db
    .insert(widgets)
    .values({
      licenseId: data.licenseId,
      name: data.name,
      config: data.config,
      status: data.status || 'active',
      version: data.version || 1,
      deployedAt: data.deployedAt || null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return widget;
}

/**
 * Update widget fields (partial update)
 * Returns null if widget doesn't exist
 * Never updates createdAt, always updates updatedAt
 */
export async function updateWidget(
  id: string,
  data: {
    name?: string;
    config?: any;
    status?: string;
    version?: number;
    deployedAt?: Date | null;
  }
): Promise<Widget | null> {
  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.config !== undefined) updateData.config = data.config;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.version !== undefined) updateData.version = data.version;
  if (data.deployedAt !== undefined) updateData.deployedAt = data.deployedAt;

  // Always update timestamp using database server time
  updateData.updatedAt = sql`NOW()`;

  const [widget] = await db
    .update(widgets)
    .set(updateData)
    .where(eq(widgets.id, id))
    .returning();

  return widget || null;
}

/**
 * Soft delete a widget (sets status='deleted')
 * Preserves all other data (name, config, etc.)
 * Returns null if widget doesn't exist
 */
export async function deleteWidget(id: string): Promise<Widget | null> {
  const [widget] = await db
    .update(widgets)
    .set({
      status: 'deleted',
      updatedAt: sql`NOW()`,
    })
    .where(eq(widgets.id, id))
    .returning();

  return widget || null;
}
