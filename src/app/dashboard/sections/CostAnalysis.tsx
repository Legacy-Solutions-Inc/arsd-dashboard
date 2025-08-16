import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Image from "next/image";

interface CostMonth {
  month: string;
  target: number;
  swa: number;
  billed: number;
  direct: number;
}

interface CostAnalysisProps {
  costData: CostMonth[];
  projectData: {
    actualProgress: number;
    targetProgress: number;
    savings: number;
  };
}

export function CostAnalysis({ costData, projectData }: CostAnalysisProps) {
  return (
    <Card className="border-l-4 border-l-arsd-red">
      <CardHeader>
        <CardTitle className="text-arsd-red">Cost Analysis Dashboard</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center mb-6">
          <Image
            src="/images/chart-reference.png"
            alt="Detailed Cost Analysis Charts"
            width={900}
            height={700}
            className="rounded-lg border shadow-sm"
          />
        </div>
        {/* ...Monthly cost breakdown and progress analysis can be added here... */}
      </CardContent>
    </Card>
  );
}
