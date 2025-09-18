'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, Calendar, User, MapPin, Building, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useWeeklyUploadStatus } from '@/hooks/useAccomplishmentReports';
import CSVUploadForm from './CSVUploadForm';
import type { Project } from '@/types/projects';

export default function AssignedProjectsList() {
  const { projects, loading: projectsLoading, error: projectsError } = useProjects();
  const { status: weeklyStatus, loading: statusLoading, error: statusError } = useWeeklyUploadStatus();
  const [uploadingProject, setUploadingProject] = useState<Project | null>(null);

  const handleUploadClick = (project: Project) => {
    setUploadingProject(project);
  };

  const handleUploadSuccess = () => {
    setUploadingProject(null);
    // The hooks will automatically refetch data
  };

  const handleUploadCancel = () => {
    setUploadingProject(null);
  };

  const getProjectUploadStatus = (projectId: string) => {
    return weeklyStatus.find(s => s.project_id === projectId);
  };

  const getStatusIcon = (hasUpload: boolean, status?: string) => {
    if (hasUpload) {
      switch (status) {
        case 'approved':
          return <CheckCircle className="h-4 w-4 text-green-600" />;
        case 'rejected':
          return <AlertCircle className="h-4 w-4 text-red-600" />;
        default:
          return <Clock className="h-4 w-4 text-yellow-600" />;
      }
    }
    return <AlertCircle className="h-4 w-4 text-gray-400" />;
  };

  const getStatusText = (hasUpload: boolean, status?: string) => {
    if (hasUpload) {
      switch (status) {
        case 'approved':
          return 'Approved';
        case 'rejected':
          return 'Rejected';
        default:
          return 'Pending Review';
      }
    }
    return 'Not Uploaded';
  };

  const getStatusColor = (hasUpload: boolean, status?: string) => {
    if (hasUpload) {
      switch (status) {
        case 'approved':
          return 'bg-green-100 text-green-800';
        case 'rejected':
          return 'bg-red-100 text-red-800';
        default:
          return 'bg-yellow-100 text-yellow-800';
      }
    }
    return 'bg-gray-100 text-gray-800';
  };

  if (projectsLoading || statusLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-24"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (projectsError || statusError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {projectsError || statusError}
        </AlertDescription>
      </Alert>
    );
  }

  if (projects.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Assigned Projects</h3>
          <p className="text-gray-500">
            You don't have any projects assigned to you yet. Contact your administrator for project assignments.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Your Assigned Projects</h2>
          <p className="text-sm text-gray-500">
            Upload weekly accomplishment reports for your assigned projects
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {projects.length} project{projects.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="grid gap-4">
        {projects.map((project) => {
          const uploadStatus = getProjectUploadStatus(project.id);
          const hasUpload = uploadStatus?.has_upload || false;
          const reportStatus = uploadStatus?.report?.status;

          return (
            <Card key={project.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{project.project_name}</CardTitle>
                    <CardDescription className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <Building className="h-3 w-3" />
                        {project.client}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {project.location}
                      </span>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(hasUpload, reportStatus)}
                    <Badge className={getStatusColor(hasUpload, reportStatus)}>
                      {getStatusText(hasUpload, reportStatus)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Project ID:</span> {project.project_id}
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Status:</span> {project.status}
                    </div>
                    {uploadStatus && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Week Ending:</span> {uploadStatus.week_ending_date}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {hasUpload ? (
                      <Button variant="outline" size="sm" disabled>
                        <FileText className="h-4 w-4 mr-1" />
                        Report Uploaded
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleUploadClick(project)}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        Upload Report
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Upload Form Modal */}
      {uploadingProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CSVUploadForm
              project={uploadingProject}
              onUploadSuccess={handleUploadSuccess}
              onCancel={handleUploadCancel}
            />
          </div>
        </div>
      )}
    </div>
  );
}
