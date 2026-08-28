import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  Eye,
  AlertCircle,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronRight,
  TrendingUp,
  Activity,
  GraduationCap,
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Skeleton } from '../../components/ui/skeleton';
import {
  useFacultyStudentSummaries,
} from '../../api/faculty';
import type { FacultyStudentInterviewSummary } from '../../api/faculty';
import { StudentInterviewHistoryView } from './components/StudentInterviewHistoryView';

export const FacultyInterviews: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedStudentSummary, setSelectedStudentSummary] = useState<FacultyStudentInterviewSummary | null>(null);

  // Fetch hierarchical student summaries (each unique student appears exactly once)
  const {
    data: studentSummaries = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useFacultyStudentSummaries({
    search: search.trim() || undefined,
  });

  // Filter students locally if needed
  const filteredStudents = useMemo(() => {
    if (!search.trim()) return studentSummaries;
    const q = search.trim().toLowerCase();
    return studentSummaries.filter(
      (s) =>
        s.student.fullName.toLowerCase().includes(q) ||
        s.student.email.toLowerCase().includes(q) ||
        (s.student.rollNumber && s.student.rollNumber.toLowerCase().includes(q)) ||
        (s.student.department && s.student.department.toLowerCase().includes(q))
    );
  }, [studentSummaries, search]);

  // Overall platform statistics
  const totalStudents = studentSummaries.length;
  const totalSessions = studentSummaries.reduce((acc, s) => acc + s.totalSessions, 0);
  const totalInProgress = studentSummaries.reduce((acc, s) => acc + s.inProgressSessions, 0);
  const totalCompleted = studentSummaries.reduce((acc, s) => acc + s.completedSessions, 0);

  // If a student is currently selected, show their full history view
  if (selectedStudentSummary) {
    // Keep reference updated if query refetched
    const currentSummary =
      studentSummaries.find(
        (s) => s.student.identityId === selectedStudentSummary.student.identityId || s.student.email === selectedStudentSummary.student.email
      ) || selectedStudentSummary;

    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <StudentInterviewHistoryView
          summary={currentSummary}
          onBack={() => setSelectedStudentSummary(null)}
        />
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* ── 1. Page Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
              Candidate Assessments
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-accent/15 border border-accent/30 text-accent uppercase font-mono">
              Student Overview
            </span>
          </div>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Student-level interview monitoring. Click any student to review their complete chronological assessment history.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-xs gap-1.5 cursor-pointer shadow-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin text-accent' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── 2. KPI Metrics Strip ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 bg-surface border-border flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/20 text-accent">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-text-primary">{totalStudents}</div>
            <div className="text-[11px] text-text-muted font-medium">Assessed Students</div>
          </div>
        </Card>

        <Card className="p-4 bg-surface border-border flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-surface-elevated border border-border text-text-secondary">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-text-primary">{totalSessions}</div>
            <div className="text-[11px] text-text-muted font-medium">Total Sessions</div>
          </div>
        </Card>

        <Card className="p-4 bg-surface border-border flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-blue-400">{totalInProgress}</div>
            <div className="text-[11px] text-blue-300 font-medium">In Progress</div>
          </div>
        </Card>

        <Card className="p-4 bg-surface border-border flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-emerald-400">{totalCompleted}</div>
            <div className="text-[11px] text-emerald-300 font-medium">Completed</div>
          </div>
        </Card>
      </div>

      {/* ── 3. Search & Filter Bar ────────────────────────────────────────── */}
      <Card className="p-4 bg-surface border-border">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
          <Input
            placeholder="Search by student name, email, roll number, or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs h-9 bg-surface-elevated/40"
          />
        </div>
      </Card>

      {/* ── 4. Loading State ──────────────────────────────────────────────── */}
      {isLoading && (
        <Card className="p-6 space-y-4">
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        </Card>
      )}

      {/* ── 5. Error State ────────────────────────────────────────────────── */}
      {isError && (
        <div className="p-8 text-center space-y-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
          <AlertCircle className="h-6 w-6 text-rose-400 mx-auto" />
          <h3 className="text-sm font-semibold text-text-primary">Failed to load student assessments</h3>
          <p className="text-xs text-text-secondary max-w-md mx-auto">
            {(error as any)?.response?.data?.error?.message || (error as any)?.message}
          </p>
          <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-2">
            Try Again
          </Button>
        </div>
      )}

      {/* ── 6. Student Roster Table (One Row Per Unique Student) ───────────── */}
      {!isLoading && !isError && (
        <>
          {filteredStudents.length > 0 ? (
            <Card className="overflow-hidden border-border bg-surface shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border bg-surface-elevated/60 text-text-muted uppercase text-[10px] tracking-wider font-mono">
                      <th className="py-3.5 px-4 font-medium">Student</th>
                      <th className="py-3.5 px-4 font-medium">Department & Batch</th>
                      <th className="py-3.5 px-4 font-medium text-center">Total Sessions</th>
                      <th className="py-3.5 px-4 font-medium text-center">In Progress</th>
                      <th className="py-3.5 px-4 font-medium text-center">Completed</th>
                      <th className="py-3.5 px-4 font-medium text-center">Average Score</th>
                      <th className="py-3.5 px-4 font-medium">Latest Activity</th>
                      <th className="py-3.5 px-4 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {filteredStudents.map((summary) => (
                      <tr
                        key={summary.student.identityId || summary.student.email}
                        className="hover:bg-surface-elevated/40 transition-colors cursor-pointer group"
                        onClick={() => setSelectedStudentSummary(summary)}
                      >
                        {/* Student Details & Initials */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-accent/15 border border-accent/30 text-accent font-bold text-xs flex items-center justify-center shrink-0">
                              {getInitials(summary.student.fullName)}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-text-primary group-hover:text-accent transition-colors text-sm">
                                {summary.student.fullName}
                              </div>
                              <div className="text-[11px] text-text-muted font-mono truncate">
                                {summary.student.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Department & Batch */}
                        <td className="py-4 px-4">
                          <div className="font-medium text-text-primary">
                            {summary.student.department || 'Computer Science & Engineering'}
                          </div>
                          <div className="text-[11px] text-text-muted font-mono">
                            {summary.student.batch || '2024-2028'} • {summary.student.college || 'Engineering Institute'}
                          </div>
                        </td>

                        {/* Total Sessions */}
                        <td className="py-4 px-4 text-center">
                          <span className="font-mono font-bold text-sm text-text-primary px-2 py-0.5 rounded-md bg-surface-elevated border border-border">
                            {summary.totalSessions}
                          </span>
                        </td>

                        {/* In Progress */}
                        <td className="py-4 px-4 text-center">
                          <span className="font-mono font-bold text-xs text-blue-400 px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20">
                            {summary.inProgressSessions}
                          </span>
                        </td>

                        {/* Completed */}
                        <td className="py-4 px-4 text-center">
                          <span className="font-mono font-bold text-xs text-emerald-400 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                            {summary.completedSessions}
                          </span>
                        </td>

                        {/* Average Score */}
                        <td className="py-4 px-4 text-center">
                          {summary.averageScore !== null ? (
                            <span className="font-mono font-bold text-xs text-accent px-2.5 py-0.5 rounded-full bg-accent/15 border border-accent/30">
                              {summary.averageScore}%
                            </span>
                          ) : (
                            <span className="text-[11px] text-text-muted font-normal">
                              {summary.averageScoreDisplay}
                            </span>
                          )}
                        </td>

                        {/* Latest Activity */}
                        <td className="py-4 px-4 text-[11px] text-text-muted font-mono whitespace-nowrap">
                          {summary.latestSessionAt ? (
                            new Date(summary.latestSessionAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          ) : (
                            'No sessions'
                          )}
                        </td>

                        {/* View History Button */}
                        <td className="py-4 px-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs gap-1.5 border-accent/40 text-accent hover:bg-accent/10 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedStudentSummary(summary);
                            }}
                          >
                            <span>View History</span>
                            <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center bg-surface border-border">
              <div className="space-y-4 max-w-sm mx-auto">
                <Users className="h-10 w-10 text-text-muted mx-auto opacity-50" />
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-text-primary">No student assessments found</h3>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Student interview sessions and practice attempts will appear here automatically as candidates participate.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default FacultyInterviews;
