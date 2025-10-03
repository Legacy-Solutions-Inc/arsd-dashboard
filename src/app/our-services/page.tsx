import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Building,
  PenTool,
  MapPin,
  Hammer,
  Shield,
  Clock,
  Users,
  Award,
  CheckCircle,
  ArrowRight,
  Droplets,
  Truck,
  ChevronUp,
  Home,
  Ruler,
  Pencil,
  ArrowUpRight,
  Star,
  CheckCircle2,
  HardHat,
} from "lucide-react";
import { ServiceCard, Service } from "@/components/ServiceCard";
import Link from "next/link";
import Image from "next/image";

export default function Services() {
  // All 5 main services data
  const services = [
    {
      icon: <Building className="w-16 h-16 text-white" />,
      title: "Building Construction",
      subtitle: "Complete Construction Solutions",
      description: "From residential homes to commercial complexes, we deliver exceptional construction services that stand the test of time.",
      features: [
        "Residential homes and condominiums",
        "Commercial buildings and offices", 
        "Industrial facilities and warehouses",
        "Renovation and remodeling projects",
        "Structural repairs and maintenance"
      ],
      bgColor: "from-blue-600 to-blue-800",
      textColor: "text-blue-600"
    },
    {
      icon: <PenTool className="w-16 h-16 text-white" />,
      title: "Design & Plan Preparation",
      subtitle: "Professional Design Services",
      description: "Our expert architects and engineers create innovative designs that meet your vision and exceed industry standards.",
      features: [
        "Architectural design and planning",
        "Structural engineering analysis",
        "MEP (Mechanical, Electrical, Plumbing) design",
        "3D modeling and visualization",
        "Permit processing and documentation"
      ],
      bgColor: "from-purple-600 to-purple-800",
      textColor: "text-purple-600"
    },
    {
      icon: <MapPin className="w-16 h-16 text-white" />,
      title: "Land Development",
      subtitle: "Infrastructure Development",
      description: "Transform raw land into developed properties with our comprehensive land development and infrastructure services.",
      features: [
        "Site surveying and analysis",
        "Earthworks and excavation",
        "Utility installation and connections",
        "Road construction and paving",
        "Drainage and sewerage systems"
      ],
      bgColor: "from-green-600 to-green-800",
      textColor: "text-green-600"
    },
    {
      icon: <Droplets className="w-16 h-16 text-white" />,
      title: "Waterproofing",
      subtitle: "Protection Solutions",
      description: "Expert waterproofing solutions to protect your structures from water damage and ensure long-term durability.",
      features: [
        "Roof waterproofing systems",
        "Basement and foundation waterproofing",
        "Bathroom and kitchen waterproofing",
        "Balcony and terrace waterproofing",
        "Waterproofing maintenance and repair"
      ],
      bgColor: "from-cyan-600 to-cyan-800",
      textColor: "text-cyan-600"
    },
    {
      icon: <Truck className="w-16 h-16 text-white" />,
      title: "Supply Aggregates",
      subtitle: "Material Supply & Logistics",
      description: "Quality construction materials and aggregates delivered to your project site with reliable logistics and competitive pricing.",
      features: [
        "Sand and gravel supply",
        "Concrete aggregates",
        "Crushed stone materials",
        "Construction sand",
        "Delivery and logistics services"
      ],
      bgColor: "from-orange-600 to-orange-800",
      textColor: "text-orange-600"
    }
  ];

  // Equipment overview stats (generalized)
  const equipmentOverview = [
    {
      title: "Heavy Equipment",
      icon: <Hammer className="w-6 h-6 text-white" />,
      points: [
        "Excavators, loaders, bulldozers, road rollers",
        "Concrete batching and crushing plants",
        "Cranes and material handling equipment",
      ],
    },
    {
      title: "Transport Fleet",
      icon: <Truck className="w-6 h-6 text-white" />,
      points: [
        "6W/10W dump trucks and tipper trucks",
        "Transit mixers and boom trucks",
        "Service and self-loading trucks",
      ],
    },
    {
      title: "Tools & Support",
      icon: <HardHat className="w-6 h-6 text-white" />,
      points: [
        "Generators, compactors, welding and cutting tools",
        "Power tools and site instruments",
        "IT equipment for digital project delivery",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-16 sm:py-20 lg:py-32 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>
          <div className="absolute top-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-gradient-to-br from-arsd-red/20 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 sm:w-96 sm:h-96 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center gap-2 bg-arsd-red/20 backdrop-blur-sm text-arsd-red px-3 py-2 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold mb-4 sm:mb-6 border border-arsd-red/30">
                  Professional Construction Services
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
                  Building Excellence
                  <span className="block text-arsd-red">Since 1998</span>
                </h1>
                <p className="text-base sm:text-lg lg:text-xl text-slate-300 mb-6 sm:mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                  From residential homes to commercial complexes, we deliver exceptional construction services that stand the test of time.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
                  <Link href="/contact-us">
                    <Button size="lg" className="w-full sm:w-auto bg-arsd-red hover:bg-arsd-red/90 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300">
                      Get Free Quote
                      <ArrowUpRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                    </Button>
                  </Link>
                  <Link href="/projects">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-white text-slate-900 bg-white hover:bg-gray-100 hover:text-slate-900 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold transition-all duration-300">
                      View Our Work
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="relative mt-8 lg:mt-0">
                <div className="relative z-10">
                  <Image
                    src="/images/arsd-logo.png"
                    alt="ARSD Construction Corporation"
                    width={250}
                    height={250}
                    className="mx-auto rounded-2xl shadow-2xl w-48 h-48 sm:w-64 sm:h-64 lg:w-80 lg:h-80"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-arsd-red/20 to-blue-500/20 rounded-2xl blur-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16 lg:mb-20">
            <div className="inline-flex items-center gap-2 bg-arsd-red/10 text-arsd-red px-4 py-2 sm:px-6 sm:py-3 rounded-full text-xs sm:text-sm font-semibold mb-4 sm:mb-6">
              Our Services
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
              Comprehensive Construction Solutions
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              We provide end-to-end construction services tailored to your specific needs, from initial design to final completion.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {services.map((service, index) => (
              <div key={index} className="group">
                <div className="bg-white rounded-2xl p-6 sm:p-8 h-full shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4 sm:mb-6">
                    <div className={`w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br ${service.bgColor} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                      {service.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">{service.title}</h3>
                      <p className="text-sm sm:text-base text-gray-500 font-medium">{service.subtitle}</p>
                    </div>
                  </div>
                  <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 leading-relaxed">{service.description}</p>
                  <ul className="space-y-2 sm:space-y-3">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 sm:gap-3 text-sm sm:text-base text-gray-600">
                        <CheckCircle2 className={`w-4 h-4 sm:w-5 sm:h-5 ${service.textColor} flex-shrink-0 mt-0.5`} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16 lg:mb-20">
            <div className="inline-flex items-center gap-2 bg-arsd-red/10 text-arsd-red px-4 py-2 sm:px-6 sm:py-3 rounded-full text-xs sm:text-sm font-semibold mb-4 sm:mb-6">
              <Clock className="h-4 w-4" />
              Our Process
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
              How We Work
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              A systematic approach to ensure your project is completed efficiently and to your satisfaction.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
            {[
              {
                step: "01",
                title: "Consultation",
                description: "Initial meeting to understand your requirements and vision",
                icon: <Users className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              },
              {
                step: "02", 
                title: "Design & Planning",
                description: "Detailed architectural plans and project timeline development",
                icon: <PenTool className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              },
              {
                step: "03",
                title: "Construction",
                description: "Professional execution with regular progress updates",
                icon: <Hammer className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              },
              {
                step: "04",
                title: "Completion",
                description: "Final inspection, handover, and ongoing support",
                icon: <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              },
            ].map((process, index) => (
              <div key={index} className="text-center group">
                <div className="relative mb-6 sm:mb-8">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-arsd-red to-red-600 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300 shadow-xl">
                    {process.icon}
                  </div>
                  <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 bg-white text-arsd-red rounded-full flex items-center justify-center text-xs sm:text-sm font-bold border-2 border-arsd-red">
                    {process.step}
                  </div>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
                  {process.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{process.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Equipment & Fleet Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16 lg:mb-20">
            <div className="inline-flex items-center gap-2 bg-arsd-red/10 text-arsd-red px-4 py-2 sm:px-6 sm:py-3 rounded-full text-xs sm:text-sm font-semibold mb-4 sm:mb-6">
              <Truck className="h-4 w-4" />
              Our Equipment & Fleet
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
              Capabilities Overview
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Our company maintains a robust inventory of heavy equipment, transport vehicles, and support tools that enable efficient and safe execution of civil, building, and infrastructure projects.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            {equipmentOverview.map((group, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-arsd-red to-red-600 rounded-xl flex items-center justify-center mb-4 sm:mb-5">
                  {group.icon}
                </div>
                <h4 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">{group.title}</h4>
                <ul className="space-y-2 sm:space-y-3">
                  {group.points.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 sm:gap-3 text-sm sm:text-base text-gray-700">
                      <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-arsd-red mt-0.5 flex-shrink-0" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-gradient-to-br from-arsd-red/20 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 sm:w-96 sm:h-96 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
              Ready to Build Your Dream Project?
            </h2>
            <p className="text-lg sm:text-xl text-slate-300 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed">
              Let's discuss your construction needs and create something extraordinary together.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Link href="/contact-us">
                <Button size="lg" className="w-full sm:w-auto bg-arsd-red hover:bg-arsd-red/90 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300">
                  Start Your Project
                  <ArrowUpRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </Link>
              <Link href="/projects">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-white text-white bg-transparent hover:bg-white hover:text-slate-900 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold transition-all duration-300">
                  View Portfolio
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}