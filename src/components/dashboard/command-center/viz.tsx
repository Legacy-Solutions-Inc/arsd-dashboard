'use client';

import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/dashboard/command-center';

/**
 * Pure presentational primitives for the Command Center. All visuals are inline
 * SVG / CSS so they theme via `currentColor` + design tokens (dark-mode correct)
 * and carry no charting-library or hydration overhead.
 */

// --- Section eyebrow (red dash + mono label) ------------------------------

export function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-primary',
        className,
      )}
    >
      <span className="h-px w-4 bg-primary" aria-hidden />
      {children}
    </div>
  );
}

// --- Delta chip (▲ +n) ----------------------------------------------------

export function DeltaChip({
  value,
  suffix = '',
  className,
}: {
  value: number;
  suffix?: string;
  className?: string;
}) {
  if (!value) return null;
  const up = value > 0;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-[11px] font-mono nums',
        up ? 'text-emerald-600 dark:text-emerald-400' : 'text-primary',
        className,
      )}
    >
      <span aria-hidden>{up ? '▲' : '▼'}</span>
      {up ? '+' : ''}
      {value}
      {suffix}
    </span>
  );
}

// --- Initials avatar ------------------------------------------------------

export function InitialsAvatar({
  name,
  className,
}: {
  name?: string | null;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-muted text-muted-foreground font-mono text-[10px] font-medium shrink-0 select-none',
        className,
      )}
      aria-hidden
    >
      {getInitials(name)}
    </div>
  );
}

// --- Sparkline ------------------------------------------------------------

function sparkPoints(data: number[]): { line: string; area: string } {
  const n = data.length;
  if (n === 0) return { line: '', area: '' };
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const x = (i: number) => (n === 1 ? 50 : (i / (n - 1)) * 100);
  const y = (v: number) => 30 - ((v - min) / span) * 26;
  const line = data.map((v, i) => `${x(i)},${y(v)}`).join(' ');
  return { line, area: `0,32 ${line} 100,32` };
}

export function Sparkline({
  data,
  className,
  area = true,
}: {
  data: number[];
  className?: string;
  area?: boolean;
}) {
  const { line, area: areaPoints } = sparkPoints(data);
  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className={cn('w-full h-7', className)}>
      {area && line && <polygon points={areaPoints} fill="currentColor" fillOpacity={0.1} />}
      {line && (
        <polyline
          points={line}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  );
}

// --- Horizontal bar (with optional planned tick) --------------------------

export function Bar({
  value,
  className,
  trackClassName,
  tickAt,
  heightClassName = 'h-1.5',
}: {
  value: number;
  className?: string;
  trackClassName?: string;
  tickAt?: number;
  heightClassName?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={cn('relative w-full rounded-full overflow-hidden bg-muted', heightClassName, trackClassName)}>
      <div
        className={cn('h-full rounded-full bg-primary transition-all duration-500 ease-out', className)}
        style={{ width: `${pct}%` }}
      />
      {tickAt != null && (
        <span
          className="absolute top-0 h-full w-0.5 bg-blue-700 dark:bg-blue-400"
          style={{ left: `calc(${Math.max(0, Math.min(100, tickAt))}% - 1px)` }}
          aria-hidden
        />
      )}
    </div>
  );
}

// --- Donut ----------------------------------------------------------------

export interface DonutSegment {
  value: number;
  colorClassName: string; // text-* class; stroke uses currentColor
}

export function Donut({
  segments,
  centerValue,
  centerLabel,
  className,
}: {
  segments: DonutSegment[];
  centerValue: string;
  centerLabel?: string;
  className?: string;
}) {
  const R = 42;
  const C = 2 * Math.PI * R;
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  let offset = 0;

  return (
    <div className={cn('relative', className)}>
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx={50} cy={50} r={R} fill="none" className="text-muted" stroke="currentColor" strokeWidth={11} />
        {segments.map((s, i) => {
          const len = (s.value / total) * C;
          const dash = `${len} ${C - len}`;
          const el = (
            <circle
              key={i}
              cx={50}
              cy={50}
              r={R}
              fill="none"
              className={s.colorClassName}
              stroke="currentColor"
              strokeWidth={11}
              strokeDasharray={dash}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-h2 font-display font-bold text-foreground leading-none nums">{centerValue}</span>
        {centerLabel && (
          <span className="mt-1 text-[9px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
            {centerLabel}
          </span>
        )}
      </div>
    </div>
  );
}

// --- Card shell -----------------------------------------------------------

export function CommandCard({
  label,
  title,
  action,
  children,
  className,
  delay = 0,
}: {
  label: React.ReactNode;
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <section
      className={cn(
        'bg-card border border-border rounded-lg p-5 animate-fade-up flex flex-col',
        className,
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <SectionLabel>{label}</SectionLabel>
          {title && <h2 className="text-h3 font-display text-foreground leading-tight">{title}</h2>}
        </div>
        {action}
      </div>
      <div className="mt-4 flex-1">{children}</div>
    </section>
  );
}
