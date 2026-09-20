import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Edit2,
  ShieldCheck,
  ShieldAlert,
  Award,
  Building,
  GraduationCap,
  Briefcase,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  X,
  Lock,
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Skeleton } from '../../components/ui/skeleton';
import { EmptyState } from '../../components/shared/EmptyState';
import {
  useAdminUsersOverview,
  useAdminUsers,
  useAdminUserDetail,
  useUpdateAdminUserProfile,
  useUpdateAdminUserStatus,
} from '../../api/admin';
import type { AdminUserItem, AdminUserListParams } from '../../api/admin';
import { useAuthStore } from '../../store/AuthStore';

export const AdminUsers: React.FC = () => {
  const { user: authUser } = useAuthStore();

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [department, setDepartment] = useState('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Modals state
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUserItem | null>(null);
  const [statusChangingUser, setStatusChangingUser] = useState<AdminUserItem | null>(null);
  const [newStatusValue, setNewStatusValue] = useState('ACTIVE');
  const [actionError, setActionError] = useState<string | null>(null);

  // Edit form state
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    department: '',
    designation: '',
    college: '',
  });

  const queryParams: AdminUserListParams = {
    search: search.trim() || undefined,
    role: role !== 'ALL' ? role : undefined,
    status: status !== 'ALL' ? status : undefined,
    department: department !== 'ALL' ? department : undefined,
    page,
    limit: pageSize,
  };

  const { data: overview, isLoading: isOverviewLoading } = useAdminUsersOverview();
  const {
    data: userListData,
    isLoading: isUsersLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useAdminUsers(queryParams);

  const { data: userDetail, isLoading: isDetailLoading } = useAdminUserDetail(selectedUserId);
  const updateProfileMutation = useUpdateAdminUserProfile();
  const updateStatusMutation = useUpdateAdminUserStatus();

  const users = userListData?.users || [];
  const pagination = userListData?.pagination || {
    page: 1,
    limit: pageSize,
    total: 0,
    totalPages: 1,
    hasMore: false,
  };

  // Helper for 2-letter initials
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    if (parts.length === 1 && parts[0].length >= 2) {
      return `${parts[0][0]}${parts[0][1]}`.toUpperCase();
    }
    return (name[0] || 'U').toUpperCase();
  };

  const handleOpenEdit = (user: AdminUserItem) => {
    setEditingUser(user);
    setEditForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phone: user.phone || '',
      department: user.department !== 'N/A' ? user.department : '',
      designation: user.designation || '',
      college: user.college !== 'Naan Mudhalvan Partner Institution' ? user.college : '',
    });
    setActionError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      setActionError(null);
      await updateProfileMutation.mutateAsync({
        id: editingUser.id,
        data: editForm,
      });
      setEditingUser(null);
    } catch (err: any) {
      setActionError(err.response?.data?.error?.message || err.message || 'Failed to update profile');
    }
  };

  const handleOpenStatus = (user: AdminUserItem) => {
    setStatusChangingUser(user);
    setNewStatusValue(user.status);
    setActionError(null);
  };

  const handleSaveStatus = async () => {
    if (!statusChangingUser) return;
    try {
      setActionError(null);
      await updateStatusMutation.mutateAsync({
        id: statusChangingUser.id,
        status: newStatusValue,
      });
      setStatusChangingUser(null);
    } catch (err: any) {
      setActionError(err.response?.data?.error?.message || err.message || 'Failed to update account status');
    }
  };

  const isSelf = (targetId: string) => {
    return authUser?.id === targetId;
  };

  /** Returns true when the user holds SUPER_ADMIN — used only for UI decisions. Server enforces. */
  const isProtectedAccount = (user: AdminUserItem | { isProtected?: boolean }) =>
    (user as any).isProtected === true;

  return (
    <div className="space-y-6 md:space-y-8 max-w-7xl mx-auto w-full pb-16">
      {/* ── 1. Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Users
            </h1>
            {overview && (
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-accent/15 border border-accent/30 text-accent rounded-full font-mono">
                {overview.totalUsers} Total Accounts
              </span>
            )}
          </div>
          <p className="text-xs md:text-sm text-muted-foreground">
            Manage students, faculty, and authorized platform accounts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-1.5 text-xs border-border hover:bg-surface-elevated cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin text-accent' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── 2. Top Overview KPI Cards (5 Cards) ─────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Users */}
        <div className="bg-surface border border-border rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Total Users</span>
            <Users className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-3">
            {isOverviewLoading ? (
              <Skeleton className="h-7 w-12 bg-surface-elevated" />
            ) : (
              <span className="text-2xl font-bold text-white">{overview?.totalUsers ?? 0}</span>
            )}
            <span className="text-[11px] text-muted-foreground block mt-0.5">Unique platform identities</span>
          </div>
        </div>

        {/* Students */}
        <div className="bg-surface border border-border rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Students</span>
            <GraduationCap className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            {isOverviewLoading ? (
              <Skeleton className="h-7 w-12 bg-surface-elevated" />
            ) : (
              <span className="text-2xl font-bold text-emerald-400">{overview?.totalStudents ?? 0}</span>
            )}
            <span className="text-[11px] text-muted-foreground block mt-0.5">Enrolled candidates</span>
          </div>
        </div>

        {/* Faculty */}
        <div className="bg-surface border border-border rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Faculty</span>
            <Briefcase className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-3">
            {isOverviewLoading ? (
              <Skeleton className="h-7 w-12 bg-surface-elevated" />
            ) : (
              <span className="text-2xl font-bold text-purple-400">{overview?.totalFaculty ?? 0}</span>
            )}
            <span className="text-[11px] text-muted-foreground block mt-0.5">Faculty instructors</span>
          </div>
        </div>

        {/* Admins */}
        <div className="bg-surface border border-border rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Super Admin</span>
            <ShieldAlert className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-3">
            {isOverviewLoading ? (
              <Skeleton className="h-7 w-12 bg-surface-elevated" />
            ) : (
              <span className="text-2xl font-bold text-amber-400">{overview?.totalSuperAdmins ?? 0}</span>
            )}
            <span className="text-[11px] text-muted-foreground block mt-0.5">Protected accounts</span>
          </div>
        </div>

        {/* Active Accounts */}
        <div className="bg-surface border border-border rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Active Accounts</span>
            <CheckCircle2 className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-3">
            {isOverviewLoading ? (
              <Skeleton className="h-7 w-12 bg-surface-elevated" />
            ) : (
              <span className="text-2xl font-bold text-cyan-400">{overview?.activeUsers ?? 0}</span>
            )}
            <span className="text-[11px] text-muted-foreground block mt-0.5">Verified active</span>
          </div>
        </div>
      </div>

      {/* ── 3. Search & Filters Bar ────────────────────────────────────────── */}
      <Card className="p-4 bg-surface border-border">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name, email, department..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 text-xs bg-surface-elevated border-border"
            />
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground shrink-0" />
            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs bg-surface-elevated border border-border rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="ALL">All Roles</option>
              <option value="SUPER_ADMIN">Super Admins</option>
              <option value="ADMINISTRATOR">Administrators</option>
              <option value="FACULTY">Faculty</option>
              <option value="STUDENT">Students</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs bg-surface-elevated border border-border rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="LOCKED">Locked</option>
              <option value="BANNED">Banned</option>
              <option value="PENDING_VERIFICATION">Pending</option>
            </select>
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-muted-foreground shrink-0" />
            <select
              value={department}
              onChange={(e) => {
                setDepartment(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs bg-surface-elevated border border-border rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="ALL">All Departments</option>
              {overview?.departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Summary Tags */}
        {(search || role !== 'ALL' || status !== 'ALL' || department !== 'ALL') && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/60 text-xs">
            <span className="text-muted-foreground text-[11px]">Active Filters:</span>
            {search && (
              <span className="px-2 py-0.5 rounded bg-surface-elevated text-white border border-border text-[11px]">
                Search: "{search}"
              </span>
            )}
            {role !== 'ALL' && (
              <span className="px-2 py-0.5 rounded bg-surface-elevated text-accent border border-border text-[11px]">
                Role: {role}
              </span>
            )}
            {status !== 'ALL' && (
              <span className="px-2 py-0.5 rounded bg-surface-elevated text-cyan-400 border border-border text-[11px]">
                Status: {status}
              </span>
            )}
            {department !== 'ALL' && (
              <span className="px-2 py-0.5 rounded bg-surface-elevated text-purple-400 border border-border text-[11px]">
                Dept: {department}
              </span>
            )}
            <button
              onClick={() => {
                setSearch('');
                setRole('ALL');
                setStatus('ALL');
                setDepartment('ALL');
                setPage(1);
              }}
              className="text-[11px] text-rose-400 hover:underline ml-auto"
            >
              Reset Filters
            </button>
          </div>
        )}
      </Card>

      {/* ── 4. Error State ─────────────────────────────────────────────────── */}
      {isError && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
            <div>
              <p className="font-semibold">Failed to load platform users</p>
              <p className="text-xs text-rose-400 mt-0.5">
                {(error as any)?.response?.data?.error?.message ||
                  (error as any)?.message ||
                  'An unexpected error occurred.'}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="text-xs border-rose-500/30">
            Try Again
          </Button>
        </div>
      )}

      {/* ── 5. User Table ──────────────────────────────────────────────────── */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-elevated border-b border-border text-muted-foreground uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Department & College</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Activity / Score</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isUsersLoading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="py-3.5 px-4">
                      <Skeleton className="h-6 w-full bg-surface-elevated" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <EmptyState
                      icon={<Users className="h-8 w-8 text-muted-foreground" />}
                      title={search || role !== 'ALL' || status !== 'ALL' || department !== 'ALL' ? 'No users match filters' : 'No users found'}
                      description="No platform user accounts meet the specified criteria."
                    />
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const isSuperAdmin = user.role === 'SUPER_ADMIN';
                  const isStudent = user.role === 'STUDENT';
                  const isFaculty = user.role === 'FACULTY';
                  const isAdmin = user.role === 'ADMINISTRATOR';
                  const protected_ = isProtectedAccount(user);

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-surface-elevated/40 transition-colors group cursor-pointer"
                      onClick={() => setSelectedUserId(user.id)}
                    >
                      {/* Name & Email */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                              isSuperAdmin
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : isAdmin
                                ? 'bg-accent/20 text-accent border border-accent/40'
                                : isFaculty
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                            }`}
                          >
                            {protected_ ? <Lock className="h-3.5 w-3.5" /> : getInitials(user.name)}
                          </div>
                          <div className="space-y-0.5 min-w-0">
                            <span className="font-semibold text-white truncate block group-hover:text-accent transition-colors">
                              {user.name}
                            </span>
                            <span className="text-[11px] text-muted-foreground font-mono truncate block">
                              {user.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold inline-flex items-center gap-1 ${
                            isSuperAdmin
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/40'
                              : isAdmin
                              ? 'bg-accent/15 text-accent border border-accent/30'
                              : isFaculty
                              ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {isSuperAdmin && <Lock className="h-2.5 w-2.5" />}
                          {user.role}
                        </span>
                      </td>

                      {/* Department & College */}
                      <td className="py-3.5 px-4 max-w-[220px]">
                        <div className="space-y-0.5">
                          <span className="text-white font-medium block truncate">
                            {user.department !== 'N/A' ? user.department : 'Data unavailable'}
                          </span>
                          <span className="text-[10px] text-muted-foreground truncate block">
                            {user.designation ? `${user.designation} • ` : ''}
                            {user.college}
                          </span>
                        </div>
                      </td>

                      {/* Account Status Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold inline-block ${
                            user.status === 'ACTIVE'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : user.status === 'LOCKED'
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : user.status === 'BANNED'
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              : 'bg-neutral-500/15 text-neutral-300 border border-neutral-500/30'
                          }`}
                        >
                          {user.status}
                        </span>
                      </td>

                      {/* Activity / Score */}
                      <td className="py-3.5 px-4">
                        {isStudent ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 font-mono text-white">
                              <span>{user.assessmentsCount} Assessments</span>
                              {user.averageScore !== null && (
                                <span className="text-accent font-bold">
                                  ({user.averageScore}%)
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-muted-foreground block">
                              {user.completedAssessmentsCount} completed
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-[11px] font-mono">
                            {new Date(user.lastActivity).toLocaleDateString()}
                          </span>
                        )}
                      </td>

                      {/* Created Date */}
                      <td className="py-3.5 px-4 font-mono text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedUserId(user.id)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-white"
                            title="View Details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(user)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-accent"
                            title="Edit Profile"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          {protected_ ? (
                            <span
                              title="Protected: Super Admin accounts cannot be status-changed"
                              className="h-7 w-7 flex items-center justify-center text-amber-500/60 cursor-not-allowed"
                            >
                              <Lock className="h-3.5 w-3.5" />
                            </span>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenStatus(user)}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-cyan-400"
                              title="Change Account Status"
                            >
                              <ShieldCheck className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination Footer ────────────────────────────────────────────── */}
        {!isUsersLoading && users.length > 0 && (
          <div className="p-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground bg-surface-elevated/30">
            <div>
              Showing <strong className="text-white">{(pagination.page - 1) * pagination.limit + 1}</strong>–
              <strong className="text-white">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </strong>{' '}
              of <strong className="text-white">{pagination.total}</strong> users
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page <= 1}
                className="h-8 px-2 text-xs border-border"
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Prev
              </Button>
              <span className="font-mono px-2 text-white">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={pagination.page >= pagination.totalPages}
                className="h-8 px-2 text-xs border-border"
              >
                Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── 6. User Detail Modal / Drawer ──────────────────────────────────── */}
      {selectedUserId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-border flex items-center justify-between bg-surface-elevated">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center font-bold font-mono">
                  {userDetail ? getInitials(`${userDetail.firstName} ${userDetail.lastName}`) : 'U'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white">
                      {userDetail ? `${userDetail.firstName} ${userDetail.lastName}` : 'User Profile'}
                    </h2>
                    {userDetail && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-accent/15 text-accent border border-accent/30">
                        {userDetail.role}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">{userDetail?.email}</p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedUserId(null)}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              {isDetailLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-24 w-full bg-surface-elevated" />
                  <Skeleton className="h-40 w-full bg-surface-elevated" />
                </div>
              ) : userDetail ? (
                <>
                  {/* Account Information Card */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-surface-elevated/60 border border-border">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Account Status</span>
                      <span className="font-mono font-bold text-emerald-400">{userDetail.status}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Department</span>
                      <span className="font-medium text-white">{userDetail.profile.department}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Institution / College</span>
                      <span className="font-medium text-white">{userDetail.profile.college}</span>
                    </div>
                    {userDetail.profile.designation && (
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Designation</span>
                        <span className="font-medium text-white">{userDetail.profile.designation}</span>
                      </div>
                    )}
                    {userDetail.profile.rollNumber && (
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Roll / Register Number</span>
                        <span className="font-mono text-white">{userDetail.profile.rollNumber}</span>
                      </div>
                    )}
                    {userDetail.profile.employeeId && (
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Employee ID</span>
                        <span className="font-mono text-white">{userDetail.profile.employeeId}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Registered On</span>
                      <span className="font-mono text-muted-foreground">
                        {new Date(userDetail.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* If Student: Assessment Overview & History */}
                  {userDetail.role === 'STUDENT' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-border pb-2">
                        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                          <Award className="h-4 w-4 text-accent" />
                          Student Assessment History
                        </h3>
                        <span className="font-mono text-muted-foreground">
                          {userDetail.assessmentSummary.completedAssessments}/{userDetail.assessmentSummary.totalAssessments} Completed
                          {userDetail.assessmentSummary.averageScore !== null && (
                            <strong className="text-accent ml-1.5">
                              (Avg: {userDetail.assessmentSummary.averageScore}%)
                            </strong>
                          )}
                        </span>
                      </div>

                      {userDetail.interviewsHistory.length === 0 ? (
                        <div className="p-6 text-center text-muted-foreground rounded-lg bg-surface-elevated/30 border border-border">
                          No assessment sessions initiated yet.
                        </div>
                      ) : (
                        <div className="border border-border rounded-xl overflow-hidden">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-surface-elevated border-b border-border text-muted-foreground font-semibold">
                              <tr>
                                <th className="py-2.5 px-3">Session Title</th>
                                <th className="py-2.5 px-3">State</th>
                                <th className="py-2.5 px-3">Score</th>
                                <th className="py-2.5 px-3">Started At</th>
                                <th className="py-2.5 px-3">Completed At</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60 font-mono">
                              {userDetail.interviewsHistory.map((iv) => (
                                <tr key={iv.id} className="hover:bg-surface-elevated/40">
                                  <td className="py-2.5 px-3 text-white font-sans font-medium">
                                    {iv.title}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                        iv.state === 'COMPLETED'
                                          ? 'bg-emerald-500/15 text-emerald-400'
                                          : 'bg-amber-500/15 text-amber-400'
                                      }`}
                                    >
                                      {iv.state}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3">
                                    {iv.score !== null ? (
                                      <span
                                        className={`font-bold ${
                                          iv.score >= 60
                                            ? 'text-emerald-400'
                                            : iv.score >= 40
                                            ? 'text-amber-400'
                                            : 'text-rose-400'
                                        }`}
                                      >
                                        {iv.score}%
                                      </span>
                                    ) : (
                                      <span className="text-muted-foreground">—</span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 text-muted-foreground">
                                    {new Date(iv.startedAt).toLocaleDateString()}
                                  </td>
                                  <td className="py-2.5 px-3 text-muted-foreground">
                                    {iv.finishedAt ? new Date(iv.finishedAt).toLocaleDateString() : 'In-Progress'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* If Faculty: Overview */}
                  {userDetail.role === 'FACULTY' && (
                    <div className="p-4 rounded-xl bg-surface-elevated/40 border border-border space-y-2">
                      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-purple-400" />
                        Faculty Operational Scope
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        Authorized to manage interview templates, review cohort student rosters, and inspect student code execution telemetry within the <strong>{userDetail.profile.department}</strong> department.
                      </p>
                    </div>
                  )}

                  {/* If Admin or Super Admin: Overview */}
                  {(userDetail.role === 'ADMINISTRATOR' || userDetail.role === 'SUPER_ADMIN') && (
                    <div className={`p-4 rounded-xl border space-y-2 ${
                      userDetail.isProtected
                        ? 'bg-amber-500/8 border-amber-500/40'
                        : 'bg-surface-elevated/40 border-border'
                    }`}>
                      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        {userDetail.isProtected
                          ? <Lock className="h-4 w-4 text-amber-400" />
                          : <ShieldCheck className="h-4 w-4 text-accent" />
                        }
                        {userDetail.isProtected ? 'Super Admin — Protected Account' : 'Platform Administrator Scope'}
                      </h3>
                      {userDetail.isProtected && (
                        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px]">
                          <Lock className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                          <span>
                            <strong>Account Protection Active.</strong> This account holds the Super Admin role and cannot be deactivated, locked, or suspended through normal account management. Enforcement is server-side.
                          </span>
                        </div>
                      )}
                      <p className="text-muted-foreground leading-relaxed">
                        {userDetail.isProtected
                          ? 'Authorized for unrestricted platform administration including user management, security administration, microservices telemetry monitoring, and curriculum configuration.'
                          : 'Authorized for platform-wide user management, curricular dataset configuration, microservices telemetry monitoring, and security administration.'
                        }
                      </p>
                    </div>
                  )}
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border bg-surface-elevated flex items-center justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedUserId(null)}
                className="text-xs border-border"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── 7. Edit Profile Modal ──────────────────────────────────────────── */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-border flex items-center justify-between bg-surface-elevated">
              <div className="flex items-center gap-2.5">
                <Edit2 className="h-4 w-4 text-accent" />
                <h2 className="text-sm font-bold text-white">Edit User Profile</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingUser(null)}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4 text-xs">
              {actionError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  {actionError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-muted-foreground font-medium">First Name</label>
                  <Input
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    required
                    className="text-xs bg-surface-elevated border-border"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-muted-foreground font-medium">Last Name</label>
                  <Input
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    className="text-xs bg-surface-elevated border-border"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-muted-foreground font-medium">Phone</label>
                <Input
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="+91 98400 00000"
                  className="text-xs bg-surface-elevated border-border"
                />
              </div>

              <div className="space-y-1">
                <label className="text-muted-foreground font-medium">Department</label>
                <Input
                  value={editForm.department}
                  onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                  placeholder="e.g. Computer Science & Engineering"
                  className="text-xs bg-surface-elevated border-border"
                />
              </div>

              {editingUser.role === 'FACULTY' && (
                <div className="space-y-1">
                  <label className="text-muted-foreground font-medium">Designation</label>
                  <Input
                    value={editForm.designation}
                    onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                    placeholder="e.g. Associate Professor"
                    className="text-xs bg-surface-elevated border-border"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-muted-foreground font-medium">College / Institution</label>
                <Input
                  value={editForm.college}
                  onChange={(e) => setEditForm({ ...editForm, college: e.target.value })}
                  placeholder="e.g. Government Engineering College"
                  className="text-xs bg-surface-elevated border-border"
                />
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditingUser(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? 'Saving...' : 'Save Profile'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 8. Account Status Management Modal ─────────────────────────────── */}
      {statusChangingUser && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-4 w-4 text-slate-700" />
                <h2 className="text-sm font-bold text-slate-900">Account Status</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStatusChangingUser(null)}
                className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {actionError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {actionError}
                </div>
              )}

              <div>
                <p className="text-slate-900 font-medium mb-1">
                  Manage status for: <strong>{statusChangingUser.name}</strong>
                </p>
                <p className="text-slate-500 font-mono text-[11px]">
                  {statusChangingUser.email}
                </p>
              </div>

              {isProtectedAccount(statusChangingUser) && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-start gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>
                    <strong>Self-Protection Notice:</strong> You are currently logged in as this administrator. Modifying to non-active status is restricted to prevent self-lockout.
                  </span>
                </div>
              )}


              <div className="space-y-1.5">
                <label className="text-slate-700 font-medium">Select Target Status</label>
                <select
                  value={newStatusValue}
                  onChange={(e) => setNewStatusValue(e.target.value)}
                  disabled={isProtectedAccount(statusChangingUser)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                  <option value="ACTIVE">ACTIVE (Authorized access)</option>
                  <option value="INACTIVE" disabled={isSelf(statusChangingUser.id) || isProtectedAccount(statusChangingUser)}>
                    INACTIVE (Login disabled)
                  </option>
                  <option value="LOCKED" disabled={isSelf(statusChangingUser.id) || isProtectedAccount(statusChangingUser)}>
                    LOCKED (Security lock)
                  </option>
                  <option value="BANNED" disabled={isSelf(statusChangingUser.id) || isProtectedAccount(statusChangingUser)}>
                    BANNED (Suspended permanently)
                  </option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setStatusChangingUser(null)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveStatus}
                  disabled={updateStatusMutation.isPending || isProtectedAccount(statusChangingUser)}
                  className="text-xs"
                  title={isProtectedAccount(statusChangingUser) ? 'Super Admin accounts are protected — server will reject this action' : undefined}
                >
                  {updateStatusMutation.isPending ? 'Updating...' : isProtectedAccount(statusChangingUser) ? '🔒 Protected' : 'Update Status'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
