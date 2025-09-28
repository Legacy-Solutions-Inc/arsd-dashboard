"use client";

import { 
  UniversalLoading, 
  DashboardLoading, 
  ProjectLoading, 
  ReportLoading, 
  DataLoading, 
  InlineLoading, 
  SkeletonCard, 
  SkeletonTable 
} from "@/components/ui/universal-loading";
import { useState } from "react";

export function LoadingExamples() {
  const [progress, setProgress] = useState(0);

  // Simulate progress
  const simulateProgress = () => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  return (
    <div className="space-y-8 p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Universal Loading Components</h1>
      
      {/* Full Screen Loading Examples */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-800">Full Screen Loading States</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Dashboard Loading</h3>
            <DashboardLoading size="sm" fullScreen={false} />
          </div>
          
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Project Loading</h3>
            <ProjectLoading size="sm" fullScreen={false} />
          </div>
          
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Report Loading</h3>
            <ReportLoading size="sm" fullScreen={false} />
          </div>
        </div>
      </div>

      {/* Progress Loading */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-800">Progress Loading</h2>
        
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-4">Data Loading with Progress</h3>
          <div className="space-y-4">
            <DataLoading 
              size="md" 
              fullScreen={false} 
              showProgress={true} 
              progress={progress}
              message="Processing Financial Data"
              subtitle="Analyzing project costs and budgets"
            />
            <button 
              onClick={simulateProgress}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Simulate Progress
            </button>
          </div>
        </div>
      </div>

      {/* Inline Loading */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-800">Inline Loading States</h2>
        
        <div className="space-y-4">
          <InlineLoading message="Loading projects..." size="sm" />
          <InlineLoading message="Processing data..." size="md" />
        </div>
      </div>

      {/* Skeleton Loading */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-800">Skeleton Loading</h2>
        
        <div className="space-y-4">
          <h3 className="font-semibold">Card Skeleton</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
          
          <h3 className="font-semibold">Table Skeleton</h3>
          <SkeletonTable rows={4} columns={5} />
        </div>
      </div>

      {/* Custom Loading */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-800">Custom Loading States</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Project Loading</h3>
            <UniversalLoading
              type="project"
              message="Loading Project"
              subtitle="With ARSD branding"
              size="md"
              fullScreen={false}
            />
          </div>
          
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Data Loading</h3>
            <UniversalLoading
              type="data"
              message="Quick Load"
              subtitle="Processing data"
              size="md"
              fullScreen={false}
            />
          </div>
        </div>
      </div>

      {/* Inline Loading */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-800">Inline Loading</h2>
        
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Small Size</h3>
            <InlineLoading message="Loading projects..." size="sm" />
          </div>
          
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Medium Size</h3>
            <InlineLoading message="Processing data..." size="md" />
          </div>
        </div>
      </div>
    </div>
  );
}
