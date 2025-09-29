'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Calendar, Camera, Eye, X, ChevronDown } from "lucide-react";
import { useWeeklyProgressPhotos } from '@/hooks/useProgressPhotos';
import { getWeekEndingDate } from '@/types/progress-photos';
import type { ProgressPhoto } from '@/types/progress-photos';

interface ProgressPhotosSliderProps {
  projectId: string;
  weekEndingDate?: string;
}

export function ProgressPhotosSlider({ projectId, weekEndingDate }: ProgressPhotosSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedPhoto, setSelectedPhoto] = useState<ProgressPhoto | null>(null);
  const [selectedWeek, setSelectedWeek] = useState(weekEndingDate || getWeekEndingDate());
  
  const { weeklyPhotos, loading, error } = useWeeklyProgressPhotos(selectedWeek);
  
  // Find photos for this specific project
  const projectPhotos = weeklyPhotos.find(p => p.project_id === projectId)?.photos || [];
  
  // Format date function - moved before generateAvailableWeeks
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Generate available weeks (current week and up to 12 past weeks)
  const generateAvailableWeeks = () => {
    const weeks = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 13; i++) {
      const weekDate = new Date(currentDate);
      weekDate.setDate(currentDate.getDate() - (i * 7));
      
      // Find the Saturday (week ending) - same logic as accomplishment reports
      const day = weekDate.getDay();
      const diff = weekDate.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
      const monday = new Date(weekDate.setDate(diff));
      const saturday = new Date(monday);
      saturday.setDate(monday.getDate() + 5);
      
      const weekEndingDate = saturday.toISOString().split('T')[0];
      weeks.push({
        value: weekEndingDate,
        label: i === 0 ? 'Current Week' : `${i} week${i > 1 ? 's' : ''} ago`,
        date: formatDate(weekEndingDate)
      });
    }
    
    return weeks;
  };
  
  const availableWeeks = generateAvailableWeeks();
  
  const nextPhoto = () => {
    setCurrentIndex((prev) => (prev + 1) % projectPhotos.length);
  };

  const prevPhoto = () => {
    setCurrentIndex((prev) => (prev - 1 + projectPhotos.length) % projectPhotos.length);
  };

  const goToPhoto = (index: number) => {
    setCurrentIndex(index);
  };

  // Reset current index when week changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [selectedWeek]);

  // Auto-advance slider every 5 seconds
  useEffect(() => {
    if (projectPhotos.length <= 1) return;
    
    const interval = setInterval(nextPhoto, 5000);
    return () => clearInterval(interval);
  }, [projectPhotos.length]);

  const arsdRed = '#B91C1C';

  if (loading) {
    return (
      <Card className="overflow-hidden shadow-sm border border-gray-100">
        <CardHeader>
          <CardTitle className="text-arsd-red text-sm lg:text-base font-bold tracking-wide flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Progress Photos
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center bg-gray-50 py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-arsd-red"></div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="overflow-hidden shadow-sm border border-gray-100">
        <CardHeader className="px-3 py-3 sm:px-6 sm:py-4">
          <CardTitle className="text-arsd-red text-sm sm:text-base font-bold tracking-wide flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Progress Photos
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col justify-center items-center bg-gray-50 py-8 sm:py-12 px-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-50 rounded-full flex items-center justify-center mb-3 sm:mb-4">
            <X className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
          </div>
          <p className="text-red-600 font-medium mb-2 text-sm sm:text-base">Unable to load photos</p>
          <p className="text-gray-500 text-xs sm:text-sm text-center max-w-md">
            There was an error loading the progress photos. This might be due to a network issue or server problem.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-3 py-2 sm:px-4 sm:py-2 bg-arsd-red text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
          >
            Try Again
          </button>
        </CardContent>
      </Card>
    );
  }

  if (projectPhotos.length === 0) {
    return (
      <Card className="overflow-hidden shadow-sm border border-gray-100">
        <CardHeader className="px-3 py-3 sm:px-6 sm:py-4">
          <CardTitle className="text-arsd-red text-sm sm:text-base font-bold tracking-wide flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Progress Photos
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col justify-center items-center bg-gray-50 py-8 sm:py-12 px-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
            <Camera className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium mb-2 text-sm sm:text-base">No photos uploaded yet</p>
          <p className="text-gray-500 text-xs sm:text-sm text-center max-w-lg">
            Progress photos for week ending {formatDate(selectedWeek)} haven't been uploaded yet.
          </p>
          
          {/* Week Selector for empty state */}
          <div className="mt-6 flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Calendar className="h-4 w-4" />
              Try viewing a different week:
            </div>
            <Select value={selectedWeek} onValueChange={setSelectedWeek}>
              <SelectTrigger className="w-64 h-10 text-sm border-2 border-gray-200 hover:border-arsd-red/50 focus:border-arsd-red transition-colors bg-white shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="flex flex-col text-left">
                    <span className="font-medium text-gray-900 text-sm">
                      {availableWeeks.find(w => w.value === selectedWeek)?.label}
                    </span>
                    <span className="text-xs text-gray-500">
                      {availableWeeks.find(w => w.value === selectedWeek)?.date}
                    </span>
                  </div>
                </div>
              </SelectTrigger>
              <SelectContent className="w-64 max-h-64">
                {availableWeeks.map((week, index) => (
                  <SelectItem 
                    key={week.value} 
                    value={week.value} 
                    className="text-sm p-3 cursor-pointer hover:bg-gray-50 focus:bg-arsd-red/5 focus:text-arsd-red"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{week.label}</span>
                        <span className="text-xs text-gray-500">{week.date}</span>
                      </div>
                      {index === 0 && (
                        <Badge variant="outline" className="text-xs bg-arsd-red/10 text-arsd-red border-arsd-red/20 ml-6 flex-shrink-0">
                          Latest
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentPhoto = projectPhotos[currentIndex];

  return (
    <>
      <Card className="overflow-hidden shadow-sm border border-gray-100">
        <CardHeader className="px-3 py-3 sm:px-6 sm:py-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className="text-arsd-red text-sm sm:text-base font-bold tracking-wide flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Progress Photos
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">Week ending: {formatDate(selectedWeek)} </span>
                  <span className="sm:hidden">Week ending: {formatDate(selectedWeek)}</span>
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {projectPhotos.length} photo{projectPhotos.length !== 1 ? 's' : ''}
                </Badge>
              </div>
            </div>
            
            {/* Week Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label className="text-xs font-semibold text-gray-700 flex-shrink-0">
                View Week:
              </label>
              <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                <SelectTrigger className="w-full sm:w-72 h-10 text-sm border-2 border-gray-200 hover:border-arsd-red/50 focus:border-arsd-red transition-colors bg-white shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col text-left">
                      <span className="font-medium text-gray-900 text-sm">
                        {availableWeeks.find(w => w.value === selectedWeek)?.label}
                      </span>
                      <span className="text-xs text-gray-500">
                        {availableWeeks.find(w => w.value === selectedWeek)?.date}
                      </span>
                    </div>
                  </div>
                </SelectTrigger>
                <SelectContent className="w-72 max-h-64">
                  {availableWeeks.map((week, index) => (
                    <SelectItem 
                      key={week.value} 
                      value={week.value} 
                      className="text-sm p-3 cursor-pointer hover:bg-gray-50 focus:bg-arsd-red/5 focus:text-arsd-red"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{week.label}</span>
                          <span className="text-xs text-gray-500">{week.date}</span>
                        </div>
                        {index === 0 && (
                          <Badge variant="outline" className="text-xs bg-arsd-red/10 text-arsd-red border-arsd-red/20 ml-6 flex-shrink-0">
                            Latest
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative">
            {/* Main Image */}
            <div className="relative aspect-video bg-gray-100">
              <img
                src={currentPhoto.file_url}
                alt={currentPhoto.file_name}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => setSelectedPhoto(currentPhoto)}
              />
              
              {/* Navigation Arrows */}
              {projectPhotos.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={prevPhoto}
                    className="absolute left-1 sm:left-2 top-1/2 transform -translate-y-1/2 h-7 w-7 sm:h-8 sm:w-8 p-0 bg-black/50 text-white hover:bg-black/70"
                  >
                    <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={nextPhoto}
                    className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 sm:h-8 sm:w-8 p-0 bg-black/50 text-white hover:bg-black/70"
                  >
                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </>
              )}

              {/* Photo Counter */}
              {projectPhotos.length > 1 && (
                <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                  {currentIndex + 1} / {projectPhotos.length}
                </div>
              )}

              {/* View Full Size Button */}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedPhoto(currentPhoto)}
                className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 h-7 w-7 sm:h-8 sm:w-8 p-0 bg-black/50 text-white hover:bg-black/70"
              >
                <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>

            {/* Photo Info */}
            <div className="p-3 sm:p-4 bg-white border-t">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-xs sm:text-sm truncate" title={currentPhoto.file_name}>
                    {currentPhoto.file_name}
                  </p>
                  {currentPhoto.description && (
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{currentPhoto.description}</p>
                  )}
                </div>
                <p className="text-xs text-gray-500 flex-shrink-0">
                  {formatDate(currentPhoto.upload_date)}
                </p>
              </div>
            </div>

            {/* Thumbnail Navigation */}
            {projectPhotos.length > 1 && (
              <div className="p-3 sm:p-4 bg-gray-50 border-t">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {projectPhotos.map((photo, index) => (
                    <button
                      key={photo.id}
                      onClick={() => goToPhoto(index)}
                      className={`flex-shrink-0 w-12 h-8 sm:w-16 sm:h-12 rounded overflow-hidden border-2 transition-colors ${
                        index === currentIndex 
                          ? 'border-arsd-red' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <img
                        src={photo.file_url}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Full Size Photo Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-2 sm:p-4 z-50" 
          onClick={() => setSelectedPhoto(null)}
        >
          <div 
            className="bg-white rounded-lg w-full max-w-6xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 sm:p-4 border-b">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm sm:text-lg font-semibold truncate">{selectedPhoto.file_name}</h3>
                  <p className="text-xs sm:text-sm text-gray-500">
                    <span className="hidden sm:inline">Week ending:  {formatDate(selectedPhoto?.week_ending_date || '')} • </span>
                    <span className="sm:hidden">Week: {formatDate(selectedPhoto?.week_ending_date || '')} • </span>
                    Uploaded: {formatDate(selectedPhoto?.upload_date || '')}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedPhoto(null)}
                  className="flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="p-2 sm:p-4">
              <img
                src={selectedPhoto.file_url}
                alt={selectedPhoto.file_name}
                className="w-full h-auto max-h-[75vh] sm:max-h-[70vh] object-contain"
              />
              {selectedPhoto?.description && (
                <div className="mt-3 sm:mt-4 p-3 bg-gray-50 rounded">
                  <p className="text-xs sm:text-sm">{selectedPhoto.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
