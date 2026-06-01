/**
 * Command Center aggregation — pure types + helpers (no React, no fetching).
 *
 * The hook (`useCommandCenter`) does the batched I/O against `ProjectDetailsService`
 * and the warehouse stocks API, then assembles a `CommandCenterData` object from the
 * pure functions below. Keeping the math here makes it testable and keeps the hook thin.
 *
 * Honesty notes (no fabricated data):
 *  - On-time % / planned baseline are DERIVED from slippage (actual − target %), because
 *    the data model has no separate on-time field. See `deriveOnTimePct`.
 *  - The cost-tracking sparkline reflects weekly *approved-report activity*, not a true
 *    weekly cost-burn series (which would require a per-project progress-trend fetch).
 *    See `weeklyApprovedSeries`. The committed/allocated/headroom figures are real.
 *  - Warehouse "low" is a derived threshold, not a stored flag. See `aggregateInventory`.
 */

import type { Project } from '@/types/projects';
import type { AccomplishmentReport } from '@/types/accomplishment-reports';
import type { StockItem } from '@/types/warehouse';
import { parseNumericValue, roundToTwoDecimals } from '@/utils/project-calculations';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Per-project metrics derived from the latest parsed cost + details rows. */
export interface ProjectMetric {
  projectId: string;
  actualProgress: number; // 0..100
  targetProgress: number; // 0..100 (the "planned" baseline)
  slippage: number; // actual − target; negative = behind
  contractAmount: number; // allocated
  committedCost: number; // direct cost incurred to date
  siteEngineerName?: string; // from the parsed detail row; fallback when no PM is assigned
}

export interface KpiSummary {
  total: number;
  active: number;
  completed: number;
  reportsApprovedPct: number;
}

/** Counts of recently-added/changed projects, used for the KPI delta chips. */
export interface KpiDeltas {
  total: number;
  active: number;
  completed: number;
}

export interface StatusBreakdown {
  active: number;
  completed: number;
  inPlanning: number;
}

export interface RegionStat {
  name: string;
  count: number;
}

export interface ReportsTrendPoint {
  label: string; // e.g. "W21"
  submitted: number;
  approved: number;
}

export interface BudgetSummary {
  committed: number;
  allocated: number;
  headroomPct: number;
  onBudget: boolean;
  burn: number[]; // approved-report activity, last N weeks (see honesty note)
}

export interface EngineerStat {
  name: string;
  email?: string;
  avgSlippage: number; // mean of per-project slippage (actual − target %); negative = behind
  barValue: number; // 0..100 on-track proxy, used only for the bar width
  projectsCount: number;
}

export interface ScheduleRow {
  projectId: string;
  name: string;
  code: string;
  actual: number;
  planned: number;
  behind: boolean;
}

export interface InventoryStat {
  name: string;
  unit?: string;
  current: number;
  total: number;
  low: boolean;
}

export interface CommandCenterData {
  detailsLoading: boolean;
  progressPct: number;
  kpis: KpiSummary;
  kpiDeltas: KpiDeltas;
  kpiSparklines: { total: number[]; active: number[]; completed: number[]; reports: number[] };
  statusBreakdown: StatusBreakdown;
  regions: RegionStat[];
  reportsTrend: ReportsTrendPoint[];
  reportsDeltaPct: number | null;
  budget: BudgetSummary;
  engineers: EngineerStat[];
  schedule: ScheduleRow[];
  inventory: InventoryStat[];
  inventoryLowCount: number;
  progressByProjectId: Record<string, ProjectMetric>;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const RECENT_WINDOW_DAYS = 30;
const LOW_STOCK_RATIO = 0.2; // running balance ≤ 20% of IPOW qty ⇒ "low"

// ---------------------------------------------------------------------------
// Small formatting helpers
// ---------------------------------------------------------------------------

export function getInitials(name?: string | null): string {
  if (!name) return '–';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '–';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Compact peso, e.g. ₱113M, ₱1.2M, ₱950K, ₱420. */
export function formatCompactPeso(value: number): string {
  const n = Math.round(value);
  if (Math.abs(n) >= 1_000_000) return `₱${roundToTwoDecimals(n / 1_000_000)}M`;
  if (Math.abs(n) >= 1_000) return `₱${Math.round(n / 1_000)}K`;
  return `₱${n.toLocaleString('en-PH')}`;
}

/** ISO-8601 week number, used only for chart axis labels (e.g. "W21"). */
export function isoWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}

// ---------------------------------------------------------------------------
// Project-derived summaries (cheap — from the projects list alone)
// ---------------------------------------------------------------------------

/** Mirrors the dashboard's existing `hasReports` rule. */
export function projectHasApprovedReport(p: Project): boolean {
  return p.latest_accomplishment_update !== null && p.has_parsed_data === true;
}

export function summarizeKpis(projects: Project[]): KpiSummary {
  const total = projects.length;
  const active = projects.filter((p) => p.status === 'in_progress').length;
  const completed = projects.filter((p) => p.status === 'completed').length;
  const withReports = projects.filter(projectHasApprovedReport).length;
  return {
    total,
    active,
    completed,
    reportsApprovedPct: total ? Math.round((withReports / total) * 100) : 0,
  };
}

export function summarizeStatus(projects: Project[]): StatusBreakdown {
  return {
    active: projects.filter((p) => p.status === 'in_progress').length,
    completed: projects.filter((p) => p.status === 'completed').length,
    inPlanning: projects.filter((p) => p.status === 'in_planning').length,
  };
}

/** Delta chips = items created (or, for completed, last-updated) in the last 30 days. */
export function computeKpiDeltas(projects: Project[], now: Date): KpiDeltas {
  const since = now.getTime() - RECENT_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const createdRecently = (p: Project) => new Date(p.created_at).getTime() >= since;
  return {
    total: projects.filter(createdRecently).length,
    active: projects.filter((p) => p.status === 'in_progress' && createdRecently(p)).length,
    completed: projects.filter(
      (p) => p.status === 'completed' && p.updated_at && new Date(p.updated_at).getTime() >= since,
    ).length,
  };
}

/** Group by the first segment of `location` (city/province) — free-form text, best-effort. */
export function groupByRegion(projects: Project[], limit = 5): RegionStat[] {
  const counts = new Map<string, number>();
  for (const p of projects) {
    const region = (p.location || 'Unspecified').split(',').pop()!.trim() || 'Unspecified';
    counts.set(region, (counts.get(region) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// Weekly series (sparklines + reports trend)
// ---------------------------------------------------------------------------

/** N weekly checkpoint timestamps ending now (oldest → newest). */
function weekCheckpoints(now: Date, weeks: number): number[] {
  const end = now.getTime();
  return Array.from({ length: weeks }, (_, i) => end - (weeks - 1 - i) * WEEK_MS);
}

/** Cumulative count of dated events at each weekly checkpoint — a real running-total sparkline. */
export function weeklyCumulative(dates: (string | null | undefined)[], now: Date, weeks = 8): number[] {
  const stamps = dates
    .map((d) => (d ? new Date(d).getTime() : NaN))
    .filter((t) => !Number.isNaN(t));
  return weekCheckpoints(now, weeks).map((cp) => stamps.filter((t) => t <= cp).length);
}

/** Weekly Submitted vs Approved trend, bucketed by `week_ending_date` (already weekly). */
export function buildReportsTrend(
  reports: AccomplishmentReport[],
  weeks = 8,
): { trend: ReportsTrendPoint[]; deltaPct: number | null } {
  const byWeek = new Map<string, { submitted: number; approved: number }>();
  for (const r of reports) {
    if (!r.week_ending_date) continue;
    const key = r.week_ending_date.slice(0, 10);
    const bucket = byWeek.get(key) ?? { submitted: 0, approved: 0 };
    bucket.submitted += 1;
    if (r.status === 'approved') bucket.approved += 1;
    byWeek.set(key, bucket);
  }

  const ordered = Array.from(byWeek.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-weeks);
  const trend = ordered.map(([date, v]) => ({
    label: `W${isoWeek(new Date(date))}`,
    submitted: v.submitted,
    approved: v.approved,
  }));

  return { trend, deltaPct: halfOverHalfDelta(trend.map((t) => t.submitted)) };
}

/** % change of the recent half of a series vs the prior half (used for trend chips). */
export function halfOverHalfDelta(series: number[]): number | null {
  if (series.length < 2) return null;
  const mid = Math.floor(series.length / 2);
  const prev = series.slice(0, mid).reduce((a, b) => a + b, 0);
  const recent = series.slice(mid).reduce((a, b) => a + b, 0);
  if (prev === 0) return recent > 0 ? 100 : null;
  return Math.round(((recent - prev) / prev) * 100);
}

/** Weekly approved-report counts — feeds the cost card's activity sparkline (see honesty note). */
export function weeklyApprovedSeries(reports: AccomplishmentReport[], now: Date, weeks = 8): number[] {
  const approved = reports.filter((r) => r.status === 'approved' && r.week_ending_date);
  return weekCheckpoints(now, weeks).map((cp) => {
    const lo = cp - WEEK_MS;
    return approved.filter((r) => {
      const t = new Date(r.week_ending_date).getTime();
      return t > lo && t <= cp;
    }).length;
  });
}

// ---------------------------------------------------------------------------
// Metric-derived summaries (need the per-project cost/detail batch)
// ---------------------------------------------------------------------------

export function summarizeBudget(metrics: ProjectMetric[], burn: number[]): BudgetSummary {
  const allocated = metrics.reduce((a, m) => a + m.contractAmount, 0);
  const committed = metrics.reduce((a, m) => a + m.committedCost, 0);
  const headroomPct = allocated > 0 ? Math.round(((allocated - committed) / allocated) * 100) : 0;
  return { committed, allocated, headroomPct, onBudget: committed <= allocated, burn };
}

/** Clamp(100 + avgSlippage) — a behind engineer (negative slippage) reads below 100. */
export function deriveOnTimePct(slippage: number): number {
  return Math.max(0, Math.min(100, Math.round(100 + slippage)));
}

/**
 * A metric is a real performance signal only when there's a contract baseline AND some
 * target/actual progress. Filters out empty/all-zero parsed reports — e.g. an engineer
 * whose project has a row but no real cost data yet, which would otherwise read as a
 * misleading 0.00% slippage and out-rank engineers with genuine (negative) numbers.
 */
export function hasProgressSignal(m: ProjectMetric): boolean {
  return m.contractAmount > 0 && (m.targetProgress > 0 || m.actualProgress > 0);
}

/**
 * Top site engineers ranked by average slippage — mirrors the leaderboard page's
 * engineer aggregation: name resolves to the assigned PM, falling back to the parsed
 * `site_engineer_name`; ranking is by avg slippage (less-negative = better). Projects
 * without a real progress signal are skipped (see `hasProgressSignal`).
 */
export function rankEngineers(
  projects: Project[],
  metricsById: Record<string, ProjectMetric>,
  limit = 5,
): EngineerStat[] {
  const agg = new Map<string, { name: string; email?: string; slips: number[] }>();
  for (const p of projects) {
    const metric = metricsById[p.id];
    if (!metric || !hasProgressSignal(metric)) continue;
    const name = p.project_manager?.display_name?.trim() || metric.siteEngineerName?.trim();
    if (!name) continue;
    const key = p.project_manager?.email ? `${name}__${p.project_manager.email}` : name;
    const entry = agg.get(key) ?? { name, email: p.project_manager?.email || undefined, slips: [] };
    entry.slips.push(metric.slippage);
    agg.set(key, entry);
  }
  return Array.from(agg.values())
    .map((e) => {
      const avgSlippage = roundToTwoDecimals(e.slips.reduce((a, b) => a + b, 0) / e.slips.length);
      return {
        name: e.name,
        email: e.email,
        avgSlippage,
        barValue: deriveOnTimePct(avgSlippage),
        projectsCount: e.slips.length,
      };
    })
    .sort((a, b) => b.avgSlippage - a.avgSlippage || b.projectsCount - a.projectsCount || a.name.localeCompare(b.name))
    .slice(0, limit);
}

/** In-progress projects with a parsed baseline, most-behind first. */
export function buildSchedule(
  projects: Project[],
  metricsById: Record<string, ProjectMetric>,
  limit = 6,
): ScheduleRow[] {
  return projects
    .filter((p) => {
      const m = metricsById[p.id];
      return p.status === 'in_progress' && !!m && hasProgressSignal(m);
    })
    .map((p) => {
      const m = metricsById[p.id];
      return {
        projectId: p.id,
        name: p.project_name,
        code: p.parsed_project_id || p.project_id,
        actual: m.actualProgress,
        planned: m.targetProgress,
        behind: m.slippage < -1,
      };
    })
    .sort((a, b) => a.actual - b.actual)
    .reverse()
    .slice(0, limit);
}

/** Aggregate per-project stock items into portfolio-wide inventory levels. */
export function aggregateInventory(
  perProjectStocks: StockItem[][],
  limit = 6,
): { inventory: InventoryStat[]; lowCount: number } {
  const byItem = new Map<string, { name: string; unit?: string; current: number; total: number }>();
  for (const items of perProjectStocks) {
    for (const it of items) {
      const key = it.item_description.trim().toLowerCase();
      const entry = byItem.get(key) ?? { name: it.item_description.trim(), unit: it.unit, current: 0, total: 0 };
      entry.current += parseNumericValue(it.running_balance);
      entry.total += parseNumericValue(it.ipow_qty) || parseNumericValue(it.delivered);
      entry.unit = entry.unit || it.unit;
      byItem.set(key, entry);
    }
  }

  const all = Array.from(byItem.values()).map((e) => ({
    name: e.name,
    unit: e.unit,
    current: Math.round(e.current),
    total: Math.round(e.total),
    low: e.total > 0 ? e.current / e.total <= LOW_STOCK_RATIO : e.current <= 0,
  }));

  const sorted = all.sort((a, b) => Number(b.low) - Number(a.low) || b.total - a.total);
  return { inventory: sorted.slice(0, limit), lowCount: all.filter((i) => i.low).length };
}
