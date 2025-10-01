# Storage Cleanup System Documentation

## 📋 Overview

The Storage Cleanup System automatically manages file retention in Supabase storage to optimize costs and maintain data hygiene. It keeps only files within the specified retention period and safely deletes older files while preserving parsed data in the database.

## 🎯 Features

- **Automated Cleanup**: Runs weekly on Sundays at 2:00 AM via Vercel Cron
- **Manual Cleanup**: Admin UI for on-demand cleanup
- **Smart Retention**: Keeps current week + 1 past week (configurable)
- **Safe Deletion**: Only deletes successfully parsed files
- **Database Sync**: Updates database records to track deletions
- **Comprehensive Logging**: Detailed logs for monitoring and debugging

## 📁 File Structure

```
src/
├── services/storage/
│   └── storage-cleanup.service.ts          # Core cleanup logic
├── components/storage/
│   └── StorageCleanupManager.tsx           # Admin UI component
├── hooks/
│   └── useStorageCleanup.ts                # React hook for cleanup
├── app/
│   ├── api/storage/cleanup/route.ts        # Manual cleanup API
│   ├── api/cron/cleanup-storage/route.ts   # Automated cleanup endpoint
│   ├── api/test-cleanup/route.ts           # Test endpoint
│   └── dashboard/admin/storage-cleanup/
│       └── page.tsx                        # Admin UI page
└── supabase/migrations/
    ├── 20250101000007_add_file_deletion_tracking.sql
    └── 20250101000008_allow_null_file_url.sql
```

## 🔧 Configuration

### Default Settings

```typescript
const options = {
  dryRun: false,        // Actually delete files (true for preview only)
  weeksToKeep: 1,       // Keep current week + 1 past week
  batchSize: 50         // Process 50 files at a time
};
```

### Environment Variables

```bash
# Optional: Security token for cron endpoint
CRON_SECRET_TOKEN=your-secret-token
```

## 🚀 Usage

### 1. Manual Cleanup via Admin UI

1. Navigate to `/dashboard/admin/storage-cleanup`
2. Configure retention period (weeks to keep)
3. Enable/disable dry run mode
4. Click "Check Stats" to preview
5. Click "Delete Files" to execute

### 2. Automated Cleanup

The system automatically runs weekly on Sundays at 2:00 AM and:
- Identifies files older than the retention period
- Deletes files from Supabase storage
- Updates database records
- Logs all operations

### 3. API Endpoints

#### Manual Cleanup
```bash
POST /api/storage/cleanup
Content-Type: application/json

{
  "dryRun": false,
  "weeksToKeep": 1,
  "batchSize": 50
}
```

#### Automated Cleanup (Cron)
```bash
GET /api/cron/cleanup-storage
Authorization: Bearer your-secret-token
```

#### Test Cleanup
```bash
GET /api/test-cleanup
```

## 📊 Retention Logic

### Week Calculation
- **Week Ending**: Saturday (configurable)
- **Current Week**: Week containing today's date
- **Retention Period**: Current week + N past weeks

### File Selection Criteria
Files are eligible for deletion if they meet ALL criteria:
1. `parsed_status = 'success'` (successfully parsed)
2. `file_url IS NOT NULL` (file still exists in storage)
3. `week_ending_date <= cutoff_date` (older than retention period)

### Example Timeline
```
Current Date: October 1, 2025 (Wednesday)
Week Ending: October 4, 2025 (Saturday)
Retention: 1 week (current + 1 past)

Cutoff Date: September 27, 2025 (Saturday)
Files to Delete: week_ending_date <= 2025-09-27
Files to Keep: week_ending_date > 2025-09-27
```

## 🗄️ Database Schema

### Accomplishment Reports Table
```sql
CREATE TABLE public.accomplishment_reports (
  id UUID PRIMARY KEY,
  file_url TEXT,                    -- NULL when file is deleted
  file_deleted_at TIMESTAMPTZ,      -- Timestamp when file was deleted
  parsed_status TEXT,               -- 'success', 'failed', 'pending'
  week_ending_date DATE,            -- Used for retention calculation
  -- ... other columns
);
```

### Migration Files
- `20250101000007_add_file_deletion_tracking.sql` - Adds deletion tracking
- `20250101000008_allow_null_file_url.sql` - Allows NULL file_url

## 🔍 Monitoring & Debugging

### Log Messages
```
🤖 Starting automated storage cleanup...
🔍 Looking for files older than 2025-09-27 (keeping 1 weeks)
📊 Found 10 old parsed reports to cleanup
🗑️ Deleting 10 files from bucket: accomplishment-reports
✅ Successfully deleted 10 files from bucket: accomplishment-reports
✅ Updated 10 database records
🎉 Cleanup completed: 10 files deleted, 101.63 MB freed
```

### Error Handling
- **File URL parsing errors**: Logged and skipped
- **Storage deletion failures**: Logged and retried
- **Database update failures**: Logged and reported
- **Network timeouts**: Handled gracefully

### Statistics Tracking
```typescript
interface CleanupStats {
  totalFilesToDelete: number;
  totalSizeToFree: number;
  cutoffDate: string;
  oldestFile?: string;
  newestFile?: string;
}
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. Files Not Being Deleted
**Symptoms**: Files remain in storage after cleanup
**Causes**:
- `parsed_status != 'success'`
- `week_ending_date` is newer than cutoff
- `file_url IS NULL` (already deleted)

**Solution**: Check database records and parsing status

#### 2. Double Bucket Names in URLs
**Symptoms**: "Invalid file URL" errors
**Cause**: URLs like `bucket/bucket/filename` instead of `bucket/filename`
**Solution**: Fixed in extraction logic (handled automatically)

#### 3. Database Constraint Errors
**Symptoms**: "null value in column file_url violates not-null constraint"
**Cause**: Migration not applied
**Solution**: Run `supabase migration up`

#### 4. Storage Usage Not Decreasing
**Symptoms**: Supabase dashboard shows same storage usage
**Cause**: Dashboard refresh delay (up to 1 hour)
**Solution**: Wait for dashboard to update

### Debug Commands

#### Check File Status
```sql
SELECT 
  file_name, 
  week_ending_date, 
  parsed_status, 
  file_url IS NOT NULL as file_exists,
  file_deleted_at
FROM accomplishment_reports 
ORDER BY week_ending_date DESC;
```

#### Check Cleanup Stats
```bash
curl "http://localhost:3000/api/storage/cleanup?weeksToKeep=1"
```

## 🔒 Security

### Authentication
- **Admin UI**: Requires authentication via existing auth system
- **API Endpoints**: Protected by Next.js middleware
- **Cron Endpoint**: Optional token-based authentication

### Data Safety
- **Dry Run Mode**: Preview deletions without executing
- **Batch Processing**: Limits impact of failures
- **Comprehensive Logging**: Full audit trail
- **Database Backup**: Files marked as deleted, not removed from records

## 📈 Performance

### Optimization Features
- **Batch Processing**: Processes files in configurable batches
- **Efficient Queries**: Uses indexed columns for fast lookups
- **Parallel Operations**: Groups files by bucket for efficient deletion
- **Error Recovery**: Continues processing after individual failures

### Resource Usage
- **Memory**: Minimal (processes files in batches)
- **Storage**: Reduces usage by deleting old files
- **Database**: Adds tracking columns (minimal overhead)
- **Network**: Efficient API calls to Supabase

## 🔄 Maintenance

### Regular Tasks
- **Monitor Logs**: Check for errors in daily cleanup
- **Review Retention**: Adjust weeks based on business needs
- **Update Dependencies**: Keep Supabase SDK updated
- **Backup Database**: Regular backups of parsed data

### Scaling Considerations
- **Large File Counts**: Increase batch size for faster processing
- **Multiple Buckets**: Extend service to handle other bucket types
- **Custom Retention**: Add per-project retention policies
- **External Storage**: Consider moving old files to cheaper storage

## 📝 API Reference

### StorageCleanupService

#### Methods
```typescript
// Get cleanup statistics
getCleanupStats(weeksToKeep: number): Promise<CleanupStats>

// Perform cleanup
cleanupOldFiles(options: CleanupOptions): Promise<CleanupResult>

// Extract file path from URL (private)
extractFilePath(fileUrl: string): string | null

// Extract bucket name from URL (private)
extractBucketName(fileUrl: string): string | null
```

#### Interfaces
```typescript
interface CleanupOptions {
  dryRun?: boolean;
  weeksToKeep?: number;
  batchSize?: number;
}

interface CleanupResult {
  success: boolean;
  filesDeleted: number;
  storageFreed: number;
  errors: string[];
  deletedFiles: string[];
}
```

## 🎯 Best Practices

### Configuration
- **Start Conservative**: Begin with longer retention periods
- **Monitor Results**: Watch storage usage and system performance
- **Adjust Gradually**: Reduce retention period over time
- **Test First**: Always test with dry run before live execution

### Monitoring
- **Set Up Alerts**: Monitor for cleanup failures
- **Track Metrics**: Monitor storage usage trends
- **Review Logs**: Regular review of cleanup operations
- **User Communication**: Inform users about retention policies

### Data Management
- **Backup Important Data**: Ensure critical files are backed up
- **Document Retention Policy**: Clear communication about file retention
- **Regular Audits**: Periodic review of what's being deleted
- **Compliance**: Consider regulatory requirements for data retention

---

## 📞 Support

For issues or questions about the Storage Cleanup System:
1. Check the troubleshooting section above
2. Review application logs for error details
3. Test with the `/api/test-cleanup` endpoint
4. Contact the development team with specific error messages

**Version**: 1.0.0  
**Last Updated**: October 2025  
**Maintainer**: Development Team
