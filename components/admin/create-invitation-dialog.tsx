'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAdminStore } from '@/stores/admin-store';
import { Mail, Hash, Copy, Check } from 'lucide-react';

const EXPIRY_OPTIONS = [
  { value: 1, label: '1 day' },
  { value: 3, label: '3 days' },
  { value: 7, label: '7 days' },
  { value: 14, label: '14 days' },
  { value: 30, label: '30 days' },
];

export function CreateInvitationDialog({
  children,
  onCreated,
}: {
  children: React.ReactNode;
  onCreated?: () => void;
}) {
  const { createInvitation } = useAdminStore();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<{ code: string; signupUrl: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await createInvitation({
        type,
        email: type === 'email' ? email : undefined,
        expiresInDays,
      });
      setResult({ code: res.invitation.code, signupUrl: res.signupUrl });
      onCreated?.();
    } catch {
      // Error handled by store
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      // Reset form
      setType('email');
      setEmail('');
      setExpiresInDays(7);
      setResult(null);
      setCopied(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle>{result ? 'Invitation Created' : 'Create Invitation'}</DialogTitle>
        </DialogHeader>

        {result ? (
          <div className="space-y-4 pt-2">
            <div className="bg-zinc-900 rounded-lg p-4 space-y-3">
              <div>
                <Label className="text-zinc-400 text-xs">Invite Code</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-sm text-indigo-400 font-mono flex-1 break-all">{result.code}</code>
                  <Button size="sm" variant="ghost" onClick={() => handleCopy(result.code)} className="shrink-0">
                    {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-zinc-400 text-xs">Signup Link</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-xs text-zinc-300 font-mono flex-1 break-all">{result.signupUrl}</code>
                  <Button size="sm" variant="ghost" onClick={() => handleCopy(result.signupUrl)} className="shrink-0">
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
            <Button onClick={() => handleClose(false)} className="w-full bg-indigo-600 hover:bg-indigo-700">
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {/* Type selector */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setType('email')}
                className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${
                  type === 'email'
                    ? 'border-indigo-500 bg-zinc-900 ring-1 ring-indigo-500'
                    : 'border-zinc-800 bg-black hover:bg-zinc-900'
                }`}
              >
                <Mail className="h-4 w-4" />
                <span className="text-sm">Email Invite</span>
              </button>
              <button
                onClick={() => setType('code')}
                className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${
                  type === 'code'
                    ? 'border-indigo-500 bg-zinc-900 ring-1 ring-indigo-500'
                    : 'border-zinc-800 bg-black hover:bg-zinc-900'
                }`}
              >
                <Hash className="h-4 w-4" />
                <span className="text-sm">Shareable Code</span>
              </button>
            </div>

            {/* Email input (only for email type) */}
            {type === 'email' && (
              <div>
                <Label className="text-zinc-400">Email Address</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="mt-1 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
                />
              </div>
            )}

            {/* Expiry */}
            <div>
              <Label className="text-zinc-400">Expires In</Label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {EXPIRY_OPTIONS.map(opt => (
                  <Button
                    key={opt.value}
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpiresInDays(opt.value)}
                    className={`text-xs ${
                      expiresInDays === opt.value
                        ? 'bg-indigo-500/10 text-indigo-400'
                        : 'text-zinc-400 hover:text-white border border-zinc-800'
                    }`}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleCreate}
              disabled={creating || (type === 'email' && !email)}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {creating ? 'Creating...' : 'Create Invitation'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
