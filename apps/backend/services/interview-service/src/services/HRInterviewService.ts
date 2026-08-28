import { PrismaClient } from '../generated/client';
import { InterviewSessionService } from './InterviewSessionService';
import { HRMessage } from '../types/interviewTypes';

let _prisma: PrismaClient;
const prisma = new Proxy({} as PrismaClient, {
  get(target, prop) {
    if (!_prisma) _prisma = new PrismaClient();
    return (_prisma as any)[prop];
  },
});

const BEHAVIORAL_FOLLOW_UPS = [
  'Could you share a specific technical challenge or edge case you encountered in that experience and how you resolved it?',
  'How did you communicate your approach to teammates or stakeholders, and how did you handle feedback or differing opinions?',
  'Looking back at that project, what is one architectural or design decision you would approach differently today?',
  'Thank you for providing those details. Your behavioral and technical responses have been recorded.',
];

export class HRInterviewService {
  /**
   * Send a candidate response and receive the next structured follow-up question
   */
  static async processTurn(
    interviewId: string,
    identityId: string,
    candidateResponse: string,
    clientTurnIndex?: number
  ) {
    // 1. Centralized SESSION_FINALIZED guard
    await InterviewSessionService.requireActiveSession(interviewId, identityId);

    if (!candidateResponse || !candidateResponse.trim()) {
      throw new Error('Response content cannot be empty.');
    }

    // 2. Fetch locked HR question for initial prompt context
    const { hr } = await InterviewSessionService.getSessionQuestions(interviewId, identityId);
    const initialQuestion =
      hr[0]?.description ||
      hr[0]?.title ||
      'Please introduce yourself, your academic background, and your key engineering interests.';

    // 3. Fetch existing conversation events
    const existingEvents = await prisma.interviewHistory.findMany({
      where: {
        interviewId,
        event: 'HR_MESSAGE',
      },
      orderBy: { timestamp: 'asc' },
    });

    const conversation: HRMessage[] = [];
    existingEvents.forEach((ev, idx) => {
      const d = ev.details as any;
      if (d && d.content) {
        conversation.push({
          id: ev.id,
          role: d.role || 'candidate',
          content: d.content,
          timestamp: ev.timestamp.toISOString(),
          turnIndex: d.turnIndex ?? idx,
        });
      }
    });

    // If conversation is empty, initialize with opening question
    if (conversation.length === 0) {
      const openingMsg: HRMessage = {
        id: `init-${Date.now()}`,
        role: 'interviewer',
        content: initialQuestion,
        timestamp: new Date().toISOString(),
        turnIndex: 0,
      };
      conversation.push(openingMsg);
      await prisma.interviewHistory.create({
        data: {
          interviewId,
          event: 'HR_MESSAGE',
          details: openingMsg as any,
        },
      });
    }

    const candidateTurnIndex = conversation.length;

    // Record candidate's response
    const candidateMsg: HRMessage = {
      id: `cand-${Date.now()}`,
      role: 'candidate',
      content: candidateResponse.trim(),
      timestamp: new Date().toISOString(),
      turnIndex: candidateTurnIndex,
    };
    conversation.push(candidateMsg);

    await prisma.interviewHistory.create({
      data: {
        interviewId,
        event: 'HR_MESSAGE',
        details: candidateMsg as any,
      },
    });

    // Determine deterministic follow-up question
    const candidateResponseCount = conversation.filter((m) => m.role === 'candidate').length;
    const followUpText =
      BEHAVIORAL_FOLLOW_UPS[candidateResponseCount - 1] ||
      BEHAVIORAL_FOLLOW_UPS[BEHAVIORAL_FOLLOW_UPS.length - 1];

    const interviewerMsg: HRMessage = {
      id: `interv-${Date.now()}`,
      role: 'interviewer',
      content: followUpText,
      timestamp: new Date().toISOString(),
      turnIndex: candidateTurnIndex + 1,
    };
    conversation.push(interviewerMsg);

    await prisma.interviewHistory.create({
      data: {
        interviewId,
        event: 'HR_MESSAGE',
        details: interviewerMsg as any,
      },
    });

    const isComplete = candidateResponseCount >= 2;

    return {
      success: true,
      nextMessage: interviewerMsg,
      conversation,
      canComplete: isComplete,
      totalResponses: candidateResponseCount,
    };
  }

  /**
   * Get complete conversation history
   */
  static async getConversation(interviewId: string, identityId: string) {
    await InterviewSessionService.getInterviewScoped(interviewId, identityId);

    const { hr } = await InterviewSessionService.getSessionQuestions(interviewId, identityId);
    const initialQuestion =
      hr[0]?.description ||
      hr[0]?.title ||
      'Please introduce yourself, your academic background, and your key engineering interests.';

    const events = await prisma.interviewHistory.findMany({
      where: {
        interviewId,
        event: 'HR_MESSAGE',
      },
      orderBy: { timestamp: 'asc' },
    });

    const conversation: HRMessage[] = [];
    events.forEach((ev, idx) => {
      const d = ev.details as any;
      if (d && d.content) {
        conversation.push({
          id: ev.id,
          role: d.role || 'candidate',
          content: d.content,
          timestamp: ev.timestamp.toISOString(),
          turnIndex: d.turnIndex ?? idx,
        });
      }
    });

    if (conversation.length === 0) {
      conversation.push({
        id: 'initial-prompt',
        role: 'interviewer',
        content: initialQuestion,
        timestamp: new Date().toISOString(),
        turnIndex: 0,
      });
    }

    const candidateCount = conversation.filter((m) => m.role === 'candidate').length;

    return {
      conversation,
      totalResponses: candidateCount,
      canComplete: candidateCount >= 1,
    };
  }

  /**
   * Complete HR Stage
   */
  static async completeHRStage(interviewId: string, identityId: string) {
    // 1. Centralized SESSION_FINALIZED guard
    await InterviewSessionService.requireActiveSession(interviewId, identityId);

    const { conversation, totalResponses } = await this.getConversation(interviewId, identityId);

    const telemetry = {
      completed: true,
      totalInteractions: conversation.length,
      candidateResponsesCount: totalResponses,
      conversation,
      completedAt: new Date().toISOString(),
    };

    await prisma.interviewHistory.create({
      data: {
        interviewId,
        event: 'HR_COMPLETE',
        details: telemetry as any,
      },
    });

    return {
      success: true,
      stage: 'HR_COMPLETED',
      telemetry,
    };
  }
}

