-- Superadmin-only hard delete for warehouse Delivery Receipts and Release Forms.
--
-- FK CASCADE on dr_items.delivery_receipt_id and release_items.release_form_id is
-- already declared in 20250127000002_create_warehouse_tables.sql, so child rows
-- are removed automatically when a parent is deleted. No FK alteration is needed.
--
-- RLS defaults to deny without an explicit policy, which is why no role can
-- currently delete these rows. The route handler bypasses RLS via the service-role
-- client, but these policies are kept as defense-in-depth for any future caller
-- that uses a user-scoped client.

CREATE POLICY "Superadmin can delete delivery receipts" ON public.delivery_receipts
  FOR DELETE USING (public.is_superadmin());

CREATE POLICY "Superadmin can delete release forms" ON public.release_forms
  FOR DELETE USING (public.is_superadmin());

-- Child-table policies. CASCADE bypasses RLS at the FK level, so these only
-- apply to direct deletes against the child tables.
CREATE POLICY "Superadmin can delete DR items" ON public.dr_items
  FOR DELETE USING (public.is_superadmin());

CREATE POLICY "Superadmin can delete release items" ON public.release_items
  FOR DELETE USING (public.is_superadmin());
