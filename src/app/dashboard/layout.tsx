"use client";

import { useRBAC } from '@/hooks/useRBAC';
import Sidebar from "./Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, error } = useRBAC();

  // Show loading state while checking user permissions
  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50 items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex min-h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600">Error loading user data: {error}</p>
        </div>
      </div>
    );
  }

  // Redirect to pending approval if user doesn't have access
  if (!user || user.status !== 'active' || user.role === 'pending') {
    return (
      <div className="flex min-h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">Your account is pending approval or inactive.</p>
          <p className="text-sm text-gray-500 mt-2">
            User: {user ? `${user.email} (${user.role}/${user.status})` : 'No user data'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  );
}
