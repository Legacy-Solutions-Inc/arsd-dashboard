"use client";

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ARSDCard } from '@/components/warehouse/ARSDCard';
import { ARSDTable } from '@/components/warehouse/ARSDTable';
import { BadgeStatus } from '@/components/warehouse/BadgeStatus';
import { releaseForms, projects } from '@/data/warehouseMock';
import { ArrowLeft, Search, Filter, Eye, Plus } from 'lucide-react';
import { RoleGuard } from '@/components/warehouse/RoleGuard';
import { mockUser } from '@/data/warehouseMock';

export default function ReleasesListPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

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
  }, [searchQuery, selectedProjectId, dateFrom, dateTo]);

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

        {/* Filters */}
        <div className="glass-card">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
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
                    placeholder="Search by Release No, Received By, or Project..."
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
                <ARSDCard key={rel.id}>
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-mono text-arsd-secondary mb-1">{rel.releaseNo}</div>
                        <h3 className="font-semibold text-arsd-primary text-sm">
                          {project?.name || 'Unknown Project'}
                        </h3>
                        <p className="text-xs text-gray-600 mt-1">Received by: {rel.receivedBy}</p>
                      </div>
                      <BadgeStatus locked={rel.locked} />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Date:</span>
                        <span className="font-medium ml-1">{rel.date}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Items:</span>
                        <span className="font-medium ml-1">{rel.items.length}</span>
                      </div>
                    </div>

                    {rel.purpose && (
                      <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                        <span className="font-medium">Purpose: </span>
                        {rel.purpose}
                      </div>
                    )}

                    <button
                      onClick={() => router.push(`/dashboard/warehouse/releases/${rel.id}`)}
                      className="w-full btn-arsd-outline mobile-button flex items-center justify-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </button>
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
        <div className="hidden sm:block">
          <ARSDTable>
            <thead className="glass-table-header">
              <tr>
                <th className="glass-table-header-cell">Release No</th>
                <th className="glass-table-header-cell">Date</th>
                <th className="glass-table-header-cell">Project/Site</th>
                <th className="glass-table-header-cell">Received By</th>
                <th className="glass-table-header-cell text-right">Items Count</th>
                <th className="glass-table-header-cell">Status</th>
                <th className="glass-table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReleases.length > 0 ? (
                filteredReleases.map((rel) => {
                  const project = projects.find(p => p.id === rel.projectId);
                  return (
                    <tr key={rel.id} className="glass-table-row">
                      <td className="glass-table-cell font-mono text-xs">{rel.releaseNo}</td>
                      <td className="glass-table-cell">{rel.date}</td>
                      <td className="glass-table-cell">{project?.name || 'Unknown'}</td>
                      <td className="glass-table-cell">{rel.receivedBy}</td>
                      <td className="glass-table-cell text-right">{rel.items.length}</td>
                      <td className="glass-table-cell">
                        <BadgeStatus locked={rel.locked} />
                      </td>
                      <td className="glass-table-cell">
                        <button
                          onClick={() => router.push(`/dashboard/warehouse/releases/${rel.id}`)}
                          className="btn-arsd-outline text-xs px-3 py-1 flex items-center gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="glass-table-cell text-center py-12">
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

