'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useAdminStore } from '@/stores/admin-store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, MessageSquare, CreditCard, TrendingUp, ArrowRight, UserPlus, LogIn, Plus, Trash2 } from 'lucide-react';
import { ActivityFeed } from '@/components/admin/activity-feed';

const STAT_CARDS = [
  { key: 'totalUsers', label: 'Total Users', icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  { key: 'totalWidgets', label: 'Total Widgets', icon: MessageSquare, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { key: 'activeWidgets', label: 'Active Widgets', icon: CreditCard, color: 'text-green-400', bg: 'bg-green-500/10' },
  { key: 'signupsThisMonth', label: 'Signups (30d)', icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-500/10' },
] as const;

const TIER_COLORS: Record<string, string> = {
  free: 'bg-zinc-700 text-zinc-300',
  basic: 'bg-blue-500/20 text-blue-400',
  pro: 'bg-purple-500/20 text-purple-400',
  agency: 'bg-amber-500/20 text-amber-400',
};

export default function AdminDashboard() {
  const { stats, statsLoading, fetchStats, activity, activityLoading, fetchActivity } = useAdminStore();

  useEffect(() => {
    fetchStats();
    fetchActivity({ limit: 10 });
  }, [fetchStats, fetchActivity]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
          Admin Overview
        </h1>
        <p className="text-zinc-400 mt-1">Platform statistics and recent activity</p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsLoading
          ? [1, 2, 3, 4].map(i => (
              <div key={i} className="h-28 rounded-xl bg-white/5 animate-pulse" />
            ))
          : STAT_CARDS.map(({ key, label, icon: Icon, color, bg }) => (
              <Card key={key} className="bg-zinc-900 border-zinc-800">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-zinc-400">{label}</p>
                      <p className="text-3xl font-bold text-white mt-1">
                        {stats ? stats[key as keyof typeof stats] as number : 0}
                      </p>
                    </div>
                    <div className={`h-12 w-12 rounded-xl ${bg} flex items-center justify-center`}>
                      <Icon className={`h-6 w-6 ${color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
        }
      </div>

      {/* Tier Distribution */}
      {stats && stats.tierDistribution.length > 0 && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <h3 className="text-sm font-medium text-zinc-400 mb-4">Tier Distribution</h3>
            <div className="flex flex-wrap gap-3">
              {stats.tierDistribution.map(({ tier, count }) => (
                <div key={tier} className="flex items-center gap-2">
                  <Badge className={TIER_COLORS[tier] || 'bg-zinc-700 text-zinc-300'}>{tier}</Badge>
                  <span className="text-white font-medium">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
          <Link href="/admin/activity" className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            {activityLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-12 rounded-lg bg-white/5 animate-pulse" />)}
              </div>
            ) : activity.length > 0 ? (
              <ActivityFeed entries={activity} />
            ) : (
              <p className="text-zinc-500 text-sm text-center py-8">No activity yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
