import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Check } from "lucide-react";

export default function Hero() {
  return (
    <div className="relative overflow-hidden bg-white">
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-arsd-red/10 via-white to-gray-100 opacity-80 animate-pulse" />

      <div className="relative pt-20 pb-24 sm:pt-28 sm:pb-36 lg:pt-36 lg:pb-44">
        <div className="responsive-container">
          <div className="text-center max-w-7xl mx-auto">
            <div className="flex justify-center mb-6 sm:mb-8">
              <Image
                src="/images/arsd-logo.png"
                alt="ARSD Construction Corporation Logo"
                width={100}
                height={100}
                className="rounded-full shadow-lg border-4 border-arsd-red bg-white sm:w-32 sm:h-32 lg:w-36 lg:h-36"
              />
            </div>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-gray-900 mb-4 sm:mb-6 tracking-tight drop-shadow-lg">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-arsd-red to-orange-600 animate-gradient-x">
                ARSD Construction Corporation
              </span>
            </h1>
            <h2 className="text-base sm:text-xl lg:text-2xl font-semibold text-gray-700 mb-6 sm:mb-8">
              Building Excellence in Iloilo City & Beyond
            </h2>

            <p className="text-sm sm:text-base lg:text-lg text-gray-600 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed px-4">
              Trusted partner for residential, commercial, and industrial projects. We deliver innovative solutions, transparent cost control, and real-time project management—ensuring your vision becomes reality.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-6 sm:mb-8 px-4">
              <Link
                href="/projects"
                className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 text-white bg-arsd-red rounded-lg hover:bg-orange-700 transition-colors text-base sm:text-lg font-bold shadow-lg w-full sm:w-auto justify-center"
              >
                View Our Projects
                <ArrowUpRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
              </Link>

              <Link
                href="#features"
                className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 text-arsd-red bg-white border border-arsd-red rounded-lg hover:bg-arsd-red hover:text-white transition-colors text-base sm:text-lg font-bold shadow w-full sm:w-auto justify-center"
              >
                Explore Features
              </Link>
            </div>

            <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-sm sm:text-base text-gray-700 px-4">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
                <span>Building Construction</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
                <span className="hidden sm:inline">Design & Plan Preparation</span>
                <span className="sm:hidden">Design & Plans</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
                <span>Land Development</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
                <span className="hidden sm:inline">Quality Assurance</span>
                <span className="sm:hidden">Quality</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
                <span className="hidden sm:inline">On-Time Delivery</span>
                <span className="sm:hidden">On-Time</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
