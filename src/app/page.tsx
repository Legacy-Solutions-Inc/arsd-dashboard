import Footer from "@/components/footer";
import Hero from "@/components/hero";
import Navbar from "@/components/navbar";
import { ArrowUpRight, Building, PenTool, MapPin, Droplets, Truck } from "lucide-react";
import { createClient } from "../../supabase/server";
import Image from "next/image";

/** Homepage for ARSD Construction.*/
export default async function Home() {
  const supabase = await createClient();
  // Fetch up to 6 latest website projects with photos for homepage preview
  const { data: projectsData } = await supabase
    .from("website_projects")
    .select(
      `id, name, location, created_at,
       photos:website_project_photos(file_path, order_index)`
    )
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .limit(6);

  const featuredProjects = (projectsData || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    location: p.location,
    created_at: p.created_at,
    photoUrls: (p.photos || [])
      .sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0))
      .map((ph: any) => `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/website-projects/${ph.file_path}`),
  }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* NavBar Section */}
      <Navbar />
      {/* Hero Section */}
      <Hero />

      {/* Services Overview */}
      <section id="services" className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="responsive-container">
          <div className="text-center mb-8 sm:mb-10 lg:mb-14">
            <div className="inline-flex items-center gap-2 bg-arsd-red/10 text-arsd-red px-4 py-2 rounded-full text-xs sm:text-sm font-semibold mb-4">
              Our Services
            </div>
            <h2 className="responsive-heading font-bold mb-3">Delivering End-to-End Construction Solutions</h2>
            <p className="responsive-text text-gray-600 max-w-xl sm:max-w-2xl mx-auto leading-relaxed">
              Building Construction, Design & Plan Preparation, Land Development, Waterproofing, and Supply Aggregates.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
            <a href="/our-services" className="group bg-gray-50 rounded-2xl p-5 sm:p-6 border border-gray-100 hover:bg-white hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-arsd-red to-red-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Building className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">Building Construction</h3>
              <p className="text-gray-600 text-sm">Commercial, residential, and industrial projects, executed with precision.</p>
            </a>
            <a href="/our-services" className="group bg-gray-50 rounded-2xl p-5 sm:p-6 border border-gray-100 hover:bg-white hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-arsd-red to-red-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <PenTool className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">Design & Plan Preparation</h3>
              <p className="text-gray-600 text-sm">Compliance-focused planning and design aligned with project goals.</p>
            </a>
            <a href="/our-services" className="group bg-gray-50 rounded-2xl p-5 sm:p-6 border border-gray-100 hover:bg-white hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-arsd-red to-red-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">Land Development</h3>
              <p className="text-gray-600 text-sm">Site preparation, roadworks, utilities, and earthmoving solutions.</p>
            </a>
            <a href="/our-services" className="group bg-gray-50 rounded-2xl p-5 sm:p-6 border border-gray-100 hover:bg-white hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-arsd-red to-red-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Droplets className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">Waterproofing</h3>
              <p className="text-gray-600 text-sm">Certified waterproofing systems for long-term durability.</p>
            </a>
            <a href="/our-services" className="group bg-gray-50 rounded-2xl p-5 sm:p-6 border border-gray-100 hover:bg-white hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-arsd-red to-red-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">Supply Aggregates</h3>
              <p className="text-gray-600 text-sm">Reliable supply of sand, gravel, and construction materials.</p>
            </a>
          </div>
          <div className="text-center mt-8 sm:mt-10">
            <a href="/our-services" className="inline-flex items-center px-5 sm:px-6 py-3 rounded-lg bg-arsd-red text-white hover:bg-red-700 transition-colors text-sm sm:text-base font-medium">
              Explore All Services
              <ArrowUpRight className="ml-2 w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* About Us Highlight */}
      <section id="about" className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="responsive-container grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-arsd-red/10 text-arsd-red px-4 py-2 rounded-full text-xs sm:text-sm font-semibold mb-4">Who We Are</div>
            <h2 className="responsive-heading font-bold mb-3">ARSD Construction</h2>
            <p className="responsive-text text-gray-600 mb-5 sm:mb-6">
              ARSD Construction was founded with courage, honesty and dedication as it was started with a humble beginning in 1998. At first it was just labor contracting; after a year, a small seed capital was introduced and coupled with determination and dedication straight contract was ventured.
            </p>
            <div className="flex flex-wrap gap-3 sm:gap-4">
              <a href="/about-us" className="inline-flex items-center px-5 py-3 rounded-lg bg-arsd-red text-white hover:bg-red-700 transition-colors text-sm sm:text-base font-medium">
                Learn About Us
                <ArrowUpRight className="ml-2 w-4 h-4" />
              </a>
              <a href="/contact-us" className="inline-flex items-center px-5 py-3 rounded-lg bg-white border border-gray-200 text-gray-900 hover:bg-gray-50 transition-colors text-sm sm:text-base font-medium">
                Get in Touch
              </a>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            <div className="rounded-2xl bg-white p-5 border border-gray-100 text-center shadow-sm">
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">PCAB</div>
              <div className="text-gray-600 text-xs sm:text-sm">Licensed Contractor</div>
            </div>
            <div className="rounded-2xl bg-white p-5 border border-gray-100 text-center shadow-sm">
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">PhilGEPS</div>
              <div className="text-gray-600 text-xs sm:text-sm">Registered Supplier</div>
            </div>
            <div className="rounded-2xl bg-white p-5 border border-gray-100 text-center shadow-sm">
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">SEC</div>
              <div className="text-gray-600 text-xs sm:text-sm">Duly Registered</div>
            </div>
            <div className="rounded-2xl bg-white p-5 border border-gray-100 text-center shadow-sm">
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">20+ yrs</div>
              <div className="text-gray-600 text-xs sm:text-sm">Industry Experience</div>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Preview */}
      <section id="projects" className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="responsive-container">
          <div className="text-center mb-8 sm:mb-10 lg:mb-14">
            <div className="inline-flex items-center gap-2 bg-arsd-red/10 text-arsd-red px-4 py-2 rounded-full text-xs sm:text-sm font-semibold mb-4">Recent Works</div>
            <h2 className="responsive-heading font-bold mb-3">Featured Projects</h2>
            <p className="responsive-text text-gray-600 max-w-xl sm:max-w-2xl mx-auto leading-relaxed">
              A snapshot of our ongoing and completed builds across regions.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {featuredProjects.length > 0 ? (
              featuredProjects.map((project: any) => (
                <a key={project.id} href="/projects" className="group block rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-all">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    {project.photoUrls && project.photoUrls.length > 0 ? (
                      <Image src={project.photoUrls[0]} alt={project.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full bg-gray-100" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                      <div>
                        <h3 className="text-white text-sm sm:text-base font-semibold leading-tight">{project.name}</h3>
                        <div className="flex items-center gap-1 text-white/80 text-xs"><MapPin className="w-3 h-3" />{project.location}</div>
                      </div>
                      {project.photoUrls && project.photoUrls.length > 1 && (
                        <div className="flex gap-1">
                          {project.photoUrls.slice(0,4).map((_: any, idx: number) => (
                            <span key={idx} className={`w-2 h-2 rounded-full ${idx===0? 'bg-white':'bg-white/60'}`} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </a>
              ))
            ) : (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[16/10] rounded-2xl bg-gray-100 border border-gray-200" />
              ))
            )}
          </div>
          <div className="text-center mt-8 sm:mt-10">
            <a href="/projects" className="inline-flex items-center px-5 sm:px-6 py-3 rounded-lg bg-arsd-red text-white hover:bg-red-700 transition-colors text-sm sm:text-base font-medium">
              View All Projects
              <ArrowUpRight className="ml-2 w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-arsd-red text-white">
        <div className="responsive-container">
          <div className="text-center mb-8 sm:mb-10 lg:mb-12">
            <h2 className="responsive-heading font-bold mb-4">
              Trusted by Construction Leaders
            </h2>
            <p className="responsive-text text-orange-100 max-w-xl sm:max-w-2xl mx-auto leading-relaxed">
              Join industry professionals who rely on our platform for project success
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 text-center">
            <div className="mobile-padding">
              <div className="text-xl sm:text-2xl lg:text-4xl font-bold mb-2">500+</div>
              <div className="text-orange-100 text-xs sm:text-sm lg:text-base">Projects Completed</div>
            </div>
            <div className="mobile-padding">
              <div className="text-xl sm:text-2xl lg:text-4xl font-bold mb-2">25+</div>
              <div className="text-orange-100 text-xs sm:text-sm lg:text-base">Years Experience</div>
            </div>
            <div className="mobile-padding">
              <div className="text-xl sm:text-2xl lg:text-4xl font-bold mb-2">100+</div>
              <div className="text-orange-100 text-xs sm:text-sm lg:text-base">Satisfied Clients</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="responsive-container text-center">
          <h2 className="responsive-heading font-bold mb-4">
            Ready to Transform Your Project?
          </h2>
          <p className="responsive-text text-gray-600 mb-6 sm:mb-8 max-w-xl sm:max-w-2xl mx-auto leading-relaxed">
            Interested in partnering or have a project in mind? Message us today and let's build success together. We're ready to collaborate and deliver excellence for your construction needs.
          </p>
          <a
            href="https://www.facebook.com/ARSDConCorp"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 text-white bg-arsd-red rounded-lg hover:bg-orange-700 transition-colors text-base sm:text-lg font-medium"
          >
            Message Us on Facebook!
            <ArrowUpRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
          </a>
        </div>
      </section>

      {/* Footer Section */}
      <Footer />
    </div>
  );
}
