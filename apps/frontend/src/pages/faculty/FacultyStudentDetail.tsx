import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Building,
  GraduationCap,
  Calendar,
  Code2,
  CheckCircle2,
  Clock,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  FileCode2,
  Activity,
  Award,
  Sparkles,
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { EmptyState } from '../../components/shared/EmptyState';
import { useFacultyStudentDetail } from '../../api/faculty';

export const FacultyStudentDetail: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();

  const { data, isLoading, isError, error, refetch, isFetching } = useFacultyStudentDetail(studentId);

  // Helper for 2-letter initials
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    if (parts.length === 1 && parts[0].length >= 2) {
      return `${parts[0][0]}${parts[0][1]}`.toUpperCase();
    }
    return (name[0] || 'S').toUpperCase();
  };

  // ── Loading Skeleton ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6 md:space-y-8 max-w-7xl mx-auto w-full pb-12">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-6 w-48 rounded-md" />
        </div>
        <Skeleton className="h-44 w-full rounded-2xl" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  // ── Error State ──────────────────────────────────────────────────────────────
  if (isError || !data) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-text-primary">Failed to load student details</h2>
          <p className="text-xs text-text-secondary max-w-md">
            {(error as any)?.response?.data?.message ||
              (error as any)?.message ||
              'The requested student profile could not be accessed.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => navigate('/faculty/students')} variant="outline" size="sm">
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Back to Students
          </Button>
          <Button onClick={() => refetch()} variant="default" size="sm">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Try Again
          </Button>
        </div>
      </div>
    );
  }

  const { profile, codingPerformance, interviewPerformance, recentActivity } = data;
  const initials = getInitials(profile.fullName);

  return (
    <div className="space-y-6 md:space-y-8 max-w-7xl mx-auto w-full pb-12">
      {/* ── 1. Top Navigation & Breadcrumbs ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/60 pb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/faculty/students')}
            className="h-8 px-2.5 text-xs gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Students</span>
          </Button>
          <span className="text-text-muted text-xs">/</span>
          <span className="text-text-primary font-semibold text-xs truncate max-w-[200px]">
            {profile.fullName}
          </span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="h-8 px-2.5 text-xs text-text-muted hover:text-text-primary gap-1.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* ── 2. Student Profile Hero Card ────────────────────────────────────── */}
      <Card className="p-6 md:p-8 relative overflow-hidden bg-gradient-to-r from-surface-card via-surface-elevated to-surface-card border-border">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Initials Avatar */}
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-accent to-indigo-600 flex items-center justify-center text-white font-bold text-xl md:text-2xl shadow-lg shadow-accent/20 border border-white/10 shrink-0">
              {initials}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl md:text-2xl font-bold text-text-primary tracking-tight">
                  {profile.fullName}
                </h1>
                <span className="px-2.5 py-0.5 text-[10px] font-semibold bg-accent/10 border border-accent/20 text-accent rounded-full uppercase tracking-wider">
                  {profile.role}
                </span>
                <span className="px-2.5 py-0.5 text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full">
                  {profile.placementStatus}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-text-secondary">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-text-muted" />
                  {profile.email}
                </span>
                {profile.phone && profile.phone !== '—' && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-text-muted" />
                    {profile.phone}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-text-muted" />
                  Batch {profile.batch}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:items-end text-xs text-text-muted space-y-1 border-t md:border-t-0 pt-3 md:pt-0 border-border/50 w-full md:w-auto">
            <span className="flex items-center gap-1.5 font-medium text-text-secondary">
              <Building className="h-3.5 w-3.5 text-accent" />
              {profile.college}
            </span>
            <span className="flex items-center gap-1.5">
              <GraduationCap className="h-3.5 w-3.5 text-accent" />
              {profile.department}
            </span>
            {profile.rollNumber && profile.rollNumber !== '—' && (
              <span className="font-mono text-[11px] text-text-muted">
                Roll No: {profile.rollNumber}
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* ── 3. Performance Cards Grid ───────────────────────────────────────── */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Coding Performance Card */}
        <Card className="p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-border/50 pb-3">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-accent" />
              <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
                Coding Performance
              </h2>
            </div>
            <span className="text-[11px] font-mono text-text-muted">
              {codingPerformance.totalSubmissions} Submissions
            </span>
          </div>

          {codingPerformance.hasCodingData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl border border-border bg-surface-elevated text-center">
                  <div className="text-lg font-bold text-text-primary">
                    {codingPerformance.totalSubmissions}
                  </div>
                  <div className="text-[10px] text-text-muted">Total Attempts</div>
                </div>
                <div className="p-3 rounded-xl border border-border bg-surface-elevated text-center">
                  <div className="text-lg font-bold text-emerald-400">
                    {codingPerformance.acceptedSubmissions}
                  </div>
                  <div className="text-[10px] text-text-muted">Passed Solutions</div>
                </div>
                <div className="p-3 rounded-xl border border-border bg-surface-elevated text-center">
                  <div className="text-lg font-bold text-accent font-mono">
                    {codingPerformance.acceptanceRate !== null
                      ? `${codingPerformance.acceptanceRate}%`
                      : '—'}
                  </div>
                  <div className="text-[10px] text-text-muted">Acceptance Rate</div>
                </div>
              </div>

              {codingPerformance.submissions.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border/40">
                  <div className="text-[11px] font-semibold text-text-secondary uppercase">
                    Recent Code Executions
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {codingPerformance.submissions.slice(0, 5).map((sub) => (
                      <div
                        key={sub.id}
                        className="p-2.5 rounded-lg border border-border/40 bg-surface-elevated/40 flex items-center justify-between text-xs"
                      >
                        <div className="min-w-0">
                          <div className="font-semibold text-text-primary truncate">
                            {sub.questionTitle}
                          </div>
                          <div className="text-[10px] text-text-muted flex items-center gap-2">
                            <span className="uppercase font-mono text-accent">{sub.language}</span>
                            <span>•</span>
                            <span>
                              {sub.passedCount}/{sub.totalCount} tests passed
                            </span>
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 text-[9px] font-semibold rounded-full uppercase shrink-0 ${
                            sub.status === 'ACCEPTED'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {sub.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center space-y-2">
              <Code2 className="h-6 w-6 text-text-muted mx-auto opacity-50" />
              <p className="text-xs font-semibold text-text-primary">
                Not enough coding data available
              </p>
              <p className="text-[11px] text-text-muted max-w-xs mx-auto">
                Coding execution metrics will be recorded once the candidate submits problem
                solutions.
              </p>
            </div>
          )}
        </Card>

        {/* Interview Performance Card */}
        <Card className="p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-border/50 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-accent" />
              <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
                Interview Performance
              </h2>
            </div>
            <span className="text-[11px] font-mono text-text-muted">
              {interviewPerformance.totalInterviews} Sessions
            </span>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl border border-border bg-surface-elevated text-center">
                <div className="text-lg font-bold text-text-primary">
                  {interviewPerformance.totalInterviews}
                </div>
                <div className="text-[10px] text-text-muted">Total Sessions</div>
              </div>
              <div className="p-3 rounded-xl border border-border bg-surface-elevated text-center">
                <div className="text-lg font-bold text-emerald-400">
                  {interviewPerformance.completedInterviews}
                </div>
                <div className="text-[10px] text-text-muted">Completed</div>
              </div>
              <div className="p-3 rounded-xl border border-border bg-surface-elevated text-center">
                {interviewPerformance.hasInterviewData ? (
                  <>
                    <div className="text-lg font-bold text-emerald-400 font-mono">
                      {interviewPerformance.averageScore}%
                    </div>
                    <div className="text-[10px] text-text-muted">Average Score</div>
                  </>
                ) : (
                  <>
                    <div className="text-xs font-semibold text-text-muted mt-1.5">No data</div>
                    <div className="text-[10px] text-text-muted">Average Score</div>
                  </>
                )}
              </div>
            </div>

            {interviewPerformance.interviews.length > 0 ? (
              <div className="space-y-2 pt-2 border-t border-border/40">
                <div className="text-[11px] font-semibold text-text-secondary uppercase">
                  Interview Sessions Log
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {interviewPerformance.interviews.map((iv) => (
                    <div
                      key={iv.id}
                      className="p-2.5 rounded-lg border border-border/40 bg-surface-elevated/40 flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-text-primary truncate">{iv.title}</div>
                        <div className="text-[10px] text-text-muted flex items-center gap-2">
                          <span className="uppercase text-accent font-mono">
                            {iv.interviewType}
                          </span>
                          <span>•</span>
                          <span>{new Date(iv.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {iv.score !== null && (
                          <span className="font-bold text-emerald-400 font-mono">
                            {iv.score}%
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 text-[9px] font-semibold rounded-full uppercase shrink-0 ${
                            iv.state === 'COMPLETED'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {iv.state}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-6 text-center space-y-1">
                <p className="text-xs font-semibold text-text-primary">
                  Not enough assessment data available yet
                </p>
                <p className="text-[11px] text-text-muted max-w-xs mx-auto">
                  Interview evaluations will appear here once the student participates in mock
                  interviews.
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ── 4. Recent Student Activity Timeline ─────────────────────────────── */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-border/50 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
              Recent Activity Timeline
            </h2>
          </div>
          <span className="text-[11px] font-mono text-text-muted">
            {recentActivity.length} Events Logged
          </span>
        </div>

        {recentActivity.length > 0 ? (
          <div className="space-y-3">
            {recentActivity.map((event) => (
              <div
                key={event.id}
                className="p-3 rounded-xl border border-border/50 bg-surface-elevated/40 flex items-start justify-between gap-4 text-xs"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    {event.type === 'INTERVIEW' ? (
                      <Calendar className="h-3.5 w-3.5 text-accent" />
                    ) : (
                      <Code2 className="h-3.5 w-3.5 text-indigo-400" />
                    )}
                    <span className="font-semibold text-text-primary">{event.title}</span>
                  </div>
                  <div className="text-[11px] text-text-secondary pl-5">{event.detail}</div>
                </div>

                <div className="flex flex-col items-end shrink-0 space-y-1">
                  <span
                    className={`px-2 py-0.5 text-[9px] font-semibold rounded-full uppercase ${
                      event.status === 'COMPLETED' || event.status === 'ACCEPTED'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : event.status === 'RUNNING'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {event.status}
                  </span>
                  <span className="text-[10px] text-text-muted">
                    {new Date(event.timestamp).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center space-y-2">
            <Clock className="h-6 w-6 text-text-muted mx-auto opacity-50" />
            <p className="text-xs font-semibold text-text-primary">No recent student activity</p>
            <p className="text-[11px] text-text-muted max-w-xs mx-auto">
              Real-time activity records will populate here as the candidate interacts with the
              sandbox.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default FacultyStudentDetail;
