"use client";

import React from 'react';
import { Send } from 'lucide-react';

interface StickyBottomBarProps {
  primaryLabel: string;
  secondaryLabel: string;
  onPrimary: () => void;
  onSecondary: () => void;
  primaryDisabled?: boolean;
  secondaryDisabled?: boolean;
}

export function StickyBottomBar({
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  primaryDisabled = false,
  secondaryDisabled = false,
}: StickyBottomBarProps) {
  return (
    <div className="sticky bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg-tinted">
      <div className="w-full mx-4 sm:mx-6 lg:mx-8 py-3">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={onSecondary}
            disabled={secondaryDisabled}
            className="inline-flex items-center justify-center rounded-md border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-none sm:min-w-[120px]"
          >
            {secondaryLabel}
          </button>
          <button
            onClick={onPrimary}
            disabled={primaryDisabled}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-[hsl(var(--arsd-red-hover))] transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-none sm:min-w-[180px]"
          >
            <Send className="h-4 w-4" strokeWidth={1.75} />
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
