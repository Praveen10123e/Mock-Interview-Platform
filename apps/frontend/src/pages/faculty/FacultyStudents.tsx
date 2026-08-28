import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  RefreshCw,
  ArrowRight,
  Code2,
  Calendar,
  Activity,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Skeleton } from '../../components/ui/skeleton';
import { EmptyState } from '../../components/shared/EmptyState';
import { useFacultyStudents } from '../../api/faculty';
import type { StudentFilterParams } from '../../api/faculty';

export const FacultyStudents: React.FC = () => {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('ALL');
  const [batch, setBatch] = useState('ALL');
  const [status, setStatus] = useState('ALL');

  const filterParams: StudentFilterParams = {
    search: search.trim() || undefined,
    department: department !== 'ALL' ? department : undefined,
    batch: batch !== 'ALL' ? batch : undefined,
    status: status !== 'ALL' ? status : undefined,
  };

  const { data, isLoading, isError, error, refetch, isFetching } = useFacultyStudents(filterParams);

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

  return (
    <div className="space-y-6 md:space-y-8 max-w-7xl mx-auto w-full pb-12">
      {/* ── 1. Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/60 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text-primary">
              Students
            </h1>
            {data && (
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-accent/10 border border-accent/20 text-accent rounded-full font-mono">
                Total: {data.totalCount}
              </span>
            )}
          </div>
          <p className="text-xs md:text-sm text-text-secondary">
            Monitor and review student interview and coding performance.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
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
        </div>
      </div>

      {/* ── 2. Search & Filters Bar ────────────────────────────────────────── */}
      <Card className="p-4 bg-surface border-border">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <Input
              type="text"
              placeholder="Search by student name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-text-muted shrink-0 hidden sm:block" />
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full h-9 rounded-lg border border-border bg-surface-elevated px-3 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="ALL">All Departments</option>
              {data?.departments?.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Batch Filter */}
          <div>
            <select
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
              className="w-full h-9 rounded-lg border border-border bg-surface-elevated px-3 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="ALL">All Batches</option>
              {data?.batches?.map((b) => (
                <option key={b} value={b}>
                  Batch {b}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full h-9 rounded-lg border border-border bg-surface-elevated px-3 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="NEEDS_ATTENTION">Needs Attention</option>
            </select>
          </div>
        </div>
      </Card>

      {/* ── 3. Loading State ──────────────────────────────────────────────── */}
      {isLoading && (
        <Card className="p-6 space-y-4">
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        </Card>
      )}

      {/* ── 4. Error State ────────────────────────────────────────────────── */}
      {isError && (
        <div className="p-8 text-center space-y-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
          <AlertCircle className="h-6 w-6 text-rose-400 mx-auto" />
          <h3 className="text-sm font-semibold text-text-primary">Failed to load student roster</h3>
          <p className="text-xs text-text-secondary max-w-md mx-auto">
            {(error as any)?.response?.data?.message || (error as any)?.message}
          </p>
          <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-2">
            Try Again
          </Button>
        </div>
      )}

      {/* ── 5. Students Table ─────────────────────────────────────────────── */}
      {!isLoading && !isError && data && (
        <>
          {data.students.length > 0 ? (
            <Card className="overflow-hidden border-border bg-surface">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border bg-surface-elevated/60 text-text-muted uppercase text-[10px] tracking-wider font-mono">
                      <th className="py-3 px-4 font-medium">Student</th>
                      <th className="py-3 px-4 font-medium">Department</th>
                      <th className="py-3 px-4 font-medium">Batch</th>
                      <th className="py-3 px-4 font-medium">Coding Activity</th>
                      <th className="py-3 px-4 font-medium">Interview Activity</th>
                      <th className="py-3 px-4 font-medium">Performance</th>
                      <th className="py-3 px-4 font-medium">Status</th>
                      <th className="py-3 px-4 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {data.students.map((student) => {
                      const initials = getInitials(student.fullName);

                      return (
                        <tr
                          key={student.id}
                          className="hover:bg-surface-elevated/40 transition-colors group cursor-pointer"
                          onClick={() => navigate(`/faculty/students/${student.id}`)}
                        >
                          {/* Student Info */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-xs shrink-0">
                                {initials}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-text-primary truncate">
                                  {student.fullName}
                                </div>
                                <div className="text-[11px] text-text-muted truncate">
                                  {student.email}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Department */}
                          <td className="py-3 px-4 text-text-secondary font-medium truncate max-w-[140px]">
                            {student.department}
                          </td>

                          {/* Batch */}
                          <td className="py-3 px-4 text-text-secondary font-mono">
                            {student.batch}
                          </td>

                          {/* Coding Activity */}
                          <td className="py-3 px-4">
                            {student.codingActivity.hasData ? (
                              <div className="flex items-center gap-1.5 text-text-primary font-medium">
                                <Code2 className="h-3.5 w-3.5 text-accent" />
                                <span>{student.codingActivity.totalSubmissions} submissions</span>
                              </div>
                            ) : (
                              <span className="text-text-muted font-mono text-[11px]">No data</span>
                            )}
                          </td>

                          {/* Interview Activity */}
                          <td className="py-3 px-4">
                            {student.interviewActivity.hasData ? (
                              <div className="flex items-center gap-1.5 text-text-primary font-medium">
                                <Calendar className="h-3.5 w-3.5 text-accent" />
                                <span>
                                  {student.interviewActivity.completedInterviews} /{' '}
                                  {student.interviewActivity.totalInterviews} sessions
                                </span>
                              </div>
                            ) : (
                              <span className="text-text-muted font-mono text-[11px]">No data</span>
                            )}
                          </td>

                          {/* Performance */}
                          <td className="py-3 px-4">
                            {student.performance.hasEnoughData ? (
                              <span className="font-bold text-emerald-400 font-mono">
                                {student.performance.averageScore}%
                              </span>
                            ) : (
                              <span className="text-text-muted text-[11px]">Not enough data</span>
                            )}
                          </td>

                          {/* Status Badge */}
                          <td className="py-3 px-4">
                            <span
                              className={`inline-block px-2.5 py-0.5 text-[10px] font-semibold rounded-full uppercase tracking-wider ${
                                student.status === 'ACTIVE'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : student.status === 'NEEDS_ATTENTION'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                              }`}
                            >
                              {student.status.replace('_', ' ')}
                            </span>
                          </td>

                          {/* View Action */}
                          <td className="py-3 px-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2.5 text-xs text-text-secondary group-hover:text-accent group-hover:bg-accent/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/faculty/students/${student.id}`);
                              }}
                            >
                              <span>View</span>
                              <ArrowRight className="h-3.5 w-3.5 ml-1" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center bg-surface border-border">
              {data.unfilteredCount === 0 ? (
                <EmptyState
                  icon={<Users className="h-6 w-6" />}
                  title="No students are currently available"
                  description="Students registered in your department or cohort will be listed here automatically."
                />
              ) : (
                <div className="space-y-3 max-w-sm mx-auto">
                  <Search className="h-8 w-8 text-text-muted mx-auto opacity-50" />
                  <h3 className="text-sm font-semibold text-text-primary">
                    No students match your filters
                  </h3>
                  <p className="text-xs text-text-secondary">
                    Try adjusting your search keyword, department, or batch filters to view students.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearch('');
                      setDepartment('ALL');
                      setBatch('ALL');
                      setStatus('ALL');
                    }}
                    className="text-xs"
                  >
                    Reset Filters
                  </Button>
                </div>
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default FacultyStudents;
