import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { StockItem } from '@/types/warehouse';
import { GET as getStocks } from '../route';

interface UpdatePOBody {
  wbs: string | null;
  item_description: string;
  po: number;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const projectId = params.projectId;
    const supabase = await createServerSupabaseClient();

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, status')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id ?? '')
      .single();

    if (profileError || !profile || profile.status !== 'active') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (profile.role !== 'material_control' && profile.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = (await request.json()) as UpdatePOBody;
    if (!body || !body.item_description) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const safePo = Number.isFinite(body.po) ? body.po : 0;

    const { error: upsertError } = await supabase
      .from('stock_po_overrides')
      .upsert(
        {
          project_id: projectId,
          wbs: body.wbs,
          item_description: body.item_description,
          po: safePo,
        },
        { onConflict: 'project_id,wbs,item_description' }
      );

    if (upsertError) {
      console.error('Failed to upsert PO override', upsertError);
      return NextResponse.json(
        { error: 'Failed to update PO value' },
        { status: 500 }
      );
    }

    // Reuse existing GET handler to return the updated stock row
    const listResponse = await getStocks(request, { params: { projectId } });
    const allItems = (await listResponse.json()) as StockItem[];
    const updatedItem =
      allItems.find(
        (item) =>
          item.item_description === body.item_description &&
          (item.wbs ?? null) === (body.wbs ?? null)
      ) ?? null;

    return NextResponse.json(updatedItem, { status: 200 });
  } catch (error) {
    console.error('Error updating PO value:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update PO value' },
      { status: 500 }
    );
  }
}

