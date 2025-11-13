'use client';

/**
 * Widget Download Buttons Component
 *
 * Purpose: Provides download buttons for widget packages
 * Supports: Website widget and Portal page packages
 *
 * Features:
 * - Download website widget package (HTML + JS + README)
 * - Download portal page package (fullscreen HTML + JS + README)
 * - Loading states during download
 * - Error handling with user feedback
 * - Beautiful UI with icons
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Globe, ExternalLink, Loader2 } from 'lucide-react';

interface WidgetDownloadButtonsProps {
  widgetId: string;
  widgetName: string;
}

export function WidgetDownloadButtons({ widgetId, widgetName }: WidgetDownloadButtonsProps) {
  const [isDownloadingWebsite, setIsDownloadingWebsite] = useState(false);
  const [isDownloadingPortal, setIsDownloadingPortal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Download package from API
   */
  const downloadPackage = async (type: 'website' | 'portal') => {
    const setLoading = type === 'website' ? setIsDownloadingWebsite : setIsDownloadingPortal;

    try {
      setLoading(true);
      setError(null);

      // Call download API
      const response = await fetch(`/api/widgets/${widgetId}/download?type=${type}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Download failed' }));
        throw new Error(errorData.error || `Failed to download ${type} package`);
      }

      // Get blob from response
      const blob = await response.blob();

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `${widgetName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${type}.zip`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create download link and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error(`[Download] ${type} package error:`, err);
      setError(err instanceof Error ? err.message : 'Download failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Download Widget Packages
        </CardTitle>
        <CardDescription>
          Download ready-to-use code packages for your website or portal
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Website Widget Package */}
        <div className="flex items-start gap-4 p-4 border rounded-lg">
          <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
            <Globe className="h-5 w-5 text-blue-600 dark:text-blue-300" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm mb-1">Website Widget</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Bubble chat widget for your website. Includes demo HTML page, widget script, and installation guide.
            </p>
            <Button
              onClick={() => downloadPackage('website')}
              disabled={isDownloadingWebsite || isDownloadingPortal}
              size="sm"
              className="gap-2"
            >
              {isDownloadingWebsite ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Download Website Package
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Portal Page Package */}
        <div className="flex items-start gap-4 p-4 border rounded-lg">
          <div className="flex-shrink-0 w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
            <ExternalLink className="h-5 w-5 text-purple-600 dark:text-purple-300" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm mb-1">Portal Page</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Full-screen chat portal. Perfect for dedicated support pages or iframe embeds.
            </p>
            <Button
              onClick={() => downloadPackage('portal')}
              disabled={isDownloadingWebsite || isDownloadingPortal}
              size="sm"
              variant="secondary"
              className="gap-2"
            >
              {isDownloadingPortal ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Download Portal Package
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Help Text */}
        <p className="text-xs text-muted-foreground pt-2">
          Each package includes everything you need: HTML files, widget script, and detailed installation instructions.
        </p>
      </CardContent>
    </Card>
  );
}
