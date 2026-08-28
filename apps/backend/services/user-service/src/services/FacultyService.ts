import { BaseService } from '@nm/api-base';
import { ErrorFactory } from '@nm/errors';
import { ProfileRepository } from '../repositories/ProfileRepository';
import { PrismaClient } from '../generated/client';
import axios from 'axios';

let _prisma: PrismaClient;
const prisma = new Proxy({} as PrismaClient, {
  get(target, prop) {
    if (!_prisma) _prisma = new PrismaClient();
    return (_prisma as any)[prop];
  },
});

export interface StudentFilterParams {
  search?: string;
  department?: string;
  batch?: string;
  status?: string;
}

export class FacultyService extends BaseService {
  private profileRepo: ProfileRepository;

  constructor() {
    super('FacultyService');
    this.profileRepo = new ProfileRepository();
  }

  /**
   * Faculty Overview Dashboard Data
   */
  public async getFacultyDashboard(facultyIdentityId: string) {
    // 1. Fetch authenticated faculty profile
    const faculty = (await this.profileRepo.findByIdentityId(facultyIdentityId)) as any;
    if (!faculty) {
      throw ErrorFactory.notFound('Faculty profile not found');
    }

    const facultyName =
      `${faculty.firstName} ${faculty.lastName || ''}`.trim() || 'Faculty Member';
    const college = faculty.facultyProfile?.college || faculty.nmProfile?.institution;
    const department = faculty.facultyProfile?.department || faculty.nmProfile?.department;
    const designation = faculty.facultyProfile?.designation || 'Faculty Instructor';

    // 2. Fetch real students belonging to the same institution / department
    const baseWhere: any = {
      identityId: { not: facultyIdentityId },
      studentProfile: { isNot: null },
      facultyProfile: null,
      adminProfile: null,
    };

    let students = await prisma.profile.findMany({
      where: {
        ...baseWhere,
        ...(college && {
          OR: [
            { studentProfile: { college: { equals: college, mode: 'insensitive' } } },
            { nmProfile: { institution: { equals: college, mode: 'insensitive' } } },
          ],
        }),
        ...(department && {
          OR: [
            { studentProfile: { department: { equals: department, mode: 'insensitive' } } },
            { nmProfile: { department: { equals: department, mode: 'insensitive' } } },
          ],
        }),
      },
      include: {
        studentProfile: true,
        nmProfile: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fallback: If no students in narrow college/dept filter, get all real students (strictly excluding faculty)
    if (students.length === 0) {
      students = await prisma.profile.findMany({
        where: baseWhere,
        include: {
          studentProfile: true,
          nmProfile: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    const studentMap: Record<string, any> = {};
    students.forEach((s) => {
      studentMap[s.identityId] = s;
    });

    const studentIdentityIds = students.map((s) => s.identityId);

    // 3. Query interview-service for real cohort analytics & telemetry
    let cohortAnalytics: any = {
      totalAssessments: 0,
      totalSubmissions: 0,
      averageScore: 0,
      hasEnoughPerformanceData: false,
      performanceTrend: [],
      recentActivity: [],
      studentStats: {},
    };

    if (studentIdentityIds.length > 0) {
      try {
        const response = await axios.post(
          'http://localhost:3004/cohort-analytics',
          { identityIds: studentIdentityIds },
          { timeout: 5000 }
        );
        if (response.data) {
          cohortAnalytics = response.data;
        }
      } catch (err: any) {
        this.logger.warn(
          `Could not fetch cohort analytics from interview-service: ${err.message}`
        );
      }
    }

    // 4. Determine "Active Students" (activity within last 30 days)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    let activeStudentsCount = 0;

    const studentStats = cohortAnalytics.studentStats || {};
    const studentsNeedingAttentionList: any[] = [];

    students.forEach((student) => {
      const stats = studentStats[student.identityId];
      const studentName = `${student.firstName} ${student.lastName || ''}`.trim() || 'Candidate';
      const studentDept =
        student.studentProfile?.department ||
        student.nmProfile?.department ||
        department ||
        'Computer Science & Engineering';
      const studentBatch =
        student.studentProfile?.batch || student.nmProfile?.batch || '2025';

      if (stats?.lastActiveAt) {
        const lastActiveTime = new Date(stats.lastActiveAt).getTime();
        if (lastActiveTime >= thirtyDaysAgo) {
          activeStudentsCount++;
        }
      }

      // 5. Evaluate "Students Needing Attention" ONLY for students with real evaluated performance data
      if (stats) {
        const scores: number[] = stats.scores || [];
        const avgStudentScore =
          scores.length > 0
            ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
            : null;

        if (avgStudentScore !== null && avgStudentScore < 50) {
          studentsNeedingAttentionList.push({
            id: student.id,
            identityId: student.identityId,
            name: studentName,
            department: studentDept,
            batch: studentBatch,
            performanceScore: `${avgStudentScore}%`,
            reason: `Average score (${avgStudentScore}%) is below 50% benchmark`,
            severity: 'HIGH',
          });
        } else if (stats.failedSubmissions >= 3) {
          studentsNeedingAttentionList.push({
            id: student.id,
            identityId: student.identityId,
            name: studentName,
            department: studentDept,
            batch: studentBatch,
            performanceScore: `${stats.failedSubmissions} failures`,
            reason: `Repeated failed test cases (${stats.failedSubmissions} unsuccessful submissions)`,
            severity: 'MEDIUM',
          });
        }
      }
    });

    // 6. Enrich Recent Activity with Student Names
    const enrichedRecentActivity = (cohortAnalytics.recentActivity || [])
      .map((act: any) => {
        const student = studentMap[act.identityId];
        const name = student
          ? `${student.firstName} ${student.lastName || ''}`.trim()
          : null;
        if (!name) return null;
        return {
          id: act.id,
          studentName: name,
          activityTitle: act.title || 'Practice Session',
          status: act.state || 'COMPLETED',
          timestamp: act.timestamp,
        };
      })
      .filter(Boolean);

    return {
      faculty: {
        id: faculty.id,
        identityId: faculty.identityId,
        name: facultyName,
        college: college || 'Naan Mudhalvan Partner College',
        department: department || 'Computer Science & Engineering',
        designation,
      },
      metrics: {
        totalStudents: students.length,
        activeStudents: activeStudentsCount,
        assessments: cohortAnalytics.totalAssessments || 0,
        totalSubmissions: cohortAnalytics.totalSubmissions || 0,
        averagePerformance: cohortAnalytics.averageScore || 0,
        hasEnoughPerformanceData: !!cohortAnalytics.hasEnoughPerformanceData,
      },
      performanceTrend: cohortAnalytics.performanceTrend || [],
      studentsNeedingAttention: studentsNeedingAttentionList.slice(0, 10),
      recentActivity: enrichedRecentActivity,
    };
  }

  /**
   * Get List of Authorized Students with Coding, Interview, and Performance Aggregates
   */
  public async getStudents(facultyIdentityId: string, filters: StudentFilterParams = {}) {
    const faculty = (await this.profileRepo.findByIdentityId(facultyIdentityId)) as any;
    if (!faculty) {
      throw ErrorFactory.unauthorized('Faculty profile not found');
    }

    const college = faculty.facultyProfile?.college || faculty.nmProfile?.institution;
    const department = faculty.facultyProfile?.department || faculty.nmProfile?.department;

    // Strictly students only: exclude faculty themselves and anyone with facultyProfile / adminProfile
    const baseWhere: any = {
      identityId: { not: facultyIdentityId },
      studentProfile: { isNot: null },
      facultyProfile: null,
      adminProfile: null,
    };

    let students = await prisma.profile.findMany({
      where: {
        ...baseWhere,
        ...(college && {
          OR: [
            { studentProfile: { college: { equals: college, mode: 'insensitive' } } },
            { nmProfile: { institution: { equals: college, mode: 'insensitive' } } },
          ],
        }),
        ...(department && {
          OR: [
            { studentProfile: { department: { equals: department, mode: 'insensitive' } } },
            { nmProfile: { department: { equals: department, mode: 'insensitive' } } },
          ],
        }),
      },
      include: {
        studentProfile: true,
        nmProfile: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (students.length === 0) {
      students = await prisma.profile.findMany({
        where: baseWhere,
        include: {
          studentProfile: true,
          nmProfile: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    const studentIdentityIds = students.map((s) => s.identityId);

    // Fetch cohort analytics from interview-service
    let studentStats: Record<string, any> = {};
    if (studentIdentityIds.length > 0) {
      try {
        const response = await axios.post(
          'http://localhost:3004/cohort-analytics',
          { identityIds: studentIdentityIds },
          { timeout: 5000 }
        );
        if (response.data?.studentStats) {
          studentStats = response.data.studentStats;
        }
      } catch (err: any) {
        this.logger.warn(`Could not fetch student stats: ${err.message}`);
      }
    }

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const deptSet = new Set<string>();
    const batchSet = new Set<string>();

    // Transform students to standardized view model
    const transformedStudents = students.map((student) => {
      const stats = studentStats[student.identityId] || {
        assessmentsCompleted: 0,
        totalAssessments: 0,
        totalSubmissions: 0,
        scores: [],
        lastActiveAt: null,
        failedSubmissions: 0,
      };

      const fullName = `${student.firstName} ${student.lastName || ''}`.trim() || 'Candidate';
      const studentDept =
        student.studentProfile?.department ||
        student.nmProfile?.department ||
        department ||
        'Computer Science & Engineering';
      const studentBatch =
        student.studentProfile?.batch || student.nmProfile?.batch || '2025';
      const studentCollege =
        student.studentProfile?.college ||
        student.nmProfile?.institution ||
        college ||
        'Naan Mudhalvan Partner College';
      const rollNumber =
        student.studentProfile?.rollNumber ||
        student.studentProfile?.registerNumber ||
        student.nmProfile?.studentId ||
        '—';

      deptSet.add(studentDept);
      batchSet.add(studentBatch);

      const scores: number[] = stats.scores || [];
      const avgScore =
        scores.length > 0
          ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
          : null;

      // Status resolution
      let isActive = false;
      if (stats.lastActiveAt) {
        isActive = new Date(stats.lastActiveAt).getTime() >= thirtyDaysAgo;
      }

      let status: 'ACTIVE' | 'INACTIVE' | 'NEEDS_ATTENTION' = 'INACTIVE';
      if ((avgScore !== null && avgScore < 50) || stats.failedSubmissions >= 3) {
        status = 'NEEDS_ATTENTION';
      } else if (isActive || stats.totalAssessments > 0 || stats.totalSubmissions > 0) {
        status = 'ACTIVE';
      }

      return {
        id: student.id,
        identityId: student.identityId,
        firstName: student.firstName,
        lastName: student.lastName,
        fullName,
        email: `${student.firstName.toLowerCase().replace(/\s+/g, '.')}@nm.edu`,
        phone: student.phone || '—',
        avatarUrl: student.avatarUrl,
        department: studentDept,
        college: studentCollege,
        batch: studentBatch,
        rollNumber,
        codingActivity: {
          totalSubmissions: stats.totalSubmissions,
          hasData: stats.totalSubmissions > 0,
        },
        interviewActivity: {
          totalInterviews: stats.totalAssessments,
          completedInterviews: stats.assessmentsCompleted,
          hasData: stats.totalAssessments > 0,
        },
        performance: {
          averageScore: avgScore,
          hasEnoughData: avgScore !== null,
        },
        status,
        lastActiveAt: stats.lastActiveAt,
      };
    });

    // Apply in-memory search and filters
    let filtered = transformedStudents;

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      filtered = filtered.filter(
        (s) =>
          s.fullName.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.rollNumber.toLowerCase().includes(q)
      );
    }

    if (filters.department && filters.department !== 'ALL') {
      filtered = filtered.filter(
        (s) => s.department.toLowerCase() === filters.department?.toLowerCase()
      );
    }

    if (filters.batch && filters.batch !== 'ALL') {
      filtered = filtered.filter((s) => s.batch === filters.batch);
    }

    if (filters.status && filters.status !== 'ALL') {
      filtered = filtered.filter((s) => s.status === filters.status);
    }

    return {
      students: filtered,
      totalCount: filtered.length,
      unfilteredCount: transformedStudents.length,
      departments: Array.from(deptSet).sort(),
      batches: Array.from(batchSet).sort(),
    };
  }

  /**
   * Get Detailed Student Performance and Timeline View
   */
  public async getStudentDetail(facultyIdentityId: string, studentId: string) {
    const faculty = (await this.profileRepo.findByIdentityId(facultyIdentityId)) as any;
    if (!faculty) {
      throw ErrorFactory.unauthorized('Faculty profile not found');
    }

    // Find student by ID or identityId (ensuring they are NOT faculty)
    const student = await prisma.profile.findFirst({
      where: {
        OR: [{ id: studentId }, { identityId: studentId }],
        identityId: { not: facultyIdentityId },
        studentProfile: { isNot: null },
        facultyProfile: null,
        adminProfile: null,
      },
      include: {
        studentProfile: true,
        nmProfile: true,
      },
    });

    if (!student) {
      throw ErrorFactory.notFound('Student not found or access denied');
    }

    const college = faculty.facultyProfile?.college || faculty.nmProfile?.institution;
    const department = faculty.facultyProfile?.department || faculty.nmProfile?.department;

    // Fetch individual student analytics from interview-service
    let analytics: any = {
      interviewPerformance: {
        totalInterviews: 0,
        completedInterviews: 0,
        averageScore: null,
        hasInterviewData: false,
        interviews: [],
      },
      codingPerformance: {
        totalSubmissions: 0,
        acceptedSubmissions: 0,
        acceptanceRate: null,
        hasCodingData: false,
        submissions: [],
      },
      recentActivity: [],
    };

    try {
      const res = await axios.post(
        'http://localhost:3004/student-analytics',
        { identityId: student.identityId },
        { timeout: 5000 }
      );
      if (res.data) {
        analytics = res.data;
      }
    } catch (err: any) {
      this.logger.warn(`Could not fetch student analytics: ${err.message}`);
    }

    const fullName = `${student.firstName} ${student.lastName || ''}`.trim() || 'Candidate';
    const studentDept =
      student.studentProfile?.department ||
      student.nmProfile?.department ||
      department ||
      'Computer Science & Engineering';
    const studentBatch =
      student.studentProfile?.batch || student.nmProfile?.batch || '2025';
    const studentCollege =
      student.studentProfile?.college ||
      student.nmProfile?.institution ||
      college ||
      'Naan Mudhalvan Partner College';

    return {
      profile: {
        id: student.id,
        identityId: student.identityId,
        firstName: student.firstName,
        lastName: student.lastName,
        fullName,
        email: `${student.firstName.toLowerCase().replace(/\s+/g, '.')}@nm.edu`,
        phone: student.phone || '—',
        avatarUrl: student.avatarUrl,
        college: studentCollege,
        department: studentDept,
        batch: studentBatch,
        rollNumber:
          student.studentProfile?.rollNumber ||
          student.studentProfile?.registerNumber ||
          student.nmProfile?.studentId ||
          '—',
        placementStatus: student.studentProfile?.placementStatus || 'Eligible for Campus Placement',
        role: 'STUDENT',
        createdAt: student.createdAt,
      },
      codingPerformance: analytics.codingPerformance,
      interviewPerformance: analytics.interviewPerformance,
      recentActivity: analytics.recentActivity,
    };
  }
}
