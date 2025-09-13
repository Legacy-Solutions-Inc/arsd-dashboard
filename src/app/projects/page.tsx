import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowRight, Loader2, Eye, Calendar, Building2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { WebsiteProjectsServerService } from "@/services/website-projects-server";
import { ProjectSkeleton } from "@/components/website-projects/ProjectSkeleton";
import { ProjectCard } from "@/components/ProjectCard";

export default async function Projects() {
  // Fetch website projects with photos from Supabase
  const projectsWithUrls = await WebsiteProjectsServerService.fetchProjectsForDisplay();

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
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Featured Construction Projects
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Discover our latest construction achievements across the Philippines. 
              Each project represents our commitment to excellence and innovation.
            </p>
          </div>

          {projectsWithUrls.length === 0 ? (
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
