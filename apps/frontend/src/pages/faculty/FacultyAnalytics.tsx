import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Users,
  CheckCircle2,
  Clock,
  Award,
  Brain,
  Code2,
  MessageSquare,
  Terminal,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  RotateCcw,
  BarChart3,
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
import { useFacultyAnalytics } from '../../api/faculty';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';

export const FacultyAnalytics: React.FC = () => {
  const navigate = useNavigate();

  // Filters State
  const [templateId, setTemplateId] = useState<string>('ALL');
  const [department, setDepartment] = useState<string>('ALL');
  const [dateRange, setDateRange] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [studentSearch, setStudentSearch] = useState<string>('');

  const { data, isLoading, isError, error, refetch, isFetching } = useFacultyAnalytics({
    templateId: templateId !== 'ALL' ? templateId : undefined,
    department: department !== 'ALL' ? department : undefined,
    dateRange: dateRange !== 'all' ? dateRange : undefined,
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
  });

  const handleResetFilters = () => {
    setTemplateId('ALL');
    setDepartment('ALL');
    setDateRange('all');
    setStatusFilter('ALL');
    setStudentSearch('');
  };

  const filteredStudentRoster = (data?.studentRoster || []).filter((s) => {
    if (!studentSearch.trim()) return true;
    const q = studentSearch.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.department.toLowerCase().includes(q) ||
      s.rollNumber.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-background text-foreground pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
                  Cohort Analytics & Insights
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">
                    Live Verified Data
                  </span>
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Deep evidence-based performance insights, topic accuracy, coding verdicts & evaluation metrics across all students.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
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
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="border-border hover:bg-surface-elevated text-xs flex items-center gap-1.5 text-muted-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Filters
            </Button>
          </div>
        </div>

        {/* ── Filters Bar ────────────────────────────────────────────────────── */}
        <div className="bg-surface border border-border rounded-xl p-4 flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground font-medium">
            <Filter className="h-3.5 w-3.5 text-accent" />
            Filters:
          </div>

          {/* Template Filter */}
          <div className="flex items-center gap-1.5">
            <label className="text-muted-foreground">Template:</label>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="bg-surface-elevated border border-border text-foreground rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-accent text-xs"
            >
              <option value="ALL">All Assessments</option>
              {data?.filterOptions?.templates?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.type})
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-1.5">
            <label className="text-muted-foreground">Department:</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="bg-surface-elevated border border-border text-foreground rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-accent text-xs"
            >
              <option value="ALL">All Departments</option>
              {data?.filterOptions?.departments?.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Filter */}
          <div className="flex items-center gap-1.5">
            <label className="text-muted-foreground">Date Window:</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-surface-elevated border border-border text-foreground rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-accent text-xs"
            >
              <option value="all">All Time</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <label className="text-muted-foreground">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-surface-elevated border border-border text-foreground rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-accent text-xs"
            >
              <option value="ALL">All States</option>
              <option value="COMPLETED">Completed</option>
              <option value="RUNNING">In Progress</option>
            </select>
          </div>
        </div>

        {/* ── Loading / Error State ─────────────────────────────────────────── */}
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl bg-surface border border-border" />
            ))}
          </div>
        )}

        {isError && (
          <div className="p-6 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
            <div>
              <p className="font-semibold">Failed to load faculty analytics</p>
              <p className="text-xs text-rose-400 mt-0.5">{(error as any)?.message || 'An unexpected error occurred.'}</p>
            </div>
          </div>
        )}

        {/* ── Main Analytics Dashboard ──────────────────────────────────────── */}
        {!isLoading && data && (
          <div className="space-y-8">
            {/* ── KPI Summary Cards (8 cards) ────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Card 1: Total Registered Students */}
              <div className="bg-surface border border-border rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-medium">Total Registered Students</span>
                  <Users className="h-4 w-4 text-blue-400" />
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-bold text-white">{data.overview.totalStudents}</span>
                  <span className="text-[11px] text-muted-foreground ml-2">Unique Candidates</span>
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
                  <span className="text-[11px] text-muted-foreground ml-2">Finalized Sessions</span>
                </div>
              </div>

              {/* Card 3: In-Progress Assessments */}
              <div className="bg-surface border border-border rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-medium">In-Progress Assessments</span>
                  <Clock className="h-4 w-4 text-amber-400" />
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-bold text-amber-400">{data.overview.inProgressAssessments}</span>
                  <span className="text-[11px] text-muted-foreground ml-2">Active Sessions</span>
                </div>
              </div>

              {/* Card 4: Average Overall Score */}
              <div className="bg-surface border border-border rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-medium">Average Overall Score</span>
                  <Award className="h-4 w-4 text-accent" />
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-bold text-accent">
                    {data.overview.averageOverallScore !== null ? `${data.overview.averageOverallScore}%` : 'Data unavailable'}
                  </span>
                  {data.overview.averageOverallScore !== null && (
                    <span className="text-[11px] text-muted-foreground ml-2">
                      ({data.overview.overallScoresDenominator || data.overview.completedAssessments} reports)
                    </span>
                  )}
                </div>
              </div>

              {/* Card 5: Aptitude Accuracy */}
              <div className="bg-surface border border-border rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-medium">Aptitude Accuracy</span>
                  <Brain className="h-4 w-4 text-purple-400" />
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-bold text-purple-400">
                    {data.overview.aptitudeAccuracy !== null ? `${data.overview.aptitudeAccuracy}%` : 'Data unavailable'}
                  </span>
                  {data.overview.aptitudeAttemptedCount ? (
                    <span className="text-[11px] text-muted-foreground ml-2">
                      {data.overview.aptitudeCorrectCount}/{data.overview.aptitudeAttemptedCount} correct
                    </span>
                  ) : (
                    <span className="text-[11px] text-muted-foreground ml-2">Questions</span>
                  )}
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
                    {data.overview.codingAcceptanceRate !== null ? `${data.overview.codingAcceptanceRate}%` : 'Data unavailable'}
                  </span>
                  {data.overview.codingSubmissionCount ? (
                    <span className="text-[11px] text-muted-foreground ml-2">
                      {data.overview.codingAcceptedCount}/{data.overview.codingSubmissionCount} solved
                    </span>
                  ) : (
                    <span className="text-[11px] text-muted-foreground ml-2">Submissions</span>
                  )}
                </div>
              </div>

              {/* Card 7: HR Completion Rate */}
              <div className="bg-surface border border-border rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-medium">HR Round Completion</span>
                  <MessageSquare className="h-4 w-4 text-pink-400" />
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-bold text-pink-400">
                    {data.overview.hrCompletionRate !== null ? `${data.overview.hrCompletionRate}%` : (data.hrAnalytics.hasData ? `${data.hrAnalytics.totalResponsesCount} responses` : 'Not evaluated')}
                  </span>
                  <span className="text-[11px] text-muted-foreground ml-2">
                    {data.hrAnalytics.completedSessionsCount}/{data.overview.completedAssessments} sessions
                  </span>
                </div>
              </div>

              {/* Card 8: Official Code Submissions (RUN vs SUBMIT separated) */}
              <div className="bg-surface border border-border rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-medium">Official Submissions</span>
                  <Terminal className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-white">{data.overview.totalSubmissions}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-elevated text-muted-foreground border border-border">
                    {data.overview.totalRuns} Test Runs
                  </span>
                </div>
              </div>
            </div>

            {/* ── Row 2: Performance Trend & Students Needing Attention ──────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Performance Trend Chart (2 cols) */}
              <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-5 flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-accent" />
                      Cohort Performance Trend
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Average overall assessment scores over time (derived strictly from completed reports).
                    </p>
                  </div>
                  {data.performanceTrend.length > 0 && (
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-accent/10 border border-accent/20 text-accent font-semibold">
                      {data.performanceTrend.length} Evaluation Cycles
                    </span>
                  )}
                </div>

                {data.performanceTrend.length > 0 ? (
                  <div className="h-64 w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.performanceTrend} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis
                          dataKey="date"
                          stroke="#64748b"
                          fontSize={11}
                          tickLine={false}
                          axisLine={{ stroke: '#334155' }}
                        />
                        <YAxis
                          domain={[0, 100]}
                          stroke="#64748b"
                          fontSize={11}
                          tickLine={false}
                          axisLine={{ stroke: '#334155' }}
                          tickFormatter={(v) => `${v}%`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            borderColor: '#334155',
                            borderRadius: '0.75rem',
                            fontSize: '12px',
                            color: '#fff',
                          }}
                          formatter={(value: any) => [`${value}%`, 'Average Score']}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Area
                          type="monotone"
                          dataKey="averageScore"
                          stroke="#6366f1"
                          strokeWidth={2.5}
                          fill="url(#scoreGradient)"
                          dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#0f172a' }}
                          activeDot={{ r: 6, fill: '#818cf8' }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 rounded-lg bg-surface-elevated/50 border border-border border-dashed flex flex-col items-center justify-center p-6 text-center">
                    <BarChart3 className="h-8 w-8 text-muted-foreground/50 mb-2" />
                    <p className="text-xs font-semibold text-muted-foreground">Not Enough Trend Data</p>
                    <p className="text-[11px] text-muted-foreground/70 max-w-sm mt-1">
                      Performance trend points will populate automatically as more student assessments are completed.
                    </p>
                  </div>
                )}
              </div>

              {/* Students Needing Attention (1 col) */}
              <div className="bg-surface border border-border rounded-xl p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                    Students Needing Attention
                    <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold font-mono">
                      {data.studentsNeedingAttention.length}
                    </span>
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Evidence-based flags (Overall score &lt;50% or ≥3 failed executions).
                  </p>
                </div>

                <div className="space-y-2.5 overflow-y-auto max-h-64 pr-1">
                  {data.studentsNeedingAttention.length > 0 ? (
                    data.studentsNeedingAttention.map((st) => (
                      <div
                        key={st.id}
                        onClick={() => navigate(`/faculty/students/${st.id}`)}
                        className="p-3 rounded-lg bg-surface-elevated/60 border border-border hover:border-amber-500/40 hover:bg-surface-elevated cursor-pointer transition-all space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-white hover:text-accent transition-colors">
                            {st.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/20">
                            {st.performanceScore}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-tight line-clamp-2">
                          {st.reason}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/50">
                          <span>{st.department}</span>
                          <span>Active: {st.lastActive}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-44 rounded-lg bg-surface-elevated/40 border border-border/60 flex flex-col items-center justify-center p-4 text-center">
                      <CheckCircle2 className="h-7 w-7 text-emerald-400/70 mb-1.5" />
                      <p className="text-xs font-semibold text-white">All Students on Track</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        No critical performance flags or repeated submission failures recorded.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Row 3: Round-Specific Deep Dives (Aptitude & Coding) ───────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Aptitude Deep Dive */}
              <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                      <Brain className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">Aptitude Performance by Topic</h3>
                      <p className="text-[11px] text-muted-foreground">Topic-level question accuracy across all candidates</p>
                    </div>
                  </div>
                  {data.aptitudeAnalytics.accuracyPercentage !== null && (
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground">Overall Accuracy: </span>
                      <span className="text-xs font-bold text-purple-400 font-mono">
                        {data.aptitudeAnalytics.accuracyPercentage}%
                      </span>
                    </div>
                  )}
                </div>

                {data.aptitudeAnalytics.topicBreakdown.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-muted-foreground border-b border-border/70 text-left">
                          <th className="pb-2 font-medium">Topic Name</th>
                          <th className="pb-2 font-medium text-center">Attempted</th>
                          <th className="pb-2 font-medium text-center">Correct</th>
                          <th className="pb-2 font-medium text-right">Accuracy Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {data.aptitudeAnalytics.topicBreakdown.map((t) => (
                          <tr key={t.topic} className="hover:bg-surface-elevated/40">
                            <td className="py-2.5 font-medium text-white">{t.topic}</td>
                            <td className="py-2.5 text-center text-muted-foreground font-mono">{t.attempted}</td>
                            <td className="py-2.5 text-center text-emerald-400 font-mono">{t.correct}</td>
                            <td className="py-2.5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-16 h-1.5 rounded-full bg-surface-elevated overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-purple-500"
                                    style={{ width: `${Math.min(100, t.accuracy)}%` }}
                                  />
                                </div>
                                <span className="font-mono font-semibold text-white w-10 text-right">
                                  {t.accuracy}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    No aptitude assessment data recorded for this filter.
                  </div>
                )}
              </div>

              {/* Coding Deep Dive */}
              <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                      <Code2 className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">Coding Verdict Breakdown</h3>
                      <p className="text-[11px] text-muted-foreground">
                        Official Submission outcomes (RUN executions strictly separated)
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground">Acceptance Rate: </span>
                    <span className="text-xs font-bold text-cyan-400 font-mono">
                      {data.codingAnalytics.submissionAcceptanceRate !== null && data.codingAnalytics.submissionAcceptanceRate !== undefined
                        ? `${data.codingAnalytics.submissionAcceptanceRate}%`
                        : (data.codingAnalytics.testPassRate !== null ? `${data.codingAnalytics.testPassRate}%` : '—')}
                    </span>
                  </div>
                </div>

                {data.codingAnalytics.hasData ? (
                  <div className="space-y-4">
                    {/* Execution Modes Comparison */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-surface-elevated/60 border border-border flex items-center justify-between">
                        <div>
                          <span className="text-[11px] text-muted-foreground block">Test Runs (RUN)</span>
                          <span className="text-lg font-bold text-white font-mono">
                            {data.codingAnalytics.runAttemptsCount}
                          </span>
                          <span className="text-[10px] text-muted-foreground/70 block">Local testing</span>
                        </div>
                        <Terminal className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="p-3 rounded-lg bg-surface-elevated/60 border border-border flex items-center justify-between">
                        <div>
                          <span className="text-[11px] text-muted-foreground block">Official Submissions (SUBMIT)</span>
                          <span className="text-lg font-bold text-cyan-400 font-mono">
                            {data.codingAnalytics.submitAttemptsCount}
                          </span>
                          <span className="text-[10px] text-muted-foreground/70 block">Evaluated solutions</span>
                        </div>
                        <Award className="h-5 w-5 text-cyan-400" />
                      </div>
                    </div>

                    {/* Verdict Distribution Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <span className="text-[10px] text-emerald-300 font-medium block">Accepted (Passed)</span>
                        <div className="flex items-baseline gap-1.5 mt-0.5">
                          <span className="text-base font-bold text-emerald-400 font-mono">
                            {data.codingAnalytics.verdictDistribution.accepted}
                          </span>
                          {data.codingAnalytics.verdictPercentages && (
                            <span className="text-[10px] text-emerald-400/80 font-mono">
                              ({data.codingAnalytics.verdictPercentages.accepted}%)
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
                        <span className="text-[10px] text-rose-300 font-medium block">Wrong Answer</span>
                        <div className="flex items-baseline gap-1.5 mt-0.5">
                          <span className="text-base font-bold text-rose-400 font-mono">
                            {data.codingAnalytics.verdictDistribution.wrongAnswer}
                          </span>
                          {data.codingAnalytics.verdictPercentages && (
                            <span className="text-[10px] text-rose-400/80 font-mono">
                              ({data.codingAnalytics.verdictPercentages.wrongAnswer}%)
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <span className="text-[10px] text-amber-300 font-medium block">Compilation Error</span>
                        <div className="flex items-baseline gap-1.5 mt-0.5">
                          <span className="text-base font-bold text-amber-400 font-mono">
                            {data.codingAnalytics.verdictDistribution.compilationError}
                          </span>
                          {data.codingAnalytics.verdictPercentages && (
                            <span className="text-[10px] text-amber-400/80 font-mono">
                              ({data.codingAnalytics.verdictPercentages.compilationError}%)
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-orange-500/10 border border-orange-500/20">
                        <span className="text-[10px] text-orange-300 font-medium block">Runtime Error</span>
                        <div className="flex items-baseline gap-1.5 mt-0.5">
                          <span className="text-base font-bold text-orange-400 font-mono">
                            {data.codingAnalytics.verdictDistribution.runtimeError}
                          </span>
                          {data.codingAnalytics.verdictPercentages && (
                            <span className="text-[10px] text-orange-400/80 font-mono">
                              ({data.codingAnalytics.verdictPercentages.runtimeError}%)
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <span className="text-[10px] text-blue-300 font-medium block">Time Limit Exceeded</span>
                        <div className="flex items-baseline gap-1.5 mt-0.5">
                          <span className="text-base font-bold text-blue-400 font-mono">
                            {data.codingAnalytics.verdictDistribution.timeLimitExceeded}
                          </span>
                          {data.codingAnalytics.verdictPercentages && (
                            <span className="text-[10px] text-blue-400/80 font-mono">
                              ({data.codingAnalytics.verdictPercentages.timeLimitExceeded}%)
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-surface-elevated border border-border">
                        <span className="text-[10px] text-muted-foreground font-medium block">Test Case Pass Rate</span>
                        <div className="flex items-baseline gap-1.5 mt-0.5">
                          <span className="text-base font-bold text-white font-mono">
                            {data.codingAnalytics.testsPassedCount}/{data.codingAnalytics.totalTestsCount}
                          </span>
                          {data.codingAnalytics.testPassRate !== null && (
                            <span className="text-[10px] text-accent font-mono">
                              ({data.codingAnalytics.testPassRate}%)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    No coding execution data recorded for this filter.
                  </div>
                )}
              </div>
            </div>

            {/* ── Row 4: Student Performance Roster Table ───────────────────── */}
            <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Users className="h-4 w-4 text-accent" />
                    Student Performance Roster
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Individual score breakdowns across Aptitude, Coding, HR rounds and Overall evaluation.
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Search candidate name, email, dept..."
                    className="w-full bg-surface-elevated border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-muted-foreground focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              {filteredStudentRoster.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-muted-foreground border-b border-border/70 text-left">
                        <th className="pb-3 font-medium">Candidate Name</th>
                        <th className="pb-3 font-medium">Department & Batch</th>
                        <th className="pb-3 font-medium text-center">Assessments</th>
                        <th className="pb-3 font-medium text-center">Aptitude</th>
                        <th className="pb-3 font-medium text-center">Coding</th>
                        <th className="pb-3 font-medium text-center">HR</th>
                        <th className="pb-3 font-medium text-center">Overall</th>
                        <th className="pb-3 font-medium text-center">Status</th>
                        <th className="pb-3 font-medium text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {filteredStudentRoster.map((st) => (
                        <tr key={st.studentId} className="hover:bg-surface-elevated/40 transition-colors">
                          <td className="py-3">
                            <div className="font-semibold text-white">{st.name}</div>
                            <div className="text-[11px] text-muted-foreground font-mono">{st.email}</div>
                          </td>
                          <td className="py-3">
                            <div className="text-white">{st.department}</div>
                            <div className="text-[11px] text-muted-foreground">{st.batch} Batch</div>
                          </td>
                          <td className="py-3 text-center font-mono text-white font-semibold">
                            {st.assessmentsCount}
                          </td>
                          <td className="py-3 text-center font-mono">
                            {st.scores.aptitude !== null ? (
                              <span className="text-purple-400 font-semibold">{st.scores.aptitude}%</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="py-3 text-center font-mono">
                            {st.scores.coding !== null ? (
                              <span className="text-cyan-400 font-semibold">{st.scores.coding}%</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="py-3 text-center font-mono">
                            {st.scores.hr !== null ? (
                              <span className="text-pink-400 font-semibold">{st.scores.hr}%</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="py-3 text-center font-mono">
                            {st.scores.overall !== null ? (
                              <span
                                className={`px-2 py-0.5 rounded font-bold ${
                                  st.scores.overall >= 70
                                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                                    : st.scores.overall >= 50
                                    ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                                }`}
                              >
                                {st.scores.overall}%
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Not Evaluated</span>
                            )}
                          </td>
                          <td className="py-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                                st.status === 'NEEDS_ATTENTION'
                                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/20'
                                  : st.status === 'ACTIVE'
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-surface-elevated text-muted-foreground border border-border'
                              }`}
                            >
                              {st.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/faculty/students/${st.studentId}`)}
                              className="border-border hover:bg-surface-elevated text-xs text-accent hover:text-white"
                            >
                              View Profile
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-10 text-center text-xs text-muted-foreground">
                  No students matched the filter criteria.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
