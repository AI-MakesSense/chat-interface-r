/**
 * Tier Entitlements
 *
 * Single source of truth for tier-based feature gating.
 * `users.tier` is the ONLY tier input for feature gating —
 * `licenses.tier` must never be consulted for entitlement decisions.
 *
 * Relationship with lib/widget-config/schema.ts normalizeTier:
 *   - normalizeUserTier (this file) maps any raw value → Tier ('free'|'basic'|'pro'|'agency').
 *     It includes 'free' and is used for entitlement/quota gating.
 *   - normalizeTier (schema.ts) maps to LicenseTier ('basic'|'pro'|'agency') — it collapses
 *     'free' and unknown values to 'basic'. It is used solely for config-schema validation
 *     (getSchemaForKind), not for quota or feature gating.
 *   Do NOT merge them; they serve different purposes.
 */

export type Tier = 'free' | 'basic' | 'pro' | 'agency';

export const TIER_LIMITS: Record<
  Tier,
  { maxWidgets: number; brandingRemovable: boolean; unlimitedDomains: boolean }
> = {
  // Limits match the deployed values in app/api/widgets/route.ts and
  // app/api/account/subscription/route.ts (free=3, basic=5, unlimited for pro/agency).
  free:   { maxWidgets: 3,        brandingRemovable: false, unlimitedDomains: false },
  basic:  { maxWidgets: 5,        brandingRemovable: false, unlimitedDomains: false },
  pro:    { maxWidgets: Infinity, brandingRemovable: true,  unlimitedDomains: false },
  agency: { maxWidgets: Infinity, brandingRemovable: true,  unlimitedDomains: true },
};

/**
 * Normalize any raw tier value (incl. null, undefined, or unknown strings) to a
 * valid Tier. Unknown values fall back to 'free' — the most restrictive tier.
 */
export function normalizeUserTier(raw: string | null | undefined): Tier {
  if (raw === 'basic' || raw === 'pro' || raw === 'agency') return raw;
  return 'free';
}

/**
 * Returns true when a user on the given tier may create one more widget.
 * Unknown/invalid tier strings are treated as 'free'.
 */
export function canCreateWidget(tier: string, currentCount: number): boolean {
  return currentCount < TIER_LIMITS[normalizeUserTier(tier)].maxWidgets;
}
