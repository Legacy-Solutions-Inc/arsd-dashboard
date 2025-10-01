import { NextRequest, NextResponse } from 'next/server';
import { StorageCleanupService } from '@/services/storage/storage-cleanup.service';

/**
 * POST /api/storage/cleanup
 * 
 * Cleans up old parsed accomplishment report files from storage.
 * 
 * Query parameters:
 * - dryRun: boolean - If true, only shows what would be deleted without actually deleting
 * - weeksToKeep: number - Number of weeks to keep (default: 2)
 * 
 * Body (optional):
 * - dryRun: boolean
 * - weeksToKeep: number
 * - batchSize: number
 * 
 * Returns:
 * - success: boolean
 * - filesDeleted: number
 * - storageFreed: number (bytes)
 * - errors: string[]
 * - deletedFiles: string[]
 * - stats: object with cleanup statistics
 */
export async function POST(request: NextRequest) {
  try {
    // Parse query parameters
    const url = new URL(request.url);
    const dryRunParam = url.searchParams.get('dryRun');
    const weeksToKeepParam = url.searchParams.get('weeksToKeep');
    const batchSizeParam = url.searchParams.get('batchSize');

    // Parse request body (optional)
    let bodyOptions: any = {};
    try {
      const body = await request.json();
      bodyOptions = body;
    } catch (error) {
      // Body is optional, continue with query params only
    }

    // Merge options with defaults
    const options = {
      dryRun: dryRunParam === 'true' || bodyOptions.dryRun === true,
      weeksToKeep: weeksToKeepParam ? parseInt(weeksToKeepParam) : (bodyOptions.weeksToKeep || 2),
      batchSize: batchSizeParam ? parseInt(batchSizeParam) : (bodyOptions.batchSize || 50)
    };

    // Validate parameters
    if (options.weeksToKeep < 1 || options.weeksToKeep > 52) {
      return NextResponse.json(
        { 
          success: false,
          error: 'weeksToKeep must be between 1 and 52',
          message: 'Invalid weeksToKeep parameter'
        }, 
        { status: 400 }
      );
    }

    if (options.batchSize < 1 || options.batchSize > 100) {
      return NextResponse.json(
        { 
          success: false,
          error: 'batchSize must be between 1 and 100',
          message: 'Invalid batchSize parameter'
        }, 
        { status: 400 }
      );
    }

    console.log(`🧹 Starting storage cleanup with options:`, options);

    // Initialize cleanup service
    const cleanupService = new StorageCleanupService();

    // Get cleanup statistics first
    const stats = await cleanupService.getCleanupStats(options.weeksToKeep);

    // Perform cleanup
    const result = await cleanupService.cleanupOldFiles(options);

    // Format response
    const response = {
      success: result.success,
      message: options.dryRun 
        ? `Dry run completed: ${result.filesDeleted} files would be deleted`
        : `Cleanup completed: ${result.filesDeleted} files deleted`,
      filesDeleted: result.filesDeleted,
      storageFreed: result.storageFreed,
      storageFreedMB: Math.round((result.storageFreed / 1024 / 1024) * 100) / 100,
      errors: result.errors,
      deletedFiles: result.deletedFiles,
      stats: {
        ...stats,
        totalSizeToFreeMB: Math.round((stats.totalSizeToFree / 1024 / 1024) * 100) / 100
      },
      options
    };

    console.log(`✅ Cleanup API response:`, {
      success: result.success,
      filesDeleted: result.filesDeleted,
      storageFreedMB: response.storageFreedMB,
      errors: result.errors.length
    });

    return NextResponse.json(response);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Cleanup API error:', errorMessage);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: `Cleanup failed: ${errorMessage}`,
        filesDeleted: 0,
        storageFreed: 0,
        errors: [errorMessage]
      }, 
      { status: 500 }
    );
  }
}

/**
 * GET /api/storage/cleanup
 * 
 * Gets cleanup statistics without performing any cleanup.
 * 
 * Query parameters:
 * - weeksToKeep: number - Number of weeks to keep (default: 2)
 * 
 * Returns:
 * - totalFilesToDelete: number
 * - totalSizeToFree: number (bytes)
 * - cutoffDate: string
 * - oldestFile: string
 * - newestFile: string
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const weeksToKeepParam = url.searchParams.get('weeksToKeep');
    
    const weeksToKeep = weeksToKeepParam ? parseInt(weeksToKeepParam) : 2;

    if (weeksToKeep < 1 || weeksToKeep > 52) {
      return NextResponse.json(
        { 
          success: false,
          error: 'weeksToKeep must be between 1 and 52',
          message: 'Invalid weeksToKeep parameter'
        }, 
        { status: 400 }
      );
    }

    const cleanupService = new StorageCleanupService();
    const stats = await cleanupService.getCleanupStats(weeksToKeep);

    return NextResponse.json({
      success: true,
      message: `Found ${stats.totalFilesToDelete} files that would be deleted`,
      ...stats,
      totalSizeToFreeMB: Math.round((stats.totalSizeToFree / 1024 / 1024) * 100) / 100,
      weeksToKeep
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Cleanup stats API error:', errorMessage);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: `Failed to get cleanup stats: ${errorMessage}`
      }, 
      { status: 500 }
    );
  }
}
