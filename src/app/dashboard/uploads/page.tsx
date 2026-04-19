'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileText, Users, FileUp, Camera } from 'lucide-react';
import { useRBAC } from '@/hooks/useRBAC';
import AssignedProjectsList from '@/components/uploads/AssignedProjectsList';
import ReportsManagement from '@/components/uploads/ReportsManagement';
import ProgressPhotosManagement from '@/components/uploads/ProgressPhotosManagement';
import { UniversalLoading } from '@/components/ui/universal-loading';

export default function Uploads() {
  const { user, hasPermission, loading: rbacLoading } = useRBAC();
  const [activeTab, setActiveTab] = useState('upload');
  const [canUpload, setCanUpload] = useState(false);
  const [canViewAll, setCanViewAll] = useState(false);
  const [permissionsChecked, setPermissionsChecked] = useState(false);

  useEffect(() => {
    const checkPermissions = async () => {
      if (!user) {
        setPermissionsChecked(true);
        return;
      }

      const hasUploadPermission = await hasPermission('manage_uploads');

      if (user?.role === 'project_manager') {
        setCanUpload(hasUploadPermission);
        setCanViewAll(hasUploadPermission);
        setActiveTab('upload');
        setPermissionsChecked(true);
        return;
      }

      if (['superadmin', 'project_inspector'].includes(user?.role || '')) {
        setCanUpload(false);
        setCanViewAll(hasUploadPermission);
        setActiveTab('manage');
        setPermissionsChecked(true);
        return;
      }

      setCanUpload(false);
      setCanViewAll(false);
      setPermissionsChecked(true);
    };

    if (!rbacLoading && user !== undefined) {
      checkPermissions();
    }
  }, [user, hasPermission, rbacLoading]);

  if (rbacLoading || !permissionsChecked) {
    return (
      <UniversalLoading
        type="report"
        message="Loading report management"
        subtitle="Checking your permissions and loading available features"
        size="lg"
        fullScreen={true}
      />
    );
  }

  const tabCols =
    canUpload && canViewAll && user?.role !== 'project_manager'
      ? 'grid-cols-3'
      : (canUpload || canViewAll)
        ? 'grid-cols-2'
        : 'grid-cols-1';

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 pb-4 border-b border-border">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
            <FileUp className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
              Reports
            </div>
            <h1 className="text-h1 font-display text-foreground leading-none">
              Report Management
            </h1>
          </div>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList
          className={`grid w-full ${tabCols} bg-muted border border-border rounded-md p-1`}
        >
          {canUpload && (
            <TabsTrigger
              value="upload"
              className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs text-muted-foreground"
            >
              <Upload className="h-4 w-4" />
              <span>Upload reports</span>
            </TabsTrigger>
          )}
          {canViewAll && user?.role !== 'project_manager' && (
            <TabsTrigger
              value="manage"
              className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs text-muted-foreground"
            >
              <FileText className="h-4 w-4" />
              <span>Manage reports</span>
            </TabsTrigger>
          )}
          {canViewAll && (
            <TabsTrigger
              value="photos"
              className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs text-muted-foreground"
            >
              <Camera className="h-4 w-4" />
              <span>Progress photos</span>
            </TabsTrigger>
          )}
        </TabsList>

        {canUpload && (
          <TabsContent value="upload" className="space-y-6 mt-6">
            <AssignedProjectsList />
          </TabsContent>
        )}

        {canViewAll && user?.role !== 'project_manager' && (
          <TabsContent value="manage" className="space-y-6 mt-6">
            <ReportsManagement />
          </TabsContent>
        )}

        {canViewAll && (
          <TabsContent value="photos" className="space-y-6 mt-6">
            <ProgressPhotosManagement />
          </TabsContent>
        )}

        {!canUpload && !canViewAll && (
          <div className="mt-6 bg-card border border-border rounded-lg p-10 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="text-h3 text-foreground mb-1">Access denied</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              You don't have permission to access the uploads section. Contact your
              administrator for access.
            </p>
          </div>
        )}
      </Tabs>
    </div>
  );
}
