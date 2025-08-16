import Footer from "@/components/footer";
import Hero from "@/components/hero";
import Navbar from "@/components/navbar";
import { ArrowUpRight } from "lucide-react";
import { createClient } from "../../supabase/server";
import { Project, ProjectCard } from "@/components/ProjectCard";


// Featured projects data
const featuredProjects: Project[] = [
  {
    id: "2134.00",
    title: "Metro Manila Commercial Complex",
    type: "Commercial",
    location: "Metro Manila, Philippines",
    client: "ABC Construction Corp",
    contractor: "XYZ Builders Inc",
    contractAmount: 2000000,
    progress: 65,
    status: "In Progress",
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    description:
      "A modern commercial complex featuring retail spaces, offices, and parking facilities.",
    image: "/images/arsd-logo.png",
    features: [
      "5-story commercial building",
      "200 parking spaces",
      "Modern HVAC system",
      "Green building certification",
    ],
  },
  {
    id: "2135.00",
    title: "Iloilo Residential Development",
    type: "Residential",
    location: "Iloilo City, Philippines",
    client: "Iloilo Housing Corp",
    contractor: "ARSD Construction Corporation",
    contractAmount: 1500000,
    progress: 85,
    status: "Near Completion",
    startDate: "2023-06-01",
    endDate: "2024-03-31",
    description:
      "Affordable housing project with 50 residential units and community amenities.",
    image: "/images/arsd-logo.png",
    features: [
      "50 residential units",
      "Community center",
      "Playground area",
      "24/7 security",
    ],
  },
  {
    id: "2136.00",
    title: "Industrial Warehouse Facility",
    type: "Industrial",
    location: "Bataan, Philippines",
    client: "Industrial Solutions Inc",
    contractor: "ARSD Construction Corporation",
    contractAmount: 3500000,
    progress: 40,
    status: "In Progress",
    startDate: "2024-02-01",
    endDate: "2025-01-31",
    description:
      "Large-scale warehouse and distribution center with modern logistics infrastructure.",
    image: "/images/arsd-logo.png",
    features: [
      "50,000 sqm warehouse",
      "Loading docks",
      "Office complex",
      "Fire safety systems",
    ],
  },
];

/** Homepage for ARSD Construction.*/
export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* NavBar Section */}
      <Navbar />
      {/* Hero Section */}
      <Hero />

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Featured Projects</h2>
            <p className="text-gray-600 max-w-xl sm:max-w-2xl mx-auto text-base sm:text-lg">
              Explore our ongoing and completed projects, showcasing our expertise in commercial, residential, and industrial construction.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {featuredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-20 bg-arsd-red text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              Trusted by Construction Leaders
            </h2>
            <p className="text-orange-100 max-w-xl sm:max-w-2xl mx-auto text-base sm:text-lg">
              Join industry professionals who rely on our platform for project success
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 text-center">
            <div>
              <div className="text-2xl sm:text-4xl font-bold mb-2">PHP2M+</div>
              <div className="text-orange-100 text-xs sm:text-base">Projects Managed</div>
            </div>
            <div>
              <div className="text-2xl sm:text-4xl font-bold mb-2">20+</div>
              <div className="text-orange-100 text-xs sm:text-base">Active Projects</div>
            </div>
            <div>
              <div className="text-2xl sm:text-4xl font-bold mb-2">15%</div>
              <div className="text-orange-100 text-xs sm:text-base">Average Cost Savings</div>
            </div>
            <div>
              <div className="text-2xl sm:text-4xl font-bold mb-2">98%</div>
              <div className="text-orange-100 text-xs sm:text-base">On-Time Delivery</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Ready to Transform Your Project?
          </h2>
          <p className="text-gray-600 mb-6 sm:mb-8 max-w-xl sm:max-w-2xl mx-auto text-base sm:text-lg">
            Interested in partnering or have a project in mind? Message us today and let's build success together. We're ready to collaborate and deliver excellence for your construction needs.
          </p>
          <a
            href="https://www.facebook.com/arsdconstruction"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 text-white bg-arsd-red rounded-lg hover:bg-orange-700 transition-colors text-base sm:text-lg font-medium"
          >
            Message Us on Facebook!
            <ArrowUpRight className="ml-2 w-5 h-5" />
          </a>
        </div>
      </section>

      {/* Footer Section */}
      <Footer />
    </div>
  );
}
