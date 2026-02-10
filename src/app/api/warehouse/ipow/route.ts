import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { IPOWService } from '@/services/warehouse/ipow.service';

/**
 * GET /api/warehouse/ipow?projectId=<uuid>
 * Get all IPOW items for a project
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    const service = new IPOWService(supabase);
    const items = await service.getByProjectId(projectId);

    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching IPOW items:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch IPOW items' },
      { status: 500 }
    );
  }
}
