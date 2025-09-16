"use client";

import { ReactNode, useEffect, useState } from 'react';
import { Permission } from '@/types/rbac';
import { useRBAC } from '@/hooks/useRBAC';

interface PermissionGateProps {
  children: ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  fallback?: ReactNode;
  loading?: ReactNode;
}

export function PermissionGate({
  children,
  permission,
  permissions = [],
  requireAll = false,
  fallback = null,
  loading = <div>Loading...</div>
}: PermissionGateProps) {
  const { user, loading: userLoading, hasPermission, hasAnyPermission } = useRBAC();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (userLoading || !user) {
        setChecking(false);
        return;
      }

      try {
        let access = false;

        if (permission) {
          access = await hasPermission(permission);
        } else if (permissions.length > 0) {
          if (requireAll) {
            // Check if user has ALL permissions
            const results = await Promise.all(
              permissions.map(p => hasPermission(p))
            );
            access = results.every(result => result);
          } else {
            // Check if user has ANY permission
            access = await hasAnyPermission(permissions);
          }
        } else {
          // No permission specified, allow access
          access = true;
        }
        setHasAccess(access);
      } catch (error) {
        console.error('Error checking permissions:', error);
        setHasAccess(false);
      } finally {
        setChecking(false);
      }
    };

    checkAccess();
  }, [user, userLoading, permission, permissions, requireAll, hasPermission, hasAnyPermission]);

  if (userLoading || checking) {
    return <>{loading}</>;
  }

  if (!user) {
    return <>{fallback}</>;
  }

  if (hasAccess === false) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}