// BOQ violation email-alert service.
//
// Runs after a Release Form or Delivery Receipt is created and emails all
// Superadmins when any line item either exceeds the project BOQ (IPOW) or is
// not part of the BOQ at all. ALERT-ONLY and NON-BLOCKING: the entire body is
// guarded so it can never throw to its caller and never affects the response.
//
// "BOQ" = the project's IPOW rows of type 'Materials' (latest_ipow_qty), and
// item matching is shared with the stock ledger via @/lib/warehouse/boq-match.
import { createClient } from '@/lib/supabase';
import { IPOWService } from './ipow.service';
import { ReleasesService } from './releases.service';
import { DeliveryReceiptsService } from './delivery-receipts.service';
import { matchItemToIpow } from '@/lib/warehouse/boq-match';
import { sendEmail } from '@/lib/email';
import type {
  DeliveryReceipt,
  DRItem,
  IPOWItem,
  ReleaseForm,
  ReleaseItem,
} from '@/types/warehouse';

type WarehouseSupabaseClient = ReturnType<typeof createClient>;
type RecordKind = 'release' | 'delivery_receipt';
type WarehouseRecord = ReleaseForm | DeliveryReceipt;

interface NormalizedLine {
  wbs: string | null;
  item_description: string;
  qty: number;
}

interface BoqViolation {
  reason: 'exceeds_boq' | 'not_in_boq';
  item_description: string;
  wbs: string | null;
  qty: number;
  cumulative: number | null;
  ipow_qty: number | null;
}

interface AlertParams {
  supabase: WarehouseSupabaseClient;
  projectId: string;
  kind: RecordKind;
  record: WarehouseRecord;
}

function extractLines(record: WarehouseRecord, kind: RecordKind): NormalizedLine[] {
  const items = (record.items ?? []) as Array<ReleaseItem | DRItem>;
  return items.map((it) => ({
    wbs: it.wbs ?? null,
    item_description: it.item_description,
    qty: kind === 'release' ? (it as ReleaseItem).qty ?? 0 : (it as DRItem).qty_in_dr ?? 0,
  }));
}

// Cumulative qty for an IPOW row across all records of this kind, mirroring the
// stock ledger (one matching line per record). Includes the just-created record
// because callers fetch the full list after creation.
function computeCumulative(ipow: IPOWItem, records: WarehouseRecord[], kind: RecordKind): number {
  return records.reduce((sum, rec) => {
    const recItems = (rec.items ?? []) as Array<ReleaseItem | DRItem>;
    const match = recItems.find((it) => matchItemToIpow(it, ipow));
    if (!match) return sum;
    const q = kind === 'release' ? (match as ReleaseItem).qty : (match as DRItem).qty_in_dr;
    return sum + (q ?? 0);
  }, 0);
}

function classifyViolations(
  lines: NormalizedLine[],
  ipowItems: IPOWItem[],
  allRecords: WarehouseRecord[],
  kind: RecordKind
): BoqViolation[] {
  const violations: BoqViolation[] = [];
  const seenExceeds = new Set<string>();

  for (const line of lines) {
    const ipow = ipowItems.find((row) => matchItemToIpow(line, row));
    if (!ipow) {
      violations.push({
        reason: 'not_in_boq',
        item_description: line.item_description,
        wbs: line.wbs,
        qty: line.qty,
        cumulative: null,
        ipow_qty: null,
      });
      continue;
    }

    const cumulative = computeCumulative(ipow, allRecords, kind);
    if (cumulative > ipow.latest_ipow_qty) {
      const key = `${ipow.wbs}|${ipow.item_description}`;
      if (seenExceeds.has(key)) continue;
      seenExceeds.add(key);
      violations.push({
        reason: 'exceeds_boq',
        item_description: ipow.item_description,
        wbs: ipow.wbs,
        qty: line.qty,
        cumulative,
        ipow_qty: ipow.latest_ipow_qty,
      });
    }
  }

  return violations;
}

async function resolveSuperadminEmails(supabase: WarehouseSupabaseClient): Promise<string[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('email')
    .eq('role', 'superadmin');

  if (error) {
    console.error('[boq-alert] Failed to load superadmin recipients:', error.message);
    return [];
  }

  const emails = (data ?? [])
    .map((row) => (row as { email: string | null }).email)
    .filter((e): e is string => typeof e === 'string' && e.trim().length > 0);

  return Array.from(new Set(emails));
}

function getDocMeta(record: WarehouseRecord, kind: RecordKind): { docNo: string; createdBy: string } {
  if (kind === 'release') {
    const r = record as ReleaseForm;
    return { docNo: r.release_no, createdBy: r.warehouseman ?? r.received_by ?? '—' };
  }
  const d = record as DeliveryReceipt;
  return { docNo: d.dr_no, createdBy: d.warehouseman ?? '—' };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildEmailHtml(params: {
  docLabel: string;
  docNo: string;
  projectId: string;
  createdBy: string;
  violations: BoqViolation[];
}): string {
  const { docLabel, docNo, projectId, createdBy, violations } = params;
  const cell = 'padding:6px 10px;border:1px solid #ddd;';
  const rows = violations
    .map((v) => {
      const reason =
        v.reason === 'not_in_boq'
          ? 'Not in BOQ (unplanned item)'
          : `Exceeds BOQ (cumulative ${v.cumulative} vs BOQ ${v.ipow_qty})`;
      return `<tr>
        <td style="${cell}">${escapeHtml(v.wbs ?? '—')}</td>
        <td style="${cell}">${escapeHtml(v.item_description)}</td>
        <td style="${cell}text-align:right;">${v.qty}</td>
        <td style="${cell}">${reason}</td>
      </tr>`;
    })
    .join('');

  return `<div style="font-family:Arial,sans-serif;font-size:14px;color:#111;">
    <h2 style="margin:0 0 8px;">BOQ alert — ${escapeHtml(docLabel)} ${escapeHtml(docNo)}</h2>
    <p style="margin:0 0 4px;">Project: <strong>${escapeHtml(projectId)}</strong></p>
    <p style="margin:0 0 4px;">Recorded by: <strong>${escapeHtml(createdBy)}</strong></p>
    <p style="margin:12px 0 4px;">The following item(s) exceed or are not part of the project BOQ:</p>
    <table style="border-collapse:collapse;border:1px solid #ddd;">
      <thead>
        <tr style="background:#f5f5f5;">
          <th style="${cell}text-align:left;">WBS</th>
          <th style="${cell}text-align:left;">Item</th>
          <th style="${cell}text-align:right;">Qty</th>
          <th style="${cell}text-align:left;">Reason</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="margin:12px 0 0;color:#666;font-size:12px;">Automated alert from the ARSD Warehouse system.</p>
  </div>`;
}

/**
 * Evaluate a just-created Release Form / Delivery Receipt for BOQ violations
 * and email all Superadmins if any are found. Best-effort and fully guarded:
 * never throws, never blocks, never sends when there is nothing to report.
 */
export async function alertOnBoqViolations(params: AlertParams): Promise<void> {
  const { supabase, projectId, kind, record } = params;
  try {
    const ipowItems = await new IPOWService(supabase).getMaterialsByProjectId(projectId);

    const allRecords: WarehouseRecord[] =
      kind === 'release'
        ? await new ReleasesService(supabase).list({ project_id: projectId })
        : await new DeliveryReceiptsService(supabase).list({ project_id: projectId });

    const lines = extractLines(record, kind);
    const violations = classifyViolations(lines, ipowItems, allRecords, kind);
    if (violations.length === 0) return;

    const recipients = await resolveSuperadminEmails(supabase);
    if (recipients.length === 0) {
      console.warn('[boq-alert] No superadmin recipients found; skipping email.');
      return;
    }

    const { docNo, createdBy } = getDocMeta(record, kind);
    const docLabel = kind === 'release' ? 'Release' : 'Delivery Receipt';
    const html = buildEmailHtml({ docLabel, docNo, projectId, createdBy, violations });

    await sendEmail({
      to: recipients,
      subject: `[ARSD Warehouse] BOQ alert — ${docNo} (${projectId})`,
      html,
    });
  } catch (err) {
    console.error('[boq-alert] Failed to evaluate/send BOQ alert (non-blocking):', err);
  }
}
