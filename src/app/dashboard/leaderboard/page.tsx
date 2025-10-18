"use client";

import { useEffect, useMemo, useState } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { useRBAC } from '@/hooks/useRBAC';
import { useRouter } from 'next/navigation';
import { Project } from '@/types/projects';
import { ProjectDetailsService } from '@/services/projects/project-details.service';
import { ArrowDown, ArrowUp, AlertTriangle, CheckCircle2, Medal, Trophy, Percent, PiggyBank, User as UserIcon, List } from 'lucide-react';
import { calculateLeaderboardStats, parseNumericValue, roundToTwoDecimals } from '@/utils/project-calculations';

type LeaderboardRow = {
  project: Project;
  targetProgress: number;
  actualProgress: number;
  slippage: number; // target - actual; lower is better
  asOf?: string | null;
};

type SavingsRow = {
  project: Project;
  savingsAmount: number;
  savingsPctOfContract: number;
  asOf?: string | null;
};

type EngineerRow = {
  name: string;
  email?: string;
  avgSlippage: number;
  projectsCount: number;
};

// Utility functions (now imported from centralized utils)

export default function LeaderboardPage() {
  const { user, isSuperAdmin } = useRBAC();
  const router = useRouter();
  const { projects, loading: projectsLoading, error } = useProjects();
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [savings, setSavings] = useState<SavingsRow[]>([]);
  const [savingsAll, setSavingsAll] = useState<SavingsRow[]>([]);
  const [engineers, setEngineers] = useState<EngineerRow[]>([]);
  const [engineersAll, setEngineersAll] = useState<EngineerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [viewMode, setViewMode] = useState<'summary' | 'top' | 'under' | 'savings' | 'engineers'>('summary');
  const [period, setPeriod] = useState<'week' | 'month' | 'overall'>('week');

  // Redirect if not superadmin (double safety; middleware also protects)
  useEffect(() => {
    if (user && !isSuperAdmin) {
      router.replace('/dashboard');
    }
  }, [user, isSuperAdmin, router]);

  // Fetch latest parsed cost + details per project to compute slippage
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const detailsService = new ProjectDetailsService();

        // For each project, pull the latest parsed data via service (respects RLS and latest-approved logic)
        const fetched: LeaderboardRow[] = [];
        const fetchedSavings: SavingsRow[] = [];
        const engineerToStats = new Map<string, { 
          totalSlip: number; 
          count: number; 
          email?: string;
          slippages: number[];
        }>();
        // Determine sinceDate based on selected period
        let sinceDate: Date | null = null;
        if (period === 'week') {
          sinceDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        } else if (period === 'month') {
          sinceDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        }

        // Batch process projects in chunks to avoid overwhelming the API
        const BATCH_SIZE = 5;
        const projectBatches = [];
        for (let i = 0; i < projects.length; i += BATCH_SIZE) {
          projectBatches.push(projects.slice(i, i + BATCH_SIZE));
        }

        for (let batchIndex = 0; batchIndex < projectBatches.length; batchIndex++) {
          const batch = projectBatches[batchIndex];

          // Process batch in parallel
          const batchPromises = batch.map(async (p) => {
            // Skip projects with no parsed data marker if available
            if (p.has_parsed_data === false) return null;

            const details = await detailsService.getProjectDetails(p.id);
            if (!details) return null;

            // Choose the most recent rows within the selected period (arrays are already sorted DESC)
            const chooseWithin = (arr: any[] | undefined | null) => {
              if (!arr || arr.length === 0) return null;
              if (!sinceDate) return arr[0];
              return arr.find((x: any) => new Date(x.created_at) >= sinceDate) || null;
            };
            const latestCost = chooseWithin(details.project_costs);
            const latestDetail = chooseWithin(details.project_details);
            if (!latestCost || !latestDetail) {
              // No data in selected window; skip from this period view
              return null;
            }

            // Use centralized calculation function
            const { targetProgress: targetPct, actualProgress: actualPct, slippage } = calculateLeaderboardStats(latestCost, latestDetail);
            

            // Only include performance leaderboard rows for projects that are IN PROGRESS
            const includePerformance = p.status === 'in_progress';
            const result = includePerformance ? {
              project: p,
              targetProgress: targetPct,
              actualProgress: actualPct,
              slippage,
              asOf: (latestCost as any)?.created_at || (latestDetail as any)?.created_at || null,
            } : null;

            // Savings leaderboard
            const contractAmount = parseNumericValue((latestDetail as any)?.contract_amount);
            const savingsAmt = parseNumericValue((latestCost as any)?.direct_cost_savings);
            const savingsPct = contractAmount > 0 ? roundToTwoDecimals((savingsAmt / contractAmount) * 100) : 0;
            // Only include savings leaderboard rows for projects that are COMPLETED
            const includeSavings = p.status === 'completed';
            const savingsResult = includeSavings ? {
              project: p,
              savingsAmount: savingsAmt,
              savingsPctOfContract: savingsPct,
              asOf: (latestCost as any)?.created_at || null,
            } : null;

            // Site engineer aggregation
            const preferredName = p.project_manager?.display_name?.trim() || (latestDetail as any)?.site_engineer_name?.trim();
            const preferredEmail = p.project_manager?.email || undefined;
            const engineerResult = preferredName ? {
              key: preferredEmail ? `${preferredName}__${preferredEmail}` : preferredName,
              name: preferredName,
              email: preferredEmail,
              slippage,
            } : null;

            return { result, savingsResult, engineerResult };
          });

          const batchResults = await Promise.all(batchPromises);

          // Process batch results
          batchResults.forEach((item) => {
            if (!item) return;

            const { result, savingsResult, engineerResult } = item;
            if (result) fetched.push(result);
            if (savingsResult) fetchedSavings.push(savingsResult);
            if (engineerResult) {
              const existing = engineerToStats.get(engineerResult.key) || { 
                totalSlip: 0, 
                count: 0, 
                email: engineerResult.email,
                slippages: [] as number[] // Store individual slippage values for proper averaging
              };
              existing.slippages.push(engineerResult.slippage);
              existing.totalSlip += engineerResult.slippage;
              existing.count += 1;
              existing.email = engineerResult.email || existing.email;
              engineerToStats.set(engineerResult.key, existing);
            }
          });

          // Update progress
          const progress = Math.round(((batchIndex + 1) / projectBatches.length) * 100);
          setLoadingProgress(progress);
        }

        setRows(fetched);
        const savingsSorted = fetchedSavings.sort((a, b) => b.savingsAmount - a.savingsAmount);
        setSavingsAll(savingsSorted);
        setSavings(savingsSorted.slice(0, 10));
        // Build engineer leaderboard (lower avg slippage is better)
        const engineerRows: EngineerRow[] = Array.from(engineerToStats.entries()).map(([key, s]) => {
          const avgSlippage = s.slippages && s.slippages.length > 0 
            ? roundToTwoDecimals(s.slippages.reduce((sum: number, slip: number) => sum + slip, 0) / s.slippages.length)
            : roundToTwoDecimals(s.totalSlip / Math.max(1, s.count));
          
          // Debug logging for engineer slippage
          if (key.includes('Rafael III Prudente')) {
            console.log('Debug engineer slippage calculation:', {
              engineer: key.split('__')[0],
              slippages: s.slippages,
              avgSlippage,
              projectsCount: s.count,
              totalSlip: s.totalSlip,
              calculation: s.slippages ? `${s.slippages.join(' + ')} / ${s.slippages.length} = ${avgSlippage}%` : `${s.totalSlip} / ${s.count} = ${avgSlippage}%`
            });
          }
          
          return {
            name: key.split('__')[0],
            email: s.email,
            avgSlippage,
            projectsCount: s.count,
          };
        });
        engineerRows.sort((a, b) => a.avgSlippage - b.avgSlippage || b.projectsCount - a.projectsCount || a.name.localeCompare(b.name));
        setEngineersAll(engineerRows);
        setEngineers(engineerRows.slice(0, 10));
      } finally {
        setLoading(false);
      }
    };

    if (!projectsLoading) {
      load();
    }
  }, [projects, projectsLoading, period]);

  const topPerformers = useMemo(() => {
    // Highest slippage (more positive) is best. Ties stable by name.
    return [...rows]
      .sort((a, b) => b.slippage - a.slippage || a.project.project_name.localeCompare(b.project.project_name))
      .slice(0, 10);
  }, [rows]);

  const underPerformers = useMemo(() => {
    // Lowest slippage (more negative) is worst
    return [...rows]
      .sort((a, b) => a.slippage - b.slippage || a.project.project_name.localeCompare(b.project.project_name))
      .slice(0, 10);
  }, [rows]);

  const topPerformersAll = useMemo(() => {
    return [...rows].sort((a, b) => b.slippage - a.slippage || a.project.project_name.localeCompare(b.project.project_name));
  }, [rows]);

  const underPerformersAll = useMemo(() => {
    return [...rows].sort((a, b) => a.slippage - b.slippage || a.project.project_name.localeCompare(b.project.project_name));
  }, [rows]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-yellow-50/20">
      <div className="space-y-6 p-6 lg:p-8">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-amber-500/5 to-orange-500/5 rounded-2xl blur-3xl"></div>
          <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-amber-600 to-yellow-700 bg-clip-text text-transparent">Performance Leaderboard</h1>
                  <p className="text-gray-600 text-sm">Rankings based on slippage • {period === 'week' ? 'Last 7 days' : period === 'month' ? 'Last 30 days' : 'Overall (latest)'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-gray-100 rounded-xl p-1 hidden sm:flex">
                  <button onClick={() => setPeriod('week')} className={`px-3 py-1 rounded-lg text-sm ${period === 'week' ? 'bg-white shadow text-gray-900' : 'text-gray-600'}`}>Week</button>
                  <button onClick={() => setPeriod('month')} className={`px-3 py-1 rounded-lg text-sm ${period === 'month' ? 'bg-white shadow text-gray-900' : 'text-gray-600'}`}>Month</button>
                  <button onClick={() => setPeriod('overall')} className={`px-3 py-1 rounded-lg text-sm ${period === 'overall' ? 'bg-white shadow text-gray-900' : 'text-gray-600'}`}>Overall</button>
                </div>
                <button onClick={() => router.push('/dashboard')} className="rounded-xl px-3 sm:px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700">Back</button>
              </div>
            </div>
          </div>
        </div>

        {viewMode === 'summary' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            <section className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl overflow-hidden">
              <div className="px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-gradient-to-r from-green-50 to-emerald-50">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-600/10 text-emerald-700 flex items-center justify-center"><Medal className="h-4 w-4" /></div>
                  <div className="text-emerald-800 font-semibold text-sm sm:text-base">Top Performing Projects</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setViewMode('top')} className="text-[11px] px-2 py-1 sm:px-2.5 rounded-full bg-white/70 text-emerald-700 hover:bg-white flex items-center gap-1 border border-emerald-200"><List className="h-3.5 w-3.5" /><span className="hidden sm:inline">View all</span></button>
                </div>
              </div>
              <div className="divide-y">
                {loading ? (
                  <div className="p-6 text-center">
                    <div className="text-sm text-gray-500 mb-3">Loading leaderboard...</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-amber-500 h-2 rounded-full transition-all duration-300" style={{ width: `${loadingProgress}%` }}></div>
                    </div>
                    <div className="text-xs text-gray-400 mt-2">{loadingProgress}% complete</div>
                  </div>
                ) : topPerformers.length === 0 ? (
                  <div className="p-6 text-sm text-gray-500">No projects with parsed progress yet.</div>
                ) : (
                  topPerformers.map((r, idx) => (
                    <div key={r.project.id} className="px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3">
                      <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white font-bold ${idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-amber-400' : idx === 2 ? 'bg-amber-300 text-amber-900' : 'bg-emerald-500'}`}>{idx + 1}</div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 text-sm sm:text-base">{r.project.project_name}</div>
                        <div className="text-xs text-gray-500 truncate">{r.project.parsed_project_id || r.project.project_id} • {r.project.client}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs sm:text-sm font-semibold text-emerald-700 flex items-center gap-1 justify-end"><ArrowDown className="h-4 w-4" />{r.slippage.toFixed(2)}%</div>
                        <div className="text-[10px] sm:text-[11px] text-gray-500">Target {r.targetProgress.toFixed(2)}% vs Actual {r.actualProgress.toFixed(2)}%</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl overflow-hidden">
              <div className="px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-gradient-to-r from-yellow-50 to-amber-50">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-600/10 text-amber-700 flex items-center justify-center"><PiggyBank className="h-4 w-4" /></div>
                  <div className="text-amber-800 font-semibold text-sm sm:text-base">Top Savings Projects</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setViewMode('savings')} className="text-[11px] px-2 py-1 sm:px-2.5 rounded-full bg-white/70 text-amber-700 hover:bg-white flex items-center gap-1 border border-amber-200"><List className="h-3.5 w-3.5" /><span className="hidden sm:inline">View all</span></button>              </div>
              </div>
              <div className="divide-y">
                {loading ? (
                  <div className="p-6 text-center">
                    <div className="text-sm text-gray-500 mb-3">Loading leaderboard...</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-amber-500 h-2 rounded-full transition-all duration-300" style={{ width: `${loadingProgress}%` }}></div>
                    </div>
                    <div className="text-xs text-gray-400 mt-2">{loadingProgress}% complete</div>
                  </div>
                ) : savings.length === 0 ? (
                  <div className="p-6 text-sm text-gray-500">No savings data available.</div>
                ) : (
                  savings.map((s, idx) => (
                    <div key={s.project.id} className="px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3">
                      <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white font-bold ${idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-yellow-400' : idx === 2 ? 'bg-yellow-300 text-amber-900' : 'bg-amber-500'}`}>{idx + 1}</div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 text-sm sm:text-base">{s.project.project_name}</div>
                        <div className="text-xs text-gray-500 truncate">{s.project.parsed_project_id || s.project.project_id} • {s.project.client}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs sm:text-sm font-semibold text-amber-700">₱{s.savingsAmount.toLocaleString()}</div>
                        <div className="text-[10px] sm:text-[11px] text-gray-500">{s.savingsPctOfContract.toFixed(2)}% of contract</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl overflow-hidden">
              <div className="px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-gradient-to-r from-blue-50 to-cyan-50">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-600/10 text-blue-700 flex items-center justify-center"><UserIcon className="h-4 w-4" /></div>
                  <div className="text-blue-800 font-semibold text-sm sm:text-base">Top Site Engineers</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setViewMode('engineers')} className="text-[11px] px-2 py-1 sm:px-2.5 rounded-full bg-white/70 text-blue-700 hover:bg-white flex items-center gap-1 border border-blue-200"><List className="h-3.5 w-3.5" /><span className="hidden sm:inline">View all</span></button>              </div>
              </div>
              <div className="divide-y">
                {loading ? (
                  <div className="p-6 text-center">
                    <div className="text-sm text-gray-500 mb-3">Loading leaderboard...</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-amber-500 h-2 rounded-full transition-all duration-300" style={{ width: `${loadingProgress}%` }}></div>
                    </div>
                    <div className="text-xs text-gray-400 mt-2">{loadingProgress}% complete</div>
                  </div>
                ) : engineers.length === 0 ? (
                  <div className="p-6 text-sm text-gray-500">No site engineer data available.</div>
                ) : (
                  engineers.map((e, idx) => (
                    <div key={e.name} className="px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3">
                      <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white font-bold ${idx === 0 ? 'bg-blue-500' : idx === 1 ? 'bg-blue-400' : idx === 2 ? 'bg-blue-300 text-blue-900' : 'bg-cyan-500'}`}>{idx + 1}</div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 text-sm sm:text-base">{e.name}</div>
                        <div className="text-xs text-gray-500 truncate">{e.projectsCount} project{e.projectsCount !== 1 ? 's' : ''}{e.email ? ` • ${e.email}` : ''}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs sm:text-sm font-semibold text-blue-700 flex items-center gap-1 justify-end"><ArrowDown className="h-4 w-4" />{e.avgSlippage.toFixed(2)}%</div>
                        <div className="text-[10px] sm:text-[11px] text-gray-500">Avg slippage</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        ) : (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl overflow-hidden">
            <div className="px-6 py-4 flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="font-semibold text-gray-700">
                {viewMode === 'top' && 'All Top Performing Projects'}
                {viewMode === 'under' && 'All Underperforming Projects'}
                {viewMode === 'savings' && 'All Savings Projects'}
                {viewMode === 'engineers' && 'All Site Engineers'}
              </div>
              <div className="flex items-center gap-2">
                {viewMode !== 'under' && viewMode === 'top' && (
                  <button onClick={() => setViewMode('under')} className="text-xs text-rose-700 hover:underline">View Bottom</button>
                )}
                <button onClick={() => setViewMode('summary')} className="text-xs text-gray-700 hover:underline">Back to summary</button>
              </div>
            </div>
            <div className="divide-y">
              {loading ? (
                <div className="p-6 text-center">
                  <div className="text-sm text-gray-500 mb-3">Loading...</div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-amber-500 h-2 rounded-full transition-all duration-300" style={{ width: `${loadingProgress}%` }}></div>
                  </div>
                  <div className="text-xs text-gray-400 mt-2">{loadingProgress}% complete</div>
                </div>
              ) : viewMode === 'top' ? (
                topPerformersAll.map((r, idx) => (
                  <div key={r.project.id} className="px-6 py-4 flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-amber-400' : idx === 2 ? 'bg-amber-300 text-amber-900' : 'bg-emerald-500'}`}>{idx + 1}</div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 text-sm">{r.project.project_name}</div>
                      <div className="text-xs text-gray-500">{r.project.parsed_project_id || r.project.project_id} • {r.project.client}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-emerald-700 flex items-center gap-1 justify-end"><ArrowDown className="h-4 w-4" />{r.slippage.toFixed(2)}%</div>
                      <div className="text-[11px] text-gray-500">Target {r.targetProgress.toFixed(1)}% vs Actual {r.actualProgress.toFixed(1)}%</div>
                    </div>
                  </div>
                ))
              ) : viewMode === 'under' ? (
                underPerformersAll.map((r, idx) => (
                  <div key={r.project.id} className="px-6 py-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-rose-500 text-white font-bold flex items-center justify-center">{idx + 1}</div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 text-sm">{r.project.project_name}</div>
                      <div className="text-xs text-gray-500">{r.project.parsed_project_id || r.project.project_id} • {r.project.client}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-rose-700 flex items-center gap-1 justify-end"><ArrowUp className="h-4 w-4" />{r.slippage.toFixed(2)}%</div>
                      <div className="text-[11px] text-gray-500">Target {r.targetProgress.toFixed(1)}% vs Actual {r.actualProgress.toFixed(1)}%</div>
                    </div>
                  </div>
                ))
              ) : viewMode === 'savings' ? (
                savingsAll.map((s, idx) => (
                  <div key={s.project.id} className="px-6 py-4 flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-yellow-400' : idx === 2 ? 'bg-yellow-300 text-amber-900' : 'bg-amber-500'}`}>{idx + 1}</div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 text-sm">{s.project.project_name}</div>
                      <div className="text-xs text-gray-500">{s.project.project_id} • {s.project.client}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-amber-700">₱{s.savingsAmount.toLocaleString()}</div>
                      <div className="text-[11px] text-gray-500">{s.savingsPctOfContract.toFixed(2)}% of contract</div>
                    </div>
                  </div>
                ))
              ) : (
                engineersAll.map((e, idx) => (
                  <div key={`${e.name}-${e.email || 'na'}`} className="px-6 py-4 flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${idx === 0 ? 'bg-blue-500' : idx === 1 ? 'bg-blue-400' : idx === 2 ? 'bg-blue-300 text-blue-900' : 'bg-cyan-500'}`}>{idx + 1}</div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 text-sm">{e.name}</div>
                      <div className="text-xs text-gray-500">{e.projectsCount} project{e.projectsCount !== 1 ? 's' : ''}{e.email ? ` • ${e.email}` : ''}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-blue-700 flex items-center gap-1 justify-end"><ArrowDown className="h-4 w-4" />{e.avgSlippage.toFixed(2)}%</div>
                      <div className="text-[11px] text-gray-500">Avg slippage</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



