/**
 * Admin Database Query Functions
 *
 * Purpose: Provides query functions for the admin panel
 * Conventions: Same as queries.ts — descriptive names, null for not found, focused queries
 */

import { eq, desc, sql, and, ilike, or, count } from 'drizzle-orm';
import { db } from './client';
import {
  users,
  widgets,
  licenses,
  invitations,
  activityLog,
  type User,
  type Invitation,
  type ActivityLogEntry,
} from './schema';

// ============================================================
// ACTIVITY LOG
// ============================================================

/**
 * Log a platform activity event (fire-and-forget)
 */
export async function logActivity(
  userId: string | null,
  action: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await db.insert(activityLog).values({
      userId,
      action,
      metadata: metadata ?? null,
    });
  } catch (error) {
    // Never throw — activity logging should never break the request
    console.error('[Admin] Failed to log activity:', error);
  }
}

/**
 * Get recent activity entries with user info
 */
export async function getRecentActivity(options: {
  limit?: number;
  offset?: number;
  action?: string;
} = {}): Promise<{ entries: (ActivityLogEntry & { userEmail?: string; userName?: string | null })[]; total: number }> {
  const limit = Math.min(options.limit || 50, 100);
  const offset = options.offset || 0;

  const conditions = options.action
    ? eq(activityLog.action, options.action)
    : undefined;

  const [entries, totalResult] = await Promise.all([
    db
      .select({
        id: activityLog.id,
        userId: activityLog.userId,
        action: activityLog.action,
        metadata: activityLog.metadata,
        createdAt: activityLog.createdAt,
        userEmail: users.email,
        userName: users.name,
      })
      .from(activityLog)
      .leftJoin(users, eq(activityLog.userId, users.id))
      .where(conditions)
      .orderBy(desc(activityLog.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(activityLog)
      .where(conditions),
  ]);

  return {
    entries: entries as (ActivityLogEntry & { userEmail?: string; userName?: string | null })[],
    total: totalResult[0]?.count || 0,
  };
}

// ============================================================
// INVITATIONS
// ============================================================

/**
 * Create a new invitation
 */
export async function createInvitation(data: {
  email?: string;
  code: string;
  type: 'email' | 'code';
  invitedBy: string;
  expiresAt: Date;
}): Promise<Invitation> {
  const [invitation] = await db
    .insert(invitations)
    .values({
      email: data.email?.toLowerCase() || null,
      code: data.code,
      type: data.type,
      invitedBy: data.invitedBy,
      expiresAt: data.expiresAt,
    })
    .returning();

  return invitation;
}

/**
 * Find invitation by code
 */
export async function getInvitationByCode(code: string): Promise<Invitation | null> {
  const [invitation] = await db
    .select()
    .from(invitations)
    .where(eq(invitations.code, code))
    .limit(1);

  return invitation || null;
}

/**
 * Get paginated invitations with inviter info
 */
export async function getInvitations(options: {
  page?: number;
  limit?: number;
  status?: string;
} = {}): Promise<{ invitations: (Invitation & { inviterEmail?: string })[]; total: number }> {
  const page = options.page || 1;
  const limit = Math.min(options.limit || 20, 100);
  const offset = (page - 1) * limit;

  const conditions = options.status
    ? eq(invitations.status, options.status)
    : undefined;

  const [rows, totalResult] = await Promise.all([
    db
      .select({
        id: invitations.id,
        email: invitations.email,
        code: invitations.code,
        type: invitations.type,
        status: invitations.status,
        invitedBy: invitations.invitedBy,
        acceptedBy: invitations.acceptedBy,
        expiresAt: invitations.expiresAt,
        createdAt: invitations.createdAt,
        inviterEmail: users.email,
      })
      .from(invitations)
      .leftJoin(users, eq(invitations.invitedBy, users.id))
      .where(conditions)
      .orderBy(desc(invitations.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(invitations)
      .where(conditions),
  ]);

  return {
    invitations: rows as (Invitation & { inviterEmail?: string })[],
    total: totalResult[0]?.count || 0,
  };
}

/**
 * Update invitation status
 */
export async function updateInvitationStatus(
  id: string,
  status: string,
  acceptedBy?: string
): Promise<Invitation | null> {
  const updateData: Record<string, unknown> = { status };
  if (acceptedBy) updateData.acceptedBy = acceptedBy;

  const [updated] = await db
    .update(invitations)
    .set(updateData)
    .where(eq(invitations.id, id))
    .returning();

  return updated || null;
}

/**
 * Delete an invitation
 */
export async function deleteInvitation(id: string): Promise<boolean> {
  const result = await db
    .delete(invitations)
    .where(eq(invitations.id, id))
    .returning();

  return result.length > 0;
}

// ============================================================
// PLATFORM STATS
// ============================================================

export interface PlatformStats {
  totalUsers: number;
  totalWidgets: number;
  activeWidgets: number;
  totalLicenses: number;
  activeLicenses: number;
  signupsToday: number;
  signupsThisWeek: number;
  signupsThisMonth: number;
  tierDistribution: { tier: string; count: number }[];
}

/**
 * Get platform-wide statistics
 */
export async function getPlatformStats(): Promise<PlatformStats> {
  const [
    totalUsersResult,
    totalWidgetsResult,
    activeWidgetsResult,
    totalLicensesResult,
    activeLicensesResult,
    signupsTodayResult,
    signupsWeekResult,
    signupsMonthResult,
    tierDist,
  ] = await Promise.all([
    db.select({ count: count() }).from(users),
    db.select({ count: count() }).from(widgets),
    db.select({ count: count() }).from(widgets).where(eq(widgets.status, 'active')),
    db.select({ count: count() }).from(licenses),
    db.select({ count: count() }).from(licenses).where(eq(licenses.status, 'active')),
    db.select({ count: count() }).from(users).where(sql`${users.createdAt} >= CURRENT_DATE`),
    db.select({ count: count() }).from(users).where(sql`${users.createdAt} >= CURRENT_DATE - INTERVAL '7 days'`),
    db.select({ count: count() }).from(users).where(sql`${users.createdAt} >= CURRENT_DATE - INTERVAL '30 days'`),
    db.select({ tier: users.tier, count: count() }).from(users).groupBy(users.tier),
  ]);

  return {
    totalUsers: totalUsersResult[0]?.count || 0,
    totalWidgets: totalWidgetsResult[0]?.count || 0,
    activeWidgets: activeWidgetsResult[0]?.count || 0,
    totalLicenses: totalLicensesResult[0]?.count || 0,
    activeLicenses: activeLicensesResult[0]?.count || 0,
    signupsToday: signupsTodayResult[0]?.count || 0,
    signupsThisWeek: signupsWeekResult[0]?.count || 0,
    signupsThisMonth: signupsMonthResult[0]?.count || 0,
    tierDistribution: tierDist.map(row => ({
      tier: row.tier || 'free',
      count: row.count,
    })),
  };
}

// ============================================================
// USER MANAGEMENT
// ============================================================

/**
 * Get paginated user list with search, filter, and sort
 */
export async function getAllUsers(options: {
  page?: number;
  limit?: number;
  search?: string;
  tier?: string;
  sort?: 'newest' | 'oldest' | 'name';
} = {}): Promise<{ users: (User & { widgetCount: number })[]; total: number }> {
  const page = options.page || 1;
  const limit = Math.min(options.limit || 20, 100);
  const offset = (page - 1) * limit;

  // Build conditions
  const conditions = [];
  if (options.search) {
    conditions.push(
      or(
        ilike(users.email, `%${options.search}%`),
        ilike(users.name, `%${options.search}%`)
      )
    );
  }
  if (options.tier) {
    conditions.push(eq(users.tier, options.tier));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Sort
  const orderBy = options.sort === 'oldest'
    ? users.createdAt
    : options.sort === 'name'
      ? users.name
      : desc(users.createdAt);

  // Query users with widget count subquery
  const [rows, totalResult] = await Promise.all([
    db
      .select({
        id: users.id,
        email: users.email,
        passwordHash: users.passwordHash,
        name: users.name,
        emailVerified: users.emailVerified,
        tier: users.tier,
        stripeCustomerId: users.stripeCustomerId,
        stripeSubscriptionId: users.stripeSubscriptionId,
        subscriptionStatus: users.subscriptionStatus,
        currentPeriodEnd: users.currentPeriodEnd,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        widgetCount: sql<number>`(SELECT count(*)::int FROM ${widgets} WHERE ${widgets.userId} = ${users.id} AND ${widgets.status} != 'deleted')`,
      })
      .from(users)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(users)
      .where(whereClause),
  ]);

  // Strip passwordHash from results
  const sanitized = rows.map(({ passwordHash: _, ...rest }) => rest) as (User & { widgetCount: number })[];

  return {
    users: sanitized,
    total: totalResult[0]?.count || 0,
  };
}

/**
 * Get single user with widget and license counts
 */
export async function getUserWithDetails(id: string): Promise<(User & { widgetCount: number; licenseCount: number }) | null> {
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      passwordHash: users.passwordHash,
      name: users.name,
      emailVerified: users.emailVerified,
      tier: users.tier,
      stripeCustomerId: users.stripeCustomerId,
      stripeSubscriptionId: users.stripeSubscriptionId,
      subscriptionStatus: users.subscriptionStatus,
      currentPeriodEnd: users.currentPeriodEnd,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      widgetCount: sql<number>`(SELECT count(*)::int FROM ${widgets} WHERE ${widgets.userId} = ${users.id} AND ${widgets.status} != 'deleted')`,
      licenseCount: sql<number>`(SELECT count(*)::int FROM ${licenses} WHERE ${licenses.userId} = ${users.id})`,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!row) return null;

  const { passwordHash: _, ...rest } = row;
  return rest as User & { widgetCount: number; licenseCount: number };
}

/**
 * Admin update user fields (tier, subscription status)
 */
export async function adminUpdateUser(
  id: string,
  data: { tier?: string; subscriptionStatus?: string }
): Promise<User | null> {
  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (data.tier) updateData.tier = data.tier;
  if (data.subscriptionStatus) updateData.subscriptionStatus = data.subscriptionStatus;

  const [updated] = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, id))
    .returning();

  return updated || null;
}

/**
 * Get widgets for a specific user (admin view)
 */
export async function getUserWidgets(userId: string): Promise<{ id: string; name: string; status: string; widgetType: string; embedType: string | null; createdAt: Date }[]> {
  return db
    .select({
      id: widgets.id,
      name: widgets.name,
      status: widgets.status,
      widgetType: widgets.widgetType,
      embedType: widgets.embedType,
      createdAt: widgets.createdAt,
    })
    .from(widgets)
    .where(and(eq(widgets.userId, userId), sql`${widgets.status} != 'deleted'`))
    .orderBy(desc(widgets.createdAt));
}
