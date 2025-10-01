import { createServiceSupabaseClient } from '@/lib/supabase';

export interface CleanupResult {
  success: boolean;
  filesDeleted: number;
  storageFreed: number; // in bytes
  errors: string[];
  deletedFiles: string[];
}

export interface CleanupOptions {
  dryRun?: boolean; // If true, only log what would be deleted without actually deleting
  weeksToKeep?: number; // Number of weeks to keep (default: 2)
  batchSize?: number; // Number of files to process in each batch (default: 50)
}

export class StorageCleanupService {
  private supabase = createServiceSupabaseClient();

  /**
   * Get the week ending date for a given date
   * Returns Saturday of the week (week ending)
   */
  private getWeekEndingDate(date: Date = new Date()): Date {
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
    const daysToAdd = (6 - dayOfWeek) % 7; // Days to add to get to Saturday
    const weekEnding = new Date(date);
    weekEnding.setDate(date.getDate() + daysToAdd);
    weekEnding.setHours(23, 59, 59, 999); // End of day
    return weekEnding;
  }

  /**
   * Get the cutoff date for files to keep
   * Keeps current week + specified number of past weeks
   */
  private getCutoffDate(weeksToKeep: number = 2): Date {
    const currentWeekEnding = this.getWeekEndingDate();
    const cutoffDate = new Date(currentWeekEnding);
    cutoffDate.setDate(cutoffDate.getDate() - (weeksToKeep * 7));
    cutoffDate.setHours(0, 0, 0, 0); // Start of day
    return cutoffDate;
  }

  /**
   * Find accomplishment reports that are older than the cutoff date and successfully parsed
   */
  private async findOldParsedReports(weeksToKeep: number = 2) {
    const cutoffDate = this.getCutoffDate(weeksToKeep);
    
    console.log(`🔍 Looking for files older than ${cutoffDate.toISOString().split('T')[0]} (keeping ${weeksToKeep} weeks)`);

    // First, let's see all files in the database for debugging
    const { data: allFiles, error: allFilesError } = await this.supabase
      .from('accomplishment_reports')
      .select('id, file_url, file_name, week_ending_date, parsed_status, created_at')
      .not('file_url', 'is', null)
      .order('week_ending_date', { ascending: true });

    if (allFilesError) {
      console.error('Error fetching all files:', allFilesError);
    } else {
      console.log(`📊 Total files in database: ${allFiles?.length || 0}`);
      console.log(`📊 Files by week_ending_date:`, allFiles?.map(f => ({ 
        file: f.file_name, 
        week_ending: f.week_ending_date, 
        parsed: f.parsed_status,
        created: f.created_at?.split('T')[0]
      })));
    }

    const { data: reports, error } = await this.supabase
      .from('accomplishment_reports')
      .select('id, file_url, file_name, file_size, week_ending_date, parsed_status, created_at')
      .eq('parsed_status', 'success') // Only successfully parsed files
      .not('file_url', 'is', null) // Only files that still exist in storage
      .lte('week_ending_date', cutoffDate.toISOString().split('T')[0]) // Older than or equal to cutoff
      .order('week_ending_date', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch old reports: ${error.message}`);
    }

    console.log(`📊 Found ${reports?.length || 0} old parsed reports to cleanup`);
    return reports || [];
  }

  /**
   * Extract file path from Supabase storage URL
   */
  private extractFilePath(fileUrl: string): string | null {
    try {
      // Supabase storage URLs typically look like:
      // https://project.supabase.co/storage/v1/object/public/bucket/path/to/file.xlsx
      const url = new URL(fileUrl);
      const pathParts = url.pathname.split('/').filter(part => part.length > 0);
      
      // Find the bucket name (should be after 'public')
      const publicIndex = pathParts.indexOf('public');
      if (publicIndex >= 0 && publicIndex + 1 < pathParts.length) {
        const bucketIndex = publicIndex + 1;
        const bucketName = pathParts[bucketIndex];
        
        // Check if the next part is also the bucket name (double bucket issue)
        if (bucketIndex + 1 < pathParts.length && pathParts[bucketIndex + 1] === bucketName) {
          // Skip the duplicate bucket name
          const filePath = pathParts.slice(bucketIndex + 2).join('/');
          return filePath;
        } else {
          const filePath = pathParts.slice(bucketIndex + 1).join('/');
          return filePath;
        }
      }
      
      // Alternative: try to find bucket directly if URL structure is different
      // Look for common bucket names
      const bucketNames = ['accomplishment-reports', 'progress-photos', 'website-projects'];
      for (const bucketName of bucketNames) {
        const bucketIndex = pathParts.indexOf(bucketName);
        if (bucketIndex >= 0 && bucketIndex + 1 < pathParts.length) {
          const filePath = pathParts.slice(bucketIndex + 1).join('/');
          return filePath;
        }
      }
      
      console.error('Could not extract file path from URL:', fileUrl);
      return null;
    } catch (error) {
      console.error('Error parsing file URL:', fileUrl, error);
      return null;
    }
  }

  /**
   * Extract bucket name from Supabase storage URL
   */
  private extractBucketName(fileUrl: string): string | null {
    try {
      const url = new URL(fileUrl);
      const pathParts = url.pathname.split('/').filter(part => part.length > 0);
      
      // Find the bucket name (should be after 'public')
      const publicIndex = pathParts.indexOf('public');
      if (publicIndex >= 0 && publicIndex + 1 < pathParts.length) {
        return pathParts[publicIndex + 1];
      }
      
      // Alternative: try to find bucket directly if URL structure is different
      const bucketNames = ['accomplishment-reports', 'progress-photos', 'website-projects'];
      for (const bucketName of bucketNames) {
        if (pathParts.includes(bucketName)) {
          return bucketName;
        }
      }
      
      console.error('Could not extract bucket name from URL:', fileUrl);
      return null;
    } catch (error) {
      console.error('Error parsing bucket from URL:', fileUrl, error);
      return null;
    }
  }

  /**
   * Alternative method to extract bucket and file path
   */
  private extractPathAlternative(fileUrl: string): { bucket: string | null, filePath: string | null } {
    try {
      console.log(`🔧 Alternative extraction for: ${fileUrl}`);
      
      // Handle different URL patterns
      const patterns = [
        // Pattern 1: /storage/v1/object/public/bucket/bucket/path (double bucket)
        /\/storage\/v1\/object\/public\/([^\/]+)\/\1\/(.+)/,
        // Pattern 2: /storage/v1/object/public/bucket/path (normal)
        /\/storage\/v1\/object\/public\/([^\/]+)\/(.+)/,
        // Pattern 3: /storage/v1/object/bucket/path (without public)
        /\/storage\/v1\/object\/([^\/]+)\/(.+)/,
        // Pattern 4: Direct bucket/path pattern
        /\/([^\/]+)\/(.+)$/
      ];

      for (const pattern of patterns) {
        const match = fileUrl.match(pattern);
        if (match) {
          const bucket = match[1];
          const filePath = match[2];
          console.log(`🔧 Pattern matched - bucket: ${bucket}, path: ${filePath}`);
          return { bucket, filePath };
        }
      }

      // Fallback: try to extract from filename if it's a simple URL
      const fileName = fileUrl.split('/').pop();
      if (fileName && fileName.includes('.xlsx')) {
        console.log(`🔧 Fallback: using filename as path: ${fileName}`);
        return { bucket: 'accomplishment-reports', filePath: fileName };
      }

      return { bucket: null, filePath: null };
    } catch (error) {
      console.error('Error in alternative extraction:', error);
      return { bucket: null, filePath: null };
    }
  }

  /**
   * Delete files from Supabase storage
   */
  private async deleteFilesFromStorage(files: Array<{file_url: string, file_name: string}>) {
    const deletedFiles: string[] = [];
    const errors: string[] = [];
    let totalSizeFreed = 0;

    // Group files by bucket for efficient deletion
    const filesByBucket = new Map<string, Array<{file_url: string, file_name: string, file_size?: number}>>();

    for (const file of files) {
      console.log(`🔍 Processing file: ${file.file_name}`);
      console.log(`🔍 File URL: ${file.file_url}`);
      
      // Try multiple extraction methods
      let bucket = this.extractBucketName(file.file_url);
      let filePath = this.extractFilePath(file.file_url);

      // If extraction failed, try alternative method
      if (!bucket || !filePath) {
        console.log(`🔧 Trying alternative extraction method...`);
        const altResult = this.extractPathAlternative(file.file_url);
        bucket = altResult.bucket;
        filePath = altResult.filePath;
      }

      console.log(`🔍 Extracted bucket: ${bucket}`);
      console.log(`🔍 Extracted filePath: ${filePath}`);

      if (!bucket || !filePath) {
        const errorMsg = `Invalid file URL for ${file.file_name}: ${file.file_url} (bucket: ${bucket}, path: ${filePath})`;
        errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
        continue;
      }

      if (!filesByBucket.has(bucket)) {
        filesByBucket.set(bucket, []);
      }

      filesByBucket.get(bucket)!.push({
        ...file,
        file_url: filePath // Use relative path for deletion
      });
    }

    // Delete files from each bucket
    for (const bucket of Array.from(filesByBucket.keys())) {
      const bucketFiles = filesByBucket.get(bucket)!;
      try {
        console.log(`🗑️  Deleting ${bucketFiles.length} files from bucket: ${bucket}`);
        
        const filePaths = bucketFiles.map(f => f.file_url);
        
        const { error } = await this.supabase.storage
          .from(bucket)
          .remove(filePaths);

        if (error) {
          errors.push(`Failed to delete files from bucket ${bucket}: ${error.message}`);
          console.error(`❌ Error deleting from bucket ${bucket}:`, error);
        } else {
          deletedFiles.push(...bucketFiles.map(f => f.file_name));
          // Sum up file sizes (approximate)
          totalSizeFreed += bucketFiles.reduce((sum: number, f) => sum + (f.file_size || 0), 0);
          console.log(`✅ Successfully deleted ${bucketFiles.length} files from bucket: ${bucket}`);
        }
      } catch (error) {
        const errorMsg = `Exception deleting from bucket ${bucket}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error(`❌ Exception deleting from bucket ${bucket}:`, error);
      }
    }

    return { deletedFiles, errors, totalSizeFreed };
  }

  /**
   * Clean up old parsed accomplishment reports and their files
   */
  async cleanupOldFiles(options: CleanupOptions = {}): Promise<CleanupResult> {
    const {
      dryRun = false,
      weeksToKeep = 2,
      batchSize = 50
    } = options;

    console.log(`🧹 Starting storage cleanup (dryRun: ${dryRun}, weeksToKeep: ${weeksToKeep})`);

    try {
      // Find old parsed reports
      const oldReports = await this.findOldParsedReports(weeksToKeep);

      if (oldReports.length === 0) {
        console.log('✅ No old files found to cleanup');
        return {
          success: true,
          filesDeleted: 0,
          storageFreed: 0,
          errors: [],
          deletedFiles: []
        };
      }

      if (dryRun) {
        console.log(`🔍 DRY RUN: Would delete ${oldReports.length} files:`);
        oldReports.forEach(report => {
          console.log(`  - ${report.file_name} (${report.file_size} bytes, week: ${report.week_ending_date})`);
        });
        
        return {
          success: true,
          filesDeleted: oldReports.length,
          storageFreed: oldReports.reduce((sum, r) => sum + (r.file_size || 0), 0),
          errors: [],
          deletedFiles: oldReports.map(r => r.file_name)
        };
      }

      // Process files in batches
      let totalDeleted = 0;
      let totalSizeFreed = 0;
      const allErrors: string[] = [];
      const allDeletedFiles: string[] = [];

      for (let i = 0; i < oldReports.length; i += batchSize) {
        const batch = oldReports.slice(i, i + batchSize);
        console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(oldReports.length / batchSize)} (${batch.length} files)`);

        // Delete files from storage
        const { deletedFiles, errors, totalSizeFreed: batchSizeFreed } = await this.deleteFilesFromStorage(batch);
        
        allDeletedFiles.push(...deletedFiles);
        allErrors.push(...errors);
        totalSizeFreed += batchSizeFreed;

        // Update database records to mark files as deleted
        const reportIds = batch.map(r => r.id);
        const { error: updateError } = await this.supabase
          .from('accomplishment_reports')
          .update({ 
            file_url: null, // Clear the file URL
            file_deleted_at: new Date().toISOString() // Track deletion timestamp
          })
          .in('id', reportIds);

        if (updateError) {
          const errorMsg = `Failed to update database records: ${updateError.message}`;
          allErrors.push(errorMsg);
          console.error('❌ Error updating database:', updateError);
        } else {
          totalDeleted += batch.length;
          console.log(`✅ Updated ${batch.length} database records`);
        }

        // Small delay between batches to avoid overwhelming the API
        if (i + batchSize < oldReports.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      const success = allErrors.length === 0;
      const result: CleanupResult = {
        success,
        filesDeleted: totalDeleted,
        storageFreed: totalSizeFreed,
        errors: allErrors,
        deletedFiles: allDeletedFiles
      };

      console.log(`🎉 Cleanup completed: ${totalDeleted} files deleted, ${(totalSizeFreed / 1024 / 1024).toFixed(2)} MB freed`);
      
      if (allErrors.length > 0) {
        console.error('⚠️  Errors during cleanup:', allErrors);
      }

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Cleanup failed:', errorMessage);
      
      return {
        success: false,
        filesDeleted: 0,
        storageFreed: 0,
        errors: [errorMessage],
        deletedFiles: []
      };
    }
  }

  /**
   * Get cleanup statistics
   */
  async getCleanupStats(weeksToKeep: number = 2) {
    const oldReports = await this.findOldParsedReports(weeksToKeep);
    
    return {
      totalFilesToDelete: oldReports.length,
      totalSizeToFree: oldReports.reduce((sum, r) => sum + (r.file_size || 0), 0),
      cutoffDate: this.getCutoffDate(weeksToKeep),
      oldestFile: oldReports[0]?.week_ending_date,
      newestFile: oldReports[oldReports.length - 1]?.week_ending_date
    };
  }
}
