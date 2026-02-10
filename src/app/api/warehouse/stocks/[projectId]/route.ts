import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { DeliveryReceiptsService } from '@/services/warehouse/delivery-receipts.service';
import { ReleasesService } from '@/services/warehouse/releases.service';
import { IPOWService } from '@/services/warehouse/ipow.service';
import { StockItem } from '@/types/warehouse';

function normalizeDescription(s: string): string {
  return s.trim().toLowerCase();
}

function matchItem(normKey: string, itemDescription: string | null | undefined): boolean {
  return normalizeDescription(itemDescription ?? '') === normKey;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const projectId = params.projectId;

    const supabase = await createServerSupabaseClient();
    const ipowService = new IPOWService(supabase);
    const drService = new DeliveryReceiptsService(supabase);
    const releaseService = new ReleasesService(supabase);

    const [ipowItems, deliveryReceipts, releaseForms] = await Promise.all([
      ipowService.getByProjectId(projectId),
      drService.list({ project_id: projectId }),
      releaseService.list({ project_id: projectId }),
    ]);

    // When we have IPOW data, use it as the master list of items (WBS, ipow_qty, total_cost from IPOW)
    if (ipowItems.length > 0) {
      const stockItems: StockItem[] = ipowItems.map((ipow) => {
        const normKey = normalizeDescription(ipow.item_description);
        const delivered = deliveryReceipts.reduce((sum, dr) => {
          const match = dr.items?.find((item) => matchItem(normKey, item.item_description));
          return sum + (match?.qty_in_dr ?? 0);
        }, 0);
        const utilized = releaseForms.reduce((sum, rel) => {
          const match = rel.items?.find((item) => matchItem(normKey, item.item_description));
          return sum + (match?.qty ?? 0);
        }, 0);
        const running_balance = delivered - utilized;
        const variance = running_balance - ipow.latest_ipow_qty;
        return {
          wbs: ipow.wbs,
          item_description: ipow.item_description,
          resource: ipow.resource ?? null,
          ipow_qty: ipow.latest_ipow_qty,
          delivered,
          utilized,
          running_balance,
          total_cost: ipow.total_cost ?? 0,
          variance: Number.isFinite(variance) ? variance : 0,
        };
      });
      return NextResponse.json(stockItems);
    }

    // Fallback: no IPOW for this project — derive rows from DR/Release items only
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
        const match = dr.items?.find((item) => matchItem(normKey, item.item_description));
        return sum + (match?.qty_in_dr ?? 0);
      }, 0);
      const utilized = releaseForms.reduce((sum, rel) => {
        const match = rel.items?.find((item) => matchItem(normKey, item.item_description));
        return sum + (match?.qty ?? 0);
      }, 0);
      const running_balance = delivered - utilized;
      return {
        wbs: null,
        item_description,
        resource: null,
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
