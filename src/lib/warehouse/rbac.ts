import { createClient } from '@/lib/supabase';

export type WarehouseRole =
  | 'superadmin'
  | 'purchasing'
  | 'warehouseman'
  | 'project_inspector'
  | 'project_manager'
  | 'material_control';

export interface WarehouseUser {
  id: string;
  display_name: string;
  email: string;
  role: WarehouseRole;
  assigned_project_ids: string[]; // Projects where user is assigned (warehouseman, PM, inspector)
}

/**
 * Get current user with warehouse context
 */
export async function getCurrentWarehouseUser(): Promise<WarehouseUser | null> {
  const supabase = createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return null;
  }

  // Get profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('user_id, display_name, email, role, status')
    .eq('user_id', user.id)
    .single();

  if (profileError || !profile || profile.status !== 'active') {
    return null;
  }

  // Get assigned projects (where user is PM, inspector, or warehouseman)
  const { data: projects } = await supabase
    .from('projects')
    .select('id')
    .or(`project_manager_id.eq.${user.id},project_inspector_id.eq.${user.id},warehouseman_id.eq.${user.id}`);

  const assignedProjectIds = projects?.map((p) => p.id) || [];

  return {
    id: profile.user_id,
    display_name: profile.display_name,
    email: profile.email,
    role: profile.role as WarehouseRole,
    assigned_project_ids: assignedProjectIds,
  };
}

/**
 * Get accessible projects for warehouse (based on role)
 */
export async function getAccessibleWarehouseProjects(user: WarehouseUser) {
  const supabase = createClient();

  if (user.role === 'superadmin' || user.role === 'purchasing') {
    // Can see all projects
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        warehouseman:profiles!warehouseman_id(user_id, display_name, email)
      `)
      .order('project_name');

    if (error) throw new Error(error.message);
    return data || [];
  }

  // Otherwise, only assigned projects
  if (user.assigned_project_ids.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      warehouseman:profiles!warehouseman_id(user_id, display_name, email)
    `)
    .in('id', user.assigned_project_ids)
    .order('project_name');

  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Can user create DR/Release?
 */
export function canCreateDRRelease(user: WarehouseUser): boolean {
  return user.role === 'warehouseman';
}

/**
 * Can user unlock DR/Release?
 */
export function canUnlockDRRelease(user: WarehouseUser): boolean {
  return ['superadmin', 'project_inspector', 'project_manager'].includes(user.role);
}

/**
 * Can user view all projects?
 */
export function canViewAllProjects(user: WarehouseUser): boolean {
  return user.role === 'superadmin' || user.role === 'purchasing' || user.role === 'material_control';
}
