"use client";

import { useState, useCallback } from "react";
import type { ProjectListFilters } from "@/types/website-projects";

const DEFAULT_FILTERS: ProjectListFilters = {
  search: "",
  page: 1,
  limit: 20,
  sort_by: "created_at",
  sort_order: "desc",
};

export function useProjectFilters(initialFilters?: Partial<ProjectListFilters>) {
  const [filters, setFilters] = useState<ProjectListFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });

  const updateFilters = useCallback((updates: Partial<ProjectListFilters>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  }, []);

  const handleSearch = useCallback((search: string) => {
    updateFilters({ search, page: 1 });
  }, [updateFilters]);

  const handleSort = useCallback((field: 'created_at' | 'name' | 'location') => {
    updateFilters({
      sort_by: field,
      sort_order: filters.sort_by === field && filters.sort_order === 'asc' ? 'desc' : 'asc',
      page: 1,
    });
  }, [filters.sort_by, filters.sort_order, updateFilters]);

  const handlePageChange = useCallback((page: number) => {
    updateFilters({ page });
  }, [updateFilters]);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  return {
    filters,
    updateFilters,
    handleSearch,
    handleSort,
    handlePageChange,
    resetFilters,
  };
}
