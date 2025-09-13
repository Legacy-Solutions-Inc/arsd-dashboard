"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import Image from "next/image";

interface PhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: string[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  projectName: string;
}

export function PhotoModal({
  isOpen,
  onClose,
  photos,
  currentIndex,
  onIndexChange,
  projectName,
}: PhotoModalProps) {
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const goToPrevious = () => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : photos.length - 1;
    onIndexChange(newIndex);
  };

  const goToNext = () => {
    const newIndex = currentIndex < photos.length - 1 ? currentIndex + 1 : 0;
    onIndexChange(newIndex);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen) return;
    
    switch (e.key) {
      case "Escape":
        onClose();
        break;
      case "ArrowLeft":
        goToPrevious();
        break;
      case "ArrowRight":
        goToNext();
        break;
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentIndex]);

  if (!isOpen || photos.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl w-full h-[90vh] p-0 bg-black/95 border-none">
        <DialogHeader className="absolute top-4 left-4 z-50">
          <DialogTitle className="text-white text-lg font-semibold">
            {projectName} - Photo {currentIndex + 1} of {photos.length}
          </DialogTitle>
        </DialogHeader>

        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
        >
          <X className="h-6 w-6" />
        </Button>

        {/* Zoom toggle button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsZoomed(!isZoomed)}
          className="absolute top-4 right-16 z-50 text-white hover:bg-white/20"
        >
          <ZoomIn className="h-6 w-6" />
        </Button>

        {/* Main photo container */}
        <div className="relative w-full h-full flex items-center justify-center p-4">
          <div className="relative w-full h-full flex items-center justify-center">
            <Image
              src={photos[currentIndex]}
              alt={`${projectName} photo ${currentIndex + 1}`}
              width={800}
              height={600}
              className={`object-contain transition-transform duration-300 ${
                isZoomed ? "cursor-zoom-out max-w-none max-h-none w-full h-full" : "cursor-zoom-in max-w-4xl max-h-[80vh]"
              }`}
              onClick={() => setIsZoomed(!isZoomed)}
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
            />
          </div>

          {/* Navigation arrows */}
          {photos.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20"
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20"
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            </>
          )}
        </div>

        {/* Thumbnail strip */}
        {photos.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50">
            <div className="flex gap-2 bg-black/50 backdrop-blur-sm rounded-lg p-2">
              {photos.map((photo, index) => (
                <button
                  key={index}
                  onClick={() => onIndexChange(index)}
                  className={`relative w-16 h-16 rounded-md overflow-hidden transition-all duration-200 ${
                    index === currentIndex
                      ? "ring-2 ring-white scale-110"
                      : "hover:scale-105 opacity-70 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={photo}
                    alt={`Thumbnail ${index + 1}`}
                    width={64}
                    height={64}
                    className="object-cover w-full h-full"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
