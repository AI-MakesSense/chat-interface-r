'use client';

/**
 * Subscription Card Component
 *
 * Displays the user's current subscription tier, status, and features.
 * Shows upgrade options for lower tiers.
 *
 * Schema v2.0: Subscription is now at the user/account level, not per-license.
 */

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Zap, Building2, Sparkles, Check, ArrowUpRight } from 'lucide-react';

export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'agency';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due';

export interface Subscription {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  currentPeriodEnd?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
}

export interface SubscriptionUsage {
  widgetsUsed: number;
  widgetsLimit: number;
}

interface SubscriptionCardProps {
  subscription: Subscription;
  usage?: SubscriptionUsage;
  onUpgrade?: (tier: SubscriptionTier) => void;
  onManage?: () => void;
}

/**
 * Tier configuration with labels, colors, and features
 */
const TIER_CONFIG: Record<SubscriptionTier, {
  label: string;
  price: string;
  icon: React.ElementType;
  color: string;
  badgeVariant: 'default' | 'secondary' | 'outline';
  features: string[];
  widgetLimit: number;
}> = {
  free: {
    label: 'Free',
    price: '$0',
    icon: Sparkles,
    color: 'text-gray-500',
    badgeVariant: 'secondary',
    features: [
      '3 widgets',
      'Popup embed only',
      'Basic styling',
      'Community support',
    ],
    widgetLimit: 3,
  },
  basic: {
    label: 'Basic',
    price: '$29/year',
    icon: Zap,
    color: 'text-blue-500',
    badgeVariant: 'default',
    features: [
      '5 widgets',
      'All embed types',
      'File attachments',
      'Domain whitelist',
      'Email support',
    ],
    widgetLimit: 5,
  },
  pro: {
    label: 'Pro',
    price: '$49/year',
    icon: Crown,
    color: 'text-purple-500',
    badgeVariant: 'default',
    features: [
      'Unlimited widgets',
      'All embed types',
      'Advanced styling',
      'White-label',
      'Custom fonts',
      'Priority support',
    ],
    widgetLimit: -1,
  },
  agency: {
    label: 'Agency',
    price: '$149/year',
    icon: Building2,
    color: 'text-green-500',
    badgeVariant: 'default',
    features: [
      'Unlimited widgets',
      'All embed types',
      'Advanced styling',
      'White-label',
      'Custom fonts',
      'Email transcripts',
      'API access',
      '5 team members',
      'Priority support',
    ],
    widgetLimit: -1,
  },
};

/**
 * Status display configuration
 */
function getStatusInfo(status: SubscriptionStatus): {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
} {
  switch (status) {
    case 'active':
      return { label: 'Active', variant: 'default' };
    case 'canceled':
      return { label: 'Canceled', variant: 'outline' };
    case 'past_due':
      return { label: 'Past Due', variant: 'destructive' };
  }
}

export function SubscriptionCard({
  subscription,
  usage,
  onUpgrade,
  onManage,
}: SubscriptionCardProps) {
  const tierConfig = TIER_CONFIG[subscription.tier];
  const statusInfo = getStatusInfo(subscription.status);
  const TierIcon = tierConfig.icon;

  const canUpgrade = subscription.tier !== 'agency' && subscription.status === 'active';
  const isPaid = subscription.tier !== 'free';

  // Calculate usage percentage
  const usagePercent = usage && tierConfig.widgetLimit > 0
    ? Math.min((usage.widgetsUsed / tierConfig.widgetLimit) * 100, 100)
    : 0;

  return (
    <Card className="bg-zinc-900 border-zinc-800 text-white">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-white/5 ${tierConfig.color}`}>
              <TierIcon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2 text-white">
                {tierConfig.label} Plan
                <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
              </CardTitle>
              <CardDescription className="mt-1 text-zinc-400">
                {tierConfig.price}
                {subscription.currentPeriodEnd && subscription.status === 'active' && (
                  <span className="text-muted-foreground">
                    {' · '}Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Usage Stats */}
        {usage && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">Widgets Used</span>
              <span className="font-medium text-white">
                {usage.widgetsUsed} / {tierConfig.widgetLimit === -1 ? '∞' : tierConfig.widgetLimit}
              </span>
            </div>
            {tierConfig.widgetLimit > 0 && (
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-all"
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* Features List */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-zinc-400">Included Features</p>
          <ul className="grid grid-cols-1 gap-1.5 text-sm">
            {tierConfig.features.slice(0, 5).map((feature, index) => (
              <li key={index} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
            {tierConfig.features.length > 5 && (
              <li className="text-muted-foreground text-xs pl-6">
                +{tierConfig.features.length - 5} more features
              </li>
            )}
          </ul>
        </div>

        {/* Past Due Warning */}
        {subscription.status === 'past_due' && (
          <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-100 dark:border-red-900">
            <p className="text-sm text-red-800 dark:text-red-200">
              <strong>Payment Required:</strong> Please update your payment method to continue using premium features.
            </p>
          </div>
        )}

        {/* Canceled Notice */}
        {subscription.status === 'canceled' && subscription.currentPeriodEnd && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-100 dark:border-amber-900">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Subscription Canceled:</strong> You'll have access until{' '}
              {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2">
        {canUpgrade && onUpgrade && (
          <Button
            variant="default"
            size="sm"
            className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
            onClick={() => {
              // Determine next tier
              const nextTier = subscription.tier === 'free' ? 'basic'
                : subscription.tier === 'basic' ? 'pro'
                : 'agency';
              onUpgrade(nextTier);
            }}
          >
            <ArrowUpRight className="h-4 w-4" />
            Upgrade
          </Button>
        )}

        {isPaid && onManage && (
          <Button
            variant="outline"
            size="sm"
            onClick={onManage}
            className="border-zinc-700 text-zinc-300 hover:bg-white/5 hover:text-white"
          >
            Manage Subscription
          </Button>
        )}

        {!isPaid && onUpgrade && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onUpgrade('basic')}
            className="bg-white/10 text-white hover:bg-white/20 border-0"
          >
            View Plans
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
