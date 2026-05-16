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
      description: "ARSD builds residential homes, commercial buildings, hospitals, and industrial facilities throughout Iloilo and Western Visayas. As a PCAB Category A contractor, we deliver projects from foundation through final handover, including structural concrete, masonry, finishes, and MEP coordination.",
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
      description: "ARSD's in-house architects and engineers prepare architectural and structural drawings for residential, commercial, and industrial projects in the Philippines. We handle building permit documentation for Iloilo City and surrounding municipalities, plus structural analysis aligned with the National Structural Code of the Philippines (NSCP).",
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
      description: "ARSD develops raw land parcels into ready-to-build sites across Western Visayas. Services include site surveying, clearing and grubbing, mass earthworks, road construction and paving, drainage installation, and underground utility lines for water, power, and telecommunications.",
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
      description: "ARSD installs waterproofing systems for roof decks, basements, foundations, retaining walls, and water tanks. We use liquid-applied membranes, cementitious coatings, and sheet membrane systems for residential, commercial, and industrial structures in Iloilo and across the Philippines.",
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
      description: "ARSD supplies sand, gravel, crushed stone, and concrete aggregates to construction projects in Iloilo and surrounding areas. Materials are delivered by our own transport fleet (6-wheel and 10-wheel dump trucks, tipper trucks, and transit mixers) directly to job sites.",
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
      description: "On-site or office consultation in Iloilo City to scope the project, walk the site, and clarify budget and timeline requirements.",
      icon: "Users"
    },
    {
      step: "02",
      title: "Design & Planning",
      description: "Architectural and structural plans prepared by licensed professionals, paired with a detailed Gantt-chart schedule and bill of materials for client approval before contract signing.",
      icon: "PenTool"
    },
    {
      step: "03",
      title: "Construction",
      description: "On-site construction by ARSD field crews and equipment, with weekly progress reports, milestone-based billing, and a dedicated project manager assigned per site.",
      icon: "Hammer"
    },
    {
      step: "04",
      title: "Completion",
      description: "Joint final inspection with the client, punch-list resolution, formal handover with as-built drawings, and a defects-liability period covering the agreed warranty term.",
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

