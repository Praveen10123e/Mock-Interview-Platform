import React, { useEffect, useState } from 'react';
import {
  BarChart2, Star, TrendingUp, TrendingDown, MessageSquare,
  Clock, FileText, ChevronDown, ChevronUp, Info, Award, CheckCircle2, Loader2
} from 'lucide-react';
import { HRInterviewAPI, SCORING_DIMENSIONS } from '../../services/hrInterview.service';
import type { HRSession } from '../../services/hrInterview.service';

interface HRReportTabProps {
  interviewId: string;
}

export const HRReportTab: React.FC<HRReportTabProps> = ({ interviewId }) => {
  const [session, setSession] = useState<HRSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedQ, setExpandedQ] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await HRInterviewAPI.getReport(interviewId);
        setSession(res.data || res);
      } catch (err: any) {
        setError('Failed to load HR report. The interview may still be processing.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [interviewId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 p-8 bg-white border border-[#E2E8F0] rounded-xl text-[#64748B] text-xs shadow-xs">
        <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
        <p className="font-semibold">Loading HR behavioral report…</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex items-center gap-3 p-5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
        <Info className="w-5 h-5 text-rose-600 shrink-0" />
        <p className="font-medium">{error || 'No HR session data found.'}</p>
      </div>
    );
  }

  const evaluation = session.evaluation;
  const mainQuestions = session.questions?.filter((q) => q.questionType === 'MAIN') || [];

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 65) return '#f59e0b';
    return '#ef4444';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 65) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Needs Work';
  };

  return (
    <div className="space-y-6 text-[#0F172A]">
      {/* Overall Score Card */}
      {evaluation ? (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Score Ring */}
            <div className="relative w-24 h-24 rounded-full border-4 flex flex-col items-center justify-center shrink-0 shadow-sm"
                 style={{ borderColor: getScoreColor(evaluation.overallScore) }}>
              <span className="text-3xl font-extrabold" style={{ color: getScoreColor(evaluation.overallScore) }}>
                {Math.round(evaluation.overallScore)}
              </span>
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">/ 100</span>
            </div>

            {/* Score Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mb-1.5">
                <h2 className="text-lg font-bold text-[#0F172A]">
                  Behavioral Interview Score
                </h2>
                <span
                  className="text-xs font-bold px-2.5 py-0.5 rounded-full border"
                  style={{
                    color: getScoreColor(evaluation.overallScore),
                    borderColor: `${getScoreColor(evaluation.overallScore)}40`,
                    backgroundColor: `${getScoreColor(evaluation.overallScore)}10`,
                  }}
                >
                  {getScoreLabel(evaluation.overallScore)}
                </span>
              </div>
              {evaluation.aiSummary && (
                <p className="text-xs sm:text-sm text-[#475569] leading-relaxed mt-1">
                  {evaluation.aiSummary}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 p-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#64748B] text-xs">
          <Info className="w-4 h-4 text-[#64748B]" />
          <p>
            {session.status === 'ANALYZING'
              ? 'Your responses are being evaluated. Please check back in a moment.'
              : session.status === 'IN_PROGRESS'
              ? 'The interview is still in progress.'
              : 'Evaluation not available yet.'}
          </p>
        </div>
      )}

      {/* 10-Dimension Score Breakdown */}
      {evaluation && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E2E8F0]">
            <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-indigo-600" />
              Performance Dimensions
            </h3>
            <span className="text-xs text-[#64748B]">Scored 0–100</span>
          </div>

          <div className="space-y-3.5">
            {SCORING_DIMENSIONS.map((dim) => {
              const score = (evaluation[dim.key as keyof typeof evaluation] as number) || 0;
              return (
                <div key={dim.key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: dim.color }} />
                      <span className="font-semibold text-[#0F172A]">{dim.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {dim.weight > 0 && (
                        <span className="text-[11px] font-medium text-[#64748B]">
                          {dim.weight}%
                        </span>
                      )}
                      <span className="font-bold text-xs font-mono min-w-[28px] text-right" style={{ color: getScoreColor(score) }}>
                        {Math.round(score)}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200/60">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${score}%`,
                        background: `linear-gradient(90deg, ${dim.color}bb, ${dim.color})`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Strengths & Improvements */}
      {evaluation && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Strengths Card */}
          <div className="bg-emerald-50/40 border border-emerald-200 rounded-xl p-5 shadow-2xs">
            <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Key Strengths
            </h3>
            <ul className="space-y-2 text-xs text-[#1E293B]">
              {(evaluation.strengths as string[]).map((s, i) => (
                <li key={i} className="flex items-start gap-2 leading-relaxed">
                  <Star className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Improvements Card */}
          <div className="bg-amber-50/40 border border-amber-200 rounded-xl p-5 shadow-2xs">
            <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-2 mb-3">
              <TrendingDown className="w-4 h-4 text-amber-600" />
              Areas to Improve
            </h3>
            <ul className="space-y-2 text-xs text-[#1E293B]">
              {(evaluation.improvements as string[]).map((s, i) => (
                <li key={i} className="flex items-start gap-2 leading-relaxed">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* STAR Framework Guidance */}
      {evaluation?.starGuidance && (
        <div className="bg-indigo-50/50 border border-indigo-200 rounded-xl p-4 flex items-start gap-3 text-xs shadow-2xs">
          <Award className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-indigo-950 mb-1">STAR Framework Recommendations</h4>
            <p className="text-indigo-900 leading-relaxed">{evaluation.starGuidance}</p>
          </div>
        </div>
      )}

      {/* Question-by-Question Review Accordion */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-xs">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E2E8F0]">
          <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-600" />
            Question-by-Question Review
          </h3>
          <span className="text-xs text-[#64748B]">
            {mainQuestions.length} Questions
          </span>
        </div>

        <div className="space-y-2.5">
          {mainQuestions.map((q, idx) => {
            const isOpen = expandedQ === q.id;
            return (
              <div
                key={q.id}
                className="border border-[#E2E8F0] rounded-lg overflow-hidden bg-[#F8FAFC] transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setExpandedQ(isOpen ? null : q.id)}
                  className="w-full p-3.5 flex items-center justify-between gap-3 text-left hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <span className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold shrink-0">
                      Q{idx + 1}
                    </span>
                    <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider shrink-0 hidden sm:inline">
                      {q.category}
                    </span>
                    <span className="text-xs font-semibold text-[#0F172A] truncate">
                      {q.question}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {q.response ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {q.response.durationSeconds}s
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-medium">Not Answered</span>
                    )}
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-[#64748B]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#64748B]" />
                    )}
                  </div>
                </button>

                {isOpen && (
                  <div className="p-4 bg-white border-t border-[#E2E8F0] space-y-3">
                    <div>
                      <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">
                        Full Question
                      </span>
                      <p className="text-xs sm:text-sm font-semibold text-[#0F172A] leading-relaxed">
                        {q.question}
                      </p>
                    </div>

                    {q.response ? (
                      <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[#475569] flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-indigo-600" />
                            Candidate Transcript
                          </span>
                          <div className="flex items-center gap-3 text-[11px] text-[#64748B]">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {q.response.durationSeconds}s
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" /> {q.response.wordCount} words
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-[#334155] leading-relaxed italic">
                          "{q.response.transcript || 'No transcript captured.'}"
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">This question was not answered.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
