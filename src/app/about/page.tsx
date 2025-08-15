import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Award,
  Users,
  Calendar,
  Target,
  Shield,
  Heart,
  Lightbulb,
  CheckCircle,
  ArrowRight,
  Building,
  Hammer,
  HardHat,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function About() {
  const values = [
    {
      icon: <Shield className="w-8 h-8 text-arsd-red" />,
      title: "Integrity",
      description:
        "We conduct our business with honesty, transparency, and ethical practices in every project.",
    },
    {
      icon: <Target className="w-8 h-8 text-arsd-red" />,
      title: "Excellence",
      description:
        "We strive for the highest quality in every aspect of our construction services and client relationships.",
    },
    {
      icon: <Heart className="w-8 h-8 text-arsd-red" />,
      title: "Commitment",
      description:
        "We are dedicated to delivering projects on time, within budget, and exceeding client expectations.",
    },
    {
      icon: <Lightbulb className="w-8 h-8 text-arsd-red" />,
      title: "Innovation",
      description:
        "We embrace modern construction techniques and technologies to improve efficiency and quality.",
    },
  ];

  const milestones = [
    {
      year: "2009",
      title: "Company Founded",
      description:
        "ARSD Construction Corporation was established in Iloilo City with a vision to provide quality construction services.",
    },
    {
      year: "2012",
      title: "First Major Project",
      description:
        "Successfully completed our first major commercial building project, establishing our reputation in the industry.",
    },
    {
      year: "2015",
      title: "Expansion",
      description:
        "Expanded operations to serve clients across Western Visayas region with increased workforce and equipment.",
    },
    {
      year: "2018",
      title: "ISO Certification",
      description:
        "Achieved ISO 9001:2015 certification for quality management systems in construction services.",
    },
    {
      year: "2020",
      title: "Digital Transformation",
      description:
        "Implemented digital project management systems and modern construction technologies.",
    },
    {
      year: "2024",
      title: "Continued Growth",
      description:
        "Celebrating 15 years of excellence with over 50 completed projects and expanding service offerings.",
    },
  ];

  const team = [
    {
      name: "Engr. Antonio R. Santos",
      position: "Chief Executive Officer",
      description:
        "With over 20 years in construction management, Antonio leads our strategic vision and client relationships.",
      icon: <HardHat className="w-12 h-12 text-arsd-red" />,
    },
    {
      name: "Engr. Maria D. Rodriguez",
      position: "Project Manager",
      description:
        "Maria oversees project execution and ensures quality standards are met across all construction phases.",
      icon: <Building className="w-12 h-12 text-arsd-red" />,
    },
    {
      name: "Engr. Jose L. Cruz",
      position: "Site Engineer",
      description:
        "Jose manages on-site operations and coordinates with various teams to ensure smooth project delivery.",
      icon: <Hammer className="w-12 h-12 text-arsd-red" />,
    },
  ];

  const achievements = [
    { number: "15+", label: "Years of Experience" },
    { number: "50+", label: "Projects Completed" },
    { number: "100+", label: "Satisfied Clients" },
    { number: "₱7B+", label: "Total Project Value" },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-arsd-red to-red-700 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              About ARSD Construction Corporation
            </h1>
            <p className="text-xl text-red-100 mb-8">
              Building Excellence Since 2009 - Your trusted construction partner
              in Iloilo City and beyond.
            </p>
            <div className="flex justify-center">
              <Image
                src="/images/arsd-logo.png"
                alt="ARSD Construction Corporation"
                width={100}
                height={100}
                className="rounded-full bg-white p-3"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Company Overview */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Who We Are
              </h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                ARSD Construction Corporation is a leading construction company
                based in Iloilo City, Philippines. Since our establishment in
                2009, we have been committed to delivering high-quality
                construction services across residential, commercial, and
                industrial sectors.
              </p>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Our company specializes in building construction, design and
                plan preparation, and land development. We pride ourselves on
                our ability to handle projects of various scales, from
                individual residential homes to large commercial complexes and
                industrial facilities.
              </p>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Located at Figueroa St. Bonifacio, Arevalo, Iloilo City, we
                serve clients throughout Western Visayas and beyond, bringing
                our expertise and commitment to excellence to every project we
                undertake.
              </p>
              <Link href="/contact">
                <Button className="bg-arsd-red hover:bg-red-700 text-white">
                  Get in Touch
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
            <div className="bg-gray-50 p-8 rounded-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Our Achievements
              </h3>
              <div className="grid grid-cols-2 gap-6">
                {achievements.map((achievement, index) => (
                  <div key={index} className="text-center">
                    <div className="text-3xl font-bold text-arsd-red mb-2">
                      {achievement.number}
                    </div>
                    <div className="text-gray-600 text-sm">
                      {achievement.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12">
            <Card className="border-l-4 border-l-arsd-red">
              <CardHeader>
                <CardTitle className="text-2xl text-gray-900 flex items-center gap-3">
                  <Target className="w-8 h-8 text-arsd-red" />
                  Our Mission
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed">
                  To provide exceptional construction services that exceed
                  client expectations through innovative solutions, quality
                  craftsmanship, and unwavering commitment to safety and
                  sustainability. We strive to build lasting relationships with
                  our clients while contributing to the development of our
                  communities.
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-arsd-red">
              <CardHeader>
                <CardTitle className="text-2xl text-gray-900 flex items-center gap-3">
                  <Lightbulb className="w-8 h-8 text-arsd-red" />
                  Our Vision
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed">
                  To be the most trusted and preferred construction company in
                  the Philippines, recognized for our excellence in project
                  delivery, innovation in construction methods, and positive
                  impact on the communities we serve. We envision a future where
                  our projects stand as landmarks of quality and sustainability.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Our Core Values
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              These fundamental principles guide every decision we make and
              every project we undertake.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">{value.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {value.title}
                </h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Company Timeline */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Our Journey
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              From our humble beginnings to becoming a trusted name in
              construction, here's our story.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <div key={index} className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-arsd-red text-white rounded-full flex items-center justify-center font-bold">
                      {milestone.year}
                    </div>
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {milestone.title}
                    </h3>
                    <p className="text-gray-600">{milestone.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Leadership Team */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Our Leadership Team
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Meet the experienced professionals who lead our company and drive
              our success.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <Card
                key={index}
                className="text-center hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex justify-center mb-4">{member.icon}</div>
                  <CardTitle className="text-xl text-gray-900">
                    {member.name}
                  </CardTitle>
                  <p className="text-arsd-red font-medium">{member.position}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{member.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications & Awards */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Certifications & Recognition
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our commitment to quality and excellence has been recognized
              through various certifications and awards.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: "ISO 9001:2015",
                description: "Quality Management System Certification",
              },
              {
                title: "PCAB License",
                description: "Philippine Contractors Accreditation Board",
              },
              {
                title: "Safety Excellence",
                description: "Outstanding Safety Performance Award",
              },
              {
                title: "Client Choice",
                description: "Best Construction Company - Iloilo",
              },
            ].map((cert, index) => (
              <div
                key={index}
                className="text-center bg-white p-6 rounded-lg shadow-sm"
              >
                <Award className="w-12 h-12 text-arsd-red mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {cert.title}
                </h3>
                <p className="text-gray-600 text-sm">{cert.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-arsd-red text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Partner with ARSD Construction
          </h2>
          <p className="text-red-100 mb-8 max-w-2xl mx-auto">
            Experience the difference that 15 years of expertise and commitment
            to excellence can make for your next construction project.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button className="bg-white text-arsd-red hover:bg-gray-100">
                Contact Us Today
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/projects">
              <Button
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-arsd-red"
              >
                View Our Projects
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
