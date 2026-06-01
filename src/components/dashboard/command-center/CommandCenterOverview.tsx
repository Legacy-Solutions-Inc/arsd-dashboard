'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { CommandCenterData } from '@/lib/dashboard/command-center';
import { InitialsAvatar, SectionLabel } from './viz';
import { CostCard, KpiRow, RegionCard, ReportsCard, StatusCard } from './overview-cards';
import { EngineerCard, ScheduleCard, WarehouseCard } from './team-cards';

function formatToday(now: Date): string {
  const date = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const weekday = now.toLocaleDateString('en-US', { weekday: 'short' });
  return `${date} · ${weekday}`;
}

/** Skeleton for a batch-dependent card while the per-project aggregation resolves. */
function SkeletonCard() {
  return (
    <section className="bg-card border border-border rounded-lg p-5 animate-fade-up">
      <div className="h-3 w-24 bg-muted rounded animate-pulse" />
      <div className="mt-3 h-5 w-40 bg-muted rounded animate-pulse" />
      <div className="mt-6 space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-3 w-full bg-muted/70 rounded animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
        ))}
      </div>
    </section>
  );
}

export function CommandCenterOverview({
  data,
  userName,
  canViewLeaderboard,
}: {
  data: CommandCenterData;
  userName?: string;
  canViewLeaderboard: boolean;
}) {
  const today = useMemo(() => formatToday(new Date()), []);
  const heavyLoading = data.detailsLoading;

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Editorial header */}
      <header className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="animate-fade-up">
          <SectionLabel>ARSD Construction · Command Center</SectionLabel>
          <h1 className="mt-3 text-display-1 font-display text-foreground leading-[1.05]">
            The whole operation, <span className="italic text-primary">at a glance</span>.
          </h1>
          <p className="mt-3 text-sm text-muted-foreground max-w-xl font-mono">
            Overview of every ongoing and completed project. Stats update as reports are approved.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 animate-fade-up" style={{ animationDelay: '60ms' }}>
          <div className="text-right">
            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">Today</div>
            <div className="text-sm text-foreground nums">{today}</div>
          </div>
          <InitialsAvatar name={userName} className="w-10 h-10 border border-border text-xs" />
        </div>
      </header>

      {/* KPI row */}
      <KpiRow data={data} />

      {heavyLoading && (
        <div className="flex items-center gap-3 text-[11px] font-mono uppercase tracking-wide text-muted-foreground">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 animate-ping" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
          </span>
          Computing portfolio metrics · {data.progressPct}%
        </div>
      )}

      {/* Card grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <StatusCard data={data} delay={0} />
        <ReportsCard data={data} delay={50} />
        {heavyLoading ? <SkeletonCard /> : <CostCard data={data} delay={100} />}
        <RegionCard data={data} delay={150} />
        {heavyLoading ? <SkeletonCard /> : <EngineerCard data={data} canViewAll={canViewLeaderboard} delay={200} />}
        {heavyLoading ? <SkeletonCard /> : <WarehouseCard data={data} delay={250} />}
        <div className={cn('lg:col-span-2')}>
          {heavyLoading ? <SkeletonCard /> : <ScheduleCard data={data} delay={300} />}
        </div>
      </div>
    </div>
  );
}
