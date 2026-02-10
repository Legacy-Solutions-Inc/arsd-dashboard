"use client";

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ProjectGrid } from '@/components/warehouse/ProjectGrid';
import { useWarehouseAuth } from '@/hooks/warehouse/useWarehouseAuth';
import { useWarehouseProjects } from '@/hooks/warehouse/useWarehouseProjects';
import { Package, FileText, Plus, List, Search } from 'lucide-react';

export default function WarehouseDashboardPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const { user, loading: authLoading, canCreate, canViewAll } = useWarehouseAuth();
  const { projects: accessibleProjects, loading: projectsLoading } = useWarehouseProjects(user);

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

  const loading = authLoading || projectsLoading;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-arsd-red mx-auto mb-4"></div>
          <p className="text-gray-600">Loading warehouse...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 w-full">
      <div className="w-full mx-4 sm:mx-6 lg:mx-8 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6 lg:space-y-8">
        {/* Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-arsd-red/5 via-blue-500/5 to-purple-500/5 rounded-2xl blur-3xl"></div>
          <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-white/20 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-arsd-red to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="responsive-heading font-bold bg-gradient-to-r from-arsd-red to-red-600 bg-clip-text text-transparent">
                    Warehouse Management
                  </h1>
                  <p className="text-gray-600 responsive-text font-medium">
                    Manage inventory, delivery receipts, and releases
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => router.push('/dashboard/warehouse/delivery-receipts')}
            className="glass-card hover:scale-105 transition-transform duration-200 text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-arsd-primary text-sm sm:text-base">
                  Delivery Receipts List
                </h3>
                <p className="text-xs text-gray-600 mt-1">View all delivery receipts</p>
              </div>
              <List className="h-5 w-5 text-gray-400" />
            </div>
          </button>

          <button
            onClick={() => router.push('/dashboard/warehouse/releases')}
            className="glass-card hover:scale-105 transition-transform duration-200 text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-lg flex items-center justify-center">
                <Package className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-arsd-primary text-sm sm:text-base">
                  Release Forms List
                </h3>
                <p className="text-xs text-gray-600 mt-1">View all release forms</p>
              </div>
              <List className="h-5 w-5 text-gray-400" />
            </div>
          </button>
        </div>

        {/* Create Buttons - Only for Warehouseman */}
        {canCreate && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => router.push('/dashboard/warehouse/delivery-receipts/new')}
              className="btn-arsd-glass mobile-button flex items-center justify-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Create Delivery Receipt
            </button>
            <button
              onClick={() => router.push('/dashboard/warehouse/releases/new')}
              className="btn-arsd-glass mobile-button flex items-center justify-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Create Release Form
            </button>
          </div>
        )}

        {/* Project Selector Grid */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="responsive-heading font-bold text-arsd-primary">
              {canViewAll ? 'All Projects' : 'Assigned Projects'}
            </h2>
            <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-lg self-start sm:self-auto">
              {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
            </span>
          </div>

          {accessibleProjects.length > 0 ? (
            <>
              <div className="relative max-w-xl">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="    Search by project name, location, or warehouseman..."
                  className="mobile-form-input w-full pl-10 min-w-0"
                />
              </div>
              {filteredProjects.length > 0 ? (
                <ProjectGrid projects={filteredProjects} />
              ) : (
                <div className="glass-card text-center py-12">
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">No projects match your search</p>
                  <p className="text-sm text-gray-500 mt-2">Try a different search term</p>
                </div>
              )}
            </>
          ) : (
            <div className="glass-card text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No projects available</p>
              <p className="text-sm text-gray-500 mt-2">
                {canViewAll
                  ? 'No projects found in the system'
                  : 'You are not assigned to any projects'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

