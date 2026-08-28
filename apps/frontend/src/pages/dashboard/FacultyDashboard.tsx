import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Activity,
  FileText,
  AlertTriangle,
  TrendingUp,
  Clock,
  BookOpen,
  RefreshCw,
  GraduationCap,
  Building,
  AlertCircle,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { EmptyState } from '../../components/shared/EmptyState';
import { useFacultyDashboard } from '../../api/faculty';
import { useAuthStore } from '../../store/AuthStore';

export const FacultyDashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { data, isLoading, isError, error, refetch, isFetching } = useFacultyDashboard();

  // ── Loading Skeleton ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6 md:space-y-8 max-w-7xl mx-auto w-full pb-12">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64 rounded-xl" />
          <Skeleton className="h-4 w-96 rounded-lg" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-80 lg:col-span-2 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
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
          <h2 className="text-lg font-bold text-text-primary">Failed to load Faculty Dashboard</h2>
          <p className="text-xs text-text-secondary max-w-md">
            {(error as any)?.response?.data?.message ||
              (error as any)?.message ||
              'An unexpected error occurred while connecting to the analytics engine.'}
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="h-3.5 w-3.5" />
          Try Again
        </Button>
      </div>
    );
  }

  const { faculty, metrics, performanceTrend, studentsNeedingAttention, recentActivity } = data;

  // Resolve faculty display name with fallbacks
  const displayName =
    faculty?.name && faculty.name !== 'Faculty Member'
      ? faculty.name
      : user?.firstName
      ? `${user.firstName} ${user.lastName || ''}`.trim()
      : user?.email?.split('@')[0] || 'Faculty Member';

  const collegeName = faculty?.college || 'Naan Mudhalvan Partner College';
  const deptName = faculty?.department || 'Computer Science & Engineering';
  const designation = faculty?.designation || 'Faculty Instructor';

  const hasZeroStudents = metrics.totalStudents === 0;

  return (
    <div className="space-y-6 md:space-y-8 max-w-7xl mx-auto w-full pb-12">
      {/* ── 1. Dashboard Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/60 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text-primary">
              Welcome back, {displayName}
            </h1>
            <span className="px-2.5 py-0.5 text-[10px] font-semibold bg-accent/10 border border-accent/20 text-accent rounded-full uppercase tracking-wider">
              {designation}
            </span>
          </div>
          <p className="text-xs md:text-sm text-text-secondary">
            Monitor student progress, assessments, and department performance.
          </p>
          <div className="flex items-center gap-3 pt-1 text-xs text-text-muted flex-wrap">
            <span className="flex items-center gap-1">
              <Building className="h-3.5 w-3.5 text-accent" />
              {collegeName}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <GraduationCap className="h-3.5 w-3.5 text-accent" />
              {deptName}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-1.5 text-xs cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => navigate('/student/questions')}
            className="gap-1.5 text-xs cursor-pointer"
          >
            <BookOpen className="h-3.5 w-3.5" />
            Question Bank
          </Button>
        </div>
      </div>

      {/* ── 2. Summary Metric Cards ─────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Total Students */}
        <Card className="p-4 md:p-5 relative overflow-hidden bg-surface border-border hover:border-accent/30 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-secondary">Total Students</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-text-primary tracking-tight">
              {metrics.totalStudents}
            </div>
            <p className="text-[11px] text-text-muted mt-0.5">Enrolled in department</p>
          </div>
        </Card>

        {/* Active Students */}
        <Card className="p-4 md:p-5 relative overflow-hidden bg-surface border-border hover:border-accent/30 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-secondary">Active Students</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-text-primary tracking-tight">
              {metrics.activeStudents > 0 ? metrics.activeStudents : '0'}
            </div>
            <p className="text-[11px] text-text-muted mt-0.5">
              {metrics.activeStudents > 0 ? 'Active in last 30 days' : 'No recent activity'}
            </p>
          </div>
        </Card>

        {/* Total Assessments */}
        <Card className="p-4 md:p-5 relative overflow-hidden bg-surface border-border hover:border-accent/30 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-secondary">Assessments</span>
            <div className="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-text-primary tracking-tight">
              {metrics.assessments}
            </div>
            <p className="text-[11px] text-text-muted mt-0.5">Mock interview sessions</p>
          </div>
        </Card>

        {/* Total Submissions */}
        <Card className="p-4 md:p-5 relative overflow-hidden bg-surface border-border hover:border-accent/30 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-secondary">Total Submissions</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-text-primary tracking-tight">
              {metrics.totalSubmissions}
            </div>
            <p className="text-[11px] text-text-muted mt-0.5">Code execution attempts</p>
          </div>
        </Card>

        {/* Average Performance */}
        <Card className="p-4 md:p-5 relative overflow-hidden bg-surface border-border hover:border-accent/30 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-secondary">Avg Performance</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            {metrics.hasEnoughPerformanceData ? (
              <>
                <div className="text-2xl font-bold text-emerald-400 tracking-tight">
                  {metrics.averagePerformance}%
                </div>
                <p className="text-[11px] text-text-muted mt-0.5">Completed assessments</p>
              </>
            ) : (
              <>
                <div className="text-base font-semibold text-text-muted tracking-tight">
                  Not enough data
                </div>
                <p className="text-[11px] text-text-muted mt-0.5">Awaiting evaluations</p>
              </>
            )}
          </div>
        </Card>
      </div>

      {/* ── Brand New Faculty Empty State ───────────────────────────────────── */}
      {hasZeroStudents && (
        <Card className="p-8 text-center bg-surface-elevated/40 border-dashed border-border">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mx-auto">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-text-primary">
              No Students Registered in Cohort
            </h3>
            <p className="text-xs text-text-muted">
              Students registered under {collegeName} ({deptName}) will automatically populate this
              dashboard.
            </p>
          </div>
        </Card>
      )}

      {/* ── 3. Performance Overview & Recent Activity Grid ─────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Performance Overview Trend */}
        <Card className="p-5 md:p-6 lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between border-b border-border/50 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent" />
              <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
                Performance Overview
              </h2>
            </div>
            <span className="text-[11px] text-text-muted font-mono">
              {performanceTrend.length} Data Points
            </span>
          </div>

          {metrics.hasEnoughPerformanceData && performanceTrend.length > 0 ? (
            <div className="space-y-4">
              <div className="h-48 flex items-end gap-3 pt-6 pb-2 px-2 overflow-x-auto">
                {performanceTrend.map((pt, index) => {
                  const barHeight = Math.max(10, Math.min(100, pt.averageScore));
                  return (
                    <div key={index} className="flex-1 min-w-[48px] flex flex-col items-center gap-2 group">
                      <div className="text-[10px] font-bold text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                        {pt.averageScore}%
                      </div>
                      <div className="w-full bg-surface-elevated rounded-t-lg h-36 flex items-end p-1 border border-border/40">
                        <div
                          className="w-full bg-gradient-to-t from-accent/70 to-accent rounded-md transition-all duration-500 hover:brightness-110"
                          style={{ height: `${barHeight}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-text-muted whitespace-nowrap">
                        {new Date(pt.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-xs text-text-secondary pt-2 border-t border-border/40">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-accent" />
                  Cohort Average Score Trend
                </span>
                <span className="text-[11px] text-text-muted">
                  Aggregated from verified session submissions
                </span>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={<TrendingUp className="h-5 w-5" />}
              title="No Historical Performance Data"
              description="Performance analytics will display chronological score distributions once students complete mock interview sessions."
            />
          )}
        </Card>

        {/* Recent Activity Timeline */}
        <Card className="p-5 md:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border/50 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-accent" />
              <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
                Recent Activity
              </h2>
            </div>
          </div>

          {recentActivity.length > 0 ? (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {recentActivity.map((activity, idx) => (
                <div
                  key={activity.id || idx}
                  className="p-3 rounded-xl border border-border/50 bg-surface-elevated/40 hover:bg-surface-elevated transition-colors flex items-start justify-between gap-3"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="text-xs font-semibold text-text-primary truncate">
                      {activity.studentName}
                    </div>
                    <div className="text-[11px] text-text-secondary truncate">
                      {activity.activityTitle}
                    </div>
                    <div className="text-[10px] text-text-muted">
                      {new Date(activity.timestamp).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-[9px] font-semibold rounded-full uppercase shrink-0 ${
                      activity.status === 'COMPLETED'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {activity.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center space-y-2">
              <Clock className="h-5 w-5 text-text-muted mx-auto opacity-50" />
              <p className="text-xs font-medium text-text-secondary">No recent activity available</p>
              <p className="text-[11px] text-text-muted max-w-xs mx-auto">
                Student interview completions and test submissions will be recorded here in real
                time.
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* ── 4. Students Needing Attention ───────────────────────────────────── */}
      <Card className="p-5 md:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-border/50 pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
              Students Needing Attention
            </h2>
          </div>
          <span className="text-[11px] text-text-muted font-mono">
            {studentsNeedingAttention.length} Identified
          </span>
        </div>

        {studentsNeedingAttention.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/40 text-text-muted uppercase text-[10px] tracking-wider font-mono">
                  <th className="pb-2.5 font-medium">Student</th>
                  <th className="pb-2.5 font-medium">Department / Batch</th>
                  <th className="pb-2.5 font-medium">Score / Indicator</th>
                  <th className="pb-2.5 font-medium">Reason for Flag</th>
                  <th className="pb-2.5 font-medium text-right">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {studentsNeedingAttention.map((student) => (
                  <tr key={student.id} className="hover:bg-surface-elevated/30 transition-colors">
                    <td className="py-3 font-semibold text-text-primary">{student.name}</td>
                    <td className="py-3 text-text-secondary">
                      {student.department} • {student.batch}
                    </td>
                    <td className="py-3 font-bold text-amber-400">{student.performanceScore}</td>
                    <td className="py-3 text-text-secondary max-w-xs">{student.reason}</td>
                    <td className="py-3 text-right">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase ${
                          student.severity === 'HIGH'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : student.severity === 'MEDIUM'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}
                      >
                        {student.severity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="h-6 w-6 text-emerald-400 mx-auto" />
            <p className="text-xs font-semibold text-text-primary">
              No students currently require attention
            </p>
            <p className="text-[11px] text-text-muted max-w-md mx-auto">
              All students with recorded evaluations meet or exceed performance benchmarks.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default FacultyDashboard;
