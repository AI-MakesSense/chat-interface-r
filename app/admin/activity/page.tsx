'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAdminStore } from '@/stores/admin-store';
import { ActivityFeed } from '@/components/admin/activity-feed';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const ACTIONS = [
  { value: '', label: 'All' },
  { value: 'user_signup', label: 'Signups' },
  { value: 'user_login', label: 'Logins' },
  { value: 'widget_created', label: 'Widget Created' },
  { value: 'widget_deleted', label: 'Widget Deleted' },
  { value: 'admin_update_user', label: 'Admin Updates' },
  { value: 'invitation_created', label: 'Invitations' },
];

export default function AdminActivityPage() {
  const { activity, activityTotal, activityLoading, fetchActivity } = useAdminStore();
  const [action, setAction] = useState('');
  const [limit] = useState(50);

  const load = useCallback(() => {
    fetchActivity({ limit, action: action || undefined });
  }, [fetchActivity, limit, action]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
          Activity Log
        </h1>
        <p className="text-zinc-400 mt-1">{activityTotal} total events</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-1">
        {ACTIONS.map(a => (
          <Button
            key={a.value}
            variant="ghost"
            size="sm"
            onClick={() => setAction(a.value)}
            className={`text-xs ${
              action === a.value
                ? 'bg-indigo-500/10 text-indigo-400'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {a.label}
          </Button>
        ))}
      </div>

      {/* Activity Feed */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="pt-6">
          {activityLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-12 rounded-lg bg-white/5 animate-pulse" />)}
            </div>
          ) : activity.length > 0 ? (
            <ActivityFeed entries={activity} />
          ) : (
            <p className="text-zinc-500 text-sm text-center py-12">No activity found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
