'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Upload, FileText, Calendar, User, MapPin, Building, AlertCircle, CheckCircle, Clock, FolderOpen, BarChart3 } from 'lucide-react';
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
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-glass-subtle rounded-xl flex items-center justify-center">
            <FolderOpen className="h-6 w-6 text-arsd-red" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-glass-primary text-arsd-red">Your Assigned Projects</h2>
            <p className="text-glass-secondary text-md">Upload weekly accomplishment reports for your assigned projects</p>
          </div>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <GlassCard key={i} variant="elevated" className="animate-pulse">
              <GlassCardContent className="p-6">
                <div className="h-4 bg-arsd-red/20 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-arsd-red/20 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-arsd-red/20 rounded w-24"></div>
              </GlassCardContent>
            </GlassCard>
          ))}
        </div>
      </div>
    );
  }

  if (projectsError || statusError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-glass-subtle rounded-xl flex items-center justify-center">
            <FolderOpen className="h-6 w-6 text-arsd-red" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-glass-primary text-arsd-red">Your Assigned Projects</h2>
            <p className="text-glass-secondary text-md">Upload weekly accomplishment reports for your assigned projects</p>
          </div>
        </div>
        <Alert variant="destructive" className="glass-elevated border-red-200/50 bg-red-50/10">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-800">
            {projectsError || statusError}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-glass-subtle rounded-xl flex items-center justify-center">
            <FolderOpen className="h-6 w-6 text-arsd-red" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-glass-primary text-arsd-red">Your Assigned Projects</h2>
            <p className="text-glass-secondary text-md">Upload weekly accomplishment reports for your assigned projects</p>
          </div>
        </div>
        <GlassCard variant="elevated" className="text-center">
          <GlassCardContent className="p-12">
            <div className="w-16 h-16 bg-gradient-to-br from-arsd-red/20 to-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FileText className="h-8 w-8 text-arsd-red" />
            </div>
            <h3 className="text-xl font-bold text-glass-primary mb-3">No Assigned Projects</h3>
            <p className="text-glass-secondary text-lg max-w-md mx-auto">
              You don't have any projects assigned to you yet. Contact your administrator for project assignments.
            </p>
          </GlassCardContent>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-glass-subtle rounded-xl flex items-center justify-center">
            <FolderOpen className="h-6 w-6 text-arsd-red" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-glass-primary text-arsd-red">Your Assigned Projects</h2>
            <p className="text-glass-secondary text-sm">
              Upload weekly accomplishment reports for your assigned projects
            </p>
          </div>
        </div>
        <Badge variant="glass" className="text-sm bg-arsd-red/20 text-arsd-red border-arsd-red/30">
          {projects.length} project{projects.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="grid gap-6">
        {projects.map((project) => {
          const uploadStatus = getProjectUploadStatus(project.id);
          const hasUpload = uploadStatus?.has_upload || false;
          const reportStatus = uploadStatus?.report?.status;

          return (
            <GlassCard key={project.id} variant="elevated" className="hover:shadow-xl transition-all duration-300 p-0">
              <GlassCardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <GlassCardTitle className="text-xl text-glass-primary text-arsd-red">{project.project_name}</GlassCardTitle>
                    <div className="flex items-center gap-6 text-sm text-glass-secondary">
                      <span className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-arsd-red" />
                        <span className="font-medium">{project.client}</span>
                      </span>
                      <span className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-arsd-red" />
                        <span className="font-medium">{project.location}</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusIcon(hasUpload, reportStatus)}
                    <Badge variant="glass" className={getStatusColor(hasUpload, reportStatus)}>
                      {getStatusText(hasUpload, reportStatus)}
                    </Badge>
                  </div>
                </div>
              </GlassCardHeader>
              <GlassCardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="text-sm text-glass-secondary">
                      <span className="font-semibold text-glass-primary">Project ID:</span> 
                      <span className="ml-2 font-mono bg-arsd-red/10 px-2 py-1 rounded-lg text-arsd-red">
                        {project.project_id}
                      </span>
                    </div>
                    <div className="text-sm text-glass-secondary">
                      <span className="font-semibold text-glass-primary">Status:</span> 
                      <span className="ml-2 capitalize">{project.status}</span>
                    </div>
                    {uploadStatus && (
                      <div className="text-sm text-glass-secondary">
                        <span className="font-semibold text-glass-primary">Week Ending:</span> 
                        <span className="ml-2 font-medium">{uploadStatus.week_ending_date}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-3">
                    {hasUpload ? (
                      <Button variant="outline" size="lg" disabled className="glass-button bg-gray-100/50 text-glass-muted border-gray-300/50 cursor-not-allowed">
                        <FileText className="h-4 w-4 mr-2" />
                        Report Uploaded
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleUploadClick(project)}
                        size="lg"
                        className="glass-button bg-gradient-to-r from-arsd-red/100 to-red-500/100 text-white border-arsd-red/50 hover:from-arsd-red/80 hover:to-red-500/80"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Report
                      </Button>
                    )}
                  </div>
                </div>
              </GlassCardContent>
            </GlassCard>
          );
        })}
      </div>

      {/* Upload Form Modal */}
      {uploadingProject && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-elevated rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
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
