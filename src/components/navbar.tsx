"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/auth";
import { Button } from "./ui/button";
import {
  Phone,
  Menu,
  X,
  MapPin,
} from "lucide-react";
import UserProfile from "./user-profile";
import { useRBAC } from "@/hooks/useRBAC";
import { getDefaultDashboardRoute } from "@/utils/dashboard-routing";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const { user: userWithRole } = useRBAC();

  useEffect(() => {
    const supabase = createClient();
    
    // Get initial user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleDashboardClick = () => {
    const defaultRoute = getDefaultDashboardRoute(userWithRole?.role as any);
    router.push(defaultRoute);
  };

  return (
    <nav className="w-full bg-white shadow-lg sticky top-0 z-50">
      {/* Top Bar with Contact Info */}
      <div className="bg-arsd-red text-white py-2">
        <div className="responsive-container">
          <div className="flex flex-col sm:flex-row justify-between items-center text-sm gap-2 sm:gap-0">
            <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-6">
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span className="hidden xs:inline">Contact: hr_arsd_iloilo@yahoo.com.ph</span>
                <span className="xs:hidden">hr_arsd_iloilo@yahoo.com.ph</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span className="hidden sm:inline">Figueroa St. Bonifacio, Arevalo, Iloilo City</span>
                <span className="sm:hidden">Iloilo City</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {loading ? (
                <div className="text-white text-sm">Loading...</div>
              ) : user ? (
                <UserProfile />
              ) : (
                <>
                  <Link
                    href="/sign-in"
                    className="text-white hover:text-gray-200 transition-colors text-sm"
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
        <div className="responsive-container">
          <div className="flex justify-between items-center py-4">
            {/* Logo and Company Name */}
            <Link href="/" className="flex items-center space-x-2 sm:space-x-3">
              <Image
                src="/images/arsd-logo.png"
                alt="ARSD Construction Corporation"
                width={40}
                height={40}
                className="rounded-full sm:w-12 sm:h-12"
              />
              <div className="hidden sm:block">
                <h1 className="text-base sm:text-lg font-bold text-gray-900">
                  ARSD Construction Corporation
                </h1>
                <p className="text-xs text-gray-600">
                  In God We Trust
                </p>
              </div>
              <div className="sm:hidden">
                <h1 className="text-sm font-bold text-gray-900">ARSD</h1>
                <p className="text-xs text-gray-600">Construction</p>
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

              <Link
                href="/our-services"
                className="text-gray-700 hover:text-arsd-red font-medium transition-colors"
              >
                Services
              </Link>

              <Link
                href="/projects"
                className="text-gray-700 hover:text-arsd-red font-medium transition-colors"
              >
                Projects
              </Link>

              <Link
                href="/about-us"
                className="text-gray-700 hover:text-arsd-red font-medium transition-colors"
              >
                About Us
              </Link>

              <Link
                href="/contact-us"
                className="text-gray-700 hover:text-arsd-red font-medium transition-colors"
              >
                Contact
              </Link>

              {user && (
                <Button 
                  onClick={handleDashboardClick}
                  className="bg-arsd-red hover:bg-arsd-red-dark text-white"
                >
                  Dashboard
                </Button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-700 hover:text-arsd-red transition-colors"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-100 bg-white">
            <div className="responsive-container py-4">
              <div className="flex flex-col space-y-4">
                <Link
                  href="/"
                  className="text-gray-700 hover:text-arsd-red font-medium transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Home
                </Link>
                
                <Link
                  href="/our-services"
                  className="text-gray-700 hover:text-arsd-red font-medium transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Services
                </Link>

                <Link
                  href="/projects"
                  className="text-gray-700 hover:text-arsd-red font-medium transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Projects
                </Link>

                <Link
                  href="/about-us"
                  className="text-gray-700 hover:text-arsd-red font-medium transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  About Us
                </Link>

                <Link
                  href="/contact-us"
                  className="text-gray-700 hover:text-arsd-red font-medium transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Contact
                </Link>

                {user && (
                  <Button 
                    onClick={() => {
                      handleDashboardClick();
                      setMobileMenuOpen(false);
                    }}
                    className="bg-arsd-red hover:bg-arsd-red-dark text-white w-full justify-start"
                  >
                    Dashboard
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
