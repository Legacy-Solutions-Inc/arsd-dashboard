
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line
} from 'recharts';

export interface CostMonth {
  month: string;
  target: number;
  swa: number;
  billed: number;
  direct: number;
}

export interface CostAnalysisProps {
  costData: CostMonth[];
  projectData: {
    actualProgress: number;
    targetProgress: number;
    savings: number;
  };
  sCurveData?: { date: string; total: number }[];
}

export function CostAnalysis({ costData, projectData, sCurveData }: CostAnalysisProps) {
  // Example S-curve data if not provided
  const defaultSCurveData = [
    { date: '2025-01-01', total: 0 },
    { date: '2025-01-15', total: 10 },
    { date: '2025-02-01', total: 20 },
    { date: '2025-02-15', total: 30 },
    { date: '2025-03-01', total: 40 },
    { date: '2025-03-15', total: 50 },
    { date: '2025-04-01', total: 60 },
    { date: '2025-04-15', total: 70 },
    { date: '2025-05-01', total: 80 },
    { date: '2025-05-15', total: 90 },
    { date: '2025-06-01', total: 100 },
  ];
  const chartSCurveData = sCurveData ?? defaultSCurveData;

  return (
    <Card className="border-l-4 border-l-arsd-red">

      <CardHeader>
        <CardTitle className="text-arsd-red">Cost Analysis Dashboard</CardTitle>
      </CardHeader>

      <CardContent>
        {/* Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">

          {/* Bar Chart */}
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <h3 className="font-semibold mb-2">Monthly Cost Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={costData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="target" name="Target Cost" fill="#2563eb" />
                <Bar dataKey="swa" name="SWA Cost" fill="#22c55e" />
                <Bar dataKey="billed" name="Billed Cost" fill="#f59e42" />
                <Bar dataKey="direct" name="Direct Cost" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* S-Curve Chart */}
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <h3 className="font-semibold mb-2">S-Curve</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartSCurveData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} />
                <Tooltip formatter={(value) => {
                  if (Array.isArray(value)) {
                    return value.map(v => `${v}%`).join(', ');
                  }
                  return `${value}%`;
                }} />
                <Legend />
                <Line type="monotone" dataKey="total" name="Total" stroke="#b91c1c" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Cost Breakdown Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-semibold mb-4">Monthly Cost Breakdown</h3>
            <div className="space-y-4">
              {costData.map((month) => (
                <div key={month.month} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between shadow-sm border">
                  <div>
                    <div className="font-semibold text-lg text-blue-700 mb-1">{month.month} 2024</div>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <span className="flex items-center gap-1 text-blue-600"><span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />Target: ₱{month.target.toLocaleString()}</span>
                      <span className="flex items-center gap-1 text-green-600"><span className="w-2 h-2 rounded-full bg-green-600 inline-block" />SWA: ₱{month.swa.toLocaleString()}</span>
                      <span className="flex items-center gap-1 text-orange-500"><span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />Billed: ₱{month.billed.toLocaleString()}</span>
                      <span className="flex items-center gap-1 text-red-600"><span className="w-2 h-2 rounded-full bg-red-600 inline-block" />Direct: ₱{month.direct.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="font-bold text-xl">₱{month.target.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Progress Analysis Section */}
          <div>
            <h3 className="font-semibold mb-4">Progress Analysis</h3>
            <div className="space-y-4">
              <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-4">
                <div className="font-bold text-red-600 mb-2">S-Curve Insights</div>
                <ul className="list-disc ml-5 text-sm text-red-700">
                  <li>Current progress: {projectData.actualProgress}% vs target {projectData.targetProgress}%</li>
                  <li>Project timeline on track with minor adjustments needed</li>
                  <li>Cost performance within acceptable variance</li>
                </ul>
              </div>
              <div className="bg-blue-50 border-l-4 border-blue-400 rounded-lg p-4">
                <div className="font-bold text-blue-600 mb-2">Cost Performance</div>
                <ul className="list-disc ml-5 text-sm text-blue-700">
                  <li>Total budget utilization: 65%</li>
                  <li>Projected savings: ₱{projectData.savings.toLocaleString()}</li>
                  <li>Monthly variance trending downward</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
