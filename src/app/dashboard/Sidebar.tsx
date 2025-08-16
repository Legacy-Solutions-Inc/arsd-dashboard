"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React from "react";
import { createClient } from "@/../supabase/client";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 13h4v8H3v-8zm7-6h4v14h-4V7zm7 9h4v5h-4v-5z"/></svg> },
  { name: "Website Details", href: "/dashboard/website-details", icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20"/></svg> },
  { name: "Uploads", href: "/dashboard/uploads", icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 19V6m0 0l-7 7m7-7l7 7"/></svg> },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/sign-in");
  };
  return (
    <aside className="w-64 bg-arsd-red flex flex-col min-h-screen shadow-xl">
      {/* Header Section */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-[#1746A2]/30">
        <div className="bg-yellow-400 rounded-full p-3 flex items-center justify-center">
          <svg width="28" height="28" fill="none" stroke="#1746A2" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-3xl text-yellow-400 tracking-wide">ARSD</span>
          <span className="text-xs text-white/80">Admin Portal</span>
        </div>
        <button className="ml-auto text-white/80 hover:text-yellow-400">
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
      </div>
      {/* Navigation */}
      <nav className="flex-1 py-8">
        <ul className="space-y-2 px-4">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all duration-150 text-base border-l-4 shadow-sm ${
                  pathname === item.href
                    ? "bg-[#233D8F] text-yellow-400 border-yellow-400"
                    : "text-white/90 border-transparent hover:bg-[#233D8F] hover:text-yellow-400"
                }`}
              >
                <span>{item.icon}</span>
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {/* Log Out Button */}
      <div className="px-4 pb-6 mt-auto">
        <button
          className="w-full flex items-center gap-2 px-4 py-3 rounded-lg font-semibold bg-[#233D8F] text-white/90 hover:bg-yellow-400 hover:text-[#233D8F] transition-all duration-150 shadow border-none"
          onClick={handleLogout}
        >
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
          Log Out
        </button>
      </div>
    </aside>
  );
}
