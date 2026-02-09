import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { DeliveryReceiptsService } from '@/services/warehouse/delivery-receipts.service';
import { ReleasesService } from '@/services/warehouse/releases.service';
import { StockItem } from '@/types/warehouse';

function normalizeDescription(s: string): string {
  return s.trim().toLowerCase();
}

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const projectId = params.projectId;

    // Use server client with request cookies so RLS runs as the logged-in user
    const supabase = await createServerSupabaseClient();
    const drService = new DeliveryReceiptsService(supabase);
    const releaseService = new ReleasesService(supabase);

    const [deliveryReceipts, releaseForms] = await Promise.all([
      drService.list({ project_id: projectId }),
      releaseService.list({ project_id: projectId }),
    ]);

    // Collect unique item descriptions (normalized key -> display description)
    const descriptionByKey = new Map<string, string>();
    for (const dr of deliveryReceipts) {
      for (const item of dr.items ?? []) {
        const desc = item.item_description?.trim() ?? '';
        if (desc) {
          const key = normalizeDescription(desc);
          if (!descriptionByKey.has(key)) descriptionByKey.set(key, desc);
        }
      }
    }
    for (const rel of releaseForms) {
      for (const item of rel.items ?? []) {
        const desc = item.item_description?.trim() ?? '';
        if (desc) {
          const key = normalizeDescription(desc);
          if (!descriptionByKey.has(key)) descriptionByKey.set(key, desc);
        }
      }
    }

    const stockItems: StockItem[] = Array.from(descriptionByKey.entries()).map(([normKey, item_description]) => {
      const delivered = deliveryReceipts.reduce((sum, dr) => {
        const match = dr.items?.find(
          (item) => normalizeDescription(item.item_description ?? '') === normKey
        );
        return sum + (match?.qty_in_dr ?? 0);
      }, 0);

      const utilized = releaseForms.reduce((sum, rel) => {
        const match = rel.items?.find(
          (item) => normalizeDescription(item.item_description ?? '') === normKey
        );
        return sum + (match?.qty ?? 0);
      }, 0);

      const running_balance = delivered - utilized;

      return {
        wbs: null,
        item_description,
        ipow_qty: 0,
        delivered,
        utilized,
        running_balance,
        total_cost: 0,
        variance: 0,
      };
    });

    return NextResponse.json(stockItems);
  } catch (error) {
    console.error('Error fetching stock items:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch stock items' },
      { status: 500 }
    );
  }
}
