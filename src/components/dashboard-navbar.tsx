"use client";

import Link from "next/link";
import { createClient } from "../../supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { UserCircle, Home } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DashboardNavbar() {
  const supabase = createClient();
  const router = useRouter();

  return (
    <nav className="w-full bg-arsd-red shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 flex justify-between items-center py-3">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
              <Home className="text-arsd-red w-6 h-6" />
            </span>
            <span className="text-lg font-bold text-white tracking-wide">ARSD Dashboard</span>
          </Link>
        </div>
        <div className="flex gap-4 items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-arsd-red-dark">
                <UserCircle className="h-6 w-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.refresh();
                }}
                className="text-arsd-red hover:bg-arsd-red-light"
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
