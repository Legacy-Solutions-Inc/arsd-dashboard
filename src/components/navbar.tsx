import Link from "next/link";
import Image from "next/image";
import { createClient } from "../../supabase/server";
import { Button } from "./ui/button";
import {
  ChevronDown,
  Building,
  PenTool,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";
import UserProfile from "./user-profile";

export default async function Navbar() {
  const supabase = createClient();

  const {
    data: { user },
  } = await (await supabase).auth.getUser();

  return (
    <nav className="w-full bg-white shadow-lg sticky top-0 z-50">
      {/* Top Bar with Contact Info */}
      <div className="bg-arsd-red text-white py-2">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>Contact: hr_arsd_iloilo@yahoo.com.ph</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>Figueroa St. Bonifacio, Arevalo, Iloilo City</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <UserProfile />
              ) : (
                <>
                  <Link
                    href="/sign-in"
                    className="text-white hover:text-gray-200 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/sign-up"
                    className="bg-white text-arsd-red px-3 py-1 rounded text-sm font-medium hover:bg-gray-100 transition-colors"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            {/* Logo and Company Name */}
            <Link href="/" className="flex items-center space-x-3">
              <Image
                src="/images/arsd-logo.png"
                alt="ARSD Construction Corporation"
                width={50}
                height={50}
                className="rounded-full"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  ARSD Construction Corporation
                </h1>
                <p className="text-sm text-gray-600">
                  Building Excellence Since Day One
                </p>
              </div>
            </Link>

            {/* Navigation Menu */}
            <div className="hidden lg:flex items-center space-x-8">
              <Link
                href="/"
                className="text-gray-700 hover:text-arsd-red font-medium transition-colors"
              >
                Home
              </Link>

              {/* Services Dropdown */}
              <div className="relative group">
                <button className="flex items-center space-x-1 text-gray-700 hover:text-arsd-red font-medium transition-colors">
                  <span>Services</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="py-2">
                    <Link
                      href="/services#building-construction"
                      className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-arsd-red transition-colors"
                    >
                      <Building className="w-5 h-5 text-arsd-red" />
                      <div>
                        <div className="font-medium">Building Construction</div>
                        <div className="text-sm text-gray-500">
                          Residential & Commercial
                        </div>
                      </div>
                    </Link>
                    <Link
                      href="/services#design-plan-preparation"
                      className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-arsd-red transition-colors"
                    >
                      <PenTool className="w-5 h-5 text-arsd-red" />
                      <div>
                        <div className="font-medium">
                          Design & Plan Preparation
                        </div>
                        <div className="text-sm text-gray-500">
                          Architectural & Engineering
                        </div>
                      </div>
                    </Link>
                    <Link
                      href="/services#land-development"
                      className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-arsd-red transition-colors"
                    >
                      <MapPin className="w-5 h-5 text-arsd-red" />
                      <div>
                        <div className="font-medium">Land Development</div>
                        <div className="text-sm text-gray-500">
                          Site Preparation & Infrastructure
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>

              <Link
                href="/projects"
                className="text-gray-700 hover:text-arsd-red font-medium transition-colors"
              >
                Projects
              </Link>

              <Link
                href="/about"
                className="text-gray-700 hover:text-arsd-red font-medium transition-colors"
              >
                About Us
              </Link>

              <Link
                href="/contact"
                className="text-gray-700 hover:text-arsd-red font-medium transition-colors"
              >
                Contact
              </Link>

              {user && (
                <Link href="/dashboard">
                  <Button className="bg-arsd-red hover:bg-arsd-red-dark text-white">
                    Dashboard
                  </Button>
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <button className="text-gray-700 hover:text-arsd-red">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
