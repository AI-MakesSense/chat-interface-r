

import React, { useState, useRef, useEffect } from 'react';
import { WidgetConfig } from '../types';
import { 
    Code, 
    HelpCircle, 
    Box, 
    Sparkles, 
    PenTool, 
    Server, 
    Zap, 
    Image, 
    Terminal, 
    Flag, 
    Heart, 
    MessageCircle,
    ChevronDown,
    Save,
    Rocket,
    Lightbulb,
    Search,
    Globe,
    Cpu,
    Database,
    Wrench,
    Compass,
    MapPin,
    Camera,
    Mic,
    BookOpen,
    Briefcase,
    Coffee,
    Cloud,
    Shield,
    Bell,
    Calendar,
    Clock,
    Gift,
    CreditCard,
    User,
    Phone
} from 'lucide-react';

interface SidebarProps {
  config: WidgetConfig;
  onChange: (config: WidgetConfig) => void;
  onReset: () => void;
  onOpenCode: () => void;
}

const FONT_OPTIONS = [
    'Inter', 
    'Roboto', 
    'Open Sans', 
    'Lato', 
    'Montserrat', 
    'Poppins', 
    'Space Grotesk', 
    'Comfortaa', 
    'Bricolage Grotesque',
    'OpenAI Sans', 
    'System'
];

const RADIUS_OPTIONS = ['none', 'small', 'medium', 'large', 'pill'];
const DENSITY_OPTIONS = ['compact', 'normal', 'spacious'];

const HelpIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" height="1em" fill="currentColor" viewBox="0 0 24 24" style={{ width: 14, height: 14, opacity: 0.4 }}>
        <path d="M13 12a1 1 0 1 0-2 0v4a1 1 0 1 0 2 0v-4Zm-1-2.5A1.25 1.25 0 1 0 12 7a1.25 1.25 0 0 0 0 2.5Z"></path>
        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2ZM4 12a8 8 0 1 1 16 0 8 8 0 0 1-16 0Z" clipRule="evenodd"></path>
    </svg>
);

// --- Components ---

const Section = ({ children, className = "", isDark }: { children?: React.ReactNode; className?: string, isDark: boolean }) => (
    <div className={`p-4 border-b ${isDark ? 'border-[#ffffff0f]' : 'border-neutral-100'} ${className}`}>{children}</div>
);

const Row = ({ children, className = "" }: { children?: React.ReactNode; className?: string }) => (
    <div className={`flex items-center justify-between gap-3 ${className}`}>{children}</div>
);

const Label = ({ children, icon = true, isDark }: { children?: React.ReactNode; icon?: boolean, isDark: boolean }) => (
    <div className={`flex items-center font-semibold text-sm cursor-pointer select-none ${isDark ? 'text-[#e5e5e5]' : 'text-neutral-900'}`}>
        {children}
        {icon && <div className={`ml-2 flex items-center ${isDark ? 'text-[#dcdcdc]' : 'text-neutral-400'}`}><HelpIcon /></div>}
    </div>
);

const Toggle = ({ checked, onChange, isDark }: { checked: boolean; onChange: (v: boolean) => void, isDark: boolean }) => (
    <button 
        onClick={() => onChange(!checked)}
        className={`relative w-8 h-[19px] rounded-full transition-colors duration-200 ease-in-out ${checked ? (isDark ? 'bg-[#0285FF]' : 'bg-blue-600') : (isDark ? 'bg-[#414141]' : 'bg-neutral-200')}`}
    >
        <span 
            className={`absolute top-[2px] left-[2px] w-[15px] h-[15px] bg-white rounded-full shadow-sm transition-transform duration-200 ease-in-out ${checked ? 'translate-x-[13px]' : 'translate-x-0'}
            `} 
        />
    </button>
);

const Slider = ({ value, max, onChange, gradient = false, isDark }: { value: number, max: number, onChange: (v: number) => void, gradient?: boolean, isDark: boolean }) => {
    return (
        <div className="flex-1 h-6 flex items-center group relative">
            <input
                type="range"
                min="0"
                max={max}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div 
                className="w-full h-1 rounded-full relative"
                style={{ 
                    background: gradient 
                        ? 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)' 
                        : (isDark ? '#404040' : '#e5e7eb')
                }}
            >
                {!gradient && (
                    <div 
                        className={`absolute top-0 left-0 h-full rounded-full ${isDark ? 'bg-[#e5e5e5]' : 'bg-neutral-800'}`}
                        style={{ width: `${(value / max) * 100}%` }}
                    />
                )}
                <div 
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md border border-black/10 transition-transform duration-100 ease-out"
                    style={{ left: `calc(${(value / max) * 100}% - 8px)` }}
                />
            </div>
        </div>
    );
};

const SelectValue = ({ value, isDark }: { value: string | number, isDark: boolean }) => (
    <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-[#afafaf]' : 'text-neutral-500'}`}>
        <span className="truncate max-w-[100px]">{value}</span>
        <div className="rotate-180 opacity-75">
             <svg width="8" height="12" viewBox="0 0 10 16" fill="currentColor" className="opacity-75"><path fillRule="evenodd" clipRule="evenodd" d="M4.34151 0.747423C4.71854 0.417526 5.28149 0.417526 5.65852 0.747423L9.65852 4.24742C10.0742 4.61111 10.1163 5.24287 9.75259 5.6585C9.38891 6.07414 8.75715 6.11626 8.34151 5.75258L5.00001 2.82877L1.65852 5.75258C1.24288 6.11626 0.61112 6.07414 0.247438 5.6585C-0.116244 5.24287 -0.0741267 4.61111 0.34151 4.24742L4.34151 0.747423ZM0.246065 10.3578C0.608879 9.94139 1.24055 9.89795 1.65695 10.2608L5.00001 13.1737L8.34308 10.2608C8.75948 9.89795 9.39115 9.94139 9.75396 10.3578C10.1168 10.7742 10.0733 11.4058 9.65695 11.7687L5.65695 15.2539C5.28043 15.582 4.7196 15.582 4.34308 15.2539L0.343082 11.7687C-0.0733128 11.4058 -0.116749 10.7742 0.246065 10.3578Z" /></svg>
        </div>
    </div>
);

// --- Icon System ---

const AVAILABLE_ICONS = [
    { id: 'help', icon: HelpCircle },
    { id: 'box', icon: Box },
    { id: 'sparkles', icon: Sparkles },
    { id: 'pen', icon: PenTool },
    { id: 'server', icon: Server },
    { id: 'zap', icon: Zap },
    { id: 'image', icon: Image },
    { id: 'terminal', icon: Terminal },
    { id: 'flag', icon: Flag },
    { id: 'heart', icon: Heart },
    { id: 'message', icon: MessageCircle },
    { id: 'rocket', icon: Rocket },
    { id: 'lightbulb', icon: Lightbulb },
    { id: 'search', icon: Search },
    { id: 'globe', icon: Globe },
    { id: 'cpu', icon: Cpu },
    { id: 'database', icon: Database },
    { id: 'wrench', icon: Wrench },
    { id: 'compass', icon: Compass },
    { id: 'mapPin', icon: MapPin },
    { id: 'camera', icon: Camera },
    { id: 'mic', icon: Mic },
    { id: 'book', icon: BookOpen },
    { id: 'briefcase', icon: Briefcase },
    { id: 'coffee', icon: Coffee },
    { id: 'cloud', icon: Cloud },
    { id: 'shield', icon: Shield },
    { id: 'bell', icon: Bell },
    { id: 'calendar', icon: Calendar },
    { id: 'clock', icon: Clock },
    { id: 'gift', icon: Gift },
    { id: 'creditCard', icon: CreditCard },
    { id: 'user', icon: User },
    { id: 'phone', icon: Phone },
];

const IconPicker = ({ value, onChange, isDark }: { value: string, onChange: (val: string) => void, isDark: boolean }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const SelectedIcon = AVAILABLE_ICONS.find(i => i.id === value)?.icon || HelpCircle;

    useEffect(() => {
        const handleOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleOutside);
        return () => document.removeEventListener('mousedown', handleOutside);
    }, []);

    const buttonClass = isDark 
        ? "bg-[#2a2a2a] border-[#ffffff1a] hover:border-white/40 text-[#afafaf]"
        : "bg-white border-neutral-200 hover:border-neutral-400 text-neutral-500";

    const dropdownClass = isDark
        ? "bg-[#1a1a1a] border-[#ffffff1a] text-[#afafaf]"
        : "bg-white border-neutral-200 text-neutral-600";
        
    const itemClass = (isSelected: boolean) => isDark
        ? (isSelected ? 'bg-white/20 text-white' : 'text-[#afafaf] hover:bg-white/10')
        : (isSelected ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-500 hover:bg-neutral-50');

    return (
        <div className="relative" ref={containerRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-8 h-8 flex items-center justify-center border rounded transition-colors ${buttonClass}`}
            >
                <SelectedIcon size={14} />
            </button>
            
            {isOpen && (
                <div className={`absolute top-full left-0 mt-1 w-[260px] border rounded-lg shadow-xl z-50 p-2 grid grid-cols-6 gap-1 max-h-[200px] overflow-y-auto custom-scrollbar ${dropdownClass}`}>
                    {AVAILABLE_ICONS.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => { onChange(item.id); setIsOpen(false); }}
                            className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${itemClass(value === item.id)}`}
                            title={item.id}
                        >
                            <item.icon size={14} />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export const Sidebar: React.FC<SidebarProps> = ({ config, onChange, onReset, onOpenCode }) => {
  const [customFontUrl, setCustomFontUrl] = useState(config.customFontCss || '');
  const [customFontName, setCustomFontName] = useState(config.customFontName || '');
  
  const isDark = config.themeMode === 'dark';

  // Dynamic Theme Classes
  const theme = {
      bg: isDark ? 'bg-[#212121]' : 'bg-white',
      border: isDark ? 'border-[#ffffff0f]' : 'border-neutral-200',
      text: isDark ? 'text-[#e5e5e5]' : 'text-neutral-900',
      textMuted: isDark ? 'text-[#afafaf]' : 'text-neutral-500',
      inputBg: isDark ? 'bg-[#212121]' : 'bg-white',
      inputBorder: isDark ? 'border-[#ffffff1a]' : 'border-neutral-200',
      hover: isDark ? 'hover:bg-white/10' : 'hover:bg-neutral-100',
      buttonIcon: isDark ? 'text-white' : 'text-neutral-600',
      buttonBg: isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-neutral-100 hover:bg-neutral-200',
  };

  const handleChange = (key: keyof WidgetConfig, value: any) => {
    onChange({ ...config, [key]: value });
  };

  const updatePrompt = (index: number, field: 'label' | 'icon', value: string) => {
      const newPrompts = [...config.starterPrompts];
      newPrompts[index] = { ...newPrompts[index], [field]: value };
      handleChange('starterPrompts', newPrompts);
  };

  const handlePromptCountChange = (count: number) => {
      let current = [...config.starterPrompts];
      if (count > current.length) {
          const toAdd = count - current.length;
          for (let i = 0; i < toAdd; i++) {
              current.push({ label: 'New prompt', icon: 'message' });
          }
      } else if (count < current.length) {
          current = current.slice(0, count);
      }
      handleChange('starterPrompts', current);
  };

  const handleSaveCustomFont = () => {
      if (customFontUrl && customFontName) {
          onChange({
              ...config,
              customFontCss: customFontUrl,
              customFontName: customFontName,
              fontFamily: customFontName
          });
      }
  };

  const handleToggleCustomFont = (enabled: boolean) => {
      onChange({
          ...config,
          useCustomFont: enabled,
          fontFamily: (!enabled && config.fontFamily === config.customFontName) ? 'Inter' : config.fontFamily
      });
  };
  
  const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
      <input 
          {...props} 
          className={`bg-transparent border rounded-md px-2 py-1 text-sm focus:outline-none focus:border-blue-500 transition-colors ${theme.text} ${theme.inputBorder} ${props.className || ''}`} 
      />
  );

  return (
    <aside className={`w-[380px] flex-shrink-0 flex flex-col h-full border-r text-sm select-none z-20 shadow-xl transition-colors duration-300 ${theme.bg} ${theme.border}`}>
      {/* Header */}
      <div className={`h-[60px] flex items-center justify-between px-3 border-b ${theme.border}`}>
        <div className={`flex items-center gap-2 px-2 ${theme.text}`}>
            <span className="font-semibold text-lg">
                ChatInterface.ai
            </span>
        </div>
        <button 
            onClick={onOpenCode}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${theme.buttonBg} ${theme.buttonIcon}`}
            title="View Code"
        >
             <Code size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        
        {/* Color Scheme */}
        <Section isDark={isDark}>
            <Row>
                <div className={`font-semibold ${theme.text}`}>Color scheme</div>
                <div className={`p-0.5 rounded-md flex relative ${isDark ? 'bg-[#0D0D0D]' : 'bg-neutral-100'}`}>
                    {/* Animated background pill */}
                    <div 
                        className={`absolute top-[2px] bottom-[2px] rounded-[4px] transition-all duration-200 ease-in-out w-[calc(50%-4px)] shadow-sm ${isDark ? 'bg-[#303030]' : 'bg-white'}`}
                        style={{ left: config.themeMode === 'light' ? '2px' : 'calc(50% + 2px)' }}
                    />
                    <button 
                        onClick={() => handleChange('themeMode', 'light')}
                        className={`relative z-10 px-3 py-0.5 text-xs font-medium rounded-[4px] w-[50px] text-center transition-colors ${config.themeMode === 'light' ? (isDark ? 'text-[#afafaf]' : 'text-neutral-900') : (isDark ? 'text-white' : 'text-neutral-500')}`}
                    >
                        Light
                    </button>
                    <button 
                        onClick={() => handleChange('themeMode', 'dark')}
                        className={`relative z-10 px-3 py-0.5 text-xs font-medium rounded-[4px] w-[50px] text-center transition-colors ${config.themeMode === 'dark' ? (isDark ? 'text-white' : 'text-neutral-900') : (isDark ? 'text-[#afafaf]' : 'text-neutral-500')}`}
                    >
                        Dark
                    </button>
                </div>
            </Row>
        </Section>

        {/* Toggles */}
        <Section isDark={isDark}>
            <Row className={config.useAccent ? "mb-0" : "mb-4"}>
                <Label isDark={isDark}>Accent</Label>
                <Toggle checked={config.useAccent} onChange={(v) => handleChange('useAccent', v)} isDark={isDark} />
            </Row>
            {config.useAccent && (
                <Row className="mt-3 mb-4 pl-0 animate-in slide-in-from-top-2 fade-in duration-200">
                    <div className={theme.textMuted}>Color</div>
                    <div className="flex items-center gap-2">
                        <div className="relative flex items-center justify-center">
                            <div 
                                className={`w-6 h-6 rounded-[4px] border shadow-sm ${isDark ? 'border-white/10' : 'border-black/10'}`}
                                style={{ backgroundColor: config.accentColor }}
                            />
                            <input 
                                type="color" 
                                value={config.accentColor}
                                onChange={(e) => handleChange('accentColor', e.target.value)}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                        </div>
                        <Input 
                            type="text" 
                            value={config.accentColor}
                            onChange={(e) => handleChange('accentColor', e.target.value)}
                            className="w-24 uppercase"
                        />
                    </div>
                </Row>
            )}

            <Row className={config.useTintedGrayscale ? "mb-0" : "mb-4"}>
                <Label isDark={isDark}>Tinted grayscale</Label>
                <Toggle checked={config.useTintedGrayscale} onChange={(v) => handleChange('useTintedGrayscale', v)} isDark={isDark} />
            </Row>
            
            {config.useTintedGrayscale && (
                <div className="animate-in slide-in-from-top-2 fade-in duration-200 space-y-4 mt-4 mb-2">
                    <Row>
                        <div className={`w-12 ${theme.textMuted}`}>Hue</div>
                        <Slider 
                            value={config.tintHue} 
                            max={360} 
                            onChange={(v) => handleChange('tintHue', v)} 
                            gradient
                            isDark={isDark}
                        />
                        <div className={`w-6 text-right ${theme.textMuted}`}>{config.tintHue}°</div>
                    </Row>
                    <Row>
                        <div className={`w-12 ${theme.textMuted}`}>Tint</div>
                         <Slider 
                            value={config.tintLevel} 
                            max={20} 
                            onChange={(v) => handleChange('tintLevel', v)}
                            isDark={isDark}
                        />
                        <div className={`w-6 text-right ${theme.textMuted}`}>{config.tintLevel}</div>
                    </Row>
                    <Row>
                        <div className={`w-12 ${theme.textMuted}`}>Shade</div>
                         <Slider 
                            value={config.shadeLevel} 
                            max={20} 
                            onChange={(v) => handleChange('shadeLevel', v)} 
                            isDark={isDark}
                        />
                        <div className={`w-6 text-right ${theme.textMuted}`}>{config.shadeLevel}</div>
                    </Row>
                </div>
            )}

            <Row className={config.useCustomSurfaceColors ? "mb-0" : "mt-4"}>
                <Label isDark={isDark}>Custom surface colors</Label>
                <Toggle checked={config.useCustomSurfaceColors} onChange={(v) => handleChange('useCustomSurfaceColors', v)} isDark={isDark} />
            </Row>

            {config.useCustomSurfaceColors && (
                <div className="animate-in slide-in-from-top-2 fade-in duration-200 space-y-4 mt-4">
                     <Row>
                        <div className={theme.textMuted}>Surface background</div>
                        <div className="flex items-center gap-2">
                            <div className="relative flex items-center justify-center">
                                <div 
                                    className={`w-6 h-6 rounded-[4px] border shadow-sm ${isDark ? 'border-white/10' : 'border-black/10'}`}
                                    style={{ backgroundColor: config.surfaceBackgroundColor }}
                                />
                                <input 
                                    type="color" 
                                    value={config.surfaceBackgroundColor}
                                    onChange={(e) => handleChange('surfaceBackgroundColor', e.target.value)}
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                />
                            </div>
                            <Input 
                                type="text" 
                                value={config.surfaceBackgroundColor}
                                onChange={(e) => handleChange('surfaceBackgroundColor', e.target.value)}
                                className="w-24 uppercase"
                            />
                        </div>
                    </Row>
                    <Row>
                        <div className={theme.textMuted}>Surface foreground</div>
                        <div className="flex items-center gap-2">
                            <div className="relative flex items-center justify-center">
                                <div 
                                    className={`w-6 h-6 rounded-[4px] border shadow-sm ${isDark ? 'border-white/10' : 'border-black/10'}`}
                                    style={{ backgroundColor: config.surfaceForegroundColor }}
                                />
                                <input 
                                    type="color" 
                                    value={config.surfaceForegroundColor}
                                    onChange={(e) => handleChange('surfaceForegroundColor', e.target.value)}
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                />
                            </div>
                            <Input 
                                type="text" 
                                value={config.surfaceForegroundColor}
                                onChange={(e) => handleChange('surfaceForegroundColor', e.target.value)}
                                className="w-24 uppercase"
                            />
                        </div>
                    </Row>
                </div>
            )}

            <Row className={config.useCustomTextColor ? "mb-0" : "mt-4"}>
                <Label isDark={isDark}>Custom text color</Label>
                <Toggle checked={config.useCustomTextColor} onChange={(v) => handleChange('useCustomTextColor', v)} isDark={isDark} />
            </Row>
            
            {config.useCustomTextColor && (
                <div className="animate-in slide-in-from-top-2 fade-in duration-200 mt-4">
                    <Row>
                        <div className={theme.textMuted}>Text color</div>
                        <div className="flex items-center gap-2">
                            <div className="relative flex items-center justify-center">
                                <div 
                                    className={`w-6 h-6 rounded-[4px] border shadow-sm ${isDark ? 'border-white/10' : 'border-black/10'}`}
                                    style={{ backgroundColor: config.customTextColor }}
                                />
                                <input 
                                    type="color" 
                                    value={config.customTextColor}
                                    onChange={(e) => handleChange('customTextColor', e.target.value)}
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                />
                            </div>
                            <Input 
                                type="text" 
                                value={config.customTextColor}
                                onChange={(e) => handleChange('customTextColor', e.target.value)}
                                className="w-24 uppercase"
                            />
                        </div>
                    </Row>
                </div>
            )}
            
            {/* Custom Icon Color */}
            <Row className={config.useCustomIconColor ? "mb-0" : "mt-4"}>
                <Label isDark={isDark}>Custom icon color</Label>
                <Toggle checked={config.useCustomIconColor} onChange={(v) => handleChange('useCustomIconColor', v)} isDark={isDark} />
            </Row>
            
            {config.useCustomIconColor && (
                <div className="animate-in slide-in-from-top-2 fade-in duration-200 mt-4">
                    <Row>
                        <div className={theme.textMuted}>Icon color</div>
                        <div className="flex items-center gap-2">
                            <div className="relative flex items-center justify-center">
                                <div 
                                    className={`w-6 h-6 rounded-[4px] border shadow-sm ${isDark ? 'border-white/10' : 'border-black/10'}`}
                                    style={{ backgroundColor: config.customIconColor }}
                                />
                                <input 
                                    type="color" 
                                    value={config.customIconColor}
                                    onChange={(e) => handleChange('customIconColor', e.target.value)}
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                />
                            </div>
                            <Input 
                                type="text" 
                                value={config.customIconColor}
                                onChange={(e) => handleChange('customIconColor', e.target.value)}
                                className="w-24 uppercase"
                            />
                        </div>
                    </Row>
                </div>
            )}

            {/* User Message Colors */}
            <Row className={config.useCustomUserMessageColors ? "mb-0" : "mt-4"}>
                <Label isDark={isDark}>User message colors</Label>
                <Toggle checked={config.useCustomUserMessageColors} onChange={(v) => handleChange('useCustomUserMessageColors', v)} isDark={isDark} />
            </Row>
            
            {config.useCustomUserMessageColors && (
                <div className="animate-in slide-in-from-top-2 fade-in duration-200 mt-4 space-y-4">
                    <Row>
                        <div className={theme.textMuted}>Message Text</div>
                        <div className="flex items-center gap-2">
                            <div className="relative flex items-center justify-center">
                                <div 
                                    className={`w-6 h-6 rounded-[4px] border shadow-sm ${isDark ? 'border-white/10' : 'border-black/10'}`}
                                    style={{ backgroundColor: config.customUserMessageTextColor }}
                                />
                                <input 
                                    type="color" 
                                    value={config.customUserMessageTextColor}
                                    onChange={(e) => handleChange('customUserMessageTextColor', e.target.value)}
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                />
                            </div>
                            <Input 
                                type="text" 
                                value={config.customUserMessageTextColor}
                                onChange={(e) => handleChange('customUserMessageTextColor', e.target.value)}
                                className="w-24 uppercase"
                            />
                        </div>
                    </Row>
                    <Row>
                        <div className={theme.textMuted}>Message Background</div>
                        <div className="flex items-center gap-2">
                            <div className="relative flex items-center justify-center">
                                <div 
                                    className={`w-6 h-6 rounded-[4px] border shadow-sm ${isDark ? 'border-white/10' : 'border-black/10'}`}
                                    style={{ backgroundColor: config.customUserMessageBackgroundColor }}
                                />
                                <input 
                                    type="color" 
                                    value={config.customUserMessageBackgroundColor}
                                    onChange={(e) => handleChange('customUserMessageBackgroundColor', e.target.value)}
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                />
                            </div>
                            <Input 
                                type="text" 
                                value={config.customUserMessageBackgroundColor}
                                onChange={(e) => handleChange('customUserMessageBackgroundColor', e.target.value)}
                                className="w-24 uppercase"
                            />
                        </div>
                    </Row>
                </div>
            )}
        </Section>

        {/* Typography */}
        <Section isDark={isDark}>
            <Row className="mb-3">
                <Label isDark={isDark}>Typography</Label>
            </Row>
            <div className="space-y-3 pl-0">
                <Row>
                    <div className={theme.textMuted}>Font family</div>
                    <div className="relative">
                        <select 
                            value={config.fontFamily}
                            onChange={(e) => handleChange('fontFamily', e.target.value)}
                            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                        >
                            {FONT_OPTIONS.map(f => <option key={f} value={f} className="text-black">{f}</option>)}
                            {config.useCustomFont && config.customFontName && <option value={config.customFontName} className="text-black">{config.customFontName} (Custom)</option>}
                        </select>
                        <SelectValue value={config.fontFamily} isDark={isDark} />
                    </div>
                </Row>
                <Row>
                    <div className={theme.textMuted}>Font size</div>
                    <div className="relative">
                        <select 
                            value={config.fontSize}
                            onChange={(e) => handleChange('fontSize', Number(e.target.value))}
                            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                        >
                            <option value={14} className="text-black">14px</option>
                            <option value={16} className="text-black">16px</option>
                            <option value={18} className="text-black">18px</option>
                        </select>
                         <SelectValue value={`${config.fontSize}px`} isDark={isDark} />
                    </div>
                </Row>

                {/* Custom Font Toggle */}
                <Row className={config.useCustomFont ? "mt-4 mb-0" : "mt-4"}>
                    <Label isDark={isDark}>Custom font</Label>
                    <Toggle checked={config.useCustomFont} onChange={handleToggleCustomFont} isDark={isDark} />
                </Row>

                {/* Custom Font Importer */}
                {config.useCustomFont && (
                    <div className={`mt-4 pt-2 border-t animate-in slide-in-from-top-2 fade-in duration-200 ${theme.border}`}>
                        <div className={`text-xs font-semibold mb-2 ${theme.text}`}>Import Custom Font</div>
                        <div className="space-y-2">
                            <Input 
                                type="text" 
                                value={customFontUrl}
                                onChange={(e) => setCustomFontUrl(e.target.value)}
                                className="w-full"
                                placeholder="@import url('...');"
                            />
                            <div className="flex gap-2">
                                <Input 
                                    type="text" 
                                    value={customFontName}
                                    onChange={(e) => setCustomFontName(e.target.value)}
                                    className="flex-1"
                                    placeholder="Family Name (e.g. Satoshi)"
                                />
                                <button 
                                    onClick={handleSaveCustomFont}
                                    disabled={!customFontUrl || !customFontName}
                                    className="bg-blue-600 hover:bg-blue-500 text-white p-1.5 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    title="Save Custom Font"
                                >
                                    <Save size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Section>

        {/* Style */}
        <Section isDark={isDark}>
             <Row className="mb-3">
                <Label isDark={isDark}>Style</Label>
            </Row>
            <div className="space-y-3">
                <Row>
                    <div className={theme.textMuted}>Radius</div>
                    <div className="relative">
                        <select 
                            value={config.radius}
                            onChange={(e) => handleChange('radius', e.target.value)}
                            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                        >
                            {RADIUS_OPTIONS.map(r => <option key={r} value={r} className="text-black capitalize">{r}</option>)}
                        </select>
                        <SelectValue value={config.radius.charAt(0).toUpperCase() + config.radius.slice(1)} isDark={isDark} />
                    </div>
                </Row>
                <Row>
                    <div className={theme.textMuted}>Density</div>
                    <div className="relative">
                         <select 
                            value={config.density}
                            onChange={(e) => handleChange('density', e.target.value)}
                            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                        >
                            {DENSITY_OPTIONS.map(r => <option key={r} value={r} className="text-black capitalize">{r}</option>)}
                        </select>
                         <SelectValue value={config.density.charAt(0).toUpperCase() + config.density.slice(1)} isDark={isDark} />
                    </div>
                </Row>
            </div>
        </Section>

        {/* Start Screen */}
        <Section isDark={isDark}>
            <Row className="mb-3">
                <Label isDark={isDark}>Start screen</Label>
            </Row>
            <div className="space-y-4">
                <Row>
                    <div className={`${theme.textMuted} font-medium`}>Greeting</div>
                    <Input 
                        type="text" 
                        value={config.greeting}
                        onChange={(e) => handleChange('greeting', e.target.value)}
                        className="text-right w-40"
                    />
                </Row>
                
                {/* Prompts Count Slider */}
                <Row>
                    <div className={`${theme.textMuted} font-medium w-24`}>Prompts</div>
                    <Slider 
                        value={config.starterPrompts.length} 
                        max={5} 
                        onChange={handlePromptCountChange} 
                        isDark={isDark}
                    />
                    <div className={`w-6 text-right ${theme.textMuted}`}>{config.starterPrompts.length}</div>
                </Row>

                {/* Prompt List Editor */}
                {config.starterPrompts.length > 0 && (
                    <div className="space-y-2 mt-2">
                        {config.starterPrompts.map((prompt, index) => (
                            <div key={index} className="flex gap-2 animate-in slide-in-from-top-1 fade-in duration-200">
                                <IconPicker 
                                    value={prompt.icon} 
                                    onChange={(val) => updatePrompt(index, 'icon', val)}
                                    isDark={isDark}
                                />
                                <Input 
                                    type="text" 
                                    value={prompt.label}
                                    onChange={(e) => updatePrompt(index, 'label', e.target.value)}
                                    className="flex-1"
                                    placeholder="Prompt text..."
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Section>

        {/* Composer */}
        <Section isDark={isDark}>
            <Row className="mb-3">
                <Label isDark={isDark}>Composer</Label>
            </Row>
             <div className="space-y-3">
                <Row>
                    <div className={`${theme.textMuted} font-medium`}>Placeholder</div>
                    <Input 
                        type="text" 
                        value={config.placeholder}
                        onChange={(e) => handleChange('placeholder', e.target.value)}
                         className="text-right w-40"
                    />
                </Row>
                <Row>
                    <div className={`${theme.textMuted} font-medium`}>Disclaimer</div>
                    <Input 
                        type="text" 
                        value={config.disclaimer}
                        onChange={(e) => handleChange('disclaimer', e.target.value)}
                         className="text-right w-40"
                    />
                </Row>
                <Row>
                    <div className={`${theme.textMuted} font-medium`}>Attachments</div>
                    <Toggle checked={config.enableAttachments} onChange={(v) => handleChange('enableAttachments', v)} isDark={isDark} />
                </Row>
            </div>
        </Section>

        {/* Model Picker */}
        <Section isDark={isDark}>
            <Row>
                <Label isDark={isDark}>Model picker</Label>
                <Toggle checked={config.enableModelPicker} onChange={(v) => handleChange('enableModelPicker', v)} isDark={isDark} />
            </Row>
        </Section>

        {/* Connect */}
        <Section isDark={isDark}>
            <Row className="mb-3">
                <Label isDark={isDark}>Connect</Label>
            </Row>
            <div className="space-y-4">
                {/* n8n */}
                <div>
                    <Row>
                        <div className={`${theme.textMuted} font-medium`}>n8n</div>
                        <Toggle checked={config.enableN8n} onChange={(v) => handleChange('enableN8n', v)} isDark={isDark} />
                    </Row>
                    {config.enableN8n && (
                        <div className="mt-2 animate-in slide-in-from-top-1 fade-in duration-200">
                             <Input 
                                type="text" 
                                value={config.n8nWebhookUrl}
                                onChange={(e) => handleChange('n8nWebhookUrl', e.target.value)}
                                className="w-full"
                                placeholder="Webhook URL"
                            />
                        </div>
                    )}
                </div>

                {/* AgentKit */}
                <div>
                    <Row>
                        <div className={`${theme.textMuted} font-medium`}>AgentKit</div>
                        <Toggle checked={config.enableAgentKit} onChange={(v) => handleChange('enableAgentKit', v)} isDark={isDark} />
                    </Row>
                    {config.enableAgentKit && (
                        <div className="mt-2 space-y-2 animate-in slide-in-from-top-1 fade-in duration-200">
                             <Input 
                                type="text" 
                                value={config.agentKitWorkflowId}
                                onChange={(e) => handleChange('agentKitWorkflowId', e.target.value)}
                                className="w-full"
                                placeholder="Workflow ID"
                            />
                             <Input 
                                type="password" 
                                value={config.agentKitApiKey}
                                onChange={(e) => handleChange('agentKitApiKey', e.target.value)}
                                className="w-full"
                                placeholder="API Key"
                            />
                        </div>
                    )}
                </div>
            </div>
        </Section>
      </div>
    </aside>
  );
};