'use client';

/**
 * Widget Download Buttons Component
 *
 * Purpose: Provides download buttons for widget packages and copy-paste embed code
 * Supports: Website widget, Portal page, and Chrome Extension packages
 *
 * Features:
 * - Copy embed code snippet
 * - Download website widget package (HTML + JS + README)
 * - Download portal page package (fullscreen HTML + JS + README)
 * - Download Chrome extension package (manifest + sidepanel + icons + README)
 * - Loading states during download
 * - Error handling with user feedback
 * - Beautiful UI with icons
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Globe, ExternalLink, Puzzle, Loader2, Copy, Check, Code } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface WidgetDownloadButtonsProps {
  widgetId: string;
  widgetName: string;
  licenseKey: string;
}

export function WidgetDownloadButtons({ widgetId, widgetName, licenseKey }: WidgetDownloadButtonsProps) {
  const [isDownloadingWebsite, setIsDownloadingWebsite] = useState(false);
  const [isDownloadingPortal, setIsDownloadingPortal] = useState(false);
  const [isDownloadingExtension, setIsDownloadingExtension] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const embedCode = `<script src="${origin}/api/widget/${licenseKey}/chat-widget.js" async></script>`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /**
   * Download package from API
   */
  const downloadPackage = async (type: 'website' | 'portal' | 'extension') => {
    const setLoading = type === 'website'
      ? setIsDownloadingWebsite
      : type === 'portal'
        ? setIsDownloadingPortal
        : setIsDownloadingExtension;

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
          Install Widget
        </CardTitle>
        <CardDescription>
          Embed the widget on your site or download a package
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Embed Code Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Code className="h-4 w-4" />
            <h3>Embed Code</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Copy and paste this code snippet into your website's HTML, just before the closing <code>&lt;/body&gt;</code> tag.
          </p>
          <div className="flex gap-2">
            <Input
              readOnly
              value={embedCode}
              className="font-mono text-xs bg-slate-50 dark:bg-slate-950"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={copyToClipboard}
              title="Copy to clipboard"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or Download Package
            </span>
          </div>
        </div>

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
              disabled={isDownloadingWebsite || isDownloadingPortal || isDownloadingExtension}
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
              disabled={isDownloadingWebsite || isDownloadingPortal || isDownloadingExtension}
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

        {/* Chrome Extension Package */}
        <div className="flex items-start gap-4 p-4 border rounded-lg">
          <div className="flex-shrink-0 w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
            <Puzzle className="h-5 w-5 text-green-600 dark:text-green-300" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm mb-1">Chrome Extension</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Browser extension with side panel. Access your chat assistant from any webpage.
            </p>
            <Button
              onClick={() => downloadPackage('extension')}
              disabled={isDownloadingWebsite || isDownloadingPortal || isDownloadingExtension}
              size="sm"
              variant="outline"
              className="gap-2"
            >
              {isDownloadingExtension ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Download Extension Package
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Help Text */}
        <p className="text-xs text-muted-foreground pt-2">
          Each package includes everything you need: configured files, widget script, icons, and detailed installation instructions.
        </p>
      </CardContent>
    </Card>
  );
}
