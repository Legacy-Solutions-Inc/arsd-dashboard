"use client";

import { useRBAC } from '@/hooks/useRBAC';
import Sidebar from "./Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, error } = useRBAC();

  // Show loading state while checking user permissions
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center">
        <div className="glass-card text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/60 mx-auto mb-4"></div>
          <div className="text-white/80">Loading...</div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center">
        <div className="glass-card text-center max-w-md">
          <h1 className="text-2xl font-bold text-white/90 mb-2">Error</h1>
          <p className="text-white/70">Error loading user data: {error}</p>
        </div>
      </div>
    );
  }

  // Redirect to pending approval if user doesn't have access
  if (!user || user.status !== 'active' || user.role === 'pending') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center">
        <div className="glass-card text-center max-w-md">
          <h1 className="text-2xl font-bold text-white/90 mb-2">Access Denied</h1>
          <p className="text-white/70">Your account is pending approval or inactive.</p>
          <p className="text-sm text-white/60 mt-2">
            User: {user ? `${user.email} (${user.role}/${user.status})` : 'No user data'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl animate-float-delayed"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-cyan-400/10 to-blue-400/10 rounded-full blur-3xl animate-float-slow"></div>
        <div className="absolute top-20 right-20 w-32 h-32 bg-gradient-to-br from-pink-300/30 to-purple-300/30 rounded-full blur-2xl animate-float"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-gradient-to-br from-cyan-300/30 to-blue-300/30 rounded-full blur-2xl animate-float-delayed"></div>
      </div>
      
      <div className="relative flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-6 relative z-10">
          {children}
        </main>
      </div>
    </div>
  );
}