import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface ProjectOverviewProps {
  projectData: {
    projectId: string;
    client: string;
    contractor: string;
    location: string;
    pmName: string;
    siteEngineer: string;
    actualProgress: number;
    targetProgress: number;
    slippage: number;
    balance: number;
    collectible: number;
    contractAmount: number;
    savings: number;
  };
  costData: any[];
}

export function ProjectOverview({ projectData, costData }: ProjectOverviewProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Project Information */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Project Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-sm text-gray-600">Project ID</div>
            <div className="font-medium">{projectData.projectId}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Client</div>
            <div className="font-medium">{projectData.client}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Contractor</div>
            <div className="font-medium">{projectData.contractor}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Location</div>
            <div className="font-medium">{projectData.location}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">PM Name</div>
            <div className="font-medium">{projectData.pmName}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Site Engineer</div>
            <div className="font-medium">{projectData.siteEngineer}</div>
          </div>
        </CardContent>
      </Card>
      {/* ...Progress Overview and charts can be added here or in a separate component... */}
    </div>
  );
}
