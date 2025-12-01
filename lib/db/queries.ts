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

import { eq, ne, and, desc, sql } from 'drizzle-orm';
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
  widgetType?: string;
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
      widgetType: data.widgetType || 'n8n',
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
    widgetType?: string;
    version?: number;
    deployedAt?: Date | null;
  }
): Promise<Widget | null> {
  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.config !== undefined) updateData.config = data.config;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.widgetType !== undefined) updateData.widgetType = data.widgetType;
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

// ============================================================
// LICENSE-RELATED WIDGET QUERIES
// ============================================================

/**
 * Get all widgets for a specific license
 * Excludes deleted widgets by default
 * Returns widgets ordered by newest first
 */
export async function getWidgetsByLicenseId(
  licenseId: string,
  includeDeleted = false
): Promise<Widget[]> {
  // Build conditions array
  const conditions = [eq(widgets.licenseId, licenseId)];

  // Exclude deleted by default
  if (!includeDeleted) {
    conditions.push(ne(widgets.status, 'deleted'));
  }

  // Query with conditions, order by newest first
  return db
    .select()
    .from(widgets)
    .where(and(...conditions))
    .orderBy(desc(widgets.createdAt));
}

/**
 * Get all widgets for a user across all their licenses
 * Returns widgets with license information attached
 * Excludes deleted widgets by default
 */
export async function getWidgetsByUserId(
  userId: string,
  includeDeleted = false,
  licenseId?: string
): Promise<Array<Widget & { license: License }>> {
  // Build conditions array
  const conditions = [eq(licenses.userId, userId)];

  // Optional: filter by specific license
  if (licenseId) {
    conditions.push(eq(widgets.licenseId, licenseId));
  }

  // Exclude deleted by default
  if (!includeDeleted) {
    conditions.push(ne(widgets.status, 'deleted'));
  }

  // JOIN widgets + licenses, filter, order
  const results = await db
    .select()
    .from(widgets)
    .innerJoin(licenses, eq(widgets.licenseId, licenses.id))
    .where(and(...conditions))
    .orderBy(desc(widgets.createdAt));

  // Transform results to Widget & { license: License }
  return results.map(r => ({
    ...r.widgets,
    license: r.licenses,
    licenseKey: r.licenses.licenseKey, // Explicitly add licenseKey for frontend convenience
  }));
}

/**
 * Get count of active widgets for a license
 * Excludes soft-deleted widgets (status='deleted')
 * Returns integer count
 */
export async function getActiveWidgetCount(licenseId: string): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(widgets)
    .where(
      and(
        eq(widgets.licenseId, licenseId),
        ne(widgets.status, 'deleted')
      )
    );

  return result[0]?.count || 0;
}

/**
 * Get license with active widget count attached
 * Returns null if license doesn't exist
 * Uses existing functions for consistency
 */
export async function getLicenseWithWidgetCount(
  id: string
): Promise<(License & { widgetCount: number }) | null> {
  // Get license using existing function
  const license = await getLicenseById(id);
  if (!license) return null;

  // Get widget count using existing function
  const count = await getActiveWidgetCount(id);

  // Return license with widgetCount attached
  return {
    ...license,
    widgetCount: count,
  };
}

// ============================================================
// WIDGET KEY QUERIES (Schema v2.0)
// ============================================================

/**
 * Get widget by widgetKey (new 16-char alphanumeric key)
 * Returns widget with user info for authorization
 * Returns null if widget not found or inactive
 */
export async function getWidgetByKey(widgetKey: string): Promise<Widget | null> {
  const [widget] = await db
    .select()
    .from(widgets)
    .where(
      and(
        eq(widgets.widgetKey, widgetKey),
        ne(widgets.status, 'deleted')
      )
    )
    .limit(1);

  return widget || null;
}

/**
 * Get widget by widgetKey with user data (joined query)
 * Returns widget with nested user object for tier checking
 */
export async function getWidgetByKeyWithUser(widgetKey: string): Promise<(Widget & { user: User }) | null> {
  const result = await db
    .select()
    .from(widgets)
    .innerJoin(users, eq(widgets.userId, users.id))
    .where(
      and(
        eq(widgets.widgetKey, widgetKey),
        ne(widgets.status, 'deleted')
      )
    )
    .limit(1);

  if (!result[0]) return null;

  return {
    ...result[0].widgets,
    user: result[0].users,
  };
}

// ============================================================
// DEPLOYMENT & PAGINATION QUERIES
// ============================================================

/**
 * Deploy a widget by setting its deployment timestamp and activating it
 * Sets deployedAt to current time ONLY if currently null (idempotent)
 * Always sets status to 'active'
 * Returns null if widget doesn't exist
 * Uses database server time to match schema defaults and updateWidget pattern
 */
export async function deployWidget(id: string): Promise<Widget | null> {
  const [widget] = await db
    .update(widgets)
    .set({
      deployedAt: sql`COALESCE(deployed_at, NOW())`, // Only set if currently null
      status: 'active',
      updatedAt: sql`NOW()`,
    })
    .where(eq(widgets.id, id))
    .returning();

  return widget || null;
}

/**
 * Get paginated widgets for a user with total count
 * Supports pagination, filtering by license, and including deleted widgets
 * Returns widgets with license information and total count
 */
export async function getWidgetsPaginated(
  userId: string,
  options: {
    page?: number;
    limit?: number;
    licenseId?: string;
    includeDeleted?: boolean;
  } = {}
): Promise<{
  widgets: Array<Widget & { license: License }>;
  total: number;
}> {
  // Parse and validate pagination params
  const page = options.page || 1;
  const limit = Math.min(options.limit || 20, 100); // Max 100
  const offset = (page - 1) * limit;

  // Build filter conditions
  const conditions = [eq(licenses.userId, userId)];

  if (options.licenseId) {
    conditions.push(eq(widgets.licenseId, options.licenseId));
  }

  if (!options.includeDeleted) {
    conditions.push(ne(widgets.status, 'deleted'));
  }

  // Get total count (first query)
  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(widgets)
    .innerJoin(licenses, eq(widgets.licenseId, licenses.id))
    .where(and(...conditions));

  const total = countResult?.count || 0;

  // Get paginated results (second query)
  const results = await db
    .select()
    .from(widgets)
    .innerJoin(licenses, eq(widgets.licenseId, licenses.id))
    .where(and(...conditions))
    .orderBy(desc(widgets.createdAt))
    .limit(limit)
    .offset(offset);

  // Transform results to Widget & { license: License }
  const widgetsWithLicenses = results.map(r => ({
    ...r.widgets,
    license: r.licenses,
    licenseKey: r.licenses.licenseKey, // Explicitly add licenseKey for frontend convenience
  }));

  return { widgets: widgetsWithLicenses, total };
}

/**
 * Get all user licenses with widget count attached
 * Uses existing functions for consistency
 * Returns licenses with widgetCount property
 */
export async function getUserLicensesWithWidgetCounts(
  userId: string
): Promise<Array<License & { widgetCount: number }>> {
  // Get all licenses for user (reuse existing function)
  const userLicenses = await getUserLicenses(userId);

  // For each license, get widget count (parallel execution)
  const licensesWithCounts = await Promise.all(
    userLicenses.map(async (license) => {
      const count = await getActiveWidgetCount(license.id);
      return { ...license, widgetCount: count };
    })
  );

  return licensesWithCounts;
}

// ============================================================
// SCHEMA v2.0 QUERIES - User-Direct Widget Operations
// ============================================================

/**
 * Get count of active widgets directly for a user (Schema v2.0)
 * Excludes soft-deleted widgets (status='deleted')
 * Returns integer count
 */
export async function getActiveWidgetCountForUser(userId: string): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(widgets)
    .where(
      and(
        eq(widgets.userId, userId),
        ne(widgets.status, 'deleted')
      )
    );

  return result[0]?.count || 0;
}

/**
 * Create a new widget with direct user relationship (Schema v2.0)
 * Generates widgetKey if not provided
 * Sets default status='active' and version=1 if not provided
 */
export async function createWidgetV2(data: {
  userId: string;
  name: string;
  config: any;
  widgetKey?: string;
  embedType?: string;
  allowedDomains?: string[];
  status?: string;
  widgetType?: string;
  version?: number;
  deployedAt?: Date | null;
  // Legacy: optional licenseId for backward compatibility
  licenseId?: string;
}): Promise<Widget> {
  const now = new Date();

  // Generate widgetKey if not provided (16-char alphanumeric)
  const widgetKey = data.widgetKey || generateWidgetKey();

  const [widget] = await db
    .insert(widgets)
    .values({
      userId: data.userId,
      licenseId: data.licenseId || null, // Legacy support
      name: data.name,
      config: data.config,
      widgetKey,
      embedType: data.embedType || 'popup',
      allowedDomains: data.allowedDomains || null,
      status: data.status || 'active',
      widgetType: data.widgetType || 'n8n',
      version: data.version || 1,
      deployedAt: data.deployedAt || null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return widget;
}

/**
 * Get paginated widgets for a user directly (Schema v2.0)
 * Does not require license join
 * Returns widgets with total count
 */
export async function getWidgetsPaginatedV2(
  userId: string,
  options: {
    page?: number;
    limit?: number;
    includeDeleted?: boolean;
    embedType?: string;
  } = {}
): Promise<{
  widgets: Widget[];
  total: number;
}> {
  // Parse and validate pagination params
  const page = options.page || 1;
  const limit = Math.min(options.limit || 20, 100); // Max 100
  const offset = (page - 1) * limit;

  // Build filter conditions
  const conditions = [eq(widgets.userId, userId)];

  if (!options.includeDeleted) {
    conditions.push(ne(widgets.status, 'deleted'));
  }

  if (options.embedType) {
    conditions.push(eq(widgets.embedType, options.embedType));
  }

  // Get total count (first query)
  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(widgets)
    .where(and(...conditions));

  const total = countResult?.count || 0;

  // Get paginated results (second query)
  const results = await db
    .select()
    .from(widgets)
    .where(and(...conditions))
    .orderBy(desc(widgets.createdAt))
    .limit(limit)
    .offset(offset);

  return { widgets: results, total };
}

/**
 * Generate a 16-character alphanumeric widget key
 * Uses crypto-safe random generation
 */
function generateWidgetKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomValues = new Uint8Array(16);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < 16; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
}
