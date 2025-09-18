'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileText, Users } from 'lucide-react';
import { useRBAC } from '@/hooks/useRBAC';
import AssignedProjectsList from '@/components/uploads/AssignedProjectsList';
import ReportsManagement from '@/components/uploads/ReportsManagement';

export default function Uploads() {
  const { user, hasPermission } = useRBAC();
  const [activeTab, setActiveTab] = useState('upload');
  const [canUpload, setCanUpload] = useState(false);
  const [canViewAll, setCanViewAll] = useState(false);

  // Determine which tabs to show based on user role
  useEffect(() => {
    const checkPermissions = async () => {
      const hasUploadPermission = await hasPermission('manage_uploads');
      setCanUpload(hasUploadPermission && user?.role === 'project_manager');
      setCanViewAll(hasUploadPermission && ['superadmin', 'project_inspector'].includes(user?.role || ''));
    };
    
    if (user) {
      checkPermissions();
    }
  }, [user, hasPermission]);

  if (!user) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold mb-4">Uploads</h1>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Uploads</h1>
          <p className="text-gray-500">
            {user.role === 'project_manager' 
              ? 'Upload and manage your weekly accomplishment reports'
              : 'View and manage all accomplishment reports'
            }
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          {canUpload && (
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload Reports
            </TabsTrigger>
          )}
          {canViewAll && (
            <TabsTrigger value="manage" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Manage Reports
            </TabsTrigger>
          )}
        </TabsList>

        {canUpload && (
          <TabsContent value="upload" className="space-y-6">
            <AssignedProjectsList />
          </TabsContent>
        )}

        {canViewAll && (
          <TabsContent value="manage" className="space-y-6">
            <ReportsManagement />
          </TabsContent>
        )}

        {!canUpload && !canViewAll && (
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
              <p className="text-gray-500">
                You don't have permission to access the uploads section. 
                Contact your administrator for access.
              </p>
            </CardContent>
          </Card>
        )}
      </Tabs>
    </div>
  );
}
