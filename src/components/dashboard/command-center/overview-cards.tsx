'use client';

import { cn } from '@/lib/utils';
import { formatCompactPeso, type CommandCenterData } from '@/lib/dashboard/command-center';
import { Bar, CommandCard, DeltaChip, Donut, Sparkline } from './viz';

// --- KPI cards ------------------------------------------------------------

function KpiCard({
  label,
  value,
  delta,
  deltaSuffix,
  spark,
  accentClassName,
  delay,
}: {
  label: string;
  value: string;
  delta: number;
  deltaSuffix?: string;
  spark: number[];
  accentClassName: string;
  delay: number;
}) {
  return (
    <div
      className="bg-card border border-border rounded-lg p-4 transition-colors hover:border-foreground/15 animate-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
        <DeltaChip value={delta} suffix={deltaSuffix} />
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="text-display-2 font-display font-bold text-foreground leading-none nums">{value}</div>
        <div className={cn('w-20 sm:w-24', accentClassName)}>
          <Sparkline data={spark} />
        </div>
      </div>
    </div>
  );
}

export function KpiRow({ data }: { data: CommandCenterData }) {
  const { kpis, kpiDeltas, kpiSparklines, reportsDeltaPct } = data;
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <KpiCard label="Total projects" value={String(kpis.total)} delta={kpiDeltas.total} spark={kpiSparklines.total} accentClassName="text-foreground/70" delay={0} />
      <KpiCard label="Active" value={String(kpis.active)} delta={kpiDeltas.active} spark={kpiSparklines.active} accentClassName="text-primary" delay={50} />
      <KpiCard label="Completed" value={String(kpis.completed)} delta={kpiDeltas.completed} spark={kpiSparklines.completed} accentClassName="text-emerald-600 dark:text-emerald-400" delay={100} />
      <KpiCard label="Reports approved" value={`${kpis.reportsApprovedPct}%`} delta={reportsDeltaPct ?? 0} deltaSuffix="%" spark={kpiSparklines.reports} accentClassName="text-blue-700 dark:text-blue-400" delay={150} />
    </div>
  );
}

// --- Status breakdown (donut) ---------------------------------------------

export function StatusCard({ data, delay }: { data: CommandCenterData; delay: number }) {
  const { active, completed } = data.statusBreakdown;
  const denom = active + completed;
  const activeShare = denom ? Math.round((active / denom) * 100) : 0;
  return (
    <CommandCard label="Health" title="Status breakdown" delay={delay}>
      <div className="flex flex-col items-center">
        <Donut
          className="w-40 h-40"
          segments={[
            { value: active, colorClassName: 'text-primary' },
            { value: completed, colorClassName: 'text-emerald-600 dark:text-emerald-400' },
          ]}
          centerValue={`${activeShare}%`}
          centerLabel="Active"
        />
        <div className="mt-4 flex items-center gap-5 text-xs">
          <LegendDot className="bg-primary" label="Active" value={active} />
          <LegendDot className="bg-emerald-600 dark:bg-emerald-400" label="Completed" value={completed} />
        </div>
      </div>
    </CommandCard>
  );
}

function LegendDot({ className, label, value }: { className: string; label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <span className={cn('w-2 h-2 rounded-full', className)} aria-hidden />
      {label} · <span className="text-foreground nums font-medium">{value}</span>
    </span>
  );
}

// --- Reports submissions & approvals (line chart) -------------------------

function linePoints(series: number[], max: number): string {
  const n = series.length;
  const x = (i: number) => (n <= 1 ? 50 : (i / (n - 1)) * 100);
  const y = (v: number) => 38 - (max ? (v / max) * 34 : 0);
  return series.map((v, i) => `${x(i)},${y(v)}`).join(' ');
}

export function ReportsCard({ data, delay }: { data: CommandCenterData; delay: number }) {
  const trend = data.reportsTrend;
  const max = Math.max(1, ...trend.flatMap((t) => [t.submitted, t.approved]));
  const action =
    data.reportsDeltaPct != null ? <DeltaChip value={data.reportsDeltaPct} suffix="%" /> : null;

  return (
    <CommandCard label="Reporting" title="Report submissions & approvals" action={action} delay={delay}>
      {trend.length === 0 ? (
        <EmptyHint>No accomplishment reports yet.</EmptyHint>
      ) : (
        <>
          <div className="h-32 w-full">
            <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full overflow-visible">
              <polyline points={linePoints(trend.map((t) => t.submitted), max)} fill="none" className="text-primary" stroke="currentColor" strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
              <polyline points={linePoints(trend.map((t) => t.approved), max)} fill="none" className="text-blue-700 dark:text-blue-400" stroke="currentColor" strokeWidth={2} strokeDasharray="4 3" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="mt-2 flex justify-between text-[9px] font-mono uppercase tracking-wide text-muted-foreground nums">
            {trend.map((t, i) => (
              <span key={i}>{t.label}</span>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><span className="w-3 h-0.5 bg-primary" aria-hidden /> Submitted</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-3 h-0.5 border-t-2 border-dashed border-blue-700 dark:border-blue-400" aria-hidden /> Approved</span>
          </div>
        </>
      )}
    </CommandCard>
  );
}

// --- Cost tracking --------------------------------------------------------

export function CostCard({ data, delay }: { data: CommandCenterData; delay: number }) {
  const { committed, allocated, headroomPct, onBudget, burn } = data.budget;
  const usedPct = allocated > 0 ? (committed / allocated) * 100 : 0;
  return (
    <CommandCard label="Budget" title="Cost tracking" delay={delay}>
      {allocated === 0 ? (
        <EmptyHint>No parsed contract amounts yet.</EmptyHint>
      ) : (
        <>
          <div className="flex items-end gap-2">
            <span className="text-display-2 font-display font-bold text-foreground leading-none nums">{formatCompactPeso(committed)}</span>
            <span className="text-xs text-muted-foreground mb-1">committed</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            of <span className="text-foreground nums">{formatCompactPeso(allocated)}</span> allocated ·{' '}
            <span className="text-emerald-600 dark:text-emerald-400 nums">{headroomPct}% headroom</span>
          </p>
          <div className="mt-3">
            <Bar value={usedPct} heightClassName="h-2" />
          </div>
          <div className="mt-5 flex items-end justify-between gap-3">
            <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
              Report activity · 8 wk
            </div>
            <span className={cn('text-[11px] font-mono', onBudget ? 'text-emerald-600 dark:text-emerald-400' : 'text-primary')}>
              {onBudget ? '▲ on budget' : '▼ over budget'}
            </span>
          </div>
          <div className="mt-1 w-full text-emerald-600 dark:text-emerald-400">
            <Sparkline data={burn} />
          </div>
        </>
      )}
    </CommandCard>
  );
}

// --- Projects by region ---------------------------------------------------

export function RegionCard({ data, delay }: { data: CommandCenterData; delay: number }) {
  const { regions } = data;
  const max = Math.max(1, ...regions.map((r) => r.count));
  return (
    <CommandCard label="Geography" title="Projects by region" delay={delay}>
      {regions.length === 0 ? (
        <EmptyHint>No project locations recorded.</EmptyHint>
      ) : (
        <>
          <div className="space-y-3">
            {regions.map((r) => (
              <div key={r.name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground font-medium truncate">{r.name}</span>
                  <span className="text-foreground nums tabular-nums">{r.count}</span>
                </div>
                <Bar value={(r.count / max) * 100} heightClassName="h-1.5" />
              </div>
            ))}
          </div>
          <p className="mt-4 text-[11px] font-mono uppercase tracking-wide text-muted-foreground">
            {regions.length} region{regions.length !== 1 ? 's' : ''} · Western Visayas operations
          </p>
        </>
      )}
    </CommandCard>
  );
}

// --- Shared empty hint ----------------------------------------------------

export function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-24 items-center justify-center text-center text-xs text-muted-foreground">
      {children}
    </div>
  );
}
