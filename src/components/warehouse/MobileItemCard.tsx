"use client";

import React from 'react';
import { AlertBadge } from './AlertBadge';

interface StockItem {
  wbs: string;
  itemName: string;
  ipowQty: number;
  delivered: number;
  utilized: number;
  runningBalance: number;
  totalCost?: number;
  runningTotal?: number;
  variance?: number;
}

interface MobileItemCardProps {
  item: StockItem;
}

export function MobileItemCard({ item }: MobileItemCardProps) {
  const isLowStock = item.runningBalance < (item.ipowQty * 0.1);
  const isOverIPOWDelivered = item.delivered > item.ipowQty;
  const isOverIPOWUtilized = item.utilized > item.ipowQty;

  return (
    <div className="glass-card">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="text-xs font-mono text-arsd-secondary mb-1">{item.wbs}</div>
            <h3 className="font-semibold text-arsd-primary text-sm sm:text-base">
              {item.itemName}
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
            <div className="font-semibold text-gray-800">{item.ipowQty.toLocaleString()}</div>
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
              {item.runningBalance.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

