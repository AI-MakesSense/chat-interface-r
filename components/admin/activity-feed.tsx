'use client';

import { UserPlus, LogIn, Plus, Trash2, Settings, Mail, Shield } from 'lucide-react';
import type { ActivityEntry } from '@/stores/admin-store';

const ACTION_CONFIG: Record<string, { icon: typeof UserPlus; label: string; color: string; bg: string }> = {
  user_signup: { icon: UserPlus, label: 'signed up', color: 'text-green-400', bg: 'bg-green-500/10' },
  user_login: { icon: LogIn, label: 'logged in', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  widget_created: { icon: Plus, label: 'created a widget', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  widget_deleted: { icon: Trash2, label: 'deleted a widget', color: 'text-red-400', bg: 'bg-red-500/10' },
  admin_update_user: { icon: Settings, label: 'updated a user', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  invitation_created: { icon: Mail, label: 'created an invitation', color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  invitation_revoked: { icon: Shield, label: 'revoked an invitation', color: 'text-red-400', bg: 'bg-red-500/10' },
};

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function ActivityFeed({ entries }: { entries: ActivityEntry[] }) {
  return (
    <div className="space-y-1">
      {entries.map((entry) => {
        const config = ACTION_CONFIG[entry.action] || {
          icon: Settings,
          label: entry.action,
          color: 'text-zinc-400',
          bg: 'bg-zinc-500/10',
        };
        const Icon = config.icon;
        const meta = entry.metadata as Record<string, unknown> | null;

        return (
          <div key={entry.id} className="flex items-start gap-3 py-3 border-b border-zinc-800/50 last:border-0">
            <div className={`h-8 w-8 rounded-full ${config.bg} flex items-center justify-center mt-0.5 shrink-0`}>
              <Icon className={`h-4 w-4 ${config.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white">
                <span className="font-medium">{entry.userEmail || 'System'}</span>{' '}
                <span className="text-zinc-400">{config.label}</span>
                {!!meta?.name && <span className="text-zinc-400"> &ldquo;{String(meta.name)}&rdquo;</span>}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">{formatRelativeTime(entry.createdAt)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
