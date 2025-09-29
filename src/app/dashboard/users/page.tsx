"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRBAC } from '@/hooks/useRBAC';
import { PermissionGate } from '@/components/PermissionGate';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserWithRole, UserRole, UserStatus } from '@/types/rbac';
import { rbacClient } from '@/services/role-based/rbac';
import { Plus, Edit, Save, X, Users, ChevronLeft, ChevronRight, Sparkles, User as UserIcon, Mail, Calendar, Shield } from 'lucide-react';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';

export default function UserManagementPage() {
  const { user: currentUser, refreshUser } = useRBAC();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'pending' as UserRole,
    status: 'pending' as UserStatus
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersData = await rbacClient.getAllUsers();
      setUsers(usersData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (userId: string, role: UserRole, status: UserStatus) => {
    try {
      await rbacClient.updateUserRole(userId, role, status);
      await fetchUsers();
      setEditingUser(null);
      setIsEditDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    }
  };

  // Sort users with superadmins first
  const sortedUsers = [...users].sort((a, b) => {
    // Superadmins always come first
    if (a.role === 'superadmin' && b.role !== 'superadmin') return -1;
    if (b.role === 'superadmin' && a.role !== 'superadmin') return 1;
    
    // For non-superadmins, sort by name alphabetically
    const nameA = (a.full_name || a.name || '').toLowerCase();
    const nameB = (b.full_name || b.name || '').toLowerCase();
    return nameA.localeCompare(nameB);
  });

  // Calculate pagination
  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = sortedUsers.slice(startIndex, endIndex);
  
  // Reset to first page when users change
  useMemo(() => {
    setCurrentPage(1);
  }, [users.length]);
  
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };
  
  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };
  
  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'superadmin': return 'bg-red-100/50 text-red-800 border-red-200/50';
      case 'hr': return 'bg-blue-100/50 text-blue-800 border-blue-200/50';
      case 'project_manager': return 'bg-yellow-100/50 text-yellow-800 border-yellow-200/50'; // Site Manager color
      case 'project_inspector': return 'bg-green-100/50 text-green-800 border-green-200/50'; // Project Manager color
      case 'pending': return 'bg-gray-100/50 text-gray-800 border-gray-200/50';
      default: return 'bg-gray-100/50 text-gray-800 border-gray-200/50';
    }
  };

  const getDisplayRoleName = (role: UserRole) => {
    switch (role) {
      case 'project_inspector': return 'PROJECT MANAGER';
      case 'project_manager': return 'SITE ENGINEER';
      default: return role.replace('_', ' ').toUpperCase();
    }
  };

  const getStatusBadgeColor = (status: UserStatus) => {
    switch (status) {
      case 'active': return 'bg-green-100/50 text-green-800 border-green-200/50';
      case 'inactive': return 'bg-red-100/50 text-red-800 border-red-200/50';
      case 'pending': return 'bg-yellow-100/50 text-yellow-800 border-yellow-200/50';
      default: return 'bg-gray-100/50 text-gray-800 border-gray-200/50';
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-transparent rounded-xl flex items-center justify-center">
          <Users className="h-10 w-10 text-arsd-red" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-glass-primary flex items-center gap-3 text-arsd-red">
              User Management
            </h1>
          </div>
        </div>
        <GlassCard variant="elevated" className="text-center">
          <GlassCardContent className="p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-arsd-red mx-auto mb-4"></div>
            <div className="text-glass-primary">Loading users...</div>
          </GlassCardContent>
        </GlassCard>
      </div>
    );
  }

  return (
    <PermissionGate permission="manage_users">
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-glass-subtle rounded-xl flex items-center justify-center">
              <Users className="h-10 w-10 text-arsd-red" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-glass-primary flex items-center gap-3 text-arsd-red">
                User Management
              </h1>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <GlassCard variant="elevated" className="border-red-200/50 bg-red-50/10">
            <GlassCardContent className="p-6">
              <p className="text-red-800 font-medium">{error}</p>
            </GlassCardContent>
          </GlassCard>
        )}

        {/* Users Table */}
        <GlassCard variant="elevated" className="overflow-hidden">
          <GlassCardHeader className="bg-transparent border-arsd-red/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-arsd-red/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Shield className="h-6 w-6 text-arsd-red" />
              </div>
              <div>
                <GlassCardTitle className="text-2xl font-bold text-arsd-red flex items-center gap-2">
                  Dashboard Users
                </GlassCardTitle>
                <p className="text-glass-secondary text-sm mt-1">Manage user roles and permissions</p>
              </div>
            </div>
          </GlassCardHeader>
          
          <GlassCardContent className="p-0">
            <div className="overflow-x-auto scrollbar-glass">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-arsd-red/5 to-red-500/5 border-b border-arsd-red/10">
                    <TableHead className="px-6 py-4 font-semibold text-arsd-red text-sm uppercase tracking-wider">
                      Name
                    </TableHead>
                    <TableHead className="px-6 py-4 font-semibold text-arsd-red text-sm uppercase tracking-wider">
                      Email
                    </TableHead>
                    <TableHead className="px-6 py-4 font-semibold text-arsd-red text-sm uppercase tracking-wider">
                      Role
                    </TableHead>
                    <TableHead className="px-6 py-4 font-semibold text-arsd-red text-sm uppercase tracking-wider">
                      Status
                    </TableHead>
                    <TableHead className="px-6 py-4 font-semibold text-arsd-red text-sm uppercase tracking-wider">
                      Created
                    </TableHead>
                    <TableHead className="px-6 py-4 font-semibold text-arsd-red text-sm uppercase tracking-wider">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUsers.map((user, index) => (
                    <TableRow 
                      key={user.id} 
                      className={`border-b border-white/10 hover:bg-gradient-to-r hover:from-arsd-red/5 hover:to-red-500/5 transition-colors duration-200 ${
                        index % 2 === 0 ? 'bg-white/2' : 'bg-white/5'
                      }`}
                    >
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-arsd-red/20 to-red-500/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-arsd-red/30">
                            <UserIcon className="h-5 w-5 text-arsd-red" />
                          </div>
                          <div>
                            <div className="font-semibold text-glass-primary text-md">
                              {user.full_name || user.name || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-transparent rounded-lg flex items-center justify-center">
                            <Mail className="h-4 w-4 text-arsd-red" />
                          </div>
                          <span className="text-glass-primary font-medium">{user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <Badge 
                          variant="glass" 
                          className={`${getRoleBadgeColor(user.role)} font-semibold px-3 py-1 rounded-full`}
                        >
                          {getDisplayRoleName(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <Badge 
                          variant="glass" 
                          className={`${getStatusBadgeColor(user.status)} font-semibold px-3 py-1 rounded-full`}
                        >
                          {user.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-transparent rounded-lg flex items-center justify-center">
                            <Calendar className="h-4 w-4 text-arsd-red" />
                          </div>
                          <span className="text-glass-secondary font-medium">
                            {new Date(user.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingUser(user);
                            setIsEditDialogOpen(true);
                          }}
                          className="glass-button bg-gradient-to-r from-arsd-red/30 to-red-500/30 text-white border-arsd-red/50 hover:from-arsd-red/40 hover:to-red-500/40 shadow-lg transition-colors duration-200"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </GlassCardContent>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-gradient-to-r from-arsd-red/5 to-red-500/5 border-t border-arsd-red/10 p-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-glass-secondary font-medium">
                  Showing {startIndex + 1} to {Math.min(endIndex, sortedUsers.length)} of {sortedUsers.length} users
                </div>
                
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className="glass-button bg-gradient-to-r from-arsd-red/20 to-red-500/20 text-arsd-red border-arsd-red/30 hover:from-arsd-red/30 hover:to-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      const shouldShow = 
                        page === 1 || 
                        page === totalPages || 
                        (page >= currentPage - 1 && page <= currentPage + 1);
                      
                      if (!shouldShow) {
                        if (page === 2 && currentPage > 4) {
                          return <span key={`ellipsis-${page}`} className="px-3 text-glass-muted font-medium">...</span>;
                        }
                        if (page === totalPages - 1 && currentPage < totalPages - 3) {
                          return <span key={`ellipsis-${page}`} className="px-3 text-glass-muted font-medium">...</span>;
                        }
                        return null;
                      }
                      
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => goToPage(page)}
                          className={`w-10 h-10 p-0 font-semibold ${
                            currentPage === page 
                              ? 'bg-arsd-red text-white border-arsd-red shadow-lg' 
                              : 'glass-button bg-gradient-to-r from-arsd-red/10 to-red-500/10 text-arsd-red border-arsd-red/20 hover:from-arsd-red/20 hover:to-red-500/20 transition-colors duration-200'
                          }`}
                        >
                          {page}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className="glass-button bg-gradient-to-r from-arsd-red/20 to-red-500/20 text-arsd-red border-arsd-red/30 hover:from-arsd-red/30 hover:to-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </GlassCard>

        {/* Edit User Modal */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="glass-elevated max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-arsd-red flex items-center gap-2 text-xl">
                <Edit className="h-5 w-5" />
                Edit User: {editingUser?.full_name || editingUser?.name}
              </DialogTitle>
              <DialogDescription className="text-glass-secondary">
                Update the role and status for this user account.
              </DialogDescription>
            </DialogHeader>
            
            {editingUser && (
              <div className="space-y-6 py-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-role" className="text-glass-primary font-medium">Role</Label>
                    <Select
                      value={editingUser.role}
                      onValueChange={(value: UserRole) => setEditingUser({ ...editingUser, role: value })}
                    >
                      <SelectTrigger className="glass-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="superadmin">Super Admin</SelectItem>
                        <SelectItem value="hr">HR</SelectItem>
                        <SelectItem value="project_manager">Site Engineer</SelectItem>
                        <SelectItem value="project_inspector">Project Manager</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-status" className="text-glass-primary font-medium">Status</Label>
                    <Select
                      value={editingUser.status}
                      onValueChange={(value: UserStatus) => setEditingUser({ ...editingUser, status: value })}
                    >
                      <SelectTrigger className="glass-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingUser(null);
                      setIsEditDialogOpen(false);
                    }}
                    className="glass-button bg-gradient-to-r from-gray-500/20 to-gray-600/20 text-glass-primary border-gray-400/50 hover:from-gray-500/30 hover:to-gray-600/30"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleUpdateUser(
                      editingUser.id,
                      editingUser.role,
                      editingUser.status
                    )}
                    className="glass-button bg-gradient-to-r from-arsd-red/100 text-white border-arsd-red/50 hover:from-arsd-red/80"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </PermissionGate>
  );
}
