import { PrismaClient } from '../generated/client';
import { InterviewSessionService } from './InterviewSessionService';
import { ReportEvidenceService } from './ReportEvidenceService';
import { ReportAnalysisService } from './ReportAnalysisService';

let _prisma: PrismaClient;
const prisma = new Proxy({} as PrismaClient, {
  get(target, prop) {
    if (!_prisma) _prisma = new PrismaClient();
    return (_prisma as any)[prop];
  },
});

export class ReportService {
  /**
   * Finalize interview session and create immutable deterministic report snapshot
   */
  static async finalizeSession(
    interviewId: string,
    identityId: string,
    telemetryOverride?: any
  ) {
    const interview = await InterviewSessionService.getInterviewScoped(interviewId, identityId);

    if (!interview.session) {
      throw new Error('Interview session record not found.');
    }

    // Idempotency: If already finalized and complete, return the existing immutable snapshot
    if (interview.session.finalizedAt && interview.session.reportSnapshot) {
      const snap = interview.session.reportSnapshot as any;
      const aptList = snap?.aptitudeAnalysis || snap?.stages?.aptitude?.questions || [];
      const isMissingOptions = aptList.length > 0 && aptList.some((q: any) => !q.options || q.options.length < 2 || q.options[0] === 'A' || q.options[0] === 'Option A' || !q.howToImprove);
      if (!isMissingOptions) {
        return interview.session.reportSnapshot;
      }
    }

    // 1. Collect exact session evidence
    const evidence = await ReportEvidenceService.collectEvidence(
      interviewId,
      identityId,
      telemetryOverride
    );

    // 2. Synthesize rich analysis & 7-dimension scoring
    const synthesized = await ReportAnalysisService.synthesizeReport(evidence);

    const finalReportSnapshot = {
      ...synthesized,
      reportId: `rep-${interviewId}`,
      interviewId,
      candidateIdentityId: identityId,
      overallScore: synthesized.overallProficiencyScore,
      scoreDisplay: `${synthesized.overallProficiencyScore}%`,
      stages: {
        aptitude: {
          totalQuestions: evidence.aptitude.totalQuestions,
          attemptedCount: evidence.aptitude.attemptedCount,
          correctCount: evidence.aptitude.correctCount,
          incorrectCount: evidence.aptitude.incorrectCount,
          scorePercentage: evidence.aptitude.scorePercentage,
          isCompleted: evidence.aptitude.status === 'COMPLETED',
          status: evidence.aptitude.status,
          questions: synthesized.aptitudeAnalysis,
        },
        coding: {
          totalProblems: evidence.coding.totalProblems,
          problemsAttempted: evidence.coding.problemsAttempted,
          problemsSubmitted: evidence.coding.problemsSubmitted,
          problemsAccepted: evidence.coding.problemsAccepted,
          totalRunAttempts: evidence.coding.totalRunCount,
          totalSubmitAttempts: evidence.coding.totalSubmitCount,
          totalTestsPassed: evidence.coding.totalTestsPassed,
          totalTestsCount: evidence.coding.totalTestsCount,
          scorePercentage: evidence.coding.scorePercentage,
          problems: synthesized.codingAnalysis,
          status: evidence.coding.status,
        },
        hr: {
          isCompleted: evidence.hr.status === 'COMPLETED',
          totalInteractions: evidence.hr.totalInteractions,
          candidateResponsesCount: evidence.hr.candidateResponsesCount,
          conversationLog: evidence.hr.transcript,
          status: evidence.hr.status,
          analysis: synthesized.hrAnalysis,
        },
      },
      evaluationSummary: {
        aptitudeAccuracy: `${evidence.aptitude.correctCount}/${evidence.aptitude.totalQuestions} correct (${evidence.aptitude.scorePercentage}%)`,
        codingSuccess: `${evidence.coding.problemsAccepted}/${evidence.coding.totalProblems} solved (${evidence.coding.totalTestsPassed}/${evidence.coding.totalTestsCount} tests passed)`,
        hrExcellence: `${evidence.hr.candidateResponsesCount} behavioral dialogue responses recorded (${evidence.hr.status})`,
      },
      dataIntegrityNote: 'This report is computed purely from verified stored execution evidence.',
    };

    // 3. Persist immutable snapshot & mark session COMPLETED
    await prisma.interviewSession.update({
      where: { id: interview.session.id },
      data: {
        finalizedAt: new Date(),
        finishedAt: new Date(),
        reportSnapshot: finalReportSnapshot as any,
        reportVersion: 3,
      },
    });

    await prisma.interview.update({
      where: { id: interviewId },
      data: {
        state: 'COMPLETED',
      },
    });

    return finalReportSnapshot;
  }

  /**
   * Get Report for session (returns snapshot if finalized, or live preview)
   */
  static async getReport(interviewId: string, identityId: string) {
    const interview = await InterviewSessionService.getInterviewScoped(interviewId, identityId);

    if (interview.session?.finalizedAt && interview.session?.reportSnapshot) {
      const snap = interview.session.reportSnapshot as any;
      const aptList = snap?.aptitudeAnalysis || snap?.stages?.aptitude?.questions || [];
      const isMissingOptions = aptList.length > 0 && aptList.some((q: any) => !q.options || q.options.length < 2 || q.options[0] === 'A' || q.options[0] === 'Option A' || !q.howToImprove);
      if (!isMissingOptions) {
        return interview.session.reportSnapshot;
      }
    }

    // Live preview or self-healing upgrade
    return this.finalizeSession(interviewId, identityId);
  }
}
