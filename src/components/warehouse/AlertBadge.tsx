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
      label: 'Low Stock',
      icon: TrendingDown,
      className: 'bg-red-100 text-red-800 border-red-200'
    },
    over_ipow_delivered: {
      label: 'Over IPOW Delivered',
      icon: TrendingUp,
      className: 'bg-orange-100 text-orange-800 border-orange-200'
    },
    over_ipow_utilized: {
      label: 'Over IPOW Utilized',
      icon: AlertTriangle,
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    }
  };

  const { label, icon: Icon, className } = config[type];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border ${className}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

