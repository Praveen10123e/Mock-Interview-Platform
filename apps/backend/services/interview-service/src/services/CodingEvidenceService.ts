import { PrismaClient } from '../generated/client';
import axios from 'axios';
import { InterviewSessionService, fetchQuestionMeta } from './InterviewSessionService';
import { recordExecution } from '../ExecutionTracker';

let _prisma: PrismaClient;
const prisma = new Proxy({} as PrismaClient, {
  get(target, prop) {
    if (!_prisma) _prisma = new PrismaClient();
    return (_prisma as any)[prop];
  },
});

const JUDGE0_LANG_KEY: Record<number, string> = {
  71: 'python',
  93: 'javascript',
  63: 'javascript',
  62: 'java',
  54: 'cpp',
  50: 'c',
};

export class CodingEvidenceService {
  /**
   * Execute code in RUN or SUBMIT mode with strict hidden test protection
   */
  static async executeCode(
    interviewId: string,
    identityId: string,
    body: any,
    runMode: 'RUN' | 'SUBMIT'
  ) {
    // 1. Centralized SESSION_FINALIZED guard
    const interview = await InterviewSessionService.requireActiveSession(interviewId, identityId);

    const questionRefId = body.questionRefId || body.questionId;
    if (!questionRefId) {
      throw new Error('questionRefId is required');
    }

    // 2. Resolve questionRefId -> actual questionId via InterviewRoundAssignment
    let questionId = questionRefId;
    try {
      const ref = await (prisma as any).interviewRoundAssignment.findFirst({
        where: { interviewId, questionRefId },
      });
      if (ref?.questionId) questionId = ref.questionId;
    } catch {
      // fallback
    }

    // 3. Hydrate authoritative question metadata
    const question = await fetchQuestionMeta(questionId);
    const payload: any = {
      ...body,
      questionId,
      runMode,
      interviewId,
      executionMode: 'INTERVIEW',
    };

    if (question?.metadata?.jsonPayload?.testCases) {
      const allTC = question.metadata.jsonPayload.testCases;
      if (runMode === 'RUN') {
        // Custom Input handling for RUN
        if (body.customInput !== undefined && body.customInput !== null && body.customInput !== '') {
          payload.testCases = [
            {
              id: 'custom-stdin-tc',
              input: String(body.customInput),
              expectedOutput: '',
              hidden: false,
              visible: true,
            },
          ];
          payload.stdin = String(body.customInput);
        } else {
          // Sample / Visible test cases only (No hidden test case evaluation in RUN mode)
          const visibleTC = allTC.filter((tc: any) => tc.hidden === false || tc.visible === true);
          payload.testCases =
            visibleTC.length > 0
              ? visibleTC
              : question.examples?.length > 0
              ? allTC.slice(0, Math.min(question.examples.length, allTC.length))
              : allTC.slice(0, 1);
        }
      } else {
        // SUBMIT mode: all test cases (visible + hidden)
        payload.testCases = allTC;
      }
    }

    if (question?.metadata?.jsonPayload?.execution) {
      payload.execution = question.metadata.jsonPayload.execution;
    }
    if (question?.examples) {
      payload.examples = question.examples;
    }

    // 4. Proxy to Judge Service
    const judgeRes = await axios.post('http://localhost:3006/execute', payload, {
      headers: { 'x-identity-id': identityId || 'anonymous' },
      timeout: 120000,
    });

    const result = judgeRes.data;
    const targetSessionId = interview.session?.id || interviewId;
    const effectiveRunMode: any =
      runMode === 'RUN' && body.customInput !== undefined && body.customInput !== null && String(body.customInput).trim() !== ''
        ? 'CUSTOM_RUN'
        : runMode;

    // 5. Persist official execution evidence
    await recordExecution(
      targetSessionId,
      questionRefId,
      body.languageId,
      effectiveRunMode,
      body.sourceCode,
      result,
      question
    );

    // 6. Mask hidden test cases for student-facing response
    const maskedResults = (result.results || []).map((tc: any) => {
      if (tc.hidden === true) {
        return {
          ...tc,
          input: '[Protected Hidden Test Case]',
          expected: '[Protected Hidden Test Case]',
          expectedOutput: '[Protected Hidden Test Case]',
          actual: tc.passed ? 'Hidden test passed' : 'Hidden test failed',
          studentOutput: tc.passed ? 'Hidden test passed' : 'Hidden test failed',
        };
      }
      return tc;
    });

    return {
      ...result,
      results: maskedResults,
    };
  }

  /**
   * Get Attempts History for a specific problem
   */
  static async getAttemptsHistory(
    interviewId: string,
    identityId: string,
    questionRefId: string
  ) {
    const interview = await InterviewSessionService.getInterviewScoped(interviewId, identityId);
    const sessionIds = [interview.session?.id, interviewId].filter(Boolean) as string[];

    const records = await prisma.interviewExecutionRecord.findMany({
      where: {
        sessionId: { in: sessionIds },
        questionRefId,
      },
      orderBy: { timestamp: 'asc' },
    });

    return records.map((rec) => ({
      id: rec.id,
      attemptNumber: rec.attemptNumber,
      language: rec.language,
      runMode: rec.runMode,
      status: rec.status,
      statusDescription: rec.statusDescription,
      passedCount: rec.passedCount,
      totalCount: rec.totalCount,
      score: rec.score,
      executionTime: rec.executionTime,
      memory: rec.memory,
      compileOutput: rec.compileOutput,
      primaryErrorType: rec.primaryErrorType,
      timestamp: rec.timestamp.toISOString(),
    }));
  }

  /**
   * Complete Coding Stage: validates that every assigned problem has at least 1 SUBMIT attempt
   */
  static async completeCodingStage(interviewId: string, identityId: string) {
    // 1. Centralized SESSION_FINALIZED guard
    const interview = await InterviewSessionService.requireActiveSession(interviewId, identityId);
    const sessionIds = [interview.session?.id, interviewId].filter(Boolean) as string[];

    // 2. Fetch assigned coding problems
    const { coding } = await InterviewSessionService.getSessionQuestions(interviewId, identityId);

    // 3. Fetch all SUBMIT records for this session
    const submitRecords = await prisma.interviewExecutionRecord.findMany({
      where: {
        sessionId: { in: sessionIds },
        runMode: 'SUBMIT',
      },
    });

    const unsubmittedProblems: string[] = [];
    const problemSummaries: Record<string, any> = {};

    coding.forEach((q) => {
      const problemSubmits = submitRecords.filter(
        (r) => r.questionRefId === q.id || r.questionTitle === q.title
      );
      const hasSubmitted = problemSubmits.length > 0;
      const latestSubmit = problemSubmits[problemSubmits.length - 1];

      if (!hasSubmitted) {
        unsubmittedProblems.push(q.title || q.id);
      }

      problemSummaries[q.id] = {
        questionId: q.id,
        questionTitle: q.title,
        difficulty: q.difficulty,
        hasSubmitted,
        attemptsCount: problemSubmits.length,
        finalStatus: latestSubmit?.status || 'NOT_SUBMITTED',
        finalScore: latestSubmit?.score || 0,
        testsPassed: latestSubmit?.passedCount || 0,
        totalTests: latestSubmit?.totalCount || 0,
      };
    });

    // Rule: Every required coding question must have at least 1 SUBMIT action
    if (unsubmittedProblems.length > 0) {
      const err: any = new Error(
        `Please submit a solution for all coding problems before completing the Coding stage. Missing submissions for: ${unsubmittedProblems.join(', ')}`
      );
      err.statusCode = 400;
      err.unsubmittedProblems = unsubmittedProblems;
      throw err;
    }

    const telemetry = {
      totalProblems: coding.length,
      submittedProblemsCount: coding.length,
      allSubmitted: true,
      completed: true,
      problems: problemSummaries,
      completedAt: new Date().toISOString(),
    };

    // 4. Record stage completion in history
    await prisma.interviewHistory.create({
      data: {
        interviewId,
        event: 'CODING_COMPLETE',
        details: telemetry,
      },
    });

    return {
      success: true,
      stage: 'CODING_COMPLETED',
      telemetry,
    };
  }
}
