'use client';

import React from 'react';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export const Switch: React.FC<SwitchProps> = ({ checked, onChange, label, disabled = false }) => {
  return (
    <div className="flex items-center justify-between py-2">
      {label && <span className="text-sm text-muted-foreground font-medium">{label}</span>}
      <button
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`
          relative inline-flex h-[19px] w-8 flex-shrink-0 cursor-pointer rounded-full
          transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/50
          ${checked ? 'bg-primary' : 'bg-muted'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <span
          aria-hidden="true"
          className={`
            pointer-events-none inline-block h-[15px] w-[15px] transform rounded-full
            bg-white shadow-sm ring-0 transition duration-200 ease-in-out
            ${checked ? 'translate-x-[13px]' : 'translate-x-[2px]'}
            mt-[2px]
          `}
        />
      </button>
    </div>
  );
};
