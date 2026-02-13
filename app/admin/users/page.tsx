'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAdminStore } from '@/stores/admin-store';
import { UserTable } from '@/components/admin/user-table';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

const TIERS = ['all', 'free', 'basic', 'pro', 'agency'];

export default function AdminUsersPage() {
  const { users, usersTotal, usersLoading, fetchUsers } = useAdminStore();
  const [search, setSearch] = useState('');
  const [tier, setTier] = useState('all');
  const [page, setPage] = useState(1);
  const limit = 20;
  const totalPages = Math.ceil(usersTotal / limit);

  const load = useCallback(() => {
    fetchUsers({
      page,
      search: search || undefined,
      tier: tier === 'all' ? undefined : tier,
    });
  }, [fetchUsers, page, search, tier]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
          Users
        </h1>
        <p className="text-zinc-400 mt-1">{usersTotal} total users</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="pl-9 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
          />
        </form>
        <div className="flex gap-1">
          {TIERS.map(t => (
            <Button
              key={t}
              variant="ghost"
              size="sm"
              onClick={() => { setTier(t); setPage(1); }}
              className={`text-xs capitalize ${
                tier === t
                  ? 'bg-indigo-500/10 text-indigo-400'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {t}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-0">
          {usersLoading ? (
            <div className="space-y-2 p-6">
              {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-12 rounded-lg bg-white/5 animate-pulse" />)}
            </div>
          ) : users.length > 0 ? (
            <UserTable users={users} />
          ) : (
            <p className="text-zinc-500 text-sm text-center py-12">No users found</p>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="text-zinc-400 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="text-zinc-400 hover:text-white"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
