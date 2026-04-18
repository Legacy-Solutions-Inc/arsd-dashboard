"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/auth";
import { Button } from "./ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useRBAC } from "@/hooks/useRBAC";
import { getDefaultDashboardRoute } from "@/utils/dashboard-routing";
import { CONTACT_INFO } from "@/constants/contact-info";

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
    <nav className="w-full bg-[#111111] border-b border-[#2a2626] sticky top-0 z-50">
      {/* Main Navigation */}
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
              <h1 className="text-base sm:text-lg font-bold text-[#f0ede8]">
                {CONTACT_INFO.company.name}
              </h1>
              <p className="text-xs text-[#a09890]">
                {CONTACT_INFO.company.tagline}
              </p>
            </div>
            <div className="sm:hidden">
              <h1 className="text-sm font-bold text-[#f0ede8]">ARSD</h1>
              <p className="text-xs text-[#a09890]">Construction</p>
            </div>
          </Link>

          {/* Navigation Menu */}
          <div className="hidden lg:flex items-center space-x-8">
            <Link
              href="/"
              className="text-[#a09890] hover:text-[#f0ede8] font-medium transition-colors"
            >
              Home
            </Link>

            <Link
              href="/our-services"
              className="text-[#a09890] hover:text-[#f0ede8] font-medium transition-colors"
            >
              Services
            </Link>

            <Link
              href="/projects"
              className="text-[#a09890] hover:text-[#f0ede8] font-medium transition-colors"
            >
              Projects
            </Link>

            <Link
              href="/about-us"
              className="text-[#a09890] hover:text-[#f0ede8] font-medium transition-colors"
            >
              About Us
            </Link>

            <Link
              href="/contact-us"
              className="text-[#a09890] hover:text-[#f0ede8] font-medium transition-colors"
            >
              Contact
            </Link>

            <Link href="/contact-us" className="px-4 py-2 bg-arsd-red text-white text-sm font-semibold rounded hover:bg-red-700 transition-colors">
              Get a Quote
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
              className="relative flex h-6 w-6 flex-col justify-center gap-[6px] text-[#a09890] hover:text-[#f0ede8] transition-colors"
              aria-label="Toggle mobile menu"
              aria-expanded={mobileMenuOpen}
            >
              <motion.span
                className="block h-[2px] w-5 bg-current"
                animate={mobileMenuOpen ? { rotate: 45, y: 4 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
              />
              <motion.span
                className="block h-[2px] w-5 bg-current"
                animate={mobileMenuOpen ? { rotate: -45, y: -4 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
        <motion.div
          className="lg:hidden border-t border-[#2a2626] bg-[#111111] overflow-hidden"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        >
          <div className="responsive-container py-4">
            <div className="flex flex-col space-y-4">
              <Link
                href="/"
                className="text-[#a09890] hover:text-[#f0ede8] font-medium transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>

              <Link
                href="/our-services"
                className="text-[#a09890] hover:text-[#f0ede8] font-medium transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Services
              </Link>

              <Link
                href="/projects"
                className="text-[#a09890] hover:text-[#f0ede8] font-medium transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Projects
              </Link>

              <Link
                href="/about-us"
                className="text-[#a09890] hover:text-[#f0ede8] font-medium transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                About Us
              </Link>

              <Link
                href="/contact-us"
                className="text-[#a09890] hover:text-[#f0ede8] font-medium transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact
              </Link>

              <Link
                href="/contact-us"
                className="px-4 py-2 bg-arsd-red text-white text-sm font-semibold rounded hover:bg-red-700 transition-colors text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Get a Quote
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
        </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
