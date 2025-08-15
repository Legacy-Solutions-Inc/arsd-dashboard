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
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function Services() {
  const services = [
    {
      icon: <Building className="w-12 h-12 text-arsd-red" />,
      title: "Building Construction",
      description:
        "Complete residential and commercial construction services from foundation to finishing.",
      features: [
        "Residential homes and condominiums",
        "Commercial buildings and offices",
        "Industrial facilities and warehouses",
        "Renovation and remodeling projects",
        "Structural repairs and maintenance",
      ],
      image: "/images/arsd-logo.png",
    },
    {
      icon: <PenTool className="w-12 h-12 text-arsd-red" />,
      title: "Design & Plan Preparation",
      description:
        "Professional architectural and engineering design services tailored to your needs.",
      features: [
        "Architectural design and planning",
        "Structural engineering analysis",
        "MEP (Mechanical, Electrical, Plumbing) design",
        "3D modeling and visualization",
        "Permit processing and documentation",
      ],
      image: "/images/arsd-logo.png",
    },
    {
      icon: <MapPin className="w-12 h-12 text-arsd-red" />,
      title: "Land Development",
      description:
        "Comprehensive site preparation and infrastructure development services.",
      features: [
        "Site surveying and analysis",
        "Earthworks and excavation",
        "Utility installation and connections",
        "Road construction and paving",
        "Drainage and sewerage systems",
      ],
      image: "/images/arsd-logo.png",
    },
  ];

  const whyChooseUs = [
    {
      icon: <Shield className="w-8 h-8 text-arsd-red" />,
      title: "Quality Assurance",
      description:
        "Rigorous quality control processes ensure every project meets the highest standards.",
    },
    {
      icon: <Clock className="w-8 h-8 text-arsd-red" />,
      title: "On-Time Delivery",
      description:
        "We pride ourselves on completing projects within agreed timelines and budgets.",
    },
    {
      icon: <Users className="w-8 h-8 text-arsd-red" />,
      title: "Expert Team",
      description:
        "Our skilled professionals bring years of experience to every construction project.",
    },
    {
      icon: <Award className="w-8 h-8 text-arsd-red" />,
      title: "Licensed & Insured",
      description:
        "Fully licensed contractors with comprehensive insurance coverage for your peace of mind.",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-arsd-red to-red-700 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Our Construction Services
            </h1>
            <p className="text-xl text-red-100 mb-8">
              Comprehensive construction solutions for residential, commercial,
              and industrial projects in Iloilo City and surrounding areas.
            </p>
            <div className="flex justify-center">
              <Image
                src="/images/arsd-logo.png"
                alt="ARSD Construction Corporation"
                width={80}
                height={80}
                className="rounded-full bg-white p-2"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              What We Do Best
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              From initial design to final construction, we provide end-to-end
              solutions for all your building needs.
            </p>
          </div>

          <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">{service.icon}</div>
                  <CardTitle className="text-2xl text-gray-900">
                    {service.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-6 text-center">
                    {service.description}
                  </p>
                  <ul className="space-y-3">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose ARSD Construction?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We combine years of experience with modern construction techniques
              to deliver exceptional results.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {whyChooseUs.map((item, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">{item.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Our Construction Process
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              A systematic approach to ensure your project is completed
              efficiently and to your satisfaction.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Consultation",
                description:
                  "Initial meeting to understand your requirements and vision",
              },
              {
                step: "02",
                title: "Design & Planning",
                description:
                  "Detailed architectural plans and project timeline development",
              },
              {
                step: "03",
                title: "Construction",
                description:
                  "Professional execution with regular progress updates",
              },
              {
                step: "04",
                title: "Completion",
                description: "Final inspection, handover, and ongoing support",
              },
            ].map((process, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-arsd-red text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {process.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {process.title}
                </h3>
                <p className="text-gray-600">{process.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-arsd-red text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Start Your Construction Project?
          </h2>
          <p className="text-red-100 mb-8 max-w-2xl mx-auto">
            Contact us today for a free consultation and let's discuss how we
            can bring your vision to life.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button className="bg-white text-arsd-red hover:bg-gray-100">
                Get Free Quote
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/projects">
              <Button
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-arsd-red"
              >
                View Our Work
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
