"use client";

import React from 'react';
import { Lock, Unlock } from 'lucide-react';

interface BadgeStatusProps {
  locked: boolean;
}

export function BadgeStatus({ locked }: BadgeStatusProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border ${
        locked
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50'
          : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50'
      }`}
    >
      {locked ? (
        <>
          <Lock className="h-3 w-3" />
          Locked
        </>
      ) : (
        <>
          <Unlock className="h-3 w-3" />
          Unlocked
        </>
      )}
    </span>
  );
}
