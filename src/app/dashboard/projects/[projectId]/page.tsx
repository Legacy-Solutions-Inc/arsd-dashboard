"use client";
interface Material {
  name: string;
  unit: string;
  requested: number;
  received: number;
}

interface CostMonth {
  month: string;
  target: number;
  swa: number;
  billed: number;
  direct: number;
}

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { ProjectOverview } from "../../sections/ProjectOverview";
import { ScheduleTasks } from "../../sections/ScheduleTasks";
import { CostAnalysis } from "../../sections/CostAnalysis";
import { Materials } from "../../sections/Materials";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { projects } from "../../data/projectsData";

export default function ProjectProfilePage() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const project = useMemo(() => {
    return projects.find((p: any) => p.id === projectId);
  }, [projectId]);

  if (!project) {
    return <div className="container mx-auto px-4 py-6">Project not found.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Project Dashboard</h1>
          <div>
            <select className="border rounded px-3 py-2 text-lg font-medium">
              <option value={projectId}>Project {projectId}</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <div className="border-l-4 border-l-arsd-red bg-white rounded shadow p-4">
            <div className="text-sm text-gray-600">Contract Amount</div>
            <div className="text-lg font-bold text-arsd-red">₱{project.overview.contractAmount.toLocaleString()}.00</div>
          </div>
          <div className="border-l-4 border-l-arsd-red bg-white rounded shadow p-4">
            <div className="text-sm text-gray-600">Actual %</div>
            <div className="text-lg font-bold text-arsd-red">{project.overview.actualProgress}%</div>
          </div>
          <div className="border-l-4 border-l-arsd-red bg-white rounded shadow p-4">
            <div className="text-sm text-gray-600">Target %</div>
            <div className="text-lg font-bold text-arsd-red">{project.overview.targetProgress}%</div>
          </div>
          <div className="border-l-4 border-l-arsd-red bg-white rounded shadow p-4">
            <div className="text-sm text-gray-600">Slippage</div>
            <div className="text-lg font-bold text-arsd-red">{project.overview.slippage}%</div>
          </div>
          <div className="border-l-4 border-l-arsd-red bg-white rounded shadow p-4">
            <div className="text-sm text-gray-600">Balance</div>
            <div className="text-lg font-bold text-arsd-red">₱{project.overview.balance.toLocaleString()}</div>
          </div>
          <div className="border-l-4 border-l-arsd-red bg-white rounded shadow p-4">
            <div className="text-sm text-gray-600">Collectible</div>
            <div className="text-lg font-bold text-arsd-red">₱{project.overview.collectible.toLocaleString()}</div>
          </div>
          <div className="border-l-4 border-l-arsd-red bg-white rounded shadow p-4">
            <div className="text-sm text-gray-600">Savings</div>
            <div className="text-lg font-bold text-arsd-red">₱{project.overview.savings.toLocaleString()}</div>
          </div>
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
          <ProjectOverview projectData={project.overview} costData={project.costData} />
        </TabsContent>

        {/* Schedule & Tasks Tab */}
        <TabsContent value="schedule" className="space-y-6">
          <ScheduleTasks tasks={project.tasks} />
        </TabsContent>

        {/* Cost Analysis Tab */}
        <TabsContent value="costs" className="space-y-6">
          <CostAnalysis costData={project.costData} projectData={project.overview} />
        </TabsContent>

        {/* Materials Tab */}
        <TabsContent value="materials" className="space-y-6">
          <Materials materials={project.materials} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
