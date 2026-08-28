import { PrismaClient } from '../generated/client';
import { InterviewSessionService } from './InterviewSessionService';
import axios from 'axios';

let _prisma: PrismaClient;
const prisma = new Proxy({} as PrismaClient, {
  get(target, prop) {
    if (!_prisma) _prisma = new PrismaClient();
    return (_prisma as any)[prop];
  },
});

const QUESTION_BANK_URL = process.env.QUESTION_BANK_URL || 'http://localhost:3005';

export interface AptitudeQuestionEvidence {
  questionId: string;
  questionRefId?: string;
  questionNumber: number;
  question: string;
  title: string;
  topic: string;
  category: string | null;
  difficulty: string;
  options: string[];
  optionLabels: string[];
  selectedOptionIndex: number | null;
  selectedOptionText: string | null;
  correctOptionIndex: number;
  correctOptionText: string;
  isCorrect: boolean;
  status: 'CORRECT' | 'INCORRECT' | 'NOT_ATTEMPTED';
  storedExplanation: string | null;
  storedSolution: string | null;
  explanation?: string;
}

export interface CodingProblemEvidence {
  questionId: string;
  questionRefId?: string;
  title: string;
  topic: string;
  difficulty: string;
  expectedComplexity: string;
  totalTests: number;
  hasSubmitted: boolean;
  finalVerdict: string;
  finalScore: number;
  testsPassed: number;
  testsTotal: number;
  runCount: number;
  submitCount: number;
  totalAttempts: number;
  language: string;
  submittedCode: string | null;
  compileOutput: string | null;
  runtimeError: string | null;
  executionTime: number | null;
  memory: number | null;
  runHistory: Array<{
    attemptNumber: number;
    status: string;
    passedCount: number;
    totalCount: number;
    timestamp: string;
  }>;
  submitHistory: Array<{
    attemptNumber: number;
    status: string;
    passedCount: number;
    totalCount: number;
    compileOutput?: string | null;
    primaryErrorType?: string | null;
    timestamp: string;
  }>;
}

export interface HRTurnEvidence {
  turnIndex: number;
  role: 'interviewer' | 'candidate';
  content: string;
  timestamp: string;
}

export interface CompleteSessionEvidence {
  interviewId: string;
  sessionId: string;
  candidateIdentityId: string;
  candidateName?: string;
  interviewTitle: string;
  startedAt: string | null;
  finishedAt: string | null;
  durationMinutes: number;
  aptitude: {
    totalQuestions: number;
    attemptedCount: number;
    correctCount: number;
    incorrectCount: number;
    scorePercentage: number;
    questions: AptitudeQuestionEvidence[];
    status: 'COMPLETED' | 'INCOMPLETE';
  };
  coding: {
    totalProblems: number;
    problemsAttempted: number;
    problemsSubmitted: number;
    problemsAccepted: number;
    totalRunCount: number;
    totalSubmitCount: number;
    totalTestsPassed: number;
    totalTestsCount: number;
    scorePercentage: number;
    problems: CodingProblemEvidence[];
    status: 'COMPLETED' | 'INCOMPLETE';
  };
  hr: {
    totalInteractions: number;
    candidateResponsesCount: number;
    status: 'COMPLETED' | 'NOT_ATTEMPTED';
    transcript: HRTurnEvidence[];
  };
}

export class ReportEvidenceService {
  /**
   * Collects all real database evidence for a specific interview session
   */
  static async collectEvidence(
    interviewId: string,
    identityId: string,
    telemetryOverride?: any
  ): Promise<CompleteSessionEvidence> {
    const interview = await InterviewSessionService.getInterviewScoped(interviewId, identityId);
    const sessionId = interview.session?.id || interviewId;

    // 1. Fetch assigned questions
    const { aptitude, coding, hr } = await InterviewSessionService.getSessionQuestions(
      interviewId,
      identityId
    );

    // 2. Fetch all session history events
    const history = await prisma.interviewHistory.findMany({
      where: { interviewId },
      orderBy: { timestamp: 'asc' },
    });

    // 3. Fetch all execution records for this session
    const executionRecords = await prisma.interviewExecutionRecord.findMany({
      where: {
        sessionId: { in: [sessionId, interviewId].filter(Boolean) as string[] },
      },
      orderBy: { timestamp: 'asc' },
    });

    // ─── A. APTITUDE EVIDENCE COLLECTION ──────────────────────────────────────
    // Map of questionId -> selectedOptionIndex
    const candidateAnswers: Record<string, number> = {};

    // 1) From realtime answer save events
    history.forEach((h) => {
      if (h.event === 'APTITUDE_ANSWER_SAVE' && h.details) {
        const d = h.details as any;
        if (d.questionId && typeof d.selectedOptionIndex === 'number') {
          candidateAnswers[d.questionId] = d.selectedOptionIndex;
        }
      }
    });

    // 2) From aptitude submit event
    const aptSubmitEvent = history.find((h) => h.event === 'APTITUDE_SUBMIT');
    if (aptSubmitEvent?.details) {
      const d = aptSubmitEvent.details as any;
      if (d.answers && typeof d.answers === 'object') {
        Object.entries(d.answers).forEach(([qId, val]) => {
          if (typeof val === 'number') candidateAnswers[qId] = val;
        });
      }
    }

    if (telemetryOverride?.aptitude?.answers) {
      Object.entries(telemetryOverride.aptitude.answers).forEach(([qId, val]) => {
        if (typeof val === 'number') candidateAnswers[qId] = val;
      });
    }

    let aptCorrectCount = 0;
    let aptAttemptedCount = 0;
    const aptitudeQuestionsEvidence: AptitudeQuestionEvidence[] = [];

    let questionCounter = 0;
    for (const q of aptitude) {
      questionCounter++;
      const jsonPayload = q.metadata?.jsonPayload || (typeof q.metadata === 'string' ? JSON.parse(q.metadata) : {}) || {};

      // 1. Authoritative options
      let options: string[] = [];
      if (Array.isArray(q.options) && q.options.length > 0) {
        options = q.options;
      } else if (Array.isArray(jsonPayload.options) && jsonPayload.options.length > 0) {
        options = jsonPayload.options;
      } else if (Array.isArray(q.metadata?.options) && q.metadata.options.length > 0) {
        options = q.metadata.options;
      }

      // If still missing, check options inside jsonPayload or q.metadata
      if (options.length === 0 && Array.isArray((q as any).answers)) {
        options = (q as any).answers;
      }

      // If absolutely no options, fallback to standard letter options only as last resort
      if (options.length === 0) {
        options = ['Option A', 'Option B', 'Option C', 'Option D'];
      }

      // 2. Authoritative correct option index
      let correctIdx = 0;
      if (typeof q.correctOptionIndex === 'number') {
        correctIdx = q.correctOptionIndex;
      } else if (typeof jsonPayload.correctOptionIndex === 'number') {
        correctIdx = jsonPayload.correctOptionIndex;
      } else if (typeof q.correctAnswer === 'number') {
        correctIdx = q.correctAnswer;
      }

      // Bounds safety
      if (correctIdx < 0 || correctIdx >= options.length) {
        correctIdx = 0;
      }

      const optionLabels: string[] = options.map((_, idx) => String.fromCharCode(65 + idx));
      const selectedIdx = candidateAnswers[q.id] !== undefined ? candidateAnswers[q.id] : null;

      if (selectedIdx !== null) aptAttemptedCount++;

      const isCorrect = selectedIdx !== null && selectedIdx === correctIdx;
      if (isCorrect) aptCorrectCount++;

      const status: 'CORRECT' | 'INCORRECT' | 'NOT_ATTEMPTED' = 
        selectedIdx === null ? 'NOT_ATTEMPTED' : (isCorrect ? 'CORRECT' : 'INCORRECT');

      const fullQuestionText = q.description || q.question || q.title || 'Aptitude Question';
      const rawExplanation = q.explanation || q.storedExplanation || q.explanations?.[0]?.content || jsonPayload.explanation || q.metadata?.explanation || null;
      const rawSolution = q.solution || q.storedSolution || jsonPayload.solution || null;

      const correctOptionText = options[correctIdx] || options[0] || 'Option A';
      const selectedOptionText = selectedIdx !== null && options[selectedIdx] !== undefined ? options[selectedIdx] : null;

      aptitudeQuestionsEvidence.push({
        questionId: q.id,
        questionRefId: q.questionRefId || q.id,
        questionNumber: questionCounter,
        question: fullQuestionText,
        title: q.title || fullQuestionText,
        topic: typeof q.topic === 'string' ? q.topic : (q.topic?.name || 'Aptitude'),
        category: q.category || (typeof q.topic === 'string' ? q.topic : (q.topic?.name || 'Quantitative Aptitude')),
        difficulty: q.difficulty || 'Medium',
        options,
        optionLabels,
        selectedOptionIndex: selectedIdx,
        selectedOptionText,
        correctOptionIndex: correctIdx,
        correctOptionText,
        isCorrect,
        status,
        storedExplanation: rawExplanation,
        storedSolution: rawSolution,
        explanation: rawExplanation || rawSolution || `The correct mathematical/logical solution corresponds to Option ${optionLabels[correctIdx]} (${correctOptionText}).`,
      });
    }

    const aptTotalQuestions = aptitude.length || 5;
    const aptScorePercentage = aptTotalQuestions > 0 ? Math.round((aptCorrectCount / aptTotalQuestions) * 100) : 0;

    // ─── B. CODING EVIDENCE COLLECTION ────────────────────────────────────────
    let totalRunCount = 0;
    let totalSubmitCount = 0;
    let totalTestsPassedSum = 0;
    let totalTestsCountSum = 0;
    let problemsAcceptedCount = 0;
    const codingProblemsEvidence: CodingProblemEvidence[] = [];

    for (const q of coding) {
      const qRecords = executionRecords.filter(
        (r) => r.questionRefId === q.id || r.questionTitle === q.title
      );

      const runs = qRecords.filter((r) => r.runMode === 'RUN');
      const submits = qRecords.filter((r) => r.runMode === 'SUBMIT');

      totalRunCount += runs.length;
      totalSubmitCount += submits.length;

      const latestSubmit = submits.length > 0 ? submits[submits.length - 1] : null;
      const latestRun = runs.length > 0 ? runs[runs.length - 1] : null;
      const latestRecord = latestSubmit || latestRun;

      const testsPassed = latestSubmit ? latestSubmit.passedCount : (latestRun ? latestRun.passedCount : 0);
      const testsTotal = latestSubmit
        ? latestSubmit.totalCount
        : (latestRun ? latestRun.totalCount : (Array.isArray(q.testCases) ? q.testCases.length : 2));

      totalTestsPassedSum += testsPassed;
      totalTestsCountSum += testsTotal;

      let finalVerdict = 'NOT_ATTEMPTED';
      if (latestSubmit) {
        finalVerdict = latestSubmit.status || (latestSubmit.passedCount === latestSubmit.totalCount && latestSubmit.totalCount > 0 ? 'ACCEPTED' : 'WRONG_ANSWER');
        if (finalVerdict === 'ACCEPTED' || finalVerdict === 'PASSED') {
          problemsAcceptedCount++;
        }
      } else if (latestRun) {
        finalVerdict = 'RUN_ONLY';
      }

      // Compile and runtime errors
      let compileOutput = latestRecord?.compileOutput || null;
      let runtimeError = null;
      if (latestRecord?.primaryErrorType === 'RUNTIME_ERROR' || latestRecord?.stderr) {
        runtimeError = latestRecord.stderr || 'Runtime Exception occurred during execution.';
      }

      // Fallback complexity
      const expectedComplexity = q.expectedComplexity || (q.difficulty === 'EASY' ? 'O(n)' : 'O(n log n)');

      codingProblemsEvidence.push({
        questionId: q.id,
        title: q.title || 'Coding Problem',
        topic: q.topic || 'Algorithms',
        difficulty: q.difficulty || 'Medium',
        expectedComplexity,
        totalTests: testsTotal,
        hasSubmitted: submits.length > 0,
        finalVerdict,
        finalScore: latestSubmit?.score || 0,
        testsPassed,
        testsTotal,
        runCount: runs.length,
        submitCount: submits.length,
        totalAttempts: qRecords.length,
        language: latestRecord?.language || 'Python',
        submittedCode: latestSubmit?.sourceCode || latestRun?.sourceCode || null,
        compileOutput,
        runtimeError,
        executionTime: latestRecord?.executionTime || null,
        memory: latestRecord?.memory || null,
        runHistory: runs.map((r) => ({
          attemptNumber: r.attemptNumber,
          status: r.status,
          passedCount: r.passedCount,
          totalCount: r.totalCount,
          timestamp: r.timestamp.toISOString(),
        })),
        submitHistory: submits.map((s) => ({
          attemptNumber: s.attemptNumber,
          status: s.status,
          passedCount: s.passedCount,
          totalCount: s.totalCount,
          compileOutput: s.compileOutput,
          primaryErrorType: s.primaryErrorType,
          timestamp: s.timestamp.toISOString(),
        })),
      });
    }

    const codingScorePercentage =
      totalTestsCountSum > 0
        ? Math.round((totalTestsPassedSum / totalTestsCountSum) * 100)
        : problemsAcceptedCount === coding.length && coding.length > 0
        ? 100
        : 0;

    // ─── C. HR EVIDENCE COLLECTION ────────────────────────────────────────────
    const hrEvents = history.filter(
      (h) => h.event === 'HR_MESSAGE' || h.event === 'HR_CONVERSATION_UPDATE'
    );
    const hrCompleteEvent = history.find((h) => h.event === 'HR_COMPLETE');

    const transcript: HRTurnEvidence[] = [];
    hrEvents.forEach((ev, idx) => {
      const d = ev.details as any;
      if (d && d.content) {
        transcript.push({
          turnIndex: d.turnIndex ?? idx,
          role: d.role === 'interviewer' || d.role === 'ai' ? 'interviewer' : 'candidate',
          content: String(d.content),
          timestamp: ev.timestamp.toISOString(),
        });
      }
    });

    const candidateResponsesCount = transcript.filter((t) => t.role === 'candidate').length;
    const hrCompleted = !!hrCompleteEvent || candidateResponsesCount >= 1;

    // ─── D. DURATION & TIMING ─────────────────────────────────────────────────
    const startedAt = interview.session?.startedAt ? interview.session.startedAt.toISOString() : interview.createdAt.toISOString();
    const finishedAt = interview.session?.finishedAt ? interview.session.finishedAt.toISOString() : new Date().toISOString();
    const durationMs = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
    const durationMinutes = Math.max(1, Math.round(durationMs / 60000));

    return {
      interviewId,
      sessionId,
      candidateIdentityId: identityId,
      interviewTitle: interview.title,
      startedAt,
      finishedAt,
      durationMinutes,
      aptitude: {
        totalQuestions: aptTotalQuestions,
        attemptedCount: aptAttemptedCount,
        correctCount: aptCorrectCount,
        incorrectCount: Math.max(0, aptTotalQuestions - aptCorrectCount),
        scorePercentage: aptScorePercentage,
        questions: aptitudeQuestionsEvidence,
        status: aptAttemptedCount > 0 ? 'COMPLETED' : 'INCOMPLETE',
      },
      coding: {
        totalProblems: coding.length || 2,
        problemsAttempted: codingProblemsEvidence.filter((p) => p.totalAttempts > 0).length,
        problemsSubmitted: codingProblemsEvidence.filter((p) => p.hasSubmitted).length,
        problemsAccepted: problemsAcceptedCount,
        totalRunCount,
        totalSubmitCount,
        totalTestsPassed: totalTestsPassedSum,
        totalTestsCount: totalTestsCountSum,
        scorePercentage: codingScorePercentage,
        problems: codingProblemsEvidence,
        status: codingProblemsEvidence.every((p) => p.hasSubmitted) ? 'COMPLETED' : 'INCOMPLETE',
      },
      hr: {
        totalInteractions: transcript.length,
        candidateResponsesCount,
        status: hrCompleted ? 'COMPLETED' : 'NOT_ATTEMPTED',
        transcript,
      },
    };
  }
}
