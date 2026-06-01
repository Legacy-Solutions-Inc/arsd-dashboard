'use client';

import Link from 'next/link';
import { ArrowDown, ArrowRight, ArrowUp, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CommandCenterData, WarehouseActivityRow, WarehouseStatus } from '@/lib/dashboard/command-center';
import { Bar, CommandCard, InitialsAvatar } from './viz';
import { EmptyHint } from './overview-cards';

// --- Engineer leaderboard -------------------------------------------------

export function EngineerCard({
  data,
  canViewAll,
  delay,
}: {
  data: CommandCenterData;
  canViewAll: boolean;
  delay: number;
}) {
  const action = canViewAll ? (
    <Link
      href="/dashboard/leaderboard"
      className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-wide text-primary hover:underline"
    >
      View all <ArrowRight className="h-3 w-3" />
    </Link>
  ) : null;

  return (
    <CommandCard label="Team" title="Engineer leaderboard" action={action} delay={delay}>
      {data.engineers.length === 0 ? (
        <EmptyHint>No site-engineer progress data yet.</EmptyHint>
      ) : (
        <div className="space-y-4">
          {data.engineers.map((e, i) => (
            <div key={`${e.name}-${e.email ?? i}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={cn('text-[11px] font-mono nums w-5', i === 0 ? 'text-primary' : 'text-muted-foreground')}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <InitialsAvatar name={e.name} className={cn('w-7 h-7', i === 0 && 'bg-primary/10 text-primary')} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{e.name}</div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      {e.projectsCount} project{e.projectsCount !== 1 ? 's' : ''}
                      {e.email ? ` · ${e.email}` : ''}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div
                    className={cn(
                      'flex items-center justify-end gap-0.5 text-sm font-semibold nums',
                      e.avgSlippage < 0 ? 'text-primary' : 'text-emerald-600 dark:text-emerald-400',
                    )}
                  >
                    {e.avgSlippage < 0 ? <ArrowDown className="h-3.5 w-3.5" /> : <ArrowUp className="h-3.5 w-3.5" />}
                    {e.avgSlippage > 0 ? '+' : ''}
                    {e.avgSlippage.toFixed(2)}%
                  </div>
                  <div className="text-[10px] text-muted-foreground">Avg slippage</div>
                </div>
              </div>
              <Bar
                value={e.barValue}
                className={i === 0 ? 'bg-primary' : 'bg-foreground/40'}
                heightClassName="h-1"
                trackClassName="mt-2"
              />
            </div>
          ))}
        </div>
      )}
    </CommandCard>
  );
}

// --- Warehouse: per-project delivery & release activity -------------------

const WH_STATUS: Record<WarehouseStatus, { label: string; dot: string; tone: string }> = {
  up_to_date: { label: 'up to date', dot: 'bg-emerald-600 dark:bg-emerald-400', tone: 'text-emerald-600 dark:text-emerald-400' },
  idle: { label: 'idle', dot: 'bg-amber-500', tone: 'text-amber-600 dark:text-amber-400' },
  no_activity: { label: 'no activity', dot: 'bg-muted-foreground/50', tone: 'text-muted-foreground' },
  unassigned: { label: 'unassigned', dot: 'bg-primary', tone: 'text-primary' },
};

export function WarehouseCard({ data, delay }: { data: CommandCenterData; delay: number }) {
  const action =
    data.warehouseFlags > 0 ? (
      <span className="text-[11px] font-mono uppercase tracking-wide text-primary nums">
        {data.warehouseFlags} need attention
      </span>
    ) : null;

  return (
    <CommandCard label="Warehouse" title="Delivery & release activity" action={action} delay={delay}>
      {data.warehouse.length === 0 ? (
        <EmptyHint>No warehouse activity visible for your role.</EmptyHint>
      ) : (
        <div className="divide-y divide-border">
          {data.warehouse.map((row) => (
            <WarehouseRow key={row.projectId} row={row} />
          ))}
        </div>
      )}
    </CommandCard>
  );
}

function WarehouseRow({ row }: { row: WarehouseActivityRow }) {
  const s = WH_STATUS[row.status];
  return (
    <div className="py-2.5 first:pt-0 last:pb-0">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-foreground truncate">{row.projectName}</span>
        <span className="text-[11px] font-mono text-muted-foreground nums shrink-0">
          DR {row.drCount} · RF {row.rfCount}
        </span>
      </div>
      <div className="mt-1 flex items-center justify-between gap-3">
        {row.warehousemanName ? (
          <div className="flex items-center gap-2 min-w-0">
            <InitialsAvatar name={row.warehousemanName} className="w-5 h-5 text-[9px]" />
            <span className="text-xs text-muted-foreground truncate">{row.warehousemanName}</span>
          </div>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground italic min-w-0">
            <span className="w-5 h-5 rounded-full border border-dashed border-border flex items-center justify-center shrink-0">
              <Plus className="h-3 w-3" />
            </span>
            Unassigned
          </span>
        )}
        <div className="flex items-center gap-1.5 text-[11px] shrink-0">
          <span className={cn('w-1.5 h-1.5 rounded-full', s.dot)} aria-hidden />
          <span className={s.tone}>{s.label}</span>
          <span className="text-muted-foreground nums">· {row.lastActivityLabel}</span>
        </div>
      </div>
    </div>
  );
}

// --- Progress vs planned (schedule) ---------------------------------------

export function ScheduleCard({ data, delay }: { data: CommandCenterData; delay: number }) {
  const legend = (
    <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
      <span className="inline-flex items-center gap-1.5"><span className="w-3 h-1 rounded-full bg-foreground" aria-hidden /> Actual</span>
      <span className="inline-flex items-center gap-1.5"><span className="w-3 h-1 rounded-full bg-primary" aria-hidden /> Behind</span>
      <span className="inline-flex items-center gap-1.5"><span className="w-0.5 h-3 bg-blue-700 dark:bg-blue-400" aria-hidden /> Planned</span>
    </div>
  );

  return (
    <CommandCard label="Schedule" title="Progress vs planned" action={legend} delay={delay}>
      {data.schedule.length === 0 ? (
        <EmptyHint>No in-progress projects with a parsed baseline.</EmptyHint>
      ) : (
        <div className="space-y-4">
          {data.schedule.map((row) => (
            <div key={row.projectId} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="sm:w-64 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">{row.name}</div>
                <div className="text-[10px] font-mono text-muted-foreground nums">{row.code}</div>
              </div>
              <div className="flex-1">
                <Bar
                  value={row.actual}
                  className={row.behind ? 'bg-primary' : 'bg-foreground'}
                  tickAt={row.planned}
                  heightClassName="h-2"
                />
              </div>
              <div className="text-right shrink-0 nums">
                <span className={cn('text-sm font-semibold', row.behind ? 'text-primary' : 'text-foreground')}>
                  {Math.round(row.actual)}%
                </span>
                <span className="ml-1.5 text-[11px] text-muted-foreground">{row.behind ? 'behind' : 'on track'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </CommandCard>
  );
}
