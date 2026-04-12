import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { StockItem } from '@/types/warehouse';
import { GET as getStocks } from '../route';

interface UpdateOverrideBody {
  wbs: string | null;
  item_description: string;
  po?: number;
  unit_cost?: number;
}

const MAX_NUMERIC = 1e12;

function isValidAmount(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= MAX_NUMERIC;
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

    if (!['superadmin', 'material_control', 'purchasing'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = (await request.json()) as UpdateOverrideBody;
    if (!body || !body.item_description) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const hasPo = body.po !== undefined;
    const hasUnitCost = body.unit_cost !== undefined;

    if (!hasPo && !hasUnitCost) {
      return NextResponse.json(
        { error: 'Either po or unit_cost must be provided' },
        { status: 400 }
      );
    }

    if (hasPo && !isValidAmount(body.po)) {
      return NextResponse.json(
        { error: 'Invalid po value' },
        { status: 400 }
      );
    }

    if (hasUnitCost && !isValidAmount(body.unit_cost)) {
      return NextResponse.json(
        { error: 'Invalid unit_cost value' },
        { status: 400 }
      );
    }

    // Fetch any existing row so a partial update does not clobber the other field.
    const existingQuery = supabase
      .from('stock_po_overrides')
      .select('po, unit_cost')
      .eq('project_id', projectId)
      .eq('item_description', body.item_description);

    const { data: currentRow } = await (
      body.wbs === null
        ? existingQuery.is('wbs', null)
        : existingQuery.eq('wbs', body.wbs)
    ).maybeSingle();

    const mergedPo = hasPo ? (body.po as number) : Number(currentRow?.po ?? 0);
    const mergedUnitCost = hasUnitCost ? (body.unit_cost as number) : Number(currentRow?.unit_cost ?? 0);

    const { error: upsertError } = await supabase
      .from('stock_po_overrides')
      .upsert(
        {
          project_id: projectId,
          wbs: body.wbs,
          item_description: body.item_description,
          po: mergedPo,
          unit_cost: mergedUnitCost,
        },
        { onConflict: 'project_id,wbs,item_description' }
      );

    if (upsertError) {
      console.error('Failed to upsert stock override', upsertError);
      return NextResponse.json(
        { error: 'Failed to update stock override' },
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
    console.error('Error updating stock override:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update stock override' },
      { status: 500 }
    );
  }
}
