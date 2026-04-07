'use client';

import { create } from 'zustand';

export interface AdminStats {
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

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  tier: string | null;
  subscriptionStatus: string | null;
  widgetCount: number;
  createdAt: string;
}

export interface AdminInvitation {
  id: string;
  email: string | null;
  code: string;
  type: string;
  status: string;
  invitedBy: string | null;
  inviterEmail?: string;
  acceptedBy: string | null;
  expiresAt: string;
  createdAt: string;
}

export interface ActivityEntry {
  id: string;
  userId: string | null;
  userEmail?: string;
  userName?: string | null;
  action: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

interface AdminState {
  stats: AdminStats | null;
  statsLoading: boolean;
  fetchStats: () => Promise<void>;

  users: AdminUser[];
  usersTotal: number;
  usersLoading: boolean;
  fetchUsers: (options?: { page?: number; search?: string; tier?: string; sort?: string }) => Promise<void>;
  updateUser: (id: string, data: { tier?: string; subscriptionStatus?: string }) => Promise<void>;

  invitations: AdminInvitation[];
  invitationsTotal: number;
  invitationsLoading: boolean;
  fetchInvitations: (options?: { page?: number; status?: string }) => Promise<void>;
  createInvitation: (data: { type: 'email' | 'code'; email?: string; expiresInDays?: number }) => Promise<{ invitation: AdminInvitation; signupUrl: string }>;
  revokeInvitation: (id: string) => Promise<void>;

  activity: ActivityEntry[];
  activityTotal: number;
  activityLoading: boolean;
  fetchActivity: (options?: { limit?: number; offset?: number; action?: string }) => Promise<void>;

  error: string | null;
  clearError: () => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  stats: null,
  statsLoading: false,

  users: [],
  usersTotal: 0,
  usersLoading: false,

  invitations: [],
  invitationsTotal: 0,
  invitationsLoading: false,

  activity: [],
  activityTotal: 0,
  activityLoading: false,

  error: null,
  clearError: () => set({ error: null }),

  fetchStats: async () => {
    set({ statsLoading: true, error: null });
    try {
      const res = await fetch('/api/admin/stats', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch stats');
      const data = await res.json();
      set({ stats: data.stats, statsLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Unknown error', statsLoading: false });
    }
  },

  fetchUsers: async (options = {}) => {
    set({ usersLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (options.page) params.set('page', String(options.page));
      if (options.search) params.set('search', options.search);
      if (options.tier) params.set('tier', options.tier);
      if (options.sort) params.set('sort', options.sort);

      const res = await fetch(`/api/admin/users?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      set({ users: data.users, usersTotal: data.pagination.total, usersLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Unknown error', usersLoading: false });
    }
  },

  updateUser: async (id, data) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update user');
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Unknown error' });
      throw err;
    }
  },

  fetchInvitations: async (options = {}) => {
    set({ invitationsLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (options.page) params.set('page', String(options.page));
      if (options.status) params.set('status', options.status);

      const res = await fetch(`/api/admin/invitations?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch invitations');
      const data = await res.json();
      set({ invitations: data.invitations, invitationsTotal: data.pagination.total, invitationsLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Unknown error', invitationsLoading: false });
    }
  },

  createInvitation: async (data) => {
    try {
      const res = await fetch('/api/admin/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create invitation');
      }
      return await res.json();
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Unknown error' });
      throw err;
    }
  },

  revokeInvitation: async (id) => {
    try {
      const res = await fetch(`/api/admin/invitations/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to revoke invitation');
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Unknown error' });
      throw err;
    }
  },

  fetchActivity: async (options = {}) => {
    set({ activityLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (options.limit) params.set('limit', String(options.limit));
      if (options.offset) params.set('offset', String(options.offset));
      if (options.action) params.set('action', options.action);

      const res = await fetch(`/api/admin/activity?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch activity');
      const data = await res.json();
      set({ activity: data.entries, activityTotal: data.total, activityLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Unknown error', activityLoading: false });
    }
  },
}));
