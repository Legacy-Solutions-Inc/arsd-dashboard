import { createBrowserClient } from "@supabase/ssr";

// Browser-side Supabase client for client components and hooks
export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );


