import { NextRequest, NextResponse } from 'next/server';
import { StorageCleanupService } from '@/services/storage/storage-cleanup.service';

/**
 * GET /api/test-cleanup
 * 
 * Test endpoint to manually trigger automated cleanup
 * This simulates what the cron job will do
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing automated storage cleanup...');

    const cleanupService = new StorageCleanupService();
    
    // Same configuration as the automated cleanup
    const options = {
      dryRun: false,
      weeksToKeep: 1,
      batchSize: 50
    };

    // Get stats first
    const stats = await cleanupService.getCleanupStats(options.weeksToKeep);
    
    if (stats.totalFilesToDelete === 0) {
      return NextResponse.json({
        success: true,
        message: 'No files to cleanup - all files are within retention period',
        stats,
        options
      });
    }

    // Perform cleanup
    const result = await cleanupService.cleanupOldFiles(options);

    return NextResponse.json({
      success: result.success,
      message: result.success 
        ? `Test cleanup completed: ${result.filesDeleted} files deleted, ${Math.round((result.storageFreed / 1024 / 1024) * 100) / 100} MB freed`
        : `Test cleanup failed: ${result.errors.join(', ')}`,
      filesDeleted: result.filesDeleted,
      storageFreedMB: Math.round((result.storageFreed / 1024 / 1024) * 100) / 100,
      errors: result.errors,
      stats: {
        ...stats,
        totalSizeToFreeMB: Math.round((stats.totalSizeToFree / 1024 / 1024) * 100) / 100
      },
      options
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('🧪 Test cleanup failed:', errorMessage);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Test cleanup failed',
        message: errorMessage
      }, 
      { status: 500 }
    );
  }
}
