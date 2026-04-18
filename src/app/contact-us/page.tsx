"use client";

import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { MapPin, Phone, Mail, Clock, Send, CheckCircle } from "lucide-react";
import { FacebookIcon } from "@/components/ui/facebook-icon";
import Link from "next/link";
import { CONTACT_INFO } from "@/constants/contact-info";
import { SectionEyebrow } from "@/components/SectionEyebrow";

export default function Contact() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [budget, setBudget] = useState("");
  const [timeline, setTimeline] = useState("");
  const [message, setMessage] = useState("");

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
    <div className="min-h-[100dvh] bg-[#111111]">
      <Navbar />

      {/* Hero Section */}
      <section className="py-20 sm:py-28 bg-[#111111]">
        <div className="responsive-container">
          <SectionEyebrow className="mb-4">Get in Touch</SectionEyebrow>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl tracking-tighter text-[#f0ede8] uppercase leading-none mb-6 max-w-2xl">
            Let&apos;s Build<br />Together
          </h1>
          <p className="text-[#a09890] max-w-[55ch] leading-relaxed">
            Have a construction project in mind? Our team responds within 24 hours to discuss your requirements.
          </p>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-16 sm:py-20 bg-[#1c1c1c]">
        <div className="responsive-container">
          <SectionEyebrow className="mb-10">Contact Details</SectionEyebrow>
          <div className="grid grid-cols-2 lg:grid-cols-4 border border-[#2a2626] divide-x divide-y divide-[#2a2626]">
            {/* Location */}
            <div className="p-6 sm:p-8">
              <MapPin className="w-5 h-5 text-arsd-red mb-3" />
              <p className="text-xs uppercase tracking-widest text-[#a09890] mb-2">Location</p>
              <p className="text-sm text-[#f0ede8] leading-relaxed">
                {CONTACT_INFO.address.street}<br />
                {CONTACT_INFO.address.city}<br />
                {CONTACT_INFO.address.country} {CONTACT_INFO.address.postalCode}
              </p>
            </div>
            {/* Phone */}
            <div className="p-6 sm:p-8">
              <Phone className="w-5 h-5 text-arsd-red mb-3" />
              <p className="text-xs uppercase tracking-widest text-[#a09890] mb-2">Phone</p>
              <p className="text-sm text-[#f0ede8] leading-relaxed">
                {CONTACT_INFO.phone.landline}<br />
                {CONTACT_INFO.phone.mobile1}<br />
                Landline: {CONTACT_INFO.phone.landlineFormatted}
              </p>
            </div>
            {/* Email */}
            <div className="p-6 sm:p-8">
              <Mail className="w-5 h-5 text-arsd-red mb-3" />
              <p className="text-xs uppercase tracking-widest text-[#a09890] mb-2">Email</p>
              <p className="text-sm text-[#f0ede8]">{CONTACT_INFO.email.display}</p>
            </div>
            {/* Hours */}
            <div className="p-6 sm:p-8">
              <Clock className="w-5 h-5 text-arsd-red mb-3" />
              <p className="text-xs uppercase tracking-widest text-[#a09890] mb-2">Hours</p>
              <p className="text-sm text-[#f0ede8] leading-relaxed">
                {CONTACT_INFO.businessHours.weekdays}<br />
                {CONTACT_INFO.businessHours.saturday}<br />
                {CONTACT_INFO.businessHours.sunday}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form & What to Expect */}
      <section className="py-16 sm:py-20 bg-[#111111]">
        <div className="responsive-container">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <h2 className="font-display text-3xl sm:text-4xl tracking-tight text-[#f0ede8] uppercase mb-6">
                Send Us a Message
              </h2>
              <p className="text-[#a09890] mb-8 leading-relaxed">
                Fill out the form below and we&apos;ll get back to you within 24 hours to discuss your project requirements.
              </p>

              <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
                <p className="text-xs text-[#a09890] mb-6">Fields marked <span aria-hidden="true">*</span> are required</p>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName" className="text-[#a09890]">
                      First Name <span aria-hidden="true">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      placeholder="Enter your first name"
                      className="mt-1 bg-[#1c1c1c] border-[#2a2626] text-[#f0ede8] placeholder:text-[#a09890]"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-[#a09890]">
                      Last Name <span aria-hidden="true">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      placeholder="Enter your last name"
                      className="mt-1 bg-[#1c1c1c] border-[#2a2626] text-[#f0ede8] placeholder:text-[#a09890]"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email" className="text-[#a09890]">
                      Email Address <span aria-hidden="true">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      className="mt-1 bg-[#1c1c1c] border-[#2a2626] text-[#f0ede8] placeholder:text-[#a09890]"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-[#a09890]">Phone Number</Label>
                    <Input
                      id="phone"
                      placeholder="Enter your phone number"
                      className="mt-1 bg-[#1c1c1c] border-[#2a2626] text-[#f0ede8] placeholder:text-[#a09890]"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="company" className="text-[#a09890]">Company/Organization</Label>
                  <Input
                    id="company"
                    placeholder="Enter your company name"
                    className="mt-1 bg-[#1c1c1c] border-[#2a2626] text-[#f0ede8] placeholder:text-[#a09890]"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  />
                </div>

                {/* Budget */}
                <div>
                  <Label htmlFor="budget" className="text-[#a09890]">Estimated Budget</Label>
                  <Select value={budget} onValueChange={setBudget}>
                    <SelectTrigger className="mt-1 bg-[#1c1c1c] border-[#2a2626] text-[#f0ede8]">
                      <SelectValue placeholder="Select budget range" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1c1c1c] border-[#2a2626]">
                      <SelectItem value="under-1m" className="text-[#f0ede8]">Under ₱1 Million</SelectItem>
                      <SelectItem value="1m-5m" className="text-[#f0ede8]">₱1M - ₱5M</SelectItem>
                      <SelectItem value="5m-10m" className="text-[#f0ede8]">₱5M - ₱10M</SelectItem>
                      <SelectItem value="10m-50m" className="text-[#f0ede8]">₱10M - ₱50M</SelectItem>
                      <SelectItem value="over-50m" className="text-[#f0ede8]">Over ₱50M</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Timeline */}
                <div>
                  <Label htmlFor="timeline" className="text-[#a09890]">Project Timeline</Label>
                  <Select value={timeline} onValueChange={setTimeline}>
                    <SelectTrigger className="mt-1 bg-[#1c1c1c] border-[#2a2626] text-[#f0ede8]">
                      <SelectValue placeholder="Select timeline" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1c1c1c] border-[#2a2626]">
                      <SelectItem value="asap" className="text-[#f0ede8]">As soon as possible</SelectItem>
                      <SelectItem value="1-3months" className="text-[#f0ede8]">1-3 months</SelectItem>
                      <SelectItem value="3-6months" className="text-[#f0ede8]">3-6 months</SelectItem>
                      <SelectItem value="6-12months" className="text-[#f0ede8]">6-12 months</SelectItem>
                      <SelectItem value="over-1year" className="text-[#f0ede8]">Over 1 year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="message" className="text-[#a09890]">
                    Project Details <span aria-hidden="true">*</span>
                  </Label>
                  <Textarea
                    id="message"
                    placeholder="Please describe your project requirements, location, and any specific needs..."
                    className="mt-1 min-h-[120px] bg-[#1c1c1c] border-[#2a2626] text-[#f0ede8] placeholder:text-[#a09890]"
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
            <div className="space-y-10">
              {/* What to Expect */}
              <div>
                <h3 className="font-display text-xl text-[#f0ede8] uppercase tracking-tight mb-6">What to Expect</h3>
                <div className="space-y-6">
                  {[
                    { step: "01", title: "Initial Response", desc: "We'll respond within 24 hours" },
                    { step: "02", title: "Consultation", desc: "Free consultation to discuss your needs" },
                    { step: "03", title: "Proposal", desc: "Detailed project proposal and timeline" },
                  ].map(({ step, title, desc }) => (
                    <div key={step} className="flex items-start gap-4">
                      <span className="font-display text-2xl text-arsd-red/40 leading-none flex-shrink-0 w-10">{step}</span>
                      <div>
                        <h4 className="font-display text-base text-[#f0ede8] uppercase tracking-tight">{title}</h4>
                        <p className="text-sm text-[#a09890] mt-0.5">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Our Services */}
              <div>
                <h3 className="font-display text-xl text-[#f0ede8] uppercase tracking-tight mb-6">Our Services</h3>
                <ul className="space-y-2">
                  {services.map((service, index) => (
                    <li key={index} className="flex items-center gap-3 text-sm text-[#a09890]">
                      <span aria-hidden="true" className="text-arsd-red">—</span>
                      {service}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-16 sm:py-20 bg-[#1c1c1c]">
        <div className="responsive-container">
          <SectionEyebrow className="mb-4">Find Us</SectionEyebrow>
          <h2 className="font-display text-3xl sm:text-4xl tracking-tight text-[#f0ede8] uppercase mb-10">
            Visit Our Office
          </h2>
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-arsd-red mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs uppercase tracking-widest text-[#a09890] mb-1">Address</p>
                  <p className="text-sm text-[#f0ede8]">{CONTACT_INFO.address.full}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-arsd-red mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs uppercase tracking-widest text-[#a09890] mb-1">Office Hours</p>
                  <p className="text-sm text-[#f0ede8]">{CONTACT_INFO.businessHours.weekdays}</p>
                  <p className="text-sm text-[#f0ede8]">{CONTACT_INFO.businessHours.saturday}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FacebookIcon className="w-5 h-5 text-arsd-red mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs uppercase tracking-widest text-[#a09890] mb-1">Follow Us</p>
                  <Link
                    href={CONTACT_INFO.social.facebook.url}
                    target="_blank"
                    className="text-sm text-arsd-red hover:text-red-400 transition-colors"
                  >
                    facebook.com/{CONTACT_INFO.social.facebook.handle}
                  </Link>
                </div>
              </div>
            </div>
            <div className="rounded-lg overflow-hidden h-64 border border-[#2a2626]">
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
      </section>

      <Footer />
    </div>
  );
}
