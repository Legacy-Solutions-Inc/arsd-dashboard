"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProjectOverview } from "../../sections/ProjectOverview";
import { ScheduleTasks } from "../../sections/ScheduleTasks";
import { CostAnalysis } from "../../sections/CostAnalysis";
import { Materials } from "../../sections/Materials";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectDetailsService, type ProjectDetails } from "@/services/projects/project-details.service";
import { GlassCard, GlassCardContent } from "@/components/ui/glass-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProjectProfilePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const projectDetailsService = new ProjectDetailsService();

  useEffect(() => {
    const fetchProjectDetails = async () => {
      if (!projectId) return;
      
      try {
        setLoading(true);
        setError(null);
        const projectData = await projectDetailsService.getProjectDetails(projectId);
        
        if (!projectData) {
          setError('Project not found');
          return;
        }
        
        setProject(projectData);
      } catch (err) {
        console.error('Error fetching project details:', err);
        setError('Failed to load project details');
      } finally {
        setLoading(false);
      }
    };

    fetchProjectDetails();
  }, [projectId]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <GlassCard variant="elevated" className="text-center">
          <GlassCardContent className="p-12">
            <div className="flex items-center justify-center mb-4">
              <Loader2 className="h-8 w-8 animate-spin text-arsd-red" />
            </div>
            <div className="text-glass-primary text-lg">Loading project details...</div>
          </GlassCardContent>
        </GlassCard>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <Alert variant="destructive" className="glass-elevated border-red-200/50 bg-red-50/10">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-800">
            {error || 'Project not found'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Calculate project statistics from real data
  const calculateProjectStats = () => {
    const projectDetails = project.project_details?.[0] || {};
    const projectCosts = project.project_costs || [];
    const manHours = project.man_hours || [];
    
    // Calculate totals from project costs
    const totalCosts = projectCosts.reduce((sum, cost) => {
      return sum + (parseFloat(cost.amount) || 0);
    }, 0);
    
    // Calculate man hours totals
    const totalActualHours = manHours.reduce((sum, hour) => {
      return sum + (parseFloat(hour.actual_man_hours) || 0);
    }, 0);
    
    const totalProjectedHours = manHours.reduce((sum, hour) => {
      return sum + (parseFloat(hour.projected_man_hours) || 0);
    }, 0);
    
    return {
      contractAmount: parseFloat(projectDetails.contract_amount) || 0,
      actualProgress: parseFloat(projectDetails.actual_progress) || 0,
      targetProgress: parseFloat(projectDetails.target_progress) || 0,
      slippage: parseFloat(projectDetails.slippage) || 0,
      balance: parseFloat(projectDetails.balance) || 0,
      collectible: parseFloat(projectDetails.collectible) || 0,
      savings: parseFloat(projectDetails.savings) || 0,
      totalCosts,
      totalActualHours,
      totalProjectedHours
    };
  };

  const stats = calculateProjectStats();

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-arsd-red">{project.project_name}</h1>
          </div>
          <div className="text-sm text-gray-600">
            Project ID: {project.project_id}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <div className="border-l-4 border-l-arsd-red bg-white rounded shadow p-4">
            <div className="text-sm text-gray-600">Contract Amount</div>
            <div className="text-lg font-bold text-arsd-red">₱{stats.contractAmount.toLocaleString()}.00</div>
          </div>
          <div className="border-l-4 border-l-arsd-red bg-white rounded shadow p-4">
            <div className="text-sm text-gray-600">Actual %</div>
            <div className="text-lg font-bold text-arsd-red">{stats.actualProgress}%</div>
          </div>
          <div className="border-l-4 border-l-arsd-red bg-white rounded shadow p-4">
            <div className="text-sm text-gray-600">Target %</div>
            <div className="text-lg font-bold text-arsd-red">{stats.targetProgress}%</div>
          </div>
          <div className="border-l-4 border-l-arsd-red bg-white rounded shadow p-4">
            <div className="text-sm text-gray-600">Slippage</div>
            <div className="text-lg font-bold text-arsd-red">{stats.slippage}%</div>
          </div>
          <div className="border-l-4 border-l-arsd-red bg-white rounded shadow p-4">
            <div className="text-sm text-gray-600">Balance</div>
            <div className="text-lg font-bold text-arsd-red">₱{stats.balance.toLocaleString()}</div>
          </div>
          <div className="border-l-4 border-l-arsd-red bg-white rounded shadow p-4">
            <div className="text-sm text-gray-600">Collectible</div>
            <div className="text-lg font-bold text-arsd-red">₱{stats.collectible.toLocaleString()}</div>
          </div>
          <div className="border-l-4 border-l-arsd-red bg-white rounded shadow p-4">
            <div className="text-sm text-gray-600">Savings</div>
            <div className="text-lg font-bold text-arsd-red">₱{stats.savings.toLocaleString()}</div>
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
          <ProjectOverview 
            projectData={{
              projectId: project.project_id,
              client: project.client,
              contractor: project.project_manager?.display_name || 'Unassigned',
              location: project.location,
              pmName: project.project_manager?.display_name || 'Unassigned',
              siteEngineer: 'TBD', // This would need to be added to the database
              actualProgress: stats.actualProgress,
              targetProgress: stats.targetProgress,
              slippage: stats.slippage,
              balance: stats.balance,
              collectible: stats.collectible,
              contractAmount: stats.contractAmount,
              savings: stats.savings
            }} 
            costData={project.project_costs || []} 
          />
        </TabsContent>

        {/* Schedule & Tasks Tab */}
        <TabsContent value="schedule" className="space-y-6">
          <ScheduleTasks tasks={[]} />
        </TabsContent>

        {/* Cost Analysis Tab */}
        <TabsContent value="costs" className="space-y-6">
          <CostAnalysis 
            costData={project.monthly_costs || []} 
            projectData={{
              actualProgress: stats.actualProgress,
              targetProgress: stats.targetProgress,
              savings: stats.savings
            }} 
          />
        </TabsContent>

        {/* Materials Tab */}
        <TabsContent value="materials" className="space-y-6">
          <Materials materials={project.materials || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
