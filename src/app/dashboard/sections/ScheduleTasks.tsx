import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

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

interface ScheduleTasksProps {
  tasks: Task[];
}

export function ScheduleTasks({ tasks }: ScheduleTasksProps) {
  return (
    
    <Card className="border-l-4 border-l-arsd-red mt-6">
      <CardHeader>
        <CardTitle>Task Schedule & Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-arsd-red">Task Name</TableHead>
              <TableHead className="text-arsd-red">Progress</TableHead>
              <TableHead className="text-arsd-red">Weight %</TableHead>
              <TableHead className="text-arsd-red">Cost</TableHead>
              <TableHead className="text-arsd-red">Start Date</TableHead>
              <TableHead className="text-arsd-red">End Date</TableHead>
              <TableHead className="text-arsd-red">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell className="font-medium">{task.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={task.progress} className="w-20 h-2" />
                    <span className="text-sm">{task.progress}%</span>
                  </div>
                </TableCell>
                <TableCell>{task.weight}%</TableCell>
                <TableCell>₱{task.cost.toLocaleString()}</TableCell>
                <TableCell>{task.startDate}</TableCell>
                <TableCell>{task.endDate}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    task.status === "completed"
                      ? "bg-green-100 text-green-800"
                      : task.status === "in-progress"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-800"
                  }`}>
                    {task.status.replace("-", " ")}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
