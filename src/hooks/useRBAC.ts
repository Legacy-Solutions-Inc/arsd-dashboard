"use client";

import { useState, useEffect } from 'react';
import { rbacClient } from '@/services/role-based/rbac';
import { UserWithRole, Permission } from '@/types/rbac';

export function useRBAC() {
  const [user, setUser] = useState<UserWithRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const userData = await rbacClient.getCurrentUser();
        setUser(userData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch user data');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const hasPermission = async (permission: Permission): Promise<boolean> => {
    if (!user) return false;
    return await rbacClient.hasPermission(permission);
  };

  const hasAnyPermission = async (permissions: Permission[]): Promise<boolean> => {
    if (!user) return false;
    return await rbacClient.hasAnyPermission(permissions);
  };

  const canAccessDashboard = async (): Promise<boolean> => {
    if (!user) return false;
    return await rbacClient.canAccessDashboard();
  };

  const isSuperAdmin = async (): Promise<boolean> => {
    if (!user) return false;
    return await rbacClient.isSuperAdmin();
  };

  const refreshUser = async () => {
    try {
      setLoading(true);
      const userData = await rbacClient.getCurrentUser();
      setUser(userData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh user data');
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    hasPermission,
    hasAnyPermission,
    canAccessDashboard,
    isSuperAdmin,
    refreshUser
  };
}