/**
 * Type definitions for Schedule Tasks component
 */

export interface Task {
  id: number;
  name: string;
  progress: number;
  weight: number;
  cost: number;
  startDate: string;
  endDate: string;
  status: string;
}

export interface GanttTask {
  id: string;
  item: string;
  description: string;
  startDate: string;
  endDate: string;
  cost: number;
  type: string;
  weight?: number;
  manpower?: number;
  duration?: number;
}

export interface WeeklyAccomplishment {
  week: number;
  weekStart: string;
  periodicPhysical: number;
  periodicFinancial: number;
  accumulativePhysical: number;
  accumulativeFinancial: number;
}

export interface ScheduleTasksProps {
  tasks: Task[];
  costItemsSecondaryData?: any[];
  targetCostTotal?: number;
  projectData?: {
    actualProgress: number;
    targetProgress: number;
    plannedEndDate?: string;
  };
  /**
   * Historical progress trend across all approved+parsed accomplishment reports
   * (one point per week_ending_date). Used by the S-curve forecast band: the
   * band only renders when ≥6 reports exist.
   */
  progressTrend?: Array<{
    week_ending_date: string;
    actualProgress: number;
    targetProgress: number;
    slippage: number;
  }>;
}
