"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Eye } from "lucide-react";
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

  const photoUrls = project.photoUrls || [];

  const handlePhotoClick = (index: number) => {
    setCurrentPhotoIndex(index);
    setIsModalOpen(true);
  };

  return (
    <>
      <article className="group bg-card border border-border rounded-lg overflow-hidden transition-colors duration-150 hover:border-foreground/15">
        <div className="relative overflow-hidden">
          {photoUrls.length > 0 ? (
            <div className="relative">
              <div className="relative h-56 overflow-hidden">
                <Image
                  src={photoUrls[0]}
                  alt={project.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Button
                    onClick={() => handlePhotoClick(0)}
                    variant="default"
                    size="sm"
                    aria-label={`View photos for ${project.name}`}
                  >
                    <Eye className="h-4 w-4" strokeWidth={1.75} />
                    View photos
                  </Button>
                </div>
                {photoUrls.length > 1 && (
                  <div className="absolute top-3 right-3 bg-foreground/80 text-background px-2 py-0.5 rounded-md text-xs font-medium nums">
                    +{photoUrls.length - 1} more
                  </div>
                )}
              </div>

              {photoUrls.length > 1 && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                  <div className="flex gap-2 overflow-x-auto">
                    {photoUrls.slice(0, 4).map((url, index) => (
                      <button
                        key={index}
                        onClick={() => handlePhotoClick(index)}
                        aria-label={`View photo ${index + 1}`}
                        className={`relative w-11 h-11 rounded-md overflow-hidden flex-shrink-0 transition-opacity duration-150 ${
                          index === 0 ? "ring-2 ring-white" : "opacity-80 hover:opacity-100"
                        }`}
                      >
                        <Image
                          src={url}
                          alt={`${project.name} — photo ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </button>
                    ))}
                    {photoUrls.length > 4 && (
                      <div className="relative w-11 h-11 rounded-md bg-white/20 flex items-center justify-center text-white text-xs font-medium nums">
                        +{photoUrls.length - 4}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-56 bg-muted flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                  <MapPin className="h-5 w-5 text-primary" strokeWidth={1.75} />
                </div>
                <p className="text-muted-foreground text-sm">No photos available</p>
              </div>
            </div>
          )}
        </div>

        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-base font-semibold text-foreground line-clamp-2">
            {project.name}
          </CardTitle>
          <div className="flex items-center gap-1.5 text-muted-foreground mt-1">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.75} />
            <span className="text-sm">{project.location}</span>
          </div>
        </CardHeader>

        <CardContent className="p-5 pt-0">
          {photoUrls.length > 0 && (
            <Button
              onClick={() => handlePhotoClick(0)}
              variant="outline"
              size="sm"
              aria-label={`Open gallery for ${project.name}`}
            >
              <Eye className="h-3.5 w-3.5" strokeWidth={1.75} />
              Gallery
            </Button>
          )}
        </CardContent>
      </article>

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
