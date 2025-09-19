"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/../supabase/client";
import { useRBAC } from '@/hooks/useRBAC';
import { PermissionGate } from '@/components/PermissionGate';
import { Permission } from '@/types/rbac';
import { 
  LayoutDashboard, 
  Globe, 
  Upload, 
  Users, 
  LogOut, 
  Sparkles,
  Menu,
  X,
  User
} from 'lucide-react';
import { useState } from 'react';

const navigationItems: Array<{
  name: string;
  href: string;
  icon: React.ReactNode;
  permission?: Permission;
}> = [
  { 
    name: "Dashboard", 
    href: "/dashboard", 
    icon: <LayoutDashboard className="h-5 w-5" />,
    permission: 'manage_system_settings' as const
  },
  { 
    name: "Website Details", 
    href: "/dashboard/website-details", 
    icon: <Globe className="h-5 w-5" />,
    permission: 'manage_website_details' as const
  },
  { 
    name: "Uploads", 
    href: "/dashboard/uploads", 
    icon: <Upload className="h-5 w-5" />,
    permission: 'manage_uploads' as const
  },
  { 
    name: "User Management", 
    href: "/dashboard/users", 
    icon: <Users className="h-5 w-5" />,
    permission: 'manage_users' as const
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useRBAC();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/sign-in");
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 glass-button p-3 text-glass-primary"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Sidebar */}
      <aside className={`w-64 glass-elevated flex flex-col min-h-screen shadow-2xl backdrop-blur-xl border-r border-white/20 transition-all duration-300 ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } fixed lg:relative z-40`}>
        {/* Header Section */}
        <div className="flex items-center gap-4 px-6 py-6 border-b border-white/20">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <img src="/images/arsd-logo.png" alt="Company Logo" className="w-8 h-8 object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-2xl text-glass-primary tracking-wide flex items-center gap-2 text-arsd-red">
              ARSD
            </span>
            <span className="text-xs text-glass-secondary">Admin Portal</span>
          </div>
        </div>
        
        {/* User Info */}
        {user && (
          <div className="px-6 py-4 border-b border-white/20">
            <div className="glass-subtle rounded-xl p-4 shadow-md">
              <div className="text-glass-primary text-sm">
                <div className="font-medium text-md text-arsd-red flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {user.full_name || user.name || 'User'}
                </div>
                <div className="text-xs text-glass-secondary capitalize bg-gray-100/50 py-1 rounded-lg inline-block mt-1">
                  {user.role}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-6">
          <ul className="space-y-2 px-4">
            {navigationItems.map((item) => (
              <li key={item.href}>
                {item.permission ? (
                  <PermissionGate permission={item.permission}>
                    <Link
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 text-base group ${
                        pathname === item.href
                          ? "glass-elevated text-glass-primary bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-white/30 shadow-lg"
                          : "text-glass-secondary hover:glass-subtle hover:text-glass-primary hover:scale-105"
                      }`}
                    >
                      <span className={`transition-colors duration-300 ${
                        pathname === item.href ? 'text-arsd-red' : 'text-glass-muted group-hover:text-glass-accent'
                      }`}>
                        {item.icon}
                      </span>
                      {item.name}
                    </Link>
                  </PermissionGate>
                ) : (
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 text-base group ${
                      pathname === item.href
                        ? "glass-elevated text-glass-primary bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-white/30 shadow-lg"
                        : "text-glass-secondary hover:glass-subtle hover:text-glass-primary hover:scale-105"
                    }`}
                  >
                    <span className={`transition-colors duration-300 ${
                      pathname === item.href ? 'text-arsd-red' : 'text-glass-muted group-hover:text-glass-accent'
                    }`}>
                      {item.icon}
                    </span>
                    {item.name}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
        
        {/* Log Out Button */}
        <div className="px-4 pb-6 mt-auto">
          <button
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium glass-button bg-gradient-to-r from-red-500/20 to-pink-500/20 text-glass-primary border-red-300/50 hover:from-red-500/30 hover:to-pink-500/30 hover:scale-105 transition-all duration-300"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}