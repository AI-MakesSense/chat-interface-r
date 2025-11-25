import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export const AccordionItem: React.FC<AccordionItemProps> = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-app-border">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between py-4 px-1 text-left hover:bg-white/5 transition-colors rounded-sm"
      >
        <span className="text-sm font-medium text-neutral-200">{title}</span>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-neutral-500" />
        ) : (
          <ChevronRight className="h-4 w-4 text-neutral-500" />
        )}
      </button>
      {isOpen && <div className="pb-4 px-1">{children}</div>}
    </div>
  );
};
