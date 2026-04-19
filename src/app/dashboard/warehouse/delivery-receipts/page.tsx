"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ARSDCard } from '@/components/warehouse/ARSDCard';
import { ARSDTable } from '@/components/warehouse/ARSDTable';
import { BadgeStatus } from '@/components/warehouse/BadgeStatus';
import { useWarehouseAuth } from '@/hooks/warehouse/useWarehouseAuth';
import { useWarehouseProjects } from '@/hooks/warehouse/useWarehouseProjects';
import { useDeliveryReceipts } from '@/hooks/warehouse/useDeliveryReceipts';
import { UniversalLoading } from '@/components/ui/universal-loading';
import { ArrowLeft, Search, Filter, Eye, Plus, Unlock, Lock } from 'lucide-react';

export default function DeliveryReceiptsListPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { user, canCreate, canUnlock } = useWarehouseAuth();
  const { projects } = useWarehouseProjects(user);
  const { deliveryReceipts, loading, updateLock } = useDeliveryReceipts({
    search: searchQuery || undefined,
    project_id: selectedProjectId || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedProjectId, dateFrom, dateTo, deliveryReceipts.length]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(deliveryReceipts.length / pageSize)),
    [deliveryReceipts.length]
  );

  const activePage = Math.min(currentPage, totalPages);

  const paginatedReceipts = useMemo(() => {
    const start = (activePage - 1) * pageSize;
    return deliveryReceipts.slice(start, start + pageSize);
  }, [deliveryReceipts, activePage, pageSize]);

  const startIndex = deliveryReceipts.length === 0 ? 0 : (activePage - 1) * pageSize + 1;
  const endIndex =
    deliveryReceipts.length === 0
      ? 0
      : Math.min((activePage - 1) * pageSize + paginatedReceipts.length, deliveryReceipts.length);

  const [lockError, setLockError] = useState<string | null>(null);

  const handleLockToggle = async (id: string, currentlyLocked: boolean) => {
    try {
      setLockError(null);
      await updateLock(id, !currentlyLocked);
    } catch (error) {
      console.error('Failed to update lock:', error);
      setLockError('Failed to update lock status. Please try again.');
    }
  };

  return (
    <div className="w-full space-y-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard/warehouse')}
              className="p-2 rounded-md border border-border bg-card hover:bg-muted transition-colors mobile-touch-target"
              aria-label="Back to warehouse"
            >
              <ArrowLeft className="h-4 w-4 text-foreground" strokeWidth={1.75} />
            </button>
            <div>
              <div className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                Warehouse
              </div>
              <h1 className="text-h1 font-display text-foreground leading-none">
                Delivery Receipts
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                View and manage all delivery receipts.
              </p>
            </div>
          </div>
          {canCreate && (
            <button
              onClick={() => router.push('/dashboard/warehouse/delivery-receipts/new')}
              className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-[hsl(var(--arsd-red-hover))] transition-colors"
            >
              <Plus className="h-4 w-4" strokeWidth={1.75} />
              Create DR
            </button>
          )}
        </header>

        {lockError && (
          <div className="bg-destructive/5 border border-destructive/20 rounded-md p-3 flex items-start justify-between gap-3">
            <p className="text-sm text-destructive">{lockError}</p>
            <button
              onClick={() => setLockError(null)}
              className="text-xs text-destructive/80 hover:text-destructive font-medium"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Filters — sticky on scroll */}
        <div className="sticky top-0 z-40 bg-card border border-border rounded-md shadow-xs p-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
              <h2 className="text-sm font-semibold text-foreground">Filters</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by DR no, supplier, project, or warehouseman"
                    className="w-full rounded-md border border-border bg-card pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
                >
                  <option value="">All projects</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.project_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] uppercase tracking-[0.06em] text-muted-foreground mb-1">From</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full rounded-md border border-border bg-card px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-[0.06em] text-muted-foreground mb-1">To</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full rounded-md border border-border bg-card px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile View - Cards */}
        <div className="block sm:hidden space-y-4">
          {loading ? (
            <UniversalLoading
              type="data"
              message="Loading Delivery Receipts"
              subtitle="Fetching delivery receipts from the warehouse..."
              size="md"
              fullScreen={false}
              className="max-w-md mx-auto"
            />
          ) : deliveryReceipts.length > 0 ? (
            paginatedReceipts.map((dr) => {
              const project = projects.find(p => p.id === dr.project_id);
              return (
                <ARSDCard key={dr.id} className="p-5">
                  <div className="space-y-4">
                    <div className="min-w-0">
                      <div className="text-xs font-mono text-primary mb-1 nums">{dr.dr_no}</div>
                      <h3 className="font-semibold text-foreground text-base truncate">
                        {project?.project_name || 'Unknown Project'}
                      </h3>
                    </div>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                      <dt className="text-muted-foreground">Supplier</dt>
                      <dd className="font-medium text-foreground break-words min-w-0">{dr.supplier}</dd>
                      <dt className="text-muted-foreground">Date</dt>
                      <dd className="font-medium text-foreground nums">{dr.date}</dd>
                      <dt className="text-muted-foreground">Items</dt>
                      <dd className="font-medium text-foreground nums">{dr.items?.length || 0}</dd>
                      <dt className="text-muted-foreground">Warehouseman</dt>
                      <dd className="font-medium text-foreground break-words min-w-0">{dr.warehouseman}</dd>
                      <dt className="text-muted-foreground">Status</dt>
                      <dd><BadgeStatus locked={dr.locked} /></dd>
                    </dl>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        onClick={() => router.push(`/dashboard/warehouse/delivery-receipts/${dr.id}`)}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-[hsl(var(--arsd-red-hover))] transition-colors mobile-touch-target min-h-[44px]"
                      >
                        <Eye className="h-5 w-5" />
                        View
                      </button>
                      {canUnlock && dr.locked && (
                        <button
                          onClick={() => handleLockToggle(dr.id, dr.locked)}
                          className="inline-flex items-center justify-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300 transition-colors mobile-touch-target min-h-[44px] min-w-[110px]"
                          title="Unlock (Site Engineer / Project Manager only)"
                        >
                          <Unlock className="h-5 w-5" />
                          Unlock
                        </button>
                      )}
                      {canUnlock && !dr.locked && (
                        <button
                          onClick={() => handleLockToggle(dr.id, dr.locked)}
                          className="inline-flex items-center justify-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300 transition-colors mobile-touch-target min-h-[44px] min-w-[110px]"
                          title="Lock again (Site Engineer / Project Manager only)"
                        >
                          <Lock className="h-5 w-5" />
                          Lock
                        </button>
                      )}
                    </div>
                  </div>
                </ARSDCard>
              );
            })
          ) : (
            <div className="bg-card border border-border rounded-md text-center py-10">
              <p className="text-sm font-medium text-foreground">No delivery receipts found</p>
              <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters.</p>
            </div>
          )}
        </div>

        {!loading && deliveryReceipts.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
            <p className="text-sm text-muted-foreground nums">
              Showing <span className="text-foreground font-medium">{startIndex}</span>
              {'–'}
              <span className="text-foreground font-medium">{endIndex}</span> of{' '}
              <span className="text-foreground font-medium">{deliveryReceipts.length}</span> receipt
              {deliveryReceipts.length !== 1 ? 's' : ''}
            </p>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={activePage === 1}
                className="inline-flex items-center rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-xs text-muted-foreground nums">
                Page <span className="text-foreground font-medium">{activePage}</span> of{' '}
                <span className="text-foreground font-medium">{totalPages}</span>
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={activePage === totalPages}
                className="inline-flex items-center rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Desktop view — table */}
        <div className="hidden sm:block">
          <ARSDTable className="min-w-[640px]">
            <thead className="bg-muted/40 border-b border-border">
              <tr className="sticky top-0 z-10 bg-card">
                <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground text-center">DR No</th>
                <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground text-center">Date</th>
                <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground text-center">Supplier</th>
                <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground text-center">Project</th>
                <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground text-center">Warehouseman</th>
                <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground text-center">Items</th>
                <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground text-center">Status</th>
                <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-3 py-12 text-center">
                    <div className="flex justify-center">
                      <UniversalLoading
                        type="data"
                        message="Loading delivery receipts"
                        subtitle="Fetching delivery receipts from the warehouse…"
                        size="md"
                        fullScreen={false}
                        className="max-w-md"
                      />
                    </div>
                  </td>
                </tr>
              ) : deliveryReceipts.length > 0 ? (
                paginatedReceipts.map((dr) => {
                  const project = projects.find(p => p.id === dr.project_id);
                  return (
                    <tr key={dr.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-3 font-mono text-xs text-foreground text-center nums">{dr.dr_no}</td>
                      <td className="px-3 py-3 text-sm text-foreground text-center nums">{dr.date}</td>
                      <td className="px-3 py-3 text-sm text-foreground text-center">{dr.supplier}</td>
                      <td className="px-3 py-3 text-sm text-foreground text-center">{project?.project_name || 'Unknown'}</td>
                      <td className="px-3 py-3 text-sm text-foreground text-center">{dr.warehouseman}</td>
                      <td className="px-3 py-3 text-sm text-foreground text-center nums">{dr.items?.length || 0}</td>
                      <td className="px-3 py-3 text-center">
                        <BadgeStatus locked={dr.locked} />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div className="flex flex-wrap items-center justify-center gap-2">
                          <button
                            onClick={() => router.push(`/dashboard/warehouse/delivery-receipts/${dr.id}`)}
                            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors mobile-touch-target min-h-[44px]"
                          >
                            <Eye className="h-4 w-4 sm:h-4 sm:w-4" />
                            View
                          </button>
                          {canUnlock && dr.locked && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleLockToggle(dr.id, dr.locked); }}
                              className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300 transition-colors mobile-touch-target min-h-[44px]"
                              title="Unlock (Site Engineer / Project Manager only)"
                            >
                              <Unlock className="h-4 w-4" />
                              Unlock
                            </button>
                          )}
                          {canUnlock && !dr.locked && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleLockToggle(dr.id, dr.locked); }}
                              className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300 transition-colors mobile-touch-target min-h-[44px]"
                              title="Lock again (Site Engineer / Project Manager only)"
                            >
                              <Lock className="h-4 w-4" />
                              Lock
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-3 py-10 text-center">
                    <p className="text-sm font-medium text-foreground">No delivery receipts found</p>
                    <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </ARSDTable>
        </div>
    </div>
  );
}

