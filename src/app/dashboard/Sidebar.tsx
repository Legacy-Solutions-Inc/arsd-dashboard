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
  Menu,
  X,
  Package,
} from 'lucide-react';
import { useState } from 'react';
import { ThemeSwitcher } from '@/components/theme-switcher';

type NavItem = {
  name: string;
  href: string;
  icon: React.ReactNode;
  permission?: Permission;
};

const navigationItems: NavItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-4 w-4" />,
    permission: 'manage_system_settings' as const,
  },
  {
    name: "Website Details",
    href: "/dashboard/website-details",
    icon: <Globe className="h-4 w-4" />,
    permission: 'manage_website_details' as const,
  },
  {
    name: "Reports Management",
    href: "/dashboard/uploads",
    icon: <Upload className="h-4 w-4" />,
    permission: 'manage_uploads' as const,
  },
  {
    name: "Warehouse Management",
    href: "/dashboard/warehouse",
    icon: <Package className="h-4 w-4" />,
  },
  {
    name: "User Management",
    href: "/dashboard/users",
    icon: <Users className="h-4 w-4" />,
    permission: 'manage_users' as const,
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

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname?.startsWith(href));

  const renderNavLink = (item: NavItem) => {
    const active = isActive(item.href);
    return (
      <Link
        href={item.href}
        onClick={() => setIsMobileMenuOpen(false)}
        aria-current={active ? "page" : undefined}
        className={`relative flex items-center gap-3 rounded-md pl-4 pr-3 py-2 text-sm font-medium transition-colors duration-150 ${
          active
            ? "bg-muted text-foreground"
            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
        }`}
      >
        {active && (
          <span
            aria-hidden
            className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full bg-primary"
          />
        )}
        <span className={active ? "text-primary" : "text-muted-foreground"}>
          {item.icon}
        </span>
        {item.name}
      </Link>
    );
  };

  const displayRole = (role?: string) => {
    if (!role) return '';
    if (role === 'project_inspector') return 'Project Manager';
    if (role === 'project_manager') return 'Site Engineer';
    return role.replace(/_/g, ' ');
  };

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="lg:hidden fixed top-3 left-3 z-50 inline-flex items-center justify-center rounded-md border border-border bg-card shadow-xs p-2 text-foreground mobile-touch-target"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
        aria-expanded={isMobileMenuOpen}
      >
        {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <aside
        className={`w-64 sm:w-72 bg-card border-r border-border flex flex-col min-h-screen transition-transform duration-200 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } fixed lg:sticky lg:top-0 z-40`}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
          <div className="w-9 h-9 rounded-md bg-background flex items-center justify-center border border-border">
            <img
              src="/images/arsd-logo.png"
              alt="ARSD"
              className="w-5 h-5 object-contain"
            />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-display text-lg font-bold tracking-wide text-foreground">
              ARSD
            </span>
            <span className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
              Admin Portal
            </span>
          </div>
        </div>

        {/* User */}
        {user && (
          <div className="px-4 py-3 border-b border-border">
            <div className="rounded-md bg-muted/50 border border-border px-3 py-2">
              <div className="text-sm font-medium text-foreground truncate">
                {user.full_name || user.name || 'User'}
              </div>
              <div className="mt-0.5 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                <span
                  aria-hidden
                  className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                />
                {displayRole(user.role)}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-3" aria-label="Primary">
          <ul className="space-y-1 px-3">
            {navigationItems.map((item) => (
              <li key={item.href}>
                {item.permission ? (
                  <PermissionGate permission={item.permission}>
                    {renderNavLink(item)}
                  </PermissionGate>
                ) : (
                  renderNavLink(item)
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer — theme + logout */}
        <div className="border-t border-border px-3 py-3 space-y-1">
          <div className="flex items-center justify-between px-2 py-1.5 text-xs text-muted-foreground">
            <span className="uppercase tracking-[0.08em]">Theme</span>
            <ThemeSwitcher />
          </div>
          <button
            className="w-full inline-flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150 mobile-touch-target"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-foreground/30 backdrop-blur-[1px] z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden
        />
      )}
    </>
  );
}
