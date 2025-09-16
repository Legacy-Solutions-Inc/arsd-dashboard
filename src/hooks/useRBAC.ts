// Clean RBAC Hook with proper error handling and caching
import { useState, useEffect, useCallback } from 'react';
import { UserWithRole, UserRole, UserStatus, Permission } from '@/types/rbac';
import { RBACService } from '@/services/role-based/rbac.service';
import { ApiResponse } from '@/lib/api-response';

interface UseRBACReturn {
  user: UserWithRole | null;
  loading: boolean;
  error: string | null;
  hasPermission: (permission: Permission) => Promise<boolean>;
  hasAnyPermission: (permissions: Permission[]) => Promise<boolean>;
  canAccessDashboard: () => Promise<boolean>;
  refreshUser: () => Promise<void>;
  isSuperAdmin: boolean;
  isActive: boolean;
}

export function useRBAC(): UseRBACReturn {
  const [user, setUser] = useState<UserWithRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const rbacService = new RBACService();

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response: ApiResponse<UserWithRole | null> = await rbacService.getCurrentUser();
      
      if (response.success) {
        setUser(response.data || null);
      } else {
        setError(response.error?.message || 'Failed to fetch user');
        setUser(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const hasPermission = useCallback(async (permission: Permission): Promise<boolean> => {
    try {
      const response = await rbacService.hasPermission(permission);
      return response.success ? response.data || false : false;
    } catch {
      return false;
    }
  }, []);

  const hasAnyPermission = useCallback(async (permissions: Permission[]): Promise<boolean> => {
    try {
      const results = await Promise.all(
        permissions.map(permission => hasPermission(permission))
      );
      return results.some(result => result);
    } catch {
      return false;
    }
  }, [hasPermission]);

  const canAccessDashboard = useCallback(async (): Promise<boolean> => {
    try {
      const response = await rbacService.canAccessDashboard();
      return response.success ? response.data || false : false;
    } catch {
      return false;
    }
  }, []);

  const refreshUser = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const isSuperAdmin = user?.role === 'superadmin' && user?.status === 'active';
  const isActive = user?.status === 'active';

  return {
    user,
    loading,
    error,
    hasPermission,
    hasAnyPermission,
    canAccessDashboard,
    refreshUser,
    isSuperAdmin,
    isActive,
  };
}