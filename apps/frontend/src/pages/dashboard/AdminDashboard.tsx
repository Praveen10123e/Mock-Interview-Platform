import React from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  Award,
  Terminal,
  Code2,
  BookOpen,
  Server,
  Activity,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  Zap,
  TrendingUp,
  Layers,
  Database,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useAdminDashboard } from '../../api/admin';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';

export const AdminDashboard: React.FC = () => {
  const { data, isLoading, isError, error, refetch, isFetching } = useAdminDashboard();

  return (
    <div className="min-h-screen bg-background text-foreground pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* ── Hero Header ─────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                System Administration
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-accent/15 border border-accent/30 text-accent font-medium font-mono">
                  Super Admin
                </span>
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Monitor users, assessments, interview activity, platform performance, and system health.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="border-border hover:bg-surface-elevated text-xs flex items-center gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin text-accent' : ''}`} />
              Refresh Data
            </Button>
          </div>
        </div>

        {/* ── Loading State ───────────────────────────────────────────────── */}
        {isLoading && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-xl bg-surface border border-border" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Skeleton className="h-72 rounded-xl bg-surface border border-border" />
              <Skeleton className="h-72 rounded-xl bg-surface border border-border" />
            </div>
          </div>
        )}

        {/* ── Error State ─────────────────────────────────────────────────── */}
        {isError && (
          <div className="p-6 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
              <div>
                <p className="font-semibold">Failed to load system administrative metrics</p>
                <p className="text-xs text-rose-400 mt-0.5">
                  {(error as any)?.response?.data?.error?.message || (error as any)?.message || 'An unexpected error occurred.'}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="text-xs border-rose-500/30">
              Try Again
            </Button>
          </div>
        )}

        {/* ── Authenticated Admin Banner ──────────────────────────────────── */}
        {!isLoading && data && (
          <div className="bg-surface border border-border rounded-2xl p-5 relative overflow-hidden shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 border border-accent/40 flex items-center justify-center text-white font-bold font-mono text-lg shrink-0">
                SA
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white tracking-tight">{data.adminProfile.fullName}</h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                    AUTHORIZED
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-mono">
                  {data.adminProfile.email} • {data.adminProfile.designation} • {data.adminProfile.department}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto text-xs text-muted-foreground bg-surface-elevated px-3 py-1.5 rounded-lg border border-border">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Scope: <strong className="text-white">Platform-Wide</strong></span>
            </div>
          </div>
        )}

        {/* ── Main Dashboard Content ──────────────────────────────────────── */}
        {!isLoading && data && (
          <div className="space-y-8">
            {/* ── 8 Platform KPI Cards ──────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Card 1: Total Registered Users */}
              <div className="bg-surface border border-border rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-medium">Total Registered Users</span>
                  <Users className="h-4 w-4 text-blue-400" />
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-bold text-white">{data.overview.totalUsers}</span>
                  <span className="text-[11px] text-muted-foreground block mt-0.5">
                    {data.overview.totalStudents} Students • {data.overview.totalFaculty} Faculty • {data.overview.totalAdmins} Admin
                  </span>
                </div>
              </div>

              {/* Card 2: Completed Assessments */}
              <div className="bg-surface border border-border rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-medium">Completed Assessments</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-bold text-emerald-400">{data.overview.completedAssessments}</span>
                  <span className="text-[11px] text-muted-foreground block mt-0.5">
                    Finalized Sessions across Cohorts
                  </span>
                </div>
              </div>

              {/* Card 3: In-Progress Assessments */}
              <div className="bg-surface border border-border rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-medium">Active In-Progress</span>
                  <Clock className="h-4 w-4 text-amber-400" />
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-bold text-amber-400">{data.overview.inProgressAssessments}</span>
                  <span className="text-[11px] text-muted-foreground block mt-0.5">
                    Active Evaluation Sessions
                  </span>
                </div>
              </div>

              {/* Card 4: Platform Average Score */}
              <div className="bg-surface border border-border rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-medium">Platform Average Score</span>
                  <Award className="h-4 w-4 text-accent" />
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-bold text-accent">
                    {data.overview.averageOverallScore !== null ? `${data.overview.averageOverallScore}%` : 'Data unavailable'}
                  </span>
                  <span className="text-[11px] text-muted-foreground block mt-0.5">
                    Cohort Mean Finalized Score
                  </span>
                </div>
              </div>

              {/* Card 5: Official Code Submissions */}
              <div className="bg-surface border border-border rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-medium">Official Submissions</span>
                  <Terminal className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-white">{data.overview.totalOfficialSubmissions}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-elevated text-muted-foreground border border-border">
                    {data.overview.totalTestRuns} Runs
                  </span>
                </div>
              </div>

              {/* Card 6: Submission Acceptance Rate */}
              <div className="bg-surface border border-border rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-medium">Coding Acceptance Rate</span>
                  <Code2 className="h-4 w-4 text-cyan-400" />
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-bold text-cyan-400">
                    {data.overview.submissionAcceptanceRate !== null ? `${data.overview.submissionAcceptanceRate}%` : 'Data unavailable'}
                  </span>
                  <span className="text-[11px] text-muted-foreground block mt-0.5">
                    {data.codingAnalytics.acceptedSubmissions}/{data.overview.totalOfficialSubmissions} Solved Official
                  </span>
                </div>
              </div>

              {/* Card 7: Published Questions */}
              <div className="bg-surface border border-border rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-medium">Published Questions</span>
                  <BookOpen className="h-4 w-4 text-purple-400" />
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-bold text-purple-400">{data.questionBank.publishedQuestions}</span>
                  <span className="text-[11px] text-muted-foreground block mt-0.5">
                    Curated Benchmarks ({data.questionBank.totalQuestions.toLocaleString()} total)
                  </span>
                </div>
              </div>

              {/* Card 8: System Health Status */}
              <div className="bg-surface border border-border rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-medium">System Health</span>
                  <Activity className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-xl font-bold text-emerald-400 font-mono">{data.systemHealth.overallStatus}</span>
                  <span className="text-[10px] text-muted-foreground">6 Microservices</span>
                </div>
              </div>
            </div>

            {/* ── Row 1: Platform Performance Trend & Assessment Lifecycle ──── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Activity Trend AreaChart */}
              <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-accent" />
                    <h3 className="text-sm font-semibold text-white">Platform Assessment Activity & Score Trend</h3>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {data.performanceTrend.length} Historical Evaluation Dates
                  </span>
                </div>

                {data.performanceTrend.length > 0 ? (
                  <div className="h-64 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={data.performanceTrend}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="adminTrendGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                        <XAxis
                          dataKey="date"
                          stroke="#737373"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          stroke="#737373"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          domain={[0, 100]}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#171717',
                            borderColor: '#262626',
                            borderRadius: '0.5rem',
                            fontSize: '12px',
                            color: '#fff',
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="averageScore"
                          name="Avg Score (%)"
                          stroke="#6366f1"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#adminTrendGrad)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-xs text-muted-foreground">
                    Not enough completed assessments to display activity trend.
                  </div>
                )}
              </div>

              {/* Right 1 Col: Assessment Lifecycle & Score Breakdown */}
              <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
                <div className="border-b border-border pb-3">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Layers className="h-4 w-4 text-purple-400" />
                    Lifecycle & Round Scores
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Platform-wide evaluation averages
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Total Sessions Initiated</span>
                      <span className="font-mono text-white font-semibold">{data.overview.totalAssessments}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-surface-elevated overflow-hidden flex">
                      <div
                        className="h-full bg-emerald-500"
                        style={{
                          width: `${(data.overview.completedAssessments / (data.overview.totalAssessments || 1)) * 100}%`,
                        }}
                      />
                      <div
                        className="h-full bg-amber-500"
                        style={{
                          width: `${(data.overview.inProgressAssessments / (data.overview.totalAssessments || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Aptitude Component Mean:</span>
                      <span className="font-mono text-purple-400 font-semibold">
                        {data.overview.averageAptitudeScore !== null ? `${data.overview.averageAptitudeScore}%` : '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Coding Component Mean:</span>
                      <span className="font-mono text-cyan-400 font-semibold">
                        {data.overview.averageCodingScore !== null ? `${data.overview.averageCodingScore}%` : '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">HR Behavioral Component Mean:</span>
                      <span className="font-mono text-pink-400 font-semibold">
                        {data.overview.averageHrScore !== null ? `${data.overview.averageHrScore}%` : '—'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border text-[11px] text-muted-foreground">
                    Interview Templates: <strong className="text-white">{data.templates.publishedCount} published</strong> ({data.templates.totalTemplates} total)
                  </div>
                </div>
              </div>
            </div>

            {/* ── Row 2: Coding Infrastructure & Question Bank Breakdown ─────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Coding & Execution Ecosystem */}
              <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <Code2 className="h-4 w-4 text-cyan-400" />
                    <h3 className="text-sm font-semibold text-white">Coding & Execution Ecosystem</h3>
                  </div>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {data.codingAnalytics.totalExecutions} Total Executions
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-surface-elevated border border-border">
                    <span className="text-[11px] text-muted-foreground block">Test Runs (RUN)</span>
                    <span className="text-lg font-bold text-white font-mono">{data.codingAnalytics.testRunsCount}</span>
                    <span className="text-[10px] text-muted-foreground block mt-0.5">Local testing</span>
                  </div>
                  <div className="p-3 rounded-lg bg-surface-elevated border border-border">
                    <span className="text-[11px] text-muted-foreground block">Official Submissions</span>
                    <span className="text-lg font-bold text-cyan-400 font-mono">
                      {data.codingAnalytics.officialSubmissionsCount}
                    </span>
                    <span className="text-[10px] text-muted-foreground block mt-0.5">Evaluated solutions</span>
                  </div>
                </div>

                {/* Verdict Distribution Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-[10px] text-emerald-300 block">Accepted</span>
                    <span className="font-bold text-emerald-400 font-mono">{data.codingAnalytics.verdictDistribution.accepted}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                    <span className="text-[10px] text-rose-300 block">Wrong Ans</span>
                    <span className="font-bold text-rose-400 font-mono">{data.codingAnalytics.verdictDistribution.wrongAnswer}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <span className="text-[10px] text-amber-300 block">Compile Err</span>
                    <span className="font-bold text-amber-400 font-mono">{data.codingAnalytics.verdictDistribution.compilationError}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <span className="text-[10px] text-orange-300 block">Runtime Err</span>
                    <span className="font-bold text-orange-400 font-mono">{data.codingAnalytics.verdictDistribution.runtimeError}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <span className="text-[10px] text-blue-300 block">TLE</span>
                    <span className="font-bold text-blue-400 font-mono">{data.codingAnalytics.verdictDistribution.timeLimitExceeded}</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-surface-elevated/40 border border-border flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Test Case Aggregate Pass Rate</span>
                  <span className="font-mono text-white font-semibold">
                    {data.codingAnalytics.testsPassedCount}/{data.codingAnalytics.totalTestsCount} ({data.codingAnalytics.testCasePassRate ?? 0}%)
                  </span>
                </div>
              </div>

              {/* Right: Question Bank & Curricular Datasets */}
              <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-purple-400" />
                    <h3 className="text-sm font-semibold text-white">Question Bank & Curricula</h3>
                  </div>
                  <span className="text-[11px] text-purple-400 font-mono font-semibold">
                    {data.questionBank.publishedQuestions} Active Curated
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2.5 rounded-lg bg-surface-elevated border border-border">
                      <span className="text-[10px] text-muted-foreground block">Curated Benchmark</span>
                      <span className="text-base font-bold text-purple-400 font-mono">{data.questionBank.publishedQuestions}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-surface-elevated border border-border">
                      <span className="text-[10px] text-muted-foreground block">Total Dataset Records</span>
                      <span className="text-base font-bold text-white font-mono">{data.questionBank.totalQuestions.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border">
                    <span className="text-[11px] text-muted-foreground block mb-2 font-medium">Top Curricular Categories</span>
                    <div className="grid grid-cols-2 gap-2">
                      {data.questionBank.categories.map((c) => (
                        <div key={c.name} className="flex items-center justify-between p-2 rounded-md bg-surface-elevated/40 border border-border/60">
                          <span className="text-white truncate pr-2">{c.name}</span>
                          <span className="font-mono text-muted-foreground text-[11px]">{c.count.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Row 3: Live System Health & Microservices Architecture ───────── */}
            <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-emerald-400" />
                  <h3 className="text-sm font-semibold text-white">Live Microservices & Platform Health</h3>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-400 font-mono font-semibold">ALL SERVICES OPERATIONAL</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {data.systemHealth.services.map((svc) => (
                  <div key={svc.name} className="p-3 rounded-lg bg-surface-elevated border border-border space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-white truncate">{svc.name}</span>
                      <span
                        className={`h-2 w-2 rounded-full ${
                          svc.status === 'Healthy' ? 'bg-emerald-400' : 'bg-rose-400'
                        }`}
                      />
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono flex items-center justify-between">
                      <span>Port {svc.port}</span>
                      <span className="text-emerald-400 font-semibold">{svc.latency}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-lg bg-surface-elevated/40 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Database className="h-3.5 w-3.5 text-accent" />
                  Database Cluster: <strong className="text-white">auth_db, user_db, interview_db, question_db</strong>
                </span>
                <span className="text-emerald-400 font-mono font-medium">PostgreSQL Connected (Port 5432)</span>
              </div>
            </div>

            {/* ── Row 4: Operational Attention & Recent Activity ───────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Operational Attention */}
              <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
                <div className="border-b border-border pb-3">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-400" />
                    Operational Signals & Alerts
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Evidence-based system notifications and cohort indicators
                  </p>
                </div>

                <div className="space-y-3">
                  {data.attentionItems.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border space-y-1 text-xs ${
                        item.severity === 'HIGH'
                          ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                          : item.severity === 'MEDIUM'
                          ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                          : 'border-blue-500/30 bg-blue-500/10 text-blue-300'
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold">
                        <span>{item.title}</span>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface border border-border">
                          {item.count} items
                        </span>
                      </div>
                      <p className="text-[11px] opacity-90">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Recent Platform Activity */}
              <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
                <div className="border-b border-border pb-3">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Activity className="h-4 w-4 text-accent" />
                    Recent Platform Activity Stream
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Real-time assessment completions, submissions, and events
                  </p>
                </div>

                <div className="space-y-2.5">
                  {data.recentActivities.map((act) => (
                    <div
                      key={act.id}
                      className="p-2.5 rounded-lg bg-surface-elevated/50 border border-border/60 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5 min-w-0 pr-3">
                        <span className="font-medium text-white truncate block">{act.title}</span>
                        <p className="text-[11px] text-muted-foreground truncate">{act.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        {act.badge && (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold block ${
                              act.badgeVariant === 'success'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {act.badge}
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground/80 mt-0.5 block">
                          {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
