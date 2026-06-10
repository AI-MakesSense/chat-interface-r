/**
 * Shared widget resolution + authorization.
 *
 * Single place where "may this domain use this widget?" is decided.
 * Used by: /api/w/[widgetKey]/config, /api/chat-relay, legacy compat adapter.
 *
 * Security hardening (vs prior per-route implementations):
 *   - localhost bypass is now gated on NODE_ENV !== 'production'.
 *     Previously the bypass was unconditional — an auth hole on prod.
 *   - Domain check is skipped ONLY when allowedDomains is empty (allow all)
 *     or when userTier is 'agency'.
 *   - First-party allowance is derived from NEXT_PUBLIC_APP_URL (server config),
 *     NOT from the request's Host header. Host is client-controlled on
 *     self-hosted deployments and trusting it allowed an allowedDomains bypass.
 */
import { getWidgetByKeyWithUser } from '@/lib/db/queries';
import { normalizeDomain } from '@/lib/license/domain';
import { TIER_LIMITS, normalizeUserTier } from '@/lib/license/tiers';
import type { Widget, User } from '@/lib/db/schema';

/** A widget joined with its owning user — the shape getWidgetByKeyWithUser returns. */
export type WidgetWithUser = Widget & { user: User };

export type ResolveResult =
  | { ok: true; widget: WidgetWithUser; user: User }
  | { ok: false; status: number; error: string };

/**
 * Returns true when the user's subscription is considered active.
 * Treats 'active' and 'past_due' as live; 'canceled' is live until
 * currentPeriodEnd; everything else is inactive.
 */
export function isSubscriptionActive(user: User): boolean {
  const status = user?.subscriptionStatus || 'active';
  if (status === 'active' || status === 'past_due') return true;
  if (status === 'canceled') {
    return Boolean(user?.currentPeriodEnd && new Date(user.currentPeriodEnd) > new Date());
  }
  return false;
}

/**
 * Resolve the platform's own first-party domain from NEXT_PUBLIC_APP_URL.
 * Returns null when unset/unparseable (no first-party allowance — fail closed).
 *
 * SECURITY: this must come from server config, NEVER from the request's Host
 * header — Host is client-controlled on self-hosted deployments, and trusting
 * it let any origin bypass allowedDomains by sending a matching Host.
 * Read per-call (not module-cached) so tests can vary the env.
 */
function getFirstPartyDomain(): string | null {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) return null;
  try {
    return normalizeDomain(new URL(appUrl).hostname) || null;
  } catch {
    return null;
  }
}

/**
 * Returns true when `requestDomain` is authorized to use the widget.
 *
 * Rules (short-circuit order):
 *  1. Agency tier → always allowed.
 *  2. No allowedDomains configured (empty array) → always allowed.
 *  3. First-party: request origin matches NEXT_PUBLIC_APP_URL's domain → allowed.
 *  4. localhost → allowed in development only (NODE_ENV !== 'production').
 *  5. allowedDomains list → exact match or subdomain suffix.
 */
export function isDomainAllowed(
  requestDomain: string,
  allowedDomains: string[],
  userTier: string
): boolean {
  if (TIER_LIMITS[normalizeUserTier(userTier)].unlimitedDomains || allowedDomains.length === 0) return true;

  const firstParty = getFirstPartyDomain();
  if (firstParty && requestDomain !== 'unknown' && requestDomain === firstParty) return true;

  // localhost bypass is only for non-production environments.
  // In production this gate is CLOSED to prevent embed-key abuse.
  if (requestDomain === 'localhost' && process.env.NODE_ENV !== 'production') return true;

  return allowedDomains.some((allowed) => {
    const a = normalizeDomain(allowed);
    return a === requestDomain || requestDomain.endsWith(`.${a}`);
  });
}

/**
 * Resolve and authorize a widget by its widgetKey + requesting domain.
 *
 * Returns { ok: true, widget, user } on success.
 * Returns { ok: false, status, error } on any failure.
 *
 * The caller is responsible for extracting requestDomain (normalized hostname)
 * from the Origin/Referer headers. Pass `null` to trigger the missing-origin
 * 403 guard.
 */
export async function resolveAuthorizedWidget(
  widgetKey: string,
  requestDomain: string | null
): Promise<ResolveResult> {
  if (!/^[A-Za-z0-9]{16}$/.test(widgetKey)) {
    return { ok: false, status: 404, error: 'Widget not found' };
  }

  const widget = await getWidgetByKeyWithUser(widgetKey);
  if (!widget) {
    return { ok: false, status: 404, error: 'Widget not found' };
  }

  if (widget.status !== 'active') {
    return { ok: false, status: 403, error: 'Widget is not active' };
  }

  const user = widget.user;
  if (!user || !isSubscriptionActive(user)) {
    return { ok: false, status: 403, error: 'Subscription is not active' };
  }

  if (!requestDomain) {
    return { ok: false, status: 403, error: 'Origin or referer header is required' };
  }

  const allowed = Array.isArray(widget.allowedDomains) ? widget.allowedDomains : [];
  if (!isDomainAllowed(requestDomain, allowed, user.tier || 'free')) {
    return { ok: false, status: 403, error: 'Domain not authorized for this widget' };
  }

  return { ok: true, widget, user };
}
