import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { deleteByUrl } from '@/services/storage/delete-by-url';

/**
 * POST /api/storage/delete-file
 *
 * Deletes a stored file by its public URL. Routes to MinIO (NAS) or Supabase Storage
 * based on the URL prefix. Any authenticated user may call this — the allowed
 * URL prefixes are hardcoded in deleteByUrl, which rejects anything else.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { url } = body as { url?: unknown };
    if (typeof url !== 'string' || url.length === 0) {
      return NextResponse.json({ error: 'url (string) is required' }, { status: 400 });
    }

    await deleteByUrl(url);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Delete failed';
    console.error('delete-file error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
