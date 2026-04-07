

import React, { useState } from 'react';
import { WidgetConfig } from '../types';
import { X, Copy, Check } from 'lucide-react';

interface CodeModalProps {
  config: WidgetConfig;
  isOpen: boolean;
  onClose: () => void;
}

export const CodeModal: React.FC<CodeModalProps> = ({ config, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Generate the code string dynamically
  const generateCode = () => {
    const colorSection = [];
    
    if (config.useTintedGrayscale) {
        colorSection.push(`      grayscale: {
        hue: ${config.tintHue},
        tint: ${config.tintLevel},
        shade: ${config.shadeLevel}
      }`);
    }
    
    if (config.useCustomSurfaceColors) {
        colorSection.push(`      surface: {
        background: '${config.surfaceBackgroundColor}',
        foreground: '${config.surfaceForegroundColor}'
      }`);
    }

    if (config.useCustomIconColor) {
        colorSection.push(`      icon: '${config.customIconColor}'`);
    }

    if (config.useCustomUserMessageColors) {
        colorSection.push(`      userMessage: {
        text: '${config.customUserMessageTextColor}',
        background: '${config.customUserMessageBackgroundColor}'
      }`);
    }

    const colorBlock = colorSection.length > 0 ? `\n    color: {\n${colorSection.join(',\n')}\n    },` : '';

    const prompts = config.starterPrompts.map(p => `        { label: "${p.label}", icon: "${p.icon}" }`).join(',\n');

    const customFontBlock = config.useCustomFont && config.customFontCss && config.customFontName ? `
      // Custom Font Injection
      customFont: {
        name: '${config.customFontName}',
        css: \`${config.customFontCss}\`
      },` : '';

    return `import type { ChatKitOptions } from "@openai/chatkit";

const options: ChatKitOptions = {
  api: {
    // TODO: configure your ChatKit API integration (URL, auth, uploads).
  },
  theme: {
    colorScheme: '${config.themeMode}',
    radius: '${config.radius}',
    density: '${config.density}',${colorBlock}
    typography: {
      baseSize: ${config.fontSize},
      fontFamily: '"${config.fontFamily}", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      fontFamilyMono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      ${customFontBlock}
      fontSources: [
        {
          family: '${config.fontFamily}',
          src: 'https://cdn.openai.com/common/fonts/openai-sans/v2/OpenAISans-Regular.woff2',
          weight: 400,
          style: 'normal',
          display: 'swap'
        }
        // ...and 7 more font sources
      ]
    },
    ui: {
      greeting: "${config.greeting}",
      starterPrompts: [
${prompts}
      ]
    }
  }
};`;
  };

  const codeString = generateCode();

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper for syntax highlighting simulation
  const Keyword = ({ children }: { children?: React.ReactNode }) => <span className="text-blue-600">{children}</span>;
  const StringVal = ({ children }: { children?: React.ReactNode }) => <span className="text-green-600">{children}</span>;
  const Property = ({ children }: { children?: React.ReactNode }) => <span className="text-neutral-800">{children}</span>;
  const Comment = ({ children }: { children?: React.ReactNode }) => <span className="text-neutral-400">{children}</span>;
  const NumberVal = ({ children }: { children?: React.ReactNode }) => <span className="text-purple-600">{children}</span>;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center isolate">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <h3 className="text-lg font-semibold text-neutral-900">ChatKit options</h3>
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
            
            <pre className="font-mono text-sm bg-[#F9FAFB] p-6 rounded-lg border border-neutral-100 overflow-x-auto leading-relaxed text-neutral-800">
              <code>
                <Keyword>import type</Keyword> {'{ ChatKitOptions }'} <Keyword>from</Keyword> <StringVal>"@openai/chatkit"</StringVal>;
                {'\n\n'}
                <Keyword>const</Keyword> options: ChatKitOptions = {'{\n'}
                {'  '}api: {'{\n'}
                {'    '}<Comment>// TODO: configure your ChatKit API integration (URL, auth, uploads).</Comment>{'\n'}
                {'  }'},{'\n'}
                {'  '}theme: {'{\n'}
                {'    '}colorScheme: <StringVal>'{config.themeMode}'</StringVal>,{'\n'}
                {'    '}radius: <StringVal>'{config.radius}'</StringVal>,{'\n'}
                {'    '}density: <StringVal>'{config.density}'</StringVal>,{'\n'}
                
                {/* Dynamic Color Section */}
                {(config.useTintedGrayscale || config.useCustomSurfaceColors || config.useCustomIconColor || config.useCustomUserMessageColors) && (
                    <>
                        {'    '}color: {'{\n'}
                        {config.useTintedGrayscale && (
                            <>
                            {'      '}grayscale: {'{\n'}
                            {'        '}hue: <NumberVal>{config.tintHue}</NumberVal>,{'\n'}
                            {'        '}tint: <NumberVal>{config.tintLevel}</NumberVal>,{'\n'}
                            {'        '}shade: <NumberVal>{config.shadeLevel}</NumberVal>{'\n'}
                            {'      }'}{config.useCustomSurfaceColors ? ',' : ''}{'\n'}
                            </>
                        )}
                        {config.useCustomSurfaceColors && (
                            <>
                            {'      '}surface: {'{\n'}
                            {'        '}background: <StringVal>'{config.surfaceBackgroundColor}'</StringVal>,{'\n'}
                            {'        '}foreground: <StringVal>'{config.surfaceForegroundColor}'</StringVal>{'\n'}
                            {'      }'}{config.useCustomIconColor || config.useCustomUserMessageColors ? ',' : ''}{'\n'}
                            </>
                        )}
                        {config.useCustomIconColor && (
                            <>
                            {'      '}icon: <StringVal>'{config.customIconColor}'</StringVal>{config.useCustomUserMessageColors ? ',' : ''}{'\n'}
                            </>
                        )}
                        {config.useCustomUserMessageColors && (
                             <>
                            {'      '}userMessage: {'{\n'}
                            {'        '}text: <StringVal>'{config.customUserMessageTextColor}'</StringVal>,{'\n'}
                            {'        '}background: <StringVal>'{config.customUserMessageBackgroundColor}'</StringVal>{'\n'}
                            {'      }'}{'\n'}
                            </>
                        )}
                        {'    }'},{'\n'}
                    </>
                )}

                {'    '}typography: {'{\n'}
                {'      '}baseSize: <NumberVal>{config.fontSize}</NumberVal>,{'\n'}
                {'      '}fontFamily: <StringVal>'{config.fontFamily === "OpenAI Sans" ? "OpenAI Sans" : config.fontFamily}'</StringVal>,{'\n'}
                
                {config.useCustomFont && config.customFontName && (
                    <>
                    {'      '}customFont: {'{\n'}
                    {'        '}name: <StringVal>'{config.customFontName}'</StringVal>,{'\n'}
                    {'        '}css: <StringVal>`{config.customFontCss}`</StringVal>{'\n'}
                    {'      }'},{'\n'}
                    </>
                )}

                {'      '}<Comment>// ...and more typography settings</Comment>{'\n'}
                {'    '}{'}'},{'\n'}
                {'    '}ui: {'{\n'}
                {'      '}greeting: <StringVal>"{config.greeting}"</StringVal>,{'\n'}
                {'      '}starterPrompts: [{'\n'}
                {config.starterPrompts.map(p => `        { label: "${p.label}", icon: "${p.icon}" },`).join('\n')}
                {'\n'}
                {'      '}]{'\n'}
                {'    '}{'}'}{'\n'}
                {'  }'}{'\n'}
                {'}'};
              </code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};