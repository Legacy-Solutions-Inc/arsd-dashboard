import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Check } from "lucide-react";

export default function Hero() {
  return (
    <div className="relative overflow-hidden bg-white">
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-arsd-red/10 via-white to-gray-100 opacity-80 animate-pulse" />

      <div className="relative pt-28 pb-36 sm:pt-36 sm:pb-44">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-7xl mx-auto">
            <div className="flex justify-center mb-8">
              <Image
                src="/images/arsd-logo.png"
                alt="ARSD Construction Corporation Logo"
                width={140}
                height={140}
                className="rounded-full shadow-lg border-4 border-arsd-red bg-white"
              />
            </div>
            <h1 className="text-6xl sm:text-7xl font-extrabold text-gray-900 mb-6 tracking-tight drop-shadow-lg">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-arsd-red to-orange-600 animate-gradient-x">
                ARSD Construction Corporation
              </span>
            </h1>
            <h2 className="text-2xl sm:text-3xl font-semibold text-gray-700 mb-8">
              Building Excellence in Iloilo City & Beyond
            </h2>

            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Trusted partner for residential, commercial, and industrial projects. We deliver innovative solutions, transparent cost control, and real-time project management—ensuring your vision becomes reality.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Link
                href="/projects"
                className="inline-flex items-center px-8 py-4 text-white bg-arsd-red rounded-lg hover:bg-orange-700 transition-colors text-lg font-bold shadow-lg"
              >
                View Our Projects
                <ArrowUpRight className="ml-2 w-5 h-5" />
              </Link>

              <Link
                href="#features"
                className="inline-flex items-center px-8 py-4 text-arsd-red bg-white border border-arsd-red rounded-lg hover:bg-arsd-red hover:text-white transition-colors text-lg font-bold shadow"
              >
                Explore Features
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-base text-gray-700">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span>Building Construction</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span>Design & Plan Preparation</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span>Land Development</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span>Quality Assurance</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span>On-Time Delivery</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
