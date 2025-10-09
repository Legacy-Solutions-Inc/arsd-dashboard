"use client";

import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
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
import { CONTACT_INFO } from "@/constants/contact-info";

export default function Contact() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [budget, setBudget] = useState("");
  const [timeline, setTimeline] = useState("");
  const [message, setMessage] = useState("");
  // Contact information data
  const contactInfo: ContactInfo[] = [
    {
      icon: <MapPin className="w-6 h-6 text-arsd-red" />,
      title: "Our Location",
      details: [
        CONTACT_INFO.address.street,
        CONTACT_INFO.address.city,
        `${CONTACT_INFO.address.country} ${CONTACT_INFO.address.postalCode}`,
      ],
    },
    {
      icon: <Phone className="w-6 h-6 text-arsd-red" />,
      title: "Phone Numbers",
      details: [
        CONTACT_INFO.phone.landline,
        CONTACT_INFO.phone.mobile1,
        `Landline: ${CONTACT_INFO.phone.landlineFormatted}`,
      ],
    },
    {
      icon: <Mail className="w-6 h-6 text-arsd-red" />,
      title: "Email Address",
      details: [
        CONTACT_INFO.email.display,
      ],
    },
    {
      icon: <Clock className="w-6 h-6 text-arsd-red" />,
      title: "Business Hours",
      details: [
        CONTACT_INFO.businessHours.weekdays,
        CONTACT_INFO.businessHours.saturday,
        CONTACT_INFO.businessHours.sunday,
      ],
    },
  ];

  const services = [
    "Building Construction",
    "Design & Plan Preparation",
    "Land Development",
    "Waterproofing",
    "Supply Aggregates",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = `New inquiry from ${firstName} ${lastName}`;
    const body = `Name: ${firstName} ${lastName}%0D%0AEmail: ${email}%0D%0APhone: ${phone}%0D%0ACompany: ${company}%0D%0ABudget: ${budget}%0D%0ATimeline: ${timeline}%0D%0A%0D%0ADetails:%0D%0A${encodeURIComponent(message)}`;
    const mailto = `mailto:${CONTACT_INFO.email.primary}?subject=${encodeURIComponent(subject)}&body=${body}`;
    window.location.href = mailto;
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-arsd-red via-red-600 to-red-700" />
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white_2px,transparent_2px)] bg-[length:24px_24px]" />
        <div className="container mx-auto px-4 py-16 sm:py-20 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-semibold mb-6 border border-white/30">
              <Building className="h-4 w-4" />
              Get in Touch
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">Contact ARSD Construction</h1>
            <p className="text-lg sm:text-xl text-red-100 mb-8 max-w-5xl mx-auto">
              Ready to start your construction project? Our team will respond within 24 hours.
            </p>
            <div className="flex justify-center">
              <Image
                src="/images/arsd-logo.png"
                alt="ARSD Construction Corporation"
                width={84}
                height={84}
                className="rounded-full bg-white/90 p-2 shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Get in Touch
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We're here to help with all your construction needs. Reach out to
              us through any of the following channels.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {/* Location */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5 sm:p-6 text-center">
              <div className="w-10 h-10 rounded-xl bg-arsd-red/10 text-arsd-red flex items-center justify-center mx-auto mb-3">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Our Location</h3>
              <div className="text-sm text-gray-600 leading-6">
                <div>{CONTACT_INFO.address.street}</div>
                <div>{CONTACT_INFO.address.city}</div>
                <div>{CONTACT_INFO.address.country} {CONTACT_INFO.address.postalCode}</div>
              </div>
            </div>
            {/* Phone */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5 sm:p-6 text-center">
              <div className="w-10 h-10 rounded-xl bg-arsd-red/10 text-arsd-red flex items-center justify-center mx-auto mb-3">
                <Phone className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Phone Numbers</h3>
              <div className="text-sm text-gray-600 leading-6">
                <div>{CONTACT_INFO.phone.landline}</div>
                <div>{CONTACT_INFO.phone.mobile1}</div>
                <div>Landline: {CONTACT_INFO.phone.landlineFormatted}</div>
              </div>
            </div>
            {/* Email */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5 sm:p-6 text-center">
              <div className="w-10 h-10 rounded-xl bg-arsd-red/10 text-arsd-red flex items-center justify-center mx-auto mb-3">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Email Address</h3>
              <div className="text-sm text-gray-600 leading-6">
                {CONTACT_INFO.email.display}
              </div>
            </div>
            {/* Hours */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5 sm:p-6 text-center">
              <div className="w-10 h-10 rounded-xl bg-arsd-red/10 text-arsd-red flex items-center justify-center mx-auto mb-3">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Business Hours</h3>
              <div className="text-sm text-gray-600 leading-6">
                <div>{CONTACT_INFO.businessHours.weekdays}</div>
                <div>{CONTACT_INFO.businessHours.saturday}</div>
                <div>{CONTACT_INFO.businessHours.sunday}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form & Map */}
      <section className="py-16 sm:py-20 bg-white">
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

              <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      placeholder="Enter your first name"
                      className="mt-1"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      placeholder="Enter your last name"
                      className="mt-1"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
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
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      placeholder="Enter your phone number"
                      className="mt-1 mobile-form-input"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="company">Company/Organization</Label>
                  <Input
                    id="company"
                    placeholder="Enter your company name"
                    className="mt-1"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="budget">Estimated Budget</Label>
                  <select
                    id="budget"
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-arsd-red focus:border-transparent"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
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
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
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
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full bg-arsd-red hover:bg-red-700 text-white">
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
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Visit Our Office
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto px-2">
              Located in the heart of Arevalo, Iloilo City, our office is easily
              accessible and we welcome visitors during business hours.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100">
            <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 items-center">
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
                        {CONTACT_INFO.address.full}
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
                        {CONTACT_INFO.businessHours.weekdays}
                      </p>
                      <p className="text-gray-600">
                        {CONTACT_INFO.businessHours.saturday}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Facebook className="w-5 h-5 text-arsd-red mt-1" />
                    <div>
                      <p className="font-semibold text-gray-900">Follow Us:</p>
                      <Link
                        href={CONTACT_INFO.social.facebook.url}
                        target="_blank"
                        className="text-arsd-red hover:underline"
                      >
                        facebook.com/{CONTACT_INFO.social.facebook.handle}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
              <div className="rounded-lg overflow-hidden h-64">
                <iframe
                  title="ARSD Office Map"
                  className="w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={CONTACT_INFO.maps.embedUrl}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
