"use client";

import { Loader2, BarChart3, Building2, FileText, Users, Calendar, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface UniversalLoadingProps {
  /**
   * The type of content being loaded to show relevant icon and message
   */
  type?: 'dashboard' | 'project' | 'report' | 'user' | 'general' | 'data' | 'chart';
  /**
   * Custom message to display
   */
  message?: string;
  /**
   * Subtitle for additional context
   */
  subtitle?: string;
  /**
   * Size of the loading component
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Whether to show the full screen overlay
   */
  fullScreen?: boolean;
  /**
   * Custom className for styling
   */
  className?: string;
  /**
   * Whether to show progress dots animation
   */
  showProgress?: boolean;
  /**
   * Progress percentage (0-100)
   */
  progress?: number;
}

const loadingConfig = {
  dashboard: {
    icon: BarChart3,
    title: "Loading Dashboard",
    subtitle: "Preparing your project overview",
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200"
  },
  project: {
    icon: Building2,
    title: "Loading Project",
    subtitle: "Fetching project details and data",
    color: "from-arsd-red to-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200"
  },
  report: {
    icon: FileText,
    title: "Loading Reports",
    subtitle: "Processing accomplishment data",
    color: "from-green-500 to-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200"
  },
  user: {
    icon: Users,
    title: "Loading Users",
    subtitle: "Fetching user information",
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200"
  },
  data: {
    icon: DollarSign,
    title: "Loading Data",
    subtitle: "Processing financial information",
    color: "from-orange-500 to-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200"
  },
  chart: {
    icon: BarChart3,
    title: "Loading Charts",
    subtitle: "Rendering visualizations",
    color: "from-indigo-500 to-indigo-600",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200"
  },
  general: {
    icon: Loader2,
    title: "Loading",
    subtitle: "Please wait while we process your request",
    color: "from-gray-500 to-gray-600",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200"
  }
};

const sizeConfig = {
  sm: {
    container: "p-4",
    icon: "h-6 w-6",
    spinner: "h-4 w-4",
    title: "text-lg",
    subtitle: "text-sm",
    card: "max-w-sm"
  },
  md: {
    container: "p-6",
    icon: "h-8 w-8",
    spinner: "h-6 w-6",
    title: "text-xl",
    subtitle: "text-base",
    card: "max-w-md"
  },
  lg: {
    container: "p-8",
    icon: "h-12 w-12",
    spinner: "h-8 w-8",
    title: "text-2xl",
    subtitle: "text-lg",
    card: "max-w-lg"
  }
};

export function UniversalLoading({
  type = 'general',
  message,
  subtitle,
  size = 'md',
  fullScreen = false,
  className,
  showProgress = false,
  progress = 0
}: UniversalLoadingProps) {
  const config = loadingConfig[type];
  const sizeStyles = sizeConfig[size];

  const LoadingContent = () => (
    <div
      className={cn(
        "relative",
        fullScreen
          ? "min-h-[60vh] flex items-center justify-center bg-background"
          : "",
        className,
      )}
    >
      <div
        className={cn(
          "relative bg-card border border-border rounded-lg shadow-sm-tinted",
          sizeStyles.card,
          fullScreen ? "mx-4" : "",
        )}
      >
        <div className={cn("text-center", sizeStyles.container)}>
          <div className="flex items-center justify-center mb-3">
            <div
              className={cn(
                "relative flex items-center justify-center rounded-full bg-background border border-border",
                size === 'sm' ? 'w-10 h-10' : size === 'md' ? 'w-12 h-12' : 'w-14 h-14',
              )}
            >
              <Image
                src="/images/arsd-logo.png"
                alt="ARSD"
                width={size === 'sm' ? 20 : size === 'md' ? 24 : 28}
                height={size === 'sm' ? 20 : size === 'md' ? 24 : 28}
                className="object-contain"
              />
            </div>
          </div>

          <div className="space-y-1 mb-3">
            <h3
              className={cn(
                "font-semibold text-foreground font-display",
                sizeStyles.title,
              )}
            >
              {message || config.title}
            </h3>
            <p className={cn("text-muted-foreground", sizeStyles.subtitle)}>
              {subtitle || config.subtitle}
            </p>
          </div>

          {showProgress && (
            <div className="mb-3">
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1 nums">
                {progress.toFixed(0)}% complete
              </p>
            </div>
          )}

          <div className="flex items-center justify-center space-x-1" aria-hidden>
            <div className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  );

  return <LoadingContent />;
}

// Convenience components for common use cases
export function DashboardLoading({ message, subtitle, size = 'md', fullScreen = true }: Omit<UniversalLoadingProps, 'type'>) {
  return (
    <UniversalLoading
      type="dashboard"
      message={message}
      subtitle={subtitle}
      size={size}
      fullScreen={fullScreen}
    />
  );
}

export function ProjectLoading({ message, subtitle, size = 'md', fullScreen = true }: Omit<UniversalLoadingProps, 'type'>) {
  return (
    <UniversalLoading
      type="project"
      message={message}
      subtitle={subtitle}
      size={size}
      fullScreen={fullScreen}
    />
  );
}

export function ReportLoading({ message, subtitle, size = 'md', fullScreen = true }: Omit<UniversalLoadingProps, 'type'>) {
  return (
    <UniversalLoading
      type="report"
      message={message}
      subtitle={subtitle}
      size={size}
      fullScreen={fullScreen}
    />
  );
}

export function DataLoading({ message, subtitle, size = 'md', fullScreen = true, showProgress = false, progress = 0 }: Omit<UniversalLoadingProps, 'type'>) {
  return (
    <UniversalLoading
      type="data"
      message={message}
      subtitle={subtitle}
      size={size}
      fullScreen={fullScreen}
      showProgress={showProgress}
      progress={progress}
    />
  );
}

// Inline loading component for smaller spaces
export function InlineLoading({ message = "Loading…", size = 'sm' }: { message?: string; size?: 'sm' | 'md' }) {
  return (
    <div className="flex items-center justify-center space-x-2 py-3" role="status" aria-live="polite">
      <Loader2
        className={cn(
          "animate-spin text-primary",
          size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4',
        )}
        strokeWidth={1.75}
        aria-hidden
      />
      
      <span className={cn(
        "text-gray-600 font-medium",
        size === 'sm' ? 'text-sm' : 'text-base'
      )}>
        {message}
      </span>
    </div>
  );
}

// Skeleton loading for content placeholders
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse bg-card border border-border rounded-lg p-4 space-y-3",
        className,
      )}
    >
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-muted rounded-md" />
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-3 bg-muted rounded w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-muted rounded" />
        <div className="h-3 bg-muted rounded w-5/6" />
      </div>
      <div className="h-1 bg-muted rounded-full" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="animate-pulse space-y-3">
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-4 bg-muted rounded" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className="h-3 bg-muted rounded" />
          ))}
        </div>
      ))}
    </div>
  );
}
