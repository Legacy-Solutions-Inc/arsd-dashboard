import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import React, { useState } from "react";

interface Material {
  name: string;
  unit: string;
  requested: number;
  received: number;
}

interface MaterialsProps {
  materials: Material[];
}

export function Materials({ materials }: MaterialsProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const selectedMaterial = materials[selectedIdx] || materials[0];

  // Pie chart data for selected material
  const pieData = selectedMaterial
    ? [
        { name: "Received", value: selectedMaterial.received },
        { name: "Pending", value: selectedMaterial.requested - selectedMaterial.received },
      ]
    : [];
  const pieColors = ["#B91C1C", "#FCA5A5"];

  // Calculate percent received
  const percentReceived = selectedMaterial && selectedMaterial.requested > 0
    ? Math.round((selectedMaterial.received / selectedMaterial.requested) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      {/* Left: Material Requests Overview */}
      <Card className="border-l-4 border-l-red-500 shadow-sm">
        <CardHeader>
          <CardTitle className="text-red-600 text-base font-semibold">Material Requests Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-2xl font-bold text-red-700 mb-2">
            {selectedMaterial?.name} - {selectedMaterial?.unit}
          </div>
          <div className="flex flex-col items-center mb-4">
            <div className="relative w-32 h-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                  >
                    {pieData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={pieColors[idx % pieColors.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-red-700">{percentReceived}%</span>
              </div>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between px-4 py-2 bg-white rounded">
              <span className="text-gray-600">Requested:</span>
              <span className="font-bold text-red-600">{selectedMaterial?.requested} {selectedMaterial?.unit}</span>
            </div>
            <div className="flex justify-between px-4 py-2 bg-white rounded">
              <span className="text-gray-600">Received:</span>
              <span className="font-bold text-green-600">{selectedMaterial?.received} {selectedMaterial?.unit}</span>
            </div>
            <div className="flex justify-between px-4 py-2 bg-white rounded">
              <span className="text-gray-600">Pending:</span>
              <span className="font-bold text-red-500">{selectedMaterial?.requested - selectedMaterial?.received} {selectedMaterial?.unit}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Right: Materials List Table */}
      <Card className="border-l-4 border-l-red-500 shadow-sm">
        <CardHeader>
          <CardTitle className="text-red-600 text-base font-semibold">Materials List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Received</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.map((material: Material, index: number) => (
                <TableRow
                  key={index}
                  className={
                    index === selectedIdx
                      ? "bg-blue-50 cursor-pointer"
                      : "hover:bg-blue-100 cursor-pointer"
                  }
                  onClick={() => setSelectedIdx(index)}
                >
                  <TableCell className="font-medium text-gray-900 truncate max-w-[140px]">{material.name}</TableCell>
                  <TableCell className="text-gray-900">{material.unit}</TableCell>
                  <TableCell className="text-gray-900">{material.requested}</TableCell>
                  <TableCell
                    className={
                      material.received < material.requested
                        ? "text-red-600 font-bold"
                        : "text-green-600 font-bold"
                    }
                  >
                    {material.received}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
