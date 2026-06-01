'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUpDown, ChevronLeft, ChevronRight, Edit, Eye, MapPin, MoreHorizontal, Plus, Search, SlidersHorizontal } from 'lucide-react';
import { Project, getProjectStatusText } from '@/types/projects';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { ProjectMetric } from '@/lib/dashboard/command-center';
import { Bar, InitialsAvatar, SectionLabel } from './viz';

type FilterKey = 'all' | 'active' | 'completed' | 'unassigned';
type SortKey = 'name' | 'client' | 'progress' | 'updated' | 'status';

interface PortfolioTableProps {
  projects: Project[];
  progressByProjectId: Record<string, ProjectMetric>;
  detailsLoading: boolean;
  hasReports: (p: Project) => boolean;
  onViewProject: (p: Project) => void;
  onEditProject: (p: Project) => void;
  onCreateProject: () => void;
  canEdit: boolean;
  canCreate: boolean;
  canViewLeaderboard: boolean;
}

const ITEMS_PER_PAGE = 5;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'unassigned', label: 'Unassigned WH' },
];

function matchesFilter(p: Project, key: FilterKey): boolean {
  if (key === 'active') return p.status === 'in_progress';
  if (key === 'completed') return p.status === 'completed';
  if (key === 'unassigned') return !p.warehouseman_id && !p.warehouseman;
  return true;
}

function matchesSearch(p: Project, q: string): boolean {
  if (!q) return true;
  const hay = [
    p.project_name,
    p.parsed_project_id,
    p.project_id,
    p.client,
    p.location,
    p.project_manager?.display_name,
    p.warehouseman?.display_name,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return hay.includes(q.toLowerCase());
}

function StatusPill({ status }: { status: Project['status'] }) {
  const map = {
    completed: 'bg-emerald-600/10 text-emerald-700 dark:text-emerald-400',
    in_progress: 'bg-primary/10 text-primary',
    in_planning: 'bg-muted text-muted-foreground',
  } as const;
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-mono uppercase tracking-wide', map[status])}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden />
      {getProjectStatusText(status)}
    </span>
  );
}

function ProgressCell({ metric, loading }: { metric?: ProjectMetric; loading: boolean }) {
  if (!metric) {
    return loading ? (
      <div className="h-1.5 w-24 bg-muted rounded-full animate-pulse" />
    ) : (
      <span className="text-xs text-muted-foreground">—</span>
    );
  }
  const pct = Math.round(metric.actualProgress);
  const color = pct >= 100 ? 'bg-emerald-600 dark:bg-emerald-400' : metric.slippage < -1 ? 'bg-primary' : 'bg-foreground';
  return (
    <div className="flex items-center gap-2 min-w-[110px]">
      <Bar value={pct} className={color} heightClassName="h-1.5" trackClassName="w-20" />
      <span className="text-xs text-foreground nums w-9 text-right">{pct}%</span>
    </div>
  );
}

function PersonCell({ name, email }: { name?: string; email?: string }) {
  if (!name) {
    return (
      <span className="inline-flex items-center gap-2 text-xs text-muted-foreground italic">
        <span className="w-7 h-7 rounded-full border border-dashed border-border flex items-center justify-center text-muted-foreground/60"><Plus className="h-3 w-3" /></span>
        Unassigned
      </span>
    );
  }
  return (
    <div className="flex items-center gap-2 min-w-0">
      <InitialsAvatar name={name} className="w-7 h-7" />
      <div className="min-w-0">
        <div className="text-xs font-medium text-foreground truncate">{name}</div>
        {email && <div className="text-[11px] text-muted-foreground truncate">{email}</div>}
      </div>
    </div>
  );
}

function SortHeader({
  label,
  sortKey,
  active,
  dir,
  onSort,
  className,
}: {
  label: string;
  sortKey?: SortKey;
  active: boolean;
  dir: 'asc' | 'desc';
  onSort: (k: SortKey) => void;
  className?: string;
}) {
  const base = 'text-[10px] font-mono uppercase tracking-[0.12em] text-muted-foreground py-3 px-3 text-left';
  if (!sortKey) return <th className={cn(base, className)}>{label}</th>;
  return (
    <th className={cn(base, className)}>
      <button onClick={() => onSort(sortKey)} className={cn('inline-flex items-center gap-1 hover:text-foreground transition-colors', active && 'text-foreground')}>
        {label}
        <ArrowUpDown className={cn('h-3 w-3', active ? 'opacity-100' : 'opacity-40')} />
        {active && <span className="sr-only">{dir}</span>}
      </button>
    </th>
  );
}

export function PortfolioTable(props: PortfolioTableProps) {
  const { projects, progressByProjectId, detailsLoading, hasReports, canCreate, canEdit, canViewLeaderboard } = props;
  const [filter, setFilter] = useState<FilterKey>('all');
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('updated');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  const counts = useMemo(
    () => ({
      all: projects.length,
      active: projects.filter((p) => p.status === 'in_progress').length,
      completed: projects.filter((p) => p.status === 'completed').length,
      unassigned: projects.filter((p) => matchesFilter(p, 'unassigned')).length,
    }),
    [projects],
  );

  const visible = useMemo(() => {
    const rows = projects.filter((p) => matchesFilter(p, filter) && matchesSearch(p, query));
    const order = sortDir === 'asc' ? 1 : -1;
    const val = (p: Project): number | string => {
      if (sortKey === 'name') return p.project_name.toLowerCase();
      if (sortKey === 'client') return p.client.toLowerCase();
      if (sortKey === 'status') return p.status;
      if (sortKey === 'progress') return progressByProjectId[p.id]?.actualProgress ?? -1;
      return p.latest_accomplishment_update ? new Date(p.latest_accomplishment_update).getTime() : 0;
    };
    return [...rows].sort((a, b) => {
      const av = val(a);
      const bv = val(b);
      if (av < bv) return -1 * order;
      if (av > bv) return 1 * order;
      return 0;
    });
  }, [projects, filter, query, sortKey, sortDir, progressByProjectId]);

  const totalPages = Math.max(1, Math.ceil(visible.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginated = visible.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Reset to the first page whenever the result set changes; clamp if it shrinks.
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, query]);
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const onSort = (k: SortKey) => {
    if (k === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(k);
      setSortDir(k === 'updated' || k === 'progress' ? 'desc' : 'asc');
    }
  };

  return (
    <section className="space-y-5 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <SectionLabel>Project Portfolio</SectionLabel>
          <h2 className="mt-2 text-display-2 font-display text-foreground leading-none">
            Every project. <span className="italic text-primary">One</span> view.
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {canViewLeaderboard && (
            <Button asChild variant="outline">
              <Link href="/dashboard/leaderboard">
                <SlidersHorizontal className="h-4 w-4" />
                <span className="hidden sm:inline">Performance leaderboard</span>
                <span className="sm:hidden">Leaderboard</span>
              </Link>
            </Button>
          )}
          {canCreate && (
            <Button onClick={props.onCreateProject}>
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Create project</span>
              <span className="sm:hidden">Create</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filter tabs + search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-colors',
                filter === f.key
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-muted-foreground border-border hover:text-foreground hover:border-foreground/20',
              )}
            >
              {f.label}
              <span className="nums opacity-80">{counts[f.key]}</span>
            </button>
          ))}
        </div>
        <div className="relative sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects…"
            className="w-full rounded-md border border-border bg-card pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {visible.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">No projects match this view.</div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="block lg:hidden divide-y divide-border">
              {paginated.map((p) => (
                <MobileRow key={p.id} project={p} {...props} />
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto scrollbar-glass">
              <table className="w-full min-w-[1080px] table-fixed border-collapse">
                <colgroup>
                  <col className="w-[24%]" />
                  <col className="w-[15%]" />
                  <col className="w-[15%]" />
                  <col className="w-[15%]" />
                  <col className="w-[12%]" />
                  <col className="w-[9%]" />
                  <col className="w-[8%]" />
                  <col className="w-[56px]" />
                </colgroup>
                <thead>
                  <tr className="bg-muted/40 border-b border-border">
                    <SortHeader label="Project" sortKey="name" active={sortKey === 'name'} dir={sortDir} onSort={onSort} />
                    <SortHeader label="Site Engineer" active={false} dir={sortDir} onSort={onSort} />
                    <SortHeader label="Warehouseman" active={false} dir={sortDir} onSort={onSort} />
                    <SortHeader label="Client" sortKey="client" active={sortKey === 'client'} dir={sortDir} onSort={onSort} />
                    <SortHeader label="Progress" sortKey="progress" active={sortKey === 'progress'} dir={sortDir} onSort={onSort} />
                    <SortHeader label="Status" sortKey="status" active={sortKey === 'status'} dir={sortDir} onSort={onSort} />
                    <SortHeader label="Updated" sortKey="updated" active={sortKey === 'updated'} dir={sortDir} onSort={onSort} />
                    <SortHeader label="Action" active={false} dir={sortDir} onSort={onSort} className="text-right" />
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((p) => (
                    <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors align-top">
                      <td className="py-4 px-3">
                        <div className="font-mono text-[11px] text-primary bg-primary/10 px-2 py-0.5 rounded inline-block mb-1.5 nums">
                          {p.parsed_project_id || p.project_id}
                        </div>
                        <div className="text-sm font-medium text-foreground leading-snug line-clamp-2" title={p.project_name}>
                          {p.project_name}
                        </div>
                      </td>
                      <td className="py-4 px-3"><PersonCell name={p.project_manager?.display_name} email={p.project_manager?.email} /></td>
                      <td className="py-4 px-3"><PersonCell name={p.warehouseman?.display_name} email={p.warehouseman?.email} /></td>
                      <td className="py-4 px-3">
                        <div className="text-sm text-foreground line-clamp-2" title={p.client}>{p.client}</div>
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5"><MapPin className="h-3 w-3 shrink-0" /><span className="truncate">{p.location}</span></div>
                      </td>
                      <td className="py-4 px-3"><ProgressCell metric={progressByProjectId[p.id]} loading={detailsLoading} /></td>
                      <td className="py-4 px-3"><StatusPill status={p.status} /></td>
                      <td className="py-4 px-3">
                        {p.latest_accomplishment_update ? (
                          <span className="text-xs text-foreground nums">{new Date(p.latest_accomplishment_update).toLocaleDateString()}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">No reports</span>
                        )}
                      </td>
                      <td className="py-4 px-3">
                        <div className="flex justify-end">
                          <RowActions
                            project={p}
                            reportsReady={hasReports(p)}
                            canEdit={canEdit}
                            onView={() => props.onViewProject(p)}
                            onEdit={() => props.onEditProject(p)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-3 border-t border-border bg-muted/20">
          <span className="text-[11px] font-mono uppercase tracking-wide text-muted-foreground nums">
            {visible.length === 0
              ? 'No projects'
              : `Showing ${startIndex + 1}–${Math.min(startIndex + ITEMS_PER_PAGE, visible.length)} of ${visible.length} projects`}
          </span>
          {totalPages > 1 ? (
            <Pagination page={currentPage} totalPages={totalPages} onPage={setCurrentPage} />
          ) : (
            <span className="hidden sm:block text-[11px] font-mono uppercase tracking-wide text-muted-foreground">
              Stats update as reports are approved
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

function RowActions({
  project,
  reportsReady,
  canEdit,
  onView,
  onEdit,
}: {
  project: Project;
  reportsReady: boolean;
  canEdit: boolean;
  onView: () => void;
  onEdit: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-8 h-8 p-0 text-muted-foreground hover:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground"
          aria-label={`Actions for ${project.project_name}`}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-[10px] font-mono uppercase tracking-[0.12em] text-muted-foreground">
          Actions
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={!reportsReady} onClick={onView} className="cursor-pointer">
          <Eye className="h-4 w-4" />
          View details
        </DropdownMenuItem>
        {canEdit && (
          <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
            <Edit className="h-4 w-4" />
            Edit project
          </DropdownMenuItem>
        )}
        {!reportsReady && (
          <p className="px-2 pt-1.5 text-[11px] leading-snug text-muted-foreground">
            No approved report with parsed data yet.
          </p>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Pagination({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}) {
  const items: (number | 'ellipsis')[] = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)) {
      items.push(p);
    } else if (items[items.length - 1] !== 'ellipsis') {
      items.push('ellipsis');
    }
  }

  return (
    <div className="flex items-center justify-center gap-1">
      <Button variant="outline" size="sm" className="w-8 h-8 p-0" onClick={() => onPage(page - 1)} disabled={page === 1} aria-label="Previous page">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      {items.map((it, i) =>
        it === 'ellipsis' ? (
          <span key={`ellipsis-${i}`} className="px-1.5 text-muted-foreground text-sm">…</span>
        ) : (
          <Button
            key={it}
            variant={it === page ? 'default' : 'outline'}
            size="sm"
            className={cn('w-8 h-8 p-0 nums', it === page && 'pointer-events-none')}
            onClick={() => onPage(it)}
            aria-current={it === page ? 'page' : undefined}
            aria-label={`Page ${it}`}
          >
            {it}
          </Button>
        ),
      )}
      <Button variant="outline" size="sm" className="w-8 h-8 p-0" onClick={() => onPage(page + 1)} disabled={page === totalPages} aria-label="Next page">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

function MobileRow({
  project,
  progressByProjectId,
  detailsLoading,
  hasReports,
  onViewProject,
  onEditProject,
  canEdit,
}: { project: Project } & PortfolioTableProps) {
  return (
    <div className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-mono text-[11px] text-primary bg-primary/10 px-2 py-0.5 rounded inline-block mb-1.5 nums">
            {project.parsed_project_id || project.project_id}
          </div>
          <h3 className="text-sm font-semibold text-foreground">{project.project_name}</h3>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5"><MapPin className="h-3 w-3" /><span className="truncate">{project.location}</span></div>
        </div>
        <StatusPill status={project.status} />
      </div>
      <PersonCell name={project.project_manager?.display_name} email={project.project_manager?.email} />
      <ProgressCell metric={progressByProjectId[project.id]} loading={detailsLoading} />
      <div className="flex gap-2 pt-1">
        {canEdit && (
          <Button variant="outline" size="sm" onClick={() => onEditProject(project)} className="flex-1">
            <Edit className="h-3.5 w-3.5" /> Edit
          </Button>
        )}
        <Button variant={hasReports(project) ? 'default' : 'outline'} size="sm" onClick={() => onViewProject(project)} disabled={!hasReports(project)} className="flex-1">
          <ArrowRight className="h-3.5 w-3.5" /> View
        </Button>
      </div>
    </div>
  );
}
