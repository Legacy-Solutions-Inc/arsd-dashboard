'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Project } from '@/types/projects';
import type { StockItem } from '@/types/warehouse';
import { ProjectDetailsService } from '@/services/projects/project-details.service';
import { calculateLeaderboardStats, parseNumericValue, roundToTwoDecimals } from '@/utils/project-calculations';
import { useAllAccomplishmentReports } from './useAccomplishmentReports';
import {
  aggregateInventory,
  buildReportsTrend,
  buildSchedule,
  computeKpiDeltas,
  groupByRegion,
  rankEngineers,
  summarizeBudget,
  summarizeKpis,
  summarizeStatus,
  weeklyApprovedSeries,
  weeklyCumulative,
  type CommandCenterData,
  type ProjectMetric,
} from '@/lib/dashboard/command-center';

const BATCH_SIZE = 5; // mirrors the leaderboard page's concurrency-limited batching

/** Fetch a project's warehouse stock items; resolves to [] when the caller lacks access. */
async function fetchStocks(projectId: string): Promise<StockItem[]> {
  try {
    const res = await fetch(`/api/warehouse/stocks/${projectId}`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/** Derive a single project's portfolio metrics from its latest parsed cost + detail rows. */
function toMetric(projectId: string, details: { project_costs?: any[]; project_details?: any[] } | null): ProjectMetric | null {
  const latestCost = details?.project_costs?.[0];
  const latestDetail = details?.project_details?.[0];
  if (!latestCost || !latestDetail) return null;
  const { targetProgress, actualProgress, slippage } = calculateLeaderboardStats(latestCost, latestDetail);
  return {
    projectId,
    actualProgress,
    targetProgress,
    slippage: roundToTwoDecimals(slippage),
    contractAmount: parseNumericValue(latestDetail.contract_amount),
    committedCost: parseNumericValue(latestCost.direct_cost_total),
  };
}

/**
 * Single batched aggregation behind the Command Center. Fetches per-project parsed
 * details (budget/progress/leaderboard/schedule) and warehouse stocks once each, in
 * concurrency-limited batches, then assembles a `CommandCenterData` view from the pure
 * helpers in `@/lib/dashboard/command-center`. The cheap, project-list-derived widgets
 * (KPIs, status, regions, sparklines, reports trend) render immediately; the heavy
 * widgets fill in as the batch resolves (`detailsLoading` / `progressPct`).
 */
export function useCommandCenter(projects: Project[], projectsLoading: boolean): CommandCenterData {
  const { reports } = useAllAccomplishmentReports();
  const [metricsById, setMetricsById] = useState<Record<string, ProjectMetric>>({});
  const [perProjectStocks, setPerProjectStocks] = useState<StockItem[][]>([]);
  const [detailsLoading, setDetailsLoading] = useState(true);
  const [progressPct, setProgressPct] = useState(0);

  useEffect(() => {
    if (projectsLoading) return;
    let cancelled = false;

    const run = async () => {
      setDetailsLoading(true);
      setProgressPct(projects.length === 0 ? 100 : 0);
      const detailsService = new ProjectDetailsService();
      const metrics: Record<string, ProjectMetric> = {};
      const stocks: StockItem[][] = [];

      const batches: Project[][] = [];
      for (let i = 0; i < projects.length; i += BATCH_SIZE) batches.push(projects.slice(i, i + BATCH_SIZE));

      for (let b = 0; b < batches.length; b++) {
        const results = await Promise.all(
          batches[b].map(async (p) => {
            const [details, projectStocks] = await Promise.all([
              p.has_parsed_data === false ? Promise.resolve(null) : detailsService.getProjectDetails(p.id),
              fetchStocks(p.id),
            ]);
            return { metric: toMetric(p.id, details), projectStocks };
          }),
        );
        if (cancelled) return;
        for (const r of results) {
          if (r.metric) metrics[r.metric.projectId] = r.metric;
          if (r.projectStocks.length) stocks.push(r.projectStocks);
        }
        setProgressPct(Math.round(((b + 1) / batches.length) * 100));
      }

      if (cancelled) return;
      setMetricsById(metrics);
      setPerProjectStocks(stocks);
      setDetailsLoading(false);
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [projects, projectsLoading]);

  return useMemo<CommandCenterData>(() => {
    const now = new Date();
    const metricList = Object.values(metricsById);
    const { trend, deltaPct } = buildReportsTrend(reports);
    const { inventory, lowCount } = aggregateInventory(perProjectStocks);

    return {
      detailsLoading,
      progressPct,
      kpis: summarizeKpis(projects),
      kpiDeltas: computeKpiDeltas(projects, now),
      kpiSparklines: {
        total: weeklyCumulative(projects.map((p) => p.created_at), now),
        active: weeklyCumulative(projects.filter((p) => p.status === 'in_progress').map((p) => p.created_at), now),
        completed: weeklyCumulative(projects.filter((p) => p.status === 'completed').map((p) => p.created_at), now),
        reports: weeklyApprovedSeries(reports, now),
      },
      statusBreakdown: summarizeStatus(projects),
      regions: groupByRegion(projects),
      reportsTrend: trend,
      reportsDeltaPct: deltaPct,
      budget: summarizeBudget(metricList, weeklyApprovedSeries(reports, now)),
      engineers: rankEngineers(projects, metricsById),
      schedule: buildSchedule(projects, metricsById),
      inventory,
      inventoryLowCount: lowCount,
      progressByProjectId: metricsById,
    };
  }, [projects, reports, metricsById, perProjectStocks, detailsLoading, progressPct]);
}
