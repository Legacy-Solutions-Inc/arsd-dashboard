/**
 * Centralized project calculations utility
 * Used by both leaderboard and project detail pages for consistent calculations
 */

// Utility functions
export const parseNumericValue = (value: string | number | null | undefined, defaultValue: number = 0): number => {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === 'number') return isNaN(value) ? defaultValue : value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.\-]/g, '');
    const n = Number(cleaned);
    return isNaN(n) ? defaultValue : n;
  }
  const n = Number(value);
  return isNaN(n) ? defaultValue : n;
};

export const calculatePercentage = (numerator: number, denominator: number): number => {
  return denominator > 0 ? (numerator / denominator) * 100 : 0;
};

export const roundToTwoDecimals = (value: number): number => {
  return Math.round(value * 100) / 100;
};

export const formatCurrency = (value: number | string | null | undefined): string => {
  const numValue = parseNumericValue(value);
  return `₱${numValue.toLocaleString()}`;
};

// Project calculation interfaces
export interface ProjectCostData {
  target_cost_total?: number | string;
  swa_cost_total?: number | string;
  direct_cost_total?: number | string;
  target_percentage?: number | string;
  balance?: number | string;
  collectibles?: number | string;
  direct_cost_savings?: number | string;
  received_percentage?: number | string;
  utilization_percentage?: number | string;
  total_pos?: number | string;
  billed_cost_total?: number | string;
}

export interface ProjectDetailsData {
  contract_amount?: number | string;
  direct_contract_amount?: number | string;
}

export interface ProjectStats {
  contractAmount: number;
  targetCostTotal: number;
  directCostTotal: number;
  swaCostTotal: number;
  billedCostTotal: number;
  targetProgress: number;
  actualProgress: number;
  slippage: number;
  balance: number;
  collectible: number;
  savings: number;
}

/**
 * Calculate project statistics from cost and details data
 * @param projectCost - Latest project cost data
 * @param projectDetails - Latest project details data
 * @returns Calculated project statistics
 */
export const calculateProjectStats = (
  projectCost: ProjectCostData,
  projectDetails: ProjectDetailsData
): ProjectStats => {
  // Parse numeric values
  const contractAmount = parseNumericValue(projectDetails.contract_amount);
  const targetCostTotal = parseNumericValue(projectCost.target_cost_total);
  const directCostTotal = parseNumericValue(projectCost.direct_cost_total);
  const swaCostTotal = parseNumericValue(projectCost.swa_cost_total);
  const billedCostTotal = parseNumericValue(projectCost.billed_cost_total);

  // Calculate target progress using formula: (contract amount * target_percentage) * 100
  const targetProgress = roundToTwoDecimals(parseNumericValue(projectCost.target_percentage) * 100);

  // Calculate actual progress using SWA cost total
  const actualProgress = roundToTwoDecimals(calculatePercentage(swaCostTotal, contractAmount));

  // Calculate slippage
  const slippage = roundToTwoDecimals(actualProgress - targetProgress);

  // Financial values
  const balance = parseNumericValue(projectCost.balance);
  const collectible = parseNumericValue(projectCost.collectibles);
  const savings = parseNumericValue(projectCost.direct_cost_savings);

  return {
    contractAmount,
    targetCostTotal,
    directCostTotal,
    swaCostTotal,
    billedCostTotal,
    targetProgress,
    actualProgress,
    slippage,
    balance,
    collectible,
    savings
  };
};

/**
 * Calculate project statistics for leaderboard (simplified version)
 * @param latestCost - Latest cost data
 * @param latestDetail - Latest detail data
 * @returns Calculated project statistics
 */
export const calculateLeaderboardStats = (
  latestCost: any,
  latestDetail: any
): { targetProgress: number; actualProgress: number; slippage: number } => {
  const contractAmount = parseNumericValue(latestDetail?.contract_amount);
  const targetTotal = parseNumericValue(latestCost?.target_cost_total);
  const swaTotal = parseNumericValue(latestCost?.swa_cost_total);
  const targetPercentage = parseNumericValue(latestCost?.target_percentage);

  // Use target_percentage from sheet if available, otherwise calculate from target_cost_total
  // But cap target progress at 100% if it exceeds contract amount (data validation)
  let targetProgress = targetPercentage > 0 
    ? roundToTwoDecimals(parseNumericValue(latestCost?.target_percentage) * 100)
    : (contractAmount > 0 ? roundToTwoDecimals(calculatePercentage(targetTotal, contractAmount)) : 0);
  
  // Data validation: Cap target progress at 100% if it exceeds contract amount
  if (targetProgress > 100 && targetTotal > contractAmount) {
    console.warn(`Target progress capped: ${targetProgress}% -> 100% (targetTotal: ${targetTotal} > contractAmount: ${contractAmount})`);
    targetProgress = 100;
  }

  // Use swa_cost_total for actual progress
  const actualProgress = contractAmount > 0 
    ? roundToTwoDecimals(calculatePercentage(swaTotal, contractAmount))
    : 0;

  const slippage = roundToTwoDecimals(actualProgress - targetProgress);

  return {
    targetProgress,
    actualProgress,
    slippage
  };
};

/**
 * Format target percentage for display (handles both 0-1 and 0-100 ranges)
 * @param value - Raw target percentage value
 * @returns Formatted percentage value
 */
export const formatTargetPercentage = (value: number | string): number => {
  const v = parseNumericValue(value);
  const scaled = v <= 1 ? v * 100 : v;
  return roundToTwoDecimals(scaled);
};
