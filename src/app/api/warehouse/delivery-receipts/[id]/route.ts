import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
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
