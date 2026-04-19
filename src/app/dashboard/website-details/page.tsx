"use client";

import { WebsiteProjectsTab } from "@/components/website-projects/WebsiteProjectsTab";
import { FolderOpen } from "lucide-react";

export default function WebsiteDetails() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 pb-4 border-b border-border">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
            <FolderOpen className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
              Public site
            </div>
            <h1 className="text-h1 font-display text-foreground leading-none">
              Website Projects
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage and showcase your project portfolio.
            </p>
          </div>
        </div>
      </header>

      <div className="space-y-6">
        <WebsiteProjectsTab />
      </div>
    </div>
  );
}
