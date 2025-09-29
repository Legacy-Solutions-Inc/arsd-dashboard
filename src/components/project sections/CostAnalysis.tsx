
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useState, useMemo } from 'react';

export interface CostMonth {
  month: string;
  target: number;
  swa: number;
  billed: number;
  direct: number;
}

// Database cost data interface
export interface DatabaseCostMonth {
  month: string;
  target_cost?: number;
  swa_cost?: number;
  billed_cost?: number;
  direct_cost?: number;
}

export interface ManHoursData {
  date: string;
  actual_man_hours: number;
  projected_man_hours: number;
}

export interface CostAnalysisProps {
  costData: CostMonth[] | DatabaseCostMonth[];
  costItemsData?: any[];
  manHoursData?: ManHoursData[];
  projectData: {
    actualProgress: number;
    targetProgress: number;
    savings: number;
  };
}

// Constants
const ITEMS_PER_PAGE = 3;
const CHART_HEIGHT = 250;
const CHART_MARGIN = { top: 15, right: 20, left: 0, bottom: 5 };
const COST_ITEMS_MARGIN = { top: 15, right: 20, left: 40, bottom: 5 };

// Chart colors
const CHART_COLORS = {
  target: '#dc2626',
  swa: '#ec4899',
  billed: '#6b7280',
  direct: '#16a34a',
  actual: '#ef4444',
  projected: '#3b82f6',
  cost: '#8b5cf6'
} as const;

// Utility functions
const formatCurrency = (value: number): string => `₱${value.toLocaleString()}`;
const formatCurrencyM = (value: number): string => `₱${(value / 1000000).toFixed(1)}M`;
const formatHours = (value: number): string => `${value}h`;

const sortDataChronologically = <T extends { month: string }>(data: T[]): T[] => {
  return data.sort((a, b) => {
    if (!a.month && !b.month) return 0;
    if (!a.month) return 1;
    if (!b.month) return -1;
    
    const dateA = new Date(a.month);
    const dateB = new Date(b.month);
    
    if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
      return dateA.getTime() - dateB.getTime();
    }
    
    return a.month.localeCompare(b.month);
  });
};

const processCostItems = (items: any[]) => {
  const typeBreakdown = items.reduce((acc: any, item: any) => {
    const type = item.type || 'Unknown';
    const cost = parseFloat(item.cost) || 0;
    acc[type] = (acc[type] || 0) + cost;
    return acc;
  }, {});

  // Define preferred order with Target first
  const preferredOrder = ['Target', 'Equipment', 'Labor', 'Materials'];
  
  return Object.entries(typeBreakdown)
    .map(([type, cost]) => ({
      type,
      cost: cost as number
    }))
    .sort((a, b) => {
      const aIndex = preferredOrder.indexOf(a.type);
      const bIndex = preferredOrder.indexOf(b.type);
      
      // If both are in preferred order, sort by their position
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      
      // If only one is in preferred order, prioritize it
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      
      // If neither is in preferred order, sort alphabetically
      return a.type.localeCompare(b.type);
    });
};

export function CostAnalysis({ costData, costItemsData = [], manHoursData = [], projectData }: CostAnalysisProps) {
  const [currentPage, setCurrentPage] = useState(1);
  // Data processing with useMemo for performance
  const processedData = useMemo(() => {
    // Normalize cost data to handle both formats
    const normalizedCostData = costData.map((item: any, index: number) => ({
      id: `${item.month || item.month_name || item.period || `Month ${index + 1}`}-${index}`,
      month: item.month || item.month_name || item.period || `Month ${index + 1}`,
      target: item.target || item.target_cost || 0,
      swa: item.swa || item.swa_cost || 0,
      billed: item.billed || item.billed_cost || 0,
      direct: item.direct || item.direct_cost || 0,
    })).filter(item => item.month);

    // Sort data chronologically
    const sortedCostData = sortDataChronologically(normalizedCostData);

    // Process cost items
    const costItemsBreakdown = processCostItems(costItemsData);

    // Process man hours data
    const processedManHoursData = manHoursData.map((item: any) => ({
      date: item.date || item.period || 'Unknown',
      actual: parseFloat(item.actual_man_hours) || 0,
      projected: parseFloat(item.projected_man_hours) || 0,
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
      sortedCostData,
      costItemsBreakdown,
      processedManHoursData
    };
  }, [costData, costItemsData, manHoursData]);

  // Pagination logic
  const paginationData = useMemo(() => {
    const { sortedCostData } = processedData;
    const totalPages = Math.ceil(sortedCostData.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedCostData = sortedCostData.slice(startIndex, endIndex);

  return {
    totalPages,
    startIndex,
    endIndex,
    paginatedCostData
  };
}, [processedData, currentPage]);

// Subcomponents
const CostItemsChart = ({ data }: { data: any[] }) => (
  <div className="bg-white rounded-lg p-3 lg:p-4 shadow-sm border">
    <h3 className="font-semibold text-sm lg:text-base mb-2 text-arsd-red">Cost Items Breakdown</h3>
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <BarChart data={data} margin={COST_ITEMS_MARGIN}>
        <XAxis dataKey="type" tick={{ fontSize: 10 }} />
        <YAxis
          tick={{ fontSize: 10 }}
          tickFormatter={formatCurrencyM}
        />
        <Tooltip formatter={(value) => formatCurrency(value as number)} />
        <Bar dataKey="cost" name="Cost" fill={CHART_COLORS.cost} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

const ManHoursChart = ({ data }: { data: any[] }) => (
  <div className="bg-white rounded-lg p-3 lg:p-4 shadow-sm border">
    <h3 className="font-semibold text-sm lg:text-base mb-2 text-arsd-red">Man Hours Tracking</h3>
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <BarChart data={data} margin={CHART_MARGIN}>
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10 }}
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis
          tick={{ fontSize: 10 }}
          tickFormatter={formatHours}
        />
        <Tooltip
          formatter={(value, name) => [`${value} hours`, name]}
          labelFormatter={(label) => `Date: ${label}`}
        />
        <Legend />
        <Bar dataKey="actual" name="Actual Hours" fill={CHART_COLORS.actual} />
        <Bar dataKey="projected" name="Projected Hours" fill={CHART_COLORS.projected} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

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
  const totalActualHours = manHoursData.reduce((sum, item) => sum + item.actual, 0);
  const totalProjectedHours = manHoursData.reduce((sum, item) => sum + item.projected, 0);
  const efficiency = totalProjectedHours > 0 ? (totalActualHours / totalProjectedHours) * 100 : 0;

  return (
    <div>
      <h3 className="font-semibold text-sm lg:text-base mb-3 text-arsd-red">Progress Analysis</h3>
      <div className="space-y-3">
        <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-3 lg:p-4">
          <div className="font-bold text-red-600 mb-2 text-sm lg:text-base">Project Progress</div>
          <ul className="list-disc ml-4 lg:ml-5 text-xs lg:text-sm text-red-700 space-y-1">
            <li>Current progress: {projectData.actualProgress.toFixed(1)}%</li>
            <li>Target progress: {projectData.targetProgress.toFixed(1)}%</li>
            <li>Variance: {(projectData.actualProgress - projectData.targetProgress).toFixed(1)}%</li>
          </ul>
        </div>
        <div className="bg-blue-50 border-l-4 border-blue-400 rounded-lg p-3 lg:p-4">
          <div className="font-bold text-blue-600 mb-2 text-sm lg:text-base">Cost Performance</div>
          <ul className="list-disc ml-4 lg:ml-5 text-xs lg:text-sm text-blue-700 space-y-1">
            <li>Projected savings: {formatCurrency(projectData.savings)}</li>
            <li>Cost efficiency: {projectData.savings > 0 ? 'Above target' : 'Below target'}</li>
            <li>Budget utilization: {((projectData.actualProgress / 100) * 100).toFixed(1)}%</li>
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

  const { sortedCostData, costItemsBreakdown, processedManHoursData } = processedData;

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
          {costItemsBreakdown.length > 0 && (
            <CostItemsChart data={costItemsBreakdown} />
          )}
          {/* Man Hours Tracking */}
          {processedManHoursData.length > 0 && (
            <ManHoursChart data={processedManHoursData} />
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
