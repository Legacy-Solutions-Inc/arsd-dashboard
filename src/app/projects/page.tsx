"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  Loader2, 
  Building2, 
  Sparkles, 
  BarChart3, 
  FolderOpen,
  MapPin,
  Calendar,
  Camera,
  Star,
  ArrowUpRight,
  Clock,
  Users,
  Award,
  CheckCircle,
  ExternalLink,
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { WebsiteProjectsService } from "@/services/projects/website-projects";
import { ProjectSkeleton } from "@/components/website-projects/ProjectSkeleton";
import { ProjectCard } from "@/components/ProjectCard";
import { useToast } from "@/components/ui/use-toast";
import { PROJECTS_DATA } from "@/constants/projects-data";

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

export default function Projects() {
  const [projectsWithUrls, setProjectsWithUrls] = useState<ProjectWithUrls[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState<ProjectWithUrls | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const { toast } = useToast();

  // Keyboard navigation while gallery is open
  useEffect(() => {
    if (!galleryOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextPhoto();
      if (e.key === 'ArrowLeft') prevPhoto();
      if (e.key === 'Escape') closeGallery();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [galleryOpen, currentProject, currentPhotoIndex]);

  // Fetch website projects with photos from Supabase
  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the client-side service to fetch projects
      const result = await WebsiteProjectsService.fetchProjects({
        page: 1,
        limit: 100, // Get all projects for display
        search: "",
        sort_by: "created_at",
        sort_order: "desc"
      });

      // Transform the data to include photo URLs
      const projectsWithPhotoUrls = await Promise.all(
        result.projects.map(async (project) => {
          // Generate photo URLs for each project
          const photoUrls = project.photos?.map(photo => {
            // Create a public URL for the photo
            const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/website-projects/${photo.file_path}`;
            return url;
          }) || [];

          return {
            id: project.id,
            name: project.name,
            location: project.location,
            created_at: project.created_at,
            photoUrls: photoUrls
          };
        })
      );

      console.log(`Fetched ${projectsWithPhotoUrls.length} projects from database:`, projectsWithPhotoUrls.map(p => ({ id: p.id, name: p.name, photoCount: p.photoUrls.length })));
      setProjectsWithUrls(projectsWithPhotoUrls);
    } catch (err: any) {
      console.error('Error fetching projects:', err);
      setError(err.message || 'Failed to fetch projects');
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
    fetchProjects();
  }, []);

  // Refresh data when page becomes visible (user switches back to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && !loading) {
        console.log('Page became visible, refreshing projects...');
        fetchProjects();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [loading]);

  // Use sample projects if no real data (from constants)
  const displayProjects = projectsWithUrls.length > 0 ? projectsWithUrls : PROJECTS_DATA.sampleProjects.map(p => ({...p, photoUrls: [...p.photoUrls]}));
  const visibleProjects = showAll ? displayProjects : displayProjects.slice(0, 6);

  // Gallery functions
  const openGallery = (project: any) => {
    if (project.photoUrls && project.photoUrls.length >= 1) {
      setCurrentProject(project as ProjectWithUrls);
      setCurrentPhotoIndex(0);
      setGalleryOpen(true);
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
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-16 sm:py-20 lg:py-32 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-arsd-red/20 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-arsd-red/20 backdrop-blur-sm text-arsd-red px-4 py-2 rounded-full text-sm font-semibold mb-6 border border-arsd-red/30">
                <Building2 className="h-4 w-4" />
                Our Portfolio
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                Construction Projects
                <span className="block text-arsd-red">That Inspire</span>
              </h1>
              <p className="text-lg sm:text-xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                Discover our latest construction achievements across the Philippines. Each project represents our commitment to excellence and innovation.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/contact-us">
                  <Button size="lg" className="w-full sm:w-auto bg-arsd-red hover:bg-arsd-red/90 text-white px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300">
                    Start Your Project
                    <ArrowUpRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/our-services">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-white text-white bg-transparent hover:bg-white hover:text-slate-900 px-8 py-4 text-lg font-semibold transition-all duration-300">
                    Our Services
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
            {PROJECTS_DATA.stats.map((stat, index) => {
              const icons: Record<string, any> = { BarChart3, Clock, Users };
              const IconComponent = icons[stat.icon];
              return (
                <div key={index} className={`text-center group ${index === 2 ? 'col-span-2 lg:col-span-1' : ''}`}>
                  <div className="w-16 h-16 bg-gradient-to-br from-arsd-red to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">{stat.number}</div>
                  <div className="text-gray-600 font-medium">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-14 lg:mb-20">
            <div className="inline-flex items-center gap-2 bg-arsd-red/10 text-arsd-red px-4 py-2 sm:px-6 sm:py-3 rounded-full text-xs sm:text-sm font-semibold mb-4 sm:mb-6">
              <Award className="h-4 w-4" />
              Featured Projects
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
              Our Latest Achievements
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-2">
              Showcasing our commitment to excellence through innovative construction solutions and exceptional project delivery.
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {Array.from({ length: 6 }).map((_, index) => (
                <ProjectSkeleton key={index} />
              ))}
            </div>
          ) : error ? (
            <div className="text-center max-w-2xl mx-auto">
              <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Building2 className="h-8 w-8 text-arsd-red" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Error loading projects</h3>
                <p className="text-gray-600 max-w-md mx-auto mb-8">
                  {error}
                </p>
                <Button 
                  onClick={fetchProjects} 
                  className="bg-arsd-red hover:bg-arsd-red/90 text-white"
                >
                  Try Again
                </Button>
              </div>
            </div>
          ) : (
            <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {visibleProjects.map((project) => (
                <div key={project.id} className="group">
                  <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100 overflow-hidden">
                    {/* Project Image */}
                    <div className="relative h-56 sm:h-72 lg:h-80 overflow-hidden">
                      {project.photoUrls && project.photoUrls.length > 0 ? (
                        <Image
                          src={project.photoUrls[0]}
                          alt={project.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <Building2 className="w-16 h-16 text-gray-400" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-white">
                            <Camera className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              {project.photoUrls?.length || 0} Photos
                            </span>
                          </div>
                          {project.photoUrls && project.photoUrls.length >= 2 && (
                            <div className="flex gap-1">
                              {project.photoUrls.map((_, index) => (
                                <div
                                  key={index}
                                  className={`w-2 h-2 rounded-full ${
                                    index === 0 ? 'bg-white' : 'bg-white/50'
                                  }`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Project Details */}
                    <div className="p-4 sm:p-4">
                      <div className="mb-2 sm:mb-3">
                        <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-arsd-red transition-colors duration-300">
                          {project.name}
                        </h3>
                        <div className="flex items-center gap-2 text-gray-600 mb-2">
                          <MapPin className="w-3 h-3" />
                          <span className="text-xs">{project.location}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(project.created_at).getFullYear()}</span>
                          </div>
                          {project.type && (
                            <div className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
                              {project.type}
                            </div>
                          )}
                        </div>
                        {project.value && (
                          <div className="text-sm font-bold text-arsd-red">
                            {project.value}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {project.photoUrls && project.photoUrls.length >= 1 ? (
                          <Button 
                            size="sm" 
                            className="w-full bg-arsd-red hover:bg-arsd-red/90 text-white text-xs py-2"
                            onClick={() => openGallery(project)}
                          >
                            {project.photoUrls.length > 1 ? 'View Gallery' : 'View Photo'}
                            <ExternalLink className="ml-1 w-3 h-3" />
                          </Button>
                        ) : (
                          <div className="w-full py-2 px-3 bg-gray-100 text-gray-500 text-xs text-center rounded-md">
                            No Photos Available
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {displayProjects.length > 6 && (
              <div className="text-center mt-10">
                {!showAll ? (
                  <Button 
                    onClick={() => setShowAll(true)}
                    className="bg-arsd-red hover:bg-arsd-red/90 text-white px-8 py-6 text-base font-semibold shadow-xl hover:shadow-2xl transition-all duration-300"
                  >
                    View All Projects
                  </Button>
                ) : (
                  <Button 
                    variant="outline"
                    onClick={() => setShowAll(false)}
                    className="border-arsd-red text-arsd-red hover:bg-arsd-red hover:text-white px-8 py-6 text-base font-semibold transition-all duration-300"
                  >
                    Show Less
                  </Button>
                )}
              </div>
            )}
            </>
          )}
        </div>
      </section>

      {/* Process Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16 lg:mb-20">
            <div className="inline-flex items-center gap-2 bg-arsd-red/10 text-arsd-red px-4 py-2 sm:px-6 sm:py-3 rounded-full text-xs sm:text-sm font-semibold mb-4 sm:mb-6">
              <Clock className="h-4 w-4" />
              Our Process
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
              How We Deliver Excellence
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              A systematic approach to ensure your project is completed efficiently and to your satisfaction.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
            {PROJECTS_DATA.deliveryProcess.map((process, index) => {
              const icons: Record<string, any> = { Building2, CheckCircle, Award, Star };
              const IconComponent = icons[process.icon];
              return (
              <div key={index} className="text-center group">
                <div className="relative mb-6 sm:mb-8">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-arsd-red to-red-600 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300 shadow-xl">
                    <IconComponent className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 bg-white text-arsd-red rounded-full flex items-center justify-center text-xs sm:text-sm font-bold border-2 border-arsd-red">
                    {process.step}
                  </div>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
                  {process.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{process.description}</p>
              </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-gradient-to-br from-arsd-red/20 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 sm:w-96 sm:h-96 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
              Ready to Build Your Dream Project?
            </h2>
            <p className="text-lg sm:text-xl text-slate-300 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed">
              Join our satisfied clients and let us bring your construction vision to life with our proven expertise and commitment to excellence.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Link href="/contact-us">
                <Button size="lg" className="w-full sm:w-auto bg-arsd-red hover:bg-arsd-red/90 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300">
                  Start Your Project
                  <ArrowUpRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </Link>
              <Link href="/our-services">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-white text-white bg-transparent hover:bg-white hover:text-slate-900 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold transition-all duration-300">
                  View Our Services
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* Gallery Modal */}
      {galleryOpen && currentProject && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{currentProject.name}</h3>
                <p className="text-sm text-gray-600">{currentProject.location}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeGallery}
                className="text-gray-500 hover:text-gray-700"
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
                  if (delta < 0) nextPhoto(); else prevPhoto();
                }
                setTouchStartX(null);
                setTouchEndX(null);
              }}
            >
              <div className="relative h-96 sm:h-[500px] bg-gray-100">
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
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 shadow-lg"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={nextPhoto}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 shadow-lg"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </>
              )}
            </div>

            {/* Footer with photo indicators */}
            {currentProject.photoUrls && currentProject.photoUrls.length > 1 && (
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center justify-center gap-2">
                  {currentProject.photoUrls.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPhotoIndex(index)}
                      className={`w-3 h-3 rounded-full transition-colors ${
                        index === currentPhotoIndex ? 'bg-arsd-red' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-center text-sm text-gray-600 mt-2">
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