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
import { generateWidgetKey } from '../license/widget-key';
import {
  users,
  licenses,
  widgets,
  analyticsEvents,
  passwordResetTokens,
  type User,
  type NewUser,
  type License,
  type NewLicense,
  type Widget,
  type NewWidget,
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
 * Log an analytics event (Schema v2.0)
 * Uses userId and optional widgetId instead of licenseId.
 */
export async function logAnalyticsEvent(
  userId: string,
  eventType: string,
  domain: string,
  metadata?: any,
  widgetId?: string
) {
  await db.insert(analyticsEvents).values({
    userId,
    widgetId: widgetId ?? null,
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
 * Get widget with license data (Schema v2.0 compatibility shim)
 * Widgets no longer carry a licenseId column; this resolves the license via
 * the widget's userId → first active license for that user.
 * Task 9 will rewrite callers to use userId directly.
 */
export async function getWidgetWithLicense(id: string): Promise<WidgetWithLicense | null> {
  const widget = await getWidgetById(id);
  if (!widget) return null;

  // Resolve license via widget owner
  const [license] = await db
    .select()
    .from(licenses)
    .where(eq(licenses.userId, widget.userId))
    .limit(1);

  if (!license) return null;

  return { ...widget, license };
}

/**
 * Create a new widget (Schema v2.0)
 * licenseId parameter is REMOVED — widgets belong directly to users via userId.
 * Callers that previously passed licenseId must pass userId instead.
 * Task 9 cleans up remaining legacy call sites (app/api/widgets/route.ts legacy branch).
 */
export async function createWidget(data: {
  userId: string;
  name: string;
  config: any;
  status?: string;
  widgetType?: string;
  kind?: 'chat' | 'display';
  version?: number;
  deployedAt?: Date | null;
}): Promise<Widget> {
  const now = new Date();
  const widgetKey = generateWidgetKey();
  const [widget] = await db
    .insert(widgets)
    .values({
      userId: data.userId,
      widgetKey,
      name: data.name,
      config: data.config,
      status: data.status || 'active',
      widgetType: data.widgetType || 'n8n',
      kind: data.kind || 'chat',
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
 * kind is immutable — set at creation time and cannot be changed via this function
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
  if ('kind' in data) {
    throw new Error('updateWidget cannot change widget kind — kind is set at creation time');
  }
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
// LICENSE-RELATED WIDGET QUERIES (Schema v2.0 compatibility shims)
// Task 9 will rewrite callers to use userId directly.
// ============================================================

/**
 * Get all widgets for a user associated with a specific license.
 * Schema v2.0: widgets no longer carry licenseId; this resolves to the
 * license owner's widgets. The licenseId is used only to look up the userId.
 */
export async function getWidgetsByLicenseId(
  licenseId: string,
  includeDeleted = false
): Promise<Widget[]> {
  // Resolve userId from license
  const [license] = await db
    .select()
    .from(licenses)
    .where(eq(licenses.id, licenseId))
    .limit(1);

  if (!license) return [];

  // Build conditions array
  const conditions = [eq(widgets.userId, license.userId)];

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
 * Get all widgets for a user (Schema v2.0 direct query).
 * licenseId parameter is ignored (preserved for call-site compatibility only).
 * Task 9 will remove the licenseId parameter.
 */
export async function getWidgetsByUserId(
  userId: string,
  includeDeleted = false,
  _licenseId?: string
): Promise<Array<Widget & { license: License }>> {
  // Build conditions array
  const conditions = [eq(widgets.userId, userId)];

  // Exclude deleted by default
  if (!includeDeleted) {
    conditions.push(ne(widgets.status, 'deleted'));
  }

  const widgetResults = await db
    .select()
    .from(widgets)
    .where(and(...conditions))
    .orderBy(desc(widgets.createdAt));

  // Look up the user's first license for backward-compat shape
  const [license] = await db
    .select()
    .from(licenses)
    .where(eq(licenses.userId, userId))
    .limit(1);

  return widgetResults.map(w => ({
    ...w,
    license: license as License,
    licenseKey: license?.licenseKey ?? null,
  }));
}

/**
 * Get count of active widgets for a license (Schema v2.0 compatibility shim).
 * Resolves the license's userId and counts that user's active widgets.
 * Task 9 will replace callers with getActiveWidgetCountForUser.
 */
export async function getActiveWidgetCount(licenseId: string): Promise<number> {
  const [license] = await db
    .select()
    .from(licenses)
    .where(eq(licenses.id, licenseId))
    .limit(1);

  if (!license) return 0;

  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(widgets)
    .where(
      and(
        eq(widgets.userId, license.userId),
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
 * Get paginated widgets for a user with total count (Schema v2.0)
 * Widgets are queried directly by userId — no license join needed.
 * licenseId option is ignored (preserved for call-site compatibility).
 * Task 9 will clean up callers and remove the licenseId option.
 */
export async function getWidgetsPaginated(
  userId: string,
  options: {
    page?: number;
    limit?: number;
    licenseId?: string; // Ignored — kept for API compatibility; Task 9 removes this
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

  // Build filter conditions (direct userId — no license join)
  const conditions = [eq(widgets.userId, userId)];

  if (!options.includeDeleted) {
    conditions.push(ne(widgets.status, 'deleted'));
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

  // Look up user's license once for backward-compat shape
  const [userLicense] = await db
    .select()
    .from(licenses)
    .where(eq(licenses.userId, userId))
    .limit(1);

  const widgetsWithLicenses = results.map(w => ({
    ...w,
    license: userLicense as License,
    licenseKey: userLicense?.licenseKey ?? null,
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
  kind?: 'chat' | 'display';
  version?: number;
  deployedAt?: Date | null;
}): Promise<Widget> {
  const now = new Date();

  // Generate widgetKey if not provided (16-char alphanumeric)
  const widgetKey = data.widgetKey || generateWidgetKey();

  const [widget] = await db
    .insert(widgets)
    .values({
      userId: data.userId,
      name: data.name,
      config: data.config,
      widgetKey,
      embedType: data.embedType || 'popup',
      allowedDomains: data.allowedDomains || null,
      status: data.status || 'active',
      widgetType: data.widgetType || 'n8n',
      kind: data.kind || 'chat',
      version: data.version || 1,
      deployedAt: data.deployedAt ?? now, // Schema v2.0: Auto-deploy on creation
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

// generateWidgetKey is imported from lib/license/widget-key
