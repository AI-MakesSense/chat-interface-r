/**
 * Account Store
 *
 * Zustand store for managing user subscription and account state.
 * Handles subscription tier, status, and upgrade flows.
 *
 * Schema v2.0: Subscription is now at the account level (users table),
 * not per-license.
 */

import { create } from 'zustand';

/**
 * Subscription tier levels
 */
export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'agency';

/**
 * Subscription status values
 */
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due';

/**
 * Subscription data structure
 */
export interface Subscription {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodEnd: string | null;
}

/**
 * Tier feature configuration
 */
export interface TierFeatures {
  widgetLimit: number; // -1 for unlimited
  embedTypes: ('popup' | 'inline' | 'fullpage' | 'portal')[];
  advancedStyling: boolean;
  whiteLabel: boolean;
  fileAttachments: boolean;
  customFonts: boolean;
  domainWhitelist: boolean;
  emailTranscripts: boolean;
  apiAccess: boolean;
  teamMembers: number;
  prioritySupport: boolean;
}

/**
 * Feature configuration by tier
 */
export const TIER_FEATURES: Record<SubscriptionTier, TierFeatures> = {
  free: {
    widgetLimit: 3,
    embedTypes: ['popup'],
    advancedStyling: false,
    whiteLabel: false,
    fileAttachments: false,
    customFonts: false,
    domainWhitelist: false,
    emailTranscripts: false,
    apiAccess: false,
    teamMembers: 1,
    prioritySupport: false,
  },
  basic: {
    widgetLimit: 5,
    embedTypes: ['popup', 'inline', 'fullpage', 'portal'],
    advancedStyling: false,
    whiteLabel: false,
    fileAttachments: true,
    customFonts: false,
    domainWhitelist: true,
    emailTranscripts: false,
    apiAccess: false,
    teamMembers: 1,
    prioritySupport: false,
  },
  pro: {
    widgetLimit: -1, // Unlimited
    embedTypes: ['popup', 'inline', 'fullpage', 'portal'],
    advancedStyling: true,
    whiteLabel: true,
    fileAttachments: true,
    customFonts: true,
    domainWhitelist: true,
    emailTranscripts: false,
    apiAccess: false,
    teamMembers: 1,
    prioritySupport: true,
  },
  agency: {
    widgetLimit: -1, // Unlimited
    embedTypes: ['popup', 'inline', 'fullpage', 'portal'],
    advancedStyling: true,
    whiteLabel: true,
    fileAttachments: true,
    customFonts: true,
    domainWhitelist: true,
    emailTranscripts: true,
    apiAccess: true,
    teamMembers: 5,
    prioritySupport: true,
  },
};

/**
 * Account store state interface
 */
interface AccountState {
  // State
  subscription: Subscription | null;
  isLoading: boolean;
  error: string | null;

  // Computed
  features: TierFeatures | null;

  // Actions
  fetchSubscription: () => Promise<void>;
  upgrade: (tier: SubscriptionTier) => Promise<string>; // Returns checkout URL
  cancel: () => Promise<void>;
  setSubscription: (subscription: Subscription) => void;
  clearError: () => void;

  // Feature checks
  canCreateWidget: (currentCount: number) => boolean;
  canUseEmbedType: (embedType: string) => boolean;
  hasFeature: (feature: keyof TierFeatures) => boolean;
}

/**
 * Default subscription for unauthenticated users
 */
const defaultSubscription: Subscription = {
  tier: 'free',
  status: 'active',
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  currentPeriodEnd: null,
};

/**
 * Account store
 */
export const useAccountStore = create<AccountState>((set, get) => ({
  // Initial state
  subscription: null,
  isLoading: false,
  error: null,
  features: null,

  /**
   * Fetch subscription from API
   */
  fetchSubscription: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch('/api/account/subscription', {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Not authenticated, use default subscription
          set({
            subscription: defaultSubscription,
            features: TIER_FEATURES.free,
            isLoading: false,
          });
          return;
        }
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch subscription');
      }

      const data = await response.json();
      const subscription = data.subscription as Subscription;

      set({
        subscription,
        features: TIER_FEATURES[subscription.tier],
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        subscription: defaultSubscription,
        features: TIER_FEATURES.free,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch subscription',
      });
    }
  },

  /**
   * Upgrade subscription
   * Returns Stripe checkout URL
   */
  upgrade: async (tier: SubscriptionTier) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch('/api/account/subscription/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tier }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upgrade subscription');
      }

      const data = await response.json();
      set({ isLoading: false });

      return data.checkoutUrl;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to upgrade subscription',
      });
      throw error;
    }
  },

  /**
   * Cancel subscription
   */
  cancel: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch('/api/account/subscription/cancel', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel subscription');
      }

      // Refresh subscription data
      await get().fetchSubscription();
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to cancel subscription',
      });
      throw error;
    }
  },

  /**
   * Set subscription directly (for SSR hydration)
   */
  setSubscription: (subscription: Subscription) => {
    set({
      subscription,
      features: TIER_FEATURES[subscription.tier],
    });
  },

  /**
   * Clear error state
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Check if user can create another widget
   */
  canCreateWidget: (currentCount: number) => {
    const { features } = get();
    if (!features) return false;
    if (features.widgetLimit === -1) return true; // Unlimited
    return currentCount < features.widgetLimit;
  },

  /**
   * Check if user can use a specific embed type
   */
  canUseEmbedType: (embedType: string) => {
    const { features } = get();
    if (!features) return false;
    return features.embedTypes.includes(embedType as any);
  },

  /**
   * Check if user has a specific feature
   */
  hasFeature: (feature: keyof TierFeatures) => {
    const { features } = get();
    if (!features) return false;
    const value = features[feature];
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (Array.isArray(value)) return value.length > 0;
    return false;
  },
}));
