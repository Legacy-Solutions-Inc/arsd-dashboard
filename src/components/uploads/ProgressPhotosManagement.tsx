'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { 
  Camera, 
  Calendar, 
  User, 
  Building, 
  MapPin, 
  Filter,
  Search,
  AlertCircle,
  Eye,
  Download,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  X,
  RefreshCw
} from 'lucide-react';
import { useAllProgressPhotos, useDeleteProgressPhoto } from '@/hooks/useProgressPhotos';
import { useRBAC } from '@/hooks/useRBAC';
import { formatFileSize } from '@/types/progress-photos';
import type { ProgressPhoto, ProgressPhotoFilters } from '@/types/progress-photos';
import { UniversalLoading, InlineLoading } from '@/components/ui/universal-loading';

export default function ProgressPhotosManagement() {
  const [filters, setFilters] = useState<ProgressPhotoFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingPhoto, setDeletingPhoto] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<ProgressPhoto | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const itemsPerPage = 8; // Increased for more compact display
  
  const { photos, loading, error, refetch } = useAllProgressPhotos(filters);
  const { deletePhoto, loading: deleteLoading } = useDeleteProgressPhoto();
  const { user } = useRBAC();

  const handleWeekEndingFilter = (weekEndingDate: string) => {
    setFilters(prev => ({
      ...prev,
      week_ending_date: weekEndingDate === 'all' ? undefined : weekEndingDate
    }));
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const filteredPhotos = photos.filter(photo => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      photo.project_name?.toLowerCase().includes(searchLower) ||
      photo.client?.toLowerCase().includes(searchLower) ||
      photo.uploader_name?.toLowerCase().includes(searchLower) ||
      photo.file_name.toLowerCase().includes(searchLower) ||
      photo.description?.toLowerCase().includes(searchLower)
    );
  });

  // Group photos by project and week for better organization
  const groupedPhotos = filteredPhotos.reduce((acc, photo) => {
    const key = `${photo.project_id}-${photo.week_ending_date}`;
    if (!acc[key]) {
      acc[key] = {
        project_name: photo.project_name || 'Unknown Project',
        client: photo.client,
        location: photo.location,
        week_ending_date: photo.week_ending_date,
        photos: []
      };
    }
    acc[key].photos.push(photo);
    return acc;
  }, {} as Record<string, { project_name: string; client?: string; location?: string; week_ending_date: string; photos: ProgressPhoto[] }>);

  // Pagination logic
  const groupedEntries = Object.entries(groupedPhotos);
  const totalPages = Math.ceil(groupedEntries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedGroups = groupedEntries.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  const handleDelete = async (photoId: string) => {
    if (!confirm('Are you sure you want to delete this photo? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingPhoto(photoId);
      setIsDeleting(true);
      await deletePhoto(photoId);
      await refetch(); // Refresh the photos list
    } catch (error) {
      console.error('Delete failed:', error);
      alert(`Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDeletingPhoto(null);
      setIsDeleting(false);
    }
  };

  const canDeletePhoto = (photo: ProgressPhoto): boolean => {
    if (!user) return false;
    
    // Superadmin can delete any photo, or users can delete their own photos
    return user.role === 'superadmin' || photo.uploaded_by === user.id;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const downloadPhoto = async (photo: ProgressPhoto) => {
    try {
      setIsDownloading(photo.id);
      const response = await fetch(photo.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = photo.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download photo');
    } finally {
      setIsDownloading(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 mt-4">
        <div className="flex items-center gap-4 mt-4">
          <div className="w-12 h-12 bg-glass-subtle rounded-xl flex items-center justify-center">
            <Camera className="h-6 w-6 text-arsd-red" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-glass-primary text-arsd-red">Progress Photos</h2>
            <p className="text-glass-secondary text-sm">View and manage all uploaded progress photos</p>
          </div>
        </div>
        <div className="flex justify-center">
          <UniversalLoading
            type="general"
            message="Loading Progress Photos"
            subtitle="Fetching progress photos from database..."
            size="lg"
            fullScreen={false}
            className="max-w-md"
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-glass-subtle rounded-xl flex items-center justify-center">
            <Camera className="h-6 w-6 text-arsd-red" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-glass-primary text-arsd-red">Progress Photos</h2>
            <p className="text-glass-secondary">View and manage all uploaded progress photos</p>
          </div>
        </div>
        <Alert variant="destructive" className="glass-elevated border-red-200/50 bg-red-50/10">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Loading Overlay for Delete Operations */}
      {isDeleting && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-8 max-w-md mx-4">
            <UniversalLoading
              type="general"
              message="Deleting Photo"
              subtitle="Removing photo from storage and database..."
              size="md"
              showProgress={false}
            />
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-glass-subtle rounded-lg flex items-center justify-center">
            <Camera className="h-5 w-5 text-arsd-red" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-glass-primary text-arsd-red">Progress Photos</h2>
            <p className="text-glass-secondary text-sm">
              View and manage all uploaded progress photos
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="glass" className="text-sm bg-arsd-red/20 text-arsd-red border-arsd-red/30">
            {filteredPhotos.length} photo{filteredPhotos.length !== 1 ? 's' : ''}
          </Badge>
          {totalPages > 1 && (
            <Badge variant="glass" className="text-sm bg-blue-500/20 text-blue-700 border-blue-300/30">
              Page {currentPage} of {totalPages}
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Force refresh of photos list
              refetch();
            }}
            className="glass-button bg-gradient-to-r from-arsd-red/20 to-red-500/20 text-arsd-red border-arsd-red/30 hover:from-arsd-red/30 hover:to-red-500/30"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <GlassCard variant="elevated">
        <GlassCardHeader className="bg-gradient-to-r from-arsd-red/5 to-red-500/5 border-b border-arsd-red/10 py-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-arsd-red/20 rounded flex items-center justify-center">
              <Filter className="h-3 w-3 text-arsd-red" />
            </div>
            <GlassCardTitle className="text-sm text-arsd-red">Filters</GlassCardTitle>
          </div>
        </GlassCardHeader>
        <GlassCardContent className="p-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-glass-primary">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-arsd-red/60" />
                <Input
                  placeholder="Search photos..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="glass-input pl-7 h-7 text-xs"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-glass-primary">Week Ending</label>
              <Input
                type="date"
                value={filters.week_ending_date || ''}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  week_ending_date: e.target.value || undefined
                }))}
                className="glass-input h-7 text-xs"
              />
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Photos Grid */}
      <div className="space-y-4">
        {paginatedGroups.length === 0 ? (
          <GlassCard variant="elevated">
            <GlassCardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-arsd-red/20 to-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Camera className="h-8 w-8 text-arsd-red" />
              </div>
              <h3 className="text-xl font-bold text-glass-primary mb-3">No Progress Photos Found</h3>
              <p className="text-glass-secondary text-lg max-w-md mx-auto">
                {searchTerm || filters.week_ending_date
                  ? 'No photos match your current filters.'
                  : 'No progress photos have been uploaded yet.'
                }
              </p>
            </GlassCardContent>
          </GlassCard>
        ) : (
          paginatedGroups.map(([key, group]) => (
            <GlassCard key={key} variant="elevated">
              <GlassCardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <GlassCardTitle className="text-base text-glass-primary text-arsd-red">
                      {group.project_name}
                    </GlassCardTitle>
                    <div className="flex items-center gap-3 text-xs text-glass-secondary mt-1">
                      <span className="flex items-center gap-1">
                        <Building className="h-3 w-3 text-arsd-red" />
                        <span className="font-medium">{group.client}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-arsd-red" />
                        <span className="font-medium">{group.location}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-arsd-red" />
                        <span className="font-medium">Week ending: {formatDate(group.week_ending_date)}</span>
                      </span>
                    </div>
                  </div>
                  <Badge variant="glass" className="bg-blue-100 text-blue-800 text-xs">
                    {group.photos.length} photo{group.photos.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </GlassCardHeader>
              <GlassCardContent className="pt-0">
                <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
                  {group.photos.map((photo) => (
                    <div key={photo.id} className="relative group">
                      <div className="aspect-square bg-gray-100 rounded-md overflow-hidden">
                        <img
                          src={photo.file_url}
                          alt={photo.file_name}
                          className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                          onClick={() => setSelectedPhoto(photo)}
                        />
                      </div>
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center gap-1">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setSelectedPhoto(photo)}
                          className="h-6 w-6 p-0"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => downloadPhoto(photo)}
                          disabled={isDownloading === photo.id}
                          className="h-6 w-6 p-0"
                        >
                          {isDownloading === photo.id ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                          ) : (
                            <Download className="h-3 w-3" />
                          )}
                        </Button>
                        {canDeletePhoto(photo) && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(photo.id)}
                            disabled={deletingPhoto === photo.id || isDeleting}
                            className="h-6 w-6 p-0"
                          >
                            {deletingPhoto === photo.id || isDeleting ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </Button>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-glass-secondary">
                        <p className="font-medium truncate text-xs" title={photo.file_name}>
                          {photo.file_name.length > 12 ? photo.file_name.substring(0, 12) + '...' : photo.file_name}
                        </p>
                        <p className="text-glass-muted text-xs">
                          {formatFileSize(photo.file_size)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCardContent>
            </GlassCard>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <GlassCard variant="elevated">
          <GlassCardContent className="p-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-xs text-glass-secondary text-center sm:text-left">
                Showing {startIndex + 1} to {Math.min(endIndex, groupedEntries.length)} of {groupedEntries.length} project groups
              </div>
              
              <div className="flex items-center justify-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="glass-button disabled:opacity-50 disabled:cursor-not-allowed h-7 px-2"
                >
                  <ChevronLeft className="h-3 w-3" />
                  <span className="hidden sm:inline text-xs">Previous</span>
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNumber}
                        variant={currentPage === pageNumber ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToPage(pageNumber)}
                        className={`w-6 h-6 p-0 text-xs ${
                          currentPage === pageNumber
                            ? 'bg-arsd-red text-white hover:bg-arsd-red/90'
                            : 'glass-button'
                        }`}
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="glass-button disabled:opacity-50 disabled:cursor-not-allowed h-7 px-2"
                >
                  <span className="hidden sm:inline text-xs">Next</span>
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>
      )}

      {/* Photo Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => setSelectedPhoto(null)}>
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{selectedPhoto.file_name}</h3>
                  <p className="text-sm text-gray-500">
                    {selectedPhoto.project_name} • Week ending: {formatDate(selectedPhoto.week_ending_date)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadPhoto(selectedPhoto)}
                    disabled={isDownloading === selectedPhoto.id}
                    className="glass-button bg-gradient-to-r from-arsd-red/20 to-red-500/20 text-arsd-red border-arsd-red/30 hover:from-arsd-red/30 hover:to-red-500/30"
                  >
                    {isDownloading === selectedPhoto.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-arsd-red mr-2" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    {isDownloading === selectedPhoto.id ? 'Downloading...' : 'Download'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedPhoto(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="p-4">
              <img
                src={selectedPhoto.file_url}
                alt={selectedPhoto.file_name}
                className="w-full h-auto max-h-[60vh] object-contain"
              />
              {selectedPhoto.description && (
                <div className="mt-4 p-3 bg-gray-50 rounded">
                  <p className="text-sm">{selectedPhoto.description}</p>
                </div>
              )}
              <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                <span>Uploaded by: {selectedPhoto.uploader_name}</span>
                <span>{formatFileSize(selectedPhoto.file_size)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
