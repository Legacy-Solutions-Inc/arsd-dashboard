// Clean Permission Gate Component with proper error handling
'use client';

import { ReactNode, useState, useEffect } from 'react';
import { Permission } from '@/types/rbac';
import { useRBAC } from '@/hooks/useRBAC';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ShieldX } from 'lucide-react';

interface PermissionGateProps {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
  showError?: boolean;
  requireAll?: boolean; // If true, user must have ALL permissions
  permissions?: Permission[]; // Alternative to single permission
}

export function PermissionGate({
  permission,
  children,
  fallback,
  showError = true,
  requireAll = false,
  permissions
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, loading, user } = useRBAC();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        setChecking(true);
        
        if (permissions && permissions.length > 0) {
          if (requireAll) {
            // User must have ALL permissions
            const results = await Promise.all(
              permissions.map(p => hasPermission(p))
            );
            setHasAccess(results.every(result => result));
          } else {
            // User must have ANY permission
            const result = await hasAnyPermission(permissions);
            setHasAccess(result);
          }
        } else {
          // Single permission check
          const result = await hasPermission(permission);
          setHasAccess(result);
        }
      } catch (error) {
        console.error('Permission check failed:', error);
        setHasAccess(false);
      } finally {
        setChecking(false);
      }
    };

    checkPermissions();
  }, [permission, permissions, hasPermission, hasAnyPermission, requireAll]);

  // Show loading state
  if (loading || checking) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="ml-2 text-sm text-muted-foreground">Checking permissions...</span>
      </div>
    );
  }

  // User doesn't have access
  if (hasAccess === false) {
    if (fallback) {
      return <>{fallback}</>;
    }


    return null;
  }

  // User has access
  return <>{children}</>;
}