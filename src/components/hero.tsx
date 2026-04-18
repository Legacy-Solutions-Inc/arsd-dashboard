"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { EASE_SHARP } from "@/lib/motion";

export default function Hero() {
  return (
    <section className="relative min-h-[100dvh] bg-[#111111] flex items-center overflow-hidden">
      <div className="responsive-container relative z-10 grid lg:grid-cols-[55fr_45fr] gap-0 min-h-[100dvh] items-center py-24 lg:py-0 w-full">
        {/* Left content column */}
        <motion.div
          className="lg:py-32 flex flex-col justify-center"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE_SHARP }}
        >
          <p className="text-xs uppercase tracking-widest font-semibold text-arsd-red mb-6">
            Since 1998
          </p>

          <h1 className="font-display text-6xl md:text-7xl lg:text-8xl tracking-tighter text-[#f0ede8] leading-none uppercase mb-6">
            ARSD Construction<br />Corporation
          </h1>

          <p className="text-lg text-[#a09890] mb-8 max-w-[50ch]">
            Building Excellence in Iloilo City &amp; Beyond.
          </p>

          {/* CTA row */}
          <div className="flex flex-wrap gap-4">
            <Link
              href="/projects"
              className="group inline-flex items-center px-6 py-3 bg-arsd-red text-white font-semibold rounded hover:bg-red-700 active:scale-[0.98] transition-[background-color,transform] duration-200 [transition-timing-function:cubic-bezier(0.32,0.72,0,1)] focus-visible:ring-2 focus-visible:ring-arsd-red focus-visible:ring-offset-2 focus-visible:ring-offset-[#111111] focus-visible:outline-none"
            >
              View Projects
              <ArrowUpRight className="ml-2 w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200 [transition-timing-function:cubic-bezier(0.32,0.72,0,1)]" />
            </Link>

            <Link
              href="/our-services"
              className="inline-flex items-center px-6 py-3 border border-[#2a2626] text-[#f0ede8] font-semibold rounded hover:border-[#f0ede8] transition-colors focus-visible:ring-2 focus-visible:ring-arsd-red focus-visible:ring-offset-2 focus-visible:ring-offset-[#111111] focus-visible:outline-none"
            >
              Services
            </Link>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-8 text-xs text-[#a09890] uppercase tracking-wider">
            <span>PCAB Licensed</span>
            <span aria-hidden="true">·</span>
            <span>SEC Registered</span>
            <span aria-hidden="true">·</span>
            <span>PhilGEPS Supplier</span>
            <span aria-hidden="true">·</span>
            <span>25+ Years</span>
          </div>
        </motion.div>

        {/* Right photo column — hidden on mobile */}
        <div className="hidden lg:block relative h-full min-h-[100dvh]">
          <Image
            src="/images/photos/office2.jpg"
            alt="ARSD Construction Corporation"
            fill
            className="object-cover"
            priority
          />
          {/* Dark fade from left so the photo edge blends into the dark background */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#111111] via-[#111111]/30 to-transparent" />
        </div>
      </div>
    </section>
  );
}
