"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProjectGrid } from '@/components/warehouse/ProjectGrid';
import { useWarehouseAuth } from '@/hooks/warehouse/useWarehouseAuth';
import { useWarehouseProjects } from '@/hooks/warehouse/useWarehouseProjects';
import { UniversalLoading } from '@/components/ui/universal-loading';
import { Package, FileText, Plus, List, Search } from 'lucide-react';

export default function WarehouseDashboardPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const { user, loading: authLoading, canCreate, canViewAll } = useWarehouseAuth();
  const { projects: accessibleProjects, loading: projectsLoading } = useWarehouseProjects(user);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return accessibleProjects;
    const q = searchQuery.toLowerCase();
    return accessibleProjects.filter(
      (p) =>
        p.project_name.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        (p.warehouseman?.display_name || '').toLowerCase().includes(q)
    );
  }, [accessibleProjects, searchQuery]);

  useEffect(() => {
    // Reset to first page when filters or available projects change
    setCurrentPage(1);
  }, [searchQuery, accessibleProjects.length]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredProjects.length / pageSize)),
    [filteredProjects.length]
  );

  const activePage = Math.min(currentPage, totalPages);

  const paginatedProjects = useMemo(() => {
    const start = (activePage - 1) * pageSize;
    return filteredProjects.slice(start, start + pageSize);
  }, [filteredProjects, activePage, pageSize]);

  const startIndex = filteredProjects.length === 0 ? 0 : (activePage - 1) * pageSize + 1;
  const endIndex = filteredProjects.length === 0
    ? 0
    : Math.min((activePage - 1) * pageSize + paginatedProjects.length, filteredProjects.length);

  const loading = authLoading || projectsLoading;

  if (loading) {
    return (
      <UniversalLoading
        type="dashboard"
        message="Loading Warehouse Management"
        subtitle="Preparing your warehouse projects and permissions..."
        size="lg"
        fullScreen
      />
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
            <Package className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
              Inventory
            </div>
            <h1 className="text-h1 font-display text-foreground leading-none">
              Warehouse Management
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage inventory, delivery receipts, and releases.
            </p>
          </div>
        </div>
      </header>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() => router.push('/dashboard/warehouse/delivery-receipts')}
          className="bg-card border border-border rounded-md p-4 text-left hover:border-foreground/15 hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center">
              <FileText className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-foreground">
                Delivery receipts
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                View all delivery receipts
              </p>
            </div>
            <List className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
          </div>
        </button>

        <button
          onClick={() => router.push('/dashboard/warehouse/releases')}
          className="bg-card border border-border rounded-md p-4 text-left hover:border-foreground/15 hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center">
              <Package className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-foreground">
                Release forms
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                View all release forms
              </p>
            </div>
            <List className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
          </div>
        </button>
      </div>

      {canCreate && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => router.push('/dashboard/warehouse/delivery-receipts/new')}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:bg-[hsl(var(--arsd-red-hover))] transition-colors"
          >
            <Plus className="h-4 w-4" strokeWidth={1.75} />
            Create delivery receipt
          </button>
          <button
            onClick={() => router.push('/dashboard/warehouse/releases/new')}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:bg-[hsl(var(--arsd-red-hover))] transition-colors"
          >
            <Plus className="h-4 w-4" strokeWidth={1.75} />
            Create release form
          </button>
        </div>
      )}

      {/* Project selector */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-h3 text-foreground">
            {canViewAll ? 'All projects' : 'Assigned projects'}
          </h2>
          <span className="text-xs text-muted-foreground bg-muted border border-border px-2.5 py-0.5 rounded-md self-start sm:self-auto nums">
            {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
          </span>
        </div>

        {accessibleProjects.length > 0 ? (
          <>
            <div className="relative max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" strokeWidth={1.75} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by project, location, or warehouseman"
                className="w-full rounded-md border border-border bg-card pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-transparent"
              />
            </div>
            {filteredProjects.length > 0 ? (
              <>
                <ProjectGrid projects={paginatedProjects} />
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground nums">
                      Showing <span className="text-foreground font-medium">{startIndex}</span>
                      {'–'}
                      <span className="text-foreground font-medium">{endIndex}</span> of{' '}
                      <span className="text-foreground font-medium">{filteredProjects.length}</span>
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
              </>
            ) : (
              <div className="bg-card border border-border rounded-md text-center py-10">
                <Search className="h-6 w-6 text-muted-foreground mx-auto mb-2" strokeWidth={1.75} />
                <p className="text-sm font-medium text-foreground">No projects match your search</p>
                <p className="text-sm text-muted-foreground mt-1">Try a different search term.</p>
              </div>
            )}
          </>
        ) : (
          <div className="bg-card border border-border rounded-md text-center py-10">
            <Package className="h-6 w-6 text-muted-foreground mx-auto mb-2" strokeWidth={1.75} />
            <p className="text-sm font-medium text-foreground">No projects available</p>
            <p className="text-sm text-muted-foreground mt-1">
              {canViewAll ? 'No projects found in the system.' : 'You are not assigned to any projects.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

