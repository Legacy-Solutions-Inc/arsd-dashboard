'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileText, Users, FileUp, Camera } from 'lucide-react';
import { useRBAC } from '@/hooks/useRBAC';
import AssignedProjectsList from '@/components/uploads/AssignedProjectsList';
import ReportsManagement from '@/components/uploads/ReportsManagement';
import ProgressPhotosManagement from '@/components/uploads/ProgressPhotosManagement';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';

export default function Uploads() {
  const { user, hasPermission } = useRBAC();
  const [activeTab, setActiveTab] = useState('upload');
  const [canUpload, setCanUpload] = useState(false);
  const [canViewAll, setCanViewAll] = useState(false);

  // Determine which tabs to show based on user role
  useEffect(() => {
    const checkPermissions = async () => {
      const hasUploadPermission = await hasPermission('manage_uploads');
      
      // Project managers can upload reports and view their own progress photos
      if (user?.role === 'project_manager') {
        setCanUpload(hasUploadPermission);
        setCanViewAll(hasUploadPermission); // Allow viewing progress photos
        setActiveTab('upload');
        return;
      }
      
      // Superadmins and project inspectors see manage and photos tabs
      if (['superadmin', 'project_inspector'].includes(user?.role || '')) {
        setCanUpload(false);
        setCanViewAll(hasUploadPermission);
        setActiveTab('manage');
        return;
      }
      
      // Default case - no permissions
      setCanUpload(false);
      setCanViewAll(false);
    };
    
    if (user) {
      checkPermissions();
    }
  }, [user, hasPermission]);

  if (!user) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-glass-subtle rounded-xl flex items-center justify-center">
            <FileUp className="h-10 w-10 text-arsd-red" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-glass-primary flex items-center gap-3 text-arsd-red">
              Report Management
            </h1>
          </div>
        </div>
        <GlassCard variant="elevated" className="text-center">
          <GlassCardContent className="p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-arsd-red mx-auto mb-4"></div>
            <div className="text-glass-primary">Loading...</div>
          </GlassCardContent>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-8 mb-4">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-glass-subtle rounded-xl flex items-center justify-center">
            <FileUp className="h-10 w-10 text-arsd-red" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-glass-primary flex items-center gap-3 text-arsd-red">
              Report Management
            </h1>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`glass-elevated grid w-full p-1 ${
          canUpload && canViewAll && user?.role !== 'project_manager' ? 'grid-cols-3' : 
          (canUpload || canViewAll) ? 'grid-cols-2' : 
          'grid-cols-1'
        }`}>
          {canUpload && (
            <TabsTrigger 
              value="upload" 
              className="flex items-center gap-2 data-[state=active]:bg-arsd-red data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200"
            >
              <Upload className="h-4 w-4" />
              Upload Reports
            </TabsTrigger>
          )}
          {canViewAll && user?.role !== 'project_manager' && (
            <TabsTrigger 
              value="manage" 
              className="flex items-center gap-2 data-[state=active]:bg-arsd-red data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200"
            >
              <FileText className="h-4 w-4" />
              Manage Reports
            </TabsTrigger>
          )}
          {canViewAll && (
            <TabsTrigger 
              value="photos" 
              className="flex items-center gap-2 data-[state=active]:bg-arsd-red data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200"
            >
              <Camera className="h-4 w-4" />
              Progress Photos
            </TabsTrigger>
          )}
        </TabsList>

        {canUpload && (
          <TabsContent value="upload" className="space-y-8 mt-8">
            <AssignedProjectsList />
          </TabsContent>
        )}

        {canViewAll && user?.role !== 'project_manager' && (
          <TabsContent value="manage" className="space-y-8 mt-8">
            <ReportsManagement />
          </TabsContent>
        )}

        {canViewAll && (
          <TabsContent value="photos" className="space-y-8 mt-8">
            <ProgressPhotosManagement />
          </TabsContent>
        )}

        {!canUpload && !canViewAll && (
          <GlassCard variant="elevated" className="text-center">
            <GlassCardContent className="p-12">
              <div className="w-16 h-16 bg-gradient-to-br from-arsd-red/20 to-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="h-8 w-8 text-arsd-red" />
              </div>
              <h3 className="text-2xl font-bold text-glass-primary mb-4">Access Denied</h3>
              <p className="text-glass-secondary text-lg max-w-md mx-auto">
                You don't have permission to access the uploads section. 
                Contact your administrator for access.
              </p>
            </GlassCardContent>
          </GlassCard>
        )}
      </Tabs>
    </div>
  );
}
