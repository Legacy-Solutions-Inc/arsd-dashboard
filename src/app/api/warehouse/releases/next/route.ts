import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { ReleasesService } from '@/services/warehouse/releases.service';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const service = new ReleasesService(supabase);
    const release_no = await service.getNextReleaseNoPublic();
    return NextResponse.json({ release_no });
  } catch (error) {
    console.error('Error fetching next release number:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch next release number' },
      { status: 500 }
    );
  }
}
