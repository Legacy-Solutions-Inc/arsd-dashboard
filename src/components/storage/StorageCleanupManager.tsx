'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Info, 
  RefreshCw,
  HardDrive,
  Calendar,
  FileText
} from 'lucide-react';

interface CleanupStats {
  totalFilesToDelete: number;
  totalSizeToFree: number;
  totalSizeToFreeMB: number;
  cutoffDate: string;
  oldestFile?: string;
  newestFile?: string;
}

interface CleanupResult {
  success: boolean;
  message: string;
  filesDeleted: number;
  storageFreed: number;
  storageFreedMB: number;
  errors: string[];
  deletedFiles: string[];
  stats: CleanupStats;
  options: {
    dryRun: boolean;
    weeksToKeep: number;
    batchSize: number;
  };
}

export default function StorageCleanupManager() {
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [dryRun, setDryRun] = useState(true);
  const [weeksToKeep, setWeeksToKeep] = useState(2);
  const [batchSize, setBatchSize] = useState(50);
  const [stats, setStats] = useState<CleanupStats | null>(null);
  const [result, setResult] = useState<CleanupResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setStatsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/storage/cleanup?weeksToKeep=${weeksToKeep}`);
      const data = await response.json();
      
      if (data.success) {
        setStats(data);
      } else {
        setError(data.message || 'Failed to fetch cleanup stats');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cleanup stats');
    } finally {
      setStatsLoading(false);
    }
  };

  const performCleanup = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await fetch('/api/storage/cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dryRun,
          weeksToKeep,
          batchSize
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setResult(data);
        // Refresh stats after cleanup
        await fetchStats();
      } else {
        setError(data.message || 'Cleanup failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cleanup failed');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Storage Cleanup Manager
          </CardTitle>
          <CardDescription>
            Clean up old parsed accomplishment report files to reduce storage costs.
            Files older than the specified weeks will be permanently deleted.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weeksToKeep">Weeks to Keep</Label>
              <Input
                id="weeksToKeep"
                type="number"
                min="1"
                max="52"
                value={weeksToKeep}
                onChange={(e) => setWeeksToKeep(parseInt(e.target.value) || 2)}
              />
              <p className="text-xs text-muted-foreground">
                Keep current week + this many past weeks
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="batchSize">Batch Size</Label>
              <Input
                id="batchSize"
                type="number"
                min="1"
                max="100"
                value={batchSize}
                onChange={(e) => setBatchSize(parseInt(e.target.value) || 50)}
              />
              <p className="text-xs text-muted-foreground">
                Files to process per batch
              </p>
            </div>

            <div className="space-y-2">
              <Label>Dry Run Mode</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="dryRun"
                  checked={dryRun}
                  onCheckedChange={setDryRun}
                />
                <Label htmlFor="dryRun" className="text-sm">
                  {dryRun ? 'Preview only' : 'Delete files'}
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                {dryRun ? 'Shows what would be deleted' : 'Permanently deletes files'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={fetchStats}
              disabled={statsLoading}
              variant="outline"
            >
              {statsLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Info className="h-4 w-4 mr-2" />
              )}
              Check Stats
            </Button>

            <Button
              onClick={performCleanup}
              disabled={loading || statsLoading}
              variant={dryRun ? "outline" : "destructive"}
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              {dryRun ? 'Preview Cleanup' : 'Delete Files'}
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Stats Display */}
          {stats && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Cleanup Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Files to Delete:</span>
                      <Badge variant="outline">{stats.totalFilesToDelete}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Storage to Free:</span>
                      <Badge variant="outline">{stats.totalSizeToFreeMB} MB</Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Cutoff Date:</span>
                      <Badge variant="secondary">{formatDate(stats.cutoffDate)}</Badge>
                    </div>
                    {stats.oldestFile && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Oldest File:</span>
                        <Badge variant="secondary">{formatDate(stats.oldestFile)}</Badge>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Result Display */}
          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  Cleanup Result
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert variant={result.success ? "default" : "destructive"}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {result.message}
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Files Deleted:</span>
                      <Badge variant="outline">{result.filesDeleted}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Storage Freed:</span>
                      <Badge variant="outline">{result.storageFreedMB} MB</Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Weeks Kept:</span>
                      <Badge variant="secondary">{result.options.weeksToKeep}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Mode:</span>
                      <Badge variant={result.options.dryRun ? "secondary" : "destructive"}>
                        {result.options.dryRun ? 'Dry Run' : 'Live Delete'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Errors */}
                {result.errors.length > 0 && (
                  <div>
                    <Separator className="my-4" />
                    <h4 className="text-sm font-medium mb-2 text-red-600">Errors:</h4>
                    <div className="space-y-1">
                      {result.errors.map((error, index) => (
                        <p key={index} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                          {error}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Deleted Files List (for small lists) */}
                {result.deletedFiles.length > 0 && result.deletedFiles.length <= 10 && (
                  <div>
                    <Separator className="my-4" />
                    <h4 className="text-sm font-medium mb-2">Deleted Files:</h4>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {result.deletedFiles.map((file, index) => (
                        <p key={index} className="text-xs text-muted-foreground bg-gray-50 p-2 rounded">
                          {file}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
