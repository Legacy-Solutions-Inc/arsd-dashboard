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
 * Format currency values
 */
export const formatCurrency = (value: number): string => `₱${value.toLocaleString()}`;
export const formatCurrencyM = (value: number): string => `₱${(value / 1000000).toFixed(1)}M`;
export const formatHours = (value: number): string => `${value}h`;

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
  
  // Use projectStats.targetCostTotal if available, otherwise fall back to cost_items Target
  const targetCost = projectStats?.targetCostTotal || processedItems.find(item => item.type === 'Target')?.cost || 0;
  
  // Debug logging to verify data sources
  console.log('Cost Items Stacked Chart Debug:', {
    projectStatsTargetCost: projectStats?.targetCostTotal,
    costItemsTargetCost: processedItems.find(item => item.type === 'Target')?.cost,
    finalTargetCost: targetCost,
    equipmentCost,
    laborCost,
    materialsCost,
    combinedCost
  });
  
  return {
    target: targetCost,
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
  return manHoursData.map((item: any) => ({
    date: item.date || item.period || 'Unknown',
    actual: parseFloat(item.actual_man_hours) || 0,
    projected: parseFloat(item.projected_man_hours) || 0,
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

/**
 * Process man hours data for monthly view
 */
export const processMonthlyManHoursData = (manHoursData: ManHoursData[]): any[] => {
  const monthGroups = new Map<string, { actual: number; projected: number; count: number }>();
  
  manHoursData.forEach((item: any) => {
    const dateStr = item.date || item.period || 'Unknown';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return;
    
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const actual = parseFloat(item.actual_man_hours) || 0;
    const projected = parseFloat(item.projected_man_hours) || 0;
    
    const existing = monthGroups.get(monthKey) || { actual: 0, projected: 0, count: 0 };
    existing.actual += actual;
    existing.projected += projected;
    existing.count += 1;
    monthGroups.set(monthKey, existing);
  });
  
  // Convert to array and sort chronologically for monthly view
  return Array.from(monthGroups.entries())
    .map(([month, data]) => ({
      date: month,
      actual: data.actual,
      projected: data.projected,
      count: data.count
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
 * Calculate progress analysis data
 */
export const calculateProgressAnalysis = (
  projectData: { actualProgress: number; targetProgress: number; savings: number },
  manHoursData: any[]
) => {
  const totalActualHours = manHoursData.reduce((sum, item) => sum + item.actual, 0);
  const totalProjectedHours = manHoursData.reduce((sum, item) => sum + item.projected, 0);
  const efficiency = totalProjectedHours > 0 ? (totalActualHours / totalProjectedHours) * 100 : 0;

  return {
    totalActualHours,
    totalProjectedHours,
    efficiency,
    progressVariance: projectData.actualProgress - projectData.targetProgress,
    budgetUtilization: (projectData.actualProgress / 100) * 100,
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
