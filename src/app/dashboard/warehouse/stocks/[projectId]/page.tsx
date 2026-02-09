"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MobileItemCard } from '@/components/warehouse/MobileItemCard';
import { ARSDTable } from '@/components/warehouse/ARSDTable';
import { AlertBadge } from '@/components/warehouse/AlertBadge';
import { useWarehouseProjects } from '@/hooks/warehouse/useWarehouseProjects';
import { useWarehouseAuth } from '@/hooks/warehouse/useWarehouseAuth';
import { useStocks } from '@/hooks/warehouse/useStocks';
import { ArrowLeft, Search, Download, Filter } from 'lucide-react';

interface StockItem {
  wbs: string | null;
  item_description: string;
  ipow_qty: number;
  delivered: number;
  utilized: number;
  running_balance: number;
  total_cost: number;
  variance: number;
}

export default function StockMonitoringPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || '');

  const { user } = useWarehouseAuth();
  const { projects } = useWarehouseProjects(user);
  const { stockItems, loading } = useStocks(projectId);

  const project = projects.find(p => p.id === projectId);

  // Update selected project ID when project param changes
  useEffect(() => {
    if (projectId) {
      setSelectedProjectId(projectId);
    }
  }, [projectId]);

  // Filter stock items based on search
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return stockItems;
    const query = searchQuery.toLowerCase();
    return stockItems.filter(item =>
      (item.wbs ?? '').toLowerCase().includes(query) ||
      item.item_description.toLowerCase().includes(query)
    );
  }, [stockItems, searchQuery]);

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
        <div className="glass-card text-center max-w-md">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Project Not Found</h2>
          <p className="text-gray-600 mb-4">The requested project could not be found.</p>
          <button
            onClick={() => router.push('/dashboard/warehouse')}
            className="btn-arsd-primary mobile-button"
          >
            Back to Warehouse
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 w-full">
      <div className="w-full mx-4 sm:mx-6 lg:mx-8 space-y-4 sm:space-y-6 lg:space-y-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-arsd-red/5 via-blue-500/5 to-purple-500/5 rounded-2xl blur-3xl"></div>
          <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push('/dashboard/warehouse')}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors mobile-touch-target"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-600" />
                </button>
                <div>
                  <h1 className="responsive-heading font-bold bg-gradient-to-r from-arsd-red to-red-600 bg-clip-text text-transparent">
                    Stock Monitoring Ledger
                  </h1>
                  <p className="text-gray-600 responsive-text">{project.project_name}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Filter Bar */}
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border border-red-200/30 rounded-xl shadow-lg p-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by WBS or item name..."
                  className="mobile-form-input w-full pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedProjectId}
                onChange={(e) => {
                  setSelectedProjectId(e.target.value);
                  router.push(`/dashboard/warehouse/stocks/${e.target.value}`);
                }}
                className="mobile-form-input min-w-[150px]"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.project_name}</option>
                ))}
              </select>
              <button
                className="btn-arsd-outline mobile-button flex items-center gap-2 px-4"
                title="Download (UI only)"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Download</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile View - Card List */}
        <div className="block sm:hidden space-y-4">
          {filteredItems.length > 0 ? (
            filteredItems.map((item, index) => (
              <MobileItemCard key={index} item={item} />
            ))
          ) : (
            <div className="glass-card text-center py-12">
              <p className="text-gray-600 font-medium">No items found</p>
              <p className="text-sm text-gray-500 mt-2">
                {searchQuery ? 'Try adjusting your search' : 'No stock items available for this project'}
              </p>
            </div>
          )}
        </div>

        {/* Desktop View - Table */}
        <div className="hidden sm:block">
          <ARSDTable>
            <thead className="glass-table-header">
              <tr>
                <th className="glass-table-header-cell">WBS</th>
                <th className="glass-table-header-cell">Item Description</th>
                <th className="glass-table-header-cell text-center whitespace-nowrap">IPOW Qty</th>
                <th className="glass-table-header-cell text-center whitespace-nowrap">Total Cost</th>
                <th className="glass-table-header-cell text-center whitespace-nowrap">Delivered</th>
                <th className="glass-table-header-cell text-center whitespace-nowrap">Utilized</th>
                <th className="glass-table-header-cell text-center whitespace-nowrap">Running Balance</th>
                <th className="glass-table-header-cell text-center whitespace-nowrap">Variance</th>
                <th className="glass-table-header-cell text-center">Alerts</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length > 0 ? (
                filteredItems.map((item, index) => {
                  const isLowStock = item.running_balance < (item.ipow_qty * 0.1);
                  const isOverIPOWDelivered = item.delivered > item.ipow_qty;
                  const isOverIPOWUtilized = item.utilized > item.ipow_qty;

                  return (
                    <tr key={index} className="glass-table-row">
                      <td className="glass-table-cell font-mono text-xs">{item.wbs ?? '–'}</td>
                      <td className="glass-table-cell text-center font-medium">{item.item_description}</td>
                      <td className="glass-table-cell text-center whitespace-nowrap">{item.ipow_qty.toLocaleString()}</td>
                      <td className="glass-table-cell text-center whitespace-nowrap">₱{item.total_cost.toLocaleString()}</td>
                      <td className="glass-table-cell text-center whitespace-nowrap">{item.delivered.toLocaleString()}</td>
                      <td className="glass-table-cell text-center whitespace-nowrap">{item.utilized.toLocaleString()}</td>
                      <td className={`glass-table-cell text-center whitespace-nowrap font-bold ${isLowStock ? 'text-red-600' : ''}`}>
                        {item.running_balance.toLocaleString()}
                      </td>
                      <td className={`glass-table-cell text-center whitespace-nowrap ${item.variance > 0 ? 'text-orange-600' : item.variance < 0 ? 'text-blue-600' : ''}`}>
                        {item.variance > 0 ? '+' : ''}{item.variance.toLocaleString()}
                      </td>
                      <td className="glass-table-cell text-center">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {isLowStock && <AlertBadge type="low_stock" />}
                          {isOverIPOWDelivered && <AlertBadge type="over_ipow_delivered" />}
                          {isOverIPOWUtilized && <AlertBadge type="over_ipow_utilized" />}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="glass-table-cell text-center py-12">
                    <p className="text-gray-600 font-medium">No items found</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {searchQuery ? 'Try adjusting your search' : 'No stock items available for this project'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </ARSDTable>
        </div>
      </div>
    </div>
  );
}

