import { Metadata } from 'next';
import StorageCleanupManager from '@/components/storage/StorageCleanupManager';

export const metadata: Metadata = {
  title: 'Storage Cleanup - ARSD Dashboard',
  description: 'Manage storage cleanup for accomplishment reports',
};

export default function StorageCleanupPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Storage Cleanup</h1>
        <p className="text-muted-foreground mt-2">
          Clean up old parsed accomplishment report files to reduce storage costs.
        </p>
      </div>

      <StorageCleanupManager />
    </div>
  );
}
