import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

interface PageCTAProps {
  heading: string;
  body: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}

export function PageCTA({
  heading,
  body,
  primaryLabel = "Start Your Project",
  primaryHref = "/contact-us",
  secondaryLabel,
  secondaryHref,
}: PageCTAProps) {
  return (
    <section className="bg-[#111111] border-t border-[#2a2626] py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="font-display text-4xl sm:text-5xl font-bold text-[#f0ede8] mb-6 leading-tight">
          {heading}
        </h2>
        <p className="text-[#f0ede8]/70 text-lg mb-10 leading-relaxed">
          {body}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href={primaryHref}
            className="group inline-flex items-center gap-2 bg-arsd-red hover:bg-red-700 text-white font-semibold px-8 py-3.5 active:scale-[0.98] transition-[background-color,transform] duration-200 [transition-timing-function:cubic-bezier(0.32,0.72,0,1)] focus-visible:ring-2 focus-visible:ring-arsd-red focus-visible:ring-offset-2 focus-visible:ring-offset-[#111111] focus-visible:outline-none"
          >
            {primaryLabel}
            <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200 [transition-timing-function:cubic-bezier(0.32,0.72,0,1)]" />
          </Link>

          {secondaryLabel && secondaryHref && (
            <Link
              href={secondaryHref}
              className="inline-flex items-center gap-2 border border-[#2a2626] text-[#f0ede8] hover:border-[#f0ede8] font-semibold px-8 py-3.5 transition-colors duration-200"
            >
              {secondaryLabel}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
