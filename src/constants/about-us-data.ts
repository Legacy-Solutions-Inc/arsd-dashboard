// =====================================================
// ARSD About Us Data
// =====================================================
// Centralized company information for easy maintenance
// Update these values here and they will reflect across the website
// =====================================================

export const ABOUT_US_DATA = {
  // Company Story
  story: {
    paragraphs: [
      "ARSD Construction was founded in 1998 in Iloilo City, Philippines. The company began as a labor contracting outfit, taking on its first straight-contract projects within a year as small seed capital allowed it to bid for its own work directly.",
      "By August 2007, ARSD had grown enough to formalize as a corporation, registering with the Securities and Exchange Commission (SEC No. CS 2007 28366) to expand its service offering and qualify for larger commercial and government contracts.",
      "ARSD now operates as a PCAB Category A licensed general contractor (License No. 36037) and a PhilGEPS-registered supplier (Cert. 2010-63063), serving residential, commercial, industrial, and government clients across Western Visayas with a focus on quality workmanship, on-time delivery, and direct client communication."
    ]
  },

  // Achievements/Stats
  achievements: [
    { 
      number: "25+", 
      label: "Years of Experience" 
    },
    { 
      number: "500+", 
      label: "Projects Completed" 
    },
    { 
      number: "100+", 
      label: "Satisfied Clients" 
    },
  ],

  // Mission Statement
  mission: "ARSD Construction Corporation's mission is to deliver construction projects right the first time — safely, on schedule, and to specification — for clients in Iloilo, Western Visayas, and across the Philippines. We invest in fair treatment of our employees and a continuous quality-improvement process to support efficient project execution for our customers, shareholders, employees, and the communities we serve.",

  // Vision Statement
  vision: "ARSD's vision is to be the most dependable and responsive general contractor in Western Visayas — delivering projects with superior workmanship, predictable schedules, and close partnership with each client from kick-off through warranty.",

  // Company Timeline/Milestones
  milestones: [
    {
      year: "1998",
      title: "Company Founded",
      description: "ARSD Construction was founded with courage, honesty and dedication, starting with humble beginnings in labor contracting.",
    },
    {
      year: "1999",
      title: "First Expansion",
      description: "Introduced seed capital and ventured into straight contract work, coupled with determination and dedication.",
    },
    {
      year: "2007",
      title: "SEC Registration",
      description: "Registered with the Securities & Exchange Commission (SEC) to increase clients' confidence and upgrade services.",
    },
    {
      year: "2010",
      title: "PhilGEPS Certification",
      description: "Achieved PhilGEPS certification for government electronic procurement system participation.",
    },
    {
      year: "2012",
      title: "PCAB Category A License",
      description: "Earned PCAB Category A License No. 36037 from the Philippine Contractors Accreditation Board, qualifying ARSD for large-scale general construction contracts in the Philippines.",
    },
    {
      year: "2025",
      title: "500+ Projects Milestone",
      description: "Surpassed 500 completed construction projects across Western Visayas — spanning residential, commercial, industrial, and government work over 25+ years in business.",
    },
  ],

  // Certifications & Recognition
  certifications: [
    {
      title: "SEC No.",
      description: "CS 2007 28366",
      subtitle: "Securities & Exchange Commission Registration"
    },
    {
      title: "PCAB License No.",
      description: "36037",
      // TODO: verify PCAB renewal status with operator before publish — date shows Aug 22, 2025 but current is 2026-05-16, may be lapsed or renewed
      subtitle: "Valid until August 22, 2025 • Category A"
    },
    {
      title: "PhilGEPS Certificate No.",
      description: "2010-63063",
      subtitle: "Philippine Government Electronic Procurement System"
    },
  ],

  // Core Values (optional - can be added if needed)
  coreValues: [
    {
      title: "Integrity",
      description: "We conduct business with honesty and transparency",
      icon: "Shield"
    },
    {
      title: "Excellence",
      description: "We strive for the highest quality in everything we do",
      icon: "Award"
    },
    {
      title: "Commitment",
      description: "We are dedicated to meeting our clients' needs and deadlines",
      icon: "Heart"
    },
    {
      title: "Innovation",
      description: "We embrace new technologies and methods to improve our services",
      icon: "Lightbulb"
    }
  ],
} as const;

export const CREDENTIALS = {
  pcab: 'PCAB Category A · No. 36037',
  sec: 'SEC Reg. CS 2007 28366',
  philgeps: 'PhilGEPS Cert. 2010-63063',
} as const;

