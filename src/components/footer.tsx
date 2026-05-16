import Link from "next/link";
import Image from "next/image";
import { Mail, MapPin, Phone } from "lucide-react";
import { FacebookIcon } from "@/components/ui/facebook-icon";
import { CONTACT_INFO } from "@/constants/contact-info";
import { CREDENTIALS } from "@/constants/about-us-data";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0d0d0d] border-t border-[#2a2626]">
      <div className="responsive-container py-16 sm:py-20">
        {/* Main grid: 4 columns on xl, 2 on sm, 1 on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-10 sm:gap-12 mb-12">

          {/* Column 1: Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/images/arsd-logo.png"
                alt="ARSD Construction Corporation"
                width={36}
                height={36}
                className="rounded-full"
              />
              <span className="font-display text-lg font-bold text-[#f0ede8] uppercase tracking-tight">
                ARSD
              </span>
            </div>
            <p className="text-sm text-[#a09890] leading-relaxed mb-2">
              {CONTACT_INFO.company.tagline}
            </p>
            <p className="text-xs text-[#a09890]">Founded 1998.</p>
          </div>

          {/* Column 2: Company links */}
          <div>
            <h3 className="text-xs uppercase tracking-widest font-semibold text-[#f0ede8] mb-4">Company</h3>
            <ul className="space-y-2">
              {[
                { href: "/our-services", label: "Our Services" },
                { href: "/projects", label: "Projects" },
                { href: "/about-us", label: "About ARSD" },
                { href: "/contact-us", label: "Contact Us" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-[#a09890] hover:text-arsd-red transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Contact */}
          <div>
            <h3 className="text-xs uppercase tracking-widest font-semibold text-[#f0ede8] mb-4">Contact</h3>
            <ul className="space-y-3">
              <li>
                <a href={`tel:${CONTACT_INFO.phone.landline.tel}`} className="flex items-start gap-2 text-sm text-[#a09890] hover:text-arsd-red transition-colors">
                  <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {CONTACT_INFO.phone.landline.display}
                </a>
              </li>
              <li>
                <a href={`tel:${CONTACT_INFO.phone.mobile.tel}`} className="flex items-start gap-2 text-sm text-[#a09890] hover:text-arsd-red transition-colors">
                  <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {CONTACT_INFO.phone.mobile.display}
                </a>
              </li>
              <li>
                <a href={`mailto:${CONTACT_INFO.email}`} className="flex items-start gap-2 text-sm text-[#a09890] hover:text-arsd-red transition-colors">
                  <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {CONTACT_INFO.email}
                </a>
              </li>
              <li>
                <span className="flex items-start gap-2 text-sm text-[#a09890]">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {CONTACT_INFO.address.street}, {CONTACT_INFO.address.city}
                </span>
              </li>
              <li>
                <a
                  href={CONTACT_INFO.social.facebook.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-[#a09890] hover:text-arsd-red transition-colors"
                >
                  <FacebookIcon className="w-4 h-4" />
                  {CONTACT_INFO.social.facebook.handle}
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Licensed & Registered */}
          <div>
            <h3 className="text-xs uppercase tracking-widest font-semibold text-[#f0ede8] mb-4">Licensed &amp; Registered</h3>
            <ul className="space-y-2">
              <li className="text-sm text-[#a09890]">{CREDENTIALS.pcab}</li>
              <li className="text-sm text-[#a09890]">{CREDENTIALS.sec}</li>
              <li className="text-sm text-[#a09890]">{CREDENTIALS.philgeps}</li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center pt-8 border-t border-[#2a2626] gap-4">
          <p className="text-xs text-[#a09890]">
            © {currentYear} ARSD Construction Corporation. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a href={CONTACT_INFO.social.facebook.url} target="_blank" rel="noopener noreferrer" className="text-[#a09890] hover:text-arsd-red transition-colors" aria-label="Facebook">
              <FacebookIcon className="w-5 h-5" />
            </a>
            <a href={`mailto:${CONTACT_INFO.email}`} className="text-[#a09890] hover:text-arsd-red transition-colors" aria-label="Email">
              <Mail className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
