

import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { PreviewCanvas } from './components/PreviewCanvas';
import { WidgetConfig } from './types';
import { CodeModal } from './components/CodeModal';

export const INITIAL_CONFIG: WidgetConfig = {
  themeMode: 'light',
  useAccent: false,
  accentColor: '#b22e2e',
  useTintedGrayscale: false,
  tintHue: 0,
  tintLevel: 6,
  shadeLevel: 3,
  useCustomSurfaceColors: false,
  surfaceBackgroundColor: '#c96e6e',
  surfaceForegroundColor: '#815656',
  useCustomTextColor: false,
  customTextColor: '#111827',
  
  useCustomIconColor: false,
  customIconColor: '#6b7280',
  useCustomUserMessageColors: false,
  customUserMessageTextColor: '#ffffff',
  customUserMessageBackgroundColor: '#b22e2e',
  
  fontFamily: 'Inter',
  fontSize: 16,
  useCustomFont: false,
  customFontName: '',
  customFontCss: '',
  
  radius: 'large',
  density: 'normal',
  
  greeting: 'What can I help with today?',
  starterPrompts: [
    { label: "What is ChatKit?", icon: "help" },
    { label: "Show me an example widget", icon: "box" },
    { label: "What can I customize?", icon: "sparkles" },
    { label: "How do I use client side tools?", icon: "pen" },
    { label: "Server side tools", icon: "server" },
  ],
  
  placeholder: 'Message the AI',
  disclaimer: 'AI can make mistakes',
  enableAttachments: true,
  enableModelPicker: true,

  enableN8n: false,
  n8nWebhookUrl: '',
  enableAgentKit: false,
  agentKitWorkflowId: '',
  agentKitApiKey: '',
};

function App() {
  const [config, setConfig] = useState<WidgetConfig>(INITIAL_CONFIG);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);

  const handleReset = () => {
    setConfig(INITIAL_CONFIG);
  };
  
  const isDark = config.themeMode === 'dark';

  return (
    <div className={`flex h-screen w-full overflow-hidden font-sans selection:bg-blue-500/30 transition-colors duration-300 ${isDark ? 'bg-[#181818] text-[#e5e5e5]' : 'bg-gray-50 text-neutral-900'}`}>
      <Sidebar 
        config={config} 
        onChange={setConfig} 
        onReset={handleReset} 
        onOpenCode={() => setIsCodeModalOpen(true)}
      />
      <PreviewCanvas config={config} />
      <CodeModal 
        config={config} 
        isOpen={isCodeModalOpen} 
        onClose={() => setIsCodeModalOpen(false)} 
      />
    </div>
  );
}

export default App;