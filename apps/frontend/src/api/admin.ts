import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './axios/instance';

export interface AdminProfile {
  fullName: string;
  email: string;
  designation: string;
  department: string;
  roles: string[];
}

export interface AdminOverview {
  totalStudents: number;
  totalFaculty: number;
  totalAdmins: number;
  totalUsers: number;
  totalAssessments: number;
  completedAssessments: number;
  inProgressAssessments: number;
  averageOverallScore: number | null;
  averageAptitudeScore: number | null;
  averageCodingScore: number | null;
  averageHrScore: number | null;
  totalOfficialSubmissions: number;
  totalTestRuns: number;
  totalExecutions: number;
  submissionAcceptanceRate: number | null;
  testCasePassRate: number | null;
  hasEnoughData: boolean;
}

export interface AdminCodingAnalytics {
  officialSubmissionsCount: number;
  testRunsCount: number;
  totalExecutions: number;
  acceptedSubmissions: number;
  submissionAcceptanceRate: number | null;
  testsPassedCount: number;
  totalTestsCount: number;
  testCasePassRate: number | null;
  verdictDistribution: {
    accepted: number;
    wrongAnswer: number;
    compilationError: number;
    runtimeError: number;
    timeLimitExceeded: number;
  };
}

export interface AdminQuestionBankStats {
  totalQuestions: number;
  publishedQuestions: number;
  draftQuestions: number;
  archivedQuestions: number;
  categoriesCount: number;
  categories: Array<{
    name: string;
    count: number;
  }>;
}

export interface AdminTemplatesStats {
  totalTemplates: number;
  publishedCount: number;
  draftCount: number;
  archivedCount: number;
}

export interface AdminPerformanceTrendItem {
  date: string;
  averageScore: number;
  assessmentsCount: number;
}

export interface AdminActivityItem {
  id: string;
  type: 'ASSESSMENT_COMPLETED' | 'CODE_SUBMITTED' | 'TEMPLATE_CREATED' | 'USER_REGISTERED';
  title: string;
  description: string;
  timestamp: string;
  badge?: string;
  badgeVariant?: 'success' | 'warning' | 'info' | 'neutral';
}

export interface AdminServiceHealthProbe {
  name: string;
  port: number;
  status: 'Healthy' | 'Degraded' | 'Unreachable';
  latency: string;
}

export interface AdminSystemHealth {
  services: AdminServiceHealthProbe[];
  overallStatus: 'OPTIMAL' | 'OPERATIONAL' | 'DEGRADED';
  databaseStatus: string;
}

export interface AdminAttentionItem {
  id: string;
  title: string;
  description: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  count: number;
}

export interface AdminDashboardData {
  adminProfile: AdminProfile;
  overview: AdminOverview;
  codingAnalytics: AdminCodingAnalytics;
  questionBank: AdminQuestionBankStats;
  templates: AdminTemplatesStats;
  performanceTrend: AdminPerformanceTrendItem[];
  recentActivities: AdminActivityItem[];
  systemHealth: AdminSystemHealth;
  attentionItems: AdminAttentionItem[];
  metadata: {
    dataStatus: string;
    scope: string;
    generatedAt: string;
  };
}

// ─── ADMIN USERS DATA TYPES ──────────────────────────────────────────────────

export interface AdminUsersOverviewData {
  totalUsers: number;
  totalStudents: number;
  totalFaculty: number;
  totalAdmins: number;
  totalSuperAdmins: number;
  activeUsers: number;
  departments: string[];
}

export interface AdminUserItem {
  id: string;
  profileId: string | null;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  /** Effective (highest-precedence) role. SUPER_ADMIN wins over ADMINISTRATOR. */
  role: 'SUPER_ADMIN' | 'ADMINISTRATOR' | 'FACULTY' | 'STUDENT';
  /** All raw role names this identity holds in auth_db */
  roles: string[];
  department: string;
  designation: string | null;
  college: string;
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED' | 'BANNED' | 'PENDING_VERIFICATION';
  failedLoginAttempts: number;
  assessmentsCount: number;
  completedAssessmentsCount: number;
  averageScore: number | null;
  lastActivity: string;
  createdAt: string;
  updatedAt: string;
  /** True when this identity holds the SUPER_ADMIN role. Account mutations are blocked server-side. */
  isProtected: boolean;
}

export interface AdminUserListParams {
  search?: string;
  role?: string;
  status?: string;
  department?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AdminUserListResponse {
  users: AdminUserItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface AdminUserDetailInterview {
  id: string;
  title: string;
  state: string;
  score: number | null;
  startedAt: string;
  finishedAt: string | null;
  configuration: {
    interviewType?: string;
    difficulty?: string;
  };
}

export interface AdminUserDetail {
  id: string;
  profileId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  /** Effective (highest-precedence) role. SUPER_ADMIN wins over ADMINISTRATOR. */
  role: 'SUPER_ADMIN' | 'ADMINISTRATOR' | 'FACULTY' | 'STUDENT';
  /** All raw role names this identity holds in auth_db */
  roles: string[];
  status: string;
  failedLoginAttempts: number;
  createdAt: string;
  updatedAt: string;
  /** True when this identity holds the SUPER_ADMIN role. Account mutations are blocked server-side. */
  isProtected: boolean;
  profile: {
    department: string;
    designation: string | null;
    college: string;
    rollNumber: string | null;
    registerNumber: string | null;
    employeeId: string | null;
    batch: string | null;
  };
  assessmentSummary: {
    totalAssessments: number;
    completedAssessments: number;
    inProgressAssessments: number;
    averageScore: number | null;
  };
  interviewsHistory: AdminUserDetailInterview[];
}

// ─── ADMIN DASHBOARD QUERIES ─────────────────────────────────────────────────

export const getAdminDashboard = async (): Promise<AdminDashboardData> => {
  try {
    const res = await api.get<{ success: boolean; data: AdminDashboardData }>('/admin/dashboard');
    return (res.data as any).data || res.data;
  } catch {
    const res = await api.get<{ success: boolean; data: AdminDashboardData }>('/interviews/admin/dashboard');
    return (res.data as any).data || res.data;
  }
};

export const useAdminDashboard = () => {
  return useQuery<AdminDashboardData>({
    queryKey: ['admin', 'dashboard'],
    queryFn: getAdminDashboard,
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });
};

// ─── ADMIN USERS QUERIES & MUTATIONS ─────────────────────────────────────────

export const getAdminUsersOverview = async (): Promise<AdminUsersOverviewData> => {
  const res = await api.get<{ success: boolean; data: AdminUsersOverviewData }>(
    '/users/admin/users/overview'
  );
  return (res.data as any).data || res.data;
};

export const useAdminUsersOverview = () => {
  return useQuery<AdminUsersOverviewData>({
    queryKey: ['admin', 'users', 'overview'],
    queryFn: getAdminUsersOverview,
    staleTime: 30000,
  });
};

export const getAdminUsers = async (
  params: AdminUserListParams
): Promise<AdminUserListResponse> => {
  const res = await api.get<{ success: boolean; data: AdminUserListResponse }>(
    '/users/admin/users',
    { params }
  );
  const data = (res.data as any).data || res.data;
  return {
    users: data.users || [],
    pagination: data.pagination || {
      page: params.page || 1,
      limit: params.limit || 10,
      total: (data.users || []).length,
      totalPages: 1,
      hasMore: false,
    },
  };
};

export const useAdminUsers = (params: AdminUserListParams) => {
  return useQuery<AdminUserListResponse>({
    queryKey: ['admin', 'users', params],
    queryFn: () => getAdminUsers(params),
    placeholderData: (previousData) => previousData,
    staleTime: 10000,
  });
};

export const getAdminUserDetail = async (identityId: string): Promise<AdminUserDetail> => {
  const res = await api.get<{ success: boolean; data: AdminUserDetail }>(
    `/users/admin/users/${identityId}`
  );
  return (res.data as any).data || res.data;
};

export const useAdminUserDetail = (identityId: string | null) => {
  return useQuery<AdminUserDetail>({
    queryKey: ['admin', 'users', 'detail', identityId],
    queryFn: () => getAdminUserDetail(identityId!),
    enabled: Boolean(identityId),
  });
};

export const useUpdateAdminUserProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: {
        firstName?: string;
        lastName?: string;
        phone?: string;
        department?: string;
        designation?: string;
        college?: string;
      };
    }) => {
      const res = await api.patch(`/users/admin/users/${id}/profile`, data);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users', 'detail', variables.id] });
    },
  });
};

export const useUpdateAdminUserStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await api.patch(`/users/admin/users/${id}/status`, { status });
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users', 'overview'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users', 'detail', variables.id] });
    },
  });
};
