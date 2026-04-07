'use client';

import React from 'react';

interface SliderProps {
  value: number;
  max: number;
  min?: number;
  onChange: (value: number) => void;
  gradient?: boolean;
  label?: string;
  showValue?: boolean;
  unit?: string;
}

export const Slider: React.FC<SliderProps> = ({
  value,
  max,
  min = 0,
  onChange,
  gradient = false,
  label,
  showValue = false,
  unit = ''
}) => {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="flex items-center gap-3 w-full">
      {label && <div className="text-sm text-muted-foreground w-12 shrink-0">{label}</div>}

      <div className="flex-1 h-6 flex items-center group relative">
        <input
          type="range"
          min={min}
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
              : 'hsl(var(--muted))'
          }}
        >
          {!gradient && (
            <div
              className="absolute top-0 left-0 h-full rounded-full bg-foreground"
              style={{ width: `${percentage}%` }}
            />
          )}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md border border-black/10 transition-transform duration-100 ease-out"
            style={{ left: `calc(${percentage}% - 8px)` }}
          />
        </div>
      </div>

      {showValue && (
        <div className="w-8 text-right text-sm text-muted-foreground shrink-0">
          {value}{unit}
        </div>
      )}
    </div>
  );
};
