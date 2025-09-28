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
    <div className={cn(
      "relative",
      fullScreen ? "min-h-screen flex items-center justify-center" : "",
      className
    )}>
      {/* Background gradient for full screen */}
      {fullScreen && (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20" />
      )}
      
      <div className={cn(
        "relative bg-white/90 backdrop-blur-sm rounded-2xl border shadow-xl",
        sizeStyles.card,
        config.borderColor,
        fullScreen ? "mx-4" : ""
      )}>
        <div className={cn(
          "text-center",
          sizeStyles.container
        )}>
          {/* ARSD Logo */}
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <div className={cn(
                "relative flex items-center justify-center rounded-full shadow-lg border-2 border-white/20",
                size === 'sm' ? 'w-12 h-12' : size === 'md' ? 'w-16 h-16' : 'w-20 h-20'
              )}>
                <Image
                  src="/images/arsd-logo.png"
                  alt="ARSD Construction Corporation"
                  width={size === 'sm' ? 24 : size === 'md' ? 32 : 40}
                  height={size === 'sm' ? 24 : size === 'md' ? 32 : 40}
                  className="rounded-full object-contain"
                />
              </div>
            </div>
          </div>

          {/* Title and Message */}
          <div className="space-y-2 mb-4">
            <h3 className={cn(
              "font-bold text-gray-900",
              sizeStyles.title
            )}>
              {message || config.title}
            </h3>
            <p className={cn(
              "text-gray-600",
              sizeStyles.subtitle
            )}>
              {subtitle || config.subtitle}
            </p>
          </div>

          {/* Progress Bar */}
          {showProgress && (
            <div className="mb-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={cn(
                    "h-2 rounded-full transition-all duration-500 ease-out",
                    `bg-gradient-to-r ${config.color}`
                  )}
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {progress.toFixed(0)}% complete
              </p>
            </div>
          )}

          {/* Animated Dots */}
          <div className="flex items-center justify-center space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
export function InlineLoading({ message = "Loading...", size = 'sm' }: { message?: string; size?: 'sm' | 'md' }) {
  return (
    <div className="flex items-center justify-center space-x-3 py-4">
      {/* ARSD Logo with spinner */}
      <div className="relative">
        <Image
          src="/images/arsd-logo.png"
          alt="ARSD"
          width={size === 'sm' ? 16 : 20}
          height={size === 'sm' ? 16 : 20}
          className="rounded-full object-contain"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className={cn(
            "animate-spin text-arsd-red/60",
            size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'
          )} />
        </div>
      </div>
      
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
    <div className={cn(
      "animate-pulse bg-white rounded-lg border p-4 space-y-3",
      className
    )}>
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-gray-200 rounded-lg" />
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded" />
        <div className="h-3 bg-gray-200 rounded w-5/6" />
      </div>
      <div className="h-1 bg-gray-200 rounded-full" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="animate-pulse space-y-3">
      {/* Header */}
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 rounded" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className="h-3 bg-gray-200 rounded" />
          ))}
        </div>
      ))}
    </div>
  );
}
