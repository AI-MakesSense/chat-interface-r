'use client';

/**
 * Dashboard Page
 *
 * Protected main dashboard page showing user's licenses.
 * Module 2: Dashboard & License Management - Full implementation
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useLicenseStore } from '@/stores/license-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LicenseCard } from '@/components/dashboard/license-card';

/**
 * Dashboard page component
 *
 * Displays user licenses with management capabilities
 */
export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, logout, checkAuth } = useAuthStore();
  const { licenses, isLoading: licensesLoading, error, fetchLicenses, updateLicense, deleteLicense, clearError } = useLicenseStore();

  // Check authentication on mount
  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      checkAuth();
    }
  }, [isAuthenticated, authLoading, checkAuth]);

  // Fetch licenses when authenticated
  useEffect(() => {
    if (isAuthenticated && !licensesLoading && licenses.length === 0) {
      fetchLicenses().catch(console.error);
    }
  }, [isAuthenticated, licenses.length, licensesLoading, fetchLicenses]);

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Handle license update (domain changes)
  const handleLicenseUpdate = async (updatedLicense: any) => {
    try {
      await updateLicense(updatedLicense.id, { domains: updatedLicense.domains });
    } catch (error) {
      console.error('Failed to update license:', error);
    }
  };

  // Handle license deletion
  const handleLicenseDelete = async (licenseId: string) => {
    try {
      await deleteLicense(licenseId);
    } catch (error) {
      console.error('Failed to delete license:', error);
    }
  };

  // Loading state
  if (authLoading) {
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
          {/* Welcome Section */}
          <div>
            <h2 className="text-2xl font-bold mb-2">Welcome back{user.name ? `, ${user.name}` : ''}!</h2>
            <p className="text-muted-foreground">Manage your widget licenses and configurations</p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription className="flex items-center justify-between">
                <span>{error}</span>
                <Button variant="ghost" size="sm" onClick={clearError}>
                  Dismiss
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Licenses Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold">Your Licenses</h3>
                <p className="text-sm text-muted-foreground">
                  {licenses.length === 0 ? 'No licenses yet' : `${licenses.length} license${licenses.length === 1 ? '' : 's'}`}
                </p>
              </div>
              <Button onClick={() => router.push('/pricing')}>
                Purchase License
              </Button>
            </div>

            {licensesLoading ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">Loading licenses...</p>
                </CardContent>
              </Card>
            ) : licenses.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>No Licenses Found</CardTitle>
                  <CardDescription>
                    Purchase a license to start creating widgets
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Choose from Basic, Pro, or Agency tiers based on your needs:
                  </p>
                  <ul className="text-sm space-y-2 mb-4">
                    <li>• <strong>Basic</strong>: 1 domain, with branding ($29/year)</li>
                    <li>• <strong>Pro</strong>: 1 domain, white-label ($49/year)</li>
                    <li>• <strong>Agency</strong>: Unlimited domains, white-label ($149/year)</li>
                  </ul>
                  <Button onClick={() => router.push('/pricing')}>
                    View Pricing
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {licenses.map((license) => (
                  <LicenseCard
                    key={license.id}
                    license={license}
                    onUpdate={handleLicenseUpdate}
                    onDelete={handleLicenseDelete}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Module Status */}
          <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
            <CardHeader>
              <CardTitle className="text-green-700 dark:text-green-400">
                Phase 4 Modules 1-2: Complete
              </CardTitle>
              <CardDescription>
                Implementation status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-semibold mb-2">Module 1: Authentication UI ✓</p>
                  <ul className="space-y-1">
                    <li className="flex items-center gap-2">
                      <span className="text-green-600 dark:text-green-400">✓</span>
                      <span>Auth store & API client</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600 dark:text-green-400">✓</span>
                      <span>Login & signup forms</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600 dark:text-green-400">✓</span>
                      <span>Route protection middleware</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold mb-2">Module 2: License Management ✓</p>
                  <ul className="space-y-1">
                    <li className="flex items-center gap-2">
                      <span className="text-green-600 dark:text-green-400">✓</span>
                      <span>License store & display</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600 dark:text-green-400">✓</span>
                      <span>Domain management</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600 dark:text-green-400">✓</span>
                      <span>License card components</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
