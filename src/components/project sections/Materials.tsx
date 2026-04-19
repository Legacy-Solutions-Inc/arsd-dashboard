"use client";

import { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Search, Filter } from "lucide-react";
import { 
  processMaterialsDataComplete,
  getMaterialStatus,
  getStatusBadgeVariant,
  getStatusLabel,
  getPOStatusBadgeStyling,
  getPriorityBadgeStyling,
  calculatePercentReceived,
  generatePieData,
  PIE_COLORS,
  STATUS_OPTIONS
} from "@/utils/materials-utils";
import { DatabaseMaterial, DatabasePurchaseOrder, Material, MaterialFilters } from "@/utils/materials-utils";

// Constants and interfaces are now imported from utils file
const ITEMS_PER_PAGE = 8;

interface MaterialsProps {
  materials: DatabaseMaterial[];
  purchaseOrders: DatabasePurchaseOrder[];
}

export function Materials({ materials, purchaseOrders }: MaterialsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIdx, setSelectedIdx] = useState(0);

  // Process all materials data using utility functions
  const {
    processedMaterials,
    filteredMaterials,
    paginatedMaterials,
    paginationInfo,
    summaryStats,
    pieData
  } = useMemo(() => {
    const filters: MaterialFilters = {
      searchTerm,
      statusFilter,
      typeFilter: ""
    };

    const sorting = {
      field: 'name' as const,
      direction: 'asc' as const
    };

    const selectedMaterial = materials.length > 0 ? 
      processMaterialsDataComplete(materials, purchaseOrders, { searchTerm: "", statusFilter: "all", typeFilter: "" }, sorting, 1, 8).processedMaterials[selectedIdx] || null : 
      null;

    return processMaterialsDataComplete(materials, purchaseOrders, filters, sorting, currentPage, ITEMS_PER_PAGE, selectedMaterial);
  }, [materials, purchaseOrders, searchTerm, statusFilter, currentPage, selectedIdx]);

  // Calculate percent received for selected material
  const selectedMaterial = processedMaterials[selectedIdx] || processedMaterials[0];
  const percentReceived = calculatePercentReceived(selectedMaterial);

  return (
    <div className="space-y-4 lg:space-y-6 mt-4 lg:mt-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
        <Card>
          <CardContent className="p-4 lg:p-5">
            <div className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Requests</div>
            <div className="text-h2 font-display text-foreground mt-1 nums">
              {summaryStats.totalRequests}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 lg:p-5">
            <div className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Received</div>
            <div className="text-h2 font-display text-foreground mt-1 nums">
              {summaryStats.receivedPercentage}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 lg:p-5">
            <div className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Utilized</div>
            <div className="text-h2 font-display text-foreground mt-1 nums">
              {summaryStats.utilizedPercentage}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
      {/* Left: Material Requests Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-foreground">Material requests overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-sm font-semibold text-foreground mb-4">
            {selectedMaterial?.name} — {selectedMaterial?.unit}
          </div>
          
          {/* Chart Section */}
          <div className="flex items-center justify-center mb-4 lg:mb-6 p-3 lg:p-4">
            <div className="relative w-48 h-48 lg:w-64 lg:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 15, right: 15, bottom: 15, left: 15 }}>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    startAngle={90}
                    endAngle={450}
                    paddingAngle={2}
                  >
                    {pieData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-h2 font-display text-foreground nums">{percentReceived}%</div>
                  <div className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Received</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 mb-3 lg:mb-4">
            {pieData.map((item, index) => (
              <div key={item.name} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 lg:w-4 lg:h-4 rounded" 
                  style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                ></div>
                <span className="text-xs lg:text-sm font-medium">{item.name}</span>
              </div>
            ))}
          </div>
          <div className="space-y-0 text-sm divide-y divide-border rounded-md border border-border overflow-hidden">
            <div className="flex justify-between px-3 py-2 bg-card">
              <span className="text-muted-foreground">Requested</span>
              <span className="font-semibold text-foreground nums">{selectedMaterial?.requestedQuantity} {selectedMaterial?.unit}</span>
            </div>
            <div className="flex justify-between px-3 py-2 bg-card">
              <span className="text-muted-foreground">Received</span>
              <span className="font-semibold text-foreground nums">{selectedMaterial?.receivedQuantity} {selectedMaterial?.unit}</span>
            </div>
            <div className="flex justify-between px-3 py-2 bg-card">
              <span className="text-muted-foreground">Utilized</span>
              <span className="font-semibold text-foreground nums">{selectedMaterial?.utilizedQuantity} {selectedMaterial?.unit}</span>
            </div>
            <div className="flex justify-between px-3 py-2 bg-card">
              <span className="text-muted-foreground">Pending</span>
              <span className="font-semibold text-foreground nums">{selectedMaterial?.pendingQuantity} {selectedMaterial?.unit}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Right: Materials List Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-foreground">Materials list</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 mb-3 lg:mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3 lg:h-4 lg:w-4" />
              <Input
                placeholder="Search materials..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-8 lg:pl-10 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-3 w-3 lg:h-4 lg:w-4 text-gray-400" />
              <Select value={statusFilter} onValueChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-28 lg:w-32 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option: { value: string; label: string }) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results Summary */}
          <div className="text-xs lg:text-sm text-gray-600 mb-3 lg:mb-4">
            Showing {paginatedMaterials.length} of {filteredMaterials.length} materials
            {searchTerm && ` matching "${searchTerm}"`}
            {statusFilter !== "all" && ` with status "${statusFilter}"`}
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs lg:text-sm">Material</TableHead>
                  <TableHead className="text-xs lg:text-sm">Type</TableHead>
                  <TableHead className="text-xs lg:text-sm">Unit</TableHead>
                  <TableHead className="text-xs lg:text-sm">Requested</TableHead>
                  <TableHead className="text-xs lg:text-sm">Received</TableHead>
                  <TableHead className="text-xs lg:text-sm">Utilized</TableHead>
                  <TableHead className="text-xs lg:text-sm">Pending</TableHead>
                  <TableHead className="text-xs lg:text-sm">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedMaterials.map((material: Material, index: number) => {
                  const globalIndex = processedMaterials.findIndex(m => m.name === material.name);
                  return (
                  <TableRow
                      key={material.name}
                    className={
                        globalIndex === selectedIdx
                        ? "bg-muted/50 cursor-pointer"
                        : "hover:bg-muted/30 cursor-pointer transition-colors"
                    }
                      onClick={() => setSelectedIdx(globalIndex)}
                  >
                    <TableCell className="font-medium text-foreground truncate max-w-[140px] text-sm">{material.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {material.type === 'recieved' ? 'received' : material.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-foreground text-sm">{material.unit}</TableCell>
                    <TableCell className="font-medium text-foreground text-sm nums">{material.requestedQuantity}</TableCell>
                    <TableCell
                      className={
                        material.receivedQuantity < material.requestedQuantity
                          ? "text-destructive font-semibold text-sm nums"
                          : "text-foreground font-semibold text-sm nums"
                      }
                    >
                      {material.receivedQuantity}
                    </TableCell>
                    <TableCell className="text-foreground font-medium text-sm nums">{material.utilizedQuantity}</TableCell>
                    <TableCell className="text-foreground font-medium text-sm nums">{material.pendingQuantity}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getStatusBadgeVariant(getMaterialStatus(material))}`}
                      >
                        {getStatusLabel(getMaterialStatus(material))}
                      </Badge>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {paginationInfo.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-3 lg:mt-4 gap-2">
              <div className="text-xs lg:text-sm text-gray-600">
                Page {currentPage} of {paginationInfo.totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="text-xs"
                >
                  <ChevronLeft className="h-3 w-3 lg:h-4 lg:w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(paginationInfo.totalPages, prev + 1))}
                  disabled={currentPage === paginationInfo.totalPages}
                  className="text-xs"
                >
                  Next
                  <ChevronRight className="h-3 w-3 lg:h-4 lg:w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      </div>

      {/* Purchase Orders Section */}
      {selectedMaterial && selectedMaterial.purchaseOrders.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground">
              Purchase orders · {selectedMaterial.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs lg:text-sm">PO Number</TableHead>
                    <TableHead className="text-xs lg:text-sm">Date Requested</TableHead>
                    <TableHead className="text-xs lg:text-sm">Expected Delivery</TableHead>
                    <TableHead className="text-xs lg:text-sm">Quantity</TableHead>
                    <TableHead className="text-xs lg:text-sm">Status</TableHead>
                    <TableHead className="text-xs lg:text-sm">Priority</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedMaterial.purchaseOrders.map((po) => (
                    <TableRow key={po.id}>
                      <TableCell className="font-medium text-xs lg:text-sm">{po.po_number}</TableCell>
                      <TableCell className="text-xs lg:text-sm">{new Date(po.date_requested).toLocaleDateString('en-GB')}</TableCell>
                      <TableCell className="text-xs lg:text-sm">{new Date(po.expected_delivery_date).toLocaleDateString('en-GB')}</TableCell>
                      <TableCell className="font-medium text-xs lg:text-sm">{po.qty} {po.unit}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            po.status.toLowerCase().includes('delivered') ||
                            po.status.toLowerCase().includes('received') ||
                            po.status.toLowerCase().includes('recieved')
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50'
                              : po.status.toLowerCase().includes('utilized') ||
                                po.status.toLowerCase().includes('used')
                              ? 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900/50'
                              : po.status.toLowerCase().includes('pending')
                              ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50'
                              : 'bg-destructive/5 text-destructive border-destructive/30'
                          }`}
                        >
                          {po.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            po.priority_level?.toLowerCase() === 'high'
                              ? 'bg-destructive/5 text-destructive border-destructive/30'
                              : po.priority_level?.toLowerCase() === 'medium'
                              ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50'
                          }`}
                        >
                          {po.priority_level || 'Normal'}
                        </Badge>
                      </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      )}
    </div>
  );
}
