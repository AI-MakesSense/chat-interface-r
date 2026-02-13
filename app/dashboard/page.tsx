'use client';

/**
 * Dashboard Page
 *
 * Protected main dashboard page showing user's widgets and subscription.
 * Schema v2.0: Uses account-level subscription instead of per-license model.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useAccountStore } from '@/stores/account-store';
import { useWidgetStore } from '@/stores/widget-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SubscriptionCard } from '@/components/dashboard/subscription-card';
import { WidgetList } from '@/components/dashboard/widget-list';
import { CreateWidgetModal } from '@/components/dashboard/create-widget-modal';
import { Plus, LayoutGrid, CreditCard, LogOut, User, MessageSquare } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { BRAND_NAME } from '@/lib/brand';

/**
 * Dashboard page component
 */
export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, logout, checkAuth } = useAuthStore();
  const { subscription, isLoading: subscriptionLoading, error: subscriptionError, fetchSubscription, upgrade, clearError: clearSubscriptionError } = useAccountStore();
  const { widgets, isLoading: widgetsLoading, error: widgetError, fetchWidgets, deleteWidget, clearError: clearWidgetError } = useWidgetStore();

  // Check authentication on mount
  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      checkAuth();
    }
  }, [isAuthenticated, authLoading, checkAuth]);

  // Fetch data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchSubscription().catch(console.error);
      fetchWidgets().catch(console.error);
    }
  }, [isAuthenticated, fetchSubscription, fetchWidgets]);

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Handle subscription upgrade
  const handleUpgrade = async (tier: 'free' | 'basic' | 'pro' | 'agency') => {
    if (tier === 'free') return; // Can't upgrade to free
    try {
      const checkoutUrl = await upgrade(tier);
      if (checkoutUrl) {
        // In production, redirect to Stripe checkout
        // For development, just refresh subscription
        await fetchSubscription();
      }
    } catch (error) {
      console.error('Failed to upgrade:', error);
    }
  };

  // Handle manage subscription
  const handleManageSubscription = () => {
    // In production, redirect to Stripe customer portal
    router.push('/pricing');
  };

  // Handle widget deletion
  const handleWidgetDelete = async (widgetId: string) => {
    try {
      await deleteWidget(widgetId);
    } catch (error) {
      console.error('Failed to delete widget:', error);
    }
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <p className="text-zinc-400">Loading...</p>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Card className="bg-zinc-900 border-zinc-800 text-white">
          <CardContent className="pt-6">
            <p className="text-zinc-400 mb-4">You must be logged in to view this page.</p>
            <Button onClick={() => router.push('/auth/login')} className="bg-indigo-600 hover:bg-indigo-700">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const error = subscriptionError || widgetError;
  const clearError = () => {
    if (subscriptionError) clearSubscriptionError();
    if (widgetError) clearWidgetError();
  };

  // Dashboard content
  return (
    <div className="min-h-screen bg-black text-white selection:bg-indigo-500/30">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">{BRAND_NAME}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">{user.name || 'User'}</p>
                <p className="text-xs text-zinc-500">{user.email}</p>
              </div>
              <Avatar className="h-8 w-8 border border-white/10">
                <AvatarFallback className="bg-zinc-800 text-zinc-400">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-zinc-400 hover:text-white hover:bg-white/5"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-10">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-zinc-400">Manage your chat interfaces and deployments</p>
          </div>
          <CreateWidgetModal>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-lg shadow-indigo-500/20">
              <Plus className="h-4 w-4" />
              Create Interface
            </Button>
          </CreateWidgetModal>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="bg-red-900/20 border-red-900/50 text-red-200">
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button variant="ghost" size="sm" onClick={clearError} className="hover:bg-red-900/30">
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Widgets Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-indigo-400" />
              Your Interfaces
            </h2>
          </div>

          {widgetsLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : widgets.length === 0 ? (
            <Card className="bg-white/5 border-white/10 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-6 ring-1 ring-white/10">
                  <MessageSquare className="h-8 w-8 text-indigo-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">No interfaces yet</h3>
                <p className="text-zinc-400 max-w-sm mb-8">
                  Create your first chat interface to start engaging with your users.
                </p>
                <CreateWidgetModal>
                  <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                    <Plus className="h-4 w-4" />
                    Create Your First Interface
                  </Button>
                </CreateWidgetModal>
              </CardContent>
            </Card>
          ) : (
            <WidgetList widgets={widgets} onDelete={handleWidgetDelete} />
          )}
        </section>

        {/* Subscription Section - Schema v2.0 */}
        <section className="space-y-6 pt-8 border-t border-white/5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-purple-400" />
              Subscription
            </h2>
          </div>

          {subscriptionLoading ? (
            <div className="h-32 rounded-xl bg-white/5 animate-pulse" />
          ) : subscription ? (
            <div className="max-w-md">
              <SubscriptionCard
                subscription={subscription}
                usage={{ widgetsUsed: widgets.length, widgetsLimit: subscription.tier === 'free' ? 3 : subscription.tier === 'basic' ? 5 : -1 }}
                onUpgrade={handleUpgrade}
                onManage={handleManageSubscription}
              />
            </div>
          ) : (
            <Card className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border-indigo-500/20">
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <h3 className="font-semibold text-indigo-300 mb-1">Upgrade to Pro</h3>
                  <p className="text-sm text-zinc-400">Unlock white-labeling and custom domains for your interfaces.</p>
                </div>
                <Button onClick={() => router.push('/pricing')} variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-0">
                  View Plans
                </Button>
              </CardContent>
            </Card>
          )}
        </section>
      </main>
    </div>
  );
}
