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
      "ARSD Construction was founded with courage, honesty and dedication as it was started with a humble beginning in 1998. At first it was just labor contracting; after a year, a small seed capital was introduced and coupled with determination and dedication straight contract was ventured.",
      "As a new player, tough and rough situations molded and strengthened ARSD to its existence. While maintaining its good reputation to clients and suppliers; to date, those networks keep the company growing strong that by August 2007 the founder decided to register the company with the Securities & Exchange Commission (SEC) to increase clients' confidence and to upgrade its offered services.",
      "ARSD believes that maintaining clients are doing quality works coupled with approachable staffs and promptness in all its actions."
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
  mission: "We aim to implement a timeless relationship with our clients based on simply doing the job right at the first time. To fulfill the mission, all employees will be treated fairly and involve them in quality improvement process to insure efficient work execution by us, and for the customers. To safely deliver any project, any time, in any environment for the benefit of our customers, shareholders, employees and the communities we serve.",

  // Vision Statement
  vision: "We persevere to deliver with utmost superiority, dependability, and promptly to achieve total customer satisfaction. Hand in hand with our clients, we act and win as a team.",

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
      title: "PCAB's License",
      description: "Upgraded to PCAB Category A license this 2023, enabling us to handle larger and more complex projects.",
    },
    {
      year: "2025",
      title: "25+ Years Strong",
      description: "Celebrating over 25 years of excellence with 500+ completed projects and continued growth.",
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

