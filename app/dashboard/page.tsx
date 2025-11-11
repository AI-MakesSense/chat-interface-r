'use client';

/**
 * Dashboard Page
 *
 * Protected main dashboard page showing user's widgets and licenses.
 * This is a placeholder for Module 1 - full dashboard functionality
 * will be implemented in Module 2 (Dashboard & License Management).
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Dashboard page component
 *
 * Displays basic user information and a logout button.
 * Full dashboard features (widget cards, license management) coming in Module 2.
 */
export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout, checkAuth } = useAuthStore();

  // Check authentication on mount
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      checkAuth();
    }
  }, [isAuthenticated, isLoading, checkAuth]);

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Not authenticated (shouldn't happen with middleware, but fallback)
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground mb-4">You must be logged in to view this page.</p>
            <Button onClick={() => router.push('/auth/login')}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Dashboard content
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">N8n Widget Designer</h1>
            <p className="text-sm text-muted-foreground">Dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">{user.name || user.email}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          {/* Welcome Card */}
          <Card>
            <CardHeader>
              <CardTitle>Welcome to N8n Widget Designer</CardTitle>
              <CardDescription>
                You're successfully logged in! This is a placeholder dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><strong>User ID:</strong> {user.id}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Name:</strong> {user.name || 'Not set'}</p>
                <p><strong>Email Verified:</strong> {user.emailVerified ? 'Yes' : 'No'}</p>
                <p><strong>Created:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>

          {/* Coming Soon Cards */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Your Widgets</CardTitle>
                <CardDescription>
                  Manage your chat widgets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Full widget management coming in Module 2
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Licenses</CardTitle>
                <CardDescription>
                  View and manage your licenses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Full license management coming in Module 2
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Module 1 Status */}
          <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
            <CardHeader>
              <CardTitle className="text-green-700 dark:text-green-400">
                Module 1: Authentication UI - Complete
              </CardTitle>
              <CardDescription>
                Phase 4 Module 1 implementation status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                  <span>Auth store with Zustand</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                  <span>Auth API client</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                  <span>Login form with validation</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                  <span>Signup form with validation</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                  <span>Route protection middleware</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                  <span>Auth pages (login, signup)</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                  <span>Dashboard page (placeholder)</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
