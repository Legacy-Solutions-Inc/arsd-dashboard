"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, Building2, Sparkles, BarChart3, FolderOpen } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { WebsiteProjectsService } from "@/services/projects/website-projects";
import { ProjectSkeleton } from "@/components/website-projects/ProjectSkeleton";
import { ProjectCard } from "@/components/ProjectCard";
import { useToast } from "@/components/ui/use-toast";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card";

interface ProjectWithUrls {
  id: string;
  name: string;
  location: string;
  created_at: string;
  photoUrls: string[];
}

export default function Projects() {
  const [projectsWithUrls, setProjectsWithUrls] = useState<ProjectWithUrls[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-arsd-red to-red-700 text-white py-20 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] bg-[length:20px_20px]" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-2 flex items-center gap-3">
                  <Sparkles className="h-10 w-10 text-yellow-300" />
                  Our Construction Projects
                </h1>
                <p className="text-xl text-red-100">
                  Showcasing our commitment to excellence through successful project
                  deliveries across the Philippines.
                </p>
              </div>
            </div>
            <div className="flex justify-center">
              <Image
                src="/images/arsd-logo.png"
                alt="ARSD Construction Corporation"
                width={80}
                height={80}
                className="rounded-full bg-white/20 backdrop-blur-sm p-2 border border-white/30"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Project Stats */}
      <section className="py-20 bg-transparent">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <GlassCard variant="elevated" className="hover:shadow-2xl transition-all duration-300">
              <GlassCardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-arsd-red/20 to-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-8 w-8 text-arsd-red" />
                </div>
                <div className="text-4xl font-bold text-glass-primary mb-3">50+</div>
                <div className="text-glass-secondary font-medium">Projects Completed</div>
              </GlassCardContent>
            </GlassCard>
            <GlassCard variant="elevated" className="hover:shadow-2xl transition-all duration-300">
              <GlassCardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-arsd-red/20 to-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Building2 className="h-8 w-8 text-arsd-red" />
                </div>
                <div className="text-4xl font-bold text-glass-primary mb-3">₱7B+</div>
                <div className="text-glass-secondary font-medium">Total Project Value</div>
              </GlassCardContent>
            </GlassCard>
            <GlassCard variant="elevated" className="hover:shadow-2xl transition-all duration-300">
              <GlassCardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-arsd-red/20 to-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-8 w-8 text-arsd-red" />
                </div>
                <div className="text-4xl font-bold text-glass-primary mb-3">15+</div>
                <div className="text-glass-secondary font-medium">Years Experience</div>
              </GlassCardContent>
            </GlassCard>
            <GlassCard variant="elevated" className="hover:shadow-2xl transition-all duration-300">
              <GlassCardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-arsd-red/20 to-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FolderOpen className="h-8 w-8 text-arsd-red" />
                </div>
                <div className="text-4xl font-bold text-glass-primary mb-3">98%</div>
                <div className="text-glass-secondary font-medium">Client Satisfaction</div>
              </GlassCardContent>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Featured Projects (from database) */}
      <section className="py-20 bg-transparent">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="w-12 h-12 bg-glass-subtle rounded-xl flex items-center justify-center">
                <Building2 className="h-6 w-6 text-arsd-red" />
              </div>
              <div>
                <div className="inline-flex items-center gap-2 bg-arsd-red/20 text-arsd-red px-6 py-3 rounded-full text-sm font-semibold mb-6 border border-arsd-red/30">
                  <Building2 className="h-4 w-4" />
                  Our Portfolio
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-glass-primary mb-4 flex items-center justify-center gap-3">
                  <Sparkles className="h-10 w-10 text-yellow-500" />
                  Featured Construction Projects
                </h2>
                <p className="text-xl text-glass-secondary max-w-3xl leading-relaxed">
                  Discover our latest construction achievements across the Philippines. 
                  Each project represents our commitment to excellence and innovation.
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, index) => (
                <ProjectSkeleton key={index} />
              ))}
            </div>
          ) : error ? (
            <GlassCard variant="elevated" className="text-center max-w-2xl mx-auto">
              <GlassCardContent className="p-12">
                <div className="w-24 h-24 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Building2 className="h-12 w-12 text-arsd-red" />
                </div>
                <h3 className="text-2xl font-bold text-glass-primary mb-4">Error loading projects</h3>
                <p className="text-glass-secondary max-w-md mx-auto mb-8">
                  {error}
                </p>
                <Button 
                  onClick={fetchProjects} 
                  className="glass-button bg-gradient-to-r from-arsd-red/100 to-red-500/100 text-white border-arsd-red/50 hover:from-arsd-red/80 hover:to-red-500/80"
                >
                  Try Again
                </Button>
              </GlassCardContent>
            </GlassCard>
          ) : projectsWithUrls.length === 0 ? (
            <GlassCard variant="elevated" className="text-center max-w-2xl mx-auto">
              <GlassCardContent className="p-12">
                <div className="w-24 h-24 bg-gradient-to-br from-arsd-red/20 to-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Building2 className="h-12 w-12 text-arsd-red" />
                </div>
                <h3 className="text-2xl font-bold text-glass-primary mb-4">No projects yet</h3>
                <p className="text-glass-secondary max-w-md mx-auto">
                  We're working on amazing projects. Check back soon to see our latest construction achievements.
                </p>
              </GlassCardContent>
            </GlassCard>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
              {projectsWithUrls.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-arsd-red to-red-700 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] bg-[length:20px_20px]" />
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <div>
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-full text-sm font-semibold mb-6 border border-white/30">
                  <Building2 className="h-4 w-4" />
                  Ready to Build Together?
                </div>
                <h2 className="text-4xl md:text-5xl font-bold mb-6 flex items-center justify-center gap-3">
                  <Sparkles className="h-10 w-10 text-yellow-300" />
                  Ready to Start Your Next Project?
                </h2>
                <p className="text-xl text-red-100 max-w-3xl mx-auto leading-relaxed">
                  Join our satisfied clients and let us bring your construction vision
                  to life with our proven expertise and commitment to excellence.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link href="/contact">
                <Button 
                  size="lg"
                  className="glass-button bg-white text-arsd-red hover:bg-gray-100 hover:scale-105 transition-all duration-300 px-8 py-4 text-lg font-semibold shadow-xl"
                >
                  Start Your Project
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button
                  size="lg"
                  variant="outline"
                  className="glass-button border-2 border-white text-white hover:bg-white hover:text-arsd-red hover:scale-105 transition-all duration-300 px-8 py-4 text-lg font-semibold"
                >
                  View Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
