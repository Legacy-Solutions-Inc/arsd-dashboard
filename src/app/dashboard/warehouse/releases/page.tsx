"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ARSDCard } from '@/components/warehouse/ARSDCard';
import { ARSDTable } from '@/components/warehouse/ARSDTable';
import { BadgeStatus } from '@/components/warehouse/BadgeStatus';
import { useWarehouseAuth } from '@/hooks/warehouse/useWarehouseAuth';
import { useWarehouseProjects } from '@/hooks/warehouse/useWarehouseProjects';
import { useReleases } from '@/hooks/warehouse/useReleases';
import { UniversalLoading } from '@/components/ui/universal-loading';
import { ArrowLeft, Search, Filter, Eye, Plus, Unlock, Lock } from 'lucide-react';

export default function ReleasesListPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [lockError, setLockError] = useState<string | null>(null);

  const { user, canCreate, canUnlock } = useWarehouseAuth();
  const { projects } = useWarehouseProjects(user);
  const { releases, loading, updateLock } = useReleases({
    search: searchQuery || undefined,
    project_id: selectedProjectId || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedProjectId, dateFrom, dateTo, releases.length]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(releases.length / pageSize)),
    [releases.length],
  );

  const activePage = Math.min(currentPage, totalPages);

  const paginatedReleases = useMemo(() => {
    const start = (activePage - 1) * pageSize;
    return releases.slice(start, start + pageSize);
  }, [releases, activePage, pageSize]);

  const startIndex = releases.length === 0 ? 0 : (activePage - 1) * pageSize + 1;
  const endIndex =
    releases.length === 0
      ? 0
      : Math.min((activePage - 1) * pageSize + paginatedReleases.length, releases.length);

  const handleLockToggle = async (id: string, currentlyLocked: boolean) => {
    try {
      setLockError(null);
      await updateLock(id, !currentlyLocked);
    } catch (error) {
      console.error('Failed to update lock:', error);
      setLockError('Failed to update lock status. Please try again.');
    }
  };

  const headerCell =
    'px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground text-center';

  return (
    <div className="w-full space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard/warehouse')}
            className="p-2 rounded-md border border-border bg-card hover:bg-muted transition-colors mobile-touch-target"
            aria-label="Back to warehouse"
          >
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </button>
          <div>
            <div className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
              Warehouse
            </div>
            <h1 className="text-h1 font-display text-foreground leading-none">
              Release Forms
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              View and manage all release forms.
            </p>
          </div>
        </div>
        {canCreate && (
          <button
            onClick={() => router.push('/dashboard/warehouse/releases/new')}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2.5 sm:py-2 text-sm font-medium hover:bg-[hsl(var(--arsd-red-hover))] transition-colors min-h-[44px] sm:min-h-0 mobile-touch-target sm:[&]:min-w-0"
          >
            <Plus className="h-4 w-4" />
            Create release
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

      {/* Filters — desktop-only sticky (see DR list for rationale) */}
      <div className="sm:sticky sm:top-0 sm:z-40 bg-card border border-border rounded-md shadow-xs p-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Filters</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by release no, received by, or project"
                  className="w-full rounded-md border border-border bg-card pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
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
                  aria-label="From date"
                  className="w-full rounded-md border border-border bg-card px-3 py-2.5 sm:py-1.5 text-sm sm:text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 min-h-[44px] sm:min-h-0"
                />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-[0.06em] text-muted-foreground mb-1">To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  aria-label="To date"
                  className="w-full rounded-md border border-border bg-card px-3 py-2.5 sm:py-1.5 text-sm sm:text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 min-h-[44px] sm:min-h-0"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile view */}
      <div className="block sm:hidden space-y-4">
        {loading ? (
          <UniversalLoading
            type="data"
            message="Loading release forms"
            subtitle="Fetching release forms from the warehouse…"
            size="md"
            fullScreen={false}
            className="max-w-md mx-auto"
          />
        ) : releases.length > 0 ? (
          paginatedReleases.map((rel) => {
            const project = projects.find((p) => p.id === rel.project_id);
            return (
              <ARSDCard key={rel.id} className="p-5">
                <div className="space-y-4">
                  <div className="min-w-0">
                    <div className="text-xs font-mono text-primary mb-1 nums">
                      {rel.release_no}
                    </div>
                    <h3 className="font-semibold text-foreground text-base truncate">
                      {project?.project_name || 'Unknown Project'}
                    </h3>
                  </div>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    <dt className="text-muted-foreground">Received by</dt>
                    <dd className="font-medium text-foreground break-words min-w-0">{rel.received_by}</dd>
                    <dt className="text-muted-foreground">Date</dt>
                    <dd className="font-medium text-foreground nums">{rel.date}</dd>
                    <dt className="text-muted-foreground">Items</dt>
                    <dd className="font-medium text-foreground nums">{rel.items?.length || 0}</dd>
                    <dt className="text-muted-foreground">Warehouseman</dt>
                    <dd className="font-medium text-foreground break-words min-w-0">{rel.warehouseman || '—'}</dd>
                    <dt className="text-muted-foreground">Status</dt>
                    <dd>
                      <BadgeStatus locked={rel.locked} />
                    </dd>
                    {rel.purpose && (
                      <>
                        <dt className="text-muted-foreground col-span-2">Purpose</dt>
                        <dd className="col-span-2 text-foreground bg-muted/40 border border-border p-2 rounded-md break-words min-w-0">
                          {rel.purpose}
                        </dd>
                      </>
                    )}
                  </dl>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      onClick={() => router.push(`/dashboard/warehouse/releases/${rel.id}`)}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-[hsl(var(--arsd-red-hover))] transition-colors mobile-touch-target min-h-[44px]"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </button>
                    {canUnlock && rel.locked && (
                      <button
                        onClick={() => handleLockToggle(rel.id, rel.locked)}
                        className="inline-flex items-center justify-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300 transition-colors mobile-touch-target min-h-[44px] min-w-[110px]"
                        title="Unlock (Site Engineer / Project Manager only)"
                      >
                        <Unlock className="h-4 w-4" />
                        Unlock
                      </button>
                    )}
                    {canUnlock && !rel.locked && (
                      <button
                        onClick={() => handleLockToggle(rel.id, rel.locked)}
                        className="inline-flex items-center justify-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300 transition-colors mobile-touch-target min-h-[44px] min-w-[110px]"
                        title="Lock again (Site Engineer / Project Manager only)"
                      >
                        <Lock className="h-4 w-4" />
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
            <p className="text-sm font-medium text-foreground">No release forms found</p>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters.</p>
          </div>
        )}
      </div>

      {!loading && releases.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-muted-foreground nums">
            Showing <span className="text-foreground font-medium">{startIndex}</span>
            {'–'}
            <span className="text-foreground font-medium">{endIndex}</span> of{' '}
            <span className="text-foreground font-medium">{releases.length}</span> release
            {releases.length !== 1 ? 's' : ''}
          </p>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={activePage === 1}
              className="inline-flex items-center justify-center rounded-md border border-border bg-card px-4 py-2.5 sm:py-1.5 text-sm sm:text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] sm:min-h-0"
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
              className="inline-flex items-center justify-center rounded-md border border-border bg-card px-4 py-2.5 sm:py-1.5 text-sm sm:text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] sm:min-h-0"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Desktop view — table */}
      <div className="hidden sm:block">
        <ARSDTable className="min-w-[720px]">
          <thead className="bg-muted/40 border-b border-border">
            <tr>
              <th className={headerCell}>Release No</th>
              <th className={headerCell}>Date</th>
              <th className={headerCell}>Project / Site</th>
              <th className={headerCell}>Warehouseman</th>
              <th className={headerCell}>Received By</th>
              <th className={headerCell}>Items</th>
              <th className={headerCell}>Status</th>
              <th className={headerCell}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-3 py-12 text-center">
                  <div className="flex justify-center">
                    <UniversalLoading
                      type="data"
                      message="Loading release forms"
                      subtitle="Fetching release forms from the warehouse…"
                      size="md"
                      fullScreen={false}
                      className="max-w-md"
                    />
                  </div>
                </td>
              </tr>
            ) : releases.length > 0 ? (
              paginatedReleases.map((rel) => {
                const project = projects.find((p) => p.id === rel.project_id);
                return (
                  <tr
                    key={rel.id}
                    className="border-b border-border hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-3 py-3 font-mono text-xs text-foreground text-center nums">{rel.release_no}</td>
                    <td className="px-3 py-3 text-sm text-foreground text-center nums">{rel.date}</td>
                    <td className="px-3 py-3 text-sm text-foreground text-center">{project?.project_name || 'Unknown'}</td>
                    <td className="px-3 py-3 text-sm text-foreground text-center">{rel.warehouseman || '—'}</td>
                    <td className="px-3 py-3 text-sm text-foreground text-center">{rel.received_by}</td>
                    <td className="px-3 py-3 text-sm text-foreground text-center nums">{rel.items?.length || 0}</td>
                    <td className="px-3 py-3 text-center">
                      <BadgeStatus locked={rel.locked} />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <button
                          onClick={() => router.push(`/dashboard/warehouse/releases/${rel.id}`)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors mobile-touch-target min-h-[44px]"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </button>
                        {canUnlock && rel.locked && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLockToggle(rel.id, rel.locked);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300 transition-colors mobile-touch-target min-h-[44px]"
                            title="Unlock (Site Engineer / Project Manager only)"
                          >
                            <Unlock className="h-3.5 w-3.5" />
                            Unlock
                          </button>
                        )}
                        {canUnlock && !rel.locked && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLockToggle(rel.id, rel.locked);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300 transition-colors mobile-touch-target min-h-[44px]"
                            title="Lock again (Site Engineer / Project Manager only)"
                          >
                            <Lock className="h-3.5 w-3.5" />
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
                  <p className="text-sm font-medium text-foreground">No release forms found</p>
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
