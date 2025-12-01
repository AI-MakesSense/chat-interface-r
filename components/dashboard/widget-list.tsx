'use client';

/**
 * Widget List Component
 *
 * Displays a flat list of user's widgets with management actions.
 * Schema v2.0: Uses widgetKey for embed codes, shows embed type badge.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Widget } from '@/stores/widget-store';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Globe, Calendar, X, Check, Code } from 'lucide-react';
import { EmbedTypeBadge } from '@/components/configurator/embed-type-selector';
import type { EmbedType } from '@/stores/widget-store';

interface WidgetListProps {
    widgets: Widget[];
    onDelete: (id: string) => Promise<void>;
}

export function WidgetList({ widgets, onDelete }: WidgetListProps) {
    const router = useRouter();
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const handleDelete = async (id: string) => {
        setIsDeleting(true);
        try {
            await onDelete(id);
        } catch (error) {
            console.error('Failed to delete widget:', error);
        } finally {
            setIsDeleting(false);
            setDeleteId(null);
        }
    };

    /**
     * Generate and copy embed code
     * Schema v2.0: Prefers widgetKey, falls back to licenseKey for backward compatibility
     */
    const handleCopyEmbed = (widget: Widget) => {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://chat-interface-r.vercel.app';
        const widgetType = widget.config?.connection?.provider === 'chatkit' ? 'ChatKit Agent' : 'N8n Workflow';

        let embedCode: string;

        // Schema v2.0: Use widgetKey if available, otherwise fall back to licenseKey
        if (widget.widgetKey) {
            // New v2.0 embed code using widgetKey
            embedCode = `<!-- ${widgetType} Widget -->
<script src="${baseUrl}/w/${widget.widgetKey}.js" async></script>`;
        } else if (widget.licenseKey) {
            // Legacy embed code using licenseKey
            embedCode = `<!-- ${widgetType} Widget -->
<script src="${baseUrl}/api/widget/${widget.licenseKey}/chat-widget.js" async></script>`;
        } else {
            // Fallback - should not happen
            embedCode = `<!-- Widget embed code not available - please save widget first -->`;
        }

        navigator.clipboard.writeText(embedCode);
        setCopiedId(widget.id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    if (widgets.length === 0) {
        return (
            <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="rounded-full bg-muted p-4 mb-4">
                        <Globe className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No widgets yet</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mb-6">
                        Create your first chat widget to start engaging with your visitors.
                    </p>
                    <Button onClick={() => router.push('/configurator')}>
                        Create Widget
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {widgets.map((widget) => (
                <Card key={widget.id} className="flex flex-col">
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div>
                                <CardTitle className="text-lg truncate pr-2" title={widget.name}>
                                    {widget.name}
                                </CardTitle>
                                <CardDescription className="text-xs mt-1 flex items-center gap-2">
                                    {widget.widgetKey ? (
                                        <span className="font-mono">{widget.widgetKey.slice(0, 8)}...</span>
                                    ) : (
                                        <span>ID: {widget.id.slice(0, 8)}...</span>
                                    )}
                                    {widget.embedType && (
                                        <EmbedTypeBadge type={widget.embedType} />
                                    )}
                                </CardDescription>
                            </div>
                            <Badge variant={widget.isDeployed ? 'default' : 'secondary'}>
                                {widget.isDeployed ? 'Active' : 'Draft'}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <div className="space-y-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>Created {new Date(widget.createdAt).toLocaleDateString()}</span>
                            </div>
                            {(widget.config as any).n8nWebhookUrl || widget.config.connection?.webhookUrl ? (
                                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                    <div className="h-2 w-2 rounded-full bg-current" />
                                    <span>Connected to N8n</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                    <div className="h-2 w-2 rounded-full bg-current" />
                                    <span>No webhook configured</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2 pt-4 border-t">
                        <div className="flex w-full gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                className="flex-1 gap-2"
                                onClick={() => handleCopyEmbed(widget)}
                            >
                                {copiedId === widget.id ? (
                                    <>
                                        <Check className="h-4 w-4" />
                                        Copied
                                    </>
                                ) : (
                                    <>
                                        <Code className="h-4 w-4" />
                                        Copy Embed
                                    </>
                                )}
                            </Button>
                        </div>
                        <div className="flex w-full gap-2">
                            {deleteId === widget.id ? (
                                <div className="flex items-center gap-2 w-full animate-in fade-in slide-in-from-right-5 duration-200">
                                    <span className="text-xs font-medium text-destructive flex-1">Confirm delete?</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => setDeleteId(null)}
                                        disabled={isDeleting}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => handleDelete(widget.id)}
                                        disabled={isDeleting}
                                    >
                                        <Check className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 gap-2"
                                        onClick={() => {
                                            const provider = widget.config?.connection?.provider;
                                            const path = provider === 'chatkit' ? '/configurator/chatkit' : '/configurator/n8n';
                                            router.push(`${path}?widgetId=${widget.id}`);
                                        }}
                                    >
                                        <Edit className="h-4 w-4" />
                                        Edit
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-destructive hover:text-destructive"
                                        onClick={() => setDeleteId(widget.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </>
                            )}
                        </div>
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
}
