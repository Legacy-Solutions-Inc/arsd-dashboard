import Footer from "@/components/footer";
import Hero from "@/components/hero";
import Navbar from "@/components/navbar";
import { ArrowUpRight, MapPin } from "lucide-react";
import { createClient } from "../../supabase/server";
import Image from "next/image";
import { SectionEyebrow } from "@/components/SectionEyebrow";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { PageCTA } from "@/components/PageCTA";
import { ServicesListAnimated } from "@/components/ServicesListAnimated";
import type { ServiceItem } from "@/components/ServicesListAnimated";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ARSD Construction Corporation — PCAB-Licensed General Contractor in Iloilo Since 1998',
  description: 'PCAB Category A licensed general contractor in Iloilo City, Philippines. 25+ years, 500+ completed projects. Building construction, land development, waterproofing, aggregates.',
  alternates: { canonical: 'https://arsd.co/' },
  openGraph: {
    title: 'ARSD Construction Corporation — Iloilo General Contractor',
    description: 'PCAB Category A. 25+ years. 500+ projects across Western Visayas.',
    url: 'https://arsd.co/',
    siteName: 'ARSD Construction Corporation',
    type: 'website',
  },
};

const SERVICES_DATA: ServiceItem[] = [
  { num: "01", title: "Building Construction", desc: "Residential homes, commercial buildings, hospitals, and industrial facilities — built across Iloilo and Western Visayas." },
  { num: "02", title: "Design & Plan Preparation", desc: "Architectural and structural drawings, permit documentation, and engineering analysis by PCAB-licensed professionals." },
  { num: "03", title: "Land Development", desc: "Site surveying, earthworks, road construction, and utilities installation for raw-land parcels." },
  { num: "04", title: "Waterproofing", desc: "Roof, basement, and foundation waterproofing systems for residential and commercial structures." },
  { num: "05", title: "Supply Aggregates", desc: "Sand, gravel, crushed stone, and concrete aggregates supplied directly to construction sites in Iloilo and surrounding areas." },
];

const HOMEPAGE_FAQS: { q: string; a: string }[] = [
  {
    q: "Is ARSD Construction Corporation PCAB-licensed?",
    a: "Yes. ARSD holds PCAB Category A License No. 36037 from the Philippine Contractors Accreditation Board, qualifying us for large-scale general construction contracts.",
  },
  {
    q: "How long has ARSD Construction been in business?",
    a: "ARSD Construction Corporation was founded in 1998 in Iloilo City and has completed 500+ projects across Western Visayas over 25+ years.",
  },
  {
    q: "Where does ARSD operate?",
    a: "We are based in Iloilo City, Philippines, and primarily serve clients across Western Visayas. Contact us for projects elsewhere in the Philippines.",
  },
  {
    q: "What types of construction does ARSD handle?",
    a: "Building construction, design & plan preparation, land development, waterproofing, and supply of aggregates. See /our-services for full scope.",
  },
  {
    q: "How can I request a project quote?",
    a: "Call our office at (033) 337 7347 or our mobile at +63 918 991 1042, or visit us at Figueroa St., Bonifacio, Arevalo, Iloilo City. You can also submit the contact form at /contact-us.",
  },
];

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
    <div className="min-h-[100dvh] bg-[#111111]">
      {/* NavBar Section */}
      <Navbar />
      {/* Hero Section */}
      <Hero />

      {/* Services Overview */}
      <section id="services" className="py-16 sm:py-20 lg:py-24 bg-[#111111]">
        <div className="responsive-container">
          <div className="mb-10 sm:mb-14">
            <SectionEyebrow className="mb-3">What We Do</SectionEyebrow>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl tracking-tight text-[#f0ede8] uppercase mb-4">
              Our Services
            </h2>
            <p className="text-[#a09890] max-w-[55ch] leading-relaxed">
              ARSD Construction Corporation provides five construction services across Western Visayas: building construction, design &amp; plan preparation, land development, waterproofing, and aggregates supply. As a PCAB Category A licensed general contractor (License No. 36037), we handle residential, commercial, and industrial projects from groundwork through handover.
            </p>
          </div>

          {/* Animated numbered service list */}
          <ServicesListAnimated services={SERVICES_DATA} />

          <div className="mt-8">
            <a href="/our-services" className="inline-flex items-center gap-2 text-sm text-arsd-red hover:text-red-400 font-semibold transition-colors">
              View all services <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* About Us Highlight */}
      <section id="about" className="py-16 sm:py-20 lg:py-24 bg-[#1c1c1c]">
        <div className="responsive-container grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <SectionEyebrow className="mb-3">Who We Are</SectionEyebrow>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl tracking-tight text-[#f0ede8] uppercase mb-6">
              ARSD Construction
            </h2>
            <p className="text-[#a09890] mb-6 leading-relaxed max-w-[55ch]">
              ARSD Construction Corporation was founded in 1998 in Iloilo City, Philippines, starting in labor contracting before incorporating as a full-service general contractor. Today we are SEC-registered (CS 2007 28366) and hold PCAB Category A License No. 36037 — the highest contractor category in the Philippines for general engineering and building work.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="/about-us" className="inline-flex items-center px-5 py-2.5 bg-arsd-red text-white text-sm font-semibold rounded hover:bg-red-700 transition-colors">
                Learn About Us <ArrowUpRight className="ml-2 w-4 h-4" />
              </a>
              <a href="/contact-us" className="inline-flex items-center px-5 py-2.5 border border-[#2a2626] text-[#f0ede8] text-sm font-semibold rounded hover:border-[#f0ede8] transition-colors">
                Get in Touch
              </a>
            </div>
          </div>

          {/* Flat 2×2 credential grid — NO white card boxes */}
          <div className="grid grid-cols-2 divide-x divide-y divide-[#2a2626] border border-[#2a2626]">
            {[
              { label: "PCAB", desc: "Category A · No. 36037" },
              { label: "PhilGEPS", desc: "Cert. 2010-63063" },
              { label: "SEC", desc: "Reg. CS 2007 28366" },
              { label: "25+ yrs", desc: "Since 1998" },
            ].map((item) => (
              <div key={item.label} className="p-6 text-center">
                <div className="font-display text-2xl font-bold text-[#f0ede8] mb-1">{item.label}</div>
                <div className="text-xs text-[#a09890] uppercase tracking-wider">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-[#111111] border-y border-[#2a2626]">
        <div className="responsive-container">
          <p className="text-[#a09890] max-w-[55ch] mx-auto text-center leading-relaxed mb-12 sm:mb-16">
            Across 25+ years in business, ARSD has completed more than 500 construction projects for over 100 clients throughout Iloilo and Western Visayas.
          </p>
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
                <div className="text-sm text-[#a09890] uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Projects Preview */}
      <section id="projects" className="py-16 sm:py-20 lg:py-24 bg-[#1c1c1c]">
        <div className="responsive-container">
          <div className="flex items-end justify-between mb-10 sm:mb-14">
            <div>
              <SectionEyebrow className="mb-3">Recent Works</SectionEyebrow>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl tracking-tight text-[#f0ede8] uppercase">
                Featured Projects
              </h2>
            </div>
            <a href="/projects" className="hidden sm:inline-flex items-center gap-1 text-sm text-arsd-red hover:text-red-400 font-semibold transition-colors">
              View all <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {featuredProjects.length > 0 ? (
              featuredProjects.map((project: any) => (
                <a key={project.id} href="/projects" className="group block rounded-lg overflow-hidden">
                  <div className="relative aspect-[16/10] overflow-hidden bg-[#1c1c1c]">
                    {project.photoUrls && project.photoUrls.length > 0 ? (
                      <Image
                        src={project.photoUrls[0]}
                        alt={project.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#2a2626]" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="font-display text-base sm:text-lg text-white uppercase tracking-tight leading-tight">
                        {project.name}
                      </h3>
                      <div className="flex items-center gap-1 text-white/70 text-xs mt-1">
                        <MapPin className="w-3 h-3" />
                        {project.location}
                      </div>
                    </div>
                  </div>
                </a>
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-20 border border-[#2a2626] rounded-lg gap-3 text-center">
                <p className="text-[#a09890] text-sm">Portfolio coming soon.</p>
                <a href="/contact-us" className="text-sm text-arsd-red hover:text-red-400 font-semibold transition-colors">
                  Contact us to discuss past projects →
                </a>
              </div>
            )}
          </div>

          <div className="sm:hidden text-center mt-8">
            <a href="/projects" className="inline-flex items-center gap-2 text-sm text-arsd-red hover:text-red-400 font-semibold transition-colors">
              View all projects <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 sm:py-20 lg:py-24 bg-[#111111]">
        <div className="responsive-container">
          <div className="mb-10 sm:mb-14">
            <SectionEyebrow className="mb-3">Common Questions</SectionEyebrow>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl tracking-tight text-[#f0ede8] uppercase">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="divide-y divide-[#2a2626] border-y border-[#2a2626] max-w-3xl">
            {HOMEPAGE_FAQS.map((faq) => (
              <details key={faq.q} className="group py-5">
                <summary className="cursor-pointer list-none flex items-start justify-between gap-4 text-[#f0ede8] font-display text-lg sm:text-xl uppercase tracking-tight">
                  <span>{faq.q}</span>
                  <span
                    aria-hidden="true"
                    className="text-arsd-red text-2xl leading-none flex-shrink-0 transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 text-[#a09890] leading-relaxed max-w-[65ch]">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: HOMEPAGE_FAQS.map((faq) => ({
                '@type': 'Question',
                name: faq.q,
                acceptedAnswer: { '@type': 'Answer', text: faq.a },
              })),
            }),
          }}
        />
      </section>

      {/* CTA Section */}
      <PageCTA
        heading="Ready to Build With Us?"
        body="Interested in partnering or have a project in mind? Our team is ready to discuss your construction needs and deliver excellence."
        primaryLabel="Get in Touch"
        primaryHref="/contact-us"
        secondaryLabel="View Our Work"
        secondaryHref="/projects"
      />

      {/* Footer Section */}
      <Footer />
    </div>
  );
}
