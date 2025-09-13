"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Eye, Calendar, ChevronRight } from "lucide-react";
import Image from "next/image";
import { PhotoModal } from "@/components/PhotoModal";

interface ProjectCardProps {
  project: {
  id: string;
    name: string;
  location: string;
    created_at: string;
    photoUrls: string[];
  };
}

export function ProjectCard({ project }: ProjectCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // Ensure photoUrls is always an array
  const photoUrls = project.photoUrls || [];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
  };

  const handlePhotoClick = (index: number) => {
    setCurrentPhotoIndex(index);
    setIsModalOpen(true);
  };

  return (
    <>
      <Card className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border-0 hover:-translate-y-2">
        {/* Image Section */}
        <div className="relative overflow-hidden">
          {photoUrls.length > 0 ? (
            <div className="relative">
              {/* Main Photo */}
              <div className="relative h-64 overflow-hidden">
                <Image
                  src={photoUrls[0]}
                  alt={project.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                
                {/* View Button */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <Button
                    onClick={() => handlePhotoClick(0)}
                    className="bg-white/90 hover:bg-white text-gray-900 hover:text-arsd-red px-6 py-3 rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Photos
                  </Button>
                </div>

                {/* Photo Count Badge */}
                {photoUrls.length > 1 && (
                  <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
                    +{photoUrls.length - 1} more
                  </div>
                )}
              </div>

              {/* Thumbnail Gallery */}
              {photoUrls.length > 1 && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                    {photoUrls.slice(0, 4).map((url, index) => (
                      <button
                        key={index}
                        onClick={() => handlePhotoClick(index)}
                        className={`relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 transition-all duration-200 ${
                          index === 0 
                            ? "ring-2 ring-white scale-110" 
                            : "hover:scale-105 opacity-80 hover:opacity-100"
                        }`}
                      >
                        <Image
                          src={url}
                          alt={`${project.name} thumbnail ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </button>
                    ))}
                    {photoUrls.length > 4 && (
                      <div className="relative w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center text-white text-xs font-medium">
                        +{photoUrls.length - 4}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-64 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-arsd-red/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MapPin className="h-8 w-8 text-arsd-red" />
                </div>
                <p className="text-gray-500 text-sm">No photos available</p>
              </div>
            </div>
          )}
        </div>

        {/* Content Section */}
        <CardHeader className="p-6 pb-4">
          <div className="space-y-3">
            <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-arsd-red transition-colors duration-300 line-clamp-2">
              {project.name}
            </CardTitle>
            
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm font-medium">{project.location}</span>
            </div>

            <div className="flex items-center gap-2 text-gray-500">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">{formatDate(project.created_at)}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 pt-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-arsd-red font-medium text-sm">
              <span>View Details</span>
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
            </div>
            
            {photoUrls.length > 0 && (
              <Button
                onClick={() => handlePhotoClick(0)}
                variant="outline"
                size="sm"
                className="border-arsd-red text-arsd-red hover:bg-arsd-red hover:text-white transition-all duration-300"
              >
                <Eye className="h-4 w-4 mr-1" />
                Gallery
              </Button>
            )}
    </div>
        </CardContent>
      </Card>

      {/* Photo Modal */}
      <PhotoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        photos={photoUrls}
        currentIndex={currentPhotoIndex}
        onIndexChange={setCurrentPhotoIndex}
        projectName={project.name}
      />
    </>
  );
}