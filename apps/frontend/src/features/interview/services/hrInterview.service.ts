/**
 * hrInterview.service.ts
 * 
 * Client-side API wrapper for the new HR Behavioral Interview module.
 */
import api from '../../../api/axios/instance';

const BASE = '/interviews';

export const HRInterviewAPI = {
  /** Initialize or resume the HR session — returns session with questions */
  initSession: async (interviewId: string, role = 'Software Engineer') => {
    const res = await api.post(`${BASE}/${interviewId}/hr/session`, { role });
    return res.data;
  },

  /** Get current HR session status + questions + evaluation */
  getSession: async (interviewId: string) => {
    const res = await api.get(`${BASE}/${interviewId}/hr/session`);
    return res.data;
  },

  /** Mark session as started (in progress) */
  startSession: async (interviewId: string) => {
    const res = await api.post(`${BASE}/${interviewId}/hr/start`);
    return res.data;
  },

  /** Submit a transcript response for a specific question */
  submitResponse: async (
    interviewId: string,
    questionId: string,
    transcript: string,
    durationSeconds: number
  ) => {
    const res = await api.post(`${BASE}/${interviewId}/hr/response`, {
      questionId,
      transcript,
      durationSeconds,
    });
    return res.data;
  },

  /** Complete the HR round and trigger AI evaluation */
  completeHR: async (interviewId: string) => {
    const res = await api.post(`${BASE}/${interviewId}/hr/complete`);
    return res.data;
  },

  /** Get detailed HR report with all scores */
  getReport: async (interviewId: string) => {
    const res = await api.get(`${BASE}/${interviewId}/hr/report`);
    return res.data;
  },

  /** Delete a recording file from the server */
  deleteRecording: async (interviewId: string, responseId: string) => {
    const res = await api.delete(`${BASE}/${interviewId}/hr/recording/${responseId}`);
    return res.data;
  },
};

// Types for use throughout the HR module

export interface HRQuestion {
  id: string;
  question: string;
  category: string;
  questionType: 'MAIN' | 'FOLLOW_UP';
  sequence: number;
  isFollowUpToId?: string | null;
  response?: {
    id: string;
    transcript: string;
    durationSeconds: number;
    wordCount: number;
    hasRecording: boolean;
    recordingPath?: string;
    submittedAt: string;
  } | null;
}

export interface HRSessionEvaluation {
  communicationScore: number;
  problemSolvingScore: number;
  teamworkScore: number;
  professionalismScore: number;
  relevanceScore: number;
  clarityScore: number;
  ownershipScore: number;
  leadershipScore: number;
  confidenceScore: number;
  structureScore: number;
  overallScore: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  starGuidance: string;
  aiSummary: string;
}

export interface HRSession {
  id: string;
  interviewId: string;
  position: string;
  interviewType: string;
  status: 'READY' | 'IN_PROGRESS' | 'ANALYZING' | 'COMPLETED';
  startedAt?: string;
  completedAt?: string;
  overallScore?: number;
  questions: HRQuestion[];
  evaluation?: HRSessionEvaluation | null;
}

export const SCORING_DIMENSIONS = [
  { key: 'communicationScore',   label: 'Communication',    weight: 20, color: '#6366f1' },
  { key: 'problemSolvingScore',  label: 'Problem Solving',  weight: 15, color: '#8b5cf6' },
  { key: 'teamworkScore',        label: 'Teamwork',         weight: 15, color: '#a855f7' },
  { key: 'professionalismScore', label: 'Professionalism',  weight: 15, color: '#ec4899' },
  { key: 'relevanceScore',       label: 'Relevance',        weight: 15, color: '#f59e0b' },
  { key: 'clarityScore',         label: 'Clarity',          weight: 10, color: '#10b981' },
  { key: 'ownershipScore',       label: 'Ownership',        weight:  5, color: '#14b8a6' },
  { key: 'leadershipScore',      label: 'Leadership',       weight:  5, color: '#3b82f6' },
  { key: 'confidenceScore',      label: 'Confidence',       weight:  0, color: '#f97316' },
  { key: 'structureScore',       label: 'Structure',        weight:  0, color: '#64748b' },
] as const;
