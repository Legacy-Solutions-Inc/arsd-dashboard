import DashboardNavbar from "@/components/dashboard-navbar";
import { redirect } from "next/navigation";
import { createClient } from "../../../supabase/server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProjectOverview } from "./sections/ProjectOverview";
import { ScheduleTasks } from "./sections/ScheduleTasks";
import { CostAnalysis } from "./sections/CostAnalysis";
import { Materials } from "./sections/Materials";
import { Button } from "@/components/ui/button";
import {
  Download,
  Filter,
} from "lucide-react";
import dynamic from "next/dynamic";
const DashboardCharts = dynamic(() => import("@/components/dashboard-charts"), { ssr: false });

export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

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

  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-6">
          {/* Project Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold">Project Dashboard</h1>
                <Select defaultValue={projectData.projectId}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2134.00">Project 2134.00</SelectItem>
                    <SelectItem value="2135.00">Project 2135.00</SelectItem>
                    <SelectItem value="2136.00">Project 2136.00</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            {/* Key Metrics Cards for each Project*/}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
              <Card className="border-l-4 border-l-arsd-red">
                <CardContent className="p-4">
                  <div className="text-sm text-gray-600">Contract Amount</div>
                  <div className="text-lg font-bold text-arsd-red">
                    ₱{projectData.contractAmount.toLocaleString()}.00
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-4">
                  <div className="text-sm text-gray-600">Actual %</div>
                  <div className="text-lg font-bold text-green-600">
                    {projectData.actualProgress}%
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-yellow-500">
                <CardContent className="p-4">
                  <div className="text-sm text-gray-600">Target %</div>
                  <div className="text-lg font-bold text-yellow-600">
                    {projectData.targetProgress}%
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-red-500">
                <CardContent className="p-4">
                  <div className="text-sm text-gray-600">Slippage</div>
                  <div className="text-lg font-bold text-red-600">
                    {projectData.slippage}%
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="text-sm text-gray-600">Balance</div>
                  <div className="text-lg font-bold text-blue-600">
                    ₱{projectData.balance.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-orange-500">
                <CardContent className="p-4">
                  <div className="text-sm text-gray-600">Collectible</div>
                  <div className="text-lg font-bold text-orange-600">
                    ₱{projectData.collectible.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Project Overview</TabsTrigger>
              <TabsTrigger value="schedule">Schedule & Tasks</TabsTrigger>
              <TabsTrigger value="costs">Cost Analysis</TabsTrigger>
              <TabsTrigger value="materials">Materials</TabsTrigger>
            </TabsList>

            {/* Project Profile Tab */}
            <TabsContent value="overview" className="space-y-6">
                <ProjectOverview projectData={projectData} costData={costData} />
            </TabsContent>

            {/* Schedule & Tasks Tab */}
            <TabsContent value="schedule" className="space-y-6">
                <ScheduleTasks tasks={tasks} />
            </TabsContent>

            {/* Cost Analysis Tab */}
            <TabsContent value="costs" className="space-y-6">
                <CostAnalysis costData={costData} projectData={projectData} />
            </TabsContent>

            {/* Materials Tab */}
            <TabsContent value="materials" className="space-y-6">
                <Materials materials={materials} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  );
}
