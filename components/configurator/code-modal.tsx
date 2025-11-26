'use client';

import React, { useState } from 'react';
import { WidgetConfig } from '@/stores/widget-store';
import { X, Copy, Check } from 'lucide-react';

interface CodeModalProps {
  config: WidgetConfig;
  isOpen: boolean;
  onClose: () => void;
  licenseKey?: string;
}

// Syntax highlighting components
const Keyword = ({ children }: { children?: React.ReactNode }) => <span className="text-blue-600">{children}</span>;
const StringVal = ({ children }: { children?: React.ReactNode }) => <span className="text-green-600">{children}</span>;
const NumberVal = ({ children }: { children?: React.ReactNode }) => <span className="text-purple-600">{children}</span>;
const Comment = ({ children }: { children?: React.ReactNode }) => <span className="text-neutral-400">{children}</span>;

export const CodeModal: React.FC<CodeModalProps> = ({ config, isOpen, onClose, licenseKey }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'embed' | 'config'>('embed');

  if (!isOpen) return null;

  // Generate the embed code
  const generateEmbedCode = () => {
    // Use production URL - environment variable or hardcoded production domain
    // This ensures embed code works regardless of which Vercel deployment you're on
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://chat-interface-r.vercel.app';
    return `<!-- Chat Widget Embed Code -->
<script>
  (function() {
    var w = document.createElement('script');
    w.src = '${baseUrl}/api/widget/${licenseKey || 'YOUR_LICENSE_KEY'}/chat-widget.js';
    w.async = true;
    document.head.appendChild(w);
  })();
</script>`;
  };

  // Generate the config preview code (plain text for copy)
  const generateConfigCode = () => {
    const configObj = {
      themeMode: config.themeMode,
      ...(config.useAccent && { accentColor: config.accentColor }),
      ...(config.useTintedGrayscale && {
        grayscale: {
          hue: config.tintHue,
          tint: config.tintLevel,
          shade: config.shadeLevel
        }
      }),
      ...(config.useCustomSurfaceColors && {
        surface: {
          background: config.surfaceBackgroundColor,
          foreground: config.surfaceForegroundColor
        }
      }),
      typography: {
        fontFamily: config.fontFamily,
        fontSize: config.fontSize,
        ...(config.useCustomFont && {
          customFont: {
            name: config.customFontName,
            css: config.customFontCss
          }
        })
      },
      style: {
        radius: config.radius,
        density: config.density
      },
      ui: {
        greeting: config.greeting,
        placeholder: config.placeholder,
        disclaimer: config.disclaimer,
        starterPrompts: config.starterPrompts
      },
      features: {
        attachments: config.enableAttachments,
        modelPicker: config.enableModelPicker
      },
      connection: {
        n8n: (config.connection?.provider === 'n8n' || !config.connection?.provider) ? { webhookUrl: config.connection?.webhookUrl } : undefined,
        chatKit: config.connection?.provider === 'chatkit'
          ? { workflowId: config.connection?.workflowId, apiKey: '***' }
          : undefined
      }
    };

    return JSON.stringify(configObj, null, 2);
  };

  const codeString = activeTab === 'embed' ? generateEmbedCode() : generateConfigCode();

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-neutral-900">Widget Code</h3>
            <div className="flex gap-1 p-1 bg-neutral-100 rounded-lg">
              <button
                onClick={() => setActiveTab('embed')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${activeTab === 'embed'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-700'
                  }`}
              >
                Embed Code
              </button>
              <button
                onClick={() => setActiveTab('config')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${activeTab === 'config'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-700'
                  }`}
              >
                Config Preview
              </button>
            </div>
          </div>
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

            {activeTab === 'embed' ? (
              // Embed code with syntax highlighting
              <pre className="font-mono text-sm bg-[#F9FAFB] p-6 rounded-lg border border-neutral-100 overflow-x-auto leading-relaxed text-neutral-800">
                <code>
                  <Comment>{'<!-- Chat Widget Embed Code -->'}</Comment>{'\n'}
                  <Keyword>{'<script>'}</Keyword>{'\n'}
                  {'  ('}function{'() {'}{'\n'}
                  {'    '}<Keyword>var</Keyword> w = document.<Keyword>createElement</Keyword>(<StringVal>'script'</StringVal>);{'\n'}
                  {'    '}w.src = <StringVal>'{process.env.NEXT_PUBLIC_APP_URL || 'https://chat-interface-r.vercel.app'}/api/widget/{licenseKey || 'YOUR_LICENSE_KEY'}/chat-widget.js'</StringVal>;{'\n'}
                  {'    '}w.async = <Keyword>true</Keyword>;{'\n'}
                  {'    '}document.head.<Keyword>appendChild</Keyword>(w);{'\n'}
                  {'  }'}{')'}'();'{'\n'}
                  <Keyword>{'</script>'}</Keyword>
                </code>
              </pre>
            ) : (
              // Config preview with syntax highlighting
              <pre className="font-mono text-sm bg-[#F9FAFB] p-6 rounded-lg border border-neutral-100 overflow-x-auto leading-relaxed text-neutral-800">
                <code>
                  {'{\n'}
                  {'  '}<StringVal>"themeMode"</StringVal>: <StringVal>"{config.themeMode}"</StringVal>,{'\n'}

                  {config.useAccent && (
                    <>{'  '}<StringVal>"accentColor"</StringVal>: <StringVal>"{config.accentColor}"</StringVal>,{'\n'}</>
                  )}

                  {config.useTintedGrayscale && (
                    <>
                      {'  '}<StringVal>"grayscale"</StringVal>: {'{\n'}
                      {'    '}<StringVal>"hue"</StringVal>: <NumberVal>{config.tintHue}</NumberVal>,{'\n'}
                      {'    '}<StringVal>"tint"</StringVal>: <NumberVal>{config.tintLevel}</NumberVal>,{'\n'}
                      {'    '}<StringVal>"shade"</StringVal>: <NumberVal>{config.shadeLevel}</NumberVal>{'\n'}
                      {'  }'},\n
                    </>
                  )}

                  {config.useCustomSurfaceColors && (
                    <>
                      {'  '}<StringVal>"surface"</StringVal>: {'{\n'}
                      {'    '}<StringVal>"background"</StringVal>: <StringVal>"{config.surfaceBackgroundColor}"</StringVal>,{'\n'}
                      {'    '}<StringVal>"foreground"</StringVal>: <StringVal>"{config.surfaceForegroundColor}"</StringVal>{'\n'}
                      {'  }'},\n
                    </>
                  )}

                  {'  '}<StringVal>"typography"</StringVal>: {'{\n'}
                  {'    '}<StringVal>"fontFamily"</StringVal>: <StringVal>"{config.fontFamily}"</StringVal>,{'\n'}
                  {'    '}<StringVal>"fontSize"</StringVal>: <NumberVal>{config.fontSize}</NumberVal>{'\n'}
                  {'  }'},\n

                  {'  '}<StringVal>"style"</StringVal>: {'{\n'}
                  {'    '}<StringVal>"radius"</StringVal>: <StringVal>"{config.radius}"</StringVal>,{'\n'}
                  {'    '}<StringVal>"density"</StringVal>: <StringVal>"{config.density}"</StringVal>{'\n'}
                  {'  }'},\n

                  {'  '}<StringVal>"ui"</StringVal>: {'{\n'}
                  {'    '}<StringVal>"greeting"</StringVal>: <StringVal>"{config.greeting}"</StringVal>,{'\n'}
                  {'    '}<StringVal>"placeholder"</StringVal>: <StringVal>"{config.placeholder}"</StringVal>,{'\n'}
                  {'    '}<StringVal>"starterPrompts"</StringVal>: [{'\n'}
                  {(config.starterPrompts || []).map((p, i) => (
                    <React.Fragment key={i}>
                      {'      '}{'{ '}<StringVal>"label"</StringVal>: <StringVal>"{p.label}"</StringVal>, <StringVal>"icon"</StringVal>: <StringVal>"{p.icon}"</StringVal>{' }'}
                      {i < (config.starterPrompts?.length || 0) - 1 ? ',' : ''}{'\n'}
                    </React.Fragment>
                  ))}
                  {'    '}]{'\n'}
                  {'  }'},\n

                  {'  '}<StringVal>"features"</StringVal>: {'{\n'}
                  {'    '}<StringVal>"attachments"</StringVal>: <Keyword>{config.enableAttachments ? 'true' : 'false'}</Keyword>,{'\n'}
                  {'    '}<StringVal>"modelPicker"</StringVal>: <Keyword>{config.enableModelPicker ? 'true' : 'false'}</Keyword>{'\n'}
                  {'  }'}{'\n'}
                  {'}'}
                </code>
              </pre>
            )}
          </div>

          {activeTab === 'embed' && (
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
          )}

          {activeTab === 'config' && (
            <div className="mt-4 p-4 bg-neutral-50 rounded-lg border border-neutral-100">
              <h4 className="text-sm font-medium text-neutral-900 mb-2">Configuration Preview</h4>
              <p className="text-sm text-neutral-600">
                This is a preview of your current widget configuration. The actual configuration is stored
                securely on our servers and applied automatically when the widget loads.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
