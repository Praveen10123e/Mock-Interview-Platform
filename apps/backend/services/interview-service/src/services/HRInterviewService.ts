/**
 * HRInterviewService.ts — Full HR Session Lifecycle Manager
 *
 * Manages the complete HR behavioral interview flow:
 *  - Session initialization with curated AI-selected questions
 *  - Turn-by-turn response submission with LLM follow-up generation
 *  - 10-factor behavioral evaluation via InterviewAIService
 *  - Final score aggregation integrated into ReportAnalysisService
 */

import { PrismaClient } from '../generated/client';
import { InterviewSessionService } from './InterviewSessionService';
import { InterviewAIService } from './InterviewAIService';
import { HRMessage } from '../types/interviewTypes';
import { HRTranscriptValidator } from './HRTranscriptValidator';
import path from 'path';
import fs from 'fs';

let _prisma: PrismaClient;
const prisma = new Proxy({} as PrismaClient, {
  get(target, prop) {
    if (!_prisma) _prisma = new PrismaClient();
    return (_prisma as any)[prop];
  },
});

const RECORDINGS_BASE = path.join(process.cwd(), 'uploads', 'recordings');

export class HRInterviewService {
  // ─── 1. Initialize or Fetch HR Session ────────────────────────────────────────

  /**
   * Initialize or resume the HR session for an interview.
   * Returns the HR session with all questions pre-populated.
   */
  static async initSession(interviewId: string, identityId: string, role = 'Software Engineer') {
    await InterviewSessionService.getInterviewScoped(interviewId, identityId);

    // Check for existing HR session
    const existing = await (prisma as any).hRInterviewSession.findUnique({
      where: { interviewId },
      include: {
        questions: {
          include: { response: true },
          orderBy: { sequence: 'asc' },
        },
        evaluation: true,
      },
    });

    if (existing) {
      return this.formatSession(existing);
    }

    // Select questions for this session
    const selectedQuestions = InterviewAIService.selectSessionQuestions(3);

    // Create HR session and questions in DB
    const hrSession = await (prisma as any).hRInterviewSession.create({
      data: {
        interviewId,
        position: role,
        status: 'READY',
        questions: {
          create: selectedQuestions.map((q, idx) => ({
            question: q.question,
            category: q.category,
            questionType: 'MAIN',
            sequence: idx + 1,
          })),
        },
      },
      include: {
        questions: {
          include: { response: true },
          orderBy: { sequence: 'asc' },
        },
        evaluation: true,
      },
    });

    // Record initialization in InterviewHistory
    await prisma.interviewHistory.create({
      data: {
        interviewId,
        event: 'HR_SESSION_INIT',
        details: {
          hrSessionId: hrSession.id,
          questionCount: selectedQuestions.length,
          position: role,
        } as any,
      },
    });

    return this.formatSession(hrSession);
  }

  // ─── 2. Start Session ─────────────────────────────────────────────────────────

  static async startSession(interviewId: string, identityId: string) {
    await InterviewSessionService.requireActiveSession(interviewId, identityId);

    const hrSession = await this.requireHRSession(interviewId);

    await (prisma as any).hRInterviewSession.update({
      where: { id: hrSession.id },
      data: { status: 'IN_PROGRESS', startedAt: new Date() },
    });

    await prisma.interviewHistory.create({
      data: {
        interviewId,
        event: 'HR_SESSION_START',
        details: { hrSessionId: hrSession.id } as any,
      },
    });

    return { success: true, status: 'IN_PROGRESS' };
  }

  // ─── 3. Submit Response & Get Follow-Up ───────────────────────────────────────

  /**
   * Submit a candidate response for a given question.
   * Evaluates the response and generates the next question (follow-up or main).
   */
  static async submitResponse(
    interviewId: string,
    identityId: string,
    questionId: string,
    transcript: string,
    durationSeconds: number
  ) {
    await InterviewSessionService.requireActiveSession(interviewId, identityId);

    const hrSession = await this.requireHRSession(interviewId);
    const question = await (prisma as any).hRInterviewQuestion.findFirst({
      where: { id: questionId, hrSessionId: hrSession.id },
    });

    if (!question) {
      throw Object.assign(new Error('Question not found in this HR session.'), { statusCode: 404 });
    }

    // Evidence-based transcript validation
    const valResult = HRTranscriptValidator.validate(transcript, {
      question: question.question,
      category: question.category,
    });

    const storedTranscript = valResult.verifiedTranscript;
    const wordCount = valResult.wordCount;

    // Save or update the response
    await (prisma as any).hRInterviewResponse.upsert({
      where: { questionId },
      create: {
        hrSessionId: hrSession.id,
        questionId,
        transcript: storedTranscript,
        durationSeconds,
        wordCount,
      },
      update: {
        transcript: storedTranscript,
        durationSeconds,
        wordCount,
        submittedAt: new Date(),
      },
    });

    // Log in interview history with full auditability (both raw and verified transcripts)
    await prisma.interviewHistory.create({
      data: {
        interviewId,
        event: 'HR_MESSAGE',
        details: {
          role: 'candidate',
          content: storedTranscript,
          rawTranscript: valResult.rawTranscript,
          verifiedTranscript: valResult.verifiedTranscript,
          isEmpty: valResult.isEmpty,
          isFillerOnly: valResult.isFillerOnly,
          isNonResponsive: valResult.isNonResponsive,
          normalizedTerms: valResult.normalizedTerms,
          rejectionReason: valResult.rejectionReason,
          questionId,
          durationSeconds,
        } as any,
      },
    });

    // Generate contextual follow-up via AI
    const followUpText = await InterviewAIService.generateFollowUp(
      question.question,
      question.category,
      storedTranscript,
      'Software Engineer'
    );

    // Determine if there's a next main question
    const allQuestions = await (prisma as any).hRInterviewQuestion.findMany({
      where: { hrSessionId: hrSession.id },
      include: { response: true },
      orderBy: { sequence: 'asc' },
    });

    const currentIdx = allQuestions.findIndex((q: any) => q.id === questionId);
    const nextMain = allQuestions.slice(currentIdx + 1).find((q: any) => q.questionType === 'MAIN' && !q.response);
    const answeredCount = allQuestions.filter((q: any) => q.questionType === 'MAIN' && q.response).length;
    const totalMain = allQuestions.filter((q: any) => q.questionType === 'MAIN').length;
    const isLastQuestion = !nextMain;

    // Create follow-up question record (unless last question)
    let followUpQuestion: any = null;
    if (!isLastQuestion || answeredCount < totalMain) {
      followUpQuestion = await (prisma as any).hRInterviewQuestion.create({
        data: {
          hrSessionId: hrSession.id,
          question: followUpText,
          category: question.category,
          questionType: 'FOLLOW_UP',
          sequence: allQuestions.length + 1,
          isFollowUpToId: questionId,
        },
      });

      await prisma.interviewHistory.create({
        data: {
          interviewId,
          event: 'HR_MESSAGE',
          details: { role: 'interviewer', content: followUpText, questionId: followUpQuestion.id } as any,
        },
      });
    }

    return {
      success: true,
      followUpQuestion: followUpQuestion
        ? { id: followUpQuestion.id, question: followUpText, category: question.category, questionType: 'FOLLOW_UP' }
        : null,
      nextMainQuestion: nextMain
        ? { id: nextMain.id, question: nextMain.question, category: nextMain.category, sequence: nextMain.sequence }
        : null,
      canComplete: answeredCount >= totalMain - 1,
      progress: {
        answered: answeredCount + 1,
        total: totalMain,
        percentage: Math.round(((answeredCount + 1) / totalMain) * 100),
      },
    };
  }

  // ─── 4. Save Recording Path ───────────────────────────────────────────────────

  static async saveRecordingPath(hrSessionId: string, questionId: string, relativePath: string) {
    await (prisma as any).hRInterviewResponse.update({
      where: { questionId },
      data: { recordingPath: relativePath },
    });
    return { success: true };
  }

  // ─── 5. Delete Recording ──────────────────────────────────────────────────────

  static async deleteRecording(interviewId: string, identityId: string, responseId: string) {
    await InterviewSessionService.getInterviewScoped(interviewId, identityId);

    const response = await (prisma as any).hRInterviewResponse.findUnique({ where: { id: responseId } });
    if (!response) throw Object.assign(new Error('Recording not found.'), { statusCode: 404 });

    if (response.recordingPath) {
      const fullPath = path.join(RECORDINGS_BASE, response.recordingPath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }

    await (prisma as any).hRInterviewResponse.update({
      where: { id: responseId },
      data: { recordingPath: null },
    });

    return { success: true };
  }

  // ─── 6. Complete HR Round & Evaluate ─────────────────────────────────────────

  /**
   * Finalize the HR session: aggregate all responses, run 10-factor AI evaluation,
   * store results in HRInterviewEvaluation, and sync with InterviewHistory for
   * ReportAnalysisService pickup.
   */
  static async completeHR(interviewId: string, identityId: string) {
    await InterviewSessionService.requireActiveSession(interviewId, identityId);

    const hrSession = await this.requireHRSession(interviewId);

    if (hrSession.status === 'COMPLETED') {
      return this.getReport(interviewId, identityId);
    }

    // Mark as analyzing
    await (prisma as any).hRInterviewSession.update({
      where: { id: hrSession.id },
      data: { status: 'ANALYZING' },
    });

    // Fetch ALL questions (MAIN + FOLLOW_UP) with their responses for multi-turn context
    const allQuestionsWithResponses = await (prisma as any).hRInterviewQuestion.findMany({
      where: { hrSessionId: hrSession.id },
      include: { response: true },
      orderBy: { sequence: 'asc' },
    });

    const mainQuestions = allQuestionsWithResponses.filter((q: any) => q.questionType === 'MAIN');
    const followUpQuestions = allQuestionsWithResponses.filter((q: any) => q.questionType === 'FOLLOW_UP');

    // Aggregate FOLLOW_UP responses into their parent MAIN question for multi-turn evaluation.
    // This ensures "Python project" + "Python for backend and React for frontend" are
    // combined and evaluated as one coherent answer against the parent question's rubric.
    const questionsToEvaluate = mainQuestions.map((mainQ: any) => {
      const mainTranscript = (mainQ.response?.transcript || '').trim();
      const mainDuration = (mainQ.response?.durationSeconds || 0) as number;

      // Collect all follow-up responses for this parent question
      const followUps = followUpQuestions.filter(
        (fu: any) => fu.isFollowUpToId === mainQ.id && fu.response?.transcript
      );

      // Build a combined transcript that includes main + all follow-up candidate turns.
      // Skip placeholder/empty/silence strings so they don't pollute the combined text.
      const silencePlaceholders = [
        '[candidate audio response recorded]',
        '[candidate audio response]',
        '[no speech]',
        '[no speech detected]',
      ];

      const allTurns: string[] = [];
      if (mainTranscript && !silencePlaceholders.some(p => mainTranscript.toLowerCase() === p)) {
        allTurns.push(mainTranscript);
      }
      for (const fu of followUps) {
        const fuText = (fu.response.transcript || '').trim();
        if (fuText && !silencePlaceholders.some(p => fuText.toLowerCase() === p)) {
          allTurns.push(fuText);
        }
      }

      const combinedTranscript = allTurns.join(' ');
      const totalDuration = mainDuration + followUps.reduce(
        (sum: number, fu: any) => sum + (fu.response?.durationSeconds || 0), 0
      );

      return {
        question: mainQ.question,
        category: mainQ.category,
        transcript: combinedTranscript,
        durationSeconds: totalDuration,
      };
    });

    // Run holistic AI evaluation across all main questions (with combined multi-turn context)
    const evaluation = await InterviewAIService.evaluateFinalSession(
      questionsToEvaluate.length > 0
        ? questionsToEvaluate
        : [{ question: 'General Introduction', category: 'Self Introduction', transcript: '', durationSeconds: 0 }]
    );

    const { criteriaEvidence, ...dbEval } = evaluation;

    // Persist evaluation in DB
    await (prisma as any).hRInterviewEvaluation.upsert({
      where: { hrSessionId: hrSession.id },
      create: {
        hrSessionId: hrSession.id,
        ...dbEval,
        strengths: dbEval.strengths as any,
        improvements: dbEval.improvements as any,
      },
      update: {
        ...dbEval,
        strengths: dbEval.strengths as any,
        improvements: dbEval.improvements as any,
        evaluatedAt: new Date(),
      },
    });

    // Mark session as completed
    await (prisma as any).hRInterviewSession.update({
      where: { id: hrSession.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        overallScore: evaluation.overallScore,
      },
    });

    // Build conversation for InterviewHistory (backward compatibility with ReportEvidenceService)
    const allMessages = await prisma.interviewHistory.findMany({
      where: { interviewId, event: 'HR_MESSAGE' },
      orderBy: { timestamp: 'asc' },
    });

    const conversation = allMessages.map((m, idx) => {
      const d = m.details as any;
      return { role: d.role || 'candidate', content: d.content || '', turnIndex: idx };
    });

    const telemetry = {
      completed: true,
      hrSessionId: hrSession.id,
      overallScore: evaluation.overallScore,
      totalInteractions: allMessages.length,
      candidateResponsesCount: allMessages.filter((m) => (m.details as any)?.role === 'candidate').length,
      conversation,
      evaluation,
      completedAt: new Date().toISOString(),
    };

    await prisma.interviewHistory.create({
      data: {
        interviewId,
        event: 'HR_COMPLETE',
        details: telemetry as any,
      },
    });

    return { success: true, stage: 'HR_COMPLETED', evaluation, telemetry };
  }

  // ─── 7. Get Conversation (Legacy Compatibility) ───────────────────────────────

  static async getConversation(interviewId: string, identityId: string) {
    await InterviewSessionService.getInterviewScoped(interviewId, identityId);

    const events = await prisma.interviewHistory.findMany({
      where: { interviewId, event: 'HR_MESSAGE' },
      orderBy: { timestamp: 'asc' },
    });

    const conversation: HRMessage[] = events
      .filter((ev) => (ev.details as any)?.content)
      .map((ev, idx) => {
        const d = ev.details as any;
        return {
          id: ev.id,
          role: d.role || 'candidate',
          content: d.content,
          timestamp: ev.timestamp.toISOString(),
          turnIndex: d.turnIndex ?? idx,
        };
      });

    if (conversation.length === 0) {
      try {
        const hrSession = await (prisma as any).hRInterviewSession.findUnique({
          where: { interviewId },
          include: { questions: { orderBy: { sequence: 'asc' }, take: 1 } },
        });
        if (hrSession?.questions?.[0]) {
          conversation.push({
            id: 'initial-prompt',
            role: 'interviewer',
            content: hrSession.questions[0].question,
            timestamp: new Date().toISOString(),
            turnIndex: 0,
          });
        }
      } catch { /* ignore */ }
    }

    const candidateCount = conversation.filter((m) => m.role === 'candidate').length;
    return {
      conversation,
      totalResponses: candidateCount,
      canComplete: candidateCount >= 1,
    };
  }

  // ─── 8. Get Detailed HR Report ────────────────────────────────────────────────

  static async getReport(interviewId: string, identityId: string) {
    await InterviewSessionService.getInterviewScoped(interviewId, identityId);

    const hrSession = await (prisma as any).hRInterviewSession.findUnique({
      where: { interviewId },
      include: {
        questions: {
          include: { response: true },
          orderBy: { sequence: 'asc' },
        },
        evaluation: true,
      },
    });

    if (!hrSession) {
      throw Object.assign(new Error('HR session not found.'), { statusCode: 404 });
    }

    return this.formatSession(hrSession);
  }

  // ─── 9. Process Turn (Legacy Backward Compatibility) ─────────────────────────
  // This is kept to ensure the existing POST /hr/message endpoint continues to work
  // while the new system is being adopted.

  static async processTurn(
    interviewId: string,
    identityId: string,
    candidateResponse: string,
    clientTurnIndex?: number
  ) {
    await InterviewSessionService.requireActiveSession(interviewId, identityId);

    if (!candidateResponse || !candidateResponse.trim()) {
      throw new Error('Response content cannot be empty.');
    }

    // Try to use new HR session system
    try {
      const hrSession = await (prisma as any).hRInterviewSession.findUnique({
        where: { interviewId },
        include: {
          questions: {
            include: { response: true },
            orderBy: { sequence: 'asc' },
          },
        },
      });

      if (hrSession) {
        const nextUnanswered = hrSession.questions.find(
          (q: any) => q.questionType === 'MAIN' && !q.response
        );
        if (nextUnanswered) {
          const result = await this.submitResponse(
            interviewId,
            identityId,
            nextUnanswered.id,
            candidateResponse,
            30
          );
          const followUpText =
            result.followUpQuestion?.question ||
            result.nextMainQuestion?.question ||
            'Thank you for your response. Your answers have been recorded.';

          return {
            success: true,
            nextMessage: { role: 'interviewer', content: followUpText },
            conversation: [],
            canComplete: result.canComplete,
            totalResponses: result.progress.answered,
          };
        }
      }
    } catch { /* fall through to legacy */ }

    // Legacy fallback
    const { hr } = await InterviewSessionService.getSessionQuestions(interviewId, identityId);
    const category = 'Project Challenge';
    const mainQ = hr[0]?.description || 'Please describe a technical challenge you overcame.';

    const followUpText = await InterviewAIService.generateFollowUp(
      mainQ, category, candidateResponse
    );

    const interviewerMsg: HRMessage = {
      id: `interv-${Date.now()}`,
      role: 'interviewer',
      content: followUpText,
      timestamp: new Date().toISOString(),
      turnIndex: (clientTurnIndex || 0) + 1,
    };

    await prisma.interviewHistory.create({
      data: {
        interviewId,
        event: 'HR_MESSAGE',
        details: { role: 'candidate', content: candidateResponse.trim() } as any,
      },
    });
    await prisma.interviewHistory.create({
      data: {
        interviewId,
        event: 'HR_MESSAGE',
        details: interviewerMsg as any,
      },
    });

    return {
      success: true,
      nextMessage: interviewerMsg,
      conversation: [],
      canComplete: true,
      totalResponses: 1,
    };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  private static async requireHRSession(interviewId: string): Promise<any> {
    const session = await (prisma as any).hRInterviewSession.findUnique({ where: { interviewId } });
    if (!session) {
      throw Object.assign(new Error('HR session not initialized. Call /hr/session first.'), { statusCode: 404 });
    }
    return session;
  }

  private static formatSession(hrSession: any) {
    return {
      id: hrSession.id,
      interviewId: hrSession.interviewId,
      position: hrSession.position,
      interviewType: hrSession.interviewType,
      status: hrSession.status,
      startedAt: hrSession.startedAt,
      completedAt: hrSession.completedAt,
      overallScore: hrSession.overallScore,
      questions: (hrSession.questions || []).map((q: any) => ({
        id: q.id,
        question: q.question,
        category: q.category,
        questionType: q.questionType,
        sequence: q.sequence,
        isFollowUpToId: q.isFollowUpToId,
        response: q.response
          ? {
              id: q.response.id,
              transcript: q.response.transcript,
              durationSeconds: q.response.durationSeconds,
              wordCount: q.response.wordCount,
              hasRecording: !!q.response.recordingPath,
              recordingPath: q.response.recordingPath,
              submittedAt: q.response.submittedAt,
            }
          : null,
      })),
      evaluation: hrSession.evaluation
        ? {
            communicationScore: hrSession.evaluation.communicationScore,
            problemSolvingScore: hrSession.evaluation.problemSolvingScore,
            teamworkScore: hrSession.evaluation.teamworkScore,
            professionalismScore: hrSession.evaluation.professionalismScore,
            relevanceScore: hrSession.evaluation.relevanceScore,
            clarityScore: hrSession.evaluation.clarityScore,
            ownershipScore: hrSession.evaluation.ownershipScore,
            leadershipScore: hrSession.evaluation.leadershipScore,
            confidenceScore: hrSession.evaluation.confidenceScore,
            structureScore: hrSession.evaluation.structureScore,
            overallScore: hrSession.evaluation.overallScore,
            feedback: hrSession.evaluation.feedback,
            strengths: hrSession.evaluation.strengths,
            improvements: hrSession.evaluation.improvements,
            starGuidance: hrSession.evaluation.starGuidance,
            aiSummary: hrSession.evaluation.aiSummary,
          }
        : null,
    };
  }
}
