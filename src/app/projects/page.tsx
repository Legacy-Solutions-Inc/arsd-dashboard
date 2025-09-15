"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, Building2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { WebsiteProjectsService } from "@/services/website-projects";
import { ProjectSkeleton } from "@/components/website-projects/ProjectSkeleton";
import { ProjectCard } from "@/components/ProjectCard";
import { useToast } from "@/components/ui/use-toast";

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
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-arsd-red to-red-700 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Our Construction Projects
            </h1>
            <p className="text-xl text-red-100 mb-8">
              Showcasing our commitment to excellence through successful project
              deliveries across the Philippines.
            </p>
            <div className="flex justify-center">
              <Image
                src="/images/arsd-logo.png"
                alt="ARSD Construction Corporation"
                width={80}
                height={80}
                className="rounded-full bg-white p-2"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Project Stats */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="text-4xl font-bold text-arsd-red mb-3">50+</div>
              <div className="text-gray-700 font-medium">Projects Completed</div>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="text-4xl font-bold text-arsd-red mb-3">₱7B+</div>
              <div className="text-gray-700 font-medium">Total Project Value</div>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="text-4xl font-bold text-arsd-red mb-3">15+</div>
              <div className="text-gray-700 font-medium">Years Experience</div>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="text-4xl font-bold text-arsd-red mb-3">98%</div>
              <div className="text-gray-700 font-medium">Client Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Projects (from database) */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-arsd-red/10 text-arsd-red px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Building2 className="h-4 w-4" />
              Our Portfolio
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                  Featured Construction Projects
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl leading-relaxed">
                  Discover our latest construction achievements across the Philippines. 
                  Each project represents our commitment to excellence and innovation.
                </p>
              </div>
              <Button 
                onClick={fetchProjects} 
                disabled={loading}
                variant="outline"
                className="flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Building2 className="h-4 w-4" />
                )}
                {loading ? 'Loading...' : 'Refresh'}
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, index) => (
                <ProjectSkeleton key={index} />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Building2 className="h-12 w-12 text-red-400" />
              </div>
              <div className="text-2xl font-semibold text-gray-700 mb-4">Error loading projects</div>
              <p className="text-gray-500 max-w-md mx-auto mb-6">
                {error}
              </p>
              <Button onClick={fetchProjects} variant="outline">
                Try Again
              </Button>
            </div>
          ) : projectsWithUrls.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Building2 className="h-12 w-12 text-gray-400" />
              </div>
              <div className="text-2xl font-semibold text-gray-700 mb-4">No projects yet</div>
              <p className="text-gray-500 max-w-md mx-auto">
                We're working on amazing projects. Check back soon to see our latest construction achievements.
              </p>
            </div>
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
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium mb-8">
              <Building2 className="h-4 w-4" />
              Ready to Build Together?
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Start Your Next Project?
            </h2>
            <p className="text-xl text-red-100 mb-12 max-w-3xl mx-auto leading-relaxed">
              Join our satisfied clients and let us bring your construction vision
              to life with our proven expertise and commitment to excellence.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link href="/contact">
                <Button 
                  size="lg"
                  className="bg-white text-arsd-red hover:bg-gray-100 hover:scale-105 transition-all duration-300 px-8 py-4 text-lg font-semibold shadow-xl"
                >
                  Start Your Project
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white hover:text-arsd-red hover:scale-105 transition-all duration-300 px-8 py-4 text-lg font-semibold"
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
