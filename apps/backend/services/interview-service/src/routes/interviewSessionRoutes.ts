import express from 'express';
import { InterviewSessionService } from '../services/InterviewSessionService';
import { AptitudeService } from '../services/AptitudeService';
import { CodingEvidenceService } from '../services/CodingEvidenceService';
import { HRInterviewService } from '../services/HRInterviewService';
import { ReportService } from '../services/ReportService';
import { ReportChatService } from '../services/ReportChatService';
import { PrismaClient } from '../generated/client';

let _prisma: PrismaClient;
const prisma = new Proxy({} as PrismaClient, {
  get(target, prop) {
    if (!_prisma) _prisma = new PrismaClient();
    return (_prisma as any)[prop];
  },
});

export const interviewSessionRouter = express.Router();

const getIdentityId = (req: express.Request): string => {
  return (req.headers['x-identity-id'] as string) || '';
};

// ─── 1. SESSION INITIALIZATION & RESUME ──────────────────────────────────────

// Start or resume generic Practice Session
interviewSessionRouter.post('/practice', async (req, res) => {
  try {
    const identityId = getIdentityId(req);
    const result = await InterviewSessionService.startPracticeSession(identityId);
    res.json(result);
  } catch (err: any) {
    console.error('Failed to start practice session:', err);
    res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
});

// Start or resume Published Template Session
interviewSessionRouter.post('/templates/:templateId/start', async (req, res) => {
  try {
    const identityId = getIdentityId(req);
    const result = await InterviewSessionService.startTemplateSession(
      req.params.templateId,
      identityId
    );
    res.json(result);
  } catch (err: any) {
    console.error('Failed to start template session:', err);
    res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
});

// ─── 2. SESSION RUNTIME STATE & QUESTIONS ────────────────────────────────────

// Get Session Runtime State (Restores active stage on refresh / reload)
interviewSessionRouter.get('/:id/state', async (req, res) => {
  try {
    const identityId = getIdentityId(req);
    const state = await InterviewSessionService.getSessionState(req.params.id, identityId);
    res.json({ success: true, data: state });
  } catch (err: any) {
    console.error('Failed to get session state:', err);
    res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
});

// Get Locked Session Questions (Idempotent question loading)
interviewSessionRouter.get('/:id/questions', async (req, res) => {
  try {
    const identityId = getIdentityId(req);
    const questions = await InterviewSessionService.getSessionQuestions(
      req.params.id,
      identityId
    );
    res.json({ success: true, data: questions });
  } catch (err: any) {
    console.error('Failed to get session questions:', err);
    res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
});

// ─── 2.5 TAB SWITCH & FOCUS INTEGRITY MONITORING ────────────────────────────
interviewSessionRouter.post('/:id/tab-switch', async (req, res) => {
  try {
    const identityId = getIdentityId(req);
    const { eventType, leftAt, returnedAt, durationSeconds } = req.body;
    const interview = await InterviewSessionService.requireActiveSession(req.params.id, identityId);
    const sessionId = interview.session?.id || interview.id;

    if (eventType === 'SWITCH_AWAY') {
      const awayTime = leftAt ? new Date(leftAt) : new Date();
      // Throttle: avoid duplicate open switch-away event if one exists within 2 seconds
      const recent = await (prisma as any).interviewTabSwitchEvent.findFirst({
        where: {
          sessionId,
          returnedAt: null,
          leftAt: { gte: new Date(awayTime.getTime() - 2000) },
        },
      });

      if (!recent) {
        await (prisma as any).interviewTabSwitchEvent.create({
          data: {
            sessionId,
            interviewId: req.params.id,
            leftAt: awayTime,
          },
        });
      }
    } else if (eventType === 'RETURN') {
      const returnTime = returnedAt ? new Date(returnedAt) : new Date();
      // Find latest unclosed event for this session
      const openEvent = await (prisma as any).interviewTabSwitchEvent.findFirst({
        where: {
          sessionId,
          returnedAt: null,
        },
        orderBy: { leftAt: 'desc' },
      });

      if (openEvent) {
        const calculatedDuration = Math.max(
          1,
          Math.round((returnTime.getTime() - new Date(openEvent.leftAt).getTime()) / 1000)
        );
        const dur =
          typeof durationSeconds === 'number' && durationSeconds > 0
            ? durationSeconds
            : calculatedDuration;

        await (prisma as any).interviewTabSwitchEvent.update({
          where: { id: openEvent.id },
          data: {
            returnedAt: returnTime,
            durationSeconds: dur,
          },
        });
      } else if (leftAt) {
        const awayTime = new Date(leftAt);
        const dur =
          typeof durationSeconds === 'number' && durationSeconds > 0
            ? durationSeconds
            : Math.max(1, Math.round((returnTime.getTime() - awayTime.getTime()) / 1000));
        await (prisma as any).interviewTabSwitchEvent.create({
          data: {
            sessionId,
            interviewId: req.params.id,
            leftAt: awayTime,
            returnedAt: returnTime,
            durationSeconds: dur,
          },
        });
      }
    }

    const allSwitches = await (prisma as any).interviewTabSwitchEvent.findMany({
      where: {
        OR: [
          { interviewId: req.params.id },
          { sessionId },
        ],
        returnedAt: { not: null },
      },
    });
    const tabSwitchesCount = allSwitches.length;
    const totalTimeAwaySeconds = allSwitches.reduce(
      (sum: number, ev: any) => sum + (ev.durationSeconds || 0),
      0
    );

    res.json({
      success: true,
      tabSwitchesCount,
      totalTimeAwaySeconds,
    });
  } catch (err: any) {
    console.error('Failed to record tab switch event:', err);
    res.status(err.statusCode || 500).json({
      success: false,
      errorType: err.errorType || 'ERROR',
      error: err.message,
    });
  }
});

// ─── 3. STAGE 1: APTITUDE ROUND ──────────────────────────────────────────────

// Save individual answer during navigation
interviewSessionRouter.post('/:id/aptitude/answer', async (req, res) => {
  try {
    const identityId = getIdentityId(req);
    const { questionId, selectedOptionIndex } = req.body;
    const result = await AptitudeService.saveAnswer(
      req.params.id,
      identityId,
      questionId,
      Number(selectedOptionIndex)
    );
    res.json({ success: true, data: result });
  } catch (err: any) {
    console.error('Failed to save aptitude answer:', err);
    res.status(err.statusCode || 500).json({
      success: false,
      errorType: err.errorType || 'ERROR',
      error: err.message,
    });
  }
});

// Complete Aptitude Stage
interviewSessionRouter.post('/:id/aptitude', async (req, res) => {
  try {
    const identityId = getIdentityId(req);
    const answers = req.body?.answers || req.body || {};
    const result = await AptitudeService.completeAptitudeStage(
      req.params.id,
      identityId,
      answers
    );
    res.json(result);
  } catch (err: any) {
    console.error('Failed to complete aptitude stage:', err);
    res.status(err.statusCode || 500).json({
      success: false,
      errorType: err.errorType || 'ERROR',
      error: err.message,
    });
  }
});

// ─── 4. STAGE 2: CODING ROUND ────────────────────────────────────────────────

// Coding RUN (sample/visible test cases, custom input, no hidden tests)
interviewSessionRouter.post('/:id/run', async (req, res) => {
  try {
    const identityId = getIdentityId(req);
    const result = await CodingEvidenceService.executeCode(
      req.params.id,
      identityId,
      req.body,
      'RUN'
    );
    res.json(result);
  } catch (err: any) {
    console.error('Coding RUN error:', err);
    res.status(err.statusCode || 500).json({
      success: false,
      errorType: err.errorType || 'ERROR',
      message: err.message,
    });
  }
});

// Coding SUBMIT (evaluates all test cases, masked hidden test outputs)
interviewSessionRouter.post('/:id/submit', async (req, res) => {
  try {
    const identityId = getIdentityId(req);
    const result = await CodingEvidenceService.executeCode(
      req.params.id,
      identityId,
      req.body,
      'SUBMIT'
    );
    res.json(result);
  } catch (err: any) {
    console.error('Coding SUBMIT error:', err);
    res.status(err.statusCode || 500).json({
      success: false,
      errorType: err.errorType || 'ERROR',
      message: err.message,
    });
  }
});

// Get Problem Attempt History
interviewSessionRouter.get('/:id/coding/attempts/:questionRefId', async (req, res) => {
  try {
    const identityId = getIdentityId(req);
    const history = await CodingEvidenceService.getAttemptsHistory(
      req.params.id,
      identityId,
      req.params.questionRefId
    );
    res.json({ success: true, data: history });
  } catch (err: any) {
    console.error('Failed to get attempt history:', err);
    res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
});

// Complete Coding Stage (Validates at least 1 SUBMIT per assigned problem)
interviewSessionRouter.post('/:id/coding/complete', async (req, res) => {
  try {
    const identityId = getIdentityId(req);
    const result = await CodingEvidenceService.completeCodingStage(
      req.params.id,
      identityId
    );
    res.json(result);
  } catch (err: any) {
    console.error('Failed to complete coding stage:', err);
    res.status(err.statusCode || 400).json({
      success: false,
      errorType: err.errorType || 'VALIDATION_ERROR',
      error: err.message,
      unsubmittedProblems: err.unsubmittedProblems,
    });
  }
});

// ─── 5. STAGE 3: HR BEHAVIORAL AI INTERVIEW ROUND ────────────────────────────

// Initialize or resume HR session (returns questions pre-populated)
interviewSessionRouter.post('/:id/hr/session', async (req, res) => {
  try {
    const identityId = getIdentityId(req);
    const { role } = req.body;
    const result = await HRInterviewService.initSession(req.params.id, identityId, role);
    res.json({ success: true, data: result });
  } catch (err: any) {
    console.error('Failed to init HR session:', err);
    res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
});

// Get HR session details (status, questions, evaluation)
interviewSessionRouter.get('/:id/hr/session', async (req, res) => {
  try {
    const identityId = getIdentityId(req);
    const result = await HRInterviewService.getReport(req.params.id, identityId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    console.error('Failed to get HR session:', err);
    res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
});

// Start the HR interview session
interviewSessionRouter.post('/:id/hr/start', async (req, res) => {
  try {
    const identityId = getIdentityId(req);
    const result = await HRInterviewService.startSession(req.params.id, identityId);
    res.json(result);
  } catch (err: any) {
    console.error('Failed to start HR session:', err);
    res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
});

// Submit a candidate answer transcript for a specific question
interviewSessionRouter.post('/:id/hr/response', async (req, res) => {
  try {
    const identityId = getIdentityId(req);
    const { questionId, transcript, durationSeconds } = req.body;
    if (!questionId || !transcript) {
      return res.status(400).json({ success: false, error: 'questionId and transcript are required.' });
    }
    const result = await HRInterviewService.submitResponse(
      req.params.id,
      identityId,
      questionId,
      transcript,
      durationSeconds || 0
    );
    res.json(result);
  } catch (err: any) {
    console.error('Failed to submit HR response:', err);
    res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
});

// Upload audio/video recording blob — stored to disk
interviewSessionRouter.post('/:id/hr/recording', async (req, res) => {
  try {
    // multer is set up in server.ts if needed; this records path only
    const identityId = getIdentityId(req);
    const { questionId, hrSessionId, relativePath } = req.body;
    if (!questionId || !relativePath) {
      return res.status(400).json({ success: false, error: 'questionId and relativePath required.' });
    }
    await HRInterviewService.saveRecordingPath(hrSessionId, questionId, relativePath);
    res.json({ success: true });
  } catch (err: any) {
    console.error('Failed to save recording path:', err);
    res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
});

// Delete a candidate recording
interviewSessionRouter.delete('/:id/hr/recording/:responseId', async (req, res) => {
  try {
    const identityId = getIdentityId(req);
    const result = await HRInterviewService.deleteRecording(
      req.params.id,
      identityId,
      req.params.responseId
    );
    res.json(result);
  } catch (err: any) {
    console.error('Failed to delete HR recording:', err);
    res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
});

// Get HR conversation history (backward compat with old frontend)
interviewSessionRouter.get('/:id/hr/conversation', async (req, res) => {
  try {
    const identityId = getIdentityId(req);
    const result = await HRInterviewService.getConversation(req.params.id, identityId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    console.error('Failed to get HR conversation:', err);
    res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
});

// Legacy: Process candidate response in multi-turn conversation
interviewSessionRouter.post('/:id/hr/message', async (req, res) => {
  try {
    const identityId = getIdentityId(req);
    const { response, turnIndex } = req.body;
    const result = await HRInterviewService.processTurn(
      req.params.id,
      identityId,
      response,
      turnIndex
    );
    res.json(result);
  } catch (err: any) {
    console.error('Failed to process HR turn:', err);
    res.status(err.statusCode || 500).json({
      success: false,
      errorType: err.errorType || 'ERROR',
      error: err.message,
    });
  }
});

// Get detailed HR report with all question-wise scores
interviewSessionRouter.get('/:id/hr/report', async (req, res) => {
  try {
    const identityId = getIdentityId(req);
    const result = await HRInterviewService.getReport(req.params.id, identityId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    console.error('Failed to get HR report:', err);
    res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
});

// Complete HR Round & trigger full AI evaluation
interviewSessionRouter.post('/:id/hr/complete', async (req, res) => {
  try {
    const identityId = getIdentityId(req);
    const result = await HRInterviewService.completeHR(req.params.id, identityId);
    res.json(result);
  } catch (err: any) {
    console.error('Failed to complete HR round:', err);
    res.status(err.statusCode || 500).json({
      success: false,
      errorType: err.errorType || 'ERROR',
      error: err.message,
    });
  }
});

// Legacy: Complete HR Stage (POST /:id/hr)
interviewSessionRouter.post('/:id/hr', async (req, res) => {
  try {
    const identityId = getIdentityId(req);
    const result = await HRInterviewService.completeHR(req.params.id, identityId);
    res.json(result);
  } catch (err: any) {
    console.error('Failed to complete HR stage:', err);
    res.status(err.statusCode || 500).json({
      success: false,
      errorType: err.errorType || 'ERROR',
      error: err.message,
    });
  }
});

// ─── 6. FINALIZATION & REPORT SNAPSHOT ───────────────────────────────────────

// Finalize session & generate report
interviewSessionRouter.post('/:id/finalize', async (req, res) => {
  try {
    const identityId = getIdentityId(req);
    const completionReason =
      req.body?.completionReason ||
      (req.body?.reason === 'TIME_EXPIRED' ? 'TIME_EXPIRED' : undefined);

    const report = await ReportService.finalizeSession(
      req.params.id,
      identityId,
      req.body?.telemetry,
      completionReason
    );
    res.json(report);
  } catch (err: any) {
    console.error('Failed to finalize session:', err);
    res.status(err.statusCode || 500).json({
      success: false,
      errorType: err.errorType || 'ERROR',
      error: err.message,
    });
  }
});

// Get Final Report
interviewSessionRouter.get('/:id/report', async (req, res) => {
  try {
    const identityId = getIdentityId(req);
    const report = await ReportService.getReport(req.params.id, identityId);
    res.json(report);
  } catch (err: any) {
    console.error('Failed to get report:', err);
    res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
});

// ─── 7. "ASK ABOUT MY INTERVIEW" AI CHATBOT ──────────────────────────────────

// Send query to report chatbot
interviewSessionRouter.post('/:id/report/chat', async (req, res) => {
  try {
    const identityId = getIdentityId(req);
    const { message, displayContent } = req.body;
    const response = await ReportChatService.handleChatQuery(
      req.params.id,
      identityId,
      message,
      displayContent
    );
    res.json({ success: true, data: response });
  } catch (err: any) {
    console.error('Failed to process report chat query:', err);
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message,
    });
  }
});

// Get report chat history
interviewSessionRouter.get('/:id/report/chat', async (req, res) => {
  try {
    const identityId = getIdentityId(req);
    const history = await ReportChatService.getChatHistory(req.params.id, identityId);
    res.json({ success: true, data: history });
  } catch (err: any) {
    console.error('Failed to get report chat history:', err);
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message,
    });
  }
});

// Validate practice question answer
interviewSessionRouter.post('/:id/report/chat/practice/:practiceQuestionId/answer', async (req, res) => {
  try {
    const identityId = getIdentityId(req);
    const { answer } = req.body;
    const response = await ReportChatService.validatePracticeAnswer(
      req.params.id,
      identityId,
      req.params.practiceQuestionId,
      answer || ''
    );
    res.json({ success: true, data: response });
  } catch (err: any) {
    console.error('Failed to validate practice answer:', err);
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message,
    });
  }
});


