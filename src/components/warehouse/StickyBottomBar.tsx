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
  secondaryDisabled = false
}: StickyBottomBarProps) {
  return (
    <div className="sticky bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-red-200/30 shadow-xl">
      <div className="w-full mx-4 sm:mx-6 lg:mx-8 py-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button
            onClick={onSecondary}
            disabled={secondaryDisabled}
            className="mobile-button btn-arsd-outline flex-1 sm:flex-none sm:min-w-[120px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {secondaryLabel}
          </button>
          <button
            onClick={onPrimary}
            disabled={primaryDisabled}
            className="mobile-button btn-arsd-primary flex-1 sm:flex-none sm:min-w-[180px] px-6 py-3 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            <Send className="h-4 w-4 sm:h-5 sm:w-5" />
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

