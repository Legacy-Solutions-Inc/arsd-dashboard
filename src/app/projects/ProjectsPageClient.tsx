"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, Camera, ArrowUpRight } from "lucide-react";
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
  slug?: string;
  created_at: string;
  photoUrls: string[];
  status?: string;
  type?: string;
  value?: string;
}

interface Props {
  initialProjects?: ProjectWithUrls[];
}

const PAGE_SIZE = 12;

export default function ProjectsPageClient({ initialProjects = [] }: Props) {
  const [projectsWithUrls, setProjectsWithUrls] = useState<ProjectWithUrls[]>(initialProjects);
  const [loading, setLoading] = useState(initialProjects.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialProjects.length === 0);
  const { toast } = useToast();

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

      const projectsWithPhotoUrls = result.projects.map((project) => {
        const photoUrls =
          project.photos?.map(
            (photo) =>
              `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/website-projects/${photo.file_path}`
          ) || [];

        return {
          id: project.id,
          name: project.name,
          location: project.location,
          slug: project.slug ?? undefined,
          created_at: project.created_at,
          photoUrls,
        };
      });

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
    if (initialProjects.length > 0) return;
    fetchProjects(1, false);
  }, []);

  const displayProjects: ProjectWithUrls[] =
    projectsWithUrls.length > 0
      ? projectsWithUrls
      : PROJECTS_DATA.sampleProjects.map((p) => ({ ...p, photoUrls: [...p.photoUrls] } as ProjectWithUrls));

  return (
    <div className="min-h-[100dvh] bg-[#111111]">
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-20 sm:py-28 lg:py-36 bg-[#111111] overflow-hidden">
        <div className="responsive-container">
          <SectionEyebrow className="mb-4">Our Portfolio</SectionEyebrow>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl tracking-tighter text-[#f0ede8] uppercase leading-none mb-6 max-w-3xl">
            Completed Construction Projects in Iloilo &amp; the Philippines
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
                  const href = `/projects/${project.slug ?? project.id}`;
                  return (
                    <Link
                      key={project.id}
                      href={href}
                      className="group block"
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
                    </Link>
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
    </div>
  );
}
