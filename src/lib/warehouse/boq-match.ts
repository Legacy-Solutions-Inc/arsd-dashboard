// Shared BOQ/IPOW item-matching helpers.
//
// These mirror the matching logic used by the stock ledger route
// (src/app/api/warehouse/stocks/[projectId]/route.ts) so that the stock ledger
// and the BOQ email-alert service classify items identically. Keep the two in
// sync — both import from here.

export function normalizeDescription(s: string | null | undefined): string {
  return (s ?? '').trim().toLowerCase();
}

/**
 * True when a delivery-receipt / release line item corresponds to the given
 * IPOW (BOQ) row. Matches by WBS when the line item has one; otherwise falls
 * back to a normalized item-description comparison. This is exactly the rule
 * the stock ledger uses to roll deliveries/releases up against IPOW rows.
 */
export function matchItemToIpow(
  item: { wbs?: string | null; item_description: string },
  ipow: { wbs: string; item_description: string }
): boolean {
  if (item.wbs) {
    return item.wbs === ipow.wbs;
  }
  return normalizeDescription(item.item_description) === normalizeDescription(ipow.item_description);
}
