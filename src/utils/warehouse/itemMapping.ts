import { DeliveryReceipt, DRItem, ReleaseForm, ReleaseItem, UpdateDeliveryReceiptInput, UpdateDRItemInput, UpdateReleaseFormInput, UpdateReleaseItemInput } from '@/types/warehouse';
import type { ItemEntry } from '@/components/warehouse/ItemsRepeater';

// Helpers to map between API types and the UI ItemEntry structure used in forms.

export function mapDrItemsToEntries(items: DRItem[] | undefined): ItemEntry[] {
  if (!items || items.length === 0) return [];

  return items
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((item) => ({
      itemDescription: item.item_description,
      qty: item.qty_in_dr,
      qtyInPO: item.qty_in_po,
      unit: item.unit,
      wbs: item.wbs ?? null,
    }));
}

export function mapEntriesToDrUpdateItems(entries: ItemEntry[]): UpdateDRItemInput[] {
  return entries.map((entry, index) => ({
    item_description: entry.itemDescription,
    wbs: entry.wbs ?? null,
    qty_in_dr: entry.qty,
    // qty_in_po is not edited directly; callers should fill this based on PO totals.
    qty_in_po: entry.qtyInPO ?? 0,
    unit: entry.unit,
  }));
}

export function buildUpdateDrPayload(dr: DeliveryReceipt, entries: ItemEntry[], itemsWithPo: UpdateDRItemInput[]): UpdateDeliveryReceiptInput {
  return {
    project_id: dr.project_id,
    supplier: dr.supplier,
    date: dr.date,
    time: dr.time ?? null,
    warehouseman: dr.warehouseman,
    items: itemsWithPo.length ? itemsWithPo : mapEntriesToDrUpdateItems(entries),
  };
}

export function mapReleaseItemsToEntries(items: ReleaseItem[] | undefined): ItemEntry[] {
  if (!items || items.length === 0) return [];

  return items
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((item) => ({
      itemDescription: item.item_description,
      qty: item.qty,
      unit: item.unit,
      wbs: item.wbs ?? null,
    }));
}

export function mapEntriesToReleaseUpdateItems(entries: ItemEntry[]): UpdateReleaseItemInput[] {
  return entries.map((entry) => ({
    item_description: entry.itemDescription,
    wbs: entry.wbs ?? null,
    qty: entry.qty,
    unit: entry.unit,
  }));
}

export function buildUpdateReleasePayload(release: ReleaseForm, entries: ItemEntry[]): UpdateReleaseFormInput {
  return {
    project_id: release.project_id,
    received_by: release.received_by,
    date: release.date,
    warehouseman: release.warehouseman ?? null,
    purpose: release.purpose ?? null,
    items: mapEntriesToReleaseUpdateItems(entries),
  };
}

