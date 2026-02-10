// Role-Based Access Control Types

export type UserRole =
  | 'superadmin'
  | 'hr'
  | 'project_manager'
  | 'project_inspector'
  | 'warehouseman'
  | 'purchasing'
  | 'pending';
export type UserStatus = 'active' | 'inactive' | 'pending';

export interface UserWithRole {
  id: string;
  user_id: string;
  email: string | null;
  name: string | null;
  full_name: string | null;
  role: UserRole;
  status: UserStatus;
  avatar_url: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface UserManagement extends UserWithRole {
  // Additional fields for user management dashboard
}

// Role permissions mapping
export const ROLE_PERMISSIONS = {
  superadmin: [
    'manage_users',
    'manage_roles',
    'view_all_projects',
    'edit_all_projects',
    'delete_projects',
    'create_projects',
    'manage_system_settings',
    'manage_website_details',
    'manage_uploads'
  ],
  hr: [
    'manage_website_details'
  ],
  project_manager: [
    'manage_uploads'
  ],
  project_inspector: [
    'view_assigned_projects',
    'manage_uploads'
  ],
  warehouseman: [
    'view_assigned_projects'
  ],
  purchasing: [
    'view_assigned_projects'
  ],
  pending: []
} as const;

export type Permission = typeof ROLE_PERMISSIONS[keyof typeof ROLE_PERMISSIONS][number];

// Role hierarchy (higher number = more permissions)
export const ROLE_HIERARCHY = {
  superadmin: 4,
  hr: 3,
  project_manager: 2,
  project_inspector: 1,
  warehouseman: 1,
  purchasing: 1,
  pending: 0
} as const;

// Helper functions
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  return (ROLE_PERMISSIONS[userRole] as readonly string[]).includes(permission);
}

export function hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}

export function canAccessRole(userRole: UserRole, targetRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[targetRole];
}

export function isActiveUser(status: UserStatus): boolean {
  return status === 'active';
}

export function canAccessDashboard(role: UserRole, status: UserStatus): boolean {
  return isActiveUser(status) && role !== 'pending';
}