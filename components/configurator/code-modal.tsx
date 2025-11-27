'use client';

import React, { useState, useEffect } from 'react';
import { WidgetConfig } from '@/stores/widget-store';
import { X, Copy, Check } from 'lucide-react';

interface CodeModalProps {
  config: WidgetConfig;
  isOpen: boolean;
  onClose: () => void;
  licenseKey?: string;
}

// Syntax highlighting components
const Comment = ({ children }: { children?: React.ReactNode }) => <span className="text-neutral-400">{children}</span>;
const Tag = ({ children }: { children?: React.ReactNode }) => <span className="text-blue-600">{children}</span>;
const Attr = ({ children }: { children?: React.ReactNode }) => <span className="text-purple-600">{children}</span>;
const StringVal = ({ children }: { children?: React.ReactNode }) => <span className="text-green-600">{children}</span>;

export const CodeModal: React.FC<CodeModalProps> = ({ config, isOpen, onClose, licenseKey }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Determine widget type from config
  const widgetType = config.connection?.provider === 'chatkit' ? 'ChatKit Agent' : 'N8n Workflow';

  // Generate the embed code (simple script tag format)
  const generateEmbedCode = () => {
    // Use production URL - environment variable or hardcoded production domain
    // This ensures embed code works regardless of which Vercel deployment you're on
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://chat-interface-r.vercel.app';
    return `<!-- ${widgetType} Widget -->
<script src="${baseUrl}/api/widget/${licenseKey || 'YOUR_LICENSE_KEY'}/chat-widget.js" async></script>`;
  };

  const codeString = generateEmbedCode();

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
  };

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center isolate">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content - Always light theme */}
      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <h3 className="text-lg font-semibold text-neutral-900">Widget Embed Code</h3>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 transition-colors p-1 hover:bg-neutral-100 rounded-md"
          >
            <X size={20} />
          </button>
        </div>

        {/* Code Area */}
        <div className="flex-1 overflow-auto p-6 bg-white">
          <div className="relative group">
            <button
              onClick={handleCopy}
              className="absolute right-4 top-4 p-2 rounded-md bg-white border border-neutral-200 shadow-sm text-neutral-500 hover:text-neutral-900 hover:border-neutral-300 transition-all z-10"
              title="Copy to clipboard"
            >
              {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
            </button>

            {/* Embed code with syntax highlighting */}
            <pre className="font-mono text-sm bg-[#F9FAFB] p-6 rounded-lg border border-neutral-100 overflow-x-auto leading-relaxed text-neutral-800">
              <code>
                <Comment>{`<!-- ${widgetType} Widget -->`}</Comment>{'\n'}
                <Tag>{'<script'}</Tag>{' '}
                <Attr>src</Attr>=<StringVal>"{process.env.NEXT_PUBLIC_APP_URL || 'https://chat-interface-r.vercel.app'}/api/widget/{licenseKey || 'YOUR_LICENSE_KEY'}/chat-widget.js"</StringVal>{' '}
                <Attr>async</Attr>
                <Tag>{'></script>'}</Tag>
              </code>
            </pre>
          </div>

          {/* Installation Instructions */}
          <div className="mt-4 p-4 bg-neutral-50 rounded-lg border border-neutral-100">
            <h4 className="text-sm font-medium text-neutral-900 mb-2">Installation Instructions</h4>
            <ol className="text-sm text-neutral-600 space-y-2 list-decimal list-inside">
              <li>Copy the embed code above</li>
              <li>
                Paste it into the <code className="bg-neutral-200 px-1 rounded text-neutral-800">&lt;head&gt;</code> or before
                the closing <code className="bg-neutral-200 px-1 rounded text-neutral-800">&lt;/body&gt;</code> tag of your HTML
              </li>
              <li>Make sure your domain is added to the widget&apos;s allowed domains list</li>
              <li>The chat widget will appear in the bottom-right corner of your page</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
