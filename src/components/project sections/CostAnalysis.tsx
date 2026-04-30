
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, ComposedChart, ReferenceLine
} from 'recharts';
import type { ProgressTrendPoint } from '@/services/projects/project-details.service';
import { memo, useState, useMemo } from 'react';
import { Calendar, BarChart3 } from 'lucide-react';
import {
  processCostAnalysisData,
  calculateCostAnalysisPagination,
  formatCurrency,
  formatCurrencyM,
  formatHours,
  calculateProgressAnalysis,
  calculateForecastAtCompletion,
  calculateCPISPITrend,
  calculateCashConversionTrend,
  calculateProductivityTrend,
  type CPISPIDatum,
  type CashConversionDatum,
  type ProductivityDatum,
  type ForecastAtCompletion as ForecastAtCompletionData,
  CHART_COLORS,
  CHART_HEIGHT,
  CHART_HEIGHT_DAILY,
  CHART_MARGIN,
  COST_ITEMS_MARGIN,
  ITEMS_PER_PAGE,
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
  /**
   * Historical progress trend across all approved+parsed accomplishment reports.
   * Optional so the slippage chart can render its empty state if undefined.
   */
  progressTrend?: ProgressTrendPoint[];
}

export function CostAnalysis({ costData, costItemsData = [], manHoursData = [], projectData, projectStats, progressTrend = [] }: CostAnalysisProps) {
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

  // Derived series for the new CEO-tier visualizations.
  const cpiSpiTrend = useMemo(
    () => calculateCPISPITrend(sortedCostData),
    [sortedCostData],
  );
  const cashConversionTrend = useMemo(
    () => calculateCashConversionTrend(sortedCostData),
    [sortedCostData],
  );
  const productivityTrend = useMemo(
    () => calculateProductivityTrend(sortedCostData, processedManHoursData),
    [sortedCostData, processedManHoursData],
  );

// Subcomponents

/**
 * Forecast at Completion vs. Contract — the headline chart of the tab.
 *
 * A horizontal CSS-based bullet: the bar = projected total cost (EAC),
 * the vertical tick = contract amount. Bar is green when EAC ≤ contract
 * (projected savings) and red when EAC > contract (projected overrun).
 * Empty-state placeholder when CPI cannot be computed.
 */
const ForecastAtCompletion = memo(({ projectStats }: {
  projectStats?: { contractAmount?: number; swaCostTotal?: number; directCostTotal?: number };
}) => {
  const fac: ForecastAtCompletionData = useMemo(
    () => calculateForecastAtCompletion(projectStats),
    [projectStats],
  );

  if (!fac.isFinite) {
    return (
      <div className="bg-card rounded-md p-4 lg:p-5 border border-border">
        <h3 className="font-semibold text-sm text-foreground mb-1">Forecast at Completion vs. Contract</h3>
        <p className="text-sm text-muted-foreground">Forecast available once direct cost is recorded.</p>
      </div>
    );
  }

  const contract = projectStats?.contractAmount ?? 0;
  const max = Math.max(fac.eac, contract) * 1.1; // 10% headroom so the contract tick isn't pinned to the right edge
  const eacPct = max > 0 ? (fac.eac / max) * 100 : 0;
  const contractPct = max > 0 ? (contract / max) * 100 : 0;
  const isUnderBudget = fac.vac >= 0;
  const variance = Math.abs(fac.vac);
  const variancePct = Math.abs(fac.vacPct);
  const barColor = isUnderBudget ? 'bg-emerald-500' : 'bg-destructive';
  const headlineColor = isUnderBudget ? 'text-emerald-700 dark:text-emerald-400' : 'text-destructive';

  return (
    <div className="bg-card rounded-md p-4 lg:p-5 border border-border">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between mb-3">
        <h3 className="font-semibold text-sm text-foreground">Forecast at Completion vs. Contract</h3>
        <div className="flex items-baseline gap-2">
          <span className={`text-base lg:text-lg font-display nums ${headlineColor}`}>
            {formatCurrency(variance)} {isUnderBudget ? 'under' : 'over'} budget
          </span>
          <span className="text-xs text-muted-foreground nums">
            ({isUnderBudget ? '−' : '+'}{variancePct.toFixed(1)}% of contract)
          </span>
        </div>
      </div>
      <div
        className="relative h-8 bg-muted rounded-md overflow-hidden"
        role="img"
        aria-label={`Forecast at completion ${formatCurrency(fac.eac)} vs. contract ${formatCurrency(contract)}`}
      >
        <div
          className={`absolute inset-y-0 left-0 ${barColor} transition-[width] duration-500`}
          style={{ width: `${Math.min(100, Math.max(0, eacPct))}%` }}
        />
        <div
          className="absolute inset-y-0 w-0.5 bg-foreground/80"
          style={{ left: `${Math.min(100, Math.max(0, contractPct))}%` }}
          title={`Contract: ${formatCurrency(contract)}`}
        />
      </div>
      <div className="flex justify-between mt-2 text-[11px] text-muted-foreground">
        <span className="nums">EAC: {formatCurrency(fac.eac)} (CPI {fac.cpi.toFixed(2)})</span>
        <span className="nums">Contract: {formatCurrency(contract)}</span>
      </div>
    </div>
  );
});
ForecastAtCompletion.displayName = 'ForecastAtCompletion';

/**
 * Cost & Schedule Performance Index trend.
 * Two lines plus a 1.0 reference line; tooltip surfaces a one-word verdict per series.
 */
const CPISPITrendChart = memo(({ data }: { data: CPISPIDatum[] }) => {
  if (data.length < 2) {
    return (
      <div className="bg-card rounded-md p-3 lg:p-4 border border-border">
        <h3 className="font-semibold text-sm text-foreground mb-1">Cost &amp; Schedule Performance Index</h3>
        <p className="text-sm text-muted-foreground">Trend appears after 2 months of data.</p>
      </div>
    );
  }

  const verdict = (v: number) => (v >= 1.05 ? 'Above target' : v >= 0.95 ? 'On target' : 'Below target');

  const customTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const cpi = payload.find((p: any) => p.dataKey === 'cpi')?.value ?? 0;
    const spi = payload.find((p: any) => p.dataKey === 'spi')?.value ?? 0;
    return (
      <div className="bg-card p-3 border border-border rounded-md shadow-sm-tinted text-foreground text-sm">
        <p className="font-semibold mb-2">{label}</p>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">CPI: <span className="nums text-foreground">{cpi.toFixed(2)}</span></span>
            <span className="text-xs text-muted-foreground">{verdict(cpi)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">SPI: <span className="nums text-foreground">{spi.toFixed(2)}</span></span>
            <span className="text-xs text-muted-foreground">{verdict(spi)}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-card rounded-md p-3 lg:p-4 border border-border">
      <h3 className="font-semibold text-sm text-foreground mb-2">Cost &amp; Schedule Performance Index</h3>
      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <LineChart data={data} margin={CHART_MARGIN}>
          <XAxis dataKey="month" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
          <YAxis tick={{ fontSize: 10 }} domain={[0, 'auto']} />
          <Tooltip content={customTooltip} />
          <Legend />
          <ReferenceLine
            y={1}
            stroke={CHART_COLORS.billed}
            strokeDasharray="3 3"
            label={{ value: 'On target', position: 'right', fontSize: 10, fill: CHART_COLORS.billed }}
          />
          <Line
            type="monotone"
            dataKey="cpi"
            name="CPI (cost)"
            stroke={CHART_COLORS.target}
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="spi"
            name="SPI (schedule)"
            stroke={CHART_COLORS.swa}
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});
CPISPITrendChart.displayName = 'CPISPITrendChart';

/**
 * Cash Conversion: Earned (SWA) vs. Billed vs. Spent (Direct), cumulative.
 * Replaces the prior Monthly Cost Comparison bar chart at the top of the tab.
 * Tooltip surfaces unbilled gap (Earned − Billed) and cash float (Billed − Spent).
 */
const CashConversionChart = memo(({ data }: { data: CashConversionDatum[] }) => {
  if (data.length === 0) {
    return (
      <div className="bg-card rounded-md p-3 lg:p-4 border border-border">
        <h3 className="font-semibold text-sm text-foreground mb-1">Cash Conversion: Earned vs. Billed vs. Spent</h3>
        <p className="text-sm text-muted-foreground">No monthly cost data yet — upload an accomplishment report to see cash conversion.</p>
      </div>
    );
  }

  const customTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const datum = payload[0]?.payload as CashConversionDatum | undefined;
    if (!datum) return null;
    const unbilled = datum.cumSwa - datum.cumBilled;
    const float = datum.cumBilled - datum.cumDirect;
    return (
      <div className="bg-card p-3 border border-border rounded-md shadow-sm-tinted text-foreground text-sm">
        <p className="font-semibold mb-2">{label}</p>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS.swa }} aria-hidden />
              <span className="text-muted-foreground">Earned (SWA)</span>
            </div>
            <span className="font-medium nums">{formatCurrency(datum.cumSwa)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS.billed }} aria-hidden />
              <span className="text-muted-foreground">Billed</span>
            </div>
            <span className="font-medium nums">{formatCurrency(datum.cumBilled)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS.direct }} aria-hidden />
              <span className="text-muted-foreground">Spent (Direct)</span>
            </div>
            <span className="font-medium nums">{formatCurrency(datum.cumDirect)}</span>
          </div>
          <div className="border-t border-border pt-1 mt-2 space-y-0.5 text-xs">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Unbilled (Earned − Billed)</span>
              <span className="nums">{formatCurrency(unbilled)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Cash float (Billed − Spent)</span>
              <span className="nums">{formatCurrency(float)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-card rounded-md p-3 lg:p-4 border border-border">
      <h3 className="font-semibold text-sm text-foreground mb-2">Cash Conversion: Earned vs. Billed vs. Spent</h3>
      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <AreaChart data={data} margin={CHART_MARGIN}>
          <XAxis dataKey="month" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
          <YAxis tick={{ fontSize: 10 }} tickFormatter={formatCurrencyM} />
          <Tooltip content={customTooltip} />
          <Legend />
          <Area
            type="monotone"
            dataKey="cumSwa"
            name="Earned (SWA)"
            stroke={CHART_COLORS.swa}
            fill={CHART_COLORS.swa}
            fillOpacity={0.25}
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="cumBilled"
            name="Billed"
            stroke={CHART_COLORS.billed}
            fill={CHART_COLORS.billed}
            fillOpacity={0.25}
            strokeWidth={2}
            strokeDasharray="5 3"
          />
          <Area
            type="monotone"
            dataKey="cumDirect"
            name="Spent (Direct)"
            stroke={CHART_COLORS.direct}
            fill={CHART_COLORS.direct}
            fillOpacity={0.25}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});
CashConversionChart.displayName = 'CashConversionChart';

/**
 * Labor Productivity Trend — pesos earned per actual labor hour, monthly.
 * Reference line at the project-to-date mean for visual context.
 */
const LaborProductivityChart = memo(({ trend }: {
  trend: { data: ProductivityDatum[]; mean: number };
}) => {
  if (trend.data.length === 0) {
    return (
      <div className="bg-card rounded-md p-3 lg:p-4 border border-border">
        <h3 className="font-semibold text-sm text-foreground mb-1">Labor Productivity Trend</h3>
        <p className="text-sm text-muted-foreground">Productivity trend appears once man-hours are reported.</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-md p-3 lg:p-4 border border-border">
      <div className="flex items-baseline justify-between mb-1">
        <h3 className="font-semibold text-sm text-foreground">Labor Productivity Trend</h3>
        <span className="text-[11px] text-muted-foreground nums">Mean {formatCurrency(trend.mean)}/hr</span>
      </div>
      <p className="text-xs text-muted-foreground mb-2">Pesos earned (SWA) per actual labor hour, by month.</p>
      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <LineChart data={trend.data} margin={CHART_MARGIN}>
          <XAxis dataKey="month" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
          <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => `₱${Math.round(v).toLocaleString('en-PH')}`} />
          <Tooltip
            formatter={(value: any) => [`${formatCurrency(value)}/hr`, 'Productivity']}
            labelFormatter={(label) => `Period: ${label}`}
          />
          <Legend />
          {trend.mean > 0 && (
            <ReferenceLine
              y={trend.mean}
              stroke={CHART_COLORS.billed}
              strokeDasharray="3 3"
              label={{ value: 'Mean', position: 'right', fontSize: 10, fill: CHART_COLORS.billed }}
            />
          )}
          <Line
            type="monotone"
            dataKey="productivity"
            name="₱ / hour"
            stroke={CHART_COLORS.actual}
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});
LaborProductivityChart.displayName = 'LaborProductivityChart';

/**
 * Schedule Slippage Trend.
 *
 * Plots actualProgress − targetProgress per accomplishment report. A horizontal
 * reference line at 0 separates "ahead of plan" (positive, green-tinted area)
 * from "behind plan" (negative, red-tinted area). Two stacked Areas in a
 * ComposedChart implement the split fill — Recharts has no native sign-aware
 * Area, so we precompute slippagePos = max(slippage, 0) and slippageNeg =
 * min(slippage, 0) and render them with their respective fills.
 */
const SlippageTrendChart = memo(({ data }: { data: ProgressTrendPoint[] }) => {
  if (data.length < 2) {
    return (
      <div className="bg-card rounded-md p-3 lg:p-4 border border-border">
        <h3 className="font-semibold text-sm text-foreground mb-1">Schedule Slippage Trend</h3>
        <p className="text-sm text-muted-foreground">Slippage trend appears after the second accomplishment report.</p>
      </div>
    );
  }

  const chartData = data.map((p) => ({
    week_ending_date: p.week_ending_date,
    label: new Date(p.week_ending_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
    slippage: p.slippage,
    slippagePos: p.slippage > 0 ? p.slippage : 0,
    slippageNeg: p.slippage < 0 ? p.slippage : 0,
    actualProgress: p.actualProgress,
    targetProgress: p.targetProgress,
  }));

  const customTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const datum = payload[0]?.payload;
    if (!datum) return null;
    const ahead = datum.slippage >= 0;
    return (
      <div className="bg-card p-3 border border-border rounded-md shadow-sm-tinted text-foreground text-sm">
        <p className="font-semibold mb-2">{label}</p>
        <div className="space-y-1">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Slippage</span>
            <span className={`font-medium nums ${ahead ? 'text-emerald-700 dark:text-emerald-400' : 'text-destructive'}`}>
              {ahead ? '+' : ''}{datum.slippage.toFixed(2)}%
            </span>
          </div>
          <div className="flex justify-between gap-4 text-xs text-muted-foreground">
            <span>Actual: <span className="text-foreground nums">{datum.actualProgress.toFixed(2)}%</span></span>
            <span>Target: <span className="text-foreground nums">{datum.targetProgress.toFixed(2)}%</span></span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-card rounded-md p-3 lg:p-4 border border-border">
      <h3 className="font-semibold text-sm text-foreground mb-2">Schedule Slippage Trend</h3>
      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <ComposedChart data={chartData} margin={CHART_MARGIN}>
          <XAxis dataKey="label" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
          <YAxis
            tick={{ fontSize: 10 }}
            tickFormatter={(v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(0)}%`}
          />
          <Tooltip content={customTooltip} />
          <ReferenceLine y={0} stroke={CHART_COLORS.billed} strokeDasharray="3 3" />
          <Area
            type="monotone"
            dataKey="slippagePos"
            name="Ahead of plan"
            stroke="none"
            fill="#10b981"
            fillOpacity={0.18}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="slippageNeg"
            name="Behind plan"
            stroke="none"
            fill={CHART_COLORS.target}
            fillOpacity={0.18}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="slippage"
            name="Slippage (Actual − Target)"
            stroke={CHART_COLORS.cost}
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
});
SlippageTrendChart.displayName = 'SlippageTrendChart';

//
// Cost Items Breakdown is split into two charts so Target (typically the project's
// largest figure) doesn't dwarf the direct-cost categories. Top chart compares
// the project-level totals (Target / SWA / Billed / Direct). Bottom chart breaks
// down the direct cost into Equipment / Labor / Materials on its own scale.
const CostItemsChart = memo(({ data }: { data: any }) => {
  const projectTotalsData = [
    { name: 'Target', value: data.target || 0, fill: CHART_COLORS.target },
    { name: 'SWA', value: data.swa || 0, fill: CHART_COLORS.swa },
    { name: 'Billed', value: data.billed || 0, fill: CHART_COLORS.billed },
    { name: 'Direct', value: data.direct || 0, fill: CHART_COLORS.direct },
  ];

  const directBreakdownData = [
    { name: 'Equipment', value: data.equipment || 0, fill: CHART_COLORS.equipment },
    { name: 'Labor', value: data.labor || 0, fill: CHART_COLORS.labor },
    { name: 'Materials', value: data.materials || 0, fill: CHART_COLORS.materials },
  ];

  const categoryTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      return (
        <div className="bg-card p-2 border border-border rounded-md shadow-sm-tinted text-foreground">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">{item.payload.name}</span>
            <span className="font-medium text-sm nums">{formatCurrency(item.value)}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-card rounded-md p-3 lg:p-4 border border-border">
      <h3 className="font-semibold text-sm text-foreground mb-2">Cost Items Breakdown</h3>
      <div className="space-y-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.06em] text-muted-foreground mb-1">Project totals</div>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT / 2}>
            <BarChart data={projectTotalsData} margin={COST_ITEMS_MARGIN}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={formatCurrencyM} />
              <Tooltip content={categoryTooltip} cursor={{ fill: 'transparent' }} />
              <Bar dataKey="value" name="Cost">
                {projectTotalsData.map((entry, idx) => (
                  <Cell key={`pt-${idx}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-[0.06em] text-muted-foreground mb-1">Direct cost breakdown</div>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT / 2}>
            <BarChart data={directBreakdownData} margin={COST_ITEMS_MARGIN}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={formatCurrencyM} />
              <Tooltip content={categoryTooltip} cursor={{ fill: 'transparent' }} />
              <Bar dataKey="value" name="Cost">
                {directBreakdownData.map((entry, idx) => (
                  <Cell key={`db-${idx}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
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

// MonthlyCostChart was retired in favour of CashConversionChart. The per-month
// detail it surfaced is preserved in the MonthlyCostBreakdown card list below.

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
  manHoursData,
  projectStats
}: {
  projectData: any,
  manHoursData: any[],
  projectStats?: { contractAmount?: number; directCostTotal?: number }
}) => {
  const {
    totalActualHours,
    totalProjectedHours,
    efficiency,
    progressVariance,
    budgetUtilization,
    costEfficiency
  } = calculateProgressAnalysis(projectData, manHoursData, {
    contractAmount: projectStats?.contractAmount,
    directCostTotal: projectStats?.directCostTotal,
  });

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
        {/* Headline — Forecast at Completion vs. Contract */}
        <div className="mb-6 lg:mb-8">
          <ForecastAtCompletion projectStats={projectStats} />
        </div>

        {/* Cash conversion (replaces the prior Monthly Cost Comparison bar chart) */}
        <div className="mb-6 lg:mb-8">
          <CashConversionChart data={cashConversionTrend} />
        </div>

        {/* Trajectory section — efficiency (CPI/SPI) and schedule (Slippage)
            answer the same shape of question ("is health improving over time?"),
            so they live side-by-side. */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <CPISPITrendChart data={cpiSpiTrend} />
          <SlippageTrendChart data={progressTrend} />
        </div>

        {/* Charts Section — Cost Items breakdown + Man Hours volume */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-6 lg:mb-8">
          {costItemsStackedData && (
            <CostItemsChart data={costItemsStackedData} />
          )}
          {(processedManHoursData.length > 0 || dailyManHoursData.length > 0) && (
            <ManHoursChart
              monthlyData={processedManHoursData}
              dailyData={dailyManHoursData}
              view={manHoursView}
              onViewChange={setManHoursView}
            />
          )}
        </div>

        {/* Labor productivity — efficiency view, complements the volume chart above */}
        <div className="mb-6 lg:mb-8">
          <LaborProductivityChart trend={productivityTrend} />
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
            projectStats={projectStats}
          />
        </div>
      </CardContent>
    </Card>
  );
}
