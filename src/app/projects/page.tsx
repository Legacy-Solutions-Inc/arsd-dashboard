"use client";

import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import {
  Building2,
  MapPin,
  Camera,
  ArrowUpRight,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { WebsiteProjectsService } from "@/services/projects/website-projects";
import { ProjectSkeleton } from "@/components/website-projects/ProjectSkeleton";
import { useToast } from "@/components/ui/use-toast";
import { PROJECTS_DATA } from "@/constants/projects-data";
import { SectionEyebrow } from "@/components/SectionEyebrow";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { PageCTA } from "@/components/PageCTA";

interface ProjectWithUrls {
  id: string;
  name: string;
  location: string;
  created_at: string;
  photoUrls: string[];
  status?: string;
  type?: string;
  value?: string;
}

const PAGE_SIZE = 12;

export default function Projects() {
  const [projectsWithUrls, setProjectsWithUrls] = useState<ProjectWithUrls[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState<ProjectWithUrls | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const { toast } = useToast();

  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Keyboard navigation while gallery is open
  useEffect(() => {
    if (!galleryOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextPhoto();
      if (e.key === "ArrowLeft") prevPhoto();
      if (e.key === "Escape") closeGallery();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [galleryOpen, currentProject, currentPhotoIndex]);

  const fetchProjects = async (pageNum: number, append: boolean) => {
    try {
      setLoading(true);
      setError(null);

      const result = await WebsiteProjectsService.fetchProjects({
        page: pageNum,
        limit: PAGE_SIZE,
        search: "",
        sort_by: "created_at",
        sort_order: "desc",
      });

      const projectsWithPhotoUrls = await Promise.all(
        result.projects.map(async (project) => {
          const photoUrls =
            project.photos?.map(
              (photo) =>
                `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/website-projects/${photo.file_path}`
            ) || [];

          return {
            id: project.id,
            name: project.name,
            location: project.location,
            created_at: project.created_at,
            photoUrls,
          };
        })
      );

      if (append) {
        setProjectsWithUrls((prev) => [...prev, ...projectsWithPhotoUrls]);
      } else {
        setProjectsWithUrls(projectsWithPhotoUrls);
      }

      if (result.projects.length < PAGE_SIZE) {
        setHasMore(false);
      }
    } catch (err: any) {
      console.error("Error fetching projects:", err);
      setError(err.message || "Failed to fetch projects");
      toast({
        title: "Error",
        description: "Failed to load projects. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects(1, false);
  }, []);

  // Use sample projects if no real data (from constants)
  const displayProjects =
    projectsWithUrls.length > 0
      ? projectsWithUrls
      : PROJECTS_DATA.sampleProjects.map((p) => ({ ...p, photoUrls: [...p.photoUrls] }));

  // Gallery functions
  const openGallery = (project: ProjectWithUrls) => {
    if (project.photoUrls && project.photoUrls.length >= 1) {
      setCurrentProject(project);
      setCurrentPhotoIndex(0);
      setGalleryOpen(true);
      setTimeout(() => closeButtonRef.current?.focus(), 50);
    }
  };

  const closeGallery = () => {
    setGalleryOpen(false);
    setCurrentProject(null);
    setCurrentPhotoIndex(0);
  };

  const nextPhoto = () => {
    if (currentProject && currentProject.photoUrls) {
      setCurrentPhotoIndex((prev) =>
        prev === currentProject.photoUrls.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevPhoto = () => {
    if (currentProject && currentProject.photoUrls) {
      setCurrentPhotoIndex((prev) =>
        prev === 0 ? currentProject.photoUrls.length - 1 : prev - 1
      );
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#111111]">
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-20 sm:py-28 lg:py-36 bg-[#111111] overflow-hidden">
        <div className="responsive-container">
          <SectionEyebrow className="mb-4">Our Portfolio</SectionEyebrow>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl tracking-tighter text-[#f0ede8] uppercase leading-none mb-6 max-w-3xl">
            Projects That<br />Define Excellence
          </h1>
          <p className="text-[#a09890] max-w-[55ch] leading-relaxed mb-10">
            Discover our construction achievements across the Philippines. Each project reflects our commitment to structural integrity and craftsmanship.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/contact-us">
              <Button className="bg-arsd-red text-white hover:bg-red-700">
                Start Your Project <ArrowUpRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/our-services">
              <Button
                variant="outline"
                className="border-[#2a2626] text-[#f0ede8] hover:border-[#f0ede8] bg-transparent"
              >
                Our Services
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 sm:py-20 bg-[#111111] border-y border-[#2a2626]">
        <div className="responsive-container">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-0 sm:divide-x sm:divide-[#2a2626]">
            {[
              { value: 500, suffix: "+", label: "Projects Completed" },
              { value: 25, suffix: "+", label: "Years Experience" },
              { value: 100, suffix: "+", label: "Satisfied Clients" },
            ].map((stat) => (
              <div key={stat.label} className="text-center sm:px-8">
                <div className="font-display text-6xl sm:text-7xl tracking-tighter text-[#f0ede8] leading-none mb-2">
                  <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-sm text-[#a09890] uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="py-16 sm:py-20 lg:py-24 bg-[#111111]">
        <div className="responsive-container">
          <div className="mb-10 sm:mb-14">
            <SectionEyebrow className="mb-4">Our Work</SectionEyebrow>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl tracking-tight text-[#f0ede8] uppercase">
              Our Latest Achievements
            </h2>
          </div>

          {loading && projectsWithUrls.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {Array.from({ length: 6 }).map((_, index) => (
                <ProjectSkeleton key={index} />
              ))}
            </div>
          ) : error ? (
            <div className="text-center max-w-2xl mx-auto">
              <div className="bg-[#1c1c1c] rounded-2xl p-8 border border-[#2a2626]">
                <Building2 className="h-10 w-10 text-arsd-red mx-auto mb-4" />
                <h3 className="text-xl font-display text-[#f0ede8] uppercase tracking-tight mb-3">
                  Error loading projects
                </h3>
                <p className="text-[#a09890] max-w-md mx-auto mb-6">{error}</p>
                <Button
                  onClick={() => fetchProjects(1, false)}
                  className="bg-arsd-red hover:bg-red-700 text-white"
                >
                  Try Again
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {displayProjects.map((project) => {
                  const hasPhotos = project.photoUrls && project.photoUrls.length > 0;
                  return (
                    <div
                      key={project.id}
                      className={hasPhotos ? "group cursor-pointer" : "group"}
                      onClick={hasPhotos ? () => openGallery(project) : undefined}
                    >
                      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-[#1c1c1c]">
                        {hasPhotos ? (
                          <Image
                            src={project.photoUrls[0]}
                            alt={project.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-[#2a2626] flex items-center justify-center">
                            <Building2 className="w-10 h-10 text-[#a09890]" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <h3 className="font-display text-base sm:text-lg text-white uppercase tracking-tight leading-tight">
                            {project.name}
                          </h3>
                          <div className="flex items-center gap-1 text-white/70 text-xs mt-1">
                            <MapPin className="w-3 h-3" /> {project.location}
                          </div>
                        </div>
                        {project.photoUrls?.length > 1 && (
                          <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/50 text-white/80 text-xs px-2 py-1 rounded">
                            <Camera className="w-3 h-3" /> {project.photoUrls.length}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {hasMore && !loading && !error && (
                <div className="text-center mt-10">
                  <Button
                    onClick={() => {
                      const next = page + 1;
                      setPage(next);
                      fetchProjects(next, true);
                    }}
                    variant="outline"
                    className="border-[#2a2626] text-[#f0ede8] hover:border-[#f0ede8] bg-transparent px-8"
                  >
                    Load More
                  </Button>
                </div>
              )}

              {loading && projectsWithUrls.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mt-6">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <ProjectSkeleton key={index} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Process Section */}
      <section className="py-16 sm:py-20 bg-[#1c1c1c]">
        <div className="responsive-container">
          <SectionEyebrow className="mb-4">How We Work</SectionEyebrow>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl tracking-tight text-[#f0ede8] uppercase mb-12">
            Our Process
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {PROJECTS_DATA.deliveryProcess.map((process, index) => (
              <div key={index}>
                <div className="text-xs text-arsd-red font-mono mb-3">{process.step}</div>
                <h3 className="font-display text-xl text-[#f0ede8] uppercase tracking-tight mb-2">
                  {process.title}
                </h3>
                <p className="text-sm text-[#a09890] leading-relaxed">{process.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <PageCTA
        heading="Ready to Build Your Dream Project?"
        body="Join our satisfied clients and let us bring your construction vision to life with our proven expertise and commitment to excellence."
        primaryLabel="Start Your Project"
        primaryHref="/contact-us"
        secondaryLabel="View Services"
        secondaryHref="/our-services"
      />

      <Footer />

      {/* Gallery Modal */}
      {galleryOpen && currentProject && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="gallery-title"
        >
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#1c1c1c] rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#2a2626]">
              <div>
                <h3
                  id="gallery-title"
                  className="text-xl font-bold text-[#f0ede8]"
                >
                  {currentProject.name}
                </h3>
                <p className="text-sm text-[#a09890]">{currentProject.location}</p>
              </div>
              <Button
                ref={closeButtonRef}
                variant="ghost"
                size="sm"
                onClick={closeGallery}
                aria-label="Close gallery"
                className="text-[#a09890] hover:text-[#f0ede8]"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Image Container */}
            <div
              className="relative"
              onTouchStart={(e) => setTouchStartX(e.changedTouches[0].clientX)}
              onTouchMove={(e) => setTouchEndX(e.changedTouches[0].clientX)}
              onTouchEnd={() => {
                if (touchStartX === null || touchEndX === null) return;
                const delta = touchEndX - touchStartX;
                if (Math.abs(delta) > 40) {
                  if (delta < 0) nextPhoto();
                  else prevPhoto();
                }
                setTouchStartX(null);
                setTouchEndX(null);
              }}
            >
              <div className="relative h-96 sm:h-[500px] bg-[#111111]">
                {currentProject.photoUrls && currentProject.photoUrls[currentPhotoIndex] && (
                  <Image
                    src={currentProject.photoUrls[currentPhotoIndex]}
                    alt={`${currentProject.name} - Photo ${currentPhotoIndex + 1}`}
                    fill
                    className="object-contain"
                  />
                )}
              </div>

              {/* Navigation Arrows */}
              {currentProject.photoUrls && currentProject.photoUrls.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={prevPhoto}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-[#2a2626]/90 hover:bg-[#2a2626] text-[#f0ede8] shadow-lg"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={nextPhoto}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-[#2a2626]/90 hover:bg-[#2a2626] text-[#f0ede8] shadow-lg"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </>
              )}
            </div>

            {/* Footer with photo indicators */}
            {currentProject.photoUrls && currentProject.photoUrls.length > 1 && (
              <div className="p-4 border-t border-[#2a2626]">
                <div className="flex items-center justify-center gap-2">
                  {currentProject.photoUrls.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPhotoIndex(index)}
                      aria-label={`Go to photo ${index + 1}`}
                      className={`p-2 w-3 h-3 rounded-full transition-colors ${
                        index === currentPhotoIndex ? "bg-arsd-red" : "bg-[#2a2626]"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-center text-sm text-[#a09890] mt-2">
                  {currentPhotoIndex + 1} of {currentProject.photoUrls.length} photos
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
