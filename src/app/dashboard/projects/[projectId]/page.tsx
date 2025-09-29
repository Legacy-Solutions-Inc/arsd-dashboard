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
import { AlertCircle, ArrowLeft, Loader2, DollarSign, TrendingUp, Target, AlertTriangle, CheckCircle, Clock, BarChart3, Wallet, PiggyBank, Download, Share2, Edit3, Eye } from "lucide-react";
import { ProjectLoading, InlineLoading } from "@/components/ui/universal-loading";
import { Button } from "@/components/ui/button";

// Constants
const CARD_STYLES = "border-l-4 border-l-arsd-red bg-white rounded shadow p-3";
const STAT_CARD_GRID = "grid grid-cols-2 md:grid-cols-6 gap-3 mb-4";

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
  <ProjectLoading 
    message="Loading Project Details"
    subtitle="Fetching project information and financial data"
    size="lg"
    fullScreen={true}
  />
);

const ErrorState = ({ error, onBack }: { error: string; onBack: () => void }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
    <div className="relative w-full max-w-md">
      <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-orange-500/5 to-yellow-500/5 rounded-2xl blur-3xl"></div>
      <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Project</h2>
          <p className="text-gray-600 text-sm mb-6">{error}</p>
          <Button 
            variant="outline" 
            onClick={onBack} 
            className="w-full hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
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
  <div className="relative mb-6">
    <div className="absolute inset-0 bg-gradient-to-r from-arsd-red/5 via-blue-500/5 to-purple-500/5 rounded-xl blur-2xl"></div>
    <div className="relative bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={onBack} 
            size="sm" 
            className="text-xs hover:bg-gray-50 transition-colors border-gray-300"
          >
            <ArrowLeft className="h-3 w-3 mr-1" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-arsd-red to-red-600 rounded-lg flex items-center justify-center shadow-md">
              <div className="w-3 h-3 bg-white rounded-sm"></div>
            </div>
            <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-arsd-red to-red-600 bg-clip-text text-transparent">
              {projectName}
            </h1>
          </div>
        </div>
        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md font-mono">
          ID: {projectId}
        </div>
      </div>
    </div>
  </div>
);

const StatCard = ({ 
  label, 
  value, 
  isCurrency = false,
  isPercentage = false,
  isPositive = true,
  icon: Icon
}: { 
  label: string; 
  value: number | string; 
  isCurrency?: boolean;
  isPercentage?: boolean;
  isPositive?: boolean;
  icon?: any;
}) => {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  const isNegative = numericValue < 0;
  const isHighValue = isPercentage && numericValue > 100;
  
  const getColorClasses = () => {
    if (isNegative) return 'text-red-600 bg-red-50 border-red-200';
    if (isHighValue) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (isPositive) return 'text-green-600 bg-green-50 border-green-200';
    return 'text-blue-600 bg-blue-50 border-blue-200';
  };

  const getProgressColor = () => {
    if (isNegative) return 'from-red-500 to-red-600';
    if (isHighValue) return 'from-orange-500 to-orange-600';
    if (isPositive) return 'from-green-500 to-green-600';
    return 'from-blue-500 to-blue-600';
  };

  const getProgressWidth = () => {
    if (isPercentage) {
      return Math.min(Math.abs(numericValue), 100);
    }
    return 60; // Default for non-percentage values
  };

  return (
    <div className={`group bg-white rounded-lg shadow-sm border p-3 hover:shadow-md transition-all duration-200 hover:scale-[1.01] ${getColorClasses()}`}>
      <div className="flex items-center justify-between mb-1">
        <div className="text-xs text-gray-600 font-medium uppercase tracking-wide truncate">{label}</div>
        {Icon && <Icon className="h-3 w-3 text-gray-400 flex-shrink-0 ml-1" />}
      </div>
      <div className="text-sm font-bold text-gray-900 mb-2">
        {isCurrency ? formatCurrency(value) : `${value}${isPercentage ? '%' : ''}`}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1">
        <div 
          className={`bg-gradient-to-r ${getProgressColor()} h-1 rounded-full transition-all duration-300`}
          style={{width: `${getProgressWidth()}%`}}
        ></div>
      </div>
      {isPercentage && (
        <div className="text-xs text-gray-500 mt-1 truncate">
          {numericValue > 100 ? 'Over Target' : numericValue < 0 ? 'Under Target' : 'On Target'}
        </div>
      )}
    </div>
  );
};

const ProjectStatsGrid = ({ stats }: { stats: ReturnType<typeof calculateProjectStats> }) => {
  const isOverBudget = parseNumericValue(stats.latestProjectCost.direct_cost_total) > stats.contractAmount;
  const isOnTrack = stats.actualProgress >= stats.targetProgress * 0.9; // Within 90% of target
  const hasPositiveSavings = stats.savings > 0;
  
  return (
    <div className="relative mb-6">
      <div className="absolute inset-0 bg-gradient-to-r from-arsd-red/5 via-blue-500/5 to-purple-500/5 rounded-xl blur-2xl"></div>
      <div className="relative bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-lg">
        <div className="mb-4">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-1">
            <BarChart3 className="h-4 w-4 text-arsd-red" />
            Project Financial Overview
          </h3>
          
          {/* Project Status Summary */}
          <div className="flex items-center gap-4 mb-4">
            <div className={`px-3 py-2 rounded-lg border ${isOverBudget ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isOverBudget ? 'bg-red-500' : 'bg-green-500'}`}></div>
                <span className="text-xs font-semibold text-gray-700">Budget:</span>
                <span className={`text-xs font-bold ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                  {isOverBudget ? 'Over' : 'Within'}
                </span>
              </div>
            </div>
            
            <div className={`px-3 py-2 rounded-lg border ${isOnTrack ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isOnTrack ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                <span className="text-xs font-semibold text-gray-700">Progress:</span>
                <span className={`text-xs font-bold ${isOnTrack ? 'text-green-600' : 'text-orange-600'}`}>
                  {isOnTrack ? 'On Track' : 'Behind'}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <StatCard 
            label="Contract Amount" 
            value={stats.contractAmount} 
            isCurrency 
            icon={DollarSign}
            isPositive={true}
          />
          <StatCard 
            label="Direct Cost Total" 
            value={parseNumericValue(stats.latestProjectCost.direct_cost_total)} 
            isCurrency 
            icon={TrendingUp}
            isPositive={parseNumericValue(stats.latestProjectCost.direct_cost_total) <= stats.contractAmount}
          />
          <StatCard 
            label="SWA Cost Total" 
            value={parseNumericValue(stats.latestProjectCost.swa_cost_total)} 
            isCurrency 
            icon={Target}
            isPositive={true}
          />
          <StatCard 
            label="Target %" 
            value={stats.targetProgress} 
            isPercentage={true}
            icon={Target}
            isPositive={stats.targetProgress <= 100}
          />
          <StatCard 
            label="Actual %" 
            value={stats.actualProgress} 
            isPercentage={true}
            icon={CheckCircle}
            isPositive={stats.actualProgress <= 100}
          />
          <StatCard 
            label="Slippage" 
            value={stats.slippage} 
            isPercentage={true}
            icon={AlertTriangle}
            isPositive={stats.slippage <= 0}
          />
          <StatCard 
            label="Target Cost Total" 
            value={parseNumericValue(stats.latestProjectCost.target_cost_total)} 
            isCurrency 
            icon={Target}
            isPositive={true}
          />
          <StatCard 
            label="Billed Cost Total" 
            value={parseNumericValue(stats.latestProjectCost.billed_cost_total)} 
            isCurrency 
            icon={Clock}
            isPositive={true}
          />
          <StatCard 
            label="Collectible" 
            value={stats.collectible} 
            isCurrency 
            icon={Wallet}
            isPositive={stats.collectible > 0}
          />
          <StatCard 
            label="Balance" 
            value={stats.balance} 
            isCurrency 
            icon={BarChart3}
            isPositive={stats.balance > 0}
          />
          <StatCard 
            label="Savings" 
            value={stats.savings} 
            isCurrency 
            icon={PiggyBank}
            isPositive={stats.savings > 0}
          />
        </div>
      </div>
    </div>
  );
};

const ProjectTabs = ({ 
  project, 
  stats 
}: { 
  project: ProjectDetails; 
  stats: ReturnType<typeof calculateProjectStats>; 
}) => (
  <div className="relative">
    <div className="absolute inset-0 bg-gradient-to-r from-arsd-red/5 via-blue-500/5 to-purple-500/5 rounded-xl blur-2xl"></div>
    <div className="relative bg-white/90 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg overflow-hidden">
      <Tabs defaultValue="overview" className="w-full">
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-blue-50/50 border-b border-gray-200/50">
          <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm">
            <TabsTrigger value="overview" className="text-xs sm:text-sm font-medium">Project Overview</TabsTrigger>
            <TabsTrigger value="schedule" className="text-xs sm:text-sm font-medium">Schedule & Tasks</TabsTrigger>
            <TabsTrigger value="costs" className="text-xs sm:text-sm font-medium">Cost Analysis</TabsTrigger>
            <TabsTrigger value="materials" className="text-xs sm:text-sm font-medium">Materials</TabsTrigger>
          </TabsList>
        </div>

        <div className="p-6">
          <TabsContent value="overview" className="space-y-4">
            <ProjectOverview
              projectData={{
                id: project.id,
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

          <TabsContent value="schedule" className="space-y-4">
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

          <TabsContent value="costs" className="space-y-4">
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

          <TabsContent value="materials" className="space-y-4">
            <Materials
              materials={project.materials || []}
              purchaseOrders={project.purchase_orders || []}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  </div>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="container mx-auto px-4 py-4 space-y-4">
        <ProjectHeader 
          projectName={project.project_name} 
          projectId={project.project_id} 
          onBack={() => router.back()} 
        />
        <ProjectStatsGrid stats={stats} />
        <ProjectTabs project={project} stats={stats} />
      </div>
    </div>
  );
}