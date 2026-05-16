import type { Metadata } from 'next';
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { SERVICES_DATA } from "@/constants/services-data";
import { SectionEyebrow } from "@/components/SectionEyebrow";
import { PageCTA } from "@/components/PageCTA";

export const metadata: Metadata = {
  title: 'Construction Services in Iloilo — Building, Land Development, Waterproofing | ARSD',
  description: 'Five construction services from a PCAB-licensed Iloilo contractor: building construction, design & plan preparation, land development, waterproofing, and aggregates supply.',
  alternates: { canonical: 'https://arsd.co/our-services' },
};

const SERVICES_FAQS: { q: string; a: string }[] = [
  {
    q: "Is ARSD licensed for large-scale construction projects?",
    a: "Yes. ARSD Construction Corporation holds PCAB Category A License No. 36037, which authorizes us to undertake large-scale general construction contracts throughout the Philippines.",
  },
  {
    q: "What is the minimum project size ARSD accepts?",
    a: "We work on a range of project sizes. Contact us at +63 33 337-7347 or via the form at /contact-us to discuss your specific requirements.",
  },
  {
    q: "How long does a typical construction project take?",
    a: "Project timelines depend on scope and complexity. After an initial site assessment and design review, we provide a detailed project schedule before contract signing.",
  },
  {
    q: "Does ARSD offer design and build services?",
    a: "Yes. Design & Plan Preparation is one of our five core services. We can handle both the design phase and full construction execution for eligible projects.",
  },
  {
    q: "Which areas does ARSD serve?",
    a: "ARSD is based in Iloilo City and primarily serves clients across Western Visayas. We accept projects elsewhere in the Philippines — contact us to discuss scope and logistics.",
  },
  {
    q: "How do I verify ARSD's PCAB license?",
    a: "You can verify PCAB License No. 36037 directly with the Philippine Contractors Accreditation Board at pcab.dti.gov.ph. Our license falls under Category A (General Engineering and Building).",
  },
];

export default function Services() {
  return (
    <>
      {SERVICES_DATA.mainServices.map((service) => (
        <script
          key={service.title}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Service',
              serviceType: service.title,
              provider: { '@id': 'https://arsd.co/#localbusiness' },
              areaServed: { '@type': 'AdministrativeArea', name: 'Western Visayas, Philippines' },
              description: service.description,
            }),
          }}
        />
      ))}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: SERVICES_FAQS.map((faq) => ({
              '@type': 'Question',
              name: faq.q,
              acceptedAnswer: { '@type': 'Answer', text: faq.a },
            })),
          }),
        }}
      />
      <div className="min-h-[100dvh] bg-[#111111]">
      <Navbar />

      {/* Hero Section — asymmetric split, image left */}
      <section className="relative overflow-hidden bg-[#111111]">
        <div className="lg:grid lg:grid-cols-[45fr_55fr] min-h-[60vh]">
          {/* LEFT: image with right-side dark fade */}
          <div className="hidden lg:block relative">
            <Image
              src="/images/photos/tool3.jpg"
              alt="ARSD Construction Services"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#111111]" />
          </div>

          {/* RIGHT: content */}
          <div className="relative z-10 flex items-center py-20 sm:py-28 lg:py-36 px-6 sm:px-8 lg:px-12 xl:px-16">
            <div className="max-w-lg">
              <SectionEyebrow className="mb-4">Professional Construction Services</SectionEyebrow>
              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl tracking-tighter text-[#f0ede8] uppercase leading-none mb-6">
                Construction Services in Iloilo: Building, Land Development, Waterproofing &amp; Aggregates
              </h1>
              <p className="text-[#a09890] leading-relaxed mb-10 max-w-[50ch]">
                From residential homes to commercial complexes, we deliver construction services that stand the test of time.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/contact-us">
                  <Button className="bg-arsd-red text-white hover:bg-red-700">
                    Get Free Quote <ArrowUpRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/projects">
                  <Button variant="outline" className="border-[#2a2626] text-[#f0ede8] hover:border-[#f0ede8] bg-transparent">
                    View Our Work
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section — numbered zig-zag rows */}
      <section className="py-16 sm:py-20 bg-[#111111]">
        <div className="responsive-container">
          <SectionEyebrow className="mb-4">What We Do</SectionEyebrow>
          <h2 className="font-display text-3xl sm:text-5xl tracking-tight text-[#f0ede8] uppercase mb-16">
            Our Services
          </h2>
          <div className="divide-y divide-[#2a2626]">
            {SERVICES_DATA.mainServices.map((service, index) => (
              <div
                key={index}
                className="py-12 sm:py-16 grid lg:grid-cols-2 gap-8 lg:gap-16 items-center"
              >
                {/* Number — alternates sides on desktop */}
                <div
                  className={`${
                    index % 2 === 1 ? "lg:order-last" : ""
                  } flex items-center justify-center lg:justify-start`}
                >
                  <span aria-hidden="true" className="font-display text-[5rem] sm:text-[10rem] leading-none text-arsd-red/10 select-none">
                    0{index + 1}
                  </span>
                </div>

                {/* Content */}
                <div>
                  <p className="text-xs uppercase tracking-widest text-[#a09890] mb-2">
                    {service.subtitle}
                  </p>
                  <h3 className="font-display text-2xl sm:text-3xl lg:text-4xl text-[#f0ede8] uppercase tracking-tight mb-4">
                    {service.title}
                  </h3>
                  <p className="text-[#a09890] leading-relaxed mb-6 max-w-[55ch]">
                    {service.description}
                  </p>
                  <ul className="space-y-2">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm text-[#a09890]">
                        <span aria-hidden="true" className="text-arsd-red mt-0.5 flex-shrink-0">—</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section — numbered steps */}
      <section className="py-16 sm:py-20 bg-[#1c1c1c]">
        <div className="responsive-container">
          <SectionEyebrow className="mb-4">How We Work</SectionEyebrow>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl tracking-tight text-[#f0ede8] uppercase mb-12">
            Our Process
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {SERVICES_DATA.workProcess.map((process, index) => (
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

      {/* Equipment & Fleet Section — flat 3-column table */}
      <section className="py-16 sm:py-20 bg-[#111111]">
        <div className="responsive-container">
          <SectionEyebrow className="mb-4">Our Fleet</SectionEyebrow>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl tracking-tight text-[#f0ede8] uppercase mb-12">
            Equipment &amp; Fleet
          </h2>
          <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#2a2626]">
            {SERVICES_DATA.equipmentOverview.map((group, idx) => (
              <div
                key={idx}
                className="py-8 md:py-0 md:px-8 first:md:pl-0 last:md:pr-0"
              >
                <h4 className="font-display text-lg uppercase tracking-tight text-[#f0ede8] mb-4">
                  {group.title}
                </h4>
                <ul className="space-y-2">
                  {group.points.map((point, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#a09890]">
                      <span className="text-arsd-red mt-0.5 flex-shrink-0">—</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 sm:py-20 bg-[#1c1c1c]">
        <div className="responsive-container">
          <SectionEyebrow className="mb-4">Common Questions</SectionEyebrow>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl tracking-tight text-[#f0ede8] uppercase mb-12">
            Frequently Asked Questions
          </h2>
          <div className="divide-y divide-[#2a2626] border-y border-[#2a2626] max-w-3xl">
            {SERVICES_FAQS.map((faq) => (
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
      </section>

      {/* CTA */}
      <PageCTA
        heading="Ready to Build Your Dream Project?"
        body="Let's discuss your construction needs and create something extraordinary together."
        primaryLabel="Start Your Project"
        primaryHref="/contact-us"
        secondaryLabel="View Portfolio"
        secondaryHref="/projects"
      />

      <Footer />
    </div>
    </>
  );
}
