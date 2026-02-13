'use client';

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
import { Copy, X } from 'lucide-react';
import type { AdminInvitation } from '@/stores/admin-store';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-500/20 text-amber-400',
  accepted: 'bg-green-500/20 text-green-400',
  expired: 'bg-zinc-700 text-zinc-400',
};

export function InvitationTable({
  invitations,
  onRevoke,
  onCopy,
}: {
  invitations: AdminInvitation[];
  onRevoke: (id: string) => void;
  onCopy: (text: string) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="border-zinc-800 hover:bg-transparent">
          <TableHead className="text-zinc-400">Type</TableHead>
          <TableHead className="text-zinc-400">Email / Code</TableHead>
          <TableHead className="text-zinc-400">Status</TableHead>
          <TableHead className="text-zinc-400">Created By</TableHead>
          <TableHead className="text-zinc-400">Expires</TableHead>
          <TableHead className="text-zinc-400 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invitations.map((inv) => (
          <TableRow key={inv.id} className="border-zinc-800 hover:bg-zinc-800/50">
            <TableCell>
              <Badge variant="secondary" className="text-xs">
                {inv.type}
              </Badge>
            </TableCell>
            <TableCell className="text-white font-mono text-sm">
              {inv.type === 'email' ? inv.email : inv.code.slice(0, 12) + '...'}
            </TableCell>
            <TableCell>
              <Badge className={STATUS_COLORS[inv.status] || STATUS_COLORS.expired}>
                {inv.status}
              </Badge>
            </TableCell>
            <TableCell className="text-zinc-400 text-sm">{inv.inviterEmail || '-'}</TableCell>
            <TableCell className="text-zinc-500 text-sm">
              {new Date(inv.expiresAt).toLocaleDateString()}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-zinc-400 hover:text-white h-8"
                  onClick={() => {
                    const url = `${window.location.origin}/auth/signup?invite=${inv.code}`;
                    onCopy(inv.type === 'code' ? inv.code : url);
                  }}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                {inv.status === 'pending' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8"
                    onClick={() => onRevoke(inv.id)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
