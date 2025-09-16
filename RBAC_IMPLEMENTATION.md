# Role-Based Access Control (RBAC) Implementation

This document outlines the complete implementation of a role-based access control system for the ARSD Dashboard project.

## Overview

The RBAC system provides:
- **5 User Roles**: superadmin, hr, project_manager, project_inspector, pending
- **3 User Statuses**: active, inactive, pending
- **Permission-based access control** for all dashboard features
- **Automatic user approval workflow** for new registrations
- **Role-based navigation** and UI components

## Database Schema

### Users Table Updates
The `users` table has been extended with:
- `role` (enum): User's role in the system
- `status` (enum): User's current status (active/inactive/pending)

### New Database Functions
- `user_has_role(required_role)`: Check if user has specific role
- `user_has_any_role(required_roles[])`: Check if user has any of specified roles
- `get_current_user_role()`: Get current user's role
- `get_current_user_status()`: Get current user's status

### Row-Level Security (RLS) Policies
- Users can view their own data
- Users can update their own profile (except role/status)
- Superadmins can view all users
- Superadmins can update any user's role and status
- Superadmins can create new users

## User Roles and Permissions

### Superadmin
- **Permissions**: All permissions
- **Access**: Full system access, user management, all features
- **Can**: Manage users, roles, system settings, view all data

### HR
- **Permissions**: manage_company_details, view_all_projects, view_analytics
- **Access**: Company details management, project viewing, analytics
- **Can**: Edit company information, view projects and analytics

### Project Manager
- **Permissions**: view_all_projects, edit_all_projects, create_projects, view_analytics
- **Access**: Full project management capabilities
- **Can**: Create, edit, and manage all projects

### Project Inspector
- **Permissions**: view_all_projects, view_analytics
- **Access**: Read-only project access
- **Can**: View projects and analytics (read-only)

### Pending
- **Permissions**: None
- **Access**: Pending approval page only
- **Can**: Wait for administrator approval

## File Structure

```
src/
├── types/
│   └── rbac.ts                 # RBAC type definitions and helper functions
├── services/
│   └── rbac.ts                 # RBAC service layer for database operations
├── hooks/
│   └── useRBAC.ts             # React hook for RBAC functionality
├── components/
│   └── PermissionGate.tsx     # Component for permission-based rendering
├── app/
│   ├── pending-approval/
│   │   └── page.tsx           # Pending approval page for new users
│   └── dashboard/
│       ├── users/
│       │   └── page.tsx       # User management dashboard (superadmin only)
│       ├── company/
│       │   └── page.tsx       # Company details page (HR only)
│       ├── layout.tsx         # Updated with RBAC checks
│       └── Sidebar.tsx        # Updated with role-based navigation
└── middleware.ts              # Updated with role-based route protection

supabase/
└── migrations/
    └── 20241220000007_rbac_system.sql  # Database migration for RBAC
```

## Key Components

### 1. RBACService Class
Central service for all RBAC operations:
- `getCurrentUser()`: Get current user with role and status
- `hasPermission(permission)`: Check if user has specific permission
- `canAccessDashboard()`: Check if user can access dashboard
- `getAllUsers()`: Get all users (superadmin only)
- `updateUserRole()`: Update user role and status (superadmin only)
- `createUser()`: Create new user (superadmin only)

### 2. useRBAC Hook
React hook for client-side RBAC functionality:
```typescript
const { user, loading, hasPermission, canAccessDashboard } = useRBAC();
```

### 3. PermissionGate Component
Wrapper component for permission-based rendering:
```typescript
<PermissionGate permission="manage_users">
  <UserManagementComponent />
</PermissionGate>
```

### 4. Middleware Protection
Automatic route protection based on user role and status:
- Blocks pending/inactive users from dashboard
- Redirects to pending approval page
- Role-based route access control

## User Registration Flow

1. **User Signs Up**: New user registers with email/password
2. **Pending Status**: User is created with role='pending', status='pending'
3. **Email Verification**: User verifies email address
4. **Pending Approval**: User is redirected to pending approval page
5. **Admin Review**: Superadmin reviews and assigns role/status
6. **Access Granted**: User gains access based on assigned role

## Usage Examples

### Check User Permissions
```typescript
// In a component
const { hasPermission } = useRBAC();

const canManageUsers = await hasPermission('manage_users');
const canViewProjects = await hasPermission('view_all_projects');
```

### Protect Components
```typescript
// Show component only to users with specific permission
<PermissionGate permission="manage_users">
  <UserManagementPanel />
</PermissionGate>

// Show component to users with any of multiple permissions
<PermissionGate permissions={['view_all_projects', 'edit_all_projects']}>
  <ProjectPanel />
</PermissionGate>
```

### Server-Side Permission Checks
```typescript
// In server components or API routes
import { rbacServer } from '@/services/rbac';

const user = await rbacServer.getCurrentUser();
const canAccess = await rbacServer.hasPermission('manage_users');
```

## Security Features

### 1. Database-Level Security
- Row-Level Security (RLS) policies enforce access control
- Users can only access data they're authorized to see
- Role and status changes are restricted to superadmins

### 2. Middleware Protection
- Automatic route protection based on user status
- Prevents unauthorized access to protected routes
- Redirects pending users to approval page

### 3. Component-Level Security
- PermissionGate component prevents unauthorized UI rendering
- Client-side permission checks for better UX
- Graceful fallbacks for unauthorized access

### 4. Type Safety
- TypeScript types ensure compile-time permission checking
- Enum-based roles and statuses prevent invalid values
- Permission constants prevent typos

## Migration Instructions

1. **Run Database Migration**:
   ```bash
   supabase db push
   ```

2. **Update Environment Variables**:
   Ensure Supabase environment variables are properly configured.

3. **Test User Creation**:
   Create a superadmin user manually in the database:
   ```sql
   UPDATE users 
   SET role = 'superadmin', status = 'active' 
   WHERE email = 'admin@example.com';
   ```

4. **Verify Permissions**:
   Test each role's access to ensure proper permission enforcement.

## Troubleshooting

### Common Issues

1. **"Permission denied" errors**: Check RLS policies and user role/status
2. **Components not rendering**: Verify PermissionGate permissions
3. **Middleware redirects**: Check user status and role assignments
4. **Type errors**: Ensure all imports are correct and types are up to date

### Debug Tips

1. Check user role and status in the database
2. Verify RLS policies are active
3. Test permissions using the useRBAC hook
4. Check browser console for permission-related errors

## Future Enhancements

1. **Role Hierarchy**: Implement role inheritance
2. **Custom Permissions**: Allow custom permission creation
3. **Audit Logging**: Track permission changes and access
4. **Bulk Operations**: Batch user role updates
5. **Email Notifications**: Notify users of role/status changes

## Security Considerations

1. **Never trust client-side permissions** for sensitive operations
2. **Always verify permissions server-side** for API routes
3. **Regularly audit user roles** and permissions
4. **Monitor for permission escalation** attempts
5. **Keep RLS policies updated** as requirements change

This RBAC implementation provides a robust, scalable, and secure foundation for managing user access in the ARSD Dashboard application.
