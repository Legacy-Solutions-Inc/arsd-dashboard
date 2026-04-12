import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase';
import { ReleasesService } from '@/services/warehouse/releases.service';
import { WarehouseStorageService } from '@/services/warehouse/warehouse-storage.service';
import { CreateReleaseFormInput } from '@/types/warehouse';

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

    const service = new ReleasesService(supabase);
    const releases = await service.list(filters);

    return NextResponse.json(releases);
  } catch (error) {
    console.error('Error fetching releases:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Role check — only warehouse-related roles can create releases
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

    // Extract release data
    const projectId = formData.get('project_id') as string;
    const receivedBy = formData.get('received_by') as string;
    const date = formData.get('date') as string;
    const warehouseman = formData.get('warehouseman') as string | null;
    const purpose = formData.get('purpose') as string | null;
    const itemsJson = formData.get('items') as string;
    const attachment = formData.get('attachment') as File | null;

    if (!projectId || !receivedBy || !date || !itemsJson) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const items = JSON.parse(itemsJson);

    // Create release first to get ID for file upload (use server client for RLS)
    const service = new ReleasesService(supabase);
    // Use service-role client for storage to avoid storage RLS issues
    const storageService = new WarehouseStorageService(createServiceSupabaseClient());

    const releaseInput: CreateReleaseFormInput = {
      project_id: projectId,
      received_by: receivedBy,
      date,
      warehouseman: warehouseman || undefined,
      purpose: purpose || undefined,
      items,
    };

    const release = await service.create(releaseInput);

    // Upload attachment if provided
    let attachmentUrl: string | undefined;

    if (attachment) {
      const result = await storageService.uploadReleaseAttachment(release.id, attachment);
      if (!result.success) {
        console.error('Failed to upload release attachment', { releaseId: release.id, error: result.error });
      } else {
        attachmentUrl = result.url;
      }
    }

    // Update release with attachment URL if uploaded
    if (attachmentUrl) {
      await service.supabase
        .from('release_forms')
        .update({ attachment_url: attachmentUrl })
        .eq('id', release.id);
    }

    // Fetch final release with items
    const finalRelease = await service.getById(release.id);

    return NextResponse.json(finalRelease, { status: 201 });
  } catch (error) {
    console.error('Error creating release:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
