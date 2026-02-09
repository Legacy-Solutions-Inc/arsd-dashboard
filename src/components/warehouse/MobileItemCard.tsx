"use client";

import React from 'react';
import { AlertBadge } from './AlertBadge';

interface StockItem {
  wbs: string | null;
  item_description: string;
  ipow_qty: number;
  delivered: number;
  utilized: number;
  running_balance: number;
  total_cost?: number;
  variance?: number;
}

interface MobileItemCardProps {
  item: StockItem;
}

export function MobileItemCard({ item }: MobileItemCardProps) {
  const isLowStock = item.running_balance < (item.ipow_qty * 0.1);
  const isOverIPOWDelivered = item.delivered > item.ipow_qty;
  const isOverIPOWUtilized = item.utilized > item.ipow_qty;

  return (
    <div className="glass-card">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="text-xs font-mono text-arsd-secondary mb-1">{item.wbs ?? '–'}</div>
            <h3 className="font-semibold text-arsd-primary text-sm sm:text-base">
              {item.item_description}
            </h3>
          </div>
          <div className="flex flex-wrap gap-1 ml-2">
            {isLowStock && <AlertBadge type="low_stock" />}
            {isOverIPOWDelivered && <AlertBadge type="over_ipow_delivered" />}
            {isOverIPOWUtilized && <AlertBadge type="over_ipow_utilized" />}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
          <div>
            <div className="text-gray-500 mb-1">IPOW Qty</div>
            <div className="font-semibold text-gray-800">{item.ipow_qty.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-gray-500 mb-1">Delivered</div>
            <div className="font-semibold text-gray-800">{item.delivered.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-gray-500 mb-1">Utilized</div>
            <div className="font-semibold text-gray-800">{item.utilized.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-gray-500 mb-1">Running Balance</div>
            <div className={`font-bold ${isLowStock ? 'text-red-600' : 'text-gray-800'}`}>
              {item.running_balance.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

