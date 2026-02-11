import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase';
import { DeliveryReceiptsService } from '@/services/warehouse/delivery-receipts.service';
import { WarehouseStorageService } from '@/services/warehouse/warehouse-storage.service';
import { CreateDeliveryReceiptInput } from '@/types/warehouse';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const filters = {
      search: searchParams.get('search') || undefined,
      project_id: searchParams.get('projectId') || undefined,
      date_from: searchParams.get('dateFrom') || undefined,
      date_to: searchParams.get('dateTo') || undefined,
    };

    const service = new DeliveryReceiptsService(supabase);
    const deliveryReceipts = await service.list(filters);

    return NextResponse.json(deliveryReceipts);
  } catch (error) {
    console.error('Error fetching delivery receipts:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch delivery receipts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Use server client with request cookies so RLS runs as the logged-in user
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    
    // Extract DR data
    const projectId = formData.get('project_id') as string;
    const supplier = formData.get('supplier') as string;
    const date = formData.get('date') as string;
    const time = formData.get('time') as string | null;
    const warehouseman = formData.get('warehouseman') as string;
    const itemsJson = formData.get('items') as string;
    const drPhoto = formData.get('dr_photo') as File | null;
    const deliveryProof = formData.get('delivery_proof') as File | null;

    if (!projectId || !supplier || !date || !warehouseman || !itemsJson) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const items = JSON.parse(itemsJson);

    // Create DR first to get ID for file uploads (service uses user-scoped client for RLS)
    const service = new DeliveryReceiptsService(supabase);
    // Use service-role client for storage and post-upload updates to avoid storage/RLS issues
    const serviceSupabase = createServiceSupabaseClient();
    const storageService = new WarehouseStorageService(serviceSupabase);

    // Create placeholder DR
    const drInput: CreateDeliveryReceiptInput = {
      project_id: projectId,
      supplier,
      date,
      time: time || undefined,
      warehouseman,
      items,
    };

    const dr = await service.create(drInput);

    // Upload photos if provided
    let drPhotoUrl: string | undefined;
    let deliveryProofUrl: string | undefined;

    if (drPhoto) {
      const result = await storageService.uploadDRPhoto(dr.id, drPhoto);
      if (!result.success) {
        console.error('Failed to upload DR photo', { drId: dr.id, error: result.error });
      } else {
        drPhotoUrl = result.url;
      }
    }

    if (deliveryProof) {
      const result = await storageService.uploadDeliveryProofPhoto(dr.id, deliveryProof);
      if (!result.success) {
        console.error('Failed to upload delivery proof photo', { drId: dr.id, error: result.error });
      } else {
        deliveryProofUrl = result.url;
      }
    }

    // Update DR with photo URLs if any were uploaded
    if (drPhotoUrl || deliveryProofUrl) {
      const updateData: any = {};
      if (drPhotoUrl) updateData.dr_photo_url = drPhotoUrl;
      if (deliveryProofUrl) updateData.delivery_proof_url = deliveryProofUrl;

      const { error: updateError } = await serviceSupabase
        .from('delivery_receipts')
        .update(updateData)
        .eq('id', dr.id);

      if (updateError) {
        console.error('Failed to update DR photo URLs', {
          drId: dr.id,
          message: updateError.message,
        });
      }
    }

    // Fetch final DR with items
    const finalDr = await service.getById(dr.id);

    return NextResponse.json(finalDr, { status: 201 });
  } catch (error) {
    console.error('Error creating delivery receipt:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create delivery receipt' },
      { status: 500 }
    );
  }
}
