"use client";

import React from 'react';
import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

type AlertType = 'low_stock' | 'over_ipow_delivered' | 'over_ipow_utilized';

interface AlertBadgeProps {
  type: AlertType;
}

export function AlertBadge({ type }: AlertBadgeProps) {
  const config = {
    low_stock: {
      label: 'Low stock',
      icon: TrendingDown,
      className:
        'bg-destructive/5 text-destructive border-destructive/30',
    },
    over_ipow_delivered: {
      label: 'Over IPOW delivered',
      icon: TrendingUp,
      className:
        'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50',
    },
    over_ipow_utilized: {
      label: 'Over IPOW utilized',
      icon: AlertTriangle,
      className:
        'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50',
    },
  };

  const { label, icon: Icon, className } = config[type];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border ${className}`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}
