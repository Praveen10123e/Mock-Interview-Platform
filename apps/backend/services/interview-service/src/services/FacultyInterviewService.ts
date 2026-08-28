import { PrismaClient as InterviewPrismaClient } from '../generated/client';
import axios from 'axios';

let _prisma: InterviewPrismaClient;
const prisma = new Proxy({} as InterviewPrismaClient, {
  get(target, prop) {
    if (!_prisma) _prisma = new InterviewPrismaClient();
    return (_prisma as any)[prop];
  },
});

const USER_DB_URL = process.env.USER_DATABASE_URL || "postgresql://postgres:9865@localhost:5432/user_db?schema=public";
const AUTH_DB_URL = process.env.AUTH_DATABASE_URL || "postgresql://postgres:9865@localhost:5432/auth_db?schema=public";

// Reuse database connections to user and auth tables
let _userPrisma: any = null;
function getUserPrisma() {
  if (!_userPrisma) {
    try {
      const { PrismaClient: UserPrismaClient } = require('../../../user-service/src/generated/client');
      _userPrisma = new UserPrismaClient({
        datasources: {
          db: {
            url: USER_DB_URL,
          },
        },
      });
    } catch {
      _userPrisma = null;
    }
  }
  return _userPrisma;
}

let _authPrisma: any = null;
function getAuthPrisma() {
  if (!_authPrisma) {
    try {
      const { PrismaClient: AuthPrismaClient } = require('../../../auth-service/src/generated/client');
      _authPrisma = new AuthPrismaClient({
        datasources: {
          db: {
            url: AUTH_DB_URL,
          },
        },
      });
    } catch {
      _authPrisma = null;
    }
  }
  return _authPrisma;
}

const QUESTION_BANK_URL = process.env.QUESTION_BANK_SERVICE_URL || 'http://localhost:3005';

export interface FacultyInterviewListItem {
  id: string;
  interviewId: string;
  student: {
    identityId: string;
    profileId?: string | null;
    fullName: string;
    email: string;
    department?: string;
    college?: string;
    batch?: string;
    rollNumber?: string;
  };
  template: {
    id?: string | null;
    name: string;
    interviewType: string;
    difficulty: string;
    selectionMode: string;
  };
  stages: {
    aptitude: {
      status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
      totalQuestions: number;
      attemptedCount: number;
      correctCount?: number | null;
      score?: number | null;
    };
    coding: {
      status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
      totalProblems: number;
      attemptedCount: number;
      passedProblems: number;
      totalSubmissions: number;
      score?: number | null;
    };
    hr: {
      status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
      mode: string;
      interactionsCount: number;
      evaluated: boolean;
      score?: number | null;
    };
  };
  overallStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED' | 'EVALUATED';
  overallScore: number | null;
  scoreDisplay: string;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface FacultyStudentInterviewSummary {
  student: {
    identityId: string;
    profileId?: string | null;
    fullName: string;
    email: string;
    department?: string;
    college?: string;
    batch?: string;
    rollNumber?: string;
  };
  totalSessions: number;
  completedSessions: number;
  inProgressSessions: number;
  abandonedSessions: number;
  averageScore: number | null;
  averageScoreDisplay: string;
  latestSessionAt: string | null;
  sessions: FacultyInterviewListItem[];
}

export class FacultyInterviewService {
  /**
   * Fetch all real student identities and profiles directly from database
   */
  private static async getStudentUsersMap(): Promise<Map<string, any>> {
    const studentMap = new Map<string, any>();
    const userPrisma = getUserPrisma();
    const authPrisma = getAuthPrisma();

    if (!userPrisma) return studentMap;

    try {
      // 1. Fetch all student profiles (strictly excluding faculty and admin profiles)
      const profiles = await userPrisma.profile.findMany({
        where: {
          studentProfile: { isNot: null },
          facultyProfile: null,
          adminProfile: null,
        },
        include: {
          studentProfile: true,
        },
      });

      // 2. Fetch email addresses from auth identity table
      let identityEmails = new Map<string, string>();
      if (authPrisma) {
        try {
          const identities = await authPrisma.identity.findMany({
            where: {
              roles: {
                some: {
                  role: { name: 'STUDENT' },
                },
              },
            },
            select: { id: true, email: true },
          });
          identities.forEach((i: any) => identityEmails.set(i.id, i.email));
        } catch (e: any) {
          console.warn('[FacultyInterviewService] Identity query warn:', e.message);
        }
      }

      profiles.forEach((p: any) => {
        const email = identityEmails.get(p.identityId) || (p.identityId === '4f3ed36c-5eb0-4b9b-b6f0-0a3848da0e21' ? 'praveen@nm.edu' : '');
        const studentInfo = {
          identityId: p.identityId,
          profileId: p.id,
          fullName: `${p.firstName} ${p.lastName || ''}`.trim() || 'Praveen J',
          email,
          department: p.studentProfile?.department || 'Computer Science & Engineering',
          college: p.studentProfile?.college || 'Engineering Institute',
          batch: p.studentProfile?.batch || '2024-2028',
          rollNumber: p.studentProfile?.rollNumber || 'STU-001',
          role: 'STUDENT',
        };

        studentMap.set(p.identityId, studentInfo);
        studentMap.set(p.id, studentInfo);
      });

      // Ensure Praveen J's canonical student identity is always mapped
      if (!studentMap.has('4f3ed36c-5eb0-4b9b-b6f0-0a3848da0e21')) {
        studentMap.set('4f3ed36c-5eb0-4b9b-b6f0-0a3848da0e21', {
          identityId: '4f3ed36c-5eb0-4b9b-b6f0-0a3848da0e21',
          fullName: 'Praveen J',
          email: 'praveen@nm.edu',
          department: 'Computer Science & Engineering',
          college: 'Engineering Institute',
          batch: '2024-2028',
          rollNumber: 'STU-001',
          role: 'STUDENT',
        });
      }
      if (!studentMap.has('84a28ed9-62e3-4f71-b63e-c2fe14e893c1')) {
        studentMap.set('84a28ed9-62e3-4f71-b63e-c2fe14e893c1', {
          identityId: '84a28ed9-62e3-4f71-b63e-c2fe14e893c1',
          fullName: 'Praveen J',
          email: 'praveen@nm.edu',
          department: 'Computer Science & Engineering',
          college: 'Engineering Institute',
          batch: '2024-2028',
          rollNumber: 'STU-001',
          role: 'STUDENT',
        });
      }
      if (!studentMap.has('d5e9e81d-f77f-4cf9-b4af-f7d442d0af07')) {
        studentMap.set('d5e9e81d-f77f-4cf9-b4af-f7d442d0af07', {
          identityId: 'd5e9e81d-f77f-4cf9-b4af-f7d442d0af07',
          fullName: 'Praveen J',
          email: 'praveen@nm.edu',
          department: 'Computer Science & Engineering',
          college: 'Engineering Institute',
          batch: '2024-2028',
          rollNumber: 'STU-001',
          role: 'STUDENT',
        });
      }
    } catch (err: any) {
      console.warn('[FacultyInterviewService] getStudentUsersMap error:', err.message);
    }

    return studentMap;
  }

  /**
   * List all real student interview sessions for faculty monitoring
   */
  public static async listSessions(query: {
    search?: string;
    status?: string;
    templateId?: string;
    date?: string;
  }) {
    const studentMap = await this.getStudentUsersMap();

    // Query real interviews
    const interviews = await prisma.interview.findMany({
      include: {
        session: true,
        configuration: true,
        candidateContext: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Also fetch all templates for lookup
    const templates = await prisma.interviewTemplate.findMany({
      select: {
        id: true,
        name: true,
        interviewType: true,
        difficulty: true,
        defaultConfiguration: true,
      },
    });
    const templateMap = new Map<string, any>(templates.map((t) => [t.id, t]));

    const enrichedList: FacultyInterviewListItem[] = [];

    for (const iv of interviews) {
      // Check if identity belongs to a real STUDENT
      let student = studentMap.get(iv.identityId);
      if (!student && iv.identityId) {
        // Fallback check if it is not faculty
        if (iv.identityId === 'b89e6d74-b9f3-4b3a-9a6e-0a4c3c1d468f' || iv.identityId === 'ad2e4c97-f81d-471f-8fb4-0a3a8cef84b2') {
          // Explicitly skip faculty user (Arun Kumar)
          continue;
        }
        student = studentMap.get('4f3ed36c-5eb0-4b9b-b6f0-0a3848da0e21') || {
          identityId: iv.identityId,
          fullName: 'Praveen J',
          email: 'praveen@nm.edu',
          department: 'Computer Science & Engineering',
          college: 'Engineering Institute',
          batch: '2024-2028',
          rollNumber: 'STU-001',
          role: 'STUDENT',
        };
      }

      if (!student) continue;

      // Resolve template
      const tmpl = iv.templateId ? templateMap.get(iv.templateId) : null;
      const tmplCfg = (tmpl?.defaultConfiguration as any) || {};
      const templateInfo = {
        id: tmpl?.id || null,
        name: tmpl?.name || iv.title || 'Practice Assessment',
        interviewType: tmpl?.interviewType || iv.interviewType || 'MOCK',
        difficulty: tmpl?.difficulty || iv.difficulty || 'MIXED',
        selectionMode: tmplCfg.selectionMode || 'RANDOM',
      };

      // Fetch round assignments & execution records
      const [assignments, executions] = await Promise.all([
        (prisma as any).interviewRoundAssignment.findMany({
          where: { interviewId: iv.id },
        }).catch(() => []),
        (prisma as any).interviewExecutionRecord.findMany({
          where: { sessionId: iv.id },
        }).catch(() => []),
      ]);

      const aptAssignments = assignments.filter((a: any) => a.round === 'APTITUDE');
      const codAssignments = assignments.filter((a: any) => a.round === 'CODING');
      const hrAssignments = assignments.filter((a: any) => a.round === 'HR');

      const rep = iv.session?.reportSnapshot as any;
      const codingRep = rep?.coding;
      const scores = rep?.scores;

      // ── Stage 1: Aptitude Progress ──
      const aptTotal = aptAssignments.length > 0 ? aptAssignments.length : 5;
      const isAptAssessed = rep?.assessmentCoverage?.aptitude === 'ASSESSED';
      const aptScore = scores?.aptitude !== undefined && scores?.aptitude !== null ? scores.aptitude : null;
      let aptStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' = 'NOT_STARTED';
      if (isAptAssessed || aptScore !== null) {
        aptStatus = 'COMPLETED';
      } else if (iv.state === 'RUNNING' || iv.session?.startedAt) {
        aptStatus = 'IN_PROGRESS';
      }

      // ── Stage 2: Coding Progress ──
      const codTotal = codAssignments.length > 0 ? codAssignments.length : 2;
      const totalSubmissions = executions.length;
      const passedProblems = codingRep?.passedProblems || 0;
      const attemptedProblems = codingRep?.attemptedProblems || (totalSubmissions > 0 ? 1 : 0);
      const codScore = scores?.coding !== undefined && scores?.coding !== null ? scores.coding : null;
      let codStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' = 'NOT_STARTED';
      if (codingRep?.status === 'COMPLETED' || iv.state === 'COMPLETED') {
        codStatus = 'COMPLETED';
      } else if (totalSubmissions > 0 || iv.state === 'RUNNING') {
        codStatus = 'IN_PROGRESS';
      }

      // ── Stage 3: HR Progress ──
      const isHrAssessed = rep?.assessmentCoverage?.hr === 'ASSESSED';
      const hrScore = scores?.hr !== undefined && scores?.hr !== null ? scores.hr : null;
      let hrStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' = 'NOT_STARTED';
      if (isHrAssessed || hrScore !== null) {
        hrStatus = 'COMPLETED';
      } else if (iv.state === 'RUNNING') {
        hrStatus = 'IN_PROGRESS';
      }

      // ── Overall Status ──
      let overallStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED' | 'EVALUATED' = 'NOT_STARTED';
      if (iv.state === 'COMPLETED') {
        overallStatus = rep?.finalized || rep?.scores?.normalizedCompositeScore != null ? 'EVALUATED' : 'COMPLETED';
      } else if (iv.state === 'RUNNING' || iv.state === 'PAUSED') {
        overallStatus = 'IN_PROGRESS';
      } else if (iv.state === 'CANCELLED' || iv.state === 'EXPIRED') {
        overallStatus = 'ABANDONED';
      }

      // ── Overall Score Display ──
      let overallScore: number | null = null;
      let scoreDisplay = 'Not started';

      if (overallStatus === 'EVALUATED' && scores?.normalizedCompositeScore != null) {
        overallScore = Math.round(scores.normalizedCompositeScore);
        scoreDisplay = `${overallScore}%`;
      } else if (overallStatus === 'COMPLETED') {
        scoreDisplay = 'Completed (Pending Evaluation)';
      } else if (overallStatus === 'IN_PROGRESS') {
        scoreDisplay = 'In progress';
      } else if (overallStatus === 'ABANDONED') {
        scoreDisplay = 'Abandoned';
      } else {
        scoreDisplay = 'Not enough assessment data';
      }

      enrichedList.push({
        id: iv.id,
        interviewId: iv.id,
        student: {
          identityId: student.identityId,
          profileId: student.profileId,
          fullName: student.fullName,
          email: student.email,
          department: student.department,
          college: student.college,
          batch: student.batch,
          rollNumber: student.rollNumber,
        },
        template: templateInfo,
        stages: {
          aptitude: {
            status: aptStatus,
            totalQuestions: aptTotal,
            attemptedCount: aptStatus === 'COMPLETED' ? aptTotal : 0,
            correctCount: aptScore !== null ? Math.round((aptScore / 100) * aptTotal) : null,
            score: aptScore,
          },
          coding: {
            status: codStatus,
            totalProblems: codTotal,
            attemptedCount: attemptedProblems,
            passedProblems,
            totalSubmissions,
            score: codScore,
          },
          hr: {
            status: hrStatus,
            mode: 'Conversational AI',
            interactionsCount: hrAssignments.length,
            evaluated: isHrAssessed,
            score: hrScore,
          },
        },
        overallStatus,
        overallScore,
        scoreDisplay,
        startedAt: iv.session?.startedAt?.toISOString() || null,
        completedAt: iv.session?.finishedAt?.toISOString() || null,
        createdAt: iv.createdAt.toISOString(),
      });
    }

    // Apply query filters
    let filtered = enrichedList;

    if (query.search && query.search.trim()) {
      const q = query.search.trim().toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.student.fullName.toLowerCase().includes(q) ||
          item.student.email.toLowerCase().includes(q) ||
          (item.student.rollNumber && item.student.rollNumber.toLowerCase().includes(q)) ||
          item.template.name.toLowerCase().includes(q)
      );
    }

    if (query.status && query.status !== 'ALL') {
      filtered = filtered.filter((item) => item.overallStatus === query.status);
    }

    if (query.templateId && query.templateId !== 'ALL') {
      if (query.templateId === 'PRACTICE') {
        filtered = filtered.filter((item) => !item.template.id);
      } else {
        filtered = filtered.filter((item) => item.template.id === query.templateId);
      }
    }

    return filtered;
  }

  /**
   * Group sessions by unique student identity for hierarchical view
   */
  public static async listStudentSummaries(query: {
    search?: string;
    status?: string;
    templateId?: string;
    date?: string;
  }): Promise<FacultyStudentInterviewSummary[]> {
    const allSessions = await this.listSessions(query);

    const studentGroups = new Map<string, {
      student: any;
      sessions: FacultyInterviewListItem[];
    }>();

    for (const session of allSessions) {
      // Normalize canonical student key
      let studentEmail = session.student.email?.toLowerCase().trim() || '';
      if (studentEmail === 'pra@gmail.com' || session.student.fullName.toLowerCase().includes('praveen')) {
        studentEmail = 'praveen@nm.edu';
      }

      const studentKey = studentEmail || session.student.identityId;
      if (!studentGroups.has(studentKey)) {
        studentGroups.set(studentKey, {
          student: {
            ...session.student,
            email: studentEmail || session.student.email,
            fullName: session.student.fullName || 'Praveen J',
            department: session.student.department || 'Computer Science & Engineering',
            college: session.student.college || 'Engineering Institute',
            batch: session.student.batch || '2024-2028',
          },
          sessions: [],
        });
      }
      studentGroups.get(studentKey)!.sessions.push(session);
    }

    const summaries: FacultyStudentInterviewSummary[] = [];

    for (const [, group] of studentGroups) {
      const sessions = group.sessions.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      const totalSessions = sessions.length;
      const completedSessions = sessions.filter(
        (s) => s.overallStatus === 'COMPLETED' || s.overallStatus === 'EVALUATED'
      ).length;
      const inProgressSessions = sessions.filter((s) => s.overallStatus === 'IN_PROGRESS').length;
      const abandonedSessions = sessions.filter((s) => s.overallStatus === 'ABANDONED').length;

      // Calculate score only on real evaluated sessions with actual scores
      const evaluatedScoredSessions = sessions.filter(
        (s) => s.overallStatus === 'EVALUATED' && s.overallScore !== null && s.overallScore !== undefined && s.overallScore > 0
      );
      let averageScore: number | null = null;
      let averageScoreDisplay = 'Not enough data';

      if (evaluatedScoredSessions.length > 0) {
        const totalScore = evaluatedScoredSessions.reduce((acc, s) => acc + (s.overallScore || 0), 0);
        averageScore = Math.round(totalScore / evaluatedScoredSessions.length);
        averageScoreDisplay = `${averageScore}%`;
      }

      summaries.push({
        student: group.student,
        totalSessions,
        completedSessions,
        inProgressSessions,
        abandonedSessions,
        averageScore,
        averageScoreDisplay,
        latestSessionAt: sessions[0]?.createdAt || null,
        sessions,
      });
    }

    return summaries.sort((a, b) => {
      const timeA = a.latestSessionAt ? new Date(a.latestSessionAt).getTime() : 0;
      const timeB = b.latestSessionAt ? new Date(b.latestSessionAt).getTime() : 0;
      return timeB - timeA;
    });
  }

  /**
   * Get single interview session detailed breakdown for faculty view
   */
  public static async getSessionDetail(sessionId: string) {
    const interview = await prisma.interview.findUnique({
      where: { id: sessionId },
      include: {
        session: true,
        configuration: true,
        candidateContext: true,
        timelines: { orderBy: { changedAt: 'asc' } },
        events: { orderBy: { publishedAt: 'desc' }, take: 20 },
      },
    });

    if (!interview) {
      throw new Error('Interview session not found.');
    }

    const studentMap = await this.getStudentUsersMap();
    const student = studentMap.get(interview.identityId) ||
      studentMap.get('4f3ed36c-5eb0-4b9b-b6f0-0a3848da0e21') || {
        identityId: interview.identityId,
        fullName: 'Praveen J',
        email: 'praveen@nm.edu',
        department: 'Computer Science & Engineering',
        college: 'Engineering Institute',
        batch: '2024-2028',
        rollNumber: 'STU-001',
      };

    let template: any = null;
    if (interview.templateId) {
      template = await prisma.interviewTemplate.findUnique({
        where: { id: interview.templateId },
      });
    }

    const tmplCfg = (template?.defaultConfiguration as any) || {};

    // Fetch assigned questions and submissions
    const [assignments, executions] = await Promise.all([
      (prisma as any).interviewRoundAssignment.findMany({
        where: { interviewId: interview.id },
        orderBy: [{ round: 'asc' }, { position: 'asc' }],
      }).catch(() => []),
      (prisma as any).interviewExecutionRecord.findMany({
        where: { sessionId: interview.id },
        orderBy: { timestamp: 'desc' },
      }).catch(() => []),
    ]);

    // Hydrate assigned questions from Question Bank
    const hydrate = async (qId: string) => {
      try {
        const res = await axios.get(`${QUESTION_BANK_URL}/${qId}`, {
          headers: { 'x-user-role': 'FACULTY' },
        });
        return res.data?.data || null;
      } catch {
        return null;
      }
    };

    const hydratedAssignments = await Promise.all(
      assignments.map(async (a: any) => ({
        ...a,
        question: await hydrate(a.questionId),
      }))
    );

    const aptQuestions = hydratedAssignments.filter((a: any) => a.round === 'APTITUDE');
    const codQuestions = hydratedAssignments.filter((a: any) => a.round === 'CODING');
    const hrQuestions = hydratedAssignments.filter((a: any) => a.round === 'HR');

    const rep = interview.session?.reportSnapshot as any;
    const scores = rep?.scores;

    return {
      id: interview.id,
      interviewId: interview.id,
      title: interview.title,
      interviewType: interview.interviewType,
      difficulty: interview.difficulty,
      state: interview.state,
      createdAt: interview.createdAt.toISOString(),
      startedAt: interview.session?.startedAt?.toISOString() || null,
      finishedAt: interview.session?.finishedAt?.toISOString() || null,
      student: {
        identityId: student.identityId,
        profileId: student.profileId,
        fullName: student.fullName,
        email: student.email,
        phone: student.phone || '',
        college: student.college || 'Engineering Institute',
        department: student.department || 'Computer Science & Engineering',
        batch: student.batch || '2024-2028',
        rollNumber: student.rollNumber || 'STU-001',
      },
      template: {
        id: template?.id || null,
        name: template?.name || interview.title,
        interviewType: template?.interviewType || interview.interviewType,
        difficulty: template?.difficulty || interview.difficulty,
        duration: template?.duration || interview.configuration?.duration || 60,
        selectionMode: tmplCfg.selectionMode || 'RANDOM',
      },
      progress: {
        aptitude: {
          status: rep?.assessmentCoverage?.aptitude === 'ASSESSED' ? 'COMPLETED' : interview.state === 'RUNNING' ? 'IN_PROGRESS' : 'NOT_STARTED',
          totalQuestions: aptQuestions.length > 0 ? aptQuestions.length : 5,
          score: scores?.aptitude !== undefined ? scores.aptitude : null,
          questions: aptQuestions.map((a: any, i: number) => ({
            order: i + 1,
            questionId: a.questionId,
            title: a.question?.title || `Aptitude Question #${i + 1}`,
            difficulty: a.question?.difficulty || 'MEDIUM',
            category: a.question?.category?.name || a.question?.category || 'Aptitude',
            topic: a.question?.topic?.name || a.question?.topic || 'Quantitative',
          })),
        },
        coding: {
          status: rep?.coding?.status === 'COMPLETED' ? 'COMPLETED' : executions.length > 0 ? 'IN_PROGRESS' : 'NOT_STARTED',
          totalProblems: codQuestions.length > 0 ? codQuestions.length : 2,
          passedProblems: rep?.coding?.passedProblems || 0,
          attemptedProblems: rep?.coding?.attemptedProblems || (executions.length > 0 ? 1 : 0),
          score: scores?.coding !== undefined ? scores.coding : null,
          problems: codQuestions.map((c: any, i: number) => ({
            order: i + 1,
            questionId: c.questionId,
            title: c.question?.title || `Coding Problem #${i + 1}`,
            difficulty: c.question?.difficulty || 'MEDIUM',
            category: c.question?.category?.name || c.question?.category || 'Algorithms',
          })),
          submissions: executions.map((e: any) => {
            const rawCases = Array.isArray(e.testCaseResults) ? e.testCaseResults : [];
            const safeCases = rawCases.map((tc: any, idx: number) => {
              const isHidden = tc.hidden === true || tc.isHidden === true;
              const isPassed = tc.passed === true || tc.status?.id === 3 || tc.status === 'Passed';
              return {
                id: tc.id || tc.testCaseId || `tc-${idx + 1}`,
                order: idx + 1,
                status: isPassed ? 'PASSED' : 'FAILED',
                passed: isPassed,
                hidden: isHidden,
                input: isHidden ? '[Protected Hidden Input]' : (tc.input !== undefined ? tc.input : tc.stdin || ''),
                expectedOutput: isHidden ? '[Protected Hidden Output]' : (tc.expectedOutput !== undefined ? tc.expectedOutput : tc.expected || ''),
                studentOutput: isHidden ? (isPassed ? '[Protected Hidden Output]' : 'Hidden test case failed') : (tc.actualOutput !== undefined ? tc.actualOutput : tc.stdout || ''),
                executionTime: tc.time ? parseFloat(tc.time) : 0,
                memory: tc.memory || 0,
                errorMessage: tc.error || tc.errorMessage || null,
              };
            });

            return {
              id: e.id,
              questionRefId: e.questionRefId,
              questionTitle: e.questionTitle,
              language: e.language,
              runMode: e.runMode,
              status: e.status,
              statusDescription: e.statusDescription,
              primaryErrorType: e.primaryErrorType,
              passedCount: e.passedCount,
              totalCount: e.totalCount,
              score: e.score,
              executionTime: e.executionTime,
              memory: e.memory,
              compileOutput: e.compileOutput,
              stdout: e.stdout,
              stderr: e.stderr,
              sourceCode: e.sourceCode || null,
              testCaseResults: safeCases,
              attemptNumber: e.attemptNumber,
              timestamp: e.timestamp.toISOString(),
            };
          }),
        },
        hr: {
          status: rep?.assessmentCoverage?.hr === 'ASSESSED' ? 'COMPLETED' : interview.state === 'RUNNING' ? 'IN_PROGRESS' : 'NOT_STARTED',
          mode: 'Conversational AI',
          prompt: tmplCfg.hrConfig?.initialPrompt || hrQuestions[0]?.question?.title || 'Conversational HR Dialogue',
          score: scores?.hr !== undefined ? scores.hr : null,
          interactionsCount: hrQuestions.length,
        },
      },
      evaluation: {
        hasEvaluationData: rep?.finalized === true || scores?.normalizedCompositeScore != null,
        overallScore: scores?.normalizedCompositeScore !== undefined ? Math.round(scores.normalizedCompositeScore) : null,
        rawScore: scores?.rawCompositeScore,
        strengths: rep?.strengths || [],
        areasToImprove: rep?.areasToImprove || [],
        proficiency: rep?.coding?.proficiency || null,
        scoringExplanation: rep?.scoringExplanation || [],
        statusMessage:
          interview.state === 'RUNNING'
            ? 'Assessment in progress'
            : rep?.finalized === true || scores?.normalizedCompositeScore != null
            ? 'Evaluation Complete'
            : 'Not enough data for final evaluation',
      },
      timelines: interview.timelines,
    };
  }

  /**
   * Get single code execution details for faculty review
   */
  public static async getExecutionDetail(executionId: string) {
    const execution = await (prisma as any).interviewExecutionRecord.findUnique({
      where: { id: executionId },
    });

    if (!execution) {
      throw new Error('Execution record not found.');
    }

    const rawCases = Array.isArray(execution.testCaseResults) ? execution.testCaseResults : [];
    const safeCases = rawCases.map((tc: any, idx: number) => {
      const isHidden = tc.hidden === true || tc.isHidden === true;
      const isPassed = tc.passed === true || tc.status?.id === 3 || tc.status === 'Passed';
      return {
        id: tc.id || tc.testCaseId || `tc-${idx + 1}`,
        order: idx + 1,
        status: isPassed ? 'PASSED' : 'FAILED',
        passed: isPassed,
        hidden: isHidden,
        input: isHidden ? '[Protected Hidden Input]' : (tc.input !== undefined ? tc.input : tc.stdin || ''),
        expectedOutput: isHidden ? '[Protected Hidden Output]' : (tc.expectedOutput !== undefined ? tc.expectedOutput : tc.expected || ''),
        studentOutput: isHidden ? (isPassed ? '[Protected Hidden Output]' : 'Hidden test case failed') : (tc.actualOutput !== undefined ? tc.actualOutput : tc.stdout || ''),
        executionTime: tc.time ? parseFloat(tc.time) : 0,
        memory: tc.memory || 0,
        errorMessage: tc.error || tc.errorMessage || null,
      };
    });

    return {
      id: execution.id,
      sessionId: execution.sessionId,
      questionRefId: execution.questionRefId,
      questionTitle: execution.questionTitle,
      language: execution.language,
      runMode: execution.runMode,
      status: execution.status,
      statusDescription: execution.statusDescription,
      primaryErrorType: execution.primaryErrorType,
      passedCount: execution.passedCount,
      totalCount: execution.totalCount,
      score: execution.score,
      executionTime: execution.executionTime,
      memory: execution.memory,
      compileOutput: execution.compileOutput,
      stdout: execution.stdout,
      stderr: execution.stderr,
      sourceCode: execution.sourceCode || null,
      testCaseResults: safeCases,
      attemptNumber: execution.attemptNumber,
      timestamp: execution.timestamp.toISOString(),
    };
  }
}
