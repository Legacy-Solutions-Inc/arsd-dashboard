import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase';
import { DeliveryReceiptsService } from '@/services/warehouse/delivery-receipts.service';
import { WarehouseStorageService } from '@/services/warehouse/warehouse-storage.service';

export const maxDuration = 60;

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
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function uploadDrPhotos(request: NextRequest, drId: string, userId: string): Promise<NextResponse> {
  const supabase = await createServerSupabaseClient();
  const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', userId).single();
  const ALLOWED = ['warehouseman', 'project_manager', 'project_inspector', 'superadmin'];
  if (!profile || !ALLOWED.includes(profile.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  const formData = await request.formData();
  const drPhoto = formData.get('dr_photo') as File | null;
  const deliveryProof = formData.get('delivery_proof') as File | null;
  if (!drPhoto && !deliveryProof) {
    return NextResponse.json({ error: 'No files provided' }, { status: 400 });
  }

  const serviceSupabase = createServiceSupabaseClient();
  const storageService = new WarehouseStorageService(serviceSupabase);
  const updateData: { dr_photo_url?: string; delivery_proof_url?: string } = {};

  if (drPhoto) {
    const result = await storageService.uploadDRPhoto(drId, drPhoto);
    if (!result.success) return NextResponse.json({ error: `Photo upload failed: ${result.error}` }, { status: 500 });
    updateData.dr_photo_url = result.url;
  }
  if (deliveryProof) {
    const result = await storageService.uploadDeliveryProofPhoto(drId, deliveryProof);
    if (!result.success) return NextResponse.json({ error: `Proof upload failed: ${result.error}` }, { status: 500 });
    updateData.delivery_proof_url = result.url;
  }

  const { error } = await serviceSupabase.from('delivery_receipts').update(updateData).eq('id', drId);
  if (error) return NextResponse.json({ error: `DB update failed: ${error.message}` }, { status: 500 });

  const service = new DeliveryReceiptsService(supabase);
  return NextResponse.json(await service.getById(drId));
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if ((request.headers.get('content-type') || '').includes('multipart/form-data')) {
      return uploadDrPhotos(request, params.id, user.id);
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const UNLOCK_ROLES = ['superadmin', 'project_inspector', 'project_manager'];
    if (!profile || !UNLOCK_ROLES.includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const service = new DeliveryReceiptsService(supabase);

    if (typeof body.locked === 'boolean') {
      await service.updateLock(params.id, body.locked);
      return NextResponse.json(await service.getById(params.id));
    }

    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  } catch (error) {
    console.error('Error updating delivery receipt:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.role !== 'superadmin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const serviceSupabase = createServiceSupabaseClient();
    const service = new DeliveryReceiptsService(serviceSupabase);
    await service.delete(params.id);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting delivery receipt:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
