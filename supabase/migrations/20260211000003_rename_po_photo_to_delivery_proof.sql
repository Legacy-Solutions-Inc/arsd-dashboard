-- Rename PO photo column to delivery_proof_url on delivery_receipts

ALTER TABLE public.delivery_receipts
  RENAME COLUMN po_photo_url TO delivery_proof_url;

