'use client';

import React from 'react';

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange, label }) => {
  return (
    <div className="flex items-center justify-between gap-3">
      {label && <div className="text-sm text-muted-foreground">{label}</div>}
      <div className="flex items-center gap-2">
        <div className="relative flex items-center justify-center">
          <div
            className="w-6 h-6 rounded-[4px] border border-border shadow-sm"
            style={{ backgroundColor: value }}
          />
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-24 uppercase bg-transparent border border-border rounded-md px-2 py-1 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
        />
      </div>
    </div>
  );
};
