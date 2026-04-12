import type { StockItem } from '@/types/warehouse';

export type StockLedgerRole = 'warehouseman' | 'full';

export interface DownloadStockLedgerOptions {
  items: StockItem[];
  projectName: string;
  role: StockLedgerRole;
}

export class EmptyLedgerError extends Error {
  constructor(message = 'No stock items to export') {
    super(message);
    this.name = 'EmptyLedgerError';
  }
}

export class StockLedgerExportError extends Error {
  constructor(message = 'Failed to generate stock ledger export', options?: { cause?: unknown }) {
    super(message);
    this.name = 'StockLedgerExportError';
    if (options?.cause !== undefined) {
      (this as { cause?: unknown }).cause = options.cause;
    }
  }
}

interface ColumnDef {
  key: keyof StockItem;
  header: string;
  width: number;
  format?: string;
  fallback: string | number;
}

const PESO_FORMAT = '"₱"#,##0.00';
const QTY_FORMAT = '#,##0.00';
const VARIANCE_FORMAT = '#,##0.00;[Red]-#,##0.00';

const WAREHOUSEMAN_COLUMNS: ColumnDef[] = [
  { key: 'wbs',              header: 'WBS',             width: 10, fallback: '' },
  { key: 'item_description', header: 'Item Description', width: 42, fallback: '' },
  { key: 'resource',         header: 'Resource',        width: 28, fallback: '' },
  { key: 'po',               header: 'PO',              width: 12, format: QTY_FORMAT, fallback: 0 },
  { key: 'undelivered',      header: 'Undelivered',     width: 14, format: QTY_FORMAT, fallback: 0 },
  { key: 'delivered',        header: 'Delivered',       width: 14, format: QTY_FORMAT, fallback: 0 },
  { key: 'utilized',         header: 'Utilized',        width: 14, format: QTY_FORMAT, fallback: 0 },
  { key: 'running_balance',  header: 'Running Balance', width: 16, format: QTY_FORMAT, fallback: 0 },
];

const FULL_COLUMNS: ColumnDef[] = [
  { key: 'wbs',              header: 'WBS',             width: 10, fallback: '' },
  { key: 'item_description', header: 'Item Description', width: 42, fallback: '' },
  { key: 'resource',         header: 'Resource',        width: 28, fallback: '' },
  { key: 'ipow_qty',         header: 'IPOW Qty',        width: 12, format: QTY_FORMAT, fallback: 0 },
  { key: 'total_cost',       header: 'Total IPOW Cost', width: 18, format: PESO_FORMAT, fallback: 0 },
  { key: 'po',               header: 'PO',              width: 12, format: QTY_FORMAT, fallback: 0 },
  { key: 'unit_cost',        header: 'Unit Cost',       width: 16, format: PESO_FORMAT, fallback: 0 },
  { key: 'total_unit_cost',  header: 'Total Unit Cost', width: 18, format: PESO_FORMAT, fallback: 0 },
  { key: 'undelivered',      header: 'Undelivered',     width: 14, format: QTY_FORMAT, fallback: 0 },
  { key: 'delivered',        header: 'Delivered',       width: 14, format: QTY_FORMAT, fallback: 0 },
  { key: 'utilized',         header: 'Utilized',        width: 14, format: QTY_FORMAT, fallback: 0 },
  { key: 'running_balance',  header: 'Running Balance', width: 16, format: QTY_FORMAT, fallback: 0 },
  { key: 'variance',         header: 'Variance',        width: 14, format: VARIANCE_FORMAT, fallback: 0 },
];

function slugify(s: string): string {
  return (
    s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'project'
  );
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function coerceCell(item: StockItem, column: ColumnDef): string | number {
  const raw = item[column.key];
  if (raw === null || raw === undefined) {
    return column.fallback;
  }
  if (column.format) {
    const n = typeof raw === 'number' ? raw : Number(raw);
    return Number.isFinite(n) ? n : (column.fallback as number);
  }
  return typeof raw === 'string' ? raw : String(raw);
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadStockLedger(opts: DownloadStockLedgerOptions): Promise<void> {
  const { items, projectName, role } = opts;

  if (!items || items.length === 0) {
    throw new EmptyLedgerError();
  }

  let XLSX: typeof import('xlsx');
  try {
    XLSX = await import('xlsx');
  } catch (cause) {
    throw new StockLedgerExportError('Failed to load export library', { cause });
  }

  try {
    const columns = role === 'warehouseman' ? WAREHOUSEMAN_COLUMNS : FULL_COLUMNS;

    const headerRow = columns.map((c) => c.header);
    const dataRows = items.map((item) => columns.map((c) => coerceCell(item, c)));
    const rows: (string | number)[][] = [headerRow, ...dataRows];

    const ws = XLSX.utils.aoa_to_sheet(rows);

    ws['!cols'] = columns.map((c) => ({ wch: c.width }));

    // Apply per-column number format to data cells (skip header row at index 0)
    columns.forEach((column, colIndex) => {
      if (!column.format) return;
      for (let rowIndex = 1; rowIndex <= dataRows.length; rowIndex++) {
        const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
        const cell = ws[cellRef];
        if (cell && typeof cell === 'object') {
          cell.z = column.format;
          if (cell.t === undefined) {
            cell.t = typeof cell.v === 'number' ? 'n' : 's';
          }
        }
      }
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Stock Ledger');

    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buf as BlobPart], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const filename = `stock-ledger-${slugify(projectName)}-${todayIso()}.xlsx`;
    triggerBlobDownload(blob, filename);
  } catch (cause) {
    if (cause instanceof EmptyLedgerError || cause instanceof StockLedgerExportError) {
      throw cause;
    }
    throw new StockLedgerExportError('Failed to build stock ledger workbook', { cause });
  }
}
