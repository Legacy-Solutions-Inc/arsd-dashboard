// Centralized configuration for the application
export const config = {
  app: {
    name: 'ARSD Dashboard',
    description: 'ARSD Construction Corporation Admin Portal',
    version: '1.0.0',
  },
  auth: {
    redirectPaths: {
      superadmin: '/dashboard',
      hr: '/dashboard/website-details',
      project_manager: '/dashboard/uploads',
      project_inspector: '/dashboard/uploads',
      warehouseman: '/dashboard/warehouse',
      purchasing: '/dashboard/warehouse',
      material_control: '/dashboard/warehouse',
      pending: '/pending-approval',
    },
  },
  permissions: {
    superadmin: [
      'manage_users',
      'manage_roles',
      'view_all_projects',
      'edit_all_projects',
      'delete_projects',
      'manage_system_settings',
      'manage_website_details',
      'manage_uploads',
    ],
    hr: ['manage_website_details'],
    project_manager: ['manage_uploads'],
    project_inspector: ['manage_uploads'],
    warehouseman: ['view_assigned_projects'],
    purchasing: ['view_assigned_projects'],
    material_control: ['view_assigned_projects'],
    pending: [],
  },
  routes: {
    public: ['/', '/sign-in', '/sign-up', '/about', '/contact', '/services', '/projects'],
    protected: ['/dashboard'],
    roleBased: {
      '/dashboard/users': ['superadmin'],
      '/dashboard/leaderboard': ['superadmin'],
      '/dashboard/uploads': ['project_manager', 'project_inspector', 'superadmin'],
      '/dashboard/website-details': ['hr', 'superadmin'],
    },
  },
} as const;
