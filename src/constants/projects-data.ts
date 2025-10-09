// =====================================================
// ARSD Projects Data
// =====================================================
// Centralized projects information for easy maintenance
// Update these values here and they will reflect across the website
// =====================================================

export const PROJECTS_DATA = {
  // Project Stats/Achievements
  stats: [
    {
      number: "500+",
      label: "Projects Completed",
      icon: "BarChart3"
    },
    {
      number: "25+",
      label: "Years Experience",
      icon: "Clock"
    },
    {
      number: "100+",
      label: "Satisfied Clients",
      icon: "Users"
    },
  ],

  // Project Delivery Process
  deliveryProcess: [
    {
      step: "01",
      title: "Planning & Design",
      description: "Comprehensive project analysis and architectural design development",
      icon: "Building2"
    },
    {
      step: "02",
      title: "Permits & Approvals",
      description: "Securing all necessary permits and regulatory approvals",
      icon: "CheckCircle"
    },
    {
      step: "03",
      title: "Construction",
      description: "Professional execution with regular progress updates and quality control",
      icon: "Award"
    },
    {
      step: "04",
      title: "Handover",
      description: "Final inspection, documentation, and project handover with ongoing support",
      icon: "Star"
    },
  ],

  // Sample/Demo Projects (for when database is empty or as fallback)
  sampleProjects: [
    {
      id: "1",
      name: "Lambunao Municipal Building",
      location: "Lambunao, Iloilo",
      created_at: "2024-01-15",
      photoUrls: ["/images/reference1.png", "/images/reference2.png", "/images/reference3.png"],
      status: "Completed",
      type: "Government Building",
      value: "₱15M"
    },
    {
      id: "2",
      name: "Iloilo Hospital Phase 2",
      location: "Iloilo City, Philippines",
      created_at: "2024-02-20",
      photoUrls: ["/images/reference2.png", "/images/reference1.png"],
      status: "In Progress",
      type: "Healthcare Facility",
      value: "₱45M"
    },
    {
      id: "3",
      name: "Iloilo Correctional Facility",
      location: "Iloilo City, Philippines",
      created_at: "2024-03-10",
      photoUrls: ["/images/reference3.png", "/images/reference1.png"],
      status: "Completed",
      type: "Infrastructure",
      value: "₱28M"
    }
  ],

  // Page Content
  hero: {
    title: "Construction Projects",
    subtitle: "That Inspire",
    description: "Discover our latest construction achievements across the Philippines. Each project represents our commitment to excellence and innovation."
  },

  ctaSection: {
    title: "Ready to Build Your Dream Project?",
    description: "Join our satisfied clients and let us bring your construction vision to life with our proven expertise and commitment to excellence.",
    primaryButtonText: "Start Your Project",
    secondaryButtonText: "View Our Services"
  }
} as const;

