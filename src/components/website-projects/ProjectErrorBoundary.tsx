"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorFallbackProps {
  error?: Error;
  retry: () => void;
}

export function ProjectErrorFallback({ error, retry }: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Something went wrong
      </h3>
      <p className="text-gray-600 text-center mb-6 max-w-md">
        {error?.message || "An unexpected error occurred while loading projects."}
      </p>
      <Button onClick={retry} variant="outline">
        <RefreshCw className="h-4 w-4 mr-2" />
        Try Again
      </Button>
    </div>
  );
}
