import express from 'express';
import { InterviewSessionService } from '../services/InterviewSessionService';
import { AptitudeService } from '../services/AptitudeService';
import { CodingEvidenceService } from '../services/CodingEvidenceService';
import { HRInterviewService } from '../services/HRInterviewService';
import { ReportService } from '../services/ReportService';
import { ReportChatService } from '../services/ReportChatService';

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

// ─── 5. STAGE 3: HR CONVERSATIONAL ROUND ─────────────────────────────────────

// Get HR conversation history
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

// Process candidate response in multi-turn conversation
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

// Complete HR Stage
interviewSessionRouter.post('/:id/hr', async (req, res) => {
  try {
    const identityId = getIdentityId(req);
    const result = await HRInterviewService.completeHRStage(req.params.id, identityId);
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
    const report = await ReportService.finalizeSession(
      req.params.id,
      identityId,
      req.body?.telemetry
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


