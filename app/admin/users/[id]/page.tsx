'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAdminStore } from '@/stores/admin-store';
import { ChevronLeft, Save } from 'lucide-react';

const TIERS = ['free', 'basic', 'pro', 'agency'];
const STATUSES = ['active', 'canceled', 'past_due'];

const TIER_COLORS: Record<string, string> = {
  free: 'bg-zinc-700 text-zinc-300',
  basic: 'bg-blue-500/20 text-blue-400',
  pro: 'bg-purple-500/20 text-purple-400',
  agency: 'bg-amber-500/20 text-amber-400',
};

interface UserDetail {
  id: string;
  email: string;
  name: string | null;
  tier: string | null;
  subscriptionStatus: string | null;
  widgetCount: number;
  licenseCount: number;
  createdAt: string;
}

interface UserWidget {
  id: string;
  name: string;
  status: string;
  widgetType: string;
  embedType: string | null;
  createdAt: string;
}

export default function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { updateUser } = useAdminStore();

  const [user, setUser] = useState<UserDetail | null>(null);
  const [widgets, setWidgets] = useState<UserWidget[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editTier, setEditTier] = useState('');
  const [editStatus, setEditStatus] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/admin/users/${id}`, { credentials: 'include' });
        if (!res.ok) { router.replace('/admin/users'); return; }
        const data = await res.json();
        setUser(data.user);
        setWidgets(data.widgets || []);
        setEditTier(data.user.tier || 'free');
        setEditStatus(data.user.subscriptionStatus || 'active');
      } catch {
        router.replace('/admin/users');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, router]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateUser(user.id, { tier: editTier, subscriptionStatus: editStatus });
      setUser({ ...user, tier: editTier, subscriptionStatus: editStatus });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-white/5 animate-pulse rounded" />
        <div className="h-48 bg-white/5 animate-pulse rounded-xl" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/users">
          <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white gap-1">
            <ChevronLeft className="h-4 w-4" /> Users
          </Button>
        </Link>
      </div>

      {/* User Info */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="pt-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">{user.name || user.email}</h1>
              <p className="text-zinc-400 mt-1">{user.email}</p>
              <p className="text-zinc-500 text-sm mt-1">Joined {new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={TIER_COLORS[user.tier || 'free']}>{user.tier || 'free'}</Badge>
              <span className="text-zinc-500 text-sm">{user.widgetCount} widgets</span>
              <span className="text-zinc-500 text-sm">{user.licenseCount} licenses</span>
            </div>
          </div>

          {/* Edit Controls */}
          <div className="border-t border-zinc-800 pt-4">
            <h3 className="text-sm font-medium text-zinc-400 mb-3">Edit User</h3>
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Tier</label>
                <select
                  value={editTier}
                  onChange={e => setEditTier(e.target.value)}
                  className="bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm"
                >
                  {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Status</label>
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value)}
                  className="bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm"
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <Button
                onClick={handleSave}
                disabled={saving || (editTier === (user.tier || 'free') && editStatus === (user.subscriptionStatus || 'active'))}
                className="bg-indigo-600 hover:bg-indigo-700 gap-1"
                size="sm"
              >
                <Save className="h-3.5 w-3.5" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User's Widgets */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3">Widgets ({widgets.length})</h2>
        {widgets.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {widgets.map(w => (
              <Card key={w.id} className="bg-zinc-900 border-zinc-800">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium text-sm">{w.name}</p>
                      <p className="text-zinc-500 text-xs mt-0.5">
                        {w.widgetType} &middot; {w.embedType || 'popup'} &middot; {new Date(w.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={w.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                      {w.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="py-8">
              <p className="text-zinc-500 text-sm text-center">No widgets</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
