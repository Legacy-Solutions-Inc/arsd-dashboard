import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase';
import { DeliveryReceiptsService } from '@/services/warehouse/delivery-receipts.service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const service = new DeliveryReceiptsService(supabase);
    const dr = await service.getById(params.id);

    return NextResponse.json(dr);
  } catch (error) {
    console.error('Error fetching delivery receipt:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch delivery receipt' },
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
    const service = new DeliveryReceiptsService(supabase);

    // Currently only support lock/unlock
    if (typeof body.locked === 'boolean') {
      await service.updateLock(params.id, body.locked);
      const updatedDr = await service.getById(params.id);
      return NextResponse.json(updatedDr);
    }

    return NextResponse.json(
      { error: 'No valid fields to update' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating delivery receipt:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update delivery receipt' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Use user-scoped client for permission checks
    const userScopedService = new DeliveryReceiptsService(supabase);
    const existing = await userScopedService.getById(params.id);
    if (existing.locked) {
      return NextResponse.json(
        { error: 'Cannot edit a locked delivery receipt' },
        { status: 400 }
      );
    }

    // Load profile to get the same display_name used by useWarehouseAuth
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('display_name, role')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Unable to verify warehouse user profile' },
        { status: 403 }
      );
    }

    const currentName = (profile.display_name || '').trim();
    if (profile.role !== 'warehouseman') {
      return NextResponse.json(
        { error: 'Only warehouseman users can edit delivery receipts.' },
        { status: 403 }
      );
    }
    if (!currentName || currentName !== existing.warehouseman) {
      return NextResponse.json(
        { error: 'You can only edit delivery receipts you created while they are unlocked.' },
        { status: 403 }
      );
    }

    const { project_id, supplier, date, warehouseman, items } = body;
    if (!project_id || !supplier || !date || !warehouseman || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields for update' },
        { status: 400 }
      );
    }

    // Use service-role client for the actual update to avoid RLS issues
    const serviceSupabase = createServiceSupabaseClient();
    const service = new DeliveryReceiptsService(serviceSupabase);
    const updated = await service.update(params.id, body);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating delivery receipt:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update delivery receipt' },
      { status: 500 }
    );
  }
}
