'use client';

/**
 * Domain Info Card Component
 * 
 * Read-only display of domain authorization status for the current widget.
 * Shows which domains are authorized at the license level and provides
 * clear guidance on managing domains via the dashboard.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Globe, AlertTriangle, CheckCircle2, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { WidgetLicense } from '@/stores/widget-store';

interface DomainInfoCardProps {
    license: WidgetLicense | null;
    isLoading?: boolean;
}

export function DomainInfoCard({ license, isLoading }: DomainInfoCardProps) {
    const router = useRouter();

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        Domain Authorization
                    </CardTitle>
                    <CardDescription>Loading license information...</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    if (!license) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        Domain Authorization
                    </CardTitle>
                    <CardDescription>No license information available</CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            Unable to load license information. Please refresh the page or contact support.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    const hasNoDomains = !license.domains || license.domains.length === 0;
    const domainCount = license.domains?.length || 0;
    const domainLimit = license.domainLimit === -1 ? '∞' : license.domainLimit;
    const tierName = license.tier.charAt(0).toUpperCase() + license.tier.slice(1);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Domain Authorization (License-Level)
                </CardTitle>
                <CardDescription>
                    Domains authorized for all widgets under this license
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {hasNoDomains ? (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="space-y-2">
                            <p className="font-medium">Domain Authorization Required</p>
                            <p className="text-sm">
                                This widget won't work on production websites until you authorize at least one domain.
                            </p>
                        </AlertDescription>
                    </Alert>
                ) : (
                    <Alert>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription>
                            <p className="font-medium text-green-600">Domain authorization configured</p>
                        </AlertDescription>
                    </Alert>
                )}

                <div className="space-y-3">
                    <div>
                        <p className="text-sm font-medium mb-2">Currently authorized domains:</p>
                        <ul className="space-y-1">
                            {hasNoDomains ? (
                                <li className="text-sm text-muted-foreground pl-6">None</li>
                            ) : (
                                license.domains.map((domain, idx) => (
                                    <li key={idx} className="text-sm flex items-center gap-2 pl-6">
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        <code className="bg-muted px-2 py-0.5 rounded">{domain}</code>
                                    </li>
                                ))
                            )}
                            <li className="text-sm flex items-center gap-2 pl-6">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <code className="bg-muted px-2 py-0.5 rounded">localhost</code>
                                <span className="text-muted-foreground">(always allowed for testing)</span>
                            </li>
                        </ul>
                    </div>

                    <div className="pt-2 border-t">
                        <p className="text-sm text-muted-foreground">
                            License: <span className="font-medium">{tierName} Tier</span> ({domainCount}/{domainLimit} domains used)
                        </p>
                    </div>
                </div>

                <Alert>
                    <AlertDescription className="text-sm space-y-2">
                        <p className="font-medium">💡 Managing Domains</p>
                        <p>
                            These domains apply to <strong>all widgets</strong> under this license.
                            To add or remove domains:
                        </p>
                        <ol className="list-decimal list-inside space-y-1 ml-2">
                            <li>Go to Dashboard</li>
                            <li>Find your License Card</li>
                            <li>Click "Manage Domains"</li>
                        </ol>
                    </AlertDescription>
                </Alert>

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => router.push('/dashboard')}
                    >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Go to Dashboard
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
