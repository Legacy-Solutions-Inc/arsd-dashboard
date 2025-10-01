// Dashboard routing utilities for role-based navigation
export type UserRole = 'superadmin' | 'hr' | 'project_manager' | 'project_inspector' | 'pending';

export function getDefaultDashboardRoute(role: UserRole | undefined): string {
  const roleDefaultRoutes: Record<UserRole, string> = {
    'superadmin': '/dashboard',
    'hr': '/dashboard/website-details',
    'project_manager': '/dashboard/uploads',
    'project_inspector': '/dashboard/uploads',
    'pending': '/pending-approval',
  };
  
  return roleDefaultRoutes[role || 'pending'] || '/pending-approval';
}

export function getAccessibleRoutes(role: UserRole | undefined): string[] {
  const roleRoutes: Record<UserRole, string[]> = {
    'superadmin': ['/dashboard', '/dashboard/users', '/dashboard/leaderboard', '/dashboard/uploads', '/dashboard/website-details'],
    'hr': ['/dashboard/website-details'],
    'project_manager': ['/dashboard/uploads'],
    'project_inspector': ['/dashboard/uploads'],
    'pending': ['/pending-approval'],
  };
  
  return roleRoutes[role || 'pending'] || ['/pending-approval'];
}

export function canAccessRoute(role: UserRole | undefined, route: string): boolean {
  const accessibleRoutes = getAccessibleRoutes(role);
  return accessibleRoutes.includes(route);
}
