"use client";

import React from 'react';
import { Lock, Unlock } from 'lucide-react';

interface BadgeStatusProps {
  locked: boolean;
}

export function BadgeStatus({ locked }: BadgeStatusProps) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border ${
      locked
        ? 'bg-green-100 text-green-800 border-green-200'
        : 'bg-yellow-100 text-yellow-800 border-yellow-200'
    }`}>
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

