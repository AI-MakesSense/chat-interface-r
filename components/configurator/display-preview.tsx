"use client";
import { useEffect, useRef } from "react";
import { DisplayRenderer } from "@/widget/src/renderers/display/display-renderer";
import type { DisplaySectionValue } from "./sections/display-section";
import type { DisplayThemeValue } from "./sections/display-theme-section";
import type { DisplayBrandingValue } from "./sections/display-branding-section";

interface Props {
  display: DisplaySectionValue;
  theme: DisplayThemeValue;
  branding: DisplayBrandingValue;
  triggerMessage: string;
}

/**
 * Live preview of the display widget. Mounts an actual DisplayRenderer with the
 * in-progress config. Network calls are stubbed so n8n is never invoked.
 */
export function DisplayPreview({ display, theme, branding, triggerMessage }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<DisplayRenderer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Dispose previous renderer when config changes
    const prev = rendererRef.current;
    if (prev) {
      void prev.dispose();
    }

    // Stub the network call so n8n is never actually invoked
    const stubResponse = {
      documents: [
        { title: 'Sample document 1.pdf', url: 'https://example.com/1.pdf' },
        { title: 'Sample document 2.docx', url: 'https://example.com/2.docx' },
        { title: 'Sample document 3.xlsx', url: 'https://example.com/3.xlsx' },
      ],
    };
    const originalFetch = window.fetch;
    window.fetch = (async () => new Response(JSON.stringify(stubResponse), { status: 200 })) as typeof fetch;

    const renderer = new DisplayRenderer();
    void renderer.mount(
      {
        uiConfig: {
          kind: 'display',
          branding,
          theme,
          display,
          connection: {
            provider: 'n8n',
            triggerMessage,
            captureContext: false,
            customContext: {},
            relayEndpoint: 'about:blank',
          },
        } as any,
        relay: { relayUrl: 'about:blank', widgetId: 'preview', licenseKey: 'preview' },
      } as any,
      containerRef.current,
    );
    rendererRef.current = renderer;

    return () => {
      window.fetch = originalFetch;
      void renderer.dispose();
    };
  }, [JSON.stringify({ display, theme, branding, triggerMessage })]);

  return (
    <div className="relative h-full min-h-[500px] rounded-md border bg-muted/30 overflow-hidden">
      <div ref={containerRef} className="absolute inset-0" />
    </div>
  );
}
