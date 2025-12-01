'use client';

import React, { useState, useEffect } from 'react';
import { WidgetConfig } from '@/stores/widget-store';
import { X, Copy, Check, MessageCircle, Layout, Maximize, Link } from 'lucide-react';
import {
  generateAllEmbedCodes,
  type EmbedType,
  type EmbedCodeResult,
} from '@/lib/embed';

interface CodeModalProps {
  config: WidgetConfig;
  isOpen: boolean;
  onClose: () => void;
  widgetKey?: string;
  embedType?: EmbedType;
}

// Syntax highlighting components
const Comment = ({ children }: { children?: React.ReactNode }) => (
  <span className="text-neutral-400">{children}</span>
);
const Tag = ({ children }: { children?: React.ReactNode }) => (
  <span className="text-blue-600">{children}</span>
);
const Attr = ({ children }: { children?: React.ReactNode }) => (
  <span className="text-purple-600">{children}</span>
);
const StringVal = ({ children }: { children?: React.ReactNode }) => (
  <span className="text-green-600">{children}</span>
);

// Icon mapping for embed types
const embedTypeIcons: Record<string, React.ElementType> = {
  'message-circle': MessageCircle,
  'layout': Layout,
  'maximize': Maximize,
  'link': Link,
};

// Embed type display names
const embedTypeNames: Record<EmbedType, string> = {
  popup: 'Popup Widget',
  inline: 'Inline Widget',
  fullpage: 'Fullpage Widget',
  portal: 'Portal Link',
};

export const CodeModal: React.FC<CodeModalProps> = ({
  config,
  isOpen,
  onClose,
  widgetKey,
  embedType = 'popup',
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  if (!isOpen) return null;

  // Determine widget type from config
  const isChatkitWidget = config.connection?.provider === 'chatkit';
  const widgetTypeName = isChatkitWidget ? 'ChatKit Agent' : 'N8n Workflow';

  // Use widgetKey or placeholder
  const key = widgetKey || 'YOUR_WIDGET_KEY';
  const hasValidKey = !!widgetKey;

  // Generate all embed codes and find the selected one
  const embedCodes = generateAllEmbedCodes({ widgetKey: key });
  const currentEmbed = embedCodes.find(e => e.type === embedType) || embedCodes[0];

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
  };

  // Render code with syntax highlighting
  const renderHighlightedCode = (embedResult: EmbedCodeResult) => {
    if (embedResult.language === 'url') {
      return <span className="text-blue-600">{embedResult.code}</span>;
    }

    // Simple syntax highlighting for HTML
    const lines = embedResult.code.split('\n');
    return lines.map((line, i) => {
      // Comment line
      if (line.trim().startsWith('<!--')) {
        return (
          <React.Fragment key={i}>
            <Comment>{line}</Comment>
            {i < lines.length - 1 && '\n'}
          </React.Fragment>
        );
      }

      // Replace tags, attributes, and string values
      const highlighted = line
        .replace(/(<\/?[\w-]+)/g, '<TAG>$1</TAG>')
        .replace(/(\w+)=/g, '<ATTR>$1</ATTR>=')
        .replace(/"([^"]*)"/g, '<STR>"$1"</STR>');

      const parts = highlighted.split(/(<TAG>|<\/TAG>|<ATTR>|<\/ATTR>|<STR>|<\/STR>)/);
      let inTag = false;
      let inAttr = false;
      let inStr = false;

      const renderedParts = parts.map((part, j) => {
        if (part === '<TAG>') { inTag = true; return null; }
        if (part === '</TAG>') { inTag = false; return null; }
        if (part === '<ATTR>') { inAttr = true; return null; }
        if (part === '</ATTR>') { inAttr = false; return null; }
        if (part === '<STR>') { inStr = true; return null; }
        if (part === '</STR>') { inStr = false; return null; }

        if (inTag) return <Tag key={j}>{part}</Tag>;
        if (inAttr) return <Attr key={j}>{part}</Attr>;
        if (inStr) return <StringVal key={j}>{part}</StringVal>;
        return part;
      });

      return (
        <React.Fragment key={i}>
          {renderedParts}
          {i < lines.length - 1 && '\n'}
        </React.Fragment>
      );
    });
  };

  const Icon = embedTypeIcons[currentEmbed.icon] || MessageCircle;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center isolate">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">{embedTypeNames[embedType]} Embed Code</h3>
            <p className="text-sm text-neutral-500 mt-0.5">
              {widgetTypeName} • Copy the code below to embed your widget
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 transition-colors p-1 hover:bg-neutral-100 rounded-md"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6 bg-white">
          {/* Description */}
          <div className="flex items-start gap-3 mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <Icon size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">{currentEmbed.description}</p>
          </div>

          {/* Code Block */}
          <div className="relative group">
            <button
              onClick={() => handleCopy(currentEmbed.code)}
              className="absolute right-4 top-4 p-2 rounded-md bg-white border border-neutral-200 shadow-sm text-neutral-500 hover:text-neutral-900 hover:border-neutral-300 transition-all z-10"
              title="Copy to clipboard"
            >
              {copied ? (
                <Check size={16} className="text-green-600" />
              ) : (
                <Copy size={16} />
              )}
            </button>

            <pre className="font-mono text-sm bg-[#F9FAFB] p-6 rounded-lg border border-neutral-100 overflow-x-auto leading-relaxed text-neutral-800">
              <code>{renderHighlightedCode(currentEmbed)}</code>
            </pre>
          </div>

          {/* Type-specific Instructions */}
          <div className="mt-4 p-4 bg-neutral-50 rounded-lg border border-neutral-100">
            <h4 className="text-sm font-medium text-neutral-900 mb-2">
              {currentEmbed.type === 'popup' && 'Installation Instructions'}
              {currentEmbed.type === 'inline' && 'Inline Widget Setup'}
              {currentEmbed.type === 'fullpage' && 'Fullpage Widget Setup'}
              {currentEmbed.type === 'portal' && 'Shareable Link Usage'}
            </h4>
            <ol className="text-sm text-neutral-600 space-y-2 list-decimal list-inside">
              {currentEmbed.type === 'popup' && (
                <>
                  <li>Copy the embed code above</li>
                  <li>
                    Paste it into the <code className="bg-neutral-200 px-1 rounded text-neutral-800">&lt;head&gt;</code> or before
                    the closing <code className="bg-neutral-200 px-1 rounded text-neutral-800">&lt;/body&gt;</code> tag
                  </li>
                  <li>The chat bubble will appear in the bottom-right corner</li>
                </>
              )}
              {currentEmbed.type === 'inline' && (
                <>
                  <li>Create a container element with the ID &quot;chat-widget&quot;</li>
                  <li>Adjust the container&apos;s width and height to fit your layout</li>
                  <li>The chat will render inside the container, scrolling with the page</li>
                </>
              )}
              {currentEmbed.type === 'fullpage' && (
                <>
                  <li>Embed the iFrame in your page or use as a standalone page</li>
                  <li>The chat will take the full viewport</li>
                  <li>Great for dedicated support pages or mobile apps</li>
                </>
              )}
              {currentEmbed.type === 'portal' && (
                <>
                  <li>Share this link via email, social media, or QR codes</li>
                  <li>Users can access the chat directly without embedding</li>
                  <li>Perfect for support tickets, email signatures, or marketing</li>
                </>
              )}
            </ol>
          </div>

          {/* Domain Reminder */}
          {hasValidKey && (
            <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> Make sure your domain is added to the widget&apos;s allowed domains list
                for the embed to work.
              </p>
            </div>
          )}

          {/* No Key Warning */}
          {!hasValidKey && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-100">
              <p className="text-sm text-red-800">
                <strong>Warning:</strong> No widget key configured. Save your widget first to get an embed code.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
