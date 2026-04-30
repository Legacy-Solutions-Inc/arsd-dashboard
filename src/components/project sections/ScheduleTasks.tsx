import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { 
  processScheduleTasksData, 
  getTaskColor, 
  isTaskActiveInWeek,
  calculateTaskPagination,
  calculateAccomplishmentsPagination
} from "@/utils/schedule-tasks-utils";
import { ScheduleTasksProps, Task, GanttTask, WeeklyAccomplishment } from "@/types/schedule-tasks";

// Interfaces are now imported from types file

export function ScheduleTasks({ tasks, costItemsSecondaryData = [], targetCostTotal = 0, projectData }: ScheduleTasksProps) {
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentAccomplishmentsPage, setCurrentAccomplishmentsPage] = useState(1);
  const itemsPerPage = 5;

  // Process all schedule tasks data using utility functions
  const {
    ganttTasks,
    timelineBounds,
    weeklyTimeline,
    weeklyAccomplishments,
    sCurveData,
    totalProjectCost,
    totalWeight
  } = useMemo(() => {
    if (!projectData) {
      return {
        ganttTasks: [],
        timelineBounds: { start: new Date(), end: new Date() },
        weeklyTimeline: [],
        weeklyAccomplishments: [],
        sCurveData: [],
        totalProjectCost: 0,
        totalWeight: 0
      };
    }

    return processScheduleTasksData(costItemsSecondaryData, targetCostTotal, projectData);
  }, [costItemsSecondaryData, targetCostTotal, projectData]);

  // Calculate pagination for tasks
  const taskPagination = useMemo(() => {
    return calculateTaskPagination(ganttTasks, currentPage, itemsPerPage);
  }, [ganttTasks, currentPage, itemsPerPage]);

  // Calculate pagination for accomplishments
  const accomplishmentsPagination = useMemo(() => {
    return calculateAccomplishmentsPagination(weeklyAccomplishments, currentAccomplishmentsPage, itemsPerPage);
  }, [weeklyAccomplishments, currentAccomplishmentsPage, itemsPerPage]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-foreground">
          Gantt chart & schedule
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="gantt" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="gantt">Gantt chart</TabsTrigger>
            <TabsTrigger value="table">Table view</TabsTrigger>
          </TabsList>

          <TabsContent value="gantt" className="space-y-4 lg:space-y-6 mt-4">
            {ganttTasks.length > 0 ? (
              <div className="space-y-4 lg:space-y-6">
                {/* Project summary */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-muted/40 rounded-md border border-border">
                  <div>
                    <div className="text-sm font-semibold text-foreground nums">₱{totalProjectCost.toLocaleString()}</div>
                    <div className="text-[11px] uppercase tracking-[0.06em] text-muted-foreground">Total project cost</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground nums">{ganttTasks.length}</div>
                    <div className="text-[11px] uppercase tracking-[0.06em] text-muted-foreground">Total tasks</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground nums">{weeklyTimeline.length}</div>
                    <div className="text-[11px] uppercase tracking-[0.06em] text-muted-foreground">Duration (weeks)</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground nums">{totalWeight.toFixed(2)}%</div>
                    <div className="text-[11px] uppercase tracking-[0.06em] text-muted-foreground">Project weight</div>
                  </div>
                </div>

                {/* Gantt Chart */}
                <div className="border rounded-lg flex overflow-x-auto">
                  {/* Left Column: Task Details (2/3 width) */}
                  <div className="w-3/5 lg:w-3/5 flex-shrink-0 border-r-2 border-gray-300 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:bg-transparent [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300/50 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400/50 [&::-webkit-scrollbar-thumb]:border-0">
                    {/* Task Details Header */}
                    <div className="bg-gray-50 border-b-2 border-gray-300">
                      <div className="grid grid-cols-6 gap-1 lg:gap-2 p-3 lg:p-5 text-xs font-semibold text-gray-700 items-center text-center">
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
                        selectedTask === task.id ? 'bg-muted/60' : ''
                      }`}>
                        <div className="grid grid-cols-6 gap-1 lg:gap-2 p-2 lg:p-3 text-xs items-center text-center">
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
                    <div className="border-t-2 border-gray-300 mt-4 lg:mt-6">
                      <div className="p-2 lg:p-3 text-xs lg:text-sm font-semibold text-gray-700 bg-gray-100 min-w-[200px] lg:min-w-[300px]">ACCOMPLISHMENT TYPE</div>
                    </div>

                    {/* Accomplishment Rows (Left part) */}
                    <div className="space-y-0">
                      <div className="hover:bg-muted/40 transition-colors">
                        <div className="p-2 lg:p-3 text-xs lg:text-sm bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300 font-medium min-w-[200px] lg:min-w-[300px]">
                          PERIODIC PHYSICAL ACCOMPLISHMENT (%)
                        </div>
                      </div>
                      <div className="hover:bg-muted/40 transition-colors">
                        <div className="p-2 lg:p-3 text-xs lg:text-sm bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 font-medium min-w-[200px] lg:min-w-[300px]">
                          PERIODIC FINANCIAL ACCOMPLISHMENT (PHP)
                        </div>
                      </div>
                      <div className="hover:bg-muted/40 transition-colors">
                        <div className="p-2 lg:p-3 text-xs lg:text-sm bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 font-medium min-w-[200px] lg:min-w-[300px]">
                          ACCUMULATIVE PHYSICAL ACCOMPLISHMENT (%)
                        </div>
                      </div>
                      <div className="hover:bg-muted/40 transition-colors">
                        <div className="p-2 lg:p-3 text-xs lg:text-sm bg-violet-50 text-violet-800 dark:bg-violet-950/40 dark:text-violet-300 font-medium min-w-[200px] lg:min-w-[300px]">
                          ACCUMULATIVE FINANCIAL ACCOMPLISHMENT (PHP)
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Timeline (2/5 width) - Single scrollbar at bottom */}
                  <div className="w-2/5 lg:w-2/5 overflow-x-auto [&::-webkit-scrollbar]:h-0.5 [&::-webkit-scrollbar]:bg-transparent [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300/50 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400/50 [&::-webkit-scrollbar-thumb]:border-0">
                    <div className="min-w-max">
                      {/* Timeline Header */}
                      <div className="flex border-b-2 border-gray-300 bg-gray-50">
                        {weeklyTimeline.map((week, index) => (
                          <div key={index} className="w-16 lg:w-20 flex-shrink-0 text-center p-2 lg:p-3 border-r border-gray-200">
                            <div className="font-bold text-xs">{week.label}</div>
                            <div className="text-gray-500 text-xs">{week.dateLabel}</div>
                          </div>
                        ))}
                      </div>

                      {/* Timeline Bars for each task */}
                      {ganttTasks.map((task, index) => (
                        <div key={task.id} className={`relative h-8 lg:h-10 border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                          selectedTask === task.id ? 'bg-muted/60' : ''
                        }`}>
                          <div className="flex h-full">
                            {weeklyTimeline.map((week, weekIndex) => {
                              const isActive = isTaskActiveInWeek(task, week.start, week.end);
                              
                              return (
                                <div key={weekIndex} className="w-16 lg:w-20 flex-shrink-0 h-full border-r border-gray-200 relative">
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
                      <div className="flex border-b-2 border-gray-300 border-t-2 mt-4 lg:mt-7">
                        {weeklyTimeline.map((week, index) => (
                          <div key={index} className="w-16 lg:w-20 flex-shrink-0 text-center p-2 lg:p-4 border-r border-gray-200 text-xs font-semibold text-gray-700 bg-gray-100">
                            {week.label}
                          </div>
                        ))}
                      </div>

                      {/* Accomplishment Rows (Right part) */}
                      <div className="space-y-0">
                        <div className="flex hover:bg-muted/40 transition-colors">
                          {weeklyAccomplishments.map((acc, index) => (
                            <div key={index} className="w-16 lg:w-20 flex-shrink-0 text-center p-2 lg:p-4 text-xs border-r border-gray-200 font-medium bg-blue-50 text-blue-800">
                              {acc.periodicPhysical.toFixed(2)}%
                            </div>
                          ))}
                        </div>
                        <div className="flex hover:bg-muted/40 transition-colors">
                          {weeklyAccomplishments.map((acc, index) => (
                            <div key={index} className="w-16 lg:w-20 flex-shrink-0 text-center p-2 lg:p-3 text-xs border-r border-gray-200 font-medium bg-green-50 text-green-800">
                              ₱{acc.periodicFinancial.toLocaleString()}
                            </div>
                          ))}
                        </div>
                        <div className="flex hover:bg-muted/40 transition-colors">
                          {weeklyAccomplishments.map((acc, index) => (
                            <div key={index} className="w-16 lg:w-20 flex-shrink-0 text-center p-2 lg:p-3 text-xs border-r border-gray-200 font-medium bg-yellow-50 text-yellow-800">
                              {acc.accumulativePhysical.toFixed(2)}%
                            </div>
                          ))}
                        </div>
                        <div className="flex hover:bg-muted/40 transition-colors">
                          {weeklyAccomplishments.map((acc, index) => (
                            <div key={index} className="w-16 lg:w-20 flex-shrink-0 text-center p-2 lg:p-3 text-xs border-r border-gray-200 font-medium bg-purple-50 text-purple-800">
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
                  <div className="p-4 lg:p-6 bg-muted/40 rounded-md border border-border">
                    {(() => {
                      const task = ganttTasks.find(t => t.id === selectedTask);
                      if (!task) return null;
                      
                      return (
                        <div>
                          <h4 className="text-base font-semibold text-foreground mb-3">{task.description}</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs sm:text-sm">
                            {[
                              { label: 'Item', value: task.item },
                              { label: 'Type', value: <Badge variant="outline">{task.type}</Badge> },
                              { label: 'Start date', value: new Date(task.startDate).toLocaleDateString() },
                              { label: 'End date', value: new Date(task.endDate).toLocaleDateString() },
                              { label: 'Duration', value: `${task.duration} days` },
                              { label: 'Cost', value: <span className="font-semibold nums">₱{task.cost.toLocaleString()}</span> },
                              { label: 'Weight', value: `${task.weight?.toFixed(2) || '0.00'}%` },
                              { label: 'Manpower', value: task.manpower || 0 },
                            ].map((f) => (
                              <div key={f.label} className="bg-card border border-border rounded-md p-3">
                                <div className="text-[11px] uppercase tracking-[0.06em] text-muted-foreground">{f.label}</div>
                                <div className="text-sm text-foreground mt-0.5 nums">{f.value}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Legend */}
                <div className="flex flex-wrap items-center justify-center gap-4 lg:gap-6 text-xs lg:text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 lg:w-4 lg:h-4 bg-blue-500 rounded"></div>
                    <span className="font-medium">Target</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 lg:w-4 lg:h-4 bg-green-500 rounded"></div>
                    <span className="font-medium">Actual</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 lg:w-4 lg:h-4 bg-gray-500 rounded"></div>
                    <span className="font-medium">Completed</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-10">
                <h3 className="text-sm font-semibold text-foreground mb-1">No task data yet</h3>
                <p className="text-sm text-muted-foreground">Upload accomplishment reports to see the Gantt chart.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="table" className="space-y-4">
            {ganttTasks.length > 0 ? (
              <div className="space-y-4">
                {/* Project summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-muted/40 rounded-md border border-border">
                  <div>
                    <div className="text-sm font-semibold text-foreground nums">₱{totalProjectCost.toLocaleString()}</div>
                    <div className="text-[11px] uppercase tracking-[0.06em] text-muted-foreground">Total project cost</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground nums">{ganttTasks.length}</div>
                    <div className="text-[11px] uppercase tracking-[0.06em] text-muted-foreground">Total tasks</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground nums">{weeklyTimeline.length}</div>
                    <div className="text-[11px] uppercase tracking-[0.06em] text-muted-foreground">Duration (weeks)</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground nums">{totalWeight.toFixed(2)}%</div>
                    <div className="text-[11px] uppercase tracking-[0.06em] text-muted-foreground">Project weight</div>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Item Type</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Description</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Weight %</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Cost</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Start Date</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">End Date</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Duration (Days)</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Type</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {taskPagination.paginatedTasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium text-xs">{task.item}</TableCell>
                        <TableCell className="max-w-xs truncate text-xs" title={task.description}>
                          {task.description}
                        </TableCell>
                        <TableCell className="text-xs">{task.weight?.toFixed(2) || '0.00'}%</TableCell>
                        <TableCell className="font-semibold text-green-600 text-xs">₱{task.cost.toLocaleString()}</TableCell>
                        <TableCell className="text-xs">{new Date(task.startDate).toLocaleDateString('en-GB')}</TableCell>
                        <TableCell className="text-xs">{new Date(task.endDate).toLocaleDateString('en-GB')}</TableCell>
                        <TableCell className="text-xs">{task.duration} days</TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
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

                {/* Pagination Controls */}
                {taskPagination.totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 pt-4 border-t gap-3">
                    <div className="text-xs text-gray-600 text-center sm:text-left">
                      Showing {taskPagination.startIndex + 1} to {Math.min(taskPagination.endIndex, ganttTasks.length)} of {ganttTasks.length} tasks
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="text-xs"
                      >
                        <ChevronLeft className="h-3 w-3" />
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: taskPagination.totalPages }, (_, i) => i + 1).map((page) => (
                          <Button
                            key={page}
                            variant={page === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="text-xs w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.min(taskPagination.totalPages, currentPage + 1))}
                        disabled={currentPage === taskPagination.totalPages}
                        className="text-xs"
                      >
                        Next
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* S-Curve Chart */}
                {sCurveData.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-foreground mb-3">Project progress (S-curve)</h3>
                    <div className="bg-card rounded-md p-4 border border-border">
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
                            tickCount={11}
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
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-foreground mb-3">Weekly accomplishments</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Week</TableHead>
                          <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Week Start</TableHead>
                          <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Periodic Physical (%)</TableHead>
                          <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Periodic Financial (₱)</TableHead>
                          <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Accumulative Physical (%)</TableHead>
                          <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Accumulative Financial (₱)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {accomplishmentsPagination.paginatedAccomplishments.map((acc, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium text-xs">Week {acc.week}</TableCell>
                            <TableCell className="text-xs">{new Date(acc.weekStart).toLocaleDateString('en-GB')}</TableCell>
                            <TableCell className="text-blue-600 font-medium text-xs">{acc.periodicPhysical.toFixed(2)}%</TableCell>
                            <TableCell className="text-green-600 font-medium text-xs">₱{acc.periodicFinancial.toLocaleString()}</TableCell>
                            <TableCell className="text-yellow-600 font-medium text-xs">{acc.accumulativePhysical.toFixed(2)}%</TableCell>
                            <TableCell className="text-purple-600 font-medium text-xs">₱{acc.accumulativeFinancial.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Pagination Controls for Weekly Accomplishments */}
                    {accomplishmentsPagination.totalPages > 1 && (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 pt-4 border-t gap-3">
                        <div className="text-xs text-gray-600 text-center sm:text-left">
                          Showing {accomplishmentsPagination.startIndex + 1} to {Math.min(accomplishmentsPagination.endIndex, weeklyAccomplishments.length)} of {weeklyAccomplishments.length} accomplishments
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentAccomplishmentsPage(Math.max(1, currentAccomplishmentsPage - 1))}
                            disabled={currentAccomplishmentsPage === 1}
                            className="text-xs"
                          >
                            <ChevronLeft className="h-3 w-3" />
                            Previous
                          </Button>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: accomplishmentsPagination.totalPages }, (_, i) => i + 1).map((page) => (
                              <Button
                                key={page}
                                variant={page === currentAccomplishmentsPage ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentAccomplishmentsPage(page)}
                                className="text-xs w-8 h-8 p-0"
                              >
                                {page}
                              </Button>
                            ))}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentAccomplishmentsPage(Math.min(accomplishmentsPagination.totalPages, currentAccomplishmentsPage + 1))}
                            disabled={currentAccomplishmentsPage === accomplishmentsPagination.totalPages}
                            className="text-xs"
                          >
                            Next
                            <ChevronRight className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-10">
                <h3 className="text-sm font-semibold text-foreground mb-1">No task data yet</h3>
                <p className="text-sm text-muted-foreground">Upload accomplishment reports to see the table view.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}