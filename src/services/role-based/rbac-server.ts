import { createClient } from '../../../supabase/server';
import { UserRole, UserStatus, UserWithRole, Permission } from '@/types/rbac';

export class RBACServerService {
  private supabase: any;

  constructor() {
    this.supabase = null;
  }

  private async getSupabaseClient() {
    if (!this.supabase) {
      this.supabase = await createClient();
    }
    return this.supabase;
  }

  // Get current user with role and status
  async getCurrentUser(): Promise<UserWithRole | null> {
    const supabase = await this.getSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return null;
    }

    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error || !userData) {
      return null;
    }

    return userData as UserWithRole;
  }

  // Check if user has specific permission
  async hasPermission(permission: Permission): Promise<boolean> {
    const user = await this.getCurrentUser();
    if (!user || user.status !== 'active') {
      return false;
    }

    const { hasPermission: checkPermission } = await import('@/types/rbac');
    return checkPermission(user.role, permission);
  }

  // Check if user has any of the specified permissions
  async hasAnyPermission(permissions: Permission[]): Promise<boolean> {
    const user = await this.getCurrentUser();
    if (!user || user.status !== 'active') {
      return false;
    }

    const { hasAnyPermission: checkAnyPermission } = await import('@/types/rbac');
    return checkAnyPermission(user.role, permissions);
  }

  // Check if user can access dashboard
  async canAccessDashboard(): Promise<boolean> {
    const user = await this.getCurrentUser();
    if (!user) {
      return false;
    }

    const { canAccessDashboard } = await import('@/types/rbac');
    return canAccessDashboard(user.role, user.status);
  }

  // Get all users (superadmin only)
  async getAllUsers(): Promise<UserWithRole[]> {
    const supabase = await this.getSupabaseClient();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    return data as UserWithRole[];
  }

  // Update user role and status (superadmin only)
  async updateUserRole(userId: string, role: UserRole, status: UserStatus): Promise<void> {
    const supabase = await this.getSupabaseClient();
    const { error } = await supabase
      .from('users')
      .update({ role, status })
      .eq('id', userId);

    if (error) {
      throw new Error(`Failed to update user role: ${error.message}`);
    }
  }

  // Create new user (superadmin only)
  async createUser(userData: {
    email: string;
    password: string;
    full_name: string;
    role: UserRole;
    status: UserStatus;
  }): Promise<void> {
    const supabase = await this.getSupabaseClient();
    // First create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        full_name: userData.full_name
      }
    });

    if (authError || !authData.user) {
      throw new Error(`Failed to create auth user: ${authError?.message}`);
    }

    // Then create user record with role and status
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        user_id: authData.user.id,
        email: userData.email,
        full_name: userData.full_name,
        name: userData.full_name,
        token_identifier: userData.email,
        role: userData.role,
        status: userData.status
      });

    if (userError) {
      throw new Error(`Failed to create user record: ${userError.message}`);
    }
  }

  // Get user by ID (superadmin only)
  async getUserById(userId: string): Promise<UserWithRole | null> {
    const supabase = await this.getSupabaseClient();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return data as UserWithRole;
  }

  // Check if current user is superadmin
  async isSuperAdmin(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user?.role === 'superadmin' && user?.status === 'active';
  }
}

// Server-side instance
export const rbacServer = new RBACServerService();
