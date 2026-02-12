"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MobileItemCard } from '@/components/warehouse/MobileItemCard';
import { ARSDTable } from '@/components/warehouse/ARSDTable';
import { AlertBadge } from '@/components/warehouse/AlertBadge';
import { useWarehouseProjects } from '@/hooks/warehouse/useWarehouseProjects';
import { useWarehouseAuth } from '@/hooks/warehouse/useWarehouseAuth';
import { useStocks } from '@/hooks/warehouse/useStocks';
import { UniversalLoading } from '@/components/ui/universal-loading';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Search, Download, Filter } from 'lucide-react';

interface StockItem {
  wbs: string | null;
  item_description: string;
  resource: string | null;
  ipow_qty: number;
  delivered: number;
  utilized: number;
  running_balance: number;
  total_cost: number;
  variance: number;
  po?: number;
  undelivered?: number;
}

function getItemKey(item: StockItem): string {
  return `${item.wbs ?? 'null'}|${item.item_description.toLowerCase().trim()}`;
}

export default function StockMonitoringPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || '');
  const [poDrafts, setPoDrafts] = useState<Record<string, number>>({});
  const [poConfirmState, setPoConfirmState] = useState<{
    key: string;
    item: StockItem;
    originalPO: number;
    newPO: number;
  } | null>(null);

  const { user } = useWarehouseAuth();
  const { projects } = useWarehouseProjects(user);
  const { stockItems, loading } = useStocks(projectId);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const project = projects.find(p => p.id === projectId);

  const canEditPO = user?.role === 'superadmin' || user?.role === 'material_control';
  const isWarehouseman = user?.role === 'warehouseman';

  const handleUpdatePO = async (item: StockItem, newPO: number) => {
    if (!canEditPO || !projectId) return;

     const key = getItemKey(item);
     const originalPO = item.po ?? 0;
     const safeNewPO = Number.isFinite(newPO) ? newPO : 0;

     if (safeNewPO === originalPO) {
       // No actual change; clear any draft override
       setPoDrafts(prev => {
         const next = { ...prev };
         delete next[key];
         return next;
       });
       return;
     }

    try {
      const response = await fetch(`/api/warehouse/stocks/${projectId}/po`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wbs: item.wbs,
          item_description: item.item_description,
          po: newPO,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update PO');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleConfirmPO = async () => {
    if (!poConfirmState) return;
    const { key, item, originalPO, newPO } = poConfirmState;

    // Apply draft locally so UI reflects the change immediately
    setPoDrafts(prev => ({ ...prev, [key]: newPO }));

    try {
      await handleUpdatePO(item, newPO);
    } catch {
      // On error, roll back to original
      setPoDrafts(prev => ({ ...prev, [key]: originalPO }));
    } finally {
      setPoConfirmState(null);
    }
  };

  const handleCancelPO = () => {
    if (!poConfirmState) {
      return;
    }
    const { key, originalPO } = poConfirmState;
    // Revert draft back to original
    setPoDrafts(prev => ({ ...prev, [key]: originalPO }));
    setPoConfirmState(null);
  };

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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, projectId, filteredItems.length]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredItems.length / pageSize)),
    [filteredItems.length]
  );

  const activePage = Math.min(currentPage, totalPages);

  const paginatedItems = useMemo(() => {
    const start = (activePage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, activePage, pageSize]);

  const startIndex = filteredItems.length === 0 ? 0 : (activePage - 1) * pageSize + 1;
  const endIndex =
    filteredItems.length === 0
      ? 0
      : Math.min((activePage - 1) * pageSize + paginatedItems.length, filteredItems.length);

  if (loading) {
    return (
      <UniversalLoading
        type="data"
        message="Loading Stock Monitoring"
        subtitle="Fetching stock ledger for this project..."
        size="lg"
        fullScreen
      />
    );
  }

  if (!project) {
    return (
      <UniversalLoading
        type="data"
        message="Loading Stock Monitoring"
        subtitle="Preparing stock ledger for the selected project..."
        size="lg"
        fullScreen
      />
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
                  placeholder="   Search by WBS or item name..."
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
          {paginatedItems.length > 0 ? (
            paginatedItems.map((item, index) => (
              <MobileItemCard key={index} item={item} isWarehouseman={isWarehouseman} />
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

        {!loading && filteredItems.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
            <p className="text-xs text-gray-500">
              Showing <span className="font-medium">{startIndex}</span>
              {'–'}
              <span className="font-medium">{endIndex}</span> of{' '}
              <span className="font-medium">{filteredItems.length}</span> item
              {filteredItems.length !== 1 ? 's' : ''}
            </p>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={activePage === 1}
                className="btn-arsd-outline mobile-button px-3 py-1.5 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-xs text-gray-600">
                Page <span className="font-medium">{activePage}</span> of{' '}
                <span className="font-medium">{totalPages}</span>
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={activePage === totalPages}
                className="btn-arsd-outline mobile-button px-3 py-1.5 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Desktop View - Table */}
        <div className="hidden sm:block">
          <ARSDTable>
            <thead className="glass-table-header">
              {isWarehouseman ? (
                <tr>
                  <th className="glass-table-header-cell min-w-[6rem]">WBS</th>
                  <th className="glass-table-header-cell">Item Description</th>
                  <th className="glass-table-header-cell w-0 max-w-[24rem]">Resource</th>
                  <th className="glass-table-header-cell text-center whitespace-nowrap">PO</th>
                  <th className="glass-table-header-cell text-center whitespace-nowrap">Undelivered</th>
                  <th className="glass-table-header-cell text-center whitespace-nowrap">Delivered</th>
                  <th className="glass-table-header-cell text-center whitespace-nowrap">Utilized</th>
                  <th className="glass-table-header-cell text-center whitespace-nowrap">Running Balance</th>
                  <th className="glass-table-header-cell text-center">Alerts</th>
                </tr>
              ) : (
                <tr>
                  <th className="glass-table-header-cell min-w-[6rem]">WBS</th>
                  <th className="glass-table-header-cell">Item Description</th>
                  <th className="glass-table-header-cell w-0 max-w-[24rem]">Resource</th>
                  <th className="glass-table-header-cell text-center whitespace-nowrap">IPOW Qty</th>
                  <th className="glass-table-header-cell text-center whitespace-nowrap">Total Cost</th>
                  <th className="glass-table-header-cell text-center whitespace-nowrap">PO</th>
                  <th className="glass-table-header-cell text-center whitespace-nowrap">Undelivered</th>
                  <th className="glass-table-header-cell text-center whitespace-nowrap">Delivered</th>
                  <th className="glass-table-header-cell text-center whitespace-nowrap">Utilized</th>
                  <th className="glass-table-header-cell text-center whitespace-nowrap">Running Balance</th>
                  <th className="glass-table-header-cell text-center whitespace-nowrap">Variance</th>
                  <th className="glass-table-header-cell text-center">Alerts</th>
                </tr>
              )}
            </thead>
            <tbody>
              {paginatedItems.length > 0 ? (
                paginatedItems.map((item, index) => {
                  const isLowStock = item.running_balance < (item.ipow_qty * 0.1);
                  const isOverIPOWDelivered = item.delivered > item.ipow_qty;
                  const isOverIPOWUtilized = item.utilized > item.ipow_qty;
                  const key = getItemKey(item);
                  const effectivePO = poDrafts[key] ?? item.po ?? 0;

                  if (isWarehouseman) {
                    return (
                      <tr key={index} className="glass-table-row">
                        <td className="glass-table-cell font-mono text-xs min-w-[6rem]" title={item.wbs ?? undefined}>{item.wbs ?? '–'}</td>
                        <td className="glass-table-cell text-center font-medium" title={item.item_description}>{item.item_description}</td>
                        <td className="glass-table-cell text-center max-w-[24rem] truncate" title={item.resource ?? undefined}>
                          {item.resource ?? '–'}
                        </td>
                        <td className="glass-table-cell text-center whitespace-nowrap">
                          {effectivePO.toLocaleString()}
                        </td>
                        <td className="glass-table-cell text-center whitespace-nowrap">
                          {(effectivePO - item.delivered).toLocaleString()}
                        </td>
                        <td className="glass-table-cell text-center whitespace-nowrap">{item.delivered.toLocaleString()}</td>
                        <td className="glass-table-cell text-center whitespace-nowrap">{item.utilized.toLocaleString()}</td>
                        <td className={`glass-table-cell text-center whitespace-nowrap font-bold ${isLowStock ? 'text-red-600' : ''}`}>
                          {item.running_balance.toLocaleString()}
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
                  }

                  return (
                    <tr key={index} className="glass-table-row">
                      <td className="glass-table-cell font-mono text-xs min-w-[6rem]" title={item.wbs ?? undefined}>{item.wbs ?? '–'}</td>
                      <td className="glass-table-cell text-center font-medium" title={item.item_description}>{item.item_description}</td>
                      <td className="glass-table-cell text-center max-w-[24rem] truncate" title={item.resource ?? undefined}>
                        {item.resource ?? '–'}
                      </td>
                      <td className="glass-table-cell text-center whitespace-nowrap">{item.ipow_qty.toLocaleString()}</td>
                      <td className="glass-table-cell text-center whitespace-nowrap">₱{item.total_cost.toLocaleString()}</td>
                      <td className="glass-table-cell text-center whitespace-nowrap">
                        {canEditPO ? (
                          <input
                            type="text"
                            inputMode="decimal"
                            className="mobile-form-input w-24 text-center mx-auto"
                            value={Number.isFinite(effectivePO) ? effectivePO : 0}
                            onChange={(e) => {
                              const safeNewPO = Number(e.target.value) || 0;
                              setPoDrafts(prev => ({ ...prev, [key]: safeNewPO }));
                            }}
                            onBlur={(e) => {
                              const safeNewPO = Number(e.target.value) || 0;
                              const originalPO = item.po ?? 0;
                              if (safeNewPO === originalPO) {
                                // No change; clear any draft override for this key
                                setPoDrafts(prev => {
                                  const next = { ...prev };
                                  delete next[key];
                                  return next;
                                });
                                return;
                              }
                              setPoConfirmState({
                                key,
                                item,
                                originalPO,
                                newPO: safeNewPO,
                              });
                            }}
                          />
                        ) : (
                          effectivePO.toLocaleString()
                        )}
                      </td>
                      <td className="glass-table-cell text-center whitespace-nowrap">
                        {(effectivePO - item.delivered).toLocaleString()}
                      </td>
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
                  <td colSpan={10} className="glass-table-cell text-center py-12">
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

      {/* Confirm PO Update Dialog */}
      <Dialog
        open={!!poConfirmState}
        onOpenChange={(open) => {
          if (!open) {
            // Treat closing the dialog as cancel
            handleCancelPO();
          }
        }}
      >
        <DialogContent className="glass-elevated max-w-md">
          <DialogHeader>
            <DialogTitle className="text-arsd-primary text-lg">
              Update PO value?
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              This will recalculate <span className="font-semibold">Undelivered</span> and keep the stock
              monitoring ledger in sync with the latest Purchase Order quantity.
            </DialogDescription>
          </DialogHeader>

          {poConfirmState && (
            <div className="mt-4 space-y-3 text-sm">
              <div className="glass-card p-3">
                <div className="text-xs font-medium text-gray-500">Item</div>
                <div className="text-sm font-semibold text-arsd-primary break-words">
                  {poConfirmState.item.item_description}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  WBS: {poConfirmState.item.wbs ?? '–'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="glass-card p-3">
                  <div className="text-xs font-medium text-gray-500">Current PO</div>
                  <div className="text-base font-semibold text-gray-800">
                    {poConfirmState.originalPO.toLocaleString()}
                  </div>
                </div>
                <div className="glass-card p-3">
                  <div className="text-xs font-medium text-gray-500">New PO</div>
                  <div className="text-base font-semibold text-arsd-red">
                    {poConfirmState.newPO.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="text-xs text-gray-500">
                Undelivered will be updated to <strong>{(poDrafts[poConfirmState.key] ?? poConfirmState.newPO) - poConfirmState.item.delivered}</strong> for this item
                (calculated as <span className="font-mono">PO - Delivered</span>).
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelPO}
              className="btn-arsd-outline"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmPO}
              className="btn-arsd-primary"
            >
              Confirm Update
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

