// =====================================================
// ARSD Services Data
// =====================================================
// Centralized services information for easy maintenance
// Update these values here and they will reflect across the website
// =====================================================

import { 
  Building, 
  PenTool, 
  MapPin, 
  Droplets, 
  Truck,
  Hammer,
  HardHat,
  Users,
  CheckCircle
} from "lucide-react";

export const SERVICES_DATA = {
  // Main Services
  mainServices: [
    {
      icon: "Building", // We'll use string references and map them in components
      title: "Building Construction",
      subtitle: "Complete Construction Solutions",
      description: "From residential homes to commercial complexes, we deliver exceptional construction services that stand the test of time.",
      features: [
        "Residential homes and hospitals",
        "Commercial buildings and offices",
        "Industrial facilities and warehouses",
      ],
      bgColor: "from-blue-600 to-blue-800",
      textColor: "text-blue-600"
    },
    {
      icon: "PenTool",
      title: "Design & Plan Preparation",
      subtitle: "Professional Design Services",
      description: "Our expert architects and engineers create innovative designs that meet your vision and exceed industry standards.",
      features: [
        "Architectural design and planning",
        "Structural engineering analysis",
        "Permit processing and documentation"
      ],
      bgColor: "from-purple-600 to-purple-800",
      textColor: "text-purple-600"
    },
    {
      icon: "MapPin",
      title: "Land Development",
      subtitle: "Infrastructure Development",
      description: "Transform raw land into developed properties with our comprehensive land development and infrastructure services.",
      features: [
        "Site surveying and analysis",
        "Earthworks and excavation",
        "Road construction and paving",
      ],
      bgColor: "from-green-600 to-green-800",
      textColor: "text-green-600"
    },
    {
      icon: "Droplets",
      title: "Waterproofing",
      subtitle: "Protection Solutions",
      description: "Expert waterproofing solutions to protect your structures from water damage and ensure long-term durability.",
      features: [
        "Roof waterproofing systems",
        "Basement and foundation waterproofing",
        "Waterproofing maintenance and repair"
      ],
      bgColor: "from-cyan-600 to-cyan-800",
      textColor: "text-cyan-600"
    },
    {
      icon: "Truck",
      title: "Supply Aggregates",
      subtitle: "Material Supply & Logistics",
      description: "Quality construction materials and aggregates delivered to your project site with reliable logistics and competitive pricing.",
      features: [
        "Sand and gravel supply",
        "Concrete aggregates",
        "Crushed stone materials",
      ],
      bgColor: "from-orange-600 to-orange-800",
      textColor: "text-orange-600"
    }
  ],

  // Work Process Steps
  workProcess: [
    {
      step: "01",
      title: "Consultation",
      description: "Initial meeting to understand your requirements and vision",
      icon: "Users"
    },
    {
      step: "02",
      title: "Design & Planning",
      description: "Detailed architectural plans and project timeline development",
      icon: "PenTool"
    },
    {
      step: "03",
      title: "Construction",
      description: "Professional execution with regular progress updates",
      icon: "Hammer"
    },
    {
      step: "04",
      title: "Completion",
      description: "Final inspection, handover, and ongoing support",
      icon: "CheckCircle"
    }
  ],

  // Equipment & Fleet Overview
  equipmentOverview: [
    {
      title: "Heavy Equipment",
      icon: "Hammer",
      points: [
        "Excavators, loaders, bulldozers, road rollers",
        "Concrete batching and crushing plants",
        "Cranes and material handling equipment",
      ],
    },
    {
      title: "Transport Fleet",
      icon: "Truck",
      points: [
        "6W/10W dump trucks and tipper trucks",
        "Transit mixers and boom trucks",
        "Service and self-loading trucks",
      ],
    },
    {
      title: "Tools & Support",
      icon: "HardHat",
      points: [
        "Generators, compactors, welding and cutting tools",
        "Power tools and site instruments",
        "IT equipment for digital project delivery",
      ],
    },
  ],
} as const;

// Helper function to get icon component by name
export const getServiceIcon = (iconName: string, className: string = "w-16 h-16 text-white") => {
  const icons: Record<string, any> = {
    Building,
    PenTool,
    MapPin,
    Droplets,
    Truck,
    Hammer,
    HardHat,
    Users,
    CheckCircle
  };
  
  const IconComponent = icons[iconName];
  return IconComponent ? IconComponent : Building;
};

