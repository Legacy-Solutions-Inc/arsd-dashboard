import { GanttTask, WeeklyAccomplishment } from '@/types/schedule-tasks';

export interface TaskProcessingResult {
  ganttTasks: GanttTask[];
  timelineBounds: { start: Date; end: Date };
  weeklyTimeline: WeeklyTimelineItem[];
  weeklyAccomplishments: WeeklyAccomplishment[];
  sCurveData: SCurveDataPoint[];
  totalProjectCost: number;
  totalWeight: number;
}

export interface WeeklyTimelineItem {
  week: number;
  start: Date;
  end: Date;
  label: string;
  dateLabel: string;
}

export interface SCurveDataPoint {
  week: string;
  date: string;
  progress: number;
}

/**
 * Process cost items secondary data into Gantt tasks
 */
export const processCostItemsToGanttTasks = (
  costItemsSecondaryData: any[],
  targetCostTotal: number = 0
): GanttTask[] => {
  if (!costItemsSecondaryData || costItemsSecondaryData.length === 0) return [];

  const taskMap = new Map<string, GanttTask>();
  
  costItemsSecondaryData.forEach((item, index) => {
    // Skip invalid entries
    if (!item || (!item.item && !item.type && !item.description)) return;
    
    const key = `${item.item || item.type || `item-${index}`}-${item.description || item.name || 'task'}`;
    
    if (!taskMap.has(key)) {
      // Create new task with proper validation
      const startDate = item.date || item.start_date;
      const endDate = item.end_date || item.date;
      
      // Validate dates
      if (!startDate || startDate === 'Invalid Date' || isNaN(new Date(startDate).getTime())) {
        return; // Skip invalid entries
      }
      
      taskMap.set(key, {
        id: key,
        item: item.item || item.type || `Item ${index + 1}`,
        description: item.description || item.name || 'Task Description',
        startDate: startDate,
        endDate: endDate || startDate,
        cost: parseFloat(item.cost) || 0,
        type: item.type || 'target',
        weight: parseFloat(item.weight) || 0,
        manpower: parseInt(item.manpower) || 0,
        duration: 0
      });
    } else {
      // Update existing task
      const existing = taskMap.get(key)!;
      const currentDate = item.date || item.start_date;
      
      if (currentDate && currentDate !== 'Invalid Date' && !isNaN(new Date(currentDate).getTime())) {
        // Update end date if current date is later
        if (new Date(currentDate) > new Date(existing.endDate)) {
          existing.endDate = currentDate;
        }
        // Update start date if current date is earlier
        if (new Date(currentDate) < new Date(existing.startDate)) {
          existing.startDate = currentDate;
        }
      }
      // Accumulate cost
      existing.cost += parseFloat(item.cost) || 0;
    }
  });

  // Calculate duration for each task and filter out invalid ones
  const validTasks = Array.from(taskMap.values()).filter(task => {
    const start = new Date(task.startDate);
    const end = new Date(task.endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return false;
    }
    
    task.duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return task.duration > 0;
  });

  // Calculate weight percentage for each task based on target cost total
  validTasks.forEach(task => {
    if (targetCostTotal > 0) {
      // Calculate weight based on: (item cost / target cost total) * 100
      task.weight = (task.cost / targetCostTotal) * 100;
    } else {
      // Fallback to 0 if no target cost total provided
      task.weight = 0;
    }
  });

  return validTasks.sort((a, b) => 
    new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );
};

/**
 * Calculate timeline bounds from Gantt tasks
 */
export const calculateTimelineBounds = (ganttTasks: GanttTask[]): { start: Date; end: Date } => {
  if (ganttTasks.length === 0) return { start: new Date(), end: new Date() };
  
  const dates = ganttTasks.flatMap(task => [
    new Date(task.startDate),
    new Date(task.endDate)
  ]);
  
  return {
    start: new Date(Math.min(...dates.map(d => d.getTime()))),
    end: new Date(Math.max(...dates.map(d => d.getTime())))
  };
};

/**
 * Generate weekly timeline from timeline bounds
 */
export const generateWeeklyTimeline = (
  timelineBounds: { start: Date; end: Date },
  ganttTasks: GanttTask[]
): WeeklyTimelineItem[] => {
  if (ganttTasks.length === 0) return [];
  
  const weeks = [];
  const current = new Date(timelineBounds.start);
  const end = new Date(timelineBounds.end);
  
  // Start from the beginning of the week
  current.setDate(current.getDate() - current.getDay());
  
  let weekNumber = 1;
  while (current <= end) {
    const weekStart = new Date(current);
    const weekEnd = new Date(current);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    weeks.push({
      week: weekNumber,
      start: weekStart,
      end: weekEnd,
      label: `WEEK ${weekNumber}`,
      dateLabel: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    });
    
    current.setDate(current.getDate() + 7);
    weekNumber++;
  }
  
  return weeks;
};

/**
 * Generate weekly accomplishments data
 */
export const generateWeeklyAccomplishments = (
  weeklyTimeline: WeeklyTimelineItem[],
  ganttTasks: GanttTask[]
): WeeklyAccomplishment[] => {
  if (ganttTasks.length === 0) return [];
  
  const totalCost = ganttTasks.reduce((sum, task) => sum + task.cost, 0);
  const accomplishments: WeeklyAccomplishment[] = [];
  
  let accumulativePhysical = 0;
  let accumulativeFinancial = 0;
  
  weeklyTimeline.forEach((week, index) => {
    // Calculate periodic values (mock calculation)
    const periodicPhysical = Math.random() * 8; // 0-8% per week
    const periodicFinancial = Math.random() * (totalCost * 0.1); // 0-10% of total cost
    
    accumulativePhysical += periodicPhysical;
    accumulativeFinancial += periodicFinancial;
    
    // Cap at 100%
    if (accumulativePhysical > 100) accumulativePhysical = 100;
    if (accumulativeFinancial > totalCost) accumulativeFinancial = totalCost;
    
    accomplishments.push({
      week: week.week,
      weekStart: week.start.toISOString().split('T')[0],
      periodicPhysical: Math.round(periodicPhysical * 100) / 100,
      periodicFinancial: Math.round(periodicFinancial * 100) / 100,
      accumulativePhysical: Math.round(accumulativePhysical * 100) / 100,
      accumulativeFinancial: Math.round(accumulativeFinancial * 100) / 100
    });
  });
  
  return accomplishments;
};

/**
 * Generate S-curve data based on accumulative physical accomplishment
 */
export const generateSCurveData = (
  weeklyTimeline: WeeklyTimelineItem[],
  ganttTasks: GanttTask[],
  projectData: { actualProgress: number; targetProgress: number },
  targetCostTotal: number,
  weeklyAccomplishments: WeeklyAccomplishment[]
): SCurveDataPoint[] => {
  if (ganttTasks.length === 0 || !projectData || targetCostTotal === 0) return [];
  
  const data: SCurveDataPoint[] = [];
  const totalWeeks = weeklyTimeline.length;
  
  // Generate S-curve data for each week based on accumulative physical accomplishment
  weeklyTimeline.forEach((week, weekIndex) => {
    // Use accumulative physical accomplishment for S-curve progress
    let sCurveProgress = 0;
    if (weeklyAccomplishments.length > weekIndex) {
      // Use the accumulative physical accomplishment from weekly accomplishments
      sCurveProgress = weeklyAccomplishments[weekIndex].accumulativePhysical;
    } else {
      // Fallback: calculate basic progress based on week position
      sCurveProgress = Math.min((weekIndex / (totalWeeks - 1)) * 100, 100);
    }
    
    // Cap progress at 100%
    sCurveProgress = Math.min(sCurveProgress, 100);
    
    data.push({
      week: `Week ${week.week}`,
      date: week.start.toLocaleDateString('en-GB'), // DD/MM/YYYY format
      progress: Math.round(sCurveProgress * 100) / 100
    });
  });
  
  return data;
};

/**
 * Calculate project summary statistics
 */
export const calculateProjectSummary = (ganttTasks: GanttTask[], weeklyTimeline: WeeklyTimelineItem[]) => {
  const totalProjectCost = ganttTasks.reduce((sum, task) => sum + task.cost, 0);
  const totalWeight = ganttTasks.reduce((sum, task) => sum + (task.weight || 0), 0);
  const projectDuration = weeklyTimeline.length;

  return {
    totalProjectCost,
    totalWeight,
    projectDuration,
    totalTasks: ganttTasks.length
  };
};

/**
 * Main function to process all schedule tasks data
 */
export const processScheduleTasksData = (
  costItemsSecondaryData: any[],
  targetCostTotal: number = 0,
  projectData: { actualProgress: number; targetProgress: number }
): TaskProcessingResult => {
  const ganttTasks = processCostItemsToGanttTasks(costItemsSecondaryData, targetCostTotal);
  const timelineBounds = calculateTimelineBounds(ganttTasks);
  const weeklyTimeline = generateWeeklyTimeline(timelineBounds, ganttTasks);
  const weeklyAccomplishments = generateWeeklyAccomplishments(weeklyTimeline, ganttTasks);
  const sCurveData = generateSCurveData(weeklyTimeline, ganttTasks, projectData, targetCostTotal, weeklyAccomplishments);
  
  const { totalProjectCost, totalWeight } = calculateProjectSummary(ganttTasks, weeklyTimeline);

  return {
    ganttTasks,
    timelineBounds,
    weeklyTimeline,
    weeklyAccomplishments,
    sCurveData,
    totalProjectCost,
    totalWeight
  };
};

/**
 * Get task color based on type
 */
export const getTaskColor = (type: string): string => {
  switch (type.toLowerCase()) {
    case 'target': return 'bg-blue-500';
    case 'actual': return 'bg-green-500';
    case 'completed': return 'bg-gray-500';
    default: return 'bg-blue-500';
  }
};

/**
 * Check if task is active during a specific week
 */
export const isTaskActiveInWeek = (task: GanttTask, weekStart: Date, weekEnd: Date): boolean => {
  const taskStart = new Date(task.startDate);
  const taskEnd = new Date(task.endDate);
  return taskStart <= weekEnd && taskEnd >= weekStart;
};

/**
 * Calculate pagination data for tasks
 */
export const calculateTaskPagination = (
  tasks: GanttTask[],
  currentPage: number,
  itemsPerPage: number
) => {
  const totalPages = Math.ceil(tasks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTasks = tasks.slice(startIndex, endIndex);

  return {
    totalPages,
    startIndex,
    endIndex,
    paginatedTasks
  };
};

/**
 * Calculate pagination data for accomplishments
 */
export const calculateAccomplishmentsPagination = (
  accomplishments: WeeklyAccomplishment[],
  currentPage: number,
  itemsPerPage: number
) => {
  const totalPages = Math.ceil(accomplishments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAccomplishments = accomplishments.slice(startIndex, endIndex);

  return {
    totalPages,
    startIndex,
    endIndex,
    paginatedAccomplishments
  };
};
