import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardNotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="max-w-md w-full bg-card border border-border rounded-lg shadow-sm-tinted p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
          <FileQuestion className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
        </div>
        <div className="text-display-2 font-display text-foreground leading-none mb-1">
          404
        </div>
        <h2 className="text-h3 text-foreground mb-1">Page not found</h2>
        <p className="text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has moved.
        </p>
        <div className="mt-5">
          <Button asChild variant="default" size="sm">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
