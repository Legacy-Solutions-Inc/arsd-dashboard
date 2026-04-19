import { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ProgressPhotosSlider } from "../uploads/ProgressPhotosSlider";
import { 
  processProjectOverviewData,
  validateProjectData,
  calculateProjectHealthScore,
  getStatusBadgeColor,
  getProgressBarColor
} from "@/utils/project-overview-utils";

interface ProjectOverviewProps {
  projectData: {
    id: string; // Added for progress photos
    projectId: string;
    projectName?: string;
    client: string;
    contractor: string;
    location: string;
    pmName: string;
    siteEngineer: string;
    contractAmount: number;
    directContractAmount?: number;
    plannedStartDate?: string;
    plannedEndDate?: string;
    actualStartDate?: string;
    actualEndDate?: string;
    calendarDays?: number;
    workingDays?: number;
    priorityLevel?: string;
    remarks?: string;
    actualProgress: number;
    targetProgress: number;
    slippage: number;
    balance: number;
    collectible: number;
    savings: number;
  };
  costData: any[];
}

export function ProjectOverview({ projectData, costData }: ProjectOverviewProps) {
  const { formattedData } = useMemo(
    () => processProjectOverviewData(projectData),
    [projectData],
  );

  const fields: Array<{ label: string; value: React.ReactNode; accent?: boolean }> = [
    { label: 'Project ID', value: formattedData.projectId, accent: true },
    { label: 'Project Name', value: formattedData.projectName },
    { label: 'Client', value: formattedData.client },
    { label: 'Contractor License', value: formattedData.contractor },
    { label: 'Project Location', value: formattedData.location },
    { label: 'Contract Amount', value: formattedData.contractAmount },
    { label: 'Direct Contract Amount', value: formattedData.directContractAmount },
    { label: 'Planned Start Date', value: formattedData.plannedStartDate },
    { label: 'Planned End Date', value: formattedData.plannedEndDate },
    { label: 'Actual Start Date', value: formattedData.actualStartDate },
    { label: 'Actual End Date', value: formattedData.actualEndDate },
    { label: 'Calendar Days', value: formattedData.calendarDays },
    { label: 'Working Days', value: formattedData.workingDays },
    { label: 'PM Name', value: formattedData.pmName },
    { label: 'Site Engineer', value: formattedData.siteEngineer },
    { label: 'Priority Level', value: formattedData.priorityLevel },
    { label: 'Remarks', value: formattedData.remarks },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6">
      <Card className="lg:col-span-2 h-fit overflow-hidden">
        <CardHeader className="bg-muted/40 border-b border-border flex flex-row items-center gap-3 py-3">
          <span className="inline-flex items-center justify-center rounded-md bg-primary/10 text-primary p-1.5">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          </span>
          <CardTitle className="text-sm font-semibold text-foreground">
            Project Information
          </CardTitle>
        </CardHeader>
        <CardContent className="py-4">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
            {fields.map((f) => (
              <div key={f.label}>
                <dt className="text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
                  {f.label}
                </dt>
                <dd
                  className={
                    f.accent
                      ? 'text-sm font-semibold text-primary nums'
                      : 'text-sm font-medium text-foreground nums'
                  }
                >
                  {f.value}
                </dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <div className="lg:col-span-3">
        <ProgressPhotosSlider projectId={projectData.id} />
      </div>
    </div>
  );
}
