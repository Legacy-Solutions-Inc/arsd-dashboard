-- Grant purchasing role read access to all projects (warehouse context)
-- So that purchasing users can see all projects in /dashboard/warehouse

-- Policy: Purchasing can view all projects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'projects'
      AND policyname = 'Purchasing can view all projects'
  ) THEN
    CREATE POLICY "Purchasing can view all projects" ON public.projects
      FOR SELECT USING (
        public.is_superadmin() OR
        EXISTS (
          SELECT 1
          FROM public.profiles
          WHERE user_id = auth.uid()
            AND role = 'purchasing'
            AND status = 'active'
        )
      );
  END IF;
END;
$$;

