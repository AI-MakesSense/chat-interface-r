'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Eye } from 'lucide-react';
import type { AdminUser } from '@/stores/admin-store';

const TIER_COLORS: Record<string, string> = {
  free: 'bg-zinc-700 text-zinc-300',
  basic: 'bg-blue-500/20 text-blue-400',
  pro: 'bg-purple-500/20 text-purple-400',
  agency: 'bg-amber-500/20 text-amber-400',
};

export function UserTable({ users }: { users: AdminUser[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="border-zinc-800 hover:bg-transparent">
          <TableHead className="text-zinc-400">Name</TableHead>
          <TableHead className="text-zinc-400">Email</TableHead>
          <TableHead className="text-zinc-400">Tier</TableHead>
          <TableHead className="text-zinc-400">Widgets</TableHead>
          <TableHead className="text-zinc-400">Joined</TableHead>
          <TableHead className="text-zinc-400 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id} className="border-zinc-800 hover:bg-zinc-800/50">
            <TableCell className="text-white font-medium">{user.name || '-'}</TableCell>
            <TableCell className="text-zinc-400">{user.email}</TableCell>
            <TableCell>
              <Badge className={TIER_COLORS[user.tier || 'free'] || TIER_COLORS.free}>
                {user.tier || 'free'}
              </Badge>
            </TableCell>
            <TableCell className="text-zinc-400">{user.widgetCount}</TableCell>
            <TableCell className="text-zinc-500 text-sm">
              {new Date(user.createdAt).toLocaleDateString()}
            </TableCell>
            <TableCell className="text-right">
              <Link href={`/admin/users/${user.id}`}>
                <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white h-8 gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  View
                </Button>
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
