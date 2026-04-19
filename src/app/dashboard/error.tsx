"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard route error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="max-w-md w-full bg-card border border-border rounded-lg shadow-sm-tinted p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="h-5 w-5 text-destructive" strokeWidth={1.75} />
        </div>
        <h2 className="text-h3 text-foreground mb-1">Something went wrong</h2>
        <p className="text-sm text-muted-foreground">
          We couldn't load this page. The error has been logged.
        </p>
        {error.digest && (
          <p className="mt-2 text-[11px] text-muted-foreground/80 font-mono nums">
            Ref: {error.digest}
          </p>
        )}
        <div className="mt-5 flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => reset()}>
            Try again
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => {
              window.location.href = "/dashboard";
            }}
          >
            Back to dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
