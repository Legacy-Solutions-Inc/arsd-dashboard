"use client";
import { ProjectOverview } from "./sections/ProjectOverview";
import ProjectList from "./sections/ProjectList";
import { useRouter } from "next/navigation";

  // Mock data for demonstration
  const projectData = {
    projectId: "2134.00",
    contractAmount: 2000000,
    actualProgress: 10.0,
    targetProgress: 20.0,
    slippage: 10.0,
    balance: 6423825.64,
    collectible: -43105.91,
    savings: -2711018.45,
    client: "ABC Construction Corp",
    contractor: "XYZ Builders Inc",
    location: "Metro Manila, Philippines",
    plannedStart: "2024-01-01",
    plannedEnd: "2024-12-31",
    actualStart: "2024-01-15",
    pmName: "John Doe",
    siteEngineer: "Jane Smith",
  };

  const projects = [
    {
      id: "2134.00",
      name: "Main Office Construction",
      client: "ABC Construction Corp",
      location: "Metro Manila, Philippines",
      status: "active",
    },
    {
      id: "2135.00",
      name: "Warehouse Expansion",
      client: "DEF Holdings",
      location: "Cebu City, Philippines",
      status: "active",
    },
    {
      id: "2136.00",
      name: "Retail Store Renovation",
      client: "GHI Retailers",
      location: "Davao City, Philippines",
      status: "completed",
    },
  ];

  const tasks = [
    {
      id: 1,
      name: "Mobilization and Demobilization",
      progress: 100,
      weight: 5,
      cost: 100000,
      startDate: "2024-01-01",
      endDate: "2024-01-15",
      status: "completed",
    },
    {
      id: 2,
      name: "Bonds/Permits",
      progress: 80,
      weight: 3,
      cost: 50000,
      startDate: "2024-01-01",
      endDate: "2024-01-30",
      status: "in-progress",
    },
    {
      id: 3,
      name: "Site Layout, Scaling and Layout",
      progress: 60,
      weight: 8,
      cost: 150000,
      startDate: "2024-01-15",
      endDate: "2024-02-15",
      status: "in-progress",
    },
    {
      id: 4,
      name: "Earthworks - Excavation",
      progress: 30,
      weight: 15,
      cost: 300000,
      startDate: "2024-02-01",
      endDate: "2024-03-15",
      status: "in-progress",
    },
    {
      id: 5,
      name: "Earthworks - Backfill",
      progress: 0,
      weight: 12,
      cost: 240000,
      startDate: "2024-03-01",
      endDate: "2024-04-15",
      status: "pending",
    },
    {
      id: 6,
      name: "Gravel Bedding",
      progress: 0,
      weight: 8,
      cost: 160000,
      startDate: "2024-03-15",
      endDate: "2024-04-30",
      status: "pending",
    },
    {
      id: 7,
      name: "Soil Poisoning",
      progress: 0,
      weight: 5,
      cost: 100000,
      startDate: "2024-04-01",
      endDate: "2024-04-15",
      status: "pending",
    },
    {
      id: 8,
      name: "Embankment from Borrow",
      progress: 0,
      weight: 20,
      cost: 400000,
      startDate: "2024-04-15",
      endDate: "2024-06-30",
      status: "pending",
    },
  ];

  const materials = [
    { name: "1/2 Ordinary Plywood", unit: "pcs", requested: 100, received: 85 },
    { name: '14" Cutting Disc', unit: "pcs", requested: 50, received: 50 },
    { name: '16" Cutting Disc', unit: "pcs", requested: 30, received: 25 },
    { name: '2 1/2" C-WN', unit: "box", requested: 20, received: 18 },
    { name: '2" GI Pipe Sched...', unit: "cu.m", requested: 15, received: 12 },
    { name: "2.5x6x13 Welding...", unit: "kg", requested: 200, received: 180 },
    { name: "200L Blue Drum", unit: "meters", requested: 50, received: 45 },
    { name: "2x3x10 Coco Lum...", unit: "rolls", requested: 25, received: 20 },
  ];

  const costData = [
    {
      month: "Jan",
      target: 200000,
      swa: 180000,
      billed: 150000,
      direct: 140000,
    },
    {
      month: "Feb",
      target: 300000,
      swa: 320000,
      billed: 280000,
      direct: 260000,
    },
    {
      month: "Mar",
      target: 400000,
      swa: 380000,
      billed: 350000,
      direct: 340000,
    },
    {
      month: "Apr",
      target: 350000,
      swa: 360000,
      billed: 330000,
      direct: 320000,
    },
    {
      month: "May",
      target: 450000,
      swa: 420000,
      billed: 400000,
      direct: 390000,
    },
  ];

export default function DashboardPage() {
  const router = useRouter();
  const handleSelectProject = (projectId: string) => {
    router.push(`/dashboard/projects/${projectId}`);
  };
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold mb-4">Project Overview</h1>
      {/* Summary Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <ProjectOverview projectData={projectData} costData={costData} />
      </div>
      {/* Project List Section */}
      <ProjectList projects={projects} onSelect={handleSelectProject} />
    </div>
  );
}
