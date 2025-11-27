"use client";

import React from 'react';
import { ARSDCard } from './ARSDCard';
import { X } from 'lucide-react';

export interface ItemEntry {
  itemDescription: string;
  qty: number;
  qtyInPO?: number;
  unit: string;
}

interface ItemsRepeaterProps {
  items: ItemEntry[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: keyof ItemEntry, value: string | number) => void;
  showPOQty?: boolean;
}

export function ItemsRepeater({ items, onAdd, onRemove, onUpdate, showPOQty = false }: ItemsRepeaterProps) {
  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <ARSDCard key={index} className="relative">
          <button
            onClick={() => onRemove(index)}
            className="absolute top-3 right-3 p-1 rounded-full hover:bg-red-100 text-red-600 transition-colors mobile-touch-target"
            aria-label="Remove item"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="space-y-3 pr-8">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Item Description
              </label>
              <input
                type="text"
                value={item.itemDescription}
                onChange={(e) => onUpdate(index, 'itemDescription', e.target.value)}
                className="mobile-form-input w-full"
                placeholder="Enter item description"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {showPOQty ? 'Qty in DR' : 'Quantity'}
                </label>
                <input
                  type="number"
                  value={item.qty}
                  onChange={(e) => onUpdate(index, 'qty', parseFloat(e.target.value) || 0)}
                  className="mobile-form-input w-full"
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
              </div>

              {showPOQty && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Qty in PO
                  </label>
                  <input
                    type="number"
                    value={item.qtyInPO || 0}
                    onChange={(e) => onUpdate(index, 'qtyInPO', parseFloat(e.target.value) || 0)}
                    className="mobile-form-input w-full"
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>
              )}

              <div className={showPOQty ? 'col-span-2' : ''}>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Unit
                </label>
                <select
                  value={item.unit}
                  onChange={(e) => onUpdate(index, 'unit', e.target.value)}
                  className="mobile-form-input w-full"
                >
                  <option value="kg">kg</option>
                  <option value="bags">bags</option>
                  <option value="cu.m">cu.m</option>
                  <option value="tons">tons</option>
                  <option value="pcs">pcs</option>
                  <option value="sq.m">sq.m</option>
                </select>
              </div>
            </div>
          </div>
        </ARSDCard>
      ))}

      <button
        onClick={onAdd}
        className="w-full glass-button text-arsd-primary border-dashed border-2 border-red-300/50 hover:border-red-400/70 mobile-button"
      >
        + Add Item
      </button>
    </div>
  );
}

