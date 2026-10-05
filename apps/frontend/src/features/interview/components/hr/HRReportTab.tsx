import React, { useEffect, useState } from 'react';
import {
  BarChart2, Star, TrendingUp, TrendingDown, MessageSquare,
  Clock, FileText, ChevronDown, ChevronUp, Info, Award, CheckCircle2, Loader2,
  Sparkles, ShieldCheck, AlertTriangle, Mic, Target, ArrowRight,
  Video, Play, Download, X
} from 'lucide-react';
import { HRInterviewAPI, SCORING_DIMENSIONS } from '../../services/hrInterview.service';
import type { HRSession } from '../../services/hrInterview.service';
import api from '../../../../api/axios/instance';
import { getAccessToken } from '../../../../store/AuthStore';

interface HRReportTabProps {
  interviewId: string;
}

export const HRReportTab: React.FC<HRReportTabProps> = ({ interviewId }) => {
  const [session, setSession] = useState<HRSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedQ, setExpandedQ] = useState<string | null>(null);
  const [downloadingMediaId, setDownloadingMediaId] = useState<string | null>(null);

  const handleDownloadVideo = async (mediaId: string, sequenceNumber: number) => {
    try {
      setDownloadingMediaId(mediaId);
      const response = await api.get(`/interviews/${interviewId}/media/${mediaId}/download`, {
        responseType: 'blob',
      });
      const contentType = String(response.headers['content-type'] || 'video/webm');
      const ext = contentType.includes('mp4') ? 'mp4' : 'webm';
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Question_${String(sequenceNumber).padStart(2, '0')}_Answer.${ext}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error('Failed to download answer video:', err);
      alert('Failed to download answer video. It may have expired or is unavailable.');
    } finally {
      setDownloadingMediaId(null);
    }
  };

  const [activeVideoModal, setActiveVideoModal] = useState<{
    questionNumber: number;
    questionText: string;
    durationSeconds: number;
    mediaId: string;
    streamUrl: string;
    downloadUrl: string;
  } | null>(null);

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

      {/* Communication Pattern Summary (Interview-level Speech Intelligence) */}
      {evaluation?.speechSummary && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E2E8F0] gap-2">
            <div>
              <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-2">
                <Mic className="w-4 h-4 text-indigo-600" />
                Communication Pattern Summary
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Coaching insights aggregated across all spoken responses. Diagnostic only — does not alter official HR scoring.
              </p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider self-start sm:self-auto">
              Communication Coaching Insights
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Average Filler Rate</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-lg font-extrabold text-[#0F172A] font-mono">
                  {evaluation.speechSummary.averageFillerRate}%
                </span>
                <span className="text-[10px] text-slate-400">/ 100 words</span>
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                {evaluation.speechSummary.totalFillerWords} total filler words
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Speaking Pace</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-lg font-extrabold text-[#0F172A] font-mono">
                  {evaluation.speechSummary.averageWpm !== null ? Math.round(evaluation.speechSummary.averageWpm) : '—'}
                </span>
                <span className="text-[10px] text-slate-400">WPM</span>
              </div>
              <span className="text-[11px] font-medium text-slate-600 capitalize mt-0.5 block">
                {evaluation.speechSummary.paceClassification.replace('_', ' ')}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Disfluencies</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-lg font-extrabold text-[#0F172A] font-mono">
                  {evaluation.speechSummary.totalRepetitions + evaluation.speechSummary.totalFalseStarts}
                </span>
                <span className="text-[10px] text-slate-400">events</span>
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                {evaluation.speechSummary.totalRepetitions} rep, {evaluation.speechSummary.totalFalseStarts} false starts
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Language Markers</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-lg font-extrabold text-emerald-600 font-mono">
                  {evaluation.speechSummary.totalConfidenceMarkers}
                </span>
                <span className="text-[10px] text-slate-400">conf. /</span>
                <span className="text-lg font-extrabold text-amber-600 font-mono">
                  {evaluation.speechSummary.totalUncertaintyMarkers}
                </span>
                <span className="text-[10px] text-slate-400">uncert.</span>
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Linguistic phrasing markers
              </span>
            </div>
          </div>

          {/* Top Filler Words Breakdown */}
          {Array.isArray(evaluation.speechSummary.topFillerWords) && evaluation.speechSummary.topFillerWords.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Observed Filler Expressions:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {evaluation.speechSummary.topFillerWords.map((item, fIdx) => (
                  <span
                    key={fIdx}
                    className="inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200"
                  >
                    <span>"{item.word}"</span>
                    <span className="font-bold text-indigo-600">×{item.count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Coaching Recommendations */}
          {Array.isArray(evaluation.speechSummary.coachingRecommendations) && evaluation.speechSummary.coachingRecommendations.length > 0 && (
            <div className="p-3.5 rounded-lg bg-indigo-50/50 border border-indigo-100 space-y-2">
              <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Actionable Communication Coaching:
              </span>
              <ul className="space-y-1.5 text-xs text-[#334155]">
                {evaluation.speechSummary.coachingRecommendations.map((rec, rIdx) => (
                  <li key={rIdx} className="flex items-start gap-2 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
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
                      <div className="flex items-center gap-2">
                        {typeof q.response.questionScore === 'number' && (
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded font-mono text-[11px] font-bold border"
                            style={{
                              color: getScoreColor(q.response.questionScore),
                              borderColor: `${getScoreColor(q.response.questionScore)}40`,
                              backgroundColor: `${getScoreColor(q.response.questionScore)}10`,
                            }}
                          >
                            {Math.round(q.response.questionScore)}/100
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          {q.response.durationSeconds}s
                        </span>
                      </div>
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
                  <div className="p-5 bg-white border-t border-[#E2E8F0] space-y-4">
                    {/* Full Question */}
                    <div>
                      <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">
                        Full Question
                      </span>
                      <p className="text-xs sm:text-sm font-semibold text-[#0F172A] leading-relaxed">
                        {q.question}
                      </p>
                    </div>

                    {q.response ? (
                      <div className="space-y-4">
                        {/* Candidate Response Evidence */}
                        <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
                          <div className="flex items-center justify-between text-xs border-b border-[#E2E8F0] pb-2">
                            <span className="font-bold text-[#334155] flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-indigo-600" />
                              Candidate Response Evidence
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

                          {/* Raw Transcript (Immutable) */}
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-slate-500" />
                              Raw Spoken Transcript (Acoustic STT Record)
                            </span>
                            <p className="text-xs text-[#334155] leading-relaxed italic bg-white p-2.5 rounded-lg border border-slate-200">
                              "{q.response.rawTranscript || q.response.transcript || 'No speech recorded.'}"
                            </p>
                          </div>

                          {/* Verified Transcript (Context-Aware) */}
                          {(q.response.verifiedTranscript && q.response.verifiedTranscript !== (q.response.rawTranscript || q.response.transcript)) && (
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-indigo-600" />
                                Context-Verified Transcript (High-Confidence Normalization)
                              </span>
                              <p className="text-xs text-[#0F172A] leading-relaxed bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-200 font-medium">
                                "{q.response.verifiedTranscript}"
                              </p>
                            </div>
                          )}

                          {/* High-confidence corrections badge */}
                          {Array.isArray(q.response.corrections) && q.response.corrections.length > 0 && (
                            <div className="pt-1">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                                Verified Technical Normalizations
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {q.response.corrections.map((corr, cIdx) => (
                                  <span
                                    key={cIdx}
                                    className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200"
                                    title={corr.reason}
                                  >
                                    <span className="line-through text-slate-400">{corr.original}</span>
                                    <span>→</span>
                                    <span className="font-bold text-emerald-700">{corr.corrected}</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Uncertain segments badge */}
                          {Array.isArray(q.response.uncertainSegments) && q.response.uncertainSegments.length > 0 && (
                            <div className="pt-1">
                              <div className="flex flex-wrap gap-1.5">
                                {q.response.uncertainSegments.map((u, uIdx) => (
                                  <span
                                    key={uIdx}
                                    className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200"
                                  >
                                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                                    <span>Uncertain segment: "{u.text}" ({u.reason})</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* ── Question-Wise Answer Video Evidence ── */}
                          <div className="pt-2 border-t border-slate-200">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200">
                              <div className="flex items-start sm:items-center gap-2.5">
                                <Video className="w-4 h-4 text-black shrink-0 mt-0.5 sm:mt-0" />
                                <div>
                                  <span className="text-[11px] font-bold text-black uppercase tracking-wider block">
                                    Spoken Answer Video Evidence
                                  </span>
                                  <span className="text-[11px] text-slate-500">
                                    {q.response.answerMedia?.available
                                      ? 'Video available temporarily'
                                      : q.response.answerMedia?.status === 'EXPIRED'
                                      ? 'Answer Video Expired: This recording was automatically deleted after 1 hour.'
                                      : 'Answer recording unavailable.'}
                                  </span>
                                </div>
                              </div>

                              {q.response.answerMedia?.available && (
                                <div className="flex items-center gap-2 self-start sm:self-auto">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const token = getAccessToken();
                                      const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';
                                      const mId = q.response?.answerMedia?.mediaId || '';
                                      setActiveVideoModal({
                                        questionNumber: q.sequence,
                                        questionText: q.question,
                                        durationSeconds: q.response?.answerMedia?.durationSeconds || q.response?.durationSeconds || 0,
                                        mediaId: mId,
                                        streamUrl: `/api/v1/interviews/${interviewId}/media/${mId}/stream${tokenParam}`,
                                        downloadUrl: `/api/v1/interviews/${interviewId}/media/${mId}/download${tokenParam}`,
                                      });
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black text-white text-xs font-semibold rounded-md hover:bg-neutral-800 transition-colors shadow-xs cursor-pointer"
                                  >
                                    <Play className="w-3.5 h-3.5 fill-current" /> Watch Answer
                                  </button>

                                  <button
                                    type="button"
                                    disabled={downloadingMediaId === q.response?.answerMedia?.mediaId}
                                    onClick={() => {
                                      if (q.response?.answerMedia?.mediaId) {
                                        handleDownloadVideo(q.response.answerMedia.mediaId, q.sequence);
                                      }
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-black border border-black text-xs font-semibold rounded-md hover:bg-neutral-100 transition-colors cursor-pointer disabled:opacity-50"
                                  >
                                    {downloadingMediaId === q.response.answerMedia.mediaId ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Download className="w-3.5 h-3.5" />
                                    )}
                                    Download Video
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* AI Quality Evaluation & 8 Dimensions */}
                        {q.response.dimensionScores && (
                          <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] space-y-3">
                            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                              <span className="font-bold text-xs text-[#0F172A] flex items-center gap-1.5">
                                <BarChart2 className="w-3.5 h-3.5 text-indigo-600" />
                                Response Quality Evaluation (8 Dimensions)
                              </span>
                              {typeof q.response.questionScore === 'number' && (
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] font-medium text-slate-500">Authoritative Question Score:</span>
                                  <span
                                    className="px-2 py-0.5 rounded font-mono text-xs font-bold"
                                    style={{
                                      color: getScoreColor(q.response.questionScore),
                                      backgroundColor: `${getScoreColor(q.response.questionScore)}15`,
                                    }}
                                  >
                                    {Math.round(q.response.questionScore * 10) / 10} / 100
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* 8 Dimension Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                              {[
                                { key: 'relevance', label: 'Relevance' },
                                { key: 'specificity', label: 'Specificity' },
                                { key: 'evidence', label: 'Evidence' },
                                { key: 'structure', label: 'Structure' },
                                { key: 'clarity', label: 'Clarity' },
                                { key: 'technicalDepth', label: 'Tech Depth' },
                                { key: 'ownership', label: 'Ownership' },
                                { key: 'professionalism', label: 'Professionalism' },
                              ].map((dim) => {
                                const val = (q.response?.dimensionScores as any)?.[dim.key] ?? 0;
                                return (
                                  <div key={dim.key} className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 text-center">
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                                      {dim.label}
                                    </div>
                                    <div className="text-sm font-extrabold font-mono mt-0.5" style={{ color: getScoreColor(val * 10) }}>
                                      {val} <span className="text-[10px] text-slate-400 font-normal">/10</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Justification & Strengths */}
                            {q.response.justification && (
                              <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 leading-relaxed">
                                <span className="font-bold text-slate-700">Evaluation: </span>
                                {q.response.justification}
                              </p>
                            )}
                          </div>
                        )}

                        {/* STAR Analysis Section */}
                        {q.response.starAnalysis && (
                          <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] space-y-4 shadow-2xs">
                            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
                              <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-amber-500" />
                                <span className="font-bold text-xs text-[#0F172A]">
                                  STAR Framework Analysis & Coaching
                                </span>
                              </div>
                              {q.response.starAnalysis.starApplicable ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] font-medium text-slate-500">STAR Score:</span>
                                  <span
                                    className="px-2 py-0.5 rounded font-mono text-xs font-bold"
                                    style={{
                                      color: getScoreColor(q.response.starAnalysis.starScore),
                                      backgroundColor: `${getScoreColor(q.response.starAnalysis.starScore)}15`,
                                    }}
                                  >
                                    {Math.round(q.response.starAnalysis.starScore)}%
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                                  Not Applicable (Factual / Intro)
                                </span>
                              )}
                            </div>

                            {q.response.starAnalysis.starApplicable ? (
                              <div className="space-y-3">
                                {/* STAR 4-Component Breakdown */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                  {[
                                    { name: 'Situation', comp: q.response.starAnalysis.situation },
                                    { name: 'Task', comp: q.response.starAnalysis.task },
                                    { name: 'Action', comp: q.response.starAnalysis.action },
                                    { name: 'Result', comp: q.response.starAnalysis.result },
                                  ].map(({ name, comp }) => {
                                    const isPresent = comp?.present && comp?.score >= 4;
                                    return (
                                      <div
                                        key={name}
                                        className={`p-3 rounded-lg border text-xs space-y-1.5 transition-colors ${
                                          isPresent
                                            ? 'bg-emerald-50/40 border-emerald-200 text-slate-800'
                                            : 'bg-amber-50/40 border-amber-200 text-slate-800'
                                        }`}
                                      >
                                        <div className="flex items-center justify-between font-bold">
                                          <span className="flex items-center gap-1.5">
                                            {isPresent ? (
                                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                            ) : (
                                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                            )}
                                            <span>{name}</span>
                                          </span>
                                          <span
                                            className={`font-mono text-[11px] font-bold px-1.5 py-0.5 rounded ${
                                              isPresent
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : 'bg-amber-100 text-amber-800'
                                            }`}
                                          >
                                            {isPresent ? `Present — ${comp.score}/10` : `Missing — ${comp.score}/10`}
                                          </span>
                                        </div>
                                        <div className="text-[11px] text-slate-600 leading-relaxed italic">
                                          {comp.evidence ? (
                                            <span>"{comp.evidence}"</span>
                                          ) : (
                                            <span className="text-slate-400 not-italic">No candidate evidence found for this component.</span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Missing components summary badge */}
                                {q.response.starAnalysis.missingComponents?.length > 0 && (
                                  <div className="flex items-center gap-2 text-xs bg-amber-50 border border-amber-200 p-2.5 rounded-lg text-amber-900">
                                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                                    <span>
                                      <strong>Missing Components: </strong>
                                      {q.response.starAnalysis.missingComponents.join(', ')}
                                    </span>
                                  </div>
                                )}

                                {/* AI Coaching Feedback */}
                                {q.response.starAnalysis.feedback && (
                                  <div className="text-xs bg-indigo-50/60 border border-indigo-200 p-3 rounded-lg text-indigo-950 space-y-1">
                                    <span className="font-bold text-indigo-900 flex items-center gap-1">
                                      <Award className="w-3.5 h-3.5 text-indigo-600" />
                                      AI Coaching Advice:
                                    </span>
                                    <p className="text-[#334155] leading-relaxed">{q.response.starAnalysis.feedback}</p>
                                  </div>
                                )}

                                {/* Coached Improved Version (clearly distinguished from spoken transcript) */}
                                {q.response.starAnalysis.improvedVersion && (
                                  <div className="space-y-1.5 pt-1">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                      AI Coaching: Improved Answer Structure (Coaching Demonstration)
                                    </span>
                                    <pre className="whitespace-pre-wrap font-sans text-xs text-[#0F172A] bg-slate-50 border border-slate-200 p-3 rounded-lg leading-relaxed">
                                      {q.response.starAnalysis.improvedVersion}
                                    </pre>
                                    <span className="text-[10px] text-slate-400 italic block">
                                      Note: This is structured coaching guidance based on your words, never spoken by you.
                                    </span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200 italic">
                                STAR method is not required for factual or introductory questions. Candidate evaluated on direct technical accuracy and communication.
                              </p>
                            )}
                          </div>
                        )}

                        {/* Speech & Communication Intelligence Card */}
                        {q.response.speechAnalysis && (
                          <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] space-y-4 shadow-2xs">
                            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
                              <div className="flex items-center gap-2">
                                <Mic className="w-4 h-4 text-indigo-600" />
                                <span className="font-bold text-xs text-[#0F172A]">
                                  Speech & Communication Intelligence
                                </span>
                              </div>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                                Communication Coaching Insights
                              </span>
                            </div>

                            {q.response.speechAnalysis.status === 'completed' ? (
                              <div className="space-y-3.5">
                                {/* Metric Cards Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                  {/* Filler Rate */}
                                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Filler Words</span>
                                    <div className="flex items-baseline gap-1 mt-0.5">
                                      <span className="text-base font-extrabold text-[#0F172A] font-mono">
                                        {q.response.speechAnalysis.fillerWords.ratePer100Words}%
                                      </span>
                                      <span className="text-[10px] text-slate-400">/ 100w</span>
                                    </div>
                                    <span className="text-[10px] text-slate-500 block truncate">
                                      {q.response.speechAnalysis.fillerWords.total} detected
                                    </span>
                                  </div>

                                  {/* Speaking Pace */}
                                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Speaking Pace</span>
                                    <div className="flex items-baseline gap-1 mt-0.5">
                                      <span className="text-base font-extrabold text-[#0F172A] font-mono">
                                        {q.response.speechAnalysis.speechPace.wordsPerMinute !== null
                                          ? Math.round(q.response.speechAnalysis.speechPace.wordsPerMinute)
                                          : '—'}
                                      </span>
                                      <span className="text-[10px] text-slate-400">WPM</span>
                                    </div>
                                    <span className="text-[10px] font-medium text-slate-600 capitalize block truncate">
                                      {q.response.speechAnalysis.speechPace.classification.replace('_', ' ')}
                                    </span>
                                  </div>

                                  {/* Repetitions & False Starts */}
                                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Repetition & Starts</span>
                                    <div className="flex items-baseline gap-1 mt-0.5">
                                      <span className="text-base font-extrabold text-[#0F172A] font-mono">
                                        {q.response.speechAnalysis.repetitions.count + q.response.speechAnalysis.falseStarts.count}
                                      </span>
                                      <span className="text-[10px] text-slate-400">events</span>
                                    </div>
                                    <span className="text-[10px] text-slate-500 block truncate">
                                      {q.response.speechAnalysis.repetitions.count} rep · {q.response.speechAnalysis.falseStarts.count} false starts
                                    </span>
                                  </div>

                                  {/* Language Markers */}
                                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Language Phrasing</span>
                                    <div className="flex items-baseline gap-1 mt-0.5">
                                      <span className="text-base font-extrabold text-emerald-600 font-mono">
                                        {q.response.speechAnalysis.confidenceMarkers.confidenceCount}
                                      </span>
                                      <span className="text-[10px] text-slate-400">conf. /</span>
                                      <span className="text-base font-extrabold text-amber-600 font-mono">
                                        {q.response.speechAnalysis.confidenceMarkers.uncertaintyCount}
                                      </span>
                                      <span className="text-[10px] text-slate-400">uncert.</span>
                                    </div>
                                    <span className="text-[10px] text-slate-500 block truncate">
                                      Language markers
                                    </span>
                                  </div>
                                </div>

                                {/* Detailed Pills & Examples */}
                                {Object.keys(q.response.speechAnalysis.fillerWords.breakdown || {}).length > 0 && (
                                  <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                      Observed Filler Words:
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                      {Object.entries(q.response.speechAnalysis.fillerWords.breakdown).map(([word, count]) => (
                                        <span
                                          key={word}
                                          className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200"
                                        >
                                          <span>"{word}"</span>
                                          <span className="font-bold text-indigo-600">×{count}</span>
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Repetitions or False Starts */}
                                {q.response.speechAnalysis.repetitions.items?.length > 0 && (
                                  <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                      Repeated Words / Phrases:
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                      {q.response.speechAnalysis.repetitions.items.map((item, rIdx) => (
                                        <span
                                          key={rIdx}
                                          className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200"
                                        >
                                          <span>"{item.text}"</span>
                                          <span className="text-slate-500">({item.count}×)</span>
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Sentence Structure & Communication Assessment */}
                                <div className="p-3 rounded-lg bg-slate-50/70 border border-slate-200 text-xs space-y-1.5">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="font-bold text-slate-700">Sentence Delivery & Structure:</span>
                                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                      <span>{q.response.speechAnalysis.sentenceStructure.sentenceCount} sentences</span>
                                      <span>·</span>
                                      <span>avg {q.response.speechAnalysis.sentenceStructure.averageWordsPerSentence} words/sentence</span>
                                      {q.response.speechAnalysis.sentenceStructure.longestSentenceWords > 0 && (
                                        <>
                                          <span>·</span>
                                          <span>longest: {q.response.speechAnalysis.sentenceStructure.longestSentenceWords} words</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3 text-[11px] text-slate-600 pt-0.5">
                                    <span>Clarity: <strong className="capitalize text-slate-800">{q.response.speechAnalysis.communicationAssessment.clarity}</strong></span>
                                    <span>·</span>
                                    <span>Conciseness: <strong className="capitalize text-slate-800">{q.response.speechAnalysis.communicationAssessment.conciseness}</strong></span>
                                    <span>·</span>
                                    <span>Fluency: <strong className="capitalize text-slate-800">{q.response.speechAnalysis.communicationAssessment.fluency}</strong></span>
                                  </div>
                                </div>

                                {/* Coaching Recommendations */}
                                {q.response.speechAnalysis.recommendations?.length > 0 && (
                                  <div className="p-3 rounded-lg bg-indigo-50/60 border border-indigo-200 text-xs space-y-1">
                                    <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                                      Communication Coaching Tips:
                                    </span>
                                    <ul className="space-y-1 text-slate-700 list-disc list-inside">
                                      {q.response.speechAnalysis.recommendations.map((rec, rIdx) => (
                                        <li key={rIdx} className="leading-relaxed">{rec}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            ) : q.response.speechAnalysis.status === 'unavailable' ? (
                              <p className="text-xs text-slate-400 italic">
                                Speech pattern analysis unavailable (audio response was empty or contained no speech).
                              </p>
                            ) : (
                              <p className="text-xs text-slate-400 italic">
                                Speech pattern analysis could not be completed for this turn. Official scoring remains valid.
                              </p>
                            )}
                          </div>
                        )}
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

      {/* ========================================================
          PHASE 4: Final Section — INTERVIEW SUMMARY
          ======================================================== */}
      {evaluation?.summary && (
        <div id="hr-interview-summary" className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-xs space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E2E8F0] gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
                <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider">
                  INTERVIEW SUMMARY
                </h3>
              </div>
              <p className="text-xs text-[#64748B] mt-1">
                Evidence-grounded holistic evaluation synthesized from verified transcripts, 8-dimension behavioral scores, and speech pattern analysis.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                {evaluation.summary.analysisVersion || 'hr-summary-v1'}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                {evaluation.summary.overallAssessment?.scoreSource || 'HRScoreEngine'}
              </span>
            </div>
          </div>

          {/* Executive Overview */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50/70 via-slate-50 to-white border border-indigo-100/80 shadow-2xs space-y-2">
            <div className="flex items-center gap-2 text-indigo-950 font-bold text-xs">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Executive Overview</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              {evaluation.summary.executiveSummary}
            </p>
          </div>

          {/* Overall Assessment Score Block */}
          {evaluation.summary.overallAssessment && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Overall Assessment
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-indigo-700 font-mono">
                    {evaluation.summary.overallAssessment.officialScore}
                  </span>
                  <span className="text-xs font-bold text-slate-400">/ 100</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                    {evaluation.summary.overallAssessment.category}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  {evaluation.summary.overallAssessment.summary}
                </p>
              </div>
              {evaluation.summary.readinessScore !== null && evaluation.summary.readinessScore !== undefined && (
                <div className="p-3 bg-white rounded-lg border border-slate-200 shrink-0 text-right">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Readiness Score</span>
                  <span className="text-lg font-black text-emerald-600 font-mono">{evaluation.summary.readinessScore}%</span>
                </div>
              )}
            </div>
          )}

          {/* Top Strengths & Areas for Improvement */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top Strengths */}
            <div className="bg-emerald-50/40 border border-emerald-200 rounded-xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Top Strengths</span>
              </div>
              <div className="space-y-3">
                {evaluation.summary.topStrengths?.map((s, idx) => (
                  <div key={idx} className="bg-white/80 p-3 rounded-lg border border-emerald-100 text-xs space-y-1">
                    <div className="font-bold text-emerald-950 flex items-start gap-1.5">
                      <span className="text-emerald-600 font-mono">✓</span>
                      <span>{s.title || s.strength}</span>
                    </div>
                    {s.description && (
                      <p className="text-slate-600 pl-4">{s.description}</p>
                    )}
                    {s.evidence && (
                      <p className="text-[11px] text-slate-500 pl-4 italic border-l-2 border-emerald-300 ml-4 pl-2 mt-1">
                        "{s.evidence}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Areas for Improvement */}
            <div className="bg-amber-50/40 border border-amber-200 rounded-xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
                <TrendingDown className="w-4 h-4 text-amber-600" />
                <span>Areas for Improvement</span>
              </div>
              <div className="space-y-3">
                {evaluation.summary.areasForImprovement?.map((a, idx) => (
                  <div key={idx} className="bg-white/80 p-3 rounded-lg border border-amber-100 text-xs space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-bold text-amber-950 flex items-center gap-1.5">
                        <ArrowRight className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>{a.title || a.area}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                        a.priority === 'high'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {a.priority}
                      </span>
                    </div>
                    {a.evidence && (
                      <p className="text-[11px] text-slate-500 italic pl-5">
                        Observed: "{a.evidence}"
                      </p>
                    )}
                    {a.impact && (
                      <p className="text-slate-600 pl-5">
                        <strong className="text-slate-700">Impact:</strong> {a.impact}
                      </p>
                    )}
                    {a.recommendation && (
                      <p className="text-slate-700 pl-5 font-medium bg-amber-50/50 p-1.5 rounded border border-amber-200/50">
                        <strong className="text-amber-900">Advice:</strong> {a.recommendation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Communication & STAR Performance Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Communication Assessment */}
            {evaluation.summary.communicationAssessment && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-800">
                  <Mic className="w-4 h-4 text-indigo-600" />
                  <span>Communication</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  {evaluation.summary.communicationAssessment.summary}
                </p>
                {evaluation.summary.communicationAssessment.improvements?.length > 0 && (
                  <ul className="space-y-1 pt-1 border-t border-slate-200 text-slate-700">
                    {evaluation.summary.communicationAssessment.improvements.map((imp, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-indigo-600 font-bold">•</span>
                        <span>{imp}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* STAR Performance */}
            {evaluation.summary.starAssessment && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <Award className="w-4 h-4 text-amber-600" />
                    <span>STAR Performance</span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 font-mono">
                    {evaluation.summary.starAssessment.completeResponses} / {evaluation.summary.starAssessment.applicableResponses} Complete
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  {evaluation.summary.starAssessment.summary}
                </p>
                {evaluation.summary.starAssessment.missingResultResponses > 0 && (
                  <div className="p-2 rounded bg-amber-50 border border-amber-200 text-[11px] text-amber-900 font-medium">
                    ⚠️ {evaluation.summary.starAssessment.missingResultResponses} behavioral response(s) were missing a concrete, measurable Result component.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Recommended Practice Focus */}
          {evaluation.summary.recommendedPracticeFocus && evaluation.summary.recommendedPracticeFocus.length > 0 && (
            <div className="bg-indigo-50/40 border border-indigo-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 font-bold text-indigo-950 text-xs uppercase tracking-wider">
                <Target className="w-4 h-4 text-indigo-600" />
                <span>Recommended Practice Focus</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {evaluation.summary.recommendedPracticeFocus.map((p, idx) => (
                  <div key={idx} className="bg-white p-3.5 rounded-lg border border-indigo-100 shadow-2xs space-y-1.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-indigo-900 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                          {idx + 1}
                        </span>
                        <span>{p.focus}</span>
                      </span>
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                        {p.priority}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] pl-6 leading-relaxed">
                      {p.reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assessment Limitations */}
          {evaluation.summary.assessmentLimitations && evaluation.summary.assessmentLimitations.length > 0 && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-[11px] flex items-start gap-2">
              <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-700">Assessment Limitations:</span>
                <ul className="list-disc list-inside mt-0.5 space-y-0.5">
                  {evaluation.summary.assessmentLimitations.map((lim, idx) => (
                    <li key={idx}>{lim}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Question Answer Video Player Modal (Black & White Clean Design) ── */}
      {activeVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white rounded-lg border border-black shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-white">
              <div className="pr-4">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Question Q{activeVideoModal.questionNumber} Spoken Evidence
                </span>
                <h3 className="text-sm font-bold text-black line-clamp-1">
                  {activeVideoModal.questionText}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveVideoModal(null)}
                className="p-1 rounded-md text-slate-500 hover:text-black hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close video player"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Content */}
            <div className="p-5 space-y-3 bg-slate-50">
              <div className="relative aspect-video bg-black rounded-md overflow-hidden flex items-center justify-center shadow-inner">
                <video
                  controls
                  preload="metadata"
                  src={activeVideoModal.streamUrl}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-600 gap-1 px-1">
                <span>
                  Answer recording duration: <strong>{activeVideoModal.durationSeconds}s</strong>
                </span>
                <span className="text-[11px] text-slate-500">
                  Recordings automatically expire 1 hour after interview completion.
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-200 bg-white">
              <button
                type="button"
                disabled={downloadingMediaId === activeVideoModal.mediaId}
                onClick={() => handleDownloadVideo(activeVideoModal.mediaId, activeVideoModal.questionNumber)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-black border border-black text-xs font-semibold rounded-md hover:bg-neutral-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                {downloadingMediaId === activeVideoModal.mediaId ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Download Video
              </button>

              <button
                type="button"
                onClick={() => setActiveVideoModal(null)}
                className="px-4 py-2 bg-black text-white text-xs font-semibold rounded-md hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
