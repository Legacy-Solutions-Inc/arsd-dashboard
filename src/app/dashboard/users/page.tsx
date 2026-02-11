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
import { Checkbox } from '@/components/ui/checkbox';
import { UserWithRole, UserRole, UserStatus } from '@/types/rbac';
import { rbacClient } from '@/services/role-based/rbac';
import { Plus, Edit, Save, X, Users, ChevronLeft, ChevronRight, Sparkles, User as UserIcon, Mail, Calendar, Shield, UserCheck, UserPlus, Clock, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { UniversalLoading, InlineLoading } from '@/components/ui/universal-loading';

export default function UserManagementPage() {
  const { user: currentUser, refreshUser } = useRBAC();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [approvingUser, setApprovingUser] = useState<UserWithRole | null>(null);
  const [approvalRole, setApprovalRole] = useState<UserRole>('project_inspector');
  const [approvalStatus, setApprovalStatus] = useState<UserStatus>('active');
  const [currentPage, setCurrentPage] = useState(1);
  const [newUsersPage, setNewUsersPage] = useState(1);
  const [itemsPerPage] = useState(8);
  const [selectedNewUsers, setSelectedNewUsers] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isBulkApproving, setIsBulkApproving] = useState(false);
  const [isBulkRejecting, setIsBulkRejecting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
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
      setIsUpdating(true);
      await rbacClient.updateUserRole(userId, role, status);
      await fetchUsers();
      setEditingUser(null);
      setIsEditDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkApproveUsers = async (userIds: string[], role: UserRole) => {
    try {
      setIsBulkApproving(true);
      const promises = userIds.map(userId => 
        rbacClient.updateUserRole(userId, role, 'active')
      );
      await Promise.all(promises);
      await fetchUsers();
      setSelectedNewUsers([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve users');
    } finally {
      setIsBulkApproving(false);
    }
  };

  const handleBulkRejectUsers = async (userIds: string[]) => {
    try {
      setIsBulkRejecting(true);
      const promises = userIds.map(userId => 
        rbacClient.updateUserRole(userId, 'pending', 'inactive')
      );
      await Promise.all(promises);
      await fetchUsers();
      setSelectedNewUsers([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject users');
    } finally {
      setIsBulkRejecting(false);
    }
  };

  const handleSelectNewUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedNewUsers(prev => [...prev, userId]);
    } else {
      setSelectedNewUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleSelectAllNewUsers = (checked: boolean) => {
    if (checked) {
      setSelectedNewUsers(paginatedNewUsers.map(user => user.id));
    } else {
      setSelectedNewUsers([]);
    }
  };

  const handleApproveUser = (user: UserWithRole) => {
    setApprovingUser(user);
    setApprovalRole('project_inspector'); // Default role
    setApprovalStatus('active'); // Default status
    setIsApproveDialogOpen(true);
  };

  const handleConfirmApproval = async (userId: string, role: UserRole, status: UserStatus) => {
    try {
      setIsApproving(true);
      await rbacClient.updateUserRole(userId, role, status);
      await fetchUsers();
      setApprovingUser(null);
      setIsApproveDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve user');
    } finally {
      setIsApproving(false);
    }
  };

  // Separate new users (pending role/status) from existing users
  const newUsers = users.filter(user => user.role === 'pending' && user.status === 'pending');
  const existingUsers = users.filter(user => !(user.role === 'pending' && user.status === 'pending'));

  // Sort existing users with superadmins first
  const sortedExistingUsers = [...existingUsers].sort((a, b) => {
    // Superadmins always come first
    if (a.role === 'superadmin' && b.role !== 'superadmin') return -1;
    if (b.role === 'superadmin' && a.role !== 'superadmin') return 1;
    
    // For non-superadmins, sort by name alphabetically
    const nameA = (a.full_name || a.name || '').toLowerCase();
    const nameB = (b.full_name || b.name || '').toLowerCase();
    return nameA.localeCompare(nameB);
  });

  // Sort new users by creation date (newest first)
  const sortedNewUsers = [...newUsers].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Calculate pagination for existing users
  const totalPages = Math.ceil(sortedExistingUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedExistingUsers = sortedExistingUsers.slice(startIndex, endIndex);

  // Calculate pagination for new users
  const totalNewUsersPages = Math.ceil(sortedNewUsers.length / itemsPerPage);
  const newUsersStartIndex = (newUsersPage - 1) * itemsPerPage;
  const newUsersEndIndex = newUsersStartIndex + itemsPerPage;
  const paginatedNewUsers = sortedNewUsers.slice(newUsersStartIndex, newUsersEndIndex);
  
  // Reset to first page when users change
  useMemo(() => {
    setCurrentPage(1);
    setNewUsersPage(1);
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

  // New users pagination functions
  const goToNewUsersPage = (page: number) => {
    setNewUsersPage(Math.max(1, Math.min(page, totalNewUsersPages)));
  };
  
  const goToPreviousNewUsersPage = () => {
    setNewUsersPage(prev => Math.max(1, prev - 1));
  };
  
  const goToNextNewUsersPage = () => {
    setNewUsersPage(prev => Math.min(totalNewUsersPages, prev + 1));
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'superadmin': return 'bg-red-100/50 text-red-800 border-red-200/50';
      case 'hr': return 'bg-blue-100/50 text-blue-800 border-blue-200/50';
      case 'project_manager': return 'bg-yellow-100/50 text-yellow-800 border-yellow-200/50'; // Site Manager color
      case 'project_inspector': return 'bg-green-100/50 text-green-800 border-green-200/50'; // Project Manager color
      case 'warehouseman': return 'bg-amber-100/50 text-amber-800 border-amber-200/50';
      case 'purchasing': return 'bg-purple-100/50 text-purple-800 border-purple-200/50';
      case 'material_control': return 'bg-indigo-100/50 text-indigo-800 border-indigo-200/50';
      case 'pending': return 'bg-gray-100/50 text-gray-800 border-gray-200/50';
      default: return 'bg-gray-100/50 text-gray-800 border-gray-200/50';
    }
  };

  const getDisplayRoleName = (role: UserRole) => {
    switch (role) {
      case 'project_inspector': return 'PROJECT MANAGER';
      case 'project_manager': return 'SITE ENGINEER';
      case 'purchasing': return 'PURCHASING';
      case 'material_control': return 'MATERIAL CONTROL';
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
        <div className="flex justify-center">
          <UniversalLoading
            type="user"
            message="Loading Users"
            subtitle="Fetching user information from database..."
            size="lg"
            fullScreen={false}
            className="max-w-md"
          />
        </div>
      </div>
    );
  }

  return (
    <PermissionGate permission="manage_users">
      <div className="space-y-8">
        {/* Loading Overlays for Operations */}
        {(isUpdating || isBulkApproving || isBulkRejecting || isApproving) && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-8 max-w-md mx-4">
              <UniversalLoading
                type={isUpdating ? "user" : isBulkApproving || isApproving ? "user" : "general"}
                message={
                  isUpdating ? "Updating User" : 
                  isBulkApproving ? "Approving Users" : 
                  isBulkRejecting ? "Rejecting Users" : 
                  "Approving User"
                }
                subtitle={
                  isUpdating ? "Updating user role and status..." : 
                  isBulkApproving ? "Processing bulk user approvals..." : 
                  isBulkRejecting ? "Processing bulk user rejections..." : 
                  "Setting user role and status..."
                }
                size="md"
                showProgress={false}
              />
            </div>
          </div>
        )}

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
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Force refresh of users list
              fetchUsers();
            }}
            className="glass-button bg-gradient-to-r from-arsd-red/20 to-red-500/20 text-arsd-red border-arsd-red/30 hover:from-arsd-red/30 hover:to-red-500/30"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <GlassCard variant="elevated" className="border-red-200/50 bg-red-50/10">
            <GlassCardContent className="p-6">
              <p className="text-red-800 font-medium">{error}</p>
            </GlassCardContent>
          </GlassCard>
        )}

        {/* New Users Table - Only show if there are new users */}
        {newUsers.length > 0 && (
          <GlassCard variant="elevated" className="overflow-hidden mb-8">
            <GlassCardHeader className="bg-transparent border-amber-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <UserPlus className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <GlassCardTitle className="text-2xl font-bold text-amber-600 flex items-center gap-2">
                      New Users Awaiting Approval
                      <Badge variant="glass" className="bg-amber-100/50 text-amber-800 border-amber-200/50">
                        {newUsers.length}
                      </Badge>
                    </GlassCardTitle>
                    <p className="text-glass-secondary text-sm mt-1">Review and approve new user registrations</p>
                  </div>
                </div>
                
                {/* Bulk Actions */}
                {selectedNewUsers.length > 0 && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-glass-secondary">
                      {selectedNewUsers.length} selected
                    </span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleBulkApproveUsers(selectedNewUsers, 'project_inspector')}
                        disabled={isBulkApproving || isBulkRejecting}
                        className="glass-button bg-gradient-to-r from-green-500/30 to-green-600/30 text-white border-green-500/50 hover:from-green-500/40 hover:to-green-600/40"
                      >
                        {isBulkApproving ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                        )}
                        {isBulkApproving ? 'Approving...' : 'Approve as Project Manager'}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleBulkApproveUsers(selectedNewUsers, 'project_manager')}
                        disabled={isBulkApproving || isBulkRejecting}
                        className="glass-button bg-gradient-to-r from-blue-500/30 to-blue-600/30 text-white border-blue-500/50 hover:from-blue-500/40 hover:to-blue-600/40"
                      >
                        {isBulkApproving ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                        )}
                        {isBulkApproving ? 'Approving...' : 'Approve as Site Engineer'}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleBulkApproveUsers(selectedNewUsers, 'warehouseman')}
                        disabled={isBulkApproving || isBulkRejecting}
                        className="glass-button bg-gradient-to-r from-amber-500/30 to-amber-600/30 text-white border-amber-500/50 hover:from-amber-500/40 hover:to-amber-600/40"
                      >
                        {isBulkApproving ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                        )}
                        {isBulkApproving ? 'Approving...' : 'Approve as Warehouseman'}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleBulkApproveUsers(selectedNewUsers, 'purchasing')}
                        disabled={isBulkApproving || isBulkRejecting}
                        className="glass-button bg-gradient-to-r from-purple-500/30 to-purple-600/30 text-white border-purple-500/50 hover:from-purple-500/40 hover:to-purple-600/40"
                      >
                        {isBulkApproving ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                        )}
                        {isBulkApproving ? 'Approving...' : 'Approve as Purchasing'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBulkRejectUsers(selectedNewUsers)}
                        disabled={isBulkApproving || isBulkRejecting}
                        className="glass-button bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-600 border-red-500/30 hover:from-red-500/30 hover:to-red-600/30"
                      >
                        {isBulkRejecting ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-1" />
                        ) : (
                          <XCircle className="h-4 w-4 mr-1" />
                        )}
                        {isBulkRejecting ? 'Rejecting...' : 'Reject'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </GlassCardHeader>
          
            <GlassCardContent className="p-0">
              <div className="overflow-x-auto scrollbar-glass">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-amber-500/5 to-amber-600/5 border-b border-amber-500/10">
                      <TableHead className="px-6 py-4 font-semibold text-amber-600 text-sm uppercase tracking-wider w-12">
                        <Checkbox
                          checked={selectedNewUsers.length === paginatedNewUsers.length && paginatedNewUsers.length > 0}
                          onCheckedChange={handleSelectAllNewUsers}
                          className="border-amber-500/50"
                        />
                      </TableHead>
                      <TableHead className="px-6 py-4 font-semibold text-amber-600 text-sm uppercase tracking-wider">
                        Name
                      </TableHead>
                      <TableHead className="px-6 py-4 font-semibold text-amber-600 text-sm uppercase tracking-wider">
                        Email
                      </TableHead>
                      <TableHead className="px-6 py-4 font-semibold text-amber-600 text-sm uppercase tracking-wider">
                        Registered
                      </TableHead>
                      <TableHead className="px-6 py-4 font-semibold text-amber-600 text-sm uppercase tracking-wider">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedNewUsers.map((user, index) => (
                      <TableRow 
                        key={user.id} 
                        className={`border-b border-white/10 hover:bg-gradient-to-r hover:from-amber-500/5 hover:to-amber-600/5 transition-colors duration-200 ${
                          index % 2 === 0 ? 'bg-white/2' : 'bg-white/5'
                        } ${selectedNewUsers.includes(user.id) ? 'bg-amber-500/10' : ''}`}
                      >
                        <TableCell className="px-6 py-4">
                          <Checkbox
                            checked={selectedNewUsers.includes(user.id)}
                            onCheckedChange={(checked) => handleSelectNewUser(user.id, checked as boolean)}
                            className="border-amber-500/50"
                          />
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-amber-500/20 to-amber-600/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-amber-500/30">
                              <UserIcon className="h-5 w-5 text-amber-600" />
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
                              <Mail className="h-4 w-4 text-amber-600" />
                            </div>
                            <span className="text-glass-primary font-medium">{user.email}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-transparent rounded-lg flex items-center justify-center">
                              <Clock className="h-4 w-4 text-amber-600" />
                            </div>
                            <span className="text-glass-secondary font-medium">
                              {new Date(user.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApproveUser(user)}
                              disabled={isApproving || isBulkApproving || isBulkRejecting}
                              className="glass-button bg-gradient-to-r from-green-500/30 to-green-600/30 text-white border-green-500/50 hover:from-green-500/40 hover:to-green-600/40"
                            >
                              {isApproving || isBulkApproving ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                              )}
                              {isApproving || isBulkApproving ? 'Approving...' : 'Approve'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleBulkRejectUsers([user.id])}
                              disabled={isApproving || isBulkApproving || isBulkRejecting}
                              className="glass-button bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-600 border-red-500/30 hover:from-red-500/30 hover:to-red-600/30"
                            >
                              {isBulkRejecting ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-1" />
                              ) : (
                                <XCircle className="h-4 w-4 mr-1" />
                              )}
                              {isBulkRejecting ? 'Rejecting...' : 'Reject'}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </GlassCardContent>
          
          {/* New Users Pagination */}
          {totalNewUsersPages > 1 && (
            <div className="bg-gradient-to-r from-amber-500/5 to-amber-600/5 border-t border-amber-500/10 p-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-glass-secondary font-medium">
                  Showing {newUsersStartIndex + 1} to {Math.min(newUsersEndIndex, sortedNewUsers.length)} of {sortedNewUsers.length} new users
                </div>
                
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousNewUsersPage}
                    disabled={newUsersPage === 1}
                    className="glass-button bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-600 border-amber-500/30 hover:from-amber-500/30 hover:to-amber-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-2">
                    {Array.from({ length: totalNewUsersPages }, (_, i) => i + 1).map((page) => {
                      const shouldShow = 
                        page === 1 || 
                        page === totalNewUsersPages || 
                        (page >= newUsersPage - 1 && page <= newUsersPage + 1);
                      
                      if (!shouldShow) {
                        if (page === 2 && newUsersPage > 4) {
                          return <span key={`ellipsis-${page}`} className="px-3 text-glass-muted font-medium">...</span>;
                        }
                        if (page === totalNewUsersPages - 1 && newUsersPage < totalNewUsersPages - 3) {
                          return <span key={`ellipsis-${page}`} className="px-3 text-glass-muted font-medium">...</span>;
                        }
                        return null;
                      }
                      
                      return (
                        <Button
                          key={page}
                          variant={newUsersPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => goToNewUsersPage(page)}
                          className={`w-10 h-10 p-0 font-semibold ${
                            newUsersPage === page 
                              ? 'bg-amber-600 text-white border-amber-600 shadow-lg' 
                              : 'glass-button bg-gradient-to-r from-amber-500/10 to-amber-600/10 text-amber-600 border-amber-500/20 hover:from-amber-500/20 hover:to-amber-600/20 transition-colors duration-200'
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
                    onClick={goToNextNewUsersPage}
                    disabled={newUsersPage === totalNewUsersPages}
                    className="glass-button bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-600 border-amber-500/30 hover:from-amber-500/30 hover:to-amber-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </GlassCard>
        )}

        {/* Existing Users Table */}
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
                  {paginatedExistingUsers.map((user, index) => (
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
                          disabled={isUpdating}
                          className="glass-button bg-gradient-to-r from-arsd-red/30 to-red-500/30 text-white border-arsd-red/50 hover:from-arsd-red/40 hover:to-red-500/40 shadow-lg transition-colors duration-200"
                        >
                          {isUpdating ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                          ) : (
                            <Edit className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </GlassCardContent>
          
          {/* Existing Users Pagination */}
          {totalPages > 1 && (
            <div className="bg-gradient-to-r from-arsd-red/5 to-red-500/5 border-t border-arsd-red/10 p-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-glass-secondary font-medium">
                  Showing {startIndex + 1} to {Math.min(endIndex, sortedExistingUsers.length)} of {sortedExistingUsers.length} users
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
                        <SelectItem value="warehouseman">Warehouseman</SelectItem>
                        <SelectItem value="purchasing">Purchasing</SelectItem>
                        <SelectItem value="material_control">Material Control</SelectItem>
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
                    disabled={isUpdating}
                    className="glass-button bg-gradient-to-r from-arsd-red/100 text-white border-arsd-red/50 hover:from-arsd-red/80"
                  >
                    {isUpdating ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {isUpdating ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Approve User Modal */}
        <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
          <DialogContent className="glass-elevated max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-green-600 flex items-center gap-2 text-xl">
                <CheckCircle2 className="h-5 w-5" />
                Approve User: {approvingUser?.full_name || approvingUser?.name}
              </DialogTitle>
              <DialogDescription className="text-glass-secondary">
                Select the role and status for this new user account.
              </DialogDescription>
            </DialogHeader>
            
            {approvingUser && (
              <div className="space-y-6 py-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="approve-role" className="text-glass-primary font-medium">Role</Label>
                    <Select 
                      value={approvalRole} 
                      onValueChange={(value: UserRole) => setApprovalRole(value)}
                    >
                      <SelectTrigger className="glass-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hr">HR</SelectItem>
                        <SelectItem value="project_manager">Site Engineer</SelectItem>
                        <SelectItem value="project_inspector">Project Manager</SelectItem>
                        <SelectItem value="warehouseman">Warehouseman</SelectItem>
                        <SelectItem value="purchasing">Purchasing</SelectItem>
                        <SelectItem value="material_control">Material Control</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="approve-status" className="text-glass-primary font-medium">Status</Label>
                    <Select 
                      value={approvalStatus} 
                      onValueChange={(value: UserStatus) => setApprovalStatus(value)}
                    >
                      <SelectTrigger className="glass-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setApprovingUser(null);
                      setIsApproveDialogOpen(false);
                    }}
                    className="glass-button bg-gradient-to-r from-gray-500/20 to-gray-600/20 text-glass-primary border-gray-400/50 hover:from-gray-500/30 hover:to-gray-600/30"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleConfirmApproval(approvingUser.id, approvalRole, approvalStatus)}
                    disabled={isApproving}
                    className="glass-button bg-gradient-to-r from-green-500/100 text-white border-green-500/50 hover:from-green-600/100"
                  >
                    {isApproving ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                    )}
                    {isApproving ? 'Approving...' : 'Approve User'}
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
