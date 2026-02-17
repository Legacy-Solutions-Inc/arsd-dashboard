"use client";

import React, { useState, useCallback, useMemo } from 'react';
import { ARSDCard } from './ARSDCard';
import { X, List } from 'lucide-react';
import { IPOWItem } from '@/types/warehouse';

export interface ItemEntry {
  itemDescription: string;
  qty: number;
  qtyInPO?: number;
  unit: string;
  wbs?: string | null;
}

const DEFAULT_UNITS = ['kg', 'bags', 'cu.m', 'tons', 'pcs', 'sq.m', 'kgs.', 'EA'];

interface ItemsRepeaterProps {
  items: ItemEntry[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: keyof ItemEntry, value: string | number) => void;
  /**
   * When true, show a read-only "Total Qty in PO" column per item.
   * The value is looked up from PO totals using WBS + description when available,
   * and falls back to description-only for older items without WBS.
   */
  showPOQty?: boolean;
  /**
   * Map of `${wbs ?? 'null'}|${normalizedDescription}` -> total PO quantity.
   * This keeps Total Qty in PO tied to the specific WBS line.
   */
  poTotalsByKey?: Record<string, number>;
  /** Optional legacy map of normalized item description -> total PO quantity for that item */
  poTotalsByDescription?: Record<string, number>;
  /** When provided, show \"Fill from IPOW\" dropdown per row to pick description + unit from project IPOW */
  ipowItems?: IPOWItem[];
}

function formatQty(n: number): string {
  if (n === 0) return '';
  const s = String(n);
  return s.endsWith('.') ? s : s.replace(/\.?0+$/, '') || String(n);
}

function normalizeDescription(value: string): string {
  return value.trim().toLowerCase();
}

function makeKey(wbs: string | null | undefined, description: string): string {
  return `${wbs ?? 'null'}|${normalizeDescription(description)}`;
}

function getResourceForEntry(entry: ItemEntry, ipowItems: IPOWItem[]): string | null {
  if (!entry.itemDescription.trim() || ipowItems.length === 0) return null;
  const normDesc = normalizeDescription(entry.itemDescription);
  const byKey = ipowItems.find(
    (ip) =>
      (ip.wbs ?? 'null') === (entry.wbs ?? 'null') &&
      normalizeDescription(ip.item_description) === normDesc &&
      ip.resource
  );
  return byKey?.resource ?? null;
}

function isIpowMatched(entry: ItemEntry, ipowItems: IPOWItem[]): boolean {
  if (!entry.itemDescription.trim() || ipowItems.length === 0) return false;
  const normDesc = normalizeDescription(entry.itemDescription);
  return ipowItems.some(
    (ip) =>
      (ip.wbs ?? 'null') === (entry.wbs ?? 'null') &&
      normalizeDescription(ip.item_description) === normDesc
  );
}

export function ItemsRepeater({
  items,
  onAdd,
  onRemove,
  onUpdate,
  showPOQty = false,
  poTotalsByKey = {},
  poTotalsByDescription = {},
  ipowItems = [],
}: ItemsRepeaterProps) {
  type FocusKey = `${number}-qty` | `${number}-qtyInPO` | null;
  const [focusKey, setFocusKey] = useState<FocusKey>(null);
  const [editStr, setEditStr] = useState('');

  const unitOptions = useMemo(() => {
    const set = new Set<string>(DEFAULT_UNITS);
    ipowItems.forEach((i) => i.unit && set.add(i.unit.trim()));
    return Array.from(set);
  }, [ipowItems]);

  const handleQtyFocus = useCallback((index: number, field: 'qty' | 'qtyInPO') => {
    const key: FocusKey = `${index}-${field}`;
    setFocusKey(key);
    const val = field === 'qty' ? items[index]?.qty : (items[index]?.qtyInPO ?? 0);
    setEditStr(formatQty(val));
  }, [items]);

  const handleQtyBlur = useCallback((index: number, field: 'qty' | 'qtyInPO') => {
    const parsed = parseFloat(editStr) || 0;
    onUpdate(index, field, parsed);
    setFocusKey(null);
    setEditStr('');
  }, [editStr, onUpdate]);

  const handleQtyChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (v === '' || /^\d*\.?\d*$/.test(v)) setEditStr(v);
  }, []);

  return (
    <div className="space-y-4">
      {items.map((item, index) => {
        const isEditingQty = focusKey === `${index}-qty`;
        const qtyDisplay = isEditingQty ? editStr : formatQty(item.qty);
        const keyed = poTotalsByKey[makeKey(item.wbs ?? null, item.itemDescription)];
        const fallbackByDescription = poTotalsByDescription[normalizeDescription(item.itemDescription)];
        const totalQtyInPO = (keyed ?? fallbackByDescription ?? 0);

        return (
        <ARSDCard key={index} className="relative">
          <button
            onClick={() => onRemove(index)}
            className="absolute top-3 right-3 p-1 rounded-full hover:bg-red-100 text-red-600 transition-colors mobile-touch-target"
            aria-label="Remove item"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="space-y-3 pr-8">
            {ipowItems.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <List className="inline h-3.5 w-3.5 mr-1" aria-hidden /> From IPOW
                </label>
                <select
                  className="mobile-form-input w-full text-sm"
                  value=""
                  onChange={(e) => {
                    const idx = e.target.value ? parseInt(e.target.value, 10) : -1;
                    e.target.value = '';
                    if (idx >= 0 && ipowItems[idx]) {
                      const ipow = ipowItems[idx];
                      onUpdate(index, 'itemDescription', ipow.item_description);
                      onUpdate(index, 'unit', ipow.unit || 'EA');
                      onUpdate(index, 'wbs', ipow.wbs);
                    }
                  }}
                  aria-label="Fill from IPOW list"
                >
                  <option value="">Select an item from IPOW...</option>
                  {ipowItems.map((ipow, i) => (
                    <option key={ipow.id} value={i}>
                      {[ipow.wbs, ipow.item_description, ipow.resource, ipow.unit].filter(Boolean).join(' · ')}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Item Description
              </label>
              {ipowItems.length > 0 && isIpowMatched(item, ipowItems) ? (
                <div className="mobile-form-input w-full bg-gray-50 cursor-not-allowed">
                  {item.itemDescription}
                </div>
              ) : (
                <input
                  type="text"
                  value={item.itemDescription}
                  onChange={(e) => onUpdate(index, 'itemDescription', e.target.value)}
                  className="mobile-form-input w-full"
                  placeholder="Enter item description"
                />
              )}
              {ipowItems.length > 0 && (() => {
                const resource = getResourceForEntry(item, ipowItems);
                return resource ? (
                  <div className="mt-2 rounded-md bg-gray-50/80 px-3 py-2">
                    <span className="block text-[10px] uppercase tracking-wide text-gray-500 mb-0.5">Resource</span>
                    <p className="text-sm text-gray-600 break-words">{resource}</p>
                  </div>
                ) : null;
              })()}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {showPOQty ? 'Qty in DR' : 'Quantity'}
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={qtyDisplay}
                  onFocus={() => handleQtyFocus(index, 'qty')}
                  onBlur={() => handleQtyBlur(index, 'qty')}
                  onChange={handleQtyChange}
                  className="mobile-form-input w-full"
                  placeholder="0"
                />
              </div>

              {showPOQty && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Total Qty in PO
                  </label>
                  <div className="mobile-form-input w-full bg-gray-50 cursor-not-allowed text-right">
                    {formatQty(totalQtyInPO)}
                  </div>
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
                  {unitOptions.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </ARSDCard>
        );
      })}

      <button
        onClick={onAdd}
        className="w-full glass-button text-arsd-primary border-dashed border-2 border-red-300/50 hover:border-red-400/70 mobile-button"
      >
        + Add Item
      </button>
    </div>
  );
}

