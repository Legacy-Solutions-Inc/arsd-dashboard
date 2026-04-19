"use client";

import { useRBAC } from '@/hooks/useRBAC';
import Sidebar from "./Sidebar";
import { SkipLink } from "@/components/ui/skip-link";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, error } = useRBAC();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="bg-card border border-border shadow-sm-tinted rounded-lg px-6 py-5 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-muted border-t-primary mx-auto mb-3" />
          <div className="text-sm text-muted-foreground">Loading</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="bg-card border border-border shadow-sm-tinted rounded-lg px-6 py-6 text-center max-w-md w-full">
          <h1 className="text-h2 text-foreground mb-2">Couldn't load account</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!user || user.status !== 'active' || user.role === 'pending') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="bg-card border border-border shadow-sm-tinted rounded-lg px-6 py-6 text-center max-w-md w-full">
          <h1 className="text-h2 text-foreground mb-2">Access pending</h1>
          <p className="text-sm text-muted-foreground">
            Your account is pending approval or currently inactive.
          </p>
          {user && (
            <p className="text-xs text-muted-foreground/80 mt-3">
              {user.email} · {user.role} · {user.status}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SkipLink />
      <div className="flex min-h-screen">
        <Sidebar />
        <main
          id="main"
          className="flex-1 relative overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
        >
          <div className="max-w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
