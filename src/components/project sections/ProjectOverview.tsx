import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface ProjectOverviewProps {
  projectData: {
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
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
      {/* Project Information on the left */}
      <Card className="lg:col-span-1 mt-4 lg:mt-6 border-l-4 h-fit" style={{ borderLeftColor: arsdRed, boxShadow: '0 2px 8px rgba(185,28,28,0.08)' }}>
        <CardHeader className="flex items-center gap-2 lg:gap-3" style={{ background: arsdRed, borderTopLeftRadius: '0.5rem', borderTopRightRadius: '0.5rem' }}>
          <span className="inline-flex items-center justify-center bg-white rounded-full p-1.5 lg:p-2">
            <svg width="16" height="16" className="lg:w-5 lg:h-5" fill="none" stroke={arsdRed} strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
          </span>
          <CardTitle className="text-white text-sm lg:text-base font-bold tracking-wide">Project Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 lg:space-y-6 py-4 lg:py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
            <div>
              <div className="text-xs text-gray-500">Project ID</div>
              <div className="font-semibold text-arsd-red text-sm">{projectData.projectId}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Project Name</div>
              <div className="font-semibold text-gray-900 text-sm">{projectData.projectName}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Client</div>
              <div className="font-semibold text-gray-900 text-sm">{projectData.client}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Contractor License</div>
              <div className="font-semibold text-gray-900 text-sm">{projectData.contractor}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Project Location</div>
              <div className="font-semibold text-gray-900 text-sm">{projectData.location}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Contract Amount</div>
              <div className="font-semibold text-gray-900 text-sm">₱{projectData.contractAmount?.toLocaleString() || 'N/A'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Direct Contract Amount</div>
              <div className="font-semibold text-gray-900 text-sm">₱{projectData.directContractAmount?.toLocaleString() || 'N/A'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Planned Start Date</div>
              <div className="font-semibold text-gray-900 text-sm">{projectData.plannedStartDate || 'N/A'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Planned End Date</div>
              <div className="font-semibold text-gray-900 text-sm">{projectData.plannedEndDate || 'N/A'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Actual Start Date</div>
              <div className="font-semibold text-gray-900 text-sm">{projectData.actualStartDate || 'N/A'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Actual End Date</div>
              <div className="font-semibold text-gray-900 text-sm">{projectData.actualEndDate || 'N/A'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Calendar Days</div>
              <div className="font-semibold text-gray-900 text-sm">{projectData.calendarDays || 'N/A'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Working Days</div>
              <div className="font-semibold text-gray-900 text-sm">{projectData.workingDays || 'N/A'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">PM Name</div>
              <div className="font-semibold text-gray-900 text-sm">{projectData.pmName}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Site Engineer</div>
              <div className="font-semibold text-gray-900 text-sm">{projectData.siteEngineer}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Priority Level</div>
              <div className="font-semibold text-gray-900 text-sm">{projectData.priorityLevel || 'N/A'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Remarks</div>
              <div className="font-semibold text-gray-900 text-sm">{projectData.remarks || 'N/A'}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Photos on the right */}
      <div className="lg:col-span-2 flex flex-col gap-4 lg:gap-6 mt-4 lg:mt-6">
        {/* Target Project Photo */}
        <Card className="overflow-hidden shadow-sm border border-gray-100">
          <CardHeader>
            <CardTitle className="text-arsd-red text-sm lg:text-base font-bold tracking-wide">Target Project Photo</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center items-center bg-gray-50 py-4 lg:py-6">
            <img src="/images/dashboard-reference.png" alt="Project Target" className="rounded-lg shadow-md max-h-48 lg:max-h-64 w-full object-cover" />
          </CardContent>
        </Card>
        {/* Progress Photos Gallery */}
        <Card className="overflow-hidden shadow-sm border border-gray-100">
          <CardHeader>
            <CardTitle className="text-arsd-red text-sm lg:text-base font-bold tracking-wide">Progress Photos</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4 py-4 lg:py-6">
            <img src="/images/reference1.png" alt="Progress 1" className="rounded-lg shadow max-h-32 lg:max-h-40 w-full object-cover" />
            <img src="/images/reference2.png" alt="Progress 2" className="rounded-lg shadow max-h-32 lg:max-h-40 w-full object-cover" />
            <img src="/images/reference3.png" alt="Progress 3" className="rounded-lg shadow max-h-32 lg:max-h-40 w-full object-cover" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
