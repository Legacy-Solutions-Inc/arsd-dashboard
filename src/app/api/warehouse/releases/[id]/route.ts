import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { ReleasesService } from '@/services/warehouse/releases.service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const service = new ReleasesService(supabase);
    const release = await service.getById(params.id);

    return NextResponse.json(release);
  } catch (error) {
    console.error('Error fetching release:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch release' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const supabase = await createServerSupabaseClient();
    const service = new ReleasesService(supabase);

    // Currently only support lock/unlock
    if (typeof body.locked === 'boolean') {
      await service.updateLock(params.id, body.locked);
      const updatedRelease = await service.getById(params.id);
      return NextResponse.json(updatedRelease);
    }

    return NextResponse.json(
      { error: 'No valid fields to update' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating release:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update release' },
      { status: 500 }
    );
  }
}
