
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, ComposedChart
} from 'recharts';
import { useState, useMemo } from 'react';
import { Calendar, BarChart3 } from 'lucide-react';
import { 
  processCostAnalysisData,
  calculateCostAnalysisPagination,
  formatCurrency,
  formatCurrencyM,
  formatHours,
  formatDateLabel,
  calculateProgressAnalysis,
  calculateCostSummaryStats,
  CHART_COLORS,
  CHART_HEIGHT,
  CHART_HEIGHT_DAILY,
  CHART_MARGIN,
  COST_ITEMS_MARGIN,
  ITEMS_PER_PAGE
} from "@/utils/cost-analysis-utils";

// Interfaces and utility functions are now imported from utils file

export interface CostAnalysisProps {
  costData: any[];
  costItemsData?: any[];
  manHoursData?: any[];
  projectData: {
    actualProgress: number;
    targetProgress: number;
    savings: number;
  };
  projectStats?: {
    contractAmount: number;
    targetCostTotal: number;
    directCostTotal: number;
    swaCostTotal: number;
  };
}

export function CostAnalysis({ costData, costItemsData = [], manHoursData = [], projectData, projectStats }: CostAnalysisProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [manHoursView, setManHoursView] = useState<'monthly' | 'daily'>('monthly');

  // Process all cost analysis data using utility functions
  const {
    sortedCostData,
    costItemsBreakdown,
    costItemsStackedData,
    processedManHoursData,
    dailyManHoursData
  } = useMemo(() => {
    return processCostAnalysisData(costData, costItemsData, manHoursData, projectStats);
  }, [costData, costItemsData, manHoursData, projectStats]);

  // Calculate pagination using utility function
  const paginationData = useMemo(() => {
    return calculateCostAnalysisPagination(sortedCostData, currentPage, ITEMS_PER_PAGE);
  }, [sortedCostData, currentPage]);

// Subcomponents
const CostItemsChart = ({ data }: { data: any }) => (
  <div className="bg-white rounded-lg p-3 lg:p-4 shadow-sm border">
    <h3 className="font-semibold text-sm lg:text-base mb-2 text-arsd-red">Cost Items Breakdown</h3>
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <BarChart 
        data={[
          {
            name: 'Target vs Combined Costs',
            target: data.target,
            equipment: data.equipment,
            labor: data.labor,
            materials: data.materials
          }
        ]} 
        margin={COST_ITEMS_MARGIN}
      >
        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
        <YAxis
          tick={{ fontSize: 10 }}
          tickFormatter={formatCurrencyM}
        />
        <Tooltip 
          formatter={(value, name) => [formatCurrency(value as number), name]}
          labelFormatter={() => 'Cost Comparison'}
        />
        <Legend />
        <Bar dataKey="target" name="Target Cost" stackId="target" fill={CHART_COLORS.target} />
        <Bar dataKey="equipment" name="Equipment" stackId="combined" fill={CHART_COLORS.equipment} />
        <Bar dataKey="labor" name="Labor" stackId="combined" fill={CHART_COLORS.labor} />
        <Bar dataKey="materials" name="Materials" stackId="combined" fill={CHART_COLORS.materials} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

const ManHoursChart = ({ 
  monthlyData, 
  dailyData, 
  view, 
  onViewChange 
}: { 
  monthlyData: any[]; 
  dailyData: any[]; 
  view: 'monthly' | 'daily'; 
  onViewChange: (view: 'monthly' | 'daily') => void;
}) => {
  // Format date for better display
  const formatDateLabel = (dateStr: string, isMonthly: boolean = false) => {
    try {
      if (isMonthly) {
        const date = new Date(dateStr + '-01'); // Add day to make valid date
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      } else {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    } catch {
      return dateStr;
    }
  };

  const currentData = view === 'monthly' ? monthlyData : dailyData;
  const isMonthly = view === 'monthly';
  
  // For daily view, transform data to show persons instead of hours
  const chartData = isMonthly ? currentData : currentData.map(item => ({
    ...item,
    actual: item.actualPersons || 0,
    projected: item.projectedPersons || 0
  }));

  return (
    <div className="bg-white rounded-lg p-3 lg:p-4 shadow-sm border">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm lg:text-base text-arsd-red">
          Man Hours Tracking ({isMonthly ? 'Cumulative' : 'Daily Basis'})
        </h3>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <Button
            variant={view === 'monthly' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewChange('monthly')}
            className="h-7 px-2 text-xs"
          >
            <BarChart3 className="h-3 w-3 mr-1" />
            Cumulative
          </Button>
          <Button
            variant={view === 'daily' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewChange('daily')}
            className="h-7 px-2 text-xs"
          >
            <Calendar className="h-3 w-3 mr-1" />
            Daily Basis
          </Button>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={isMonthly ? CHART_HEIGHT : CHART_HEIGHT_DAILY}>
        <BarChart data={chartData} margin={{ top: 15, right: 20, left: 0, bottom: isMonthly ? 40 : 40 }}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: isMonthly ? 10 : 9 }}
            angle={-45}
            textAnchor="end"
            height={isMonthly ? 80 : 120}
            interval={isMonthly ? 0 : Math.max(1, Math.floor(chartData.length / 15))}
            tickFormatter={(value) => formatDateLabel(value, isMonthly)}
          />
          <YAxis
            tick={{ fontSize: 10 }}
            tickFormatter={isMonthly ? formatHours : (value) => `${Math.round(value)} pax`}
          />
          <Tooltip
            formatter={(value, name) => {
              if (isMonthly) {
                return [`${Math.round(Number(value))} hours`, name];
              } else {
                // For daily view, show pax
                const pax = Math.round(Number(value));
                const hours = pax * 8;
                return [`${pax} pax (${hours} hours)`, name];
              }
            }}
            labelFormatter={(label) => `Period: ${formatDateLabel(label, isMonthly)}`}
          />
          <Legend />
          <Bar 
            dataKey="actual" 
            name={isMonthly ? "Actual Hours" : "Daily Actual Pax"} 
            fill={CHART_COLORS.actual} 
            maxBarSize={isMonthly ? 60 : 40}
            radius={[2, 2, 0, 0]}
          />
          <Bar 
            dataKey="projected" 
            name={isMonthly ? "Projected Hours" : "Daily Projected Pax"} 
            fill={CHART_COLORS.projected} 
            maxBarSize={isMonthly ? 60 : 40}
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const MonthlyCostChart = ({ data }: { data: any[] }) => (
  <div className="bg-white rounded-lg p-3 lg:p-4 shadow-sm border">
    <h3 className="font-semibold text-sm lg:text-base mb-2 text-arsd-red">Monthly Cost Comparison</h3>
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <BarChart data={data} margin={CHART_MARGIN}>
        <XAxis
          dataKey="month"
          tick={{ fontSize: 10 }}
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis
          tick={{ fontSize: 10 }}
          tickFormatter={formatCurrencyM}
        />
        <Tooltip
          formatter={(value, name) => [formatCurrency(value as number), name]}
          labelFormatter={(label) => `Period: ${label}`}
        />
        <Legend />
        <Bar dataKey="target" name="Target Cost" fill={CHART_COLORS.target} />
        <Bar dataKey="swa" name="SWA Cost" fill={CHART_COLORS.swa} />
        <Bar dataKey="billed" name="Billed Cost" fill={CHART_COLORS.billed} />
        <Bar dataKey="direct" name="Direct Cost" fill={CHART_COLORS.direct} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);


const MonthlyCostBreakdown = ({ 
  data, 
  paginationData, 
  onPageChange 
}: { 
  data: any[], 
  paginationData: any, 
  onPageChange: (page: number) => void 
}) => {
  const currentPage = Math.floor(paginationData.startIndex / ITEMS_PER_PAGE) + 1;
  
  return (
  <div>
    <h3 className="font-semibold text-sm lg:text-base mb-3 text-arsd-red">Monthly Cost Breakdown</h3>
    <div className="space-y-3">
      {data.map((month, index) => {
        const total = month.target + month.swa + month.billed + month.direct;
        return (
          <div key={month.id} className="bg-gray-50 rounded-lg p-3 lg:p-4 flex flex-col sm:flex-row sm:items-center justify-between shadow-sm border gap-2">
            <div className="flex-1">
              <div className="font-semibold text-sm lg:text-base text-black mb-1">
                {month.month || `Month ${paginationData.startIndex + index + 1}`}
              </div>
              <div className="flex flex-wrap gap-2 lg:gap-4 text-xs lg:text-sm">
                <span className="flex items-center gap-1 text-red-600">
                  <span className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-red-600 inline-block" />
                  Target: {formatCurrency(month.target)}
                </span>
                <span className="flex items-center gap-1 text-pink-500">
                  <span className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-pink-500 inline-block" />
                  SWA: {formatCurrency(month.swa)}
                </span>
                <span className="flex items-center gap-1 text-gray-600">
                  <span className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-gray-600 inline-block" />
                  Billed: {formatCurrency(month.billed)}
                </span>
                <span className="flex items-center gap-1 text-green-600">
                  <span className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-green-600 inline-block" />
                  Direct: {formatCurrency(month.direct)}
                </span>
              </div>
            </div>
            <div className="font-bold text-sm lg:text-base">{formatCurrency(total)}</div>
          </div>
        );
      })}
    </div>

    {/* Pagination Controls */}
    {paginationData.totalPages > 1 && (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-3 pt-3 border-t gap-2">
        <div className="text-xs text-gray-600">
          Showing {paginationData.startIndex + 1} to {Math.min(paginationData.endIndex, data.length)} of {data.length} months
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="text-xs h-7 px-2"
          >
            Previous
          </Button>
          <span className="text-xs text-gray-600">
            Page {currentPage} of {paginationData.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === paginationData.totalPages}
            className="text-xs h-7 px-2"
          >
            Next
          </Button>
        </div>
      </div>
    )}
  </div>
  );
};

const CostItemsSummary = ({ data }: { data: any[] }) => (
  <div>
    <h3 className="font-semibold text-sm lg:text-base mb-3 text-arsd-red">Cost Items Summary</h3>
    <div className="space-y-3">
      {data.length > 0 && (
        <div className="bg-purple-50 border-l-4 border-purple-400 rounded-lg p-3 lg:p-4">
          <div className="font-bold text-purple-600 mb-2 text-sm lg:text-base">Cost Items Breakdown</div>
          <div className="space-y-2">
            {data.slice(0, 8).map((item, index) => (
              <div key={`cost-item-${item.type}-${index}`} className="flex justify-between items-center text-xs lg:text-sm">
                <span className="text-purple-700">{item.type}</span>
                <span className="font-semibold text-purple-800">{formatCurrency(item.cost)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  </div>
);

const ProgressAnalysis = ({ 
  projectData, 
  manHoursData 
}: { 
  projectData: any, 
  manHoursData: any[] 
}) => {
  const {
    totalActualHours,
    totalProjectedHours,
    efficiency,
    progressVariance,
    budgetUtilization,
    costEfficiency
  } = calculateProgressAnalysis(projectData, manHoursData);

  return (
    <div>
      <h3 className="font-semibold text-sm lg:text-base mb-3 text-arsd-red">Progress Analysis</h3>
      <div className="space-y-3">
        <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-3 lg:p-4">
          <div className="font-bold text-red-600 mb-2 text-sm lg:text-base">Project Progress</div>
          <ul className="list-disc ml-4 lg:ml-5 text-xs lg:text-sm text-red-700 space-y-1">
            <li>Current progress: {projectData.actualProgress.toFixed(1)}%</li>
            <li>Target progress: {projectData.targetProgress.toFixed(1)}%</li>
            <li>Variance: {progressVariance.toFixed(1)}%</li>
          </ul>
        </div>
        <div className="bg-blue-50 border-l-4 border-blue-400 rounded-lg p-3 lg:p-4">
          <div className="font-bold text-blue-600 mb-2 text-sm lg:text-base">Cost Performance</div>
          <ul className="list-disc ml-4 lg:ml-5 text-xs lg:text-sm text-blue-700 space-y-1">
            <li>Projected savings: {formatCurrency(projectData.savings)}</li>
            <li>Cost efficiency: {costEfficiency}</li>
            <li>Budget utilization: {budgetUtilization.toFixed(1)}%</li>
          </ul>
        </div>
        {manHoursData.length > 0 && (
          <div className="bg-green-50 border-l-4 border-green-400 rounded-lg p-3 lg:p-4">
            <div className="font-bold text-green-600 mb-2 text-sm lg:text-base">Man Hours Summary</div>
            <ul className="list-disc ml-4 lg:ml-5 text-xs lg:text-sm text-green-700 space-y-1">
              <li>Total actual hours: {totalActualHours.toFixed(1)}h</li>
              <li>Total projected hours: {totalProjectedHours.toFixed(1)}h</li>
              <li>Efficiency: {efficiency.toFixed(1)}%</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

  // Data is already processed above

  return (
    <Card className="border-l-4 border-l-arsd-red mt-4 lg:mt-6">
      <CardHeader>
        <CardTitle className="text-arsd-red text-sm lg:text-lg font-bold">Cost Analysis Dashboard</CardTitle>
      </CardHeader>

      <CardContent>
        {/* Monthly Cost Comparison - Full Width */}
        <div className="mb-6 lg:mb-8">
          <MonthlyCostChart data={sortedCostData} />
        </div>

        {/* Charts Section - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-6 lg:mb-8">
          {/* Cost Items Breakdown */}
          {costItemsStackedData && (
            <CostItemsChart data={costItemsStackedData} />
          )}
          {/* Man Hours Tracking */}
          {(processedManHoursData.length > 0 || dailyManHoursData.length > 0) && (
            <ManHoursChart 
              monthlyData={processedManHoursData} 
              dailyData={dailyManHoursData}
              view={manHoursView}
              onViewChange={setManHoursView}
            />
          )}
        </div>

        {/* Detailed Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          <MonthlyCostBreakdown 
            data={paginationData.paginatedCostData} 
            paginationData={paginationData}
            onPageChange={setCurrentPage}
          />
          <CostItemsSummary data={costItemsBreakdown} />
          <ProgressAnalysis 
            projectData={projectData} 
            manHoursData={processedManHoursData} 
          />
        </div>
      </CardContent>
    </Card>
  );
}
