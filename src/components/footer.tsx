import Link from "next/link";
import Image from "next/image";
import { Facebook, Mail, MapPin } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 border-t border-gray-100">
      <div className="container mx-auto px-4 py-12">
        {/* Company Info Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <Image
              src="/images/arsd-logo.png"
              alt="ARSD Construction Corporation Logo"
              width={80}
              height={80}
              className="rounded-full"
            />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            ARSD Construction Corporation
          </h3>
          <div className="flex flex-col md:flex-row justify-center items-center gap-6 text-gray-600">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-red-600" />
              <span>Figueroa St. Bonifacio, Arevalo, Iloilo City</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-red-600" />
              <a
                href="mailto:hr_arsd_iloilo@yahoo.com.ph"
                className="hover:text-red-600"
              >
                hr_arsd_iloilo@yahoo.com.ph
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Facebook className="w-5 h-5 text-red-600" />
              <a
                href="https://www.facebook.com/ARSDConCorp"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-red-600"
              >
                ARSDConCorp
              </a>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Platform Column */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Platform</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="#features"
                  className="text-gray-600 hover:text-red-600"
                >
                  Our Services
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="text-gray-600 hover:text-red-600"
                >
                  Projects
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-red-600">
                  Construction Management
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-red-600">
                  Quality Control
                </Link>
              </li>
            </ul>
          </div>

          {/* Solutions Column */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Specialties</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-gray-600 hover:text-red-600">
                  Residential Construction
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-red-600">
                  Commercial Buildings
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-red-600">
                  Infrastructure Projects
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-red-600">
                  Renovation & Remodeling
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources Column */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-gray-600 hover:text-red-600">
                  Project Gallery
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-red-600">
                  Client Testimonials
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-red-600">
                  Construction Tips
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-red-600">
                  Get Quote
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-gray-600 hover:text-red-600">
                  About ARSD
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-red-600">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-red-600">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-red-600">
                  Safety Standards
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-gray-200">
          <div className="text-gray-600 mb-4 md:mb-0">
            © {currentYear} ARSD Construction Corporation. All rights reserved.
          </div>

          <div className="flex space-x-6">
            <a
              href="https://www.facebook.com/ARSDConCorp"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-red-600"
            >
              <span className="sr-only">Facebook</span>
              <Facebook className="h-6 w-6" />
            </a>
            <a
              href="mailto:hr_arsd_iloilo@yahoo.com.ph"
              className="text-gray-400 hover:text-red-600"
            >
              <span className="sr-only">Email</span>
              <Mail className="h-6 w-6" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
