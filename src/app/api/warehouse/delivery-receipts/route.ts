import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase';
import { DeliveryReceiptsService } from '@/services/warehouse/delivery-receipts.service';
import { WarehouseStorageService } from '@/services/warehouse/warehouse-storage.service';
import { CreateDeliveryReceiptInput } from '@/types/warehouse';
import { alertOnBoqViolations } from '@/services/warehouse/boq-alert.service';

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
      { error: 'Internal server error' },
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

    // Role check — only warehouse-related roles can create delivery receipts
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    const ALLOWED_ROLES = ['warehouseman', 'project_manager', 'project_inspector', 'superadmin'];
    if (!profile || !ALLOWED_ROLES.includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
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

    if (!drPhoto) {
      return NextResponse.json(
        { error: 'DR photo is required' },
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
        try {
          await new DeliveryReceiptsService(serviceSupabase).delete(dr.id);
        } catch (rollbackError) {
          console.error('Failed to roll back DR after photo upload failure', {
            drId: dr.id,
            rollbackError,
          });
        }
        return NextResponse.json(
          {
            error: `DR photo upload failed: ${result.error ?? 'unknown error'}. The delivery receipt was not saved — please try again.`,
          },
          { status: 502 }
        );
      }
      drPhotoUrl = result.url;
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
      const updateData: { dr_photo_url?: string; delivery_proof_url?: string } = {};
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

    // Non-blocking BOQ violation email alert — must never affect the response.
    try {
      await alertOnBoqViolations({
        supabase: serviceSupabase,
        projectId,
        kind: 'delivery_receipt',
        record: finalDr,
      });
    } catch (e) {
      console.error('BOQ alert failed (non-blocking):', e);
    }

    return NextResponse.json(finalDr, { status: 201 });
  } catch (error) {
    console.error('Error creating delivery receipt:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
