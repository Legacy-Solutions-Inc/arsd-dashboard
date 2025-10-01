import { NextRequest, NextResponse } from 'next/server';
import { StorageCleanupService } from '@/services/storage/storage-cleanup.service';

/**
 * GET /api/cron/cleanup-storage
 * 
 * Automated storage cleanup endpoint that runs in the background.
 * This can be triggered by:
 * - Vercel Cron Jobs (runs weekly on Sundays at 2:00 AM)
 * - External cron services (cron-job.org, etc.)
 * - Scheduled tasks
 * 
 * Automatically keeps only files within 1 week (current week + 1 past week).
 */
export async function GET(request: NextRequest) {
  try {
    // Verify the request is authorized (optional security check)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET_TOKEN;
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🤖 Starting automated storage cleanup...');

    // Initialize cleanup service with default settings
    const cleanupService = new StorageCleanupService();
    
    // Default configuration for automated cleanup
    const options = {
      dryRun: false,        // Actually delete files
      weeksToKeep: 1,       // Keep current week + 1 past week
      batchSize: 50         // Process 50 files at a time
    };

    // Get cleanup statistics first
    const stats = await cleanupService.getCleanupStats(options.weeksToKeep);
    
    if (stats.totalFilesToDelete === 0) {
      console.log('✅ No files to cleanup - all files are within retention period');
      return NextResponse.json({
        success: true,
        message: 'No files to cleanup - all files are within retention period',
        stats,
        options
      });
    }

    // Perform cleanup
    const result = await cleanupService.cleanupOldFiles(options);

    console.log('🤖 Automated cleanup completed:', {
      success: result.success,
      filesDeleted: result.filesDeleted,
      storageFreedMB: Math.round((result.storageFreed / 1024 / 1024) * 100) / 100,
      errors: result.errors.length
    });

    return NextResponse.json({
      success: result.success,
      message: result.success 
        ? `Automated cleanup completed: ${result.filesDeleted} files deleted, ${Math.round((result.storageFreed / 1024 / 1024) * 100) / 100} MB freed`
        : `Automated cleanup failed: ${result.errors.join(', ')}`,
      filesDeleted: result.filesDeleted,
      storageFreed: result.storageFreed,
      storageFreedMB: Math.round((result.storageFreed / 1024 / 1024) * 100) / 100,
      errors: result.errors,
      stats: {
        ...stats,
        totalSizeToFreeMB: Math.round((stats.totalSizeToFree / 1024 / 1024) * 100) / 100
      },
      options,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('🤖 Automated cleanup failed:', errorMessage);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Automated cleanup failed',
        message: errorMessage,
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
}

/**
 * POST /api/cron/cleanup-storage
 * 
 * Alternative endpoint for POST requests (useful for webhooks)
 */
export async function POST(request: NextRequest) {
  // Reuse the same logic as GET
  return GET(request);
}
