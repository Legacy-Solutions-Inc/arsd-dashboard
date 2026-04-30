/**
 * Utility functions for CostAnalysis component computations
 */

export interface CostMonth {
  month: string;
  target: number;
  swa: number;
  billed: number;
  direct: number;
}

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

export interface CostItem {
  type: string;
  cost: number;
}

export interface CostItemsStackedData {
  target: number;
  swa: number;
  billed: number;
  direct: number;
  equipment: number;
  labor: number;
  materials: number;
  combined: number;
}

export interface ProcessedCostData {
  sortedCostData: CostMonth[];
  costItemsBreakdown: CostItem[];
  costItemsStackedData: CostItemsStackedData;
  processedManHoursData: any[];
  dailyManHoursData: any[];
}

export interface ProjectStats {
  contractAmount: number;
  targetCostTotal: number;
  directCostTotal: number;
  swaCostTotal: number;
  billedCostTotal?: number;
}

export interface PaginationData {
  totalPages: number;
  startIndex: number;
  endIndex: number;
  paginatedCostData: CostMonth[];
}

// Constants
export const ITEMS_PER_PAGE = 3;
export const CHART_HEIGHT = 250;
export const CHART_HEIGHT_DAILY = 400;
export const CHART_MARGIN = { top: 15, right: 20, left: 0, bottom: 5 };
export const COST_ITEMS_MARGIN = { top: 15, right: 20, left: 40, bottom: 5 };

// Chart colors
export const CHART_COLORS = {
  target: '#dc2626',
  swa: '#ec4899',
  billed: '#6b7280',
  direct: '#16a34a',
  actual: '#ef4444',
  projected: '#3b82f6',
  cost: '#8b5cf6',
  equipment: '#f59e0b',
  labor: '#10b981',
  materials: '#8b5cf6'
} as const;

/**
 * Format currency values. Rounds to whole pesos to avoid float-drift bleed
 * (e.g. 54791382.0999999 → "₱54,791,382" instead of "₱54,791,382.0999999").
 * Cents aren't tracked anywhere on construction-project totals, so integer
 * display is correct for this UI.
 */
export const formatCurrency = (value: number): string =>
  `₱${Math.round(Number.isFinite(value) ? value : 0).toLocaleString('en-PH')}`;
export const formatCurrencyM = (value: number): string => `₱${(value / 1000000).toFixed(1)}M`;
export const formatHours = (value: number): string => `${value}h`;

// ============================================================
// CEO-tier financial signals — derived series + summary metrics
// ============================================================

/**
 * Forecast at Completion (EVM-derived).
 * CPI = SWA / Direct (earned-value over actual-cost proxy).
 * EAC = Contract / CPI (assumes current efficiency continues).
 * VAC = Contract − EAC (positive = under budget; negative = over).
 *
 * Returns isFinite=false when CPI cannot be computed (no direct cost yet,
 * or contract amount missing). Caller renders an empty-state message in
 * that case rather than NaN/Infinity.
 */
export interface ForecastAtCompletion {
  cpi: number;
  eac: number;
  vac: number;
  vacPct: number;
  isFinite: boolean;
}

export const calculateForecastAtCompletion = (
  projectStats?: { contractAmount?: number; swaCostTotal?: number; directCostTotal?: number }
): ForecastAtCompletion => {
  const swa = projectStats?.swaCostTotal ?? 0;
  const direct = projectStats?.directCostTotal ?? 0;
  const contract = projectStats?.contractAmount ?? 0;

  if (!Number.isFinite(direct) || direct <= 0 || !Number.isFinite(contract) || contract <= 0) {
    return { cpi: 0, eac: 0, vac: 0, vacPct: 0, isFinite: false };
  }

  const cpi = swa / direct;
  if (!Number.isFinite(cpi) || cpi <= 0) {
    return { cpi: 0, eac: 0, vac: 0, vacPct: 0, isFinite: false };
  }

  const eac = contract / cpi;
  const vac = contract - eac;
  const vacPct = (vac / contract) * 100;

  return { cpi, eac, vac, vacPct, isFinite: true };
};

/**
 * CPI/SPI trend over time (one point per month).
 * CPI(M) = sum(swa ≤ M) / sum(direct ≤ M)   — cost performance
 * SPI(M) = sum(swa ≤ M) / sum(target ≤ M)   — schedule performance
 * Both > 1.0 = good. Diverging lines surface the "saving money but falling
 * behind plan" or "ahead of plan but burning cash" stories.
 */
export interface CPISPIDatum {
  month: string;
  cpi: number;
  spi: number;
}

export const calculateCPISPITrend = (sortedCostData: CostMonth[]): CPISPIDatum[] => {
  let cumSwa = 0;
  let cumDirect = 0;
  let cumTarget = 0;
  return sortedCostData.map((row) => {
    cumSwa += row.swa || 0;
    cumDirect += row.direct || 0;
    cumTarget += row.target || 0;
    const cpi = cumDirect > 0 ? cumSwa / cumDirect : 0;
    const spi = cumTarget > 0 ? cumSwa / cumTarget : 0;
    return {
      month: row.month,
      cpi: Number.isFinite(cpi) ? cpi : 0,
      spi: Number.isFinite(spi) ? spi : 0,
    };
  });
};

/**
 * Cash conversion trend — cumulative SWA / Billed / Direct over time.
 * The visible gap between Earned and Billed = unbilled work (admin lag).
 * The gap between Billed and Spent ≈ working capital float / margin proxy.
 */
export interface CashConversionDatum {
  month: string;
  cumSwa: number;
  cumBilled: number;
  cumDirect: number;
}

export const calculateCashConversionTrend = (sortedCostData: CostMonth[]): CashConversionDatum[] => {
  let cumSwa = 0;
  let cumBilled = 0;
  let cumDirect = 0;
  return sortedCostData.map((row) => {
    cumSwa += row.swa || 0;
    cumBilled += row.billed || 0;
    cumDirect += row.direct || 0;
    return {
      month: row.month,
      cumSwa,
      cumBilled,
      cumDirect,
    };
  });
};

/**
 * Labor productivity trend — pesos earned (SWA) per actual labor hour, per month.
 *
 * Source actual_man_hours is cumulative-to-date, so we derive each month's
 * actual hours as the period delta (last month's cumulative − previous month's
 * cumulative). Cost data already arrives one row per month from the parser.
 *
 * Returns the per-month series plus the project-to-date mean for a reference line.
 */
export interface ProductivityDatum {
  month: string;
  productivity: number;
}

/**
 * Forecast band on the project S-curve.
 *
 * Path (i) of the Stage 3 Chart B spec — compute the cone of uncertainty from
 * historical progress data without any new schema. Requires at least 6 weekly
 * progress points (one per accomplishment report) before it renders, so the
 * mean and standard deviation of weekly progress deltas are stable.
 *
 * Method: project the current trajectory forward week-by-week, clamping each
 * point at 100% completion and stopping the projection when the midline hits
 * 100% or when the projected date passes the planned end date. The band is
 * ±1σ × √k wide at k weeks ahead (Wiener-process scaling), which widens
 * gradually so near-term forecasts are tight and far-future forecasts are
 * appropriately uncertain.
 */
export interface ForecastBandPoint {
  date: string;
  forecastLow: number;
  forecastDelta: number; // forecastHigh − forecastLow, used by Recharts stacked Area trick
  forecastMid: number;
}

export interface ForecastBand {
  enabled: boolean;
  reason?: string;
  points: ForecastBandPoint[];
  /**
   * The week_ending_date of the last historical point — useful for callers
   * that want to merge the band into a single dataset alongside historicals.
   */
  anchorDate?: string;
}

export const calculateForecastBand = (
  progressTrend: Array<{ week_ending_date: string; actualProgress: number }>,
  plannedEndDate?: string,
): ForecastBand => {
  if (!progressTrend || progressTrend.length < 6) {
    return {
      enabled: false,
      reason: 'Forecast band appears once 6 weeks of history are available.',
      points: [],
    };
  }

  // Sort defensively (caller normally already sorts ascending).
  const sorted = [...progressTrend].sort((a, b) =>
    a.week_ending_date.localeCompare(b.week_ending_date)
  );

  // Compute week-over-week deltas.
  const deltas: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    deltas.push(sorted[i].actualProgress - sorted[i - 1].actualProgress);
  }
  if (deltas.length === 0) {
    return { enabled: false, reason: 'Not enough history to compute deltas.', points: [] };
  }

  const mean = deltas.reduce((s, d) => s + d, 0) / deltas.length;
  const variance =
    deltas.reduce((s, d) => s + (d - mean) * (d - mean), 0) / deltas.length;
  const std = Math.sqrt(variance);

  const last = sorted[sorted.length - 1];
  const lastDate = new Date(last.week_ending_date);
  const lastProgress = last.actualProgress;

  if (isNaN(lastDate.getTime())) {
    return { enabled: false, reason: 'Invalid latest report date.', points: [] };
  }

  const endDate = plannedEndDate ? new Date(plannedEndDate) : null;
  const validEnd = endDate && !isNaN(endDate.getTime()) ? endDate : null;

  const MAX_WEEKS = 104; // hard cap so a stalled project doesn't project for years
  const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;
  const points: ForecastBandPoint[] = [];

  // Anchor point — repeats the last historical so the band visually starts
  // exactly where the historical line ends.
  points.push({
    date: last.week_ending_date,
    forecastLow: lastProgress,
    forecastDelta: 0,
    forecastMid: lastProgress,
  });

  for (let k = 1; k <= MAX_WEEKS; k++) {
    const projectedDate = new Date(lastDate.getTime() + k * MS_PER_WEEK);
    if (validEnd && projectedDate.getTime() > validEnd.getTime()) break;

    const mid = Math.min(100, lastProgress + k * mean);
    const halfWidth = std * Math.sqrt(k);
    const low = Math.max(0, mid - halfWidth);
    const high = Math.min(100, mid + halfWidth);
    const delta = Math.max(0, high - low);

    points.push({
      date: projectedDate.toISOString().slice(0, 10),
      forecastLow: low,
      forecastDelta: delta,
      forecastMid: mid,
    });

    if (mid >= 100) break;
  }

  return {
    enabled: true,
    points,
    anchorDate: last.week_ending_date,
  };
};

export const calculateProductivityTrend = (
  sortedCostData: CostMonth[],
  processedManHoursData: any[]
): { data: ProductivityDatum[]; mean: number } => {
  // processedManHoursData is monthly with cumulative-to-end-of-month values.
  // Build a year-month → cumulative actual hours map.
  const cumByMonth = new Map<string, number>();
  for (const row of processedManHoursData) {
    if (typeof row?.date === 'string' && Number.isFinite(row.actual)) {
      cumByMonth.set(row.date, row.actual);
    }
  }
  const orderedHourMonths = Array.from(cumByMonth.keys()).sort();

  // Period deltas (this month's cumulative − previous month's cumulative).
  const deltaByMonth = new Map<string, number>();
  let prev = 0;
  for (const m of orderedHourMonths) {
    const cum = cumByMonth.get(m) || 0;
    deltaByMonth.set(m, Math.max(0, cum - prev));
    prev = cum;
  }

  const data: ProductivityDatum[] = [];
  let total = 0;
  let count = 0;

  for (const row of sortedCostData) {
    const date = new Date(row.month);
    if (isNaN(date.getTime())) continue;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const hours = deltaByMonth.get(key);
    if (hours == null || hours <= 0) continue;
    const productivity = (row.swa || 0) / hours;
    if (!Number.isFinite(productivity) || productivity <= 0) continue;
    data.push({ month: row.month, productivity });
    total += productivity;
    count += 1;
  }

  return { data, mean: count > 0 ? total / count : 0 };
};

/**
 * Sort data chronologically
 */
export const sortDataChronologically = <T extends { month: string }>(data: T[]): T[] => {
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

/**
 * Normalize cost item type to canonical buckets
 */
export const normalizeCostItemType = (raw: any): string => {
  const s = (raw || '').toString().toLowerCase().trim();
  if (s.includes('target')) return 'Target';
  if (s.includes('equipment')) return 'Equipment';
  if (s.includes('labor') || s.includes('labour')) return 'Labor';
  if (s.includes('materials') || s.includes('matl')) return 'Materials';
  return raw || 'Other';
};

/**
 * Parse cost value from various formats
 */
export const parseCostValue = (raw: any): number => {
  const num = typeof raw === 'number' 
    ? raw 
    : parseFloat(String(raw).replace(/[^0-9.-]/g, ''));
  return isNaN(num) ? 0 : num;
};

/**
 * Process cost items data
 */
export const processCostItems = (items: any[], projectStats?: ProjectStats): CostItem[] => {
  const typeBreakdown = items.reduce((acc: Record<string, number>, item: any) => {
    const type = normalizeCostItemType(item.type);
    const cost = parseCostValue(item.cost);
    acc[type] = (acc[type] || 0) + cost;
    return acc;
  }, {} as Record<string, number>);

  // Override Target cost with projectStats.targetCostTotal if available
  if (projectStats?.targetCostTotal) {
    typeBreakdown['Target'] = projectStats.targetCostTotal;
  }

  // Only keep the four primary categories (in this exact order)
  const preferredOrder = ['Target', 'Equipment', 'Labor', 'Materials'] as const;
  return preferredOrder.map(key => ({ type: key, cost: typeBreakdown[key] || 0 }));
};

/**
 * Process cost items for stacked bar chart
 */
export const processCostItemsForStackedChart = (
  items: any[], 
  projectStats?: ProjectStats
): CostItemsStackedData => {
  const processedItems = processCostItems(items, projectStats);
  
  // Calculate combined cost of Equipment, Labor, and Materials
  const equipmentCost = processedItems.find(item => item.type === 'Equipment')?.cost || 0;
  const laborCost = processedItems.find(item => item.type === 'Labor')?.cost || 0;
  const materialsCost = processedItems.find(item => item.type === 'Materials')?.cost || 0;
  const combinedCost = equipmentCost + laborCost + materialsCost;
  
  // Use projectStats for target, SWA, billed, and direct costs if available
  const targetCost = projectStats?.targetCostTotal || processedItems.find(item => item.type === 'Target')?.cost || 0;
  const swaCost = projectStats?.swaCostTotal || 0;
  const billedCost = projectStats?.billedCostTotal || 0;
  const directCost = projectStats?.directCostTotal || 0;

  return {
    target: targetCost,
    swa: swaCost,
    billed: billedCost,
    direct: directCost,
    equipment: equipmentCost,
    labor: laborCost,
    materials: materialsCost,
    combined: combinedCost
  };
};

/**
 * Normalize cost data to handle both formats
 */
export const normalizeCostData = (costData: (CostMonth | DatabaseCostMonth)[]): CostMonth[] => {
  return costData.map((item: any) => ({
    id: `${item.month || item.month_name || item.period || ''}`,
    month: item.month || item.month_name || item.period || '',
    target: Number(item.target || item.target_cost || 0),
    swa: Number(item.swa || item.swa_cost || 0),
    billed: Number(item.billed || item.billed_cost || 0),
    direct: Number(item.direct || item.direct_cost || 0),
  })).filter(item => item.month);
};

/**
 * Aggregate cost data by month
 */
export const aggregateCostDataByMonth = (normalizedCostData: CostMonth[]): CostMonth[] => {
  const monthToTotals = new Map<string, { 
    id: string; 
    month: string; 
    target: number; 
    swa: number; 
    billed: number; 
    direct: number 
  }>();

  for (const row of normalizedCostData) {
    const key = row.month;
    const existing = monthToTotals.get(key);
    if (existing) {
      existing.target += row.target;
      existing.swa += row.swa;
      existing.billed += row.billed;
      existing.direct += row.direct;
    } else {
      monthToTotals.set(key, { 
        id: ('id' in row ? (row as any).id : key),
        month: row.month,
        target: row.target,
        swa: row.swa,
        billed: row.billed,
        direct: row.direct
      });
    }
  }

  return Array.from(monthToTotals.values());
};

/**
 * Process man hours data for daily view
 */
export const processDailyManHoursData = (manHoursData: ManHoursData[]): any[] => {
  // First, sort the data chronologically
  const sortedData = manHoursData.map((item: any) => ({
    date: item.date || item.period || 'Unknown',
    actual: parseFloat(item.actual_man_hours) || 0,
    projected: parseFloat(item.projected_man_hours) || 0,
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Calculate daily differences (current - previous)
  const dailyData = sortedData.map((item, index) => {
    if (index === 0) {
      // First day: use the cumulative value as is
      return {
        date: item.date,
        actual: item.actual,
        projected: item.projected,
        actualPersons: item.actual / 8,
        projectedPersons: item.projected / 8
      };
    }

    const previousItem = sortedData[index - 1];
    const dailyActual = item.actual - previousItem.actual;
    const dailyProjected = item.projected - previousItem.projected;

    return {
      date: item.date,
      actual: Math.max(0, dailyActual), // Ensure non-negative values
      projected: Math.max(0, dailyProjected), // Ensure non-negative values
      actualPersons: Math.max(0, dailyActual) / 8,
      projectedPersons: Math.max(0, dailyProjected) / 8
    };
  });

  return dailyData;
};

/**
 * Process man hours data for monthly (cumulative) view.
 *
 * IMPORTANT: source `actual_man_hours` and `projected_man_hours` are stored as
 * cumulative-to-date totals (the parser captures running totals from each weekly
 * accomplishment report). Summing them across a month — or worse, across all
 * months — produces wildly inflated numbers (e.g., 19M projected hours).
 *
 * For the cumulative chart we want the LATEST cumulative value within each
 * month, not the sum. For the daily-delta chart, see processDailyManHoursData
 * which already handles deltas correctly.
 */
export const processMonthlyManHoursData = (manHoursData: ManHoursData[]): any[] => {
  const monthGroups = new Map<string, { actual: number; projected: number; tsMs: number; count: number }>();

  manHoursData.forEach((item: any) => {
    const dateStr = item.date || item.period || 'Unknown';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return;

    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const actual = parseFloat(item.actual_man_hours) || 0;
    const projected = parseFloat(item.projected_man_hours) || 0;

    const existing = monthGroups.get(monthKey);
    if (!existing || date.getTime() > existing.tsMs) {
      monthGroups.set(monthKey, {
        actual,
        projected,
        tsMs: date.getTime(),
        count: existing ? existing.count + 1 : 1,
      });
    } else if (existing) {
      existing.count += 1;
      monthGroups.set(monthKey, existing);
    }
  });

  return Array.from(monthGroups.entries())
    .map(([month, data]) => ({
      date: month,
      actual: data.actual,
      projected: data.projected,
      count: data.count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
};

/**
 * Calculate pagination data for cost analysis
 */
export const calculateCostAnalysisPagination = (
  sortedCostData: CostMonth[],
  currentPage: number,
  itemsPerPage: number = ITEMS_PER_PAGE
): PaginationData => {
  const totalPages = Math.ceil(sortedCostData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCostData = sortedCostData.slice(startIndex, endIndex);

  return {
    totalPages,
    startIndex,
    endIndex,
    paginatedCostData
  };
};

/**
 * Format date labels for charts
 */
export const formatDateLabel = (dateStr: string, isMonthly: boolean = false): string => {
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

/**
 * Calculate progress analysis data.
 *
 * Man-hours totals: source values are cumulative-to-date, so the project total
 * is the LATEST entry's cumulative value — not the sum across periods.
 * processMonthlyManHoursData returns rows sorted ascending by month, so the
 * last entry is authoritative.
 *
 * Budget utilization: realized cost (directCostTotal) as a % of contract value.
 * Falls back to 0 when contractAmount is missing/zero.
 */
export const calculateProgressAnalysis = (
  projectData: { actualProgress: number; targetProgress: number; savings: number },
  manHoursData: any[],
  costInputs?: { directCostTotal?: number; contractAmount?: number }
) => {
  const latest = manHoursData[manHoursData.length - 1];
  const totalActualHours = latest?.actual ?? 0;
  const totalProjectedHours = latest?.projected ?? 0;
  const efficiency = totalProjectedHours > 0 ? (totalActualHours / totalProjectedHours) * 100 : 0;

  const directCostTotal = costInputs?.directCostTotal ?? 0;
  const contractAmount = costInputs?.contractAmount ?? 0;
  const budgetUtilization = contractAmount > 0 ? (directCostTotal / contractAmount) * 100 : 0;

  return {
    totalActualHours,
    totalProjectedHours,
    efficiency,
    progressVariance: projectData.actualProgress - projectData.targetProgress,
    budgetUtilization,
    costEfficiency: projectData.savings > 0 ? 'Above target' : 'Below target'
  };
};

/**
 * Calculate cost summary statistics
 */
export const calculateCostSummaryStats = (costData: CostMonth[]) => {
  const totalTarget = costData.reduce((sum, item) => sum + item.target, 0);
  const totalSwa = costData.reduce((sum, item) => sum + item.swa, 0);
  const totalBilled = costData.reduce((sum, item) => sum + item.billed, 0);
  const totalDirect = costData.reduce((sum, item) => sum + item.direct, 0);

  return {
    totalTarget,
    totalSwa,
    totalBilled,
    totalDirect,
    totalCost: totalTarget + totalSwa + totalBilled + totalDirect
  };
};

/**
 * Main function to process all cost analysis data
 */
export const processCostAnalysisData = (
  costData: (CostMonth | DatabaseCostMonth)[],
  costItemsData: any[] = [],
  manHoursData: ManHoursData[] = [],
  projectStats?: ProjectStats
): ProcessedCostData => {
  // Normalize and aggregate cost data
  const normalizedCostData = normalizeCostData(costData);
  const aggregatedCostData = aggregateCostDataByMonth(normalizedCostData);
  const sortedCostData = sortDataChronologically(aggregatedCostData);

  // Process cost items
  const costItemsBreakdown = processCostItems(costItemsData, projectStats);
  const costItemsStackedData = processCostItemsForStackedChart(costItemsData, projectStats);

  // Process man hours data
  const dailyManHoursData = processDailyManHoursData(manHoursData);
  const processedManHoursData = processMonthlyManHoursData(manHoursData);

  return {
    sortedCostData,
    costItemsBreakdown,
    costItemsStackedData,
    processedManHoursData,
    dailyManHoursData
  };
};

/**
 * Validate cost data integrity
 */
export const validateCostData = (costData: (CostMonth | DatabaseCostMonth)[]): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  costData.forEach((item, index) => {
    if (!item.month && !('month_name' in item ? item.month_name : false) && !('period' in item ? item.period : false)) {
      errors.push(`Item ${index}: Missing month/period identifier`);
    }

    const target = Number(
      ('target' in item ? item.target : 0) || 
      ('target_cost' in item ? item.target_cost : 0) || 0
    );
    const swa = Number(
      ('swa' in item ? item.swa : 0) || 
      ('swa_cost' in item ? item.swa_cost : 0) || 0
    );
    const billed = Number(
      ('billed' in item ? item.billed : 0) || 
      ('billed_cost' in item ? item.billed_cost : 0) || 0
    );
    const direct = Number(
      ('direct' in item ? item.direct : 0) || 
      ('direct_cost' in item ? item.direct_cost : 0) || 0
    );

    if (isNaN(target) || isNaN(swa) || isNaN(billed) || isNaN(direct)) {
      errors.push(`Item ${index}: Invalid numeric values`);
    }

    if (target < 0 || swa < 0 || billed < 0 || direct < 0) {
      errors.push(`Item ${index}: Negative cost values detected`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Export cost data to CSV format
 */
export const exportCostDataToCSV = (costData: CostMonth[]): string => {
  const headers = ['Month', 'Target Cost', 'SWA Cost', 'Billed Cost', 'Direct Cost'];
  const csvRows = [headers.join(',')];

  costData.forEach(item => {
    const values = [
      `"${item.month}"`,
      item.target.toString(),
      item.swa.toString(),
      item.billed.toString(),
      item.direct.toString()
    ];
    csvRows.push(values.join(','));
  });

  return csvRows.join('\n');
};
