
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, ComposedChart
} from 'recharts';
import { memo, useState, useMemo } from 'react';
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
    billedCostTotal?: number;
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
const CostItemsChart = memo(({ data }: { data: any }) => {
  // Custom tooltip formatter to improve display
  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const combinedCost = (data.equipment || 0) + (data.labor || 0) + (data.materials || 0);
      
      return (
        <div className="bg-card p-3 border border-border rounded-md shadow-sm-tinted text-foreground">
          <p className="font-semibold text-sm mb-2">{label}</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-primary" aria-hidden></div>
                <span className="text-sm text-muted-foreground">Target Cost</span>
              </div>
              <span className="font-medium text-sm nums">{formatCurrency(data.target || 0)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-400 dark:bg-rose-500" aria-hidden></div>
                <span className="text-sm text-muted-foreground">SWA Cost</span>
              </div>
              <span className="font-medium text-sm nums">{formatCurrency(data.swa || 0)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground" aria-hidden></div>
                <span className="text-sm text-muted-foreground">Billed Cost</span>
              </div>
              <span className="font-medium text-sm nums">{formatCurrency(data.billed || 0)}</span>
            </div>
            <div className="border-t border-border pt-1 mt-2">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" aria-hidden></div>
                  <span className="text-sm text-muted-foreground">Combined Direct</span>
                </div>
                <span className="font-medium text-sm nums">{formatCurrency(combinedCost)}</span>
              </div>
              <div className="ml-4 text-xs text-muted-foreground mt-1 nums">
                <div>• Equipment: {formatCurrency(data.equipment || 0)}</div>
                <div>• Labor: {formatCurrency(data.labor || 0)}</div>
                <div>• Materials: {formatCurrency(data.materials || 0)}</div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-card rounded-md p-3 lg:p-4 border border-border">
      <h3 className="font-semibold text-sm text-foreground mb-2">Cost Items Breakdown</h3>
      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <BarChart 
          data={[
            {
              name: 'Cost Comparison',
              target: data.target,
              swa: data.swa,
              billed: data.billed,
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
          <Tooltip content={customTooltip} />
          <Legend />
          <Bar dataKey="target" name="Target Cost" stackId="target" fill={CHART_COLORS.target} />
          <Bar dataKey="swa" name="SWA Cost" stackId="swa" fill={CHART_COLORS.swa} />
          <Bar dataKey="billed" name="Billed Cost" stackId="billed" fill={CHART_COLORS.billed} />
          <Bar dataKey="equipment" name="Equipment" stackId="combined" fill={CHART_COLORS.equipment} />
          <Bar dataKey="labor" name="Labor" stackId="combined" fill={CHART_COLORS.labor} />
          <Bar dataKey="materials" name="Materials" stackId="combined" fill={CHART_COLORS.materials} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});
CostItemsChart.displayName = 'CostItemsChart';

const ManHoursChart = memo(({
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
    <div className="bg-card rounded-md p-3 lg:p-4 border border-border">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm text-foreground">
          Man Hours Tracking ({isMonthly ? 'Cumulative' : 'Daily Basis'})
        </h3>
        <div className="flex items-center gap-1 bg-muted border border-border rounded-md p-0.5">
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
});
ManHoursChart.displayName = 'ManHoursChart';

const MonthlyCostChart = memo(({ data }: { data: any[] }) => (
  <div className="bg-card rounded-md p-3 lg:p-4 border border-border">
    <h3 className="font-semibold text-sm text-foreground mb-2">Monthly Cost Comparison</h3>
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
));
MonthlyCostChart.displayName = 'MonthlyCostChart';


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
    <h3 className="font-semibold text-sm text-foreground mb-3">Monthly Cost Breakdown</h3>
    <div className="space-y-3">
      {data.map((month, index) => {
        const total = month.target + month.swa + month.billed + month.direct;
        return (
          <div key={month.id} className="bg-muted/40 rounded-md p-3 lg:p-4 flex flex-col sm:flex-row sm:items-center justify-between border border-border gap-2">
            <div className="flex-1">
              <div className="font-semibold text-sm lg:text-base text-foreground mb-1">
                {month.month || `Month ${paginationData.startIndex + index + 1}`}
              </div>
              <div className="flex flex-wrap gap-2 lg:gap-4 text-xs lg:text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5 nums">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" aria-hidden />
                  Target: <span className="text-foreground">{formatCurrency(month.target)}</span>
                </span>
                <span className="flex items-center gap-1.5 nums">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 dark:bg-rose-500 inline-block" aria-hidden />
                  SWA: <span className="text-foreground">{formatCurrency(month.swa)}</span>
                </span>
                <span className="flex items-center gap-1.5 nums">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground inline-block" aria-hidden />
                  Billed: <span className="text-foreground">{formatCurrency(month.billed)}</span>
                </span>
                <span className="flex items-center gap-1.5 nums">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" aria-hidden />
                  Direct: <span className="text-foreground">{formatCurrency(month.direct)}</span>
                </span>
              </div>
            </div>
            <div className="font-semibold text-sm lg:text-base text-foreground nums">{formatCurrency(total)}</div>
          </div>
        );
      })}
    </div>

    {/* Pagination Controls */}
    {paginationData.totalPages > 1 && (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-3 pt-3 border-t border-border gap-2">
        <div className="text-xs text-muted-foreground nums">
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
          <span className="text-xs text-muted-foreground nums">
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

const CostItemsSummary = ({ data, projectStats }: { data: any[], projectStats?: any }) => (
  <div>
    <h3 className="font-semibold text-sm text-foreground mb-3">Cost Items Summary</h3>
    <div className="space-y-3">
      {/* SWA Cost and Billed Cost Section */}
      <div className="bg-muted/40 border border-border rounded-md p-3 lg:p-4">
        <div className="font-semibold text-foreground mb-2 text-sm">Project costs</div>
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Target cost</span>
            <span className="font-semibold text-foreground nums">{formatCurrency(projectStats?.targetCostTotal || 0)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">SWA cost</span>
            <span className="font-semibold text-foreground nums">{formatCurrency(projectStats?.swaCostTotal || 0)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Billed cost</span>
            <span className="font-semibold text-foreground nums">{formatCurrency(projectStats?.billedCostTotal || 0)}</span>
          </div>
        </div>
      </div>

      {data.length > 0 && (
        <div className="bg-muted/40 border border-border rounded-md p-3 lg:p-4">
          <div className="font-semibold text-foreground mb-2 text-sm">Cost items breakdown</div>
          <div className="space-y-1.5">
            {data.slice(0, 8).map((item, index) => (
              <div key={`cost-item-${item.type}-${index}`} className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{item.type}</span>
                <span className="font-semibold text-foreground nums">{formatCurrency(item.cost)}</span>
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
      <h3 className="font-semibold text-sm text-foreground mb-3">Progress Analysis</h3>
      <div className="space-y-3">
        <div className="bg-muted/40 border border-border rounded-md p-3 lg:p-4">
          <div className="font-semibold text-foreground mb-2 text-sm">Project progress</div>
          <ul className="list-disc ml-5 text-sm text-muted-foreground space-y-1 nums">
            <li>Current progress: <span className="text-foreground">{projectData.actualProgress.toFixed(2)}%</span></li>
            <li>Target progress: <span className="text-foreground">{projectData.targetProgress.toFixed(2)}%</span></li>
            <li>Variance: <span className="text-foreground">{progressVariance.toFixed(2)}%</span></li>
          </ul>
        </div>
        <div className="bg-muted/40 border border-border rounded-md p-3 lg:p-4">
          <div className="font-semibold text-foreground mb-2 text-sm">Cost performance</div>
          <ul className="list-disc ml-5 text-sm text-muted-foreground space-y-1 nums">
            <li>Projected savings: <span className="text-foreground">{formatCurrency(projectData.savings)}</span></li>
            <li>Cost efficiency: <span className="text-foreground">{costEfficiency}</span></li>
            <li>Budget utilization: <span className="text-foreground">{budgetUtilization.toFixed(2)}%</span></li>
          </ul>
        </div>
        {manHoursData.length > 0 && (
          <div className="bg-muted/40 border border-border rounded-md p-3 lg:p-4">
            <div className="font-semibold text-foreground mb-2 text-sm">Man hours summary</div>
            <ul className="list-disc ml-5 text-sm text-muted-foreground space-y-1 nums">
              <li>Total actual hours: <span className="text-foreground">{totalActualHours.toFixed(1)}h</span></li>
              <li>Total projected hours: <span className="text-foreground">{totalProjectedHours.toFixed(2)}h</span></li>
              <li>Efficiency: <span className="text-foreground">{efficiency.toFixed(2)}%</span></li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

  // Data is already processed above

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold text-foreground">Cost analysis</CardTitle>
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
          <CostItemsSummary data={costItemsBreakdown} projectStats={projectStats} />
          <ProgressAnalysis 
            projectData={projectData} 
            manHoursData={processedManHoursData} 
          />
        </div>
      </CardContent>
    </Card>
  );
}
