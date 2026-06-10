function parseBooleanFlag(value: string | undefined): boolean {
  if (!value) return false;

  const normalized = value.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
}

/**
 * Client-visible ChatKit toggle.
 * Default is false to keep the app focused on n8n.
 */
export const CHATKIT_UI_ENABLED = parseBooleanFlag(process.env.NEXT_PUBLIC_ENABLE_CHATKIT);

/**
 * Server-side ChatKit toggle.
 * ENABLE_CHATKIT takes precedence; falls back to NEXT_PUBLIC_ENABLE_CHATKIT.
 * Default is false.
 */
export const CHATKIT_SERVER_ENABLED = parseBooleanFlag(
  process.env.ENABLE_CHATKIT ?? process.env.NEXT_PUBLIC_ENABLE_CHATKIT
);

/**
 * Billing is intentionally disabled until Stripe integration ships.
 * Tiers are admin-managed out-of-band.
 *
 * When false (default), all subscription mutation endpoints return 501 so no
 * code path can silently upgrade a user's tier without real payment.
 */
export const BILLING_ENABLED = parseBooleanFlag(process.env.BILLING_ENABLED);
