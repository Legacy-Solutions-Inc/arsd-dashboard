"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProjectOverview } from "../../../../components/project sections/ProjectOverview";
import { ScheduleTasks } from "../../../../components/project sections/ScheduleTasks";
import { CostAnalysis } from "../../../../components/project sections/CostAnalysis";
import { Materials } from "../../../../components/project sections/Materials";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ProjectDetailsService,
  type ProjectDetails,
} from "@/services/projects/project-details.service";
import {
  AlertCircle,
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Wallet,
  PiggyBank,
} from "lucide-react";
import { ProjectLoading } from "@/components/ui/universal-loading";
import { Button } from "@/components/ui/button";
import {
  calculateProjectStats,
  formatTargetPercentage,
  parseNumericValue,
  formatCurrency,
} from "@/utils/project-calculations";
import { cn } from "@/lib/utils";

const calculateProjectStatsData = (project: ProjectDetails) => {
  const projectCosts = project.project_costs || [];
  const projectDetails = project.project_details || [];

  const latestProjectCost = projectCosts[0] || {};
  const latestProjectDetails = projectDetails[0] || {};

  const stats = calculateProjectStats(latestProjectCost, latestProjectDetails);

  return {
    ...stats,
    latestProjectCost,
    latestProjectDetails,
  };
};

const LoadingState = () => (
  <ProjectLoading
    message="Loading project"
    subtitle="Fetching project information and financial data"
    size="lg"
    fullScreen={true}
  />
);

const ErrorState = ({
  error,
  onBack,
}: {
  error: string;
  onBack: () => void;
}) => (
  <div className="min-h-screen bg-background flex items-center justify-center px-4">
    <div className="w-full max-w-md bg-card border border-border rounded-lg shadow-sm-tinted p-6 text-center">
      <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-3">
        <AlertCircle className="h-5 w-5 text-destructive" />
      </div>
      <h2 className="text-h3 text-foreground mb-1">We couldn't load this project</h2>
      <p className="text-sm text-muted-foreground mb-5">{error}</p>
      <Button variant="outline" onClick={onBack} className="w-full">
        <ArrowLeft className="h-4 w-4" />
        Go back
      </Button>
    </div>
  </div>
);

const formatDataAsOf = (isoDate: string | null | undefined): string | null => {
  if (!isoDate) return null;
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const ProjectHeader = ({
  projectName,
  projectId,
  latestReportDate,
  onBack,
}: {
  projectName: string;
  projectId: string;
  latestReportDate?: string | null;
  onBack: () => void;
}) => {
  const dataAsOf = formatDataAsOf(latestReportDate);
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-border">
      <div className="flex items-center gap-3 min-w-0">
        <Button variant="outline" onClick={onBack} size="sm">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground mb-0.5">
            Project
          </div>
          <h1 className="text-h1 font-display text-foreground leading-none truncate">
            {projectName}
          </h1>
        </div>
      </div>
      <div className="flex flex-col sm:items-end gap-1.5 self-start sm:self-auto">
        <div className="text-xs text-muted-foreground bg-muted border border-border rounded-md px-2.5 py-1 font-mono nums">
          ID: {projectId || 'N/A'}
        </div>
        <div className="text-[11px] uppercase tracking-[0.06em] text-muted-foreground nums">
          {dataAsOf ? `Data as of ${dataAsOf}` : 'No accomplishment report yet'}
        </div>
      </div>
    </div>
  );
};

type StatTone = 'neutral' | 'positive' | 'negative' | 'warning';

const StatCard = ({
  label,
  value,
  isCurrency = false,
  isPercentage = false,
  isPositive = true,
  icon: Icon,
  contractAmount,
}: {
  label: string;
  value: number | string;
  isCurrency?: boolean;
  isPercentage?: boolean;
  isPositive?: boolean;
  icon?: any;
  contractAmount?: number;
}) => {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  const isNegative = numericValue < 0;
  const isHighValue = isPercentage && numericValue > 100;

  const tone: StatTone = isNegative
    ? 'negative'
    : isHighValue
      ? 'warning'
      : isPositive
        ? 'positive'
        : 'neutral';

  const toneClass: Record<StatTone, string> = {
    neutral: 'text-foreground',
    positive: 'text-foreground',
    negative: 'text-destructive',
    warning: 'text-amber-700 dark:text-amber-300',
  };

  const barClass: Record<StatTone, string> = {
    neutral: 'bg-muted-foreground/40',
    positive: 'bg-emerald-500',
    negative: 'bg-destructive',
    warning: 'bg-amber-500',
  };

  const progressWidth = () => {
    if (isPercentage) return Math.min(Math.abs(numericValue), 100);
    if (isCurrency && contractAmount && contractAmount > 0) {
      return Math.min((Math.abs(numericValue) / contractAmount) * 100, 100);
    }
    return 60;
  };

  return (
    <div className="bg-card border border-border rounded-md p-3 transition-colors hover:border-foreground/15">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground truncate">
          {label}
        </span>
        {Icon && (
          <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        )}
      </div>
      <div className={cn('text-sm font-semibold nums', toneClass[tone])}>
        {isCurrency
          ? formatCurrency(value)
          : `${value}${isPercentage ? '%' : ''}`}
      </div>
      <div className="mt-2 h-1 w-full bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', barClass[tone])}
          style={{ width: `${progressWidth()}%` }}
        />
      </div>
      {isPercentage && (
        <div className="text-[11px] text-muted-foreground mt-1 truncate">
          {numericValue > 100
            ? 'Over target'
            : numericValue < 0
              ? 'Under target'
              : 'On target'}
        </div>
      )}
    </div>
  );
};

const ProjectStatsGrid = ({
  stats,
}: {
  stats: ReturnType<typeof calculateProjectStatsData>;
}) => {
  const isOverBudget =
    parseNumericValue(stats.latestProjectCost.direct_cost_total) >
    stats.contractAmount;
  const isOnTrack = stats.actualProgress >= stats.targetProgress * 0.9;

  return (
    <section className="bg-card border border-border rounded-lg p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h2 className="text-h3 text-foreground flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          Financial overview
        </h2>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2.5 py-1 text-xs">
            <span
              aria-hidden
              className={cn(
                'w-1.5 h-1.5 rounded-full',
                isOverBudget ? 'bg-destructive' : 'bg-emerald-500',
              )}
            />
            <span className="text-muted-foreground">Budget</span>
            <span className="font-medium text-foreground">
              {isOverBudget ? 'Over' : 'Within'}
            </span>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2.5 py-1 text-xs">
            <span
              aria-hidden
              className={cn(
                'w-1.5 h-1.5 rounded-full',
                isOnTrack ? 'bg-emerald-500' : 'bg-amber-500',
              )}
            />
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium text-foreground">
              {isOnTrack ? 'On track' : 'Behind'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <StatCard
          label="Contract amount"
          value={stats.contractAmount}
          isCurrency
          icon={DollarSign}
          isPositive
          contractAmount={stats.contractAmount}
        />
        <StatCard
          label="Direct cost total"
          value={parseNumericValue(stats.latestProjectCost.direct_cost_total)}
          isCurrency
          icon={TrendingUp}
          isPositive={
            parseNumericValue(stats.latestProjectCost.direct_cost_total) <=
            stats.contractAmount
          }
          contractAmount={stats.contractAmount}
        />
        <StatCard
          label="SWA cost total"
          value={parseNumericValue(stats.latestProjectCost.swa_cost_total)}
          isCurrency
          icon={Target}
          isPositive
          contractAmount={stats.contractAmount}
        />
        <StatCard
          label="Target %"
          value={formatTargetPercentage(stats.targetProgress)}
          isPercentage
          icon={Target}
          isPositive={stats.targetProgress <= 100}
        />
        <StatCard
          label="Actual %"
          value={stats.actualProgress}
          isPercentage
          icon={CheckCircle}
          isPositive={stats.actualProgress <= 100}
        />
        <StatCard
          label="Slippage"
          value={Number(
            (stats.actualProgress - formatTargetPercentage(stats.targetProgress)).toFixed(2),
          )}
          isPercentage
          icon={AlertTriangle}
          isPositive={stats.slippage <= 0}
        />
        <StatCard
          label="Target cost total"
          value={
            stats.targetProgress === 1
              ? stats.contractAmount * stats.targetProgress
              : stats.contractAmount * (stats.targetProgress / 100)
          }
          isCurrency
          icon={Target}
          isPositive
          contractAmount={stats.contractAmount}
        />
        <StatCard
          label="Billed cost total"
          value={parseNumericValue(stats.latestProjectCost.billed_cost_total)}
          isCurrency
          icon={Clock}
          isPositive
          contractAmount={stats.contractAmount}
        />
        <StatCard
          label="Collectible"
          value={stats.latestProjectCost.collectibles}
          isCurrency
          icon={Wallet}
          isPositive={stats.collectible > 0}
          contractAmount={stats.contractAmount}
        />
        <StatCard
          label="Balance"
          value={stats.latestProjectCost.balance}
          isCurrency
          icon={BarChart3}
          isPositive={stats.balance > 0}
          contractAmount={stats.contractAmount}
        />
        <StatCard
          label="Savings"
          value={stats.latestProjectCost.direct_cost_savings}
          isCurrency
          icon={PiggyBank}
          isPositive={stats.savings > 0}
          contractAmount={stats.contractAmount}
        />
      </div>
    </section>
  );
};

const ProjectTabs = ({
  project,
  stats,
}: {
  project: ProjectDetails;
  stats: ReturnType<typeof calculateProjectStatsData>;
}) => (
  <Tabs defaultValue="overview" className="w-full">
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="border-b border-border px-2 sm:px-4 overflow-x-auto">
        <TabsList className="bg-transparent p-0 h-auto gap-1 w-full sm:w-auto justify-start">
          {[
            { value: 'overview', label: 'Overview' },
            { value: 'schedule', label: 'Schedule' },
            { value: 'costs', label: 'Cost analysis' },
            { value: 'materials', label: 'Materials' },
          ].map((t) => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className="relative rounded-none border-b-2 border-transparent bg-transparent px-4 py-3 text-sm font-medium text-muted-foreground data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground transition-colors"
            >
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <div className="p-4 sm:p-6">
        <TabsContent value="overview" className="mt-0 space-y-4">
          <ProjectOverview
            projectData={{
              id: project.id,
              projectId:
                stats.latestProjectDetails.project_id || project.project_id,
              projectName: stats.latestProjectDetails.project_name || 'N/A',
              client: stats.latestProjectDetails.client || 'N/A',
              contractor: stats.latestProjectDetails.contractor_license || 'N/A',
              location: stats.latestProjectDetails.project_location || 'N/A',
              pmName: stats.latestProjectDetails.pm_name || 'N/A',
              siteEngineer:
                stats.latestProjectDetails.site_engineer_name || 'N/A',
              contractAmount: stats.contractAmount,
              directContractAmount: parseNumericValue(
                stats.latestProjectDetails.direct_contract_amount,
              ),
              plannedStartDate:
                stats.latestProjectDetails.planned_start_date || 'N/A',
              plannedEndDate:
                stats.latestProjectDetails.planned_end_date || 'N/A',
              actualStartDate:
                stats.latestProjectDetails.actual_start_date || 'N/A',
              actualEndDate:
                stats.latestProjectDetails.actual_end_date || 'N/A',
              calendarDays: parseNumericValue(
                stats.latestProjectDetails.calendar_days,
              ),
              workingDays: parseNumericValue(
                stats.latestProjectDetails.working_days,
              ),
              priorityLevel: stats.latestProjectDetails.priority_level || 'N/A',
              remarks: stats.latestProjectDetails.remarks || 'N/A',
              actualProgress: stats.actualProgress,
              targetProgress: stats.targetProgress,
              slippage: stats.slippage,
              balance: stats.balance,
              collectible: stats.collectible,
              savings: stats.savings,
            }}
            costData={project.project_costs || []}
          />
        </TabsContent>

        <TabsContent value="schedule" className="mt-0 space-y-4">
          <ScheduleTasks
            tasks={[]}
            costItemsSecondaryData={project.cost_items_secondary || []}
            targetCostTotal={parseNumericValue(
              stats.latestProjectCost.target_cost_total,
            )}
            projectData={{
              actualProgress: stats.actualProgress,
              targetProgress: stats.targetProgress,
            }}
          />
        </TabsContent>

        <TabsContent value="costs" className="mt-0 space-y-4">
          <CostAnalysis
            costData={project.monthly_costs || []}
            costItemsData={project.cost_items || []}
            manHoursData={project.man_hours || []}
            projectData={{
              actualProgress: stats.actualProgress,
              targetProgress: stats.targetProgress,
              savings: stats.savings,
            }}
            projectStats={{
              contractAmount: stats.contractAmount,
              targetCostTotal: stats.targetCostTotal,
              directCostTotal: stats.directCostTotal,
              swaCostTotal: stats.swaCostTotal,
              billedCostTotal: stats.billedCostTotal,
            }}
          />
        </TabsContent>

        <TabsContent value="materials" className="mt-0 space-y-4">
          <Materials projectId={project.id} />
        </TabsContent>
      </div>
    </div>
  </Tabs>
);

// Stateless aside from the Supabase client; instantiate once at module scope so
// each render of ProjectProfilePage reuses the same service.
const projectDetailsService = new ProjectDetailsService();

export default function ProjectProfilePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      if (!projectId) return;
      try {
        setLoading(true);
        setError(null);
        const projectData =
          await projectDetailsService.getProjectDetails(projectId);
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
  if (error || !project)
    return (
      <ErrorState
        error={error || 'Project not found'}
        onBack={() => router.back()}
      />
    );

  const stats = calculateProjectStatsData(project);

  return (
    <div className="space-y-5">
      <ProjectHeader
        projectName={project.project_name}
        projectId={stats.latestProjectDetails.project_id || project.id}
        latestReportDate={project.latest_report_date}
        onBack={() => router.back()}
      />
      <ProjectStatsGrid stats={stats} />
      <ProjectTabs project={project} stats={stats} />
    </div>
  );
}
