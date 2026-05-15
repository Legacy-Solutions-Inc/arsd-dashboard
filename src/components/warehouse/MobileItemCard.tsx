"use client";

import React from 'react';
import { AlertBadge } from './AlertBadge';

interface StockItem {
  wbs: string | null;
  item_description: string;
  resource?: string | null;
  ipow_qty: number;
  delivered: number;
  utilized: number;
  running_balance: number;
  total_cost?: number;
  variance?: number;
  po?: number;
  undelivered?: number;
}

interface MobileItemCardProps {
  item: StockItem;
  isWarehouseman?: boolean;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground tabular-nums">{value}</p>
    </div>
  );
}

function StatVariance({ value }: { value: number }) {
  const color = value > 0 ? 'text-orange-600' : value < 0 ? 'text-blue-600' : 'text-foreground';
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Variance</p>
      <p className={`text-sm font-semibold tabular-nums ${color}`}>
        {value > 0 ? '+' : ''}{value.toLocaleString()}
      </p>
    </div>
  );
}

export function MobileItemCard({ item, isWarehouseman = false }: MobileItemCardProps) {
  const isLowStock = item.running_balance < (item.ipow_qty * 0.1);
  const isOverIPOWDelivered = item.delivered > item.ipow_qty;
  const isOverIPOWUtilized = item.utilized > item.ipow_qty;

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-xs space-y-3">

      {/* Header: WBS pill + description + resource + alert badges */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0 space-y-1">
          {item.wbs && (
            <span className="inline-block font-mono text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
              {item.wbs}
            </span>
          )}
          <p className="text-sm font-semibold text-foreground leading-snug">{item.item_description}</p>
          {item.resource && (
            <p className="text-xs text-muted-foreground">{item.resource}</p>
          )}
        </div>
        {(isLowStock || isOverIPOWDelivered || isOverIPOWUtilized) && (
          <div className="flex flex-wrap gap-1 shrink-0">
            {isLowStock && <AlertBadge type="low_stock" />}
            {isOverIPOWDelivered && <AlertBadge type="over_ipow_delivered" />}
            {isOverIPOWUtilized && <AlertBadge type="over_ipow_utilized" />}
          </div>
        )}
      </div>

      {/* Running balance alert bar — only when low stock */}
      {isLowStock && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 flex items-center justify-between">
          <span className="text-xs font-medium text-destructive">Running Balance</span>
          <span className="text-sm font-bold text-destructive tabular-nums">
            {item.running_balance.toLocaleString()}
          </span>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
        {!isWarehouseman && (
          <Stat label="IPOW Qty" value={item.ipow_qty.toLocaleString()} />
        )}
        {!isWarehouseman && item.total_cost != null && (
          <Stat label="Total IPOW Cost" value={"₱" + item.total_cost.toLocaleString()} />
        )}
        <Stat label="PO" value={(item.po ?? 0).toLocaleString()} />
        <Stat label="Undelivered" value={(item.undelivered ?? ((item.po ?? 0) - item.delivered)).toLocaleString()} />
        <Stat label="Delivered" value={item.delivered.toLocaleString()} />
        <Stat label="Utilized" value={item.utilized.toLocaleString()} />
        {!isLowStock && (
          <Stat label="Running Balance" value={item.running_balance.toLocaleString()} />
        )}
        {!isWarehouseman && item.variance != null && (
          <StatVariance value={item.variance} />
        )}
      </div>

    </div>
  );
}
