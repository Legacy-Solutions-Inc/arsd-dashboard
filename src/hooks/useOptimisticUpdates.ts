"use client";

import { useState, useCallback, useRef } from "react";
import type { WebsiteProject } from "@/types/website-projects";

interface OptimisticUpdate<T> {
  id: string;
  type: 'create' | 'update' | 'delete';
  data: T;
  originalData?: T;
  timestamp: number;
}

export function useOptimisticUpdates() {
  const [optimisticUpdates, setOptimisticUpdates] = useState<Map<string, OptimisticUpdate<any>>>(new Map());
  const updateIdRef = useRef(0);

  const generateUpdateId = useCallback(() => {
    return `update_${++updateIdRef.current}`;
  }, []);

  const addOptimisticUpdate = useCallback(<T>(
    type: 'create' | 'update' | 'delete',
    data: T,
    originalData?: T
  ) => {
    const updateId = generateUpdateId();
    const update: OptimisticUpdate<T> = {
      id: updateId,
      type,
      data,
      originalData,
      timestamp: Date.now(),
    };

    setOptimisticUpdates(prev => new Map(prev).set(updateId, update));
    return updateId;
  }, [generateUpdateId]);

  const removeOptimisticUpdate = useCallback((updateId: string) => {
    setOptimisticUpdates(prev => {
      const newMap = new Map(prev);
      newMap.delete(updateId);
      return newMap;
    });
  }, []);

  const clearAllOptimisticUpdates = useCallback(() => {
    setOptimisticUpdates(new Map());
  }, []);

  const applyOptimisticUpdates = useCallback((projects: WebsiteProject[]): WebsiteProject[] => {
    let result = [...projects];

    // Apply updates in chronological order
    const updatesArray = Array.from(optimisticUpdates.values());
    const sortedUpdates = updatesArray.sort((a, b) => a.timestamp - b.timestamp);

    for (const update of sortedUpdates) {
      switch (update.type) {
        case 'create':
          result.unshift(update.data as WebsiteProject);
          break;
        case 'update':
          result = result.map(project => 
            project.id === update.data.id ? { ...project, ...update.data } : project
          );
          break;
        case 'delete':
          result = result.filter(project => project.id !== update.data.id);
          break;
      }
    }

    return result;
  }, [optimisticUpdates]);

  const getOptimisticProject = useCallback((projectId: string): WebsiteProject | null => {
    const updatesArray = Array.from(optimisticUpdates.values());
    for (const update of updatesArray) {
      if (update.type === 'update' && update.data.id === projectId) {
        return update.data as WebsiteProject;
      }
    }
    return null;
  }, [optimisticUpdates]);

  return {
    addOptimisticUpdate,
    removeOptimisticUpdate,
    clearAllOptimisticUpdates,
    applyOptimisticUpdates,
    getOptimisticProject,
    hasOptimisticUpdates: optimisticUpdates.size > 0,
  };
}
