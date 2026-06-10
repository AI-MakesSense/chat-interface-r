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
 */
import { getWidgetByKeyWithUser } from '@/lib/db/queries';
import { normalizeDomain } from '@/lib/license/domain';

export type ResolveResult =
  | { ok: true; widget: any; user: any }
  | { ok: false; status: number; error: string };

/**
 * Returns true when the user's subscription is considered active.
 * Treats 'active' and 'past_due' as live; 'canceled' is live until
 * currentPeriodEnd; everything else is inactive.
 */
export function isSubscriptionActive(user: any): boolean {
  const status = user?.subscriptionStatus || 'active';
  if (status === 'active' || status === 'past_due') return true;
  if (status === 'canceled') {
    return Boolean(user?.currentPeriodEnd && new Date(user.currentPeriodEnd) > new Date());
  }
  return false;
}

/**
 * Returns true when `requestDomain` is authorized to use the widget.
 *
 * Rules (short-circuit order):
 *  1. Agency tier → always allowed.
 *  2. No allowedDomains configured (empty array) → always allowed.
 *  3. First-party: request origin === server host → allowed.
 *  4. localhost → allowed in development only (NODE_ENV !== 'production').
 *  5. allowedDomains list → exact match or subdomain suffix.
 */
export function isDomainAllowed(
  requestDomain: string,
  allowedDomains: string[],
  userTier: string,
  requestHost: string
): boolean {
  if (userTier === 'agency' || allowedDomains.length === 0) return true;

  const normalizedHost = normalizeDomain((requestHost || '').split(':')[0] || '');
  const isFirstPartyRequest =
    requestDomain !== 'unknown' &&
    normalizedHost !== 'unknown' &&
    requestDomain === normalizedHost;

  if (isFirstPartyRequest) return true;

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
  requestDomain: string | null,
  requestHost: string
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
  if (!isDomainAllowed(requestDomain, allowed, user.tier || 'free', requestHost)) {
    return { ok: false, status: 403, error: 'Domain not authorized for this widget' };
  }

  return { ok: true, widget, user };
}
