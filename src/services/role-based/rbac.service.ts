// Clean RBAC Service implementation
import { BaseService } from '../base-service';
import { UserRole, UserStatus, UserWithRole, Permission } from '@/types/rbac';
import { AuthError, PermissionError, ValidationError } from '@/lib/errors';
import { createSuccessResponse, createErrorResponse, ApiResponse } from '@/lib/api-response';

export class RBACService extends BaseService {
  // Get current user with role and status
  async getCurrentUser(): Promise<ApiResponse<UserWithRole | null>> {
    try {
      const { data: { user }, error: authError } = await this.supabase.auth.getUser();
      
      if (authError || !user) {
        return createSuccessResponse(null);
      }

      const userData = await this.handleSupabaseError(() =>
        Promise.resolve(
          this.supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .single()
        )
      );

      const userWithRole: UserWithRole = {
        id: user.id,
        user_id: user.id,
        email: userData.email || user.email,
        name: userData.display_name,
        full_name: userData.display_name,
        avatar_url: null,
        role: userData.role || 'pending',
        status: userData.status || 'pending',
        created_at: userData.created_at,
        updated_at: userData.updated_at
      };

      return createSuccessResponse(userWithRole);
    } catch (error) {
      return createErrorResponse(
        error instanceof Error ? error.message : 'Failed to get current user',
        'RBAC_ERROR'
      );
    }
  }

  // Check if user has specific permission
  async hasPermission(permission: Permission): Promise<ApiResponse<boolean>> {
    try {
      const userResponse = await this.getCurrentUser();
      
      if (!userResponse.success || !userResponse.data) {
        return createSuccessResponse(false);
      }

      const user = userResponse.data;
      
      if (user.status !== 'active') {
        return createSuccessResponse(false);
      }

      const { hasPermission } = await import('@/types/rbac');
      const hasAccess = hasPermission(user.role, permission);
      
      return createSuccessResponse(hasAccess);
    } catch (error) {
      return createErrorResponse(
        error instanceof Error ? error.message : 'Failed to check permission',
        'PERMISSION_CHECK_ERROR'
      );
    }
  }

  // Get all users (superadmin only)
  async getAllUsers(): Promise<ApiResponse<UserWithRole[]>> {
    try {
      const currentUserResponse = await this.getCurrentUser();
      
      if (!currentUserResponse.success || !currentUserResponse.data) {
        throw new AuthError('User not authenticated');
      }

      const currentUser = currentUserResponse.data;
      
      if (currentUser.role !== 'superadmin' || currentUser.status !== 'active') {
        throw new PermissionError('Insufficient permissions to view all users');
      }

      const users = await this.handleSupabaseError(() =>
        Promise.resolve(
          this.supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })
        )
      );

      const usersWithRole: UserWithRole[] = (users || []).map(profile => ({
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
      }));

      return createSuccessResponse(usersWithRole);
    } catch (error) {
      return createErrorResponse(
        error instanceof Error ? error.message : 'Failed to fetch users',
        'FETCH_USERS_ERROR'
      );
    }
  }

  // Update user role and status (superadmin only)
  async updateUserRole(
    userId: string, 
    role: UserRole, 
    status: UserStatus
  ): Promise<ApiResponse<void>> {
    try {
      this.validateRequired({ userId, role, status }, ['userId', 'role', 'status']);

      const currentUserResponse = await this.getCurrentUser();
      
      if (!currentUserResponse.success || !currentUserResponse.data) {
        throw new AuthError('User not authenticated');
      }

      const currentUser = currentUserResponse.data;
      
      if (currentUser.role !== 'superadmin' || currentUser.status !== 'active') {
        throw new PermissionError('Insufficient permissions to update user roles');
      }

      await this.handleSupabaseError(() =>
        Promise.resolve(
          this.supabase
            .from('profiles')
            .update({ role, status })
            .eq('user_id', userId)
        )
      );

      return createSuccessResponse(undefined);
    } catch (error) {
      return createErrorResponse(
        error instanceof Error ? error.message : 'Failed to update user role',
        'UPDATE_USER_ERROR'
      );
    }
  }

  // Check if user can access dashboard
  async canAccessDashboard(): Promise<ApiResponse<boolean>> {
    try {
      const userResponse = await this.getCurrentUser();
      
      if (!userResponse.success || !userResponse.data) {
        return createSuccessResponse(false);
      }

      const user = userResponse.data;
      const { canAccessDashboard } = await import('@/types/rbac');
      const canAccess = canAccessDashboard(user.role, user.status);
      
      return createSuccessResponse(canAccess);
    } catch (error) {
      return createErrorResponse(
        error instanceof Error ? error.message : 'Failed to check dashboard access',
        'DASHBOARD_ACCESS_ERROR'
      );
    }
  }
}
