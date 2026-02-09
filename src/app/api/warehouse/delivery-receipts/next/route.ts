import { NextResponse } from 'next/server';
import { DeliveryReceiptsService } from '@/services/warehouse/delivery-receipts.service';

export async function GET() {
  try {
    const service = new DeliveryReceiptsService();
    const dr_no = await service.getNextDrNoPublic();
    return NextResponse.json({ dr_no });
  } catch (error) {
    console.error('Error fetching next DR number:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch next DR number' },
      { status: 500 }
    );
  }
}
