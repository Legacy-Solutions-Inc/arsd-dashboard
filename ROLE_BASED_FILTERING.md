# Role-Based Filtering - How It Works

## Overview
This document explains how the role-based filtering works for projects and accomplishment reports, with special emphasis on the difference between superadmin access and project inspector access.

## Access Control Matrix

| Role | Projects Visible | Reports Visible | Photos Visible | Can Approve/Reject Reports |
|------|-----------------|-----------------|----------------|---------------------------|
| **Superadmin** | ✅ ALL projects | ✅ ALL reports | ✅ ALL photos | ✅ Yes, all reports |
| **HR** | ❌ None | ❌ None | ❌ None | ❌ No |
| **Project Manager** | ✅ Assigned projects only | ✅ Assigned projects' reports only | ✅ Assigned projects' photos only | ❌ No |
| **Project Inspector** | ✅ Assigned projects only | ✅ Assigned projects' reports only | ✅ Assigned projects' photos only | ✅ Yes, for assigned projects |
| **Pending** | ❌ None | ❌ None | ❌ None | ❌ No |

## Projects Page (Dashboard)

### Superadmin View
```typescript
// No filtering applied - superadmin only
const { projects } = useProjects();
// Returns: ALL projects in the database
```

### HR View
```typescript
// HR has no access to projects
// They only manage website details
```

### Project Inspector View
```typescript
// Automatic filtering in useProjects hook
if (user?.role === 'project_inspector') {
  filters.project_inspector_id = user.user_id;
}
// Returns: Only projects where project_inspector_id matches inspector's user_id
```

**Example:**
- Total projects in database: 100
- Projects assigned to Inspector A: 5
- **Superadmin sees**: 100 projects
- **HR sees**: 0 projects (no access)
- **Inspector A sees**: 5 projects (only their assigned projects)

## Accomplishment Reports Page

### Superadmin View
```typescript
// No filtering applied - superadmin only
const { reports } = useAllAccomplishmentReports();
// Returns: ALL reports from all projects
```

### HR View
```typescript
// HR has no access to accomplishment reports
```

### Project Inspector View
```typescript
// Automatic filtering in useAllAccomplishmentReports hook
if (user?.role === 'project_inspector') {
  filteredData = data.filter(report => 
    report.project_inspector_id === user.user_id
  );
}
// Returns: Only reports from projects assigned to this inspector
```

### Project Manager View
```typescript
// Automatic filtering in useAllAccomplishmentReports hook
if (user?.role === 'project_manager') {
  filteredData = data.filter(report => 
    report.project_manager_id === user.user_id
  );
}
// Returns: Only reports from projects assigned to this manager
```

**Example:**
- Total reports in database: 500
- Reports from projects assigned to Inspector A: 25
- Reports from projects assigned to Manager B: 30
- **Superadmin sees**: 500 reports (all reports)
- **HR sees**: 0 reports (no access)
- **Inspector A sees**: 25 reports (only from their assigned projects)
- **Manager B sees**: 30 reports (only from their assigned projects)

## Progress Photos Page

### Superadmin View
```typescript
// No filtering applied - superadmin only
const { photos } = useAllProgressPhotos();
// Returns: ALL photos from all projects
```

### HR View
```typescript
// HR has no access to progress photos
```

### Project Inspector View
```typescript
// Automatic filtering in useAllProgressPhotos hook
if (user?.role === 'project_inspector') {
  filteredData = data.filter(photo => 
    photo.project_inspector_id === user.user_id
  );
}
// Returns: Only photos from projects assigned to this inspector
```

### Project Manager View
```typescript
// Automatic filtering in useAllProgressPhotos hook
if (user?.role === 'project_manager') {
  filteredData = data.filter(photo => 
    photo.project_manager_id === user.user_id
  );
}
// Returns: Only photos from projects assigned to this manager
```

**Example:**
- Total photos in database: 1000
- Photos from projects assigned to Inspector A: 50
- Photos from projects assigned to Manager B: 75
- **Superadmin sees**: 1000 photos (all photos)
- **HR sees**: 0 photos (no access)
- **Inspector A sees**: 50 photos (only from their assigned projects)
- **Manager B sees**: 75 photos (only from their assigned projects)

## Database-Level Security (RLS Policies)

### Projects Table Policy
```sql
-- Project inspectors can only view assigned projects
CREATE POLICY "Project inspectors can view assigned projects" ON public.projects
  FOR SELECT USING (
    project_inspector_id = auth.uid() 
    OR public.is_superadmin()  -- ✅ Superadmins bypass restriction
  );
```

### Accomplishment Reports Policy
```sql
-- Project inspectors can only view reports for assigned projects
CREATE POLICY "Project inspectors can view assigned project reports" ON public.accomplishment_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = accomplishment_reports.project_id 
      AND projects.project_inspector_id = auth.uid()
    ) OR public.is_superadmin()  -- ✅ Superadmins bypass restriction
  );
```

## Defense in Depth

The system implements multiple layers of security:

1. **Database Level**: RLS policies enforce access control at the database
2. **Application Level**: React hooks automatically filter data based on user role
3. **UI Level**: Components only show actions available to the user's role

### Layer 1: Database RLS
```
Inspector queries database → RLS checks role → Returns only assigned project data
Superadmin queries database → RLS detects superadmin → Returns ALL data
```

### Layer 2: Application Filtering
```typescript
// Even if database returns data, application filters it
if (user?.role === 'project_inspector') {
  // Apply additional filtering
} else {
  // No filtering for superadmins/HR
}
```

### Layer 3: UI Controls
```typescript
// Only show approve/reject buttons to authorized users
const canUpdateStatus = (report) => {
  return ['superadmin', 'project_inspector'].includes(user.role);
};
```

## Code Examples

### Example 1: Inspector Viewing Dashboard
```typescript
// User: Inspector A (user_id: 'abc-123')
// Projects assigned: Project 1, Project 2

const { projects } = useProjects();
// Hook automatically adds: filters.project_inspector_id = 'abc-123'
// Result: [Project 1, Project 2]
```

### Example 2: Superadmin Viewing Dashboard
```typescript
// User: Superadmin
// All projects: Project 1, Project 2, Project 3, ..., Project 100

const { projects } = useProjects();
// No filters added - role check fails (not inspector)
// Result: [Project 1, Project 2, Project 3, ..., Project 100]
```

### Example 3: Inspector Viewing Reports
```typescript
// User: Inspector A (user_id: 'abc-123')
// Assigned to: Project 1, Project 2
// Total reports: 500
// Reports from Project 1: 10
// Reports from Project 2: 15

const { reports } = useAllAccomplishmentReports();
// Hook filters: report.project_inspector_id === 'abc-123'
// Result: 25 reports (10 from Project 1 + 15 from Project 2)
```

### Example 4: Superadmin Viewing Reports
```typescript
// User: Superadmin
// Total reports: 500

const { reports } = useAllAccomplishmentReports();
// No filtering - superadmin bypasses all filters
// Result: 500 reports (ALL reports from ALL projects)
```

## Testing Scenarios

### Test 1: Inspector Can Only See Assigned Projects
1. Create 3 projects (A, B, C)
2. Assign Inspector 1 to Projects A and B
3. Log in as Inspector 1
4. Navigate to Dashboard
5. **Expected**: See only Projects A and B (not C)

### Test 2: Superadmin Sees All Projects
1. Create 3 projects (A, B, C)
2. Assign Inspector 1 to Projects A and B
3. Log in as Superadmin
4. Navigate to Dashboard
5. **Expected**: See ALL projects (A, B, and C)

### Test 3: Inspector Can Only See Assigned Project Reports
1. Upload reports for Projects A, B, C
2. Inspector 1 is assigned to Projects A and B only
3. Log in as Inspector 1
4. Navigate to Accomplishment Reports
5. **Expected**: See only reports from Projects A and B (not C)

### Test 4: Superadmin Sees All Reports
1. Upload reports for Projects A, B, C
2. Inspector 1 is assigned to Projects A and B
3. Log in as Superadmin
4. Navigate to Accomplishment Reports
5. **Expected**: See ALL reports from ALL projects (A, B, and C)

## Summary

✅ **Superadmins**: Full access to everything - no restrictions
✅ **Project Inspectors**: Restricted to assigned projects only
✅ **Defense in Depth**: Multiple security layers ensure proper access control
✅ **Automatic**: Filtering happens transparently without component changes
✅ **Secure**: Database RLS policies prevent unauthorized access even if application layer is bypassed

