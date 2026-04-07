'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Shield, Plus, X, Loader2, Globe } from 'lucide-react';
import { toast } from 'sonner';

interface DomainManagerProps {
    licenseId: string;
    initialDomains: string[];
    onUpdate?: (domains: string[]) => void;
}

export function DomainManager({ licenseId, initialDomains, onUpdate }: DomainManagerProps) {
    const [domains, setDomains] = useState<string[]>(initialDomains || []);
    const [newDomain, setNewDomain] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const handleUpdateDomains = async (updatedDomains: string[]) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/licenses/${licenseId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domains: updatedDomains }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update domains');
            }

            setDomains(updatedDomains);
            if (onUpdate) onUpdate(updatedDomains);
            toast.success('Domains updated successfully');
        } catch (error) {
            console.error('Failed to update domains:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to update domains');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddDomain = () => {
        if (!newDomain) return;

        // Basic validation
        let domainToAdd = newDomain.trim().toLowerCase();

        // Remove protocol if present
        domainToAdd = domainToAdd.replace(/^https?:\/\//, '');
        // Remove path if present
        domainToAdd = domainToAdd.split('/')[0];

        if (domains.includes(domainToAdd)) {
            toast.error('Domain already exists');
            return;
        }

        const updatedDomains = [...domains, domainToAdd];
        handleUpdateDomains(updatedDomains);
        setNewDomain('');
    };

    const handleRemoveDomain = (domainToRemove: string) => {
        const updatedDomains = domains.filter(d => d !== domainToRemove);
        handleUpdateDomains(updatedDomains);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Shield className="h-4 w-4" />
                    Domains
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Manage Allowed Domains</DialogTitle>
                    <DialogDescription>
                        Add domains where this widget is allowed to load.
                        Use 'localhost' for development.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="example.com"
                            value={newDomain}
                            onChange={(e) => setNewDomain(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddDomain();
                                }
                            }}
                        />
                        <Button onClick={handleAddDomain} disabled={isLoading || !newDomain}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <h4 className="text-sm font-medium leading-none">Allowed Domains</h4>
                        {domains.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic">
                                No domains configured. Widget might be blocked on some sites.
                            </p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {domains.map((domain) => (
                                    <Badge key={domain} variant="secondary" className="gap-1 pr-1">
                                        <Globe className="h-3 w-3 mr-1" />
                                        {domain}
                                        <button
                                            onClick={() => handleRemoveDomain(domain)}
                                            className="ml-1 hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                                            disabled={isLoading}
                                        >
                                            <X className="h-3 w-3" />
                                            <span className="sr-only">Remove {domain}</span>
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="secondary" onClick={() => setIsOpen(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
