"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProjectOverview } from "../../../../components/project sections/ProjectOverview";
import { ScheduleTasks } from "../../../../components/project sections/ScheduleTasks";
import { CostAnalysis } from "../../../../components/project sections/CostAnalysis";
import { Materials } from "../../../../components/project sections/Materials";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectDetailsService, type ProjectDetails } from "@/services/projects/project-details.service";
import { GlassCard, GlassCardContent } from "@/components/ui/glass-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Constants
const CARD_STYLES = "border-l-4 border-l-arsd-red bg-white rounded shadow p-4";
const STAT_CARD_GRID = "grid grid-cols-2 md:grid-cols-6 gap-4 mb-6";

// Utility functions
const formatCurrency = (value: number | string): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return `₱${numValue.toLocaleString()}`;
};

const parseNumericValue = (value: string | undefined, defaultValue: number = 0): number => {
  return value ? parseFloat(value) || defaultValue : defaultValue;
};

const calculatePercentage = (numerator: number, denominator: number): number => {
  return denominator > 0 ? (numerator / denominator) * 100 : 0;
};

const roundToTwoDecimals = (value: number): number => {
  return Math.round(value * 100) / 100;
};

// Data processing functions
const calculateProjectStats = (project: ProjectDetails) => {
  const projectDetails = project.project_details || [];
  const projectCosts = project.project_costs || [];
  const manHours = project.man_hours || [];
  const costItems = project.cost_items || [];
  const costItemsSecondary = project.cost_items_secondary || [];
  const monthlyCosts = project.monthly_costs || [];
  const materials = project.materials || [];
  const purchaseOrders = project.purchase_orders || [];

  // Get the latest data from each category
  const latestProjectCost = projectCosts[0] || {};
  const latestProjectDetails = projectDetails[0] || {};
  const latestManHours = manHours || {};
  const latestCostItems = costItems || {};
  const latestCostItemsSecondary = costItemsSecondary || {};
  const latestMonthlyCosts = monthlyCosts || {};
  const latestMaterials = materials || {};
  const latestPurchaseOrders = purchaseOrders || {};

  // Contract amount from project_details table
  const contractAmount = parseNumericValue(latestProjectDetails.contract_amount);

  // Calculate percentages using project_costs data
  const targetCostTotal = parseNumericValue(latestProjectCost.target_cost_total);
  const directCostTotal = parseNumericValue(latestProjectCost.direct_cost_total);

  const targetProgress = roundToTwoDecimals(calculatePercentage(targetCostTotal, contractAmount));
  const actualProgress = roundToTwoDecimals(calculatePercentage(directCostTotal, contractAmount));
  const slippage = roundToTwoDecimals(targetProgress - actualProgress);

  // Financial values from project_costs table
  const balance = parseNumericValue(latestProjectCost.balance);
  const collectible = parseNumericValue(latestProjectCost.collectibles);
  const savings = parseNumericValue(latestProjectCost.direct_cost_savings);

  // Calculate totals
  const totalCosts = projectCosts.reduce((sum, cost) => {
    return sum + parseNumericValue(cost.direct_cost_total);
  }, 0);

  const totalActualHours = manHours.reduce((sum, hour) => {
    return sum + parseNumericValue(hour.actual_man_hours);
  }, 0);

  const totalProjectedHours = manHours.reduce((sum, hour) => {
    return sum + parseNumericValue(hour.projected_man_hours);
  }, 0);

  return {
    contractAmount,
    actualProgress,
    targetProgress,
    slippage,
    balance,
    collectible,
    savings,
    totalCosts,
    totalActualHours,
    totalProjectedHours,
    latestProjectCost,
    latestProjectDetails,
    latestManHours,
    latestCostItems,
    latestCostItemsSecondary,
    latestMonthlyCosts,
    latestMaterials,
    latestPurchaseOrders
  };
};

// Subcomponents
const LoadingState = () => (
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

const ErrorState = ({ error, onBack }: { error: string; onBack: () => void }) => (
  <div className="container mx-auto px-4 py-6">
    <div className="mb-6">
      <Button variant="outline" onClick={onBack} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>
    </div>
    <Alert variant="destructive" className="glass-elevated border-red-200/50 bg-red-50/10">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="text-red-800">{error}</AlertDescription>
    </Alert>
  </div>
);

const ProjectHeader = ({ 
  projectName, 
  projectId, 
  onBack 
}: { 
  projectName: string; 
  projectId: string; 
  onBack: () => void; 
}) => (
  <div className="mb-6">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack} size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold text-arsd-red">{projectName}</h1>
      </div>
      <div className="text-sm text-gray-600">Project ID: {projectId}</div>
    </div>
  </div>
);

const StatCard = ({ 
  label, 
  value, 
  isCurrency = false 
}: { 
  label: string; 
  value: number | string; 
  isCurrency?: boolean; 
}) => (
  <div className={CARD_STYLES}>
    <div className="text-sm text-gray-600">{label}</div>
    <div className="text-lg font-bold text-arsd-red">
      {isCurrency ? formatCurrency(value) : `${value}${typeof value === 'number' && !isCurrency ? '%' : ''}`}
    </div>
  </div>
);

const ProjectStatsGrid = ({ stats }: { stats: ReturnType<typeof calculateProjectStats> }) => (
  <div className={STAT_CARD_GRID}>
    <StatCard label="Contract Amount" value={stats.contractAmount} isCurrency />
    <StatCard 
      label="Direct Cost Total" 
      value={parseNumericValue(stats.latestProjectCost.direct_cost_total)} 
      isCurrency 
    />
    <StatCard 
      label="SWA Cost Total" 
      value={parseNumericValue(stats.latestProjectCost.swa_cost_total)} 
      isCurrency 
    />
    <StatCard label="Target %" value={stats.targetProgress} />
    <StatCard label="Actual %" value={stats.actualProgress} />
    <StatCard label="Slippage" value={stats.slippage} />
    <StatCard 
      label="Target Cost Total" 
      value={parseNumericValue(stats.latestProjectCost.target_cost_total)} 
      isCurrency 
    />
    <StatCard 
      label="Billed Cost Total" 
      value={parseNumericValue(stats.latestProjectCost.billed_cost_total)} 
      isCurrency 
    />
    <StatCard label="Collectible" value={stats.collectible} isCurrency />
    <StatCard label="Balance" value={stats.balance} isCurrency />
    <StatCard label="Savings" value={stats.savings} isCurrency />
  </div>
);

const ProjectTabs = ({ 
  project, 
  stats 
}: { 
  project: ProjectDetails; 
  stats: ReturnType<typeof calculateProjectStats>; 
}) => (
  <Tabs defaultValue="overview" className="w-full">
    <TabsList className="grid w-full grid-cols-4">
      <TabsTrigger value="overview">Project Overview</TabsTrigger>
      <TabsTrigger value="schedule">Schedule & Tasks</TabsTrigger>
      <TabsTrigger value="costs">Cost Analysis</TabsTrigger>
      <TabsTrigger value="materials">Materials</TabsTrigger>
    </TabsList>

    <TabsContent value="overview" className="space-y-6">
      <ProjectOverview
        projectData={{
          projectId: project.project_id,
          projectName: stats.latestProjectDetails.project_name || 'N/A',
          client: stats.latestProjectDetails.client || 'N/A',
          contractor: stats.latestProjectDetails.contractor_license || 'N/A',
          location: stats.latestProjectDetails.project_location || 'N/A',
          pmName: stats.latestProjectDetails.pm_name || 'N/A',
          siteEngineer: stats.latestProjectDetails.site_engineer_name || 'N/A',
          contractAmount: stats.contractAmount,
          directContractAmount: parseNumericValue(stats.latestProjectDetails.direct_contract_amount),
          plannedStartDate: stats.latestProjectDetails.planned_start_date || 'N/A',
          plannedEndDate: stats.latestProjectDetails.planned_end_date || 'N/A',
          actualStartDate: stats.latestProjectDetails.actual_start_date || 'N/A',
          actualEndDate: stats.latestProjectDetails.actual_end_date || 'N/A',
          calendarDays: parseNumericValue(stats.latestProjectDetails.calendar_days),
          workingDays: parseNumericValue(stats.latestProjectDetails.working_days),
          priorityLevel: stats.latestProjectDetails.priority_level || 'N/A',
          remarks: stats.latestProjectDetails.remarks || 'N/A',
          actualProgress: stats.actualProgress,
          targetProgress: stats.targetProgress,
          slippage: stats.slippage,
          balance: stats.balance,
          collectible: stats.collectible,
          savings: stats.savings
        }}
        costData={project.project_costs || []}
      />
    </TabsContent>

    <TabsContent value="schedule" className="space-y-6">
      <ScheduleTasks
        tasks={[]}
        costItemsSecondaryData={project.cost_items_secondary || []}
        targetCostTotal={parseNumericValue(stats.latestProjectCost.target_cost_total)}
        projectData={{
          actualProgress: stats.actualProgress,
          targetProgress: stats.targetProgress
        }}
      />
    </TabsContent>

    <TabsContent value="costs" className="space-y-6">
      <CostAnalysis
        costData={project.monthly_costs || []}
        costItemsData={project.cost_items || []}
        manHoursData={project.man_hours || []}
        projectData={{
          actualProgress: stats.actualProgress,
          targetProgress: stats.targetProgress,
          savings: stats.savings
        }}
      />
    </TabsContent>

    <TabsContent value="materials" className="space-y-6">
      <Materials
        materials={project.materials || []}
        purchaseOrders={project.purchase_orders || []}
      />
    </TabsContent>
  </Tabs>
);

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

  if (loading) return <LoadingState />;
  if (error || !project) return <ErrorState error={error || 'Project not found'} onBack={() => router.back()} />;

  const stats = calculateProjectStats(project);

  return (
    <div className="container mx-auto px-4 py-6">
      <ProjectHeader 
        projectName={project.project_name} 
        projectId={project.project_id} 
        onBack={() => router.back()} 
      />
      <ProjectStatsGrid stats={stats} />
      <ProjectTabs project={project} stats={stats} />
    </div>
  );
}