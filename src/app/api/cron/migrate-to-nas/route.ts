import { NextRequest, NextResponse } from 'next/server';
import { runNasMover } from '@/services/storage/nas-mover.service';

export const maxDuration = 300;

/**
 * GET /api/cron/migrate-to-nas
 *
 * Nightly cron that drains files >24h old from Supabase Storage to NAS MinIO.
 * Rewrites the DB URL on each row and deletes the Supabase copy.
 * Replaces the NAS-side cron (/volume1/docker/mover/mover.sh) which stopped
 * running after the 2026-04-22 migration.
 *
 * Triggered by Vercel Cron at 02:30 UTC daily.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const expectedToken = process.env.CRON_SECRET_TOKEN;

  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runNasMover();

    console.log('migrate-to-nas completed:', result);

    return NextResponse.json({
      success: result.errors.length === 0,
      moved: result.moved,
      errors: result.errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Mover failed';
    console.error('migrate-to-nas error:', message);
    return NextResponse.json(
      { success: false, error: message, timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
