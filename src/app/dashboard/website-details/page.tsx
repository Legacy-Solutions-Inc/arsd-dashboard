"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WebsiteProjectsTab } from "@/components/website-projects/WebsiteProjectsTab";
import { PermissionGate } from "@/components/PermissionGate";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card";
import { Globe, Building2, Sparkles, Settings, FolderOpen } from "lucide-react";

export default function WebsiteDetails() {
  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-glass-subtle rounded-xl flex items-center justify-center">
          <Globe className="h-10 w-10 text-arsd-red" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-glass-primary flex items-center gap-3 text-arsd-red">
            Website Details
          </h1>
          <p className="text-glass-secondary text-sm">Manage website content and project portfolio</p>
        </div>
      </div>
      
      <Tabs defaultValue="company" className="w-full">
        <TabsList className="glass-elevated grid w-full grid-cols-2 p-1">
          <TabsTrigger 
            value="company" 
            className="flex items-center gap-2 data-[state=active]:bg-arsd-red data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200"
          >
            <Settings className="h-4 w-4" />
            Company Details
          </TabsTrigger>
          <TabsTrigger 
            value="projects" 
            className="flex items-center gap-2 data-[state=active]:bg-arsd-red data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200"
          >
            <FolderOpen className="h-4 w-4" />
            Projects
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="company" className="space-y-8 mt-8">
          <PermissionGate 
            permission="manage_system_settings"
            fallback={
              <GlassCard variant="elevated" className="text-center">
                <GlassCardContent className="p-12">
                  <div className="w-16 h-16 bg-gradient-to-br from-arsd-red/20 to-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Settings className="h-8 w-8 text-arsd-red" />
                  </div>
                  <h3 className="text-2xl font-bold text-glass-primary mb-4">Access Denied</h3>
                  <p className="text-glass-secondary text-lg max-w-md mx-auto">
                    You don't have permission to access company details. Contact your administrator for access.
                  </p>
                </GlassCardContent>
              </GlassCard>
            }
          >
            <GlassCard variant="elevated">
              <GlassCardHeader className="bg-gradient-to-r from-arsd-red/5 to-red-500/5 border-b border-arsd-red/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-arsd-red/20 rounded-lg flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-arsd-red" />
                  </div>
                  <GlassCardTitle className="text-lg text-arsd-red">Company Details</GlassCardTitle>
                </div>
              </GlassCardHeader>
              <GlassCardContent className="p-6">
                <p className="text-glass-primary text-lg mb-6">
                  This is the Company Details section. Accessible only to HR employees to edit the company details. 
                  The Projects tab below is accessible to all authenticated users.
                </p>
              </GlassCardContent>
            </GlassCard>
          </PermissionGate>
        </TabsContent>
        
        <TabsContent value="projects" className="space-y-8 mt-8">
          <WebsiteProjectsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
