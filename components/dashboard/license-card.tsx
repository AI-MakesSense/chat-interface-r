'use client';

/**
 * License Card Component
 *
 * Displays a license with its details, status, and actions.
 * Shows tier badge, domain list, expiration date, and allows domain management.
 */

import { useState } from 'react';
import { License, LicenseTier } from '@/stores/license-store';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DomainInput } from './domain-input';

interface LicenseCardProps {
  license: License;
  onUpdate?: (license: License) => void;
  onDelete?: (licenseId: string) => void;
}

/**
 * Get tier display information
 */
function getTierInfo(tier: LicenseTier): { label: string; color: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } {
  switch (tier) {
    case 'basic':
      return { label: 'Basic', color: 'bg-blue-500', variant: 'secondary' };
    case 'pro':
      return { label: 'Pro', color: 'bg-purple-500', variant: 'default' };
    case 'agency':
      return { label: 'Agency', color: 'bg-green-500', variant: 'default' };
  }
}

/**
 * Get status display information
 */
function getStatusInfo(status: string): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } {
  switch (status) {
    case 'active':
      return { label: 'Active', variant: 'default' };
    case 'expired':
      return { label: 'Expired', variant: 'destructive' };
    case 'cancelled':
      return { label: 'Cancelled', variant: 'outline' };
    default:
      return { label: status, variant: 'secondary' };
  }
}

/**
 * License card component
 */
export function LicenseCard({ license, onUpdate, onDelete }: LicenseCardProps) {
  const [showDomainInput, setShowDomainInput] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const tierInfo = getTierInfo(license.tier);
  const statusInfo = getStatusInfo(license.status);

  const isExpired = license.expiresAt && new Date(license.expiresAt) < new Date();
  const canAddDomain = license.domains.length < license.domainLimit;

  /**
   * Handle license deletion
   */
  const handleDelete = async () => {
    if (!onDelete) return;

    setIsDeleting(true);
    try {
      await onDelete(license.id);
    } catch (error) {
      console.error('Failed to delete license:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  /**
   * Handle domain list update
   */
  const handleDomainsUpdate = (domains: string[]) => {
    if (onUpdate) {
      onUpdate({ ...license, domains });
    }
    setShowDomainInput(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={tierInfo.variant}>{tierInfo.label}</Badge>
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
              {!license.brandingEnabled && (
                <Badge variant="outline">White-label</Badge>
              )}
            </div>
            <CardTitle className="text-lg">License Key</CardTitle>
            <CardDescription className="font-mono text-xs mt-1">
              {license.licenseKey}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Expiration Warning */}
        {isExpired && (
          <Alert variant="destructive">
            <AlertDescription>
              This license expired on {new Date(license.expiresAt!).toLocaleDateString()}
            </AlertDescription>
          </Alert>
        )}

        {/* License Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Domains</p>
            <p className="font-medium">
              {license.domains.length} / {license.domainLimit}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Widget Limit</p>
            <p className="font-medium">
              {license.widgetLimit === null ? 'Unlimited' : license.widgetLimit}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Created</p>
            <p className="font-medium">
              {new Date(license.createdAt).toLocaleDateString()}
            </p>
          </div>
          {license.expiresAt && (
            <div>
              <p className="text-muted-foreground">Expires</p>
              <p className="font-medium">
                {new Date(license.expiresAt).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>

        {/* Domain List */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Allowed Domains</p>
            {canAddDomain && !showDomainInput && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowDomainInput(true)}
              >
                Add Domain
              </Button>
            )}
          </div>

          {showDomainInput ? (
            <DomainInput
              currentDomains={license.domains}
              domainLimit={license.domainLimit}
              onSave={handleDomainsUpdate}
              onCancel={() => setShowDomainInput(false)}
            />
          ) : (
            <>
              {license.domains.length === 0 ? (
                <p className="text-sm text-muted-foreground">No domains configured</p>
              ) : (
                <div className="space-y-1">
                  {license.domains.map((domain, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm px-3 py-2 rounded-md bg-muted"
                    >
                      <span className="font-mono">{domain}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            navigator.clipboard.writeText(license.licenseKey);
          }}
        >
          Copy License Key
        </Button>

        {!showDeleteConfirm ? (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isDeleting}
          >
            Cancel License
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Cancelling...' : 'Confirm Delete'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
