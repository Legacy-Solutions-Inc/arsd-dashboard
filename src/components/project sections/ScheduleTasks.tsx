import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useState, useMemo } from "react";

interface Task {
  id: number;
  name: string;
  progress: number;
  weight: number;
  cost: number;
  startDate: string;
  endDate: string;
  status: string;
}

interface GanttTask {
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

interface WeeklyAccomplishment {
  week: number;
  weekStart: string;
  periodicPhysical: number;
  periodicFinancial: number;
  accumulativePhysical: number;
  accumulativeFinancial: number;
}

interface ScheduleTasksProps {
  tasks: Task[];
  costItemsSecondaryData?: any[];
  targetCostTotal?: number;
  projectData?: {
    actualProgress: number;
    targetProgress: number;
  };
}

export function ScheduleTasks({ tasks, costItemsSecondaryData = [], targetCostTotal = 0, projectData }: ScheduleTasksProps) {
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  // Process costItemsSecondaryData into Gantt tasks
  const ganttTasks = useMemo(() => {
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
  }, [costItemsSecondaryData, targetCostTotal]);

  // Calculate timeline bounds
  const timelineBounds = useMemo(() => {
    if (ganttTasks.length === 0) return { start: new Date(), end: new Date() };
    
    const dates = ganttTasks.flatMap(task => [
      new Date(task.startDate),
      new Date(task.endDate)
    ]);
    
    return {
      start: new Date(Math.min(...dates.map(d => d.getTime()))),
      end: new Date(Math.max(...dates.map(d => d.getTime())))
    };
  }, [ganttTasks]);

  // Generate weekly timeline
  const weeklyTimeline = useMemo(() => {
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
  }, [timelineBounds, ganttTasks]);

  // Generate weekly accomplishments (mock data for now)
  const weeklyAccomplishments = useMemo(() => {
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
  }, [weeklyTimeline, ganttTasks]);

  // Generate S-curve data based on accumulative physical accomplishment
  const sCurveData = useMemo(() => {
    if (ganttTasks.length === 0 || !projectData || targetCostTotal === 0) return [];
    
    const data: { week: string; date: string; progress: number }[] = [];
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
  }, [weeklyTimeline, ganttTasks, projectData, targetCostTotal, weeklyAccomplishments]);

  // Get task color based on type
  const getTaskColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'target': return 'bg-blue-500';
      case 'actual': return 'bg-green-500';
      case 'completed': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  const totalProjectCost = ganttTasks.reduce((sum, task) => sum + task.cost, 0);
  const totalWeight = ganttTasks.reduce((sum, task) => sum + (task.weight || 0), 0);

  return (
    <Card className="border-l-4 border-l-arsd-red mt-6">
      <CardHeader>
        <CardTitle className="text-arsd-red">Project Gantt Chart & Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="gantt" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="gantt">Gantt Chart</TabsTrigger>
            <TabsTrigger value="table">Table View</TabsTrigger>
          </TabsList>

          <TabsContent value="gantt" className="space-y-6">
            {ganttTasks.length > 0 ? (
              <div className="space-y-6">
                {/* Project Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-arsd-red">₱{totalProjectCost.toLocaleString()}</div>
                    <div className="text-sm text-gray-600 font-medium">Total Project Cost</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-arsd-red">{ganttTasks.length}</div>
                    <div className="text-sm text-gray-600 font-medium">Total Tasks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-arsd-red">{weeklyTimeline.length}</div>
                    <div className="text-sm text-gray-600 font-medium">Project Duration (Weeks)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-arsd-red">{totalWeight.toFixed(2)}%</div>
                    <div className="text-sm text-gray-600 font-medium">Project Weight</div>
                  </div>
                </div>

                {/* Gantt Chart */}
                <div className="border rounded-lg flex">
                  {/* Left Column: Task Details (2/3 width) */}
                  <div className="w-3/5 flex-shrink-0 border-r-2 border-gray-300 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:bg-transparent [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300/50 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400/50 [&::-webkit-scrollbar-thumb]:border-0">
                    {/* Task Details Header */}
                    <div className="bg-gray-50 border-b-2 border-gray-300">
                      <div className="grid grid-cols-6 gap-2 p-5 text-xs font-semibold text-gray-700 items-center text-center">
                        <div>ITEM TYPE</div>
                        <div>DESCRIPTION</div>
                        <div>TOTAL COST</div>
                        <div>WT.%</div>
                        <div>START</div>
                        <div>FINISH</div>
                      </div>
                    </div>

                    {/* Task Details for each task */}
                    {ganttTasks.map((task, index) => (
                      <div key={task.id} className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                        selectedTask === task.id ? 'bg-blue-50' : ''
                      }`}>
                        <div className="grid grid-cols-6 gap-2 p-3 text-xs items-center text-center">
                          <div className="font-medium text-gray-900 truncate" title={task.item}>{task.item}</div>
                          <div className="text-gray-700 truncate" title={task.description}>
                            {task.description}
                          </div>
                          <div className="font-semibold text-green-600">₱{task.cost.toLocaleString()}</div>
                          <div className="text-blue-600">{task.weight?.toFixed(2) || '0.00'}%</div>
                          <div className="text-gray-600">{new Date(task.startDate).toLocaleDateString('en-GB')}</div>
                          <div className="text-gray-600">{new Date(task.endDate).toLocaleDateString('en-GB')}</div>
                        </div>
                      </div>
                    ))}

                    {/* Weekly Accomplishments Header (Left part) */}
                    <div className="border-t-2 border-gray-300 mt-6">
                      <div className="p-3 text-sm font-semibold text-gray-700 bg-gray-100 min-w-[300px]">ACCOMPLISHMENT TYPE</div>
                    </div>

                    {/* Accomplishment Rows (Left part) */}
                    <div className="space-y-0">
                      <div className="hover:bg-blue-50 transition-colors">
                        <div className="p-3 text-sm bg-blue-50 font-medium text-blue-800 min-w-[300px]">
                          PERIODIC PHYSICAL ACCOMPLISHMENT (%)
                        </div>
                      </div>
                      <div className="hover:bg-green-50 transition-colors">
                        <div className="p-3 text-sm bg-green-50 font-medium text-green-800 min-w-[300px]">
                          PERIODIC FINANCIAL ACCOMPLISHMENT (PHP)
                        </div>
                      </div>
                      <div className="hover:bg-yellow-50 transition-colors">
                        <div className="p-3 text-sm bg-yellow-50 font-medium text-yellow-800 min-w-[300px]">
                          ACCUMULATIVE PHYSICAL ACCOMPLISHMENT (%)
                        </div>
                      </div>
                      <div className="hover:bg-purple-50 transition-colors">
                        <div className="p-3 text-sm bg-purple-50 font-medium text-purple-800 min-w-[300px]">
                          ACCUMULATIVE FINANCIAL ACCOMPLISHMENT (PHP)
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Timeline (2/5 width) - Single scrollbar at bottom */}
                  <div className="w-2/5 overflow-x-auto [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar]:bg-transparent [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300/50 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400/50 [&::-webkit-scrollbar-thumb]:border-0">
                    <div className="min-w-max">
                      {/* Timeline Header */}
                      <div className="flex border-b-2 border-gray-300 bg-gray-50">
                        {weeklyTimeline.map((week, index) => (
                          <div key={index} className="w-20 flex-shrink-0 text-center p-3 border-r border-gray-200">
                            <div className="font-bold text-xs">{week.label}</div>
                            <div className="text-gray-500 text-xs">{week.dateLabel}</div>
                          </div>
                        ))}
                      </div>

                      {/* Timeline Bars for each task */}
                      {ganttTasks.map((task, index) => (
                        <div key={task.id} className={`relative h-10 border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                          selectedTask === task.id ? 'bg-blue-50' : ''
                        }`}>
                          <div className="flex h-full">
                            {weeklyTimeline.map((week, weekIndex) => {
                              const taskStart = new Date(task.startDate);
                              const taskEnd = new Date(task.endDate);
                              const isActive = taskStart <= week.end && taskEnd >= week.start;
                              
                              return (
                                <div key={weekIndex} className="w-20 flex-shrink-0 h-full border-r border-gray-200 relative">
                                  {isActive && (
                                    <div
                                      className={`absolute top-1 bottom-1 left-1 right-1 rounded ${getTaskColor(task.type)} ${
                                        selectedTask === task.id ? 'ring-2 ring-blue-300' : ''
                                      } cursor-pointer hover:opacity-80 transition-all duration-200 shadow-sm`}
                                      onClick={() => setSelectedTask(
                                        selectedTask === task.id ? null : task.id
                                      )}
                                      title={`${task.description} (${task.startDate} - ${task.endDate})`}
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}

                      {/* Weekly Accomplishments Header (Right part) */}
                      <div className="flex border-b-2 border-gray-300 border-t-2 mt-6">
                        {weeklyTimeline.map((week, index) => (
                          <div key={index} className="w-20 flex-shrink-0 text-center p-3 border-r border-gray-200 text-xs font-semibold text-gray-700 bg-gray-100">
                            {week.label}
                          </div>
                        ))}
                      </div>

                      {/* Accomplishment Rows (Right part) */}
                      <div className="space-y-0">
                        <div className="flex hover:bg-blue-50 transition-colors">
                          {weeklyAccomplishments.map((acc, index) => (
                            <div key={index} className="w-20 flex-shrink-0 text-center p-3 text-xs border-r border-gray-200 font-medium bg-blue-50 text-blue-800">
                              {acc.periodicPhysical.toFixed(2)}
                            </div>
                          ))}
                        </div>
                        <div className="flex hover:bg-green-50 transition-colors">
                          {weeklyAccomplishments.map((acc, index) => (
                            <div key={index} className="w-20 flex-shrink-0 text-center p-3 text-xs border-r border-gray-200 font-medium bg-green-50 text-green-800">
                              ₱{acc.periodicFinancial.toLocaleString()}
                            </div>
                          ))}
                        </div>
                        <div className="flex hover:bg-yellow-50 transition-colors">
                          {weeklyAccomplishments.map((acc, index) => (
                            <div key={index} className="w-20 flex-shrink-0 text-center p-3 text-xs border-r border-gray-200 font-medium bg-yellow-50 text-yellow-800">
                              {acc.accumulativePhysical.toFixed(2)}
                            </div>
                          ))}
                        </div>
                        <div className="flex hover:bg-purple-50 transition-colors">
                          {weeklyAccomplishments.map((acc, index) => (
                            <div key={index} className="w-20 flex-shrink-0 text-center p-3 text-xs border-r border-gray-200 font-medium bg-purple-50 text-purple-800">
                              ₱{acc.accumulativeFinancial.toLocaleString()}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Selected Task Details */}
                {selectedTask && (
                  <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    {(() => {
                      const task = ganttTasks.find(t => t.id === selectedTask);
                      if (!task) return null;
                      
                      return (
                        <div>
                          <h4 className="text-xl font-bold text-blue-800 mb-4">{task.description}</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="bg-white p-3 rounded border">
                              <div className="text-blue-600 font-medium">Item</div>
                              <div className="text-gray-900">{task.item}</div>
                            </div>
                            <div className="bg-white p-3 rounded border">
                              <div className="text-blue-600 font-medium">Type</div>
                              <Badge variant="outline" className="text-blue-600">{task.type}</Badge>
                            </div>
                            <div className="bg-white p-3 rounded border">
                              <div className="text-blue-600 font-medium">Start Date</div>
                              <div className="text-gray-900">{new Date(task.startDate).toLocaleDateString()}</div>
                            </div>
                            <div className="bg-white p-3 rounded border">
                              <div className="text-blue-600 font-medium">End Date</div>
                              <div className="text-gray-900">{new Date(task.endDate).toLocaleDateString()}</div>
                            </div>
                            <div className="bg-white p-3 rounded border">
                              <div className="text-blue-600 font-medium">Duration</div>
                              <div className="text-gray-900">{task.duration} days</div>
                            </div>
                            <div className="bg-white p-3 rounded border">
                              <div className="text-blue-600 font-medium">Cost</div>
                              <div className="text-green-600 font-semibold">₱{task.cost.toLocaleString()}</div>
                            </div>
                            <div className="bg-white p-3 rounded border">
                              <div className="text-blue-600 font-medium">Weight</div>
                              <div className="text-gray-900">{task.weight?.toFixed(2) || '0.00'}%</div>
                            </div>
                            <div className="bg-white p-3 rounded border">
                              <div className="text-blue-600 font-medium">Manpower</div>
                              <div className="text-gray-900">{task.manpower || 0}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Legend */}
                <div className="flex items-center justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <span className="font-medium">Target</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span className="font-medium">Actual</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-500 rounded"></div>
                    <span className="font-medium">Completed</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📊</div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Task Data Available</h3>
                <p className="text-gray-500">Upload accomplishment reports to see the Gantt chart</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="table" className="space-y-4">
            {ganttTasks.length > 0 ? (
              <div className="space-y-4">
                {/* Project Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-arsd-red">₱{totalProjectCost.toLocaleString()}</div>
                    <div className="text-sm text-gray-600 font-medium">Total Project Cost</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-arsd-red">{ganttTasks.length}</div>
                    <div className="text-sm text-gray-600 font-medium">Total Tasks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-arsd-red">{weeklyTimeline.length}</div>
                    <div className="text-sm text-gray-600 font-medium">Project Duration (Weeks)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-arsd-red">{totalWeight.toFixed(2)}%</div>
                    <div className="text-sm text-gray-600 font-medium">Project Weight</div>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-arsd-red">Item Type</TableHead>
                      <TableHead className="text-arsd-red">Description</TableHead>
                      <TableHead className="text-arsd-red">Weight %</TableHead>
                      <TableHead className="text-arsd-red">Cost</TableHead>
                      <TableHead className="text-arsd-red">Start Date</TableHead>
                      <TableHead className="text-arsd-red">End Date</TableHead>
                      <TableHead className="text-arsd-red">Duration (Days)</TableHead>
                      <TableHead className="text-arsd-red">Type</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {ganttTasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">{task.item}</TableCell>
                        <TableCell className="max-w-xs truncate" title={task.description}>
                          {task.description}
                        </TableCell>
                        <TableCell>{task.weight?.toFixed(2) || '0.00'}%</TableCell>
                        <TableCell className="font-semibold text-green-600">₱{task.cost.toLocaleString()}</TableCell>
                        <TableCell>{new Date(task.startDate).toLocaleDateString('en-GB')}</TableCell>
                        <TableCell>{new Date(task.endDate).toLocaleDateString('en-GB')}</TableCell>
                        <TableCell>{task.duration} days</TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={`${
                              task.type.toLowerCase() === 'target' 
                                ? 'bg-blue-100 text-blue-800 border-blue-200' 
                                : task.type.toLowerCase() === 'actual'
                                ? 'bg-green-100 text-green-800 border-green-200'
                                : 'bg-gray-100 text-gray-800 border-gray-200'
                            }`}
                          >
                            {task.type}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* S-Curve Chart */}
                {sCurveData.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-arsd-red mb-4">Project Progress S-Curve</h3>
                    <div className="bg-white rounded-lg p-4 shadow-sm border">
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={sCurveData} margin={{ top: 20, right: 30, left: 60, bottom: 60 }}>
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 10 }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                            interval="preserveStartEnd"
                          />
                          <YAxis 
                            domain={[0, 100]} 
                            tickFormatter={(v: number) => `${v.toFixed(2)}%`}
                            tick={{ fontSize: 12 }}
                            tickCount={6}
                          />
                          <Tooltip 
                            formatter={(value) => [`${value}%`, 'Accumulative Physical Accomplishment']}
                            labelFormatter={(label) => `Date: ${label}`}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="progress" 
                            name="Accumulative Physical Accomplishment" 
                            stroke="#b91c1c" 
                            strokeWidth={3} 
                            dot={{ fill: '#b91c1c', strokeWidth: 2, r: 4 }} 
                            connectNulls={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    
                    {/* S-Curve Summary */}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    </div>
                  </div>
                )}

                {/* Weekly Accomplishments Table */}
                {weeklyAccomplishments.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-arsd-red mb-4">Weekly Accomplishments</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-arsd-red">Week</TableHead>
                          <TableHead className="text-arsd-red">Week Start</TableHead>
                          <TableHead className="text-arsd-red">Periodic Physical (%)</TableHead>
                          <TableHead className="text-arsd-red">Periodic Financial (₱)</TableHead>
                          <TableHead className="text-arsd-red">Accumulative Physical (%)</TableHead>
                          <TableHead className="text-arsd-red">Accumulative Financial (₱)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {weeklyAccomplishments.map((acc, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">Week {acc.week}</TableCell>
                            <TableCell>{new Date(acc.weekStart).toLocaleDateString('en-GB')}</TableCell>
                            <TableCell className="text-blue-600 font-medium">{acc.periodicPhysical.toFixed(2)}%</TableCell>
                            <TableCell className="text-green-600 font-medium">₱{acc.periodicFinancial.toLocaleString()}</TableCell>
                            <TableCell className="text-yellow-600 font-medium">{acc.accumulativePhysical.toFixed(2)}%</TableCell>
                            <TableCell className="text-purple-600 font-medium">₱{acc.accumulativeFinancial.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📊</div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Task Data Available</h3>
                <p className="text-gray-500">Upload accomplishment reports to see the table view</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}