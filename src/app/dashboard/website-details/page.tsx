"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WebsiteProjectsTab } from "@/components/website-projects/WebsiteProjectsTab";
import { PermissionGate } from "@/components/PermissionGate";

export default function WebsiteDetails() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold mb-4">Website Details</h1>
      
      <Tabs defaultValue="company" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="company">Company Details</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
        </TabsList>
        
        <TabsContent value="company" className="space-y-6">
          <PermissionGate 
            permission="manage_system_settings"
            fallback={
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <p className="text-gray-700">You don't have permission to access company details. Contact your administrator for access.</p>
              </div>
            }
          >
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <p className="text-gray-700">This is the Company Details section. Accessible only to HR employees to edit the company details. The Projects tab below is accessible to all authenticated users.</p>
              <div className="mt-4">
                <a 
                  href="/dashboard/company" 
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Go to Company Details
                </a>
              </div>
            </div>
          </PermissionGate>
        </TabsContent>
        
        <TabsContent value="projects" className="space-y-6">
          <WebsiteProjectsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
