# Role-Based Access Control (RBAC) Implementation

This document outlines the complete implementation of a role-based access control system for the ARSD Dashboard project.

## Overview

The RBAC system provides:
- **5 User Roles**: superadmin, hr, project_manager, project_inspector, pending
- **3 User Statuses**: active, inactive, pending
- **Permission-based access control** for all dashboard features
- **Automatic user approval workflow** for new registrations
- **Role-based navigation** and UI components
- **Centralized service architecture** with proper error handling

## Database Schema

### Profiles Table Structure
The system uses the `public.profiles` table with:
- `user_id` (UUID): References auth.users.id
- `display_name` (TEXT): User's display name
- `email` (TEXT): User's email address
- `role` (enum): User's role in the system
- `status` (enum): User's current status (active/inactive/pending)
- `created_at`, `updated_at` (TIMESTAMPTZ): Timestamps

### Projects Table Structure
The system uses the `public.projects` table with:
- `id` (UUID): Primary key
- `project_id` (TEXT): System generated project ID
- `project_name`, `client`, `location` (TEXT): Project details
- `status` (enum): Project status (in_planning, in_progress, completed)
- `project_manager_id` (UUID): References profiles.user_id - Site Engineer assigned
- `project_inspector_id` (UUID): References profiles.user_id - Inspector assigned
- `created_by`, `updated_by` (UUID): References profiles.user_id
- `created_at`, `updated_at` (TIMESTAMPTZ): Timestamps

### Database Enums
- `user_role`: superadmin, hr, project_manager, project_inspector, pending
- `user_status`: active, inactive, pending

### Row-Level Security (RLS) Policies
- **Profiles table**: RLS enabled with policies for role-based access
  - **Superadmins**: Can view and update all profiles
  - **Users**: Can view and update their own profile data
  - **Role/Status updates**: Restricted to superadmins only
  - **Profile creation**: Handled through application logic with proper validation

- **Projects table**: RLS enabled with policies for project access control
  - **Superadmins**: Can view, create, update, and delete all projects
  - **HR**: Has NO access to projects (restricted)
  - **Project Managers**: Can view and update projects where they are assigned as project_manager_id
  - **Project Inspectors**: Can view and upload reports only for projects where they are assigned as project_inspector_id
  - **Project access is enforced at the database level** to ensure data security

- **Accomplishment Reports and Progress Photos**: RLS policies respect project assignments
  - Project inspectors can only upload and view reports/photos for their assigned projects
  - Project managers can upload and view reports/photos for their assigned projects

## User Roles and Permissions

### Superadmin
- **Permissions**: All permissions
- **Access**: Full system access, user management, all features
- **Can**: Manage users, roles, system settings, view all data

### HR
- **Permissions**: manage_website_details
- **Access**: Website details management ONLY
- **Can**: Edit website information and manage website projects
- **Cannot**: View projects, accomplishment reports, or progress photos (restricted access)

### Project Manager
- **Permissions**: manage_uploads
- **Access**: File upload management
- **Can**: Upload and manage project files

### Project Inspector
- **Permissions**: view_assigned_projects, manage_uploads
- **Access**: View assigned projects only, file upload management for assigned projects
- **Can**: 
  - View projects where they are assigned as project inspector
  - View accomplishment reports for their assigned projects only
  - Upload and manage files for their assigned projects
  - Approve/reject reports for their assigned projects
- **Restriction**: 
  - Can ONLY see projects where they are assigned as the project inspector
  - Can ONLY see reports for projects assigned to them
  - Cannot view or access data from projects assigned to other inspectors
- **Note**: Superadmins bypass all restrictions and see everything

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
│   ├── base-service.ts         # Base service class with common functionality
│   └── role-based/
│       ├── rbac.service.ts     # Client-side RBAC service
│       └── rbac-server.ts      # Server-side RBAC service
├── hooks/
│   └── useRBAC.ts             # React hook for RBAC functionality
├── components/
│   └── PermissionGate.tsx     # Component for permission-based rendering
├── lib/
│   ├── api-response.ts        # Standardized API response format
│   ├── errors.ts              # Custom error classes
│   ├── config.ts              # Centralized configuration
│   └── supabase.ts            # Supabase client configuration
├── app/
│   ├── pending-approval/
│   │   └── page.tsx           # Pending approval page for new users
│   └── dashboard/
│       ├── users/
│       │   └── page.tsx       # User management dashboard (superadmin only)
│       ├── website-details/
│       │   └── page.tsx       # Website details page (HR only)
│       ├── uploads/
│       │   └── page.tsx       # Uploads page (PM/Inspector only)
│       ├── layout.tsx         # Updated with RBAC checks
│       └── Sidebar.tsx        # Updated with role-based navigation
└── middleware.ts              # Updated with role-based route protection

supabase/
└── migrations/
    └── 20241220000021_clean_rbac_setup.sql  # Clean RBAC migration
```

## Key Components

### 1. RBACService Class
Client-side service for all RBAC operations:
- `getCurrentUser()`: Get current user with role and status from profiles table
- `hasPermission(permission)`: Check if user has specific permission
- `hasAnyPermission(permissions)`: Check if user has any of multiple permissions
- `canAccessDashboard()`: Check if user can access dashboard
- `getAllUsers()`: Get all users from profiles table (superadmin only)
- `updateUserRole()`: Update user role and status (superadmin only)
- `createUser()`: Create new user with profile (superadmin only)
- `getUserById()`: Get specific user by ID (superadmin only)

### 2. BaseService Class
Abstract base class providing common functionality:
- `handleSupabaseError()`: Centralized error handling for database operations
- `validateRequired()`: Input validation helper
- Automatic Supabase client initialization

### 3. useRBAC Hook
React hook for client-side RBAC functionality:
```typescript
const { 
  user, 
  loading, 
  error, 
  hasPermission, 
  hasAnyPermission,
  canAccessDashboard,
  refreshUser,
  isSuperAdmin,
  isActive 
} = useRBAC();
```

### 4. PermissionGate Component
Wrapper component for permission-based rendering:
```typescript
<PermissionGate permission="manage_users">
  <UserManagementComponent />
</PermissionGate>

// Multiple permissions
<PermissionGate permissions={['manage_uploads', 'view_projects']}>
  <ProjectComponent />
</PermissionGate>
```

### 5. Middleware Protection
Automatic route protection based on user role and status:
- Blocks pending/inactive users from dashboard
- Redirects to pending approval page
- Role-based route access control
- Smart routing based on user role

## User Registration Flow

1. **User Signs Up**: New user registers with email/password
2. **Profile Creation**: Profile record created in `public.profiles` table
3. **Pending Status**: User is created with role='pending', status='pending'
4. **Email Verification**: User verifies email address
5. **Pending Approval**: User is redirected to pending approval page
6. **Admin Review**: Superadmin reviews and assigns role/status via user management
7. **Access Granted**: User gains access based on assigned role and smart routing

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
import { RBACServerService } from '@/services/role-based/rbac-server';

const rbacServer = new RBACServerService();
const userResponse = await rbacServer.getCurrentUser();
const canAccessResponse = await rbacServer.hasPermission('manage_users');
```

## Security Features

### 1. Database-Level Security
- Row-Level Security (RLS) policies on `profiles` table
- Users can only access data they're authorized to see
- Role and status changes are restricted to superadmins
- Proper foreign key relationships between `auth.users` and `profiles`

### 2. Middleware Protection
- Automatic route protection based on user status
- Prevents unauthorized access to protected routes
- Redirects pending users to approval page
- Smart routing based on user role

### 3. Component-Level Security
- PermissionGate component prevents unauthorized UI rendering
- Client-side permission checks for better UX
- Graceful fallbacks for unauthorized access
- Loading states during permission checks

### 4. Service-Level Security
- Centralized error handling with custom error classes
- Input validation and sanitization
- Proper API response formatting
- Consistent error messages

### 5. Type Safety
- TypeScript types ensure compile-time permission checking
- Enum-based roles and statuses prevent invalid values
- Permission constants prevent typos
- Strongly typed API responses

## Migration Instructions

1. **Run Database Migration**:
   ```bash
   supabase db push
   ```

2. **Update Environment Variables**:
   Ensure Supabase environment variables are properly configured in `.env.local`.

3. **Create Superadmin User**:
   Create a superadmin user manually in the database:
   ```sql
   -- First, create the auth user (if not exists)
   INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at)
   VALUES ('your-uuid-here', 'admin@example.com', NOW(), NOW(), NOW())
   ON CONFLICT (email) DO NOTHING;

   -- Then create the profile
   INSERT INTO public.profiles (user_id, display_name, email, role, status)
   VALUES ('your-uuid-here', 'Super Admin', 'admin@example.com', 'superadmin', 'active')
   ON CONFLICT (user_id) DO UPDATE SET
     role = 'superadmin',
     status = 'active';
   ```

4. **Verify Permissions**:
   Test each role's access to ensure proper permission enforcement.

## Troubleshooting

### Common Issues

1. **"Permission denied" errors**: Check RLS policies and user role/status in profiles table
2. **Components not rendering**: Verify PermissionGate permissions and user authentication
3. **Middleware redirects**: Check user status and role assignments in profiles table
4. **Type errors**: Ensure all imports are correct and types are up to date
5. **"User not found" errors**: Verify profile exists in public.profiles table
6. **Duplicate profile errors**: Check for existing profiles before creating new ones

### Debug Tips

1. Check user role and status in the `public.profiles` table
2. Verify RLS policies are active on the profiles table
3. Test permissions using the useRBAC hook
4. Check browser console for permission-related errors
5. Verify Supabase client configuration
6. Check for proper error handling in service methods

## Future Enhancements

1. **Role Hierarchy**: Implement role inheritance and role-based permissions
2. **Custom Permissions**: Allow custom permission creation and management
3. **Audit Logging**: Track permission changes and access patterns
4. **Bulk Operations**: Batch user role updates and bulk user management
5. **Email Notifications**: Notify users of role/status changes
6. **Caching Layer**: Implement Redis caching for better performance
7. **API Rate Limiting**: Add rate limiting for security
8. **Multi-tenancy**: Support for multiple organizations
9. **Advanced Analytics**: User access patterns and security insights
10. **Mobile Support**: Enhanced mobile experience for user management

## Security Considerations

1. **Never trust client-side permissions** for sensitive operations
2. **Always verify permissions server-side** for API routes
3. **Regularly audit user roles** and permissions in the profiles table
4. **Monitor for permission escalation** attempts
5. **Keep RLS policies updated** as requirements change
6. **Validate all inputs** before database operations
7. **Use proper error handling** to avoid information leakage
8. **Implement proper logging** for security events
9. **Regular security reviews** of permission assignments
10. **Backup and recovery** procedures for user data

## Architecture Benefits

This RBAC implementation provides:

- **Clean Architecture**: Separation of concerns with service layers
- **Type Safety**: Full TypeScript support with compile-time checks
- **Error Handling**: Centralized error management with custom error classes
- **Scalability**: Modular design that can grow with the application
- **Maintainability**: Clear code organization and documentation
- **Security**: Multiple layers of protection (database, middleware, component)
- **Performance**: Efficient database queries and caching strategies
- **Developer Experience**: Clear APIs and comprehensive documentation

This RBAC implementation provides a robust, scalable, and secure foundation for managing user access in the ARSD Dashboard application.

## Project Inspector Assignment Feature

### Overview
Each project can be assigned to a specific project inspector. When a project inspector logs in, they can only view and manage projects that have been assigned to them.

### Implementation Details

#### Database Changes
- Added `project_inspector_id` column to the `projects` table
- Updated RLS policies to restrict project inspectors to their assigned projects only
- Updated accomplishment_reports and progress_photos policies to respect inspector assignments

#### Application Features
1. **Project Assignment**:
   - Superadmins can assign project inspectors when creating or editing projects
   - Both Site Engineer (project_manager_id) and Project Inspector (project_inspector_id) can be assigned
   - Assignments are optional and can be unassigned

2. **Filtered Views**:
   - Project inspectors automatically see only their assigned projects in the dashboard
   - The `useProjects` hook automatically filters based on the user's role
   - No additional configuration needed - filtering happens automatically

3. **Upload Permissions**:
   - Project inspectors can upload accomplishment reports and progress photos only for their assigned projects
   - Database-level RLS ensures inspectors cannot access data for unassigned projects

4. **Type Safety**:
   - Full TypeScript support with `ProjectInspector` interface
   - Type-safe filtering and assignment operations
   - Compile-time checks for project inspector operations

### Usage Example

```typescript
// Project inspectors automatically see filtered projects
const { projects, loading, error } = useProjects();
// For inspectors: only returns projects where project_inspector_id === user.user_id

// Get available inspectors for assignment (superadmin only)
const inspectors = await projectService.getAvailableProjectInspectors();

// Assign inspector to project
await projectService.updateProject(projectId, {
  project_inspector_id: inspectorUserId
});
```

### Security Benefits
- **Database-Level Enforcement**: RLS policies ensure inspectors cannot bypass restrictions
- **Automatic Filtering**: No manual permission checks needed in components
- **Clean Separation**: Clear distinction between different user roles and their access
- **Audit Trail**: All project assignments are tracked with created_by and updated_by fields
