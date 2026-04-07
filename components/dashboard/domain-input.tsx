'use client';

/**
 * Domain Input Component
 *
 * Allows users to add/remove domains for a license.
 * Validates domain format and enforces domain limits.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DomainInputProps {
  currentDomains: string[];
  domainLimit: number;
  onSave: (domains: string[]) => void;
  onCancel: () => void;
}

/**
 * Normalize domain for comparison
 * - Convert to lowercase
 * - Remove www. prefix
 * - Remove port numbers
 */
function normalizeDomain(domain: string): string {
  return domain
    .toLowerCase()
    .replace(/^www\./, '')
    .replace(/:\d+$/, '');
}

/**
 * Validate domain format
 */
function isValidDomain(domain: string): boolean {
  // Basic domain regex (allows localhost for development)
  const domainRegex = /^(?:localhost|(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,})$/;
  return domainRegex.test(normalizeDomain(domain));
}

/**
 * Domain input component
 */
export function DomainInput({
  currentDomains,
  domainLimit,
  onSave,
  onCancel,
}: DomainInputProps) {
  const [domains, setDomains] = useState<string[]>(currentDomains);
  const [newDomain, setNewDomain] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Add a new domain
   */
  const handleAddDomain = () => {
    setError(null);

    // Check if input is empty
    if (!newDomain.trim()) {
      setError('Please enter a domain');
      return;
    }

    // Validate domain format
    if (!isValidDomain(newDomain)) {
      setError('Invalid domain format (e.g., example.com or localhost)');
      return;
    }

    const normalized = normalizeDomain(newDomain);

    // Check if domain already exists
    if (domains.some((d) => normalizeDomain(d) === normalized)) {
      setError('This domain is already added');
      return;
    }

    // Check domain limit
    if (domains.length >= domainLimit) {
      setError(`You can only add up to ${domainLimit} domain(s) for this license tier`);
      return;
    }

    // Add domain
    setDomains([...domains, normalized]);
    setNewDomain('');
  };

  /**
   * Remove a domain
   */
  const handleRemoveDomain = (index: number) => {
    setDomains(domains.filter((_, i) => i !== index));
    setError(null);
  };

  /**
   * Save domains to server
   */
  const handleSave = async () => {
    setError(null);
    setIsSaving(true);

    try {
      // Call the onSave callback
      await onSave(domains);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update domains');
      setIsSaving(false);
    }
  };

  const canAddMore = domains.length < domainLimit;

  return (
    <div className="space-y-4 border rounded-lg p-4 bg-muted/50">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Current Domains */}
      <div>
        <Label>Allowed Domains ({domains.length} / {domainLimit})</Label>
        <div className="mt-2 space-y-2">
          {domains.length === 0 ? (
            <p className="text-sm text-muted-foreground">No domains added yet</p>
          ) : (
            domains.map((domain, index) => (
              <div
                key={index}
                className="flex items-center justify-between px-3 py-2 bg-background rounded-md border"
              >
                <span className="font-mono text-sm">{domain}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRemoveDomain(index)}
                  disabled={isSaving}
                >
                  Remove
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add New Domain */}
      {canAddMore && (
        <div>
          <Label htmlFor="new-domain">Add New Domain</Label>
          <div className="flex gap-2 mt-2">
            <Input
              id="new-domain"
              placeholder="example.com"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddDomain();
                }
              }}
              disabled={isSaving}
            />
            <Button
              onClick={handleAddDomain}
              disabled={isSaving}
            >
              Add
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Enter domain without protocol (e.g., example.com, not https://example.com)
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2 border-t">
        <Button
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
