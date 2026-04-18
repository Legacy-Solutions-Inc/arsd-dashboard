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
            className="inline-flex items-center gap-2 bg-arsd-red hover:bg-red-700 text-white font-semibold px-8 py-3.5 transition-colors duration-200"
          >
            {primaryLabel}
            <ArrowUpRight className="h-4 w-4" />
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
