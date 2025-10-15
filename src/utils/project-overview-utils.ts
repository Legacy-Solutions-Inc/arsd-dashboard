/**
 * Utility functions for ProjectOverview component computations
 */

export interface ProjectOverviewData {
  id: string;
  projectId: string;
  projectName?: string;
  client: string;
  contractor: string;
  location: string;
  pmName: string;
  siteEngineer: string;
  contractAmount: number;
  directContractAmount?: number;
  plannedStartDate?: string;
  plannedEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  calendarDays?: number;
  workingDays?: number;
  priorityLevel?: string;
  remarks?: string;
  actualProgress: number;
  targetProgress: number;
  slippage: number;
  balance: number;
  collectible: number;
  savings: number;
}

export interface ProcessedProjectOverview {
  formattedData: FormattedProjectData;
  statusInfo: ProjectStatusInfo;
  dateInfo: ProjectDateInfo;
  financialInfo: ProjectFinancialInfo;
}

export interface FormattedProjectData {
  projectId: string;
  projectName: string;
  client: string;
  contractor: string;
  location: string;
  contractAmount: string;
  directContractAmount: string;
  plannedStartDate: string;
  plannedEndDate: string;
  actualStartDate: string;
  actualEndDate: string;
  calendarDays: string;
  workingDays: string;
  pmName: string;
  siteEngineer: string;
  priorityLevel: string;
  remarks: string;
}

export interface ProjectStatusInfo {
  progressStatus: 'on-track' | 'ahead' | 'behind';
  slippageStatus: 'positive' | 'negative' | 'neutral';
  priorityLevel: 'high' | 'medium' | 'low' | 'normal';
}

export interface ProjectDateInfo {
  duration: number;
  isOverdue: boolean;
  daysRemaining: number;
  progressPercentage: number;
}

export interface ProjectFinancialInfo {
  totalSavings: number;
  budgetUtilization: number;
  costEfficiency: 'above-target' | 'below-target' | 'on-target';
  collectibleStatus: 'good' | 'warning' | 'critical';
}

/**
 * Format currency values
 */
export const formatCurrency = (amount: number): string => {
  return `₱${amount?.toLocaleString() || 'N/A'}`;
};

/**
 * Format date values
 */
export const formatDate = (dateString?: string): string => {
  if (!dateString || dateString === 'N/A') return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-GB');
  } catch {
    return dateString;
  }
};

/**
 * Format number values
 */
export const formatNumber = (value?: number): string => {
  return value?.toString() || 'N/A';
};

/**
 * Calculate project status based on progress and slippage
 */
export const calculateProjectStatus = (data: ProjectOverviewData): ProjectStatusInfo => {
  const progressDiff = data.actualProgress - data.targetProgress;
  const slippage = data.slippage;

  // Determine progress status
  let progressStatus: 'on-track' | 'ahead' | 'behind';
  if (progressDiff > 5) {
    progressStatus = 'ahead';
  } else if (progressDiff < -5) {
    progressStatus = 'behind';
  } else {
    progressStatus = 'on-track';
  }

  // Determine slippage status
  let slippageStatus: 'positive' | 'negative' | 'neutral';
  if (slippage > 2) {
    slippageStatus = 'positive';
  } else if (slippage < -2) {
    slippageStatus = 'negative';
  } else {
    slippageStatus = 'neutral';
  }

  // Determine priority level
  let priorityLevel: 'high' | 'medium' | 'low' | 'normal';
  const rawPriority = data.priorityLevel?.toLowerCase();
  if (rawPriority === 'high' || rawPriority === 'urgent') {
    priorityLevel = 'high';
  } else if (rawPriority === 'medium') {
    priorityLevel = 'medium';
  } else if (rawPriority === 'low') {
    priorityLevel = 'low';
  } else {
    priorityLevel = 'normal';
  }

  return {
    progressStatus,
    slippageStatus,
    priorityLevel
  };
};

/**
 * Calculate project date information
 */
export const calculateProjectDateInfo = (data: ProjectOverviewData): ProjectDateInfo => {
  const currentDate = new Date();
  
  let duration = 0;
  let isOverdue = false;
  let daysRemaining = 0;
  let progressPercentage = 0;

  if (data.plannedStartDate && data.plannedEndDate) {
    const startDate = new Date(data.plannedStartDate);
    const endDate = new Date(data.plannedEndDate);
    
    if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
      duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (currentDate > endDate) {
        isOverdue = true;
        daysRemaining = 0;
      } else {
        daysRemaining = Math.ceil((endDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
      }
      
      // Calculate progress percentage based on time elapsed
      const totalDuration = endDate.getTime() - startDate.getTime();
      const elapsedTime = currentDate.getTime() - startDate.getTime();
      progressPercentage = Math.min(Math.max((elapsedTime / totalDuration) * 100, 0), 100);
    }
  }

  return {
    duration,
    isOverdue,
    daysRemaining,
    progressPercentage
  };
};

/**
 * Calculate project financial information
 */
export const calculateProjectFinancialInfo = (data: ProjectOverviewData): ProjectFinancialInfo => {
  const totalSavings = data.savings || 0;
  const budgetUtilization = data.contractAmount > 0 ? (data.actualProgress / 100) * data.contractAmount : 0;
  
  // Determine cost efficiency
  let costEfficiency: 'above-target' | 'below-target' | 'on-target';
  if (totalSavings > 0) {
    costEfficiency = 'above-target';
  } else if (totalSavings < 0) {
    costEfficiency = 'below-target';
  } else {
    costEfficiency = 'on-target';
  }

  // Determine collectible status
  let collectibleStatus: 'good' | 'warning' | 'critical';
  if (data.collectible >= 0) {
    collectibleStatus = 'good';
  } else if (data.collectible >= -100000) { // Assuming PHP currency
    collectibleStatus = 'warning';
  } else {
    collectibleStatus = 'critical';
  }

  return {
    totalSavings,
    budgetUtilization,
    costEfficiency,
    collectibleStatus
  };
};

/**
 * Format all project data for display
 */
export const formatProjectData = (data: ProjectOverviewData): FormattedProjectData => {
  return {
    projectId: data.projectId || 'N/A',
    projectName: data.projectName || 'N/A',
    client: data.client || 'N/A',
    contractor: data.contractor || 'N/A',
    location: data.location || 'N/A',
    contractAmount: formatCurrency(data.contractAmount),
    directContractAmount: formatCurrency(data.directContractAmount || 0),
    plannedStartDate: formatDate(data.plannedStartDate),
    plannedEndDate: formatDate(data.plannedEndDate),
    actualStartDate: formatDate(data.actualStartDate),
    actualEndDate: formatDate(data.actualEndDate),
    calendarDays: formatNumber(data.calendarDays),
    workingDays: formatNumber(data.workingDays),
    pmName: data.pmName || 'N/A',
    siteEngineer: data.siteEngineer || 'N/A',
    priorityLevel: data.priorityLevel || 'N/A',
    remarks: data.remarks || 'N/A'
  };
};

/**
 * Main function to process all project overview data
 */
export const processProjectOverviewData = (data: ProjectOverviewData): ProcessedProjectOverview => {
  const formattedData = formatProjectData(data);
  const statusInfo = calculateProjectStatus(data);
  const dateInfo = calculateProjectDateInfo(data);
  const financialInfo = calculateProjectFinancialInfo(data);

  return {
    formattedData,
    statusInfo,
    dateInfo,
    financialInfo
  };
};

/**
 * Validate project data completeness
 */
export const validateProjectData = (data: ProjectOverviewData): { isValid: boolean; missingFields: string[] } => {
  const requiredFields = [
    'projectId',
    'client',
    'contractor',
    'location',
    'pmName',
    'siteEngineer',
    'contractAmount'
  ];

  const missingFields = requiredFields.filter(field => {
    const value = data[field as keyof ProjectOverviewData];
    return !value || value === 'N/A';
  });

  return {
    isValid: missingFields.length === 0,
    missingFields
  };
};

/**
 * Calculate project health score (0-100)
 */
export const calculateProjectHealthScore = (data: ProjectOverviewData): number => {
  let score = 100;

  // Deduct points for negative slippage
  if (data.slippage < 0) {
    score -= Math.abs(data.slippage) * 2; // 2 points per percentage point of slippage
  }

  // Deduct points for negative savings
  if (data.savings < 0) {
    score -= Math.abs(data.savings) / 10000; // 1 point per 10k negative savings
  }

  // Deduct points for negative collectibles
  if (data.collectible < 0) {
    score -= Math.abs(data.collectible) / 50000; // 1 point per 50k negative collectibles
  }

  // Deduct points for overdue projects
  const dateInfo = calculateProjectDateInfo(data);
  if (dateInfo.isOverdue) {
    score -= 20;
  }

  return Math.max(0, Math.min(100, score));
};

/**
 * Get status badge color based on status
 */
export const getStatusBadgeColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'high':
    case 'urgent':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

/**
 * Get progress bar color based on progress status
 */
export const getProgressBarColor = (progressStatus: 'on-track' | 'ahead' | 'behind'): string => {
  switch (progressStatus) {
    case 'ahead':
      return 'bg-green-500';
    case 'behind':
      return 'bg-red-500';
    default:
      return 'bg-blue-500';
  }
};
