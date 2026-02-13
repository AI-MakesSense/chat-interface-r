'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAdminStore } from '@/stores/admin-store';
import { InvitationTable } from '@/components/admin/invitation-table';
import { CreateInvitationDialog } from '@/components/admin/create-invitation-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminInvitationsPage() {
  const { invitations, invitationsTotal, invitationsLoading, fetchInvitations, revokeInvitation } = useAdminStore();
  const [status, setStatus] = useState('');

  const load = useCallback(() => {
    fetchInvitations({ status: status || undefined });
  }, [fetchInvitations, status]);

  useEffect(() => { load(); }, [load]);

  const handleRevoke = async (id: string) => {
    try {
      await revokeInvitation(id);
      load();
      toast.success('Invitation revoked');
    } catch {
      toast.error('Failed to revoke invitation');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            Invitations
          </h1>
          <p className="text-zinc-400 mt-1">{invitationsTotal} total invitations</p>
        </div>
        <CreateInvitationDialog onCreated={load}>
          <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2">
            <Plus className="h-4 w-4" />
            Create Invitation
          </Button>
        </CreateInvitationDialog>
      </div>

      {/* Status Tabs */}
      <Tabs value={status} onValueChange={setStatus}>
        <TabsList className="bg-zinc-900 border border-zinc-800">
          <TabsTrigger value="" className="data-[state=active]:bg-indigo-500/10 data-[state=active]:text-indigo-400">All</TabsTrigger>
          <TabsTrigger value="pending" className="data-[state=active]:bg-indigo-500/10 data-[state=active]:text-indigo-400">Pending</TabsTrigger>
          <TabsTrigger value="accepted" className="data-[state=active]:bg-indigo-500/10 data-[state=active]:text-indigo-400">Accepted</TabsTrigger>
          <TabsTrigger value="expired" className="data-[state=active]:bg-indigo-500/10 data-[state=active]:text-indigo-400">Expired</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Table */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-0">
          {invitationsLoading ? (
            <div className="space-y-2 p-6">
              {[1, 2, 3].map(i => <div key={i} className="h-12 rounded-lg bg-white/5 animate-pulse" />)}
            </div>
          ) : invitations.length > 0 ? (
            <InvitationTable invitations={invitations} onRevoke={handleRevoke} onCopy={handleCopy} />
          ) : (
            <p className="text-zinc-500 text-sm text-center py-12">No invitations found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
