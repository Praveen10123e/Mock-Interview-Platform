import React, { useState } from 'react';
import {
  BarChart3,
  Search,
  RefreshCw,
  FileText,
  CheckCircle2,
  Calendar,
  Clock,
  Award,
  Brain,
  Code2,
  MessageSquare,
  Eye,
  X,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { useFacultyReports, useFacultyReportDetail } from '../../api/faculty';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';

export const FacultyReports: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedScoreFilter, setSelectedScoreFilter] = useState<string>('ALL');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  // Score Min/Max mapping
  let scoreMin: number | undefined;
  let scoreMax: number | undefined;
  if (selectedScoreFilter === '90+') scoreMin = 90;
  else if (selectedScoreFilter === '75-89') { scoreMin = 75; scoreMax = 89; }
  else if (selectedScoreFilter === '50-74') { scoreMin = 50; scoreMax = 74; }
  else if (selectedScoreFilter === 'below50') { scoreMax = 49; }

  const { data, isLoading, isError, error, refetch, isFetching } = useFacultyReports({
    search: searchTerm.trim() || undefined,
    interviewType: selectedType !== 'ALL' ? selectedType : undefined,
    scoreMin,
    scoreMax,
  });

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedType('ALL');
    setSelectedScoreFilter('ALL');
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
                  Assessment Reports Archive
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-medium">
                    Verified Evaluation Snapshots
                  </span>
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Search, review and inspect finalized candidate assessment reports with full round evidence and transcripts.
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
              Refresh
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

        {/* ── Search & Filter Toolbar ────────────────────────────────────────── */}
        <div className="bg-surface border border-border rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by student name, email, roll number, test title..."
              className="w-full bg-surface-elevated border border-border rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-muted-foreground focus:outline-none focus:border-accent"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <label className="text-muted-foreground">Type:</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-surface-elevated border border-border text-foreground rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-accent text-xs"
              >
                <option value="ALL">All Types</option>
                <option value="MOCK">Mock Interview</option>
                <option value="PRACTICE">Practice</option>
                <option value="ASSESSMENT">Assessment</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <label className="text-muted-foreground">Score Range:</label>
              <select
                value={selectedScoreFilter}
                onChange={(e) => setSelectedScoreFilter(e.target.value)}
                className="bg-surface-elevated border border-border text-foreground rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-accent text-xs"
              >
                <option value="ALL">All Scores</option>
                <option value="90+">Top Tier (90% - 100%)</option>
                <option value="75-89">Proficient (75% - 89%)</option>
                <option value="50-74">Passing (50% - 74%)</option>
                <option value="below50">Needs Improvement (&lt; 50%)</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Summary Count Badge ────────────────────────────────────────────── */}
        {!isLoading && data && (
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>
              Showing <strong className="text-white font-mono">{data.totalCount}</strong> completed reports
              {data.unfilteredCount !== data.totalCount && ` (filtered from ${data.unfilteredCount})`}
            </span>
          </div>
        )}

        {/* ── Loading / Error State ─────────────────────────────────────────── */}
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl bg-surface border border-border" />
            ))}
          </div>
        )}

        {isError && (
          <div className="p-6 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
            <div>
              <p className="font-semibold">Failed to load reports archive</p>
              <p className="text-xs text-rose-400 mt-0.5">{(error as any)?.message || 'An unexpected error occurred.'}</p>
            </div>
          </div>
        )}

        {/* ── Reports List Table ────────────────────────────────────────────── */}
        {!isLoading && data && (
          <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
            {data.reports.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-surface-elevated/50 text-muted-foreground border-b border-border text-left">
                      <th className="py-3.5 px-4 font-medium">Candidate</th>
                      <th className="py-3.5 px-4 font-medium">Assessment Title</th>
                      <th className="py-3.5 px-4 font-medium">Date & Duration</th>
                      <th className="py-3.5 px-4 font-medium text-center">Aptitude</th>
                      <th className="py-3.5 px-4 font-medium text-center">Coding</th>
                      <th className="py-3.5 px-4 font-medium text-center">HR</th>
                      <th className="py-3.5 px-4 font-medium text-center">Overall Score</th>
                      <th className="py-3.5 px-4 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {data.reports.map((rep) => (
                      <tr key={rep.id} className="hover:bg-surface-elevated/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white">{rep.student.fullName}</div>
                          <div className="text-[11px] text-muted-foreground font-mono">{rep.student.email}</div>
                          <div className="text-[10px] text-muted-foreground/80">{rep.student.department} • {rep.student.batch}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-white">{rep.title}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-accent/15 text-accent font-mono">
                              {rep.interviewType}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {rep.templateName}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-muted-foreground">
                          <div className="text-white flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {new Date(rep.completedAt).toLocaleDateString()}
                          </div>
                          <div className="text-[11px] flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {rep.duration} mins
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono">
                          {rep.scores.aptitude !== null ? (
                            <span className="text-purple-400 font-semibold">{rep.scores.aptitude}%</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono">
                          {rep.scores.coding !== null ? (
                            <span className="text-cyan-400 font-semibold">{rep.scores.coding}%</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono">
                          {rep.scores.hr !== null ? (
                            <span className="text-pink-400 font-semibold">{rep.scores.hr}%</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono">
                          {rep.scores.overall !== null ? (
                            <span
                              className={`px-2.5 py-1 rounded font-bold ${
                                rep.scores.overall >= 70
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                                  : rep.scores.overall >= 50
                                  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                              }`}
                            >
                              {rep.scores.overall}%
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Evaluating</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedReportId(rep.id)}
                            className="border-border hover:bg-surface-elevated text-xs text-accent hover:text-white flex items-center gap-1.5 ml-auto"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View Report
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-muted-foreground space-y-2">
                <FileText className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-xs font-semibold text-white">No Completed Reports Found</p>
                <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                  No student assessment sessions matching your search or filters have been completed yet.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Report Detail Modal ────────────────────────────────────────────── */}
        {selectedReportId && (
          <ReportDetailModal
            reportId={selectedReportId}
            onClose={() => setSelectedReportId(null)}
          />
        )}
      </div>
    </div>
  );
};

/**
 * Full Evidence-Based Report Viewer Modal
 */
const ReportDetailModal: React.FC<{ reportId: string; onClose: () => void }> = ({ reportId, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'aptitude' | 'coding' | 'hr' | 'recommendations'>('overview');
  const { data, isLoading, isError, error } = useFacultyReportDetail(reportId);

  const report = data?.report;
  const student = data?.student;

  const rawMonitoring = report?.monitoring || data?.monitoring;
  const monitoringEvents = rawMonitoring?.events || [];
  const monitoringTotalSwitches = typeof rawMonitoring?.totalSwitches === 'number'
    ? rawMonitoring.totalSwitches
    : typeof rawMonitoring?.tabSwitches === 'number'
    ? rawMonitoring.tabSwitches
    : monitoringEvents.length;
  const monitoringTotalAwaySeconds = typeof rawMonitoring?.totalAwaySeconds === 'number'
    ? rawMonitoring.totalAwaySeconds
    : typeof rawMonitoring?.totalTimeAwaySeconds === 'number'
    ? rawMonitoring.totalTimeAwaySeconds
    : monitoringEvents.reduce((sum: number, ev: any) => sum + (ev.durationSeconds || 0), 0);
  const monitoringStatus = rawMonitoring?.status || rawMonitoring?.monitoringStatus || (
    monitoringTotalSwitches > 2 || monitoringTotalAwaySeconds > 30 ? 'Review Recommended' : 'Integrity Verified'
  );

  const monitoring = {
    status: monitoringStatus,
    totalSwitches: monitoringTotalSwitches,
    totalAwaySeconds: monitoringTotalAwaySeconds,
    tabSwitches: monitoringTotalSwitches,
    totalTimeAwaySeconds: monitoringTotalAwaySeconds,
    events: monitoringEvents,
    explanation: rawMonitoring?.explanation || (
      monitoringTotalSwitches === 0 ? 'Assessment completed with continuous focus.' : `${monitoringTotalSwitches} visibility events recorded.`
    ),
  };
  const completionReason =
    data?.completionReason ||
    report?.completionDetails?.completionReason ||
    report?.completionReason ||
    'Manually Submitted';

  const aptQuestions = report?.aptitudeAnalysis || report?.stages?.aptitude?.questions || [];
  const codProblems = report?.codingAnalysis || report?.coding?.problems || [];
  const hrDialogue = report?.hrAnalysis?.transcript || report?.stages?.hr?.transcript || [];
  const strengths = report?.strengths || report?.recommendations?.strengths || [];
  const areasToImprove = report?.areasToImprove || report?.recommendations?.improvements || [];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-surface border border-border shadow-2xl rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* ── Modal Header ─────────────────────────────────────────────────── */}
        <div className="p-5 border-b border-border flex items-center justify-between bg-surface-elevated/50">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-accent/15 border border-accent/30 text-accent uppercase font-mono">
                {data?.interviewType || 'MOCK'} ASSESSMENT REPORT
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase font-mono">
                FINALIZED SNAPSHOT
              </span>
            </div>
            <h2 className="text-base font-bold text-white mt-1">{data?.title || 'Assessment Report'}</h2>
            <p className="text-xs text-muted-foreground">
              Candidate: <strong className="text-white">{student?.fullName}</strong> ({student?.email}) • {student?.department}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-white hover:bg-surface-elevated transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Tab Navigation ────────────────────────────────────────────────── */}
        <div className="px-5 border-b border-border bg-surface flex items-center gap-2 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3 border-b-2 font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-accent text-accent font-semibold'
                : 'border-transparent text-muted-foreground hover:text-white'
            }`}
          >
            <Award className="h-3.5 w-3.5" />
            Executive Overview
          </button>
          <button
            onClick={() => setActiveTab('aptitude')}
            className={`py-3 px-3 border-b-2 font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'aptitude'
                ? 'border-purple-400 text-purple-400 font-semibold'
                : 'border-transparent text-muted-foreground hover:text-white'
            }`}
          >
            <Brain className="h-3.5 w-3.5" />
            Aptitude Review ({aptQuestions.length})
          </button>
          <button
            onClick={() => setActiveTab('coding')}
            className={`py-3 px-3 border-b-2 font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'coding'
                ? 'border-cyan-400 text-cyan-400 font-semibold'
                : 'border-transparent text-muted-foreground hover:text-white'
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            Coding Deep-Dive
          </button>
          <button
            onClick={() => setActiveTab('hr')}
            className={`py-3 px-3 border-b-2 font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'hr'
                ? 'border-pink-400 text-pink-400 font-semibold'
                : 'border-transparent text-muted-foreground hover:text-white'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            HR Transcript
          </button>
          <button
            onClick={() => setActiveTab('recommendations')}
            className={`py-3 px-3 border-b-2 font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'recommendations'
                ? 'border-emerald-400 text-emerald-400 font-semibold'
                : 'border-transparent text-muted-foreground hover:text-white'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI Strengths & Improvements
          </button>
        </div>

        {/* ── Modal Body Content ────────────────────────────────────────────── */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs">
          {isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-32 rounded-xl bg-surface-elevated" />
              <Skeleton className="h-48 rounded-xl bg-surface-elevated" />
            </div>
          )}

          {isError && (
            <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300">
              Failed to load report snapshot: {(error as any)?.message}
            </div>
          )}

          {!isLoading && report && (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Readiness Banner */}
                  <div className="p-5 rounded-xl bg-surface-elevated/70 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                        Industry Readiness Score
                      </span>
                      <div className="text-3xl font-extrabold text-accent font-mono">
                        {report.overallScore ?? report.metrics?.overallProficiencyScore ?? 0}%
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Comprehensive evaluation composite computed across verified execution evidence.
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-3 rounded-lg bg-surface border border-border">
                        <span className="text-[10px] text-muted-foreground block">Aptitude</span>
                        <span className="text-base font-bold text-purple-400 font-mono">
                          {report.scores?.aptitude ?? report.summary?.aptitudeScore ?? '—'}%
                        </span>
                      </div>
                      <div className="p-3 rounded-lg bg-surface border border-border">
                        <span className="text-[10px] text-muted-foreground block">Coding</span>
                        <span className="text-base font-bold text-cyan-400 font-mono">
                          {report.scores?.coding ?? report.summary?.codingScore ?? '—'}%
                        </span>
                      </div>
                      <div className="p-3 rounded-lg bg-surface border border-border">
                        <span className="text-[10px] text-muted-foreground block">HR Dialogue</span>
                        <span className="text-base font-bold text-pink-400 font-mono">
                          {report.scores?.hr ?? report.summary?.hrScore ?? '—'}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Summary Evidence Highlights */}
                  {report.summaryHighlights && (
                    <div className="p-4 rounded-xl bg-surface-elevated/40 border border-border space-y-2">
                      <h4 className="font-semibold text-white">Assessment Evidence Summary</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] text-muted-foreground">
                        <div>
                          <strong className="text-white block">Aptitude:</strong>
                          {report.summaryHighlights.aptitudeAccuracy || 'Recorded choices analyzed'}
                        </div>
                        <div>
                          <strong className="text-white block">Coding:</strong>
                          {report.summaryHighlights.codingSuccess || 'Submissions & tests verified'}
                        </div>
                        <div>
                          <strong className="text-white block">Behavioral:</strong>
                          {report.summaryHighlights.hrExcellence || 'Dialogue recorded'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Assessment Integrity & Monitoring */}
                  <div className="p-5 rounded-xl bg-surface-elevated/70 border border-border space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg border ${
                          monitoring?.status === 'Review Recommended'
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        }`}>
                          <ShieldCheck className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white uppercase tracking-wider text-xs">
                              Assessment Integrity & Monitoring
                            </h4>
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                              Monitoring Active
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Integrity monitoring tracks window focus to ensure a fair assessment environment. Tab switches do not penalize test scores.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border flex items-center gap-1.5 ${
                          monitoring?.status === 'Review Recommended'
                            ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                            : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            monitoring?.status === 'Review Recommended' ? 'bg-amber-400' : 'bg-emerald-400'
                          }`} />
                          {monitoring?.status || 'Integrity Verified'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${
                          completionReason?.includes('Expired')
                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                            : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300'
                        }`}>
                          {completionReason}
                        </span>
                      </div>
                    </div>

                    {/* Metric Badges */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 rounded-lg bg-surface border border-border space-y-1">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground block font-semibold">Integrity Status</span>
                        <span className={`text-xs font-bold ${
                          monitoring?.status === 'Review Recommended' ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {monitoring?.status || 'Integrity Verified'}
                        </span>
                      </div>
                      <div className="p-3 rounded-lg bg-surface border border-border space-y-1">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground block font-semibold">Tab Switches Detected</span>
                        <span className="text-xs font-bold font-mono text-white">
                          {monitoring?.totalSwitches ?? 0}
                        </span>
                      </div>
                      <div className="p-3 rounded-lg bg-surface border border-border space-y-1">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground block font-semibold">Time Outside Assessment</span>
                        <span className="text-xs font-bold font-mono text-white">
                          {monitoring?.totalAwaySeconds ?? 0}s
                        </span>
                      </div>
                      <div className="p-3 rounded-lg bg-surface border border-border space-y-1">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground block font-semibold">Submission Reason</span>
                        <span className="text-xs font-semibold text-white truncate block" title={completionReason}>
                          {completionReason}
                        </span>
                      </div>
                    </div>

                    {/* Timeline of events */}
                    {monitoring?.events && monitoring.events.length > 0 ? (
                      <div className="space-y-2 pt-1">
                        <span className="text-[11px] font-semibold text-muted-foreground block">
                          Chronological Window Visibility Events ({monitoring.events.length})
                        </span>
                        <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                          {monitoring.events.map((evt: any, idx: number) => (
                            <div key={idx} className="p-2 rounded-lg bg-surface border border-border flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2.5">
                                <span className="w-4 h-4 rounded-full bg-surface-elevated text-muted-foreground flex items-center justify-center font-mono text-[9px]">
                                  {idx + 1}
                                </span>
                                <div>
                                  <span className="text-muted-foreground">
                                    Left: <strong className="text-white font-mono">{evt.leftAt ? new Date(evt.leftAt).toLocaleTimeString() : 'Unknown'}</strong>
                                  </span>
                                  <span className="mx-1.5 text-muted-foreground">→</span>
                                  <span className="text-muted-foreground">
                                    Returned: <strong className="text-white font-mono">{evt.returnedAt ? new Date(evt.returnedAt).toLocaleTimeString() : 'Concluded'}</strong>
                                  </span>
                                </div>
                              </div>
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 font-mono text-[10px]">
                                {evt.durationSeconds ?? 0}s away
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                        <span>Integrity monitoring detected no window visibility changes. Assessment was completed in continuous focus.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: APTITUDE REVIEW */}
              {activeTab === 'aptitude' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs border-b border-border pb-2">
                    <span className="font-semibold text-white">Questions & Candidate Answers</span>
                    <span className="text-muted-foreground">
                      Total: {aptQuestions.length} Questions
                    </span>
                  </div>

                  {aptQuestions.length > 0 ? (
                    <div className="space-y-4">
                      {aptQuestions.map((q: any, idx: number) => {
                        const isCorrect = q.isCorrect === true || q.passed === true || q.status === 'CORRECT';
                        return (
                          <div
                            key={idx}
                            className={`p-4 rounded-xl border space-y-3 ${
                              isCorrect
                                ? 'bg-emerald-500/5 border-emerald-500/20'
                                : 'bg-rose-500/5 border-rose-500/20'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white font-mono">Q{idx + 1}.</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-elevated text-muted-foreground border border-border">
                                  {q.topic || q.category || 'Quantitative'}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-elevated text-muted-foreground border border-border">
                                  {q.difficulty || 'MEDIUM'}
                                </span>
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                                  isCorrect
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-rose-500/20 text-rose-400'
                                }`}
                              >
                                {isCorrect ? 'CORRECT (+1)' : 'INCORRECT (0)'}
                              </span>
                            </div>

                            <p className="text-white text-xs font-medium leading-relaxed">
                              {q.questionText || q.question}
                            </p>

                            {/* Options */}
                            {Array.isArray(q.options) && q.options.length > 0 && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                {q.options.map((opt: string, optIdx: number) => {
                                  const optLabel = String.fromCharCode(65 + optIdx);
                                  const isSelected = q.candidateAnswer === optLabel || q.userSelectedOption === optLabel || q.selectedAnswer === optLabel || q.candidateAnswer === opt;
                                  const isActualCorrect = q.correctAnswer === optLabel || q.correctOption === optLabel || q.correctAnswer === opt;

                                  return (
                                    <div
                                      key={optIdx}
                                      className={`p-2.5 rounded-lg border text-[11px] flex items-center justify-between ${
                                        isActualCorrect
                                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-semibold'
                                          : isSelected
                                          ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                                          : 'bg-surface-elevated/40 border-border text-muted-foreground'
                                      }`}
                                    >
                                      <span>
                                        <strong className="mr-1.5 font-mono">{optLabel}.</strong>
                                        {opt}
                                      </span>
                                      {isActualCorrect && <span className="text-[10px] text-emerald-400 font-mono">✓ Correct</span>}
                                      {isSelected && !isActualCorrect && <span className="text-[10px] text-rose-400 font-mono">✗ Chosen</span>}
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Explanation */}
                            {q.explanation && (
                              <div className="p-3 rounded-lg bg-surface border border-border text-[11px] text-muted-foreground space-y-1">
                                <strong className="text-white block">Explanation & Method:</strong>
                                <p>{q.explanation}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-muted-foreground">
                      No aptitude questions data in snapshot.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: CODING DEEP-DIVE */}
              {activeTab === 'coding' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs border-b border-border pb-2">
                    <span className="font-semibold text-white">Submitted Code & Compiler Executions</span>
                    <span className="text-muted-foreground">Protected Judge0 Evidence</span>
                  </div>

                  {(codProblems.length > 0 ? codProblems : (report?.stages?.coding?.questions || [])).length > 0 ? (
                    <div className="space-y-4">
                      {(codProblems.length > 0 ? codProblems : (report?.stages?.coding?.questions || [])).map((prob: any, idx: number) => (
                        <div key={idx} className="p-4 rounded-xl bg-surface-elevated/50 border border-border space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white font-mono">Problem {idx + 1}:</span>
                              <span className="text-white font-medium">{prob.title || 'Coding Problem'}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface border border-border text-muted-foreground">
                                {prob.difficulty || 'MEDIUM'}
                              </span>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                prob.status === 'PASSED' || prob.accepted
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                              }`}
                            >
                              {prob.status || (prob.accepted ? 'ACCEPTED' : 'ATTEMPTED')}
                            </span>
                          </div>

                          {prob.submittedCode && (
                            <div className="space-y-1">
                              <span className="text-[10px] text-muted-foreground uppercase font-mono">
                                Submitted Source Code ({prob.language || 'Code'}):
                              </span>
                              <pre className="p-3 rounded-lg bg-black/70 border border-border text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-64">
                                {prob.submittedCode}
                              </pre>
                            </div>
                          )}

                          <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-1">
                            <span>Tests Passed: <strong className="text-white font-mono">{prob.testsPassed ?? prob.passedCount ?? '—'} / {prob.totalTests ?? prob.totalCount ?? '—'}</strong></span>
                            <span>Attempts: <strong className="text-white font-mono">{prob.attemptCount ?? 1}</strong></span>
                            {prob.executionTime && <span>Time: <strong className="text-white font-mono">{prob.executionTime}s</strong></span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-muted-foreground">
                      No code submissions recorded for this assessment.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: HR TRANSCRIPT */}
              {activeTab === 'hr' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs border-b border-border pb-2">
                    <span className="font-semibold text-white">Chronological Behavioral Dialogue</span>
                    <span className="text-muted-foreground">Interview Transcript</span>
                  </div>

                  {hrDialogue.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                      {hrDialogue.map((msg: any, idx: number) => {
                        const isAi = msg.role === 'interviewer' || msg.role === 'assistant' || msg.sender === 'AI';
                        return (
                          <div
                            key={idx}
                            className={`p-3.5 rounded-xl border flex flex-col gap-1 ${
                              isAi
                                ? 'bg-surface-elevated/40 border-border mr-8'
                                : 'bg-accent/10 border-accent/30 ml-8'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                              <span className={isAi ? 'text-purple-400 font-semibold' : 'text-accent font-semibold'}>
                                {isAi ? 'AI Interviewer' : `${student?.fullName || 'Candidate'}`}
                              </span>
                              {msg.timestamp && <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>}
                            </div>
                            <p className="text-white text-xs leading-relaxed">{msg.content || msg.message}</p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-muted-foreground">
                      No HR conversation transcript in snapshot.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: AI STRENGTHS & RECOMMENDATIONS */}
              {activeTab === 'recommendations' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Strengths */}
                    <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
                      <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                        <CheckCircle2 className="h-4 w-4" />
                        Key Candidate Strengths
                      </div>
                      {strengths.length > 0 ? (
                        <ul className="space-y-2 text-[11px] text-gray-300">
                          {strengths.map((str: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-emerald-400 font-bold">•</span>
                              <span>{str}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[11px] text-muted-foreground">Solid baseline proficiency across core modules.</p>
                      )}
                    </div>

                    {/* Areas for Improvement */}
                    <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-3">
                      <div className="flex items-center gap-2 text-amber-400 font-semibold">
                        <Sparkles className="h-4 w-4" />
                        Targeted Growth Areas
                      </div>
                      {areasToImprove.length > 0 ? (
                        <ul className="space-y-2 text-[11px] text-gray-300">
                          {areasToImprove.map((imp: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-amber-400 font-bold">•</span>
                              <span>{imp}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[11px] text-muted-foreground">Continue targeted practice on edge case algorithmic optimization.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Modal Footer ─────────────────────────────────────────────────── */}
        <div className="p-4 border-t border-border bg-surface-elevated/40 flex items-center justify-end">
          <Button variant="outline" size="sm" onClick={onClose} className="border-border text-xs">
            Close Report
          </Button>
        </div>
      </div>
    </div>
  );
};
