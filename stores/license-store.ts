/**
 * License Store
 *
 * Zustand store for managing license state throughout the application.
 * Handles fetching, updating, and caching user licenses.
 *
 * Features:
 * - License list management
 * - CRUD operations on licenses
 * - Domain management
 * - Loading and error states
 * - Automatic refresh on mutations
 */

import { create } from 'zustand';

/**
 * License tier types
 */
export type LicenseTier = 'basic' | 'pro' | 'agency';

/**
 * License status types
 */
export type LicenseStatus = 'active' | 'expired' | 'cancelled';

/**
 * License object from API
 */
export interface License {
  id: string;
  userId: string;
  licenseKey: string;
  tier: LicenseTier;
  status: LicenseStatus;
  domains: string[];
  domainLimit: number;
  brandingEnabled: boolean;
  widgetLimit: number | null;
  stripeSubscriptionId: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * License update payload
 */
export interface LicenseUpdateData {
  domains?: string[];
}

/**
 * License store state interface
 */
interface LicenseState {
  // State
  licenses: License[];
  selectedLicense: License | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchLicenses: () => Promise<void>;
  getLicense: (id: string) => Promise<License>;
  updateLicense: (id: string, data: LicenseUpdateData) => Promise<License>;
  deleteLicense: (id: string) => Promise<void>;
  selectLicense: (license: License | null) => void;
  clearError: () => void;
}

/**
 * License store
 *
 * Manages license state with automatic API synchronization
 */
export const useLicenseStore = create<LicenseState>((set, get) => ({
  // Initial state
  licenses: [],
  selectedLicense: null,
  isLoading: false,
  error: null,

  /**
   * Fetch all licenses for current user
   *
   * Calls GET /api/licenses and updates state
   */
  fetchLicenses: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch('/api/licenses', {
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch licenses');
      }

      const data = await response.json();

      set({
        licenses: data.licenses || [],
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        licenses: [],
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch licenses',
      });
      throw error;
    }
  },

  /**
   * Get single license by ID
   *
   * Calls GET /api/licenses/:id
   *
   * @param id - License ID
   * @returns License object
   */
  getLicense: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`/api/licenses/${id}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch license');
      }

      const data = await response.json();

      set({
        isLoading: false,
        error: null,
      });

      return data.license;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch license',
      });
      throw error;
    }
  },

  /**
   * Update license (currently only domains)
   *
   * Calls PUT /api/licenses/:id
   *
   * @param id - License ID
   * @param data - Update payload
   * @returns Updated license
   */
  updateLicense: async (id: string, data: LicenseUpdateData) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`/api/licenses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update license');
      }

      const responseData = await response.json();
      const updatedLicense = responseData.license;

      // Update license in local state
      set((state) => ({
        licenses: state.licenses.map((license) =>
          license.id === id ? updatedLicense : license
        ),
        selectedLicense:
          state.selectedLicense?.id === id
            ? updatedLicense
            : state.selectedLicense,
        isLoading: false,
        error: null,
      }));

      return updatedLicense;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update license',
      });
      throw error;
    }
  },

  /**
   * Delete (cancel) license
   *
   * Calls DELETE /api/licenses/:id
   * Cancels Stripe subscription if active
   *
   * @param id - License ID
   */
  deleteLicense: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`/api/licenses/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete license');
      }

      // Remove license from local state
      set((state) => ({
        licenses: state.licenses.filter((license) => license.id !== id),
        selectedLicense:
          state.selectedLicense?.id === id ? null : state.selectedLicense,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to delete license',
      });
      throw error;
    }
  },

  /**
   * Select a license for viewing/editing
   *
   * @param license - License to select (or null to clear)
   */
  selectLicense: (license: License | null) => {
    set({ selectedLicense: license });
  },

  /**
   * Clear error state
   */
  clearError: () => {
    set({ error: null });
  },
}));
