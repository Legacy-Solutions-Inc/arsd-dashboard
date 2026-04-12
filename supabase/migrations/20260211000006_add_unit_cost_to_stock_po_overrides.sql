-- Add unit_cost column to stock_po_overrides for the Stock Monitoring Ledger UI.
-- Material Control and Purchasing enter this value per stock line; the UI shows
-- Total Unit Cost = po * unit_cost alongside the existing Total IPOW Cost.

ALTER TABLE public.stock_po_overrides
  ADD COLUMN IF NOT EXISTS unit_cost NUMERIC NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.stock_po_overrides.unit_cost IS
  'User-entered unit cost (peso) for a stock line. Multiplied by po to derive total_unit_cost in the ledger view.';
