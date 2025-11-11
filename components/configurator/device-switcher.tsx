'use client';

/**
 * Device Switcher Component
 *
 * Allows users to switch between device modes for responsive preview.
 * Supports desktop, tablet, and mobile viewport sizes.
 *
 * Features:
 * - Three device modes with custom dimensions
 * - Visual icons for each device type
 * - Active state highlighting
 * - Tooltip with dimensions
 */

import { usePreviewStore, DeviceMode, DEVICE_MODES } from '@/stores/preview-store';
import { Button } from '@/components/ui/button';
import { Monitor, Tablet, Smartphone } from 'lucide-react';

/**
 * Device configuration with icons
 */
const DEVICE_CONFIG: Record<DeviceMode, { icon: any; label: string }> = {
  desktop: {
    icon: Monitor,
    label: 'Desktop',
  },
  tablet: {
    icon: Tablet,
    label: 'Tablet',
  },
  mobile: {
    icon: Smartphone,
    label: 'Mobile',
  },
};

interface DeviceSwitcherProps {
  className?: string;
}

/**
 * Device switcher component
 *
 * Renders device mode toggle buttons with icons
 */
export function DeviceSwitcher({ className = '' }: DeviceSwitcherProps) {
  const { deviceMode, setDeviceMode } = usePreviewStore();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm font-medium text-muted-foreground mr-2">
        Device:
      </span>

      {Object.entries(DEVICE_CONFIG).map(([mode, config]) => {
        const Icon = config.icon;
        const dimensions = DEVICE_MODES[mode as DeviceMode];
        const isActive = deviceMode === mode;

        return (
          <Button
            key={mode}
            variant={isActive ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDeviceMode(mode as DeviceMode)}
            className="flex items-center gap-2"
            title={`${config.label} (${dimensions.width} × ${dimensions.height})`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{config.label}</span>
          </Button>
        );
      })}
    </div>
  );
}
