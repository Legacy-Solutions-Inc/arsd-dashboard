"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { EASE_SHARP } from "@/lib/motion";

export interface ServiceItem {
  num: string;
  title: string;
  desc: string;
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_SHARP } },
};

interface Props {
  services: ServiceItem[];
}

export function ServicesListAnimated({ services }: Props) {
  return (
    <motion.div
      className="divide-y divide-[#2a2626]"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      {services.map((service) => (
        <motion.div key={service.num} variants={itemVariants}>
          <a
            href="/our-services"
            aria-label={`Learn more about ${service.title}`}
            className="group grid grid-cols-[5rem_1fr] items-start py-5 sm:py-6 hover:bg-[#1c1c1c] -mx-4 px-4 transition-colors"
          >
            <span className="font-display text-5xl text-arsd-red/20 group-hover:text-arsd-red/60 transition-colors leading-none pt-1">
              {service.num}
            </span>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-xl sm:text-2xl text-[#f0ede8] uppercase tracking-tight">
                  {service.title}
                </h3>
                <p className="text-sm text-[#a09890] mt-1">{service.desc}</p>
              </div>
              <ArrowUpRight className="w-5 h-5 text-[#2a2626] group-hover:text-arsd-red group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200 [transition-timing-function:cubic-bezier(0.32,0.72,0,1)] flex-shrink-0 mt-1" />
            </div>
          </a>
        </motion.div>
      ))}
    </motion.div>
  );
}
