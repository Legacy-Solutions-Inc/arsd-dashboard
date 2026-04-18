"use client";

import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { SectionEyebrow } from "@/components/SectionEyebrow";
import { PageCTA } from "@/components/PageCTA";
import { ABOUT_US_DATA } from "@/constants/about-us-data";
import { motion } from "framer-motion";
import { EASE_SHARP, fadeUpVariants, staggerContainer } from "@/lib/motion";

export default function AboutPage() {
  const { milestones, achievements, certifications, story, mission, vision } = ABOUT_US_DATA;

  return (
    <div className="min-h-[100dvh] bg-[#111111]">
      <Navbar />

      {/* Hero */}
      <section className="py-20 sm:py-28 bg-[#111111]">
        <div className="responsive-container">
          <SectionEyebrow className="mb-4">About ARSD</SectionEyebrow>
          <motion.h1
            className="font-display text-5xl sm:text-6xl lg:text-7xl tracking-tighter text-[#f0ede8] uppercase leading-none mb-6 max-w-2xl"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE_SHARP }}
          >
            Building<br />Excellence<br />Since 1998
          </motion.h1>
          <motion.p
            className="text-[#a09890] max-w-[55ch] leading-relaxed"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE_SHARP, delay: 0.1 }}
          >
            From humble beginnings in labor contracting to a full-service construction company trusted across the Philippines.
          </motion.p>
        </div>
      </section>

      {/* Story + Achievements */}
      <section className="py-20 sm:py-28 bg-[#1c1c1c]">
        <div className="responsive-container">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
            {/* Story paragraphs */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
            >
              <SectionEyebrow className="mb-4">Our Story</SectionEyebrow>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl tracking-tight text-[#f0ede8] uppercase mb-8">
                Who We Are
              </h2>
              <div className="space-y-5">
                {story.paragraphs.map((paragraph, i) => (
                  <motion.p
                    key={i}
                    variants={fadeUpVariants}
                    custom={i}
                    className="text-[#a09890] leading-relaxed"
                  >
                    {paragraph}
                  </motion.p>
                ))}
              </div>
            </motion.div>

            {/* Achievements flat grid */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, ease: EASE_SHARP, delay: 0.15 }}
              className="border border-[#2a2626] divide-y divide-[#2a2626] self-start lg:mt-20"
            >
              {achievements.map((item) => (
                <div key={item.label} className="p-8">
                  <div className="font-display text-5xl tracking-tighter text-[#f0ede8] leading-none mb-2">
                    {item.number}
                  </div>
                  <div className="text-xs text-[#a09890] uppercase tracking-wider">{item.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 sm:py-28 bg-[#111111]">
        <div className="responsive-container">
          <SectionEyebrow className="mb-8">Our Foundation</SectionEyebrow>
          <div className="border border-[#2a2626] grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#2a2626]">
            <div className="p-8 lg:p-12">
              <p className="text-xs uppercase tracking-widest text-arsd-red mb-3">Mission</p>
              <h3 className="font-display text-2xl text-[#f0ede8] uppercase tracking-tight mb-4">
                Our Mission
              </h3>
              <p className="text-[#a09890] leading-relaxed">{mission}</p>
            </div>
            <div className="p-8 lg:p-12">
              <p className="text-xs uppercase tracking-widest text-arsd-red mb-3">Vision</p>
              <h3 className="font-display text-2xl text-[#f0ede8] uppercase tracking-tight mb-4">
                Our Vision
              </h3>
              <p className="text-[#a09890] leading-relaxed">{vision}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Milestones */}
      <section className="py-20 sm:py-28 bg-[#1c1c1c]">
        <div className="responsive-container">
          <SectionEyebrow className="mb-4">Our Journey</SectionEyebrow>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl tracking-tight text-[#f0ede8] uppercase mb-12">
            Milestones
          </h2>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="divide-y divide-[#2a2626]"
          >
            {milestones.map((milestone, index) => (
              <motion.div
                key={milestone.year}
                variants={fadeUpVariants}
                custom={index}
                className="py-8 grid grid-cols-[5rem_1fr] gap-8 items-start"
              >
                <span className="font-display text-2xl text-arsd-red leading-none pt-1">
                  {milestone.year}
                </span>
                <div>
                  <h4 className="font-display text-lg text-[#f0ede8] uppercase tracking-tight mb-1">
                    {milestone.title}
                  </h4>
                  <p className="text-sm text-[#a09890] leading-relaxed">{milestone.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-20 sm:py-28 bg-[#111111]">
        <div className="responsive-container">
          <SectionEyebrow className="mb-4">Credentials</SectionEyebrow>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl tracking-tight text-[#f0ede8] uppercase mb-12">
            Certifications
          </h2>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#2a2626] border border-[#2a2626]"
          >
            {certifications.map((cert, index) => (
              <motion.div
                key={cert.title}
                variants={fadeUpVariants}
                custom={index}
                className="p-8 md:p-10"
              >
                <p className="text-xs uppercase tracking-widest text-[#a09890] mb-3">{cert.title}</p>
                <p className="font-display text-2xl text-arsd-red mb-2">{cert.description}</p>
                <p className="text-sm text-[#a09890] leading-relaxed">{cert.subtitle}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <PageCTA
        heading="Partner With ARSD Construction"
        body="Experience the difference that 25+ years of expertise and commitment to excellence makes for your project."
        primaryLabel="Contact Us"
        primaryHref="/contact-us"
        secondaryLabel="View Projects"
        secondaryHref="/projects"
      />

      <Footer />
    </div>
  );
}
