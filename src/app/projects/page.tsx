import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Building,
  Home,
  Factory,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function Projects() {
  const featuredProjects = [
    {
      id: "2134.00",
      title: "Metro Manila Commercial Complex",
      type: "Commercial",
      location: "Metro Manila, Philippines",
      client: "ABC Construction Corp",
      contractor: "XYZ Builders Inc",
      contractAmount: 2000000,
      progress: 65,
      status: "In Progress",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      description:
        "A modern commercial complex featuring retail spaces, offices, and parking facilities.",
      image: "/images/arsd-logo.png",
      features: [
        "5-story commercial building",
        "200 parking spaces",
        "Modern HVAC system",
        "Green building certification",
      ],
    },
    {
      id: "2135.00",
      title: "Iloilo Residential Development",
      type: "Residential",
      location: "Iloilo City, Philippines",
      client: "Iloilo Housing Corp",
      contractor: "ARSD Construction Corporation",
      contractAmount: 1500000,
      progress: 85,
      status: "Near Completion",
      startDate: "2023-06-01",
      endDate: "2024-03-31",
      description:
        "Affordable housing project with 50 residential units and community amenities.",
      image: "/images/arsd-logo.png",
      features: [
        "50 residential units",
        "Community center",
        "Playground area",
        "24/7 security",
      ],
    },
    {
      id: "2136.00",
      title: "Industrial Warehouse Facility",
      type: "Industrial",
      location: "Bataan, Philippines",
      client: "Industrial Solutions Inc",
      contractor: "ARSD Construction Corporation",
      contractAmount: 3500000,
      progress: 40,
      status: "In Progress",
      startDate: "2024-02-01",
      endDate: "2025-01-31",
      description:
        "Large-scale warehouse and distribution center with modern logistics infrastructure.",
      image: "/images/arsd-logo.png",
      features: [
        "50,000 sqm warehouse",
        "Loading docks",
        "Office complex",
        "Fire safety systems",
      ],
    },
  ];

  const completedProjects = [
    {
      title: "Arevalo Community Center",
      type: "Public",
      location: "Arevalo, Iloilo City",
      completedYear: "2023",
      description:
        "Multi-purpose community center serving the local residents.",
    },
    {
      title: "Private Residence - Bonifacio",
      type: "Residential",
      location: "Bonifacio, Iloilo City",
      completedYear: "2023",
      description: "Modern 3-story family home with contemporary design.",
    },
    {
      title: "Commercial Building Renovation",
      type: "Renovation",
      location: "Iloilo Business District",
      completedYear: "2022",
      description: "Complete renovation of a 10-story commercial building.",
    },
    {
      title: "Infrastructure Development",
      type: "Infrastructure",
      location: "Iloilo Province",
      completedYear: "2022",
      description: "Road construction and drainage system installation.",
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "In Progress":
        return <Clock className="w-4 h-4 text-blue-500" />;
      case "Near Completion":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Commercial":
        return <Building className="w-5 h-5" />;
      case "Residential":
        return <Home className="w-5 h-5" />;
      case "Industrial":
        return <Factory className="w-5 h-5" />;
      default:
        return <Building className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-arsd-red to-red-700 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Our Construction Projects
            </h1>
            <p className="text-xl text-red-100 mb-8">
              Showcasing our commitment to excellence through successful project
              deliveries across the Philippines.
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

      {/* Project Stats */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-3xl font-bold text-arsd-red mb-2">50+</div>
              <div className="text-gray-600">Projects Completed</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-3xl font-bold text-arsd-red mb-2">₱7B+</div>
              <div className="text-gray-600">Total Project Value</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-3xl font-bold text-arsd-red mb-2">15+</div>
              <div className="text-gray-600">Years Experience</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-3xl font-bold text-arsd-red mb-2">98%</div>
              <div className="text-gray-600">Client Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Current Featured Projects
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Take a look at our ongoing projects that demonstrate our expertise
              in various construction sectors.
            </p>
          </div>

          <div className="grid lg:grid-cols-1 gap-8">
            {featuredProjects.map((project, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-arsd-red">
                        {getTypeIcon(project.type)}
                        <Badge
                          variant="outline"
                          className="border-arsd-red text-arsd-red"
                        >
                          {project.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(project.status)}
                        <span className="text-sm font-medium">
                          {project.status}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Project ID</div>
                      <div className="font-bold text-arsd-red">
                        {project.id}
                      </div>
                    </div>
                  </div>
                  <CardTitle className="text-2xl text-gray-900">
                    {project.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <p className="text-gray-600 mb-6">
                        {project.description}
                      </p>

                      <div className="grid md:grid-cols-2 gap-4 mb-6">
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm">{project.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm">
                            {project.startDate} - {project.endDate}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <DollarSign className="w-4 h-4" />
                          <span className="text-sm">
                            ₱{project.contractAmount.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Users className="w-4 h-4" />
                          <span className="text-sm">{project.client}</span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Progress</span>
                          <span className="text-sm text-gray-600">
                            {project.progress}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-arsd-red h-2 rounded-full transition-all duration-300"
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">
                        Key Features
                      </h4>
                      <ul className="space-y-2">
                        {project.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-600">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Completed Projects */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Recently Completed Projects
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our portfolio of successfully delivered projects across different
              sectors.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {completedProjects.map((project, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge
                      variant="outline"
                      className="border-green-500 text-green-600"
                    >
                      Completed
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {project.completedYear}
                    </span>
                  </div>
                  <CardTitle className="text-lg">{project.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-gray-600 mb-3">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{project.location}</span>
                  </div>
                  <p className="text-sm text-gray-600">{project.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-arsd-red text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Start Your Next Project?
          </h2>
          <p className="text-red-100 mb-8 max-w-2xl mx-auto">
            Join our satisfied clients and let us bring your construction vision
            to life with our proven expertise.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button className="bg-white text-arsd-red hover:bg-gray-100">
                Start Your Project
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-arsd-red"
              >
                View Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
