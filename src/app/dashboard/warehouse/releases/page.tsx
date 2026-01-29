"use client";

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ARSDCard } from '@/components/warehouse/ARSDCard';
import { ARSDTable } from '@/components/warehouse/ARSDTable';
import { BadgeStatus } from '@/components/warehouse/BadgeStatus';
import { projects, mockUser, canUnlockDRRelease, releaseWarehousemanFallback } from '@/data/warehouseMock';
import { useWarehouseStore } from '@/contexts/WarehouseStoreContext';
import { ArrowLeft, Search, Filter, Eye, Plus, Unlock, Lock } from 'lucide-react';
import { RoleGuard } from '@/components/warehouse/RoleGuard';

export default function ReleasesListPage() {
  const router = useRouter();
  const { releaseForms, setReleaseLock } = useWarehouseStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const canUnlock = canUnlockDRRelease(mockUser);

  const filteredReleases = useMemo(() => {
    let filtered = [...releaseForms];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(rel =>
        rel.releaseNo.toLowerCase().includes(query) ||
        rel.receivedBy.toLowerCase().includes(query) ||
        projects.find(p => p.id === rel.projectId)?.name.toLowerCase().includes(query)
      );
    }

    if (selectedProjectId) {
      filtered = filtered.filter(rel => rel.projectId === selectedProjectId);
    }

    if (dateFrom) {
      filtered = filtered.filter(rel => rel.date >= dateFrom);
    }

    if (dateTo) {
      filtered = filtered.filter(rel => rel.date <= dateTo);
    }

    return filtered;
  }, [releaseForms, searchQuery, selectedProjectId, dateFrom, dateTo]);

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
                    Release Forms
                  </h1>
                  <p className="text-gray-600 responsive-text">View and manage all release forms</p>
                </div>
              </div>
              <RoleGuard allowedRoles={['warehouseman']} currentRole={mockUser.role}>
                <button
                  onClick={() => router.push('/dashboard/warehouse/releases/new')}
                  className="btn-arsd-primary mobile-button flex items-center gap-2"
                >
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Create Release</span>
                </button>
              </RoleGuard>
            </div>
          </div>
        </div>

        {/* Filters – sticky on scroll */}
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border border-red-200/30 rounded-xl shadow-lg p-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-arsd-red" />
              <h2 className="text-lg font-bold text-arsd-primary">Filters</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="sm:col-span-2 lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="    Search by Release No, Received By, or Project..."
                    className="mobile-form-input w-full pl-10"
                  />
                </div>
              </div>
              <div>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="mobile-form-input w-full"
                >
                  <option value="">All Projects</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  placeholder="From"
                  className="mobile-form-input w-full text-xs"
                />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  placeholder="To"
                  className="mobile-form-input w-full text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile View - Cards */}
        <div className="block sm:hidden space-y-4">
          {filteredReleases.length > 0 ? (
            filteredReleases.map((rel) => {
              const project = projects.find(p => p.id === rel.projectId);
              return (
                <ARSDCard key={rel.id} className="p-5">
                  <div className="space-y-4">
                    <div className="min-w-0">
                      <div className="text-xs font-mono text-arsd-secondary mb-1">{rel.releaseNo}</div>
                      <h3 className="font-semibold text-arsd-primary text-base truncate">
                        {project?.name || 'Unknown Project'}
                      </h3>
                    </div>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                      <dt className="text-gray-500">Received by</dt>
                      <dd className="font-medium break-words min-w-0">{rel.receivedBy}</dd>
                      <dt className="text-gray-500">Date</dt>
                      <dd className="font-medium">{rel.date}</dd>
                      <dt className="text-gray-500">Items</dt>
                      <dd className="font-medium">{rel.items.length}</dd>
                      <dt className="text-gray-500">Warehouseman</dt>
                      <dd className="font-medium break-words min-w-0">{rel.warehouseman ?? releaseWarehousemanFallback[rel.id] ?? '—'}</dd>
                      <dt className="text-gray-500">Status</dt>
                      <dd><BadgeStatus locked={rel.locked} /></dd>
                      {rel.purpose && (
                        <>
                          <dt className="text-gray-500 col-span-2">Purpose</dt>
                          <dd className="col-span-2 text-gray-600 bg-gray-50 p-2 rounded break-words min-w-0">{rel.purpose}</dd>
                        </>
                      )}
                    </dl>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        onClick={() => router.push(`/dashboard/warehouse/releases/${rel.id}`)}
                        className="flex-1 btn-arsd-primary mobile-button mobile-touch-target min-h-[44px] flex items-center justify-center gap-2"
                      >
                        <Eye className="h-5 w-5" />
                        View
                      </button>
                      {canUnlock && rel.locked && (
                        <button
                          onClick={() => setReleaseLock(rel.id, false)}
                          className="btn-arsd-outline mobile-button mobile-touch-target min-h-[44px] flex items-center justify-center gap-2 text-amber-700 border-amber-300 hover:bg-amber-50 min-w-[110px]"
                          title="Unlock (Site Engineer / Project Manager only)"
                        >
                          <Unlock className="h-5 w-5" />
                          Unlock
                        </button>
                      )}
                      {canUnlock && !rel.locked && (
                        <button
                          onClick={() => setReleaseLock(rel.id, true)}
                          className="btn-arsd-outline mobile-button mobile-touch-target min-h-[44px] flex items-center justify-center gap-2 text-green-700 border-green-300 hover:bg-green-50 min-w-[110px]"
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
            <div className="glass-card text-center py-12">
              <p className="text-gray-600 font-medium">No release forms found</p>
              <p className="text-sm text-gray-500 mt-2">Try adjusting your filters</p>
            </div>
          )}
        </div>

        {/* Desktop View - Table */}
        <div className="hidden sm:block overflow-x-auto rounded-2xl">
          <ARSDTable className="min-w-[720px]">
            <thead className="glass-table-header">
              <tr className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm">
                <th className="glass-table-header-cell text-center">Release No</th>
                <th className="glass-table-header-cell text-center">Date</th>
                <th className="glass-table-header-cell text-center">Project/Site</th>
                <th className="glass-table-header-cell text-center">Warehouseman</th>
                <th className="glass-table-header-cell text-center">Received By</th>
                <th className="glass-table-header-cell text-center">Items Count</th>
                <th className="glass-table-header-cell text-center">Status</th>
                <th className="glass-table-header-cell text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReleases.length > 0 ? (
                filteredReleases.map((rel) => {
                  const project = projects.find(p => p.id === rel.projectId);
                  return (
                    <tr key={rel.id} className="glass-table-row">
                      <td className="glass-table-cell font-mono text-xs text-center">{rel.releaseNo}</td>
                      <td className="glass-table-cell text-center">{rel.date}</td>
                      <td className="glass-table-cell text-center">{project?.name || 'Unknown'}</td>
                      <td className="glass-table-cell text-center">{rel.warehouseman ?? releaseWarehousemanFallback[rel.id] ?? '—'}</td>
                      <td className="glass-table-cell text-center">{rel.receivedBy}</td>
                      <td className="glass-table-cell text-center">{rel.items.length}</td>
                      <td className="glass-table-cell text-center">
                        <BadgeStatus locked={rel.locked} />
                      </td>
                      <td className="glass-table-cell text-left">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => router.push(`/dashboard/warehouse/releases/${rel.id}`)}
                            className="btn-arsd-outline text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-2 flex items-center gap-1.5 justify-center mobile-touch-target min-h-[44px]"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </button>
                          {canUnlock && rel.locked && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setReleaseLock(rel.id, false); }}
                              className="btn-arsd-outline text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-2 flex items-center gap-1.5 text-amber-700 border-amber-300 hover:bg-amber-50 mobile-touch-target min-h-[44px]"
                              title="Unlock (Site Engineer / Project Manager only)"
                            >
                              <Unlock className="h-4 w-4" />
                              Unlock
                            </button>
                          )}
                          {canUnlock && !rel.locked && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setReleaseLock(rel.id, true); }}
                              className="btn-arsd-outline text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-2 flex items-center gap-1.5 text-green-700 border-green-300 hover:bg-green-50 mobile-touch-target min-h-[44px]"
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
                  <td colSpan={8} className="glass-table-cell text-center py-12">
                    <p className="text-gray-600 font-medium">No release forms found</p>
                    <p className="text-sm text-gray-500 mt-2">Try adjusting your filters</p>
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

