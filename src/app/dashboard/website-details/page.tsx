"use client";

import { WebsiteProjectsTab } from "@/components/website-projects/WebsiteProjectsTab";
import { FolderOpen } from "lucide-react";
import Image from "next/image";

export default function WebsiteDetails() {
  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-gradient-to-br from-arsd-red/20 to-red-500/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-arsd-red/30 shadow-lg">
          <FolderOpen className="h-8 w-8 text-arsd-red" />
        </div>
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-arsd-red to-red-600 bg-clip-text text-transparent flex items-center gap-3">
            Website Projects
          </h1>
          <p className="text-glass-secondary text-lg font-medium mt-2">Manage and showcase your project portfolio</p>
        </div>
      </div>
      
      {/* Projects Section */}
      <div className="space-y-8">
        <WebsiteProjectsTab />
      </div>
    </div>
  );
}
