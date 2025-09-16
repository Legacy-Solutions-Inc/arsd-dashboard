import { createClient as createBrowserClient } from '../../../supabase/client';
import { UserRole, UserStatus, UserWithRole, Permission } from '@/types/rbac';

export class RBACService {
  private supabase;

  constructor() {
    this.supabase = createBrowserClient();
  }

  // Get current user with role and status
  async getCurrentUser(): Promise<UserWithRole | null> {
    console.log('RBAC Service - Getting current user...');
    
    const { data: { user }, error: authError } = await this.supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('RBAC Service - No auth user found');
      return null;
    }
    
    const { data: userData, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // If not found by user_id, try by display_name (email might be in display_name)
    if (error && error.code === 'PGRST116') {
      console.log('RBAC Service - User not found by user_id, trying by display_name...');
      const { data: userDataByDisplayName, error: displayNameError } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('display_name', user.email)
        .single();
      
      if (userDataByDisplayName) {
        console.log('RBAC Service - Found user by display_name, using that data');
        return userDataByDisplayName as UserWithRole;
      }
    }
    
    if (error) {
      console.error('RBAC Service - Database error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
    }

    if (error || !userData) {
      console.log('RBAC Service - No user data found in database, creating profile record...');
      
      // Try to create profile record in database
      const newProfileData = {
        user_id: user.id,
        display_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email || 'User',
        email: user.email, // Store email in profiles table
        role: 'pending' as any, // All new users start as pending
        status: 'pending' as any // All new users start as pending
      };

      const { data: insertedProfile, error: insertError } = await this.supabase
        .from('profiles')
        .insert(newProfileData)
        .select()
        .single();

      if (insertError) {
        console.error('RBAC Service - Failed to create profile record:', insertError);
        // Return fallback user if database insert fails
        const fallbackUser: UserWithRole = {
          id: user.id,
          user_id: user.id,
          email: user.email || null,
          name: user.user_metadata?.full_name || user.user_metadata?.name || null,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
          avatar_url: user.user_metadata?.avatar_url || null,
          role: 'pending' as any, // All new users start as pending
          status: 'pending' as any, // All new users start as pending
          created_at: user.created_at || new Date().toISOString(),
          updated_at: user.updated_at || null
        };
        
        console.log('RBAC Service - Returning fallback user:', fallbackUser);
        return fallbackUser;
      }

      console.log('RBAC Service - Profile record created successfully:', insertedProfile);
      // Convert profile data to UserWithRole format
      const userWithRole: UserWithRole = {
        id: user.id,
        user_id: user.id,
        email: user.email || null,
        name: insertedProfile.display_name,
        full_name: insertedProfile.display_name,
        avatar_url: null,
        role: insertedProfile.role,
        status: insertedProfile.status,
        created_at: insertedProfile.created_at,
        updated_at: insertedProfile.updated_at
      };
      return userWithRole;
    }

    // Convert profile data to UserWithRole format
    const finalUser: UserWithRole = {
      id: user.id,
      user_id: user.id,
      email: user.email || null,
      name: userData.display_name,
      full_name: userData.display_name,
      avatar_url: null,
      role: userData.role || 'pending',
      status: userData.status || 'pending',
      created_at: userData.created_at,
      updated_at: userData.updated_at
    };

    console.log('RBAC Service - Returning user:', finalUser);
    return finalUser;
  }

  // Check if user has specific permission
  async hasPermission(permission: Permission): Promise<boolean> {
    const user = await this.getCurrentUser();
    if (!user || user.status !== 'active') {
      return false;
    }

    // Import the permission checking logic
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
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Convert profiles to UserWithRole format
    const result = data.map(profile => ({
      id: profile.user_id,
      user_id: profile.user_id,
      email: profile.email,
      name: profile.display_name,
      full_name: profile.display_name,
      avatar_url: null,
      role: profile.role,
      status: profile.status,
      created_at: profile.created_at,
      updated_at: profile.updated_at
    })) as UserWithRole[];

    return result;
  }

  // Update user role and status (superadmin only)
  async updateUserRole(userId: string, role: UserRole, status: UserStatus): Promise<void> {
    const { error } = await this.supabase
      .from('profiles')
      .update({ role, status })
      .eq('user_id', userId);

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
    // First create auth user
    const { data: authData, error: authError } = await this.supabase.auth.admin.createUser({
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
    const { error: userError } = await this.supabase
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
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    // Convert profile to UserWithRole format
    return {
      id: data.user_id,
      user_id: data.user_id,
      email: null,
      name: data.display_name,
      full_name: data.display_name,
      avatar_url: null,
      role: data.role,
      status: data.status,
      created_at: data.created_at,
      updated_at: data.updated_at
    } as UserWithRole;
  }

  // Check if current user is superadmin
  async isSuperAdmin(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user?.role === 'superadmin' && user?.status === 'active';
  }

  // Get role-based navigation items
  async getNavigationItems() {
    const user = await this.getCurrentUser();
    if (!user) return [];

    const baseItems = [
      { name: "Dashboard", href: "/dashboard", icon: "dashboard" }
    ];

    const roleItems = [];

    if (await this.hasPermission('manage_users')) {
      roleItems.push({ name: "User Management", href: "/dashboard/users", icon: "users" });
    }

    return [...baseItems, ...roleItems];
  }
}

// Client-side instance
export const rbacClient = new RBACService();