'use client';

import Link from 'next/link';
import { ArrowDown, ArrowRight, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CommandCenterData } from '@/lib/dashboard/command-center';
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

// --- Warehouse inventory --------------------------------------------------

export function WarehouseCard({ data, delay }: { data: CommandCenterData; delay: number }) {
  const action =
    data.inventoryLowCount > 0 ? (
      <span className="text-[11px] font-mono uppercase tracking-wide text-primary nums">
        {data.inventoryLowCount} low
      </span>
    ) : null;

  return (
    <CommandCard label="Warehouse" title="Inventory levels" action={action} delay={delay}>
      {data.inventory.length === 0 ? (
        <EmptyHint>No warehouse stock visible for your role.</EmptyHint>
      ) : (
        <div className="space-y-3">
          {data.inventory.map((it) => {
            const pct = it.total > 0 ? (it.current / it.total) * 100 : 0;
            return (
              <div key={it.name} className="space-y-1">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-foreground truncate">{it.name}</span>
                  <span className="text-muted-foreground nums text-xs shrink-0">
                    {it.current.toLocaleString()} / {it.total.toLocaleString()}
                    {it.unit ? ` ${it.unit}` : ''}
                  </span>
                </div>
                <Bar
                  value={pct}
                  className={it.low ? 'bg-primary' : 'bg-emerald-600 dark:bg-emerald-400'}
                  heightClassName="h-1.5"
                />
              </div>
            );
          })}
        </div>
      )}
    </CommandCard>
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
