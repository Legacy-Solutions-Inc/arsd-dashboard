import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
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
    const poPhoto = formData.get('po_photo') as File | null;

    if (!projectId || !supplier || !date || !warehouseman || !itemsJson) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const items = JSON.parse(itemsJson);

    // Create DR first to get ID for file uploads (service uses user-scoped client for RLS)
    const service = new DeliveryReceiptsService(supabase);
    const storageService = new WarehouseStorageService(supabase);

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
    let poPhotoUrl: string | undefined;

    if (drPhoto) {
      const result = await storageService.uploadDRPhoto(dr.id, drPhoto);
      if (result.success) {
        drPhotoUrl = result.url;
      }
    }

    if (poPhoto) {
      const result = await storageService.uploadPOPhoto(dr.id, poPhoto);
      if (result.success) {
        poPhotoUrl = result.url;
      }
    }

    // Update DR with photo URLs if any were uploaded
    if (drPhotoUrl || poPhotoUrl) {
      const updateData: any = {};
      if (drPhotoUrl) updateData.dr_photo_url = drPhotoUrl;
      if (poPhotoUrl) updateData.po_photo_url = poPhotoUrl;

      await service.supabase
        .from('delivery_receipts')
        .update(updateData)
        .eq('id', dr.id);
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
