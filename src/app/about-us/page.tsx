import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Award,
  Target,
  Shield,
  Heart,
  Lightbulb,
  ArrowRight,
  Building,
  Hammer,
  HardHat,
  Users,
  Clock,
  CheckCircle,
  Star,
  ArrowUpRight,
  MapPin,
  Phone,
  Mail,
  Calendar,
  TrendingUp,
  Award as AwardIcon,
  FileText,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { ValueCard } from "@/components/ValueCard";
import { MilestoneCard, Milestone } from "@/components/MilestoneCard";
import { TeamMemberCard, TeamMember } from "@/components/TeamMemberCard";
import Image from "next/image";

export default function AboutPage() {
  // Company milestones data
  const milestones: Milestone[] = [
    {
      year: "1998",
      title: "Company Founded",
      description:
        "ARSD Construction was founded with courage, honesty and dedication, starting with humble beginnings in labor contracting.",
    },
    {
      year: "1999",
      title: "First Expansion",
      description:
        "Introduced seed capital and ventured into straight contract work, coupled with determination and dedication.",
    },
    {
      year: "2007",
      title: "SEC Registration",
      description:
        "Registered with the Securities & Exchange Commission (SEC) to increase clients' confidence and upgrade services.",
    },
    {
      year: "2010",
      title: "PhilGEPS Certification",
      description:
        "Achieved PhilGEPS certification for government electronic procurement system participation.",
    },
    {
      year: "2015",
      title: "PCAB Category A",
      description:
        "Upgraded to PCAB Category A license, enabling us to handle larger and more complex projects.",
    },
    {
      year: "2024",
      title: "25+ Years Strong",
      description:
        "Celebrating over 25 years of excellence with 500+ completed projects and continued growth.",
    },
  ];

  // Achievements data
  const achievements = [
    { number: "25+", label: "Years of Experience" },
    { number: "500+", label: "Projects Completed" },
    { number: "100+", label: "Satisfied Clients" },
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
                  <Building className="h-4 w-4" />
                  About Our Company
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
                  Building Excellence
                  <span className="block text-arsd-red">Since 1998</span>
                </h1>
                <p className="text-base sm:text-lg lg:text-xl text-slate-300 mb-6 sm:mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                  Your trusted construction partner in Iloilo City and beyond, delivering exceptional projects with integrity, excellence, and commitment.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
                  <Link href="/contact-us">
                    <Button size="lg" className="w-full sm:w-auto bg-arsd-red hover:bg-arsd-red/90 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300">
                      Get in Touch
                      <ArrowUpRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                    </Button>
                  </Link>
                  <Link href="/projects">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-white text-white bg-transparent hover:bg-white hover:text-slate-900 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold transition-all duration-300">
                      View Our Work
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="relative mt-8 lg:mt-0">
                <div className="relative z-10">
                  <Image
                    src="/images/photos/office2.jpg"
                    alt="ARSD Construction Corporation Office Building"
                    width={400}
                    height={300}
                    className="mx-auto rounded-2xl shadow-2xl w-48 h-48 sm:w-64 sm:h-64 lg:w-80 lg:h-80 object-cover"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-arsd-red/20 to-blue-500/20 rounded-2xl blur-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Company Overview */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-arsd-red/10 text-arsd-red px-4 py-2 sm:px-6 sm:py-3 rounded-full text-xs sm:text-sm font-semibold mb-4 sm:mb-6">
                Our Story
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
                Who We Are
              </h2>
              <div className="space-y-4 sm:space-y-6">
                <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                  ARSD Construction was founded with courage, honesty and dedication as it was started with a humble beginning in 1998. At first it was just labor contracting; after a year, a small seed capital was introduced and coupled with determination and dedication straight contract was ventured.
                </p>
                <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                  As a new player, tough and rough situations molded and strengthened ARSD to its existence. While maintaining its good reputation to clients and suppliers; to date, those networks keep the company growing strong that by August 2007 the founder decided to register the company with the Securities & Exchange Commission (SEC) to increase clients' confidence and to upgrade its offered services.
                </p>
                <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                  ARSD believes that maintaining clients are doing quality works coupled with approachable staffs and promptness in all its actions.
                </p>
              </div>
              <div className="mt-6 sm:mt-8">
                <Link href="/contact-us">
                  <Button size="lg" className="w-full sm:w-auto bg-arsd-red hover:bg-arsd-red/90 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300">
                    Get in Touch
                    <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative mt-8 lg:mt-0">
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-2xl">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 text-center">
                  Our Achievements
                </h3>
                <div className="grid grid-cols-2 gap-4 sm:gap-6">
                  {achievements.map((achievement, index) => (
                    <div key={index} className="text-center group">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-arsd-red to-red-600 rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-300">
                        <Star className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div className="text-xl sm:text-2xl font-bold text-arsd-red mb-1">
                        {achievement.number}
                      </div>
                      <div className="text-gray-600 text-xs sm:text-sm font-medium">
                        {achievement.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 sm:py-20 lg:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 bg-arsd-red/10 text-arsd-red px-4 py-2 sm:px-6 sm:py-3 rounded-full text-xs sm:text-sm font-semibold mb-4 sm:mb-6">
              Our Foundation
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
              Mission & Vision
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Our guiding principles that drive every decision and every project we undertake.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8">
            <Card className="border-l-4 border-l-arsd-red shadow-xl hover:shadow-2xl transition-all duration-300 group">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl sm:text-2xl text-gray-900 flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-arsd-red to-red-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Target className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  Our Mission
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed text-base sm:text-lg">
                  We aim to implement a timeless relationship with our clients based on simply doing the job right at the first time. To fulfill the mission, all employees will be treated fairly and involve them in quality improvement process to insure efficient work execution by us, and for the customers. To safely deliver any project, any time, in any environment for the benefit of our customers, shareholders, employees and the communities we serve.
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-arsd-red shadow-xl hover:shadow-2xl transition-all duration-300 group">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl sm:text-2xl text-gray-900 flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-arsd-red to-red-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  Our Vision
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed text-base sm:text-lg">
                  We persevere to deliver with utmost superiority, dependability, and promptly to achieve total customer satisfaction. Hand in hand with our clients, we act and win as a team.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Company Timeline */}
      <section className="py-16 sm:py-20 lg:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 bg-arsd-red/10 text-arsd-red px-4 py-2 sm:px-6 sm:py-3 rounded-full text-xs sm:text-sm font-semibold mb-4 sm:mb-6">
              <Clock className="h-4 w-4" />
              Our Journey
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">Our Journey</h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              From our humble beginnings to becoming a trusted name in construction, here's our story.
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="space-y-6 sm:space-y-8">
              {milestones.map((milestone) => (
                <MilestoneCard key={milestone.year} milestone={milestone} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Certifications & Awards */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 bg-arsd-red/10 text-arsd-red px-4 py-2 sm:px-6 sm:py-3 rounded-full text-xs sm:text-sm font-semibold mb-4 sm:mb-6">
              <AwardIcon className="h-4 w-4" />
              Certifications & Recognition
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
              Certifications & Recognition
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Our commitment to quality and excellence has been recognized through various certifications and awards.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                title: "SEC No.",
                description: "CS 2007 28366",
                subtitle: "Securities & Exchange Commission Registration"
              },
              {
                title: "PCAB License No.",
                description: "36037",
                subtitle: "Valid until August 22, 2025 • Category A"
              },
              {
                title: "PhilGEPS Certificate No.",
                description: "2010-63063",
                subtitle: "Philippine Government Electronic Procurement System"
              },
            ].map((cert, index) => (
              <div
                key={index}
                className="text-center bg-white p-6 sm:p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100 group"
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-arsd-red to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Award className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">
                  {cert.title}
                </h3>
                <p className="text-2xl sm:text-3xl font-bold text-arsd-red mb-2 sm:mb-3">{cert.description}</p>
                <p className="text-sm sm:text-base text-gray-600">{cert.subtitle}</p>
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
              Partner with ARSD Construction
            </h2>
            <p className="text-lg sm:text-xl text-slate-300 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed">
              Experience the difference that 25+ years of expertise and commitment to excellence can make for your next construction project.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Link href="/contact-us">
                <Button size="lg" className="w-full sm:w-auto bg-arsd-red hover:bg-arsd-red/90 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300">
                  Contact Us Today
                  <ArrowUpRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </Link>
              <Link href="/projects">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-white text-white bg-transparent hover:bg-white hover:text-slate-900 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold transition-all duration-300">
                  View Our Projects
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