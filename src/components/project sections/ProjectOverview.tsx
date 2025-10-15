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
  const arsdRed = '#B91C1C';
  
  // Process project data using utility functions
  const {
    formattedData,
    statusInfo,
    dateInfo,
    financialInfo
  } = useMemo(() => {
    return processProjectOverviewData(projectData);
  }, [projectData]);

  // Validate project data
  const { isValid: isDataValid, missingFields } = useMemo(() => {
    return validateProjectData(projectData);
  }, [projectData]);

  // Calculate project health score
  const healthScore = useMemo(() => {
    return calculateProjectHealthScore(projectData);
  }, [projectData]);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6">
      {/* Project Information on the left */}
      <Card className="lg:col-span-2 mt-4 lg:mt-6 border-l-4 h-fit" style={{ borderLeftColor: arsdRed, boxShadow: '0 2px 8px rgba(185,28,28,0.08)' }}>
        <CardHeader className="flex items-center gap-2 lg:gap-3" style={{ background: arsdRed, borderTopLeftRadius: '0.5rem', borderTopRightRadius: '0.5rem' }}>
          <span className="inline-flex items-center justify-center bg-white rounded-full p-1.5 lg:p-2">
            <svg width="16" height="16" className="lg:w-5 lg:h-5" fill="none" stroke={arsdRed} strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
          </span>
          <CardTitle className="text-white text-sm lg:text-lg font-bold tracking-wide">Project Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 lg:space-y-3 py-2 lg:py-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
            <div>
              <div className="text-xs text-gray-500">Project ID</div>
              <div className="font-semibold text-arsd-red text-sm">{formattedData.projectId}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Project Name</div>
              <div className="font-semibold text-gray-900 text-sm">{formattedData.projectName}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Client</div>
              <div className="font-semibold text-gray-900 text-sm">{formattedData.client}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Contractor License</div>
              <div className="font-semibold text-gray-900 text-sm">{formattedData.contractor}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Project Location</div>
              <div className="font-semibold text-gray-900 text-sm">{formattedData.location}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Contract Amount</div>
              <div className="font-semibold text-gray-900 text-sm">{formattedData.contractAmount}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Direct Contract Amount</div>
              <div className="font-semibold text-gray-900 text-sm">{formattedData.directContractAmount}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Planned Start Date</div>
              <div className="font-semibold text-gray-900 text-sm">{formattedData.plannedStartDate}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Planned End Date</div>
              <div className="font-semibold text-gray-900 text-sm">{formattedData.plannedEndDate}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Actual Start Date</div>
              <div className="font-semibold text-gray-900 text-sm">{formattedData.actualStartDate}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Actual End Date</div>
              <div className="font-semibold text-gray-900 text-sm">{formattedData.actualEndDate}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Calendar Days</div>
              <div className="font-semibold text-gray-900 text-sm">{formattedData.calendarDays}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Working Days</div>
              <div className="font-semibold text-gray-900 text-sm">{formattedData.workingDays}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">PM Name</div>
              <div className="font-semibold text-gray-900 text-sm">{formattedData.pmName}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Site Engineer</div>
              <div className="font-semibold text-gray-900 text-sm">{formattedData.siteEngineer}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Priority Level</div>
              <div className="font-semibold text-gray-900 text-sm">{formattedData.priorityLevel}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Remarks</div>
              <div className="font-semibold text-gray-900 text-sm">{formattedData.remarks}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Photos on the right */}
      <div className="lg:col-span-3 mt-4 lg:mt-6">
        <ProgressPhotosSlider projectId={projectData.id} />
      </div>
    </div>
  );
}
