import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Facebook,
  Send,
  Building,
  MessageSquare,
  Calendar,
  CheckCircle,
} from "lucide-react";
import { ContactInfoCard, ContactInfo } from "@/components/ContactInfoCard";
import Link from "next/link";
import Image from "next/image";

export default function Contact() {
  // Contact information data
  const contactInfo: ContactInfo[] = [
    {
      icon: <MapPin className="w-6 h-6 text-arsd-red" />,
      title: "Our Location",
      details: [
        "Figueroa St. Bonifacio",
        "Arevalo, Iloilo City",
        "Philippines 5000",
      ],
    },
    {
      icon: <Phone className="w-6 h-6 text-arsd-red" />,
      title: "Phone Numbers",
      details: [
        "+63 33 123 4567",
        "+63 917 123 4567",
        "Landline: (033) 123-4567",
      ],
    },
    {
      icon: <Mail className="w-6 h-6 text-arsd-red" />,
      title: "Email Address",
      details: [
        "hr_arsd_iloilo@yahoo.com.ph",
        "info@arsdconstruction.com",
        "projects@arsdconstruction.com",
      ],
    },
    {
      icon: <Clock className="w-6 h-6 text-arsd-red" />,
      title: "Business Hours",
      details: [
        "Monday - Friday: 8:00 AM - 5:00 PM",
        "Saturday: 8:00 AM - 12:00 PM",
        "Sunday: Closed",
      ],
    },
  ];

  const services = [
    "Building Construction",
    "Design & Plan Preparation",
    "Land Development",
    "Project Management",
    "Renovation & Remodeling",
    "Infrastructure Development",
  ];

  const projectTypes = [
    "Residential Construction",
    "Commercial Buildings",
    "Industrial Facilities",
    "Infrastructure Projects",
    "Renovation Projects",
    "Other",
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-arsd-red to-red-700 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Contact ARSD Construction
            </h1>
            <p className="text-xl text-red-100 mb-8">
              Ready to start your construction project? Get in touch with our
              expert team for a free consultation and quote.
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

      {/* Contact Information */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Get in Touch
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We're here to help with all your construction needs. Reach out to
              us through any of the following channels.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {contactInfo.map((info, index) => (
              <ContactInfoCard key={index} info={info} />
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form & Map */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Send Us a Message
              </h2>
              <p className="text-gray-600 mb-8">
                Fill out the form below and we'll get back to you within 24
                hours to discuss your project requirements.
              </p>

              <form className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      placeholder="Enter your first name"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      placeholder="Enter your last name"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      className="mt-1 mobile-form-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      placeholder="Enter your phone number"
                      className="mt-1 mobile-form-input"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="company">Company/Organization</Label>
                  <Input
                    id="company"
                    placeholder="Enter your company name"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="projectType">Project Type *</Label>
                  <select
                    id="projectType"
                    className="w-full mt-1 px-3 py-3 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-arsd-red focus:border-transparent text-base sm:text-sm"
                  >
                    <option value="">Select project type</option>
                    {projectTypes.map((type, index) => (
                      <option key={index} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="budget">Estimated Budget</Label>
                  <select
                    id="budget"
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-arsd-red focus:border-transparent"
                  >
                    <option value="">Select budget range</option>
                    <option value="under-1m">Under ₱1 Million</option>
                    <option value="1m-5m">₱1M - ₱5M</option>
                    <option value="5m-10m">₱5M - ₱10M</option>
                    <option value="10m-50m">₱10M - ₱50M</option>
                    <option value="over-50m">Over ₱50M</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="timeline">Project Timeline</Label>
                  <select
                    id="timeline"
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-arsd-red focus:border-transparent"
                  >
                    <option value="">Select timeline</option>
                    <option value="asap">As soon as possible</option>
                    <option value="1-3months">1-3 months</option>
                    <option value="3-6months">3-6 months</option>
                    <option value="6-12months">6-12 months</option>
                    <option value="over-1year">Over 1 year</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="message">Project Details *</Label>
                  <Textarea
                    id="message"
                    placeholder="Please describe your project requirements, location, and any specific needs..."
                    className="mt-1 min-h-[120px]"
                  />
                </div>

                <Button className="w-full bg-arsd-red hover:bg-red-700 text-white">
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </form>
            </div>

            {/* Additional Information */}
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Building className="w-6 h-6 text-arsd-red" />
                    Our Services
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {services.map((service, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-gray-700">{service}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <MessageSquare className="w-6 h-6 text-arsd-red" />
                    What to Expect
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-arsd-red text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                        1
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          Initial Response
                        </h4>
                        <p className="text-gray-600 text-sm">
                          We'll respond to your inquiry within 24 hours
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-arsd-red text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                        2
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          Consultation
                        </h4>
                        <p className="text-gray-600 text-sm">
                          Free consultation to discuss your project needs
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-arsd-red text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                        3
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          Proposal
                        </h4>
                        <p className="text-gray-600 text-sm">
                          Detailed project proposal and timeline
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Calendar className="w-6 h-6 text-arsd-red" />
                    Schedule a Visit
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Prefer to meet in person? Visit our office or schedule a
                    site visit for your project.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full border-arsd-red text-arsd-red hover:bg-arsd-red hover:text-white"
                  >
                    Schedule Appointment
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Visit Our Office
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Located in the heart of Arevalo, Iloilo City, our office is easily
              accessible and we welcome visitors during business hours.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  ARSD Construction Corporation
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-arsd-red mt-1" />
                    <div>
                      <p className="font-semibold text-gray-900">Address:</p>
                      <p className="text-gray-600">
                        Figueroa St. Bonifacio, Arevalo, Iloilo City,
                        Philippines 5000
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-arsd-red mt-1" />
                    <div>
                      <p className="font-semibold text-gray-900">
                        Office Hours:
                      </p>
                      <p className="text-gray-600">
                        Monday - Friday: 8:00 AM - 5:00 PM
                      </p>
                      <p className="text-gray-600">
                        Saturday: 8:00 AM - 12:00 PM
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Facebook className="w-5 h-5 text-arsd-red mt-1" />
                    <div>
                      <p className="font-semibold text-gray-900">Follow Us:</p>
                      <Link
                        href="https://www.facebook.com/ARSDConCorp"
                        target="_blank"
                        className="text-arsd-red hover:underline"
                      >
                        facebook.com/ARSDConCorp
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-200 rounded-lg h-64 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <MapPin className="w-12 h-12 mx-auto mb-2" />
                  <p>Interactive Map</p>
                  <p className="text-sm">
                    Figueroa St. Bonifacio, Arevalo, Iloilo City
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
