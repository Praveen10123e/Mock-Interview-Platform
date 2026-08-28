import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle2, Lock, Circle, Clock, AlertCircle, ChevronLeft, ChevronRight,
  RotateCcw, Bot, Mic, MicOff, Volume2,
  Shield, XCircle, Loader2
} from 'lucide-react';
import { ReportWorkspace } from '../components/ReportWorkspace';

import api from '../../../api/axios/instance';
import { InterviewService } from '../services/interview.service';
import { Button } from '../../../components/ui/button';
import { Skeleton } from '../../../components/ui/skeleton';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { normalizeInterviewQuestion } from '../../../utils/normalizeQuestion';
import { CodingRound } from '../components/CodingRound';
import { useInterviewFocusGuard } from '../hooks/useInterviewFocusGuard';
import type { FocusViolation } from '../hooks/useInterviewFocusGuard';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../components/ui/dialog';

// ============================================================
// TYPES
// ============================================================

type RoundStatus = 'LOCKED' | 'ACTIVE' | 'COMPLETED';

interface RoundState {
  aptitude: RoundStatus;
  coding: RoundStatus;
  hr: RoundStatus;
  report: RoundStatus;
}

interface AptitudeTelemetry {
  total: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  score: number;
  completed: boolean;
}

interface CodingTelemetry {
  question1Completed: boolean;
  question2Completed: boolean;
  executions: number;
  completed: boolean;
  results: { q1: string | null; q2: string | null };
}

interface HRTelemetry {
  transcript: string;
  followUps: number;
  completed: boolean;
}

interface SessionTelemetry {
  aptitude: AptitudeTelemetry;
  coding: CodingTelemetry;
  hr: HRTelemetry;
}

const initialTelemetry: SessionTelemetry = {
  aptitude: { total: 0, correct: 0, incorrect: 0, unanswered: 0, score: 0, completed: false },
  coding: { question1Completed: false, question2Completed: false, executions: 0, completed: false, results: { q1: null, q2: null } },
  hr: { transcript: '', followUps: 0, completed: false },
};

// ============================================================
// UTILITY
// ============================================================

const formatTime = (seconds: number): string => {
  const s = Math.max(0, Math.floor(Number(seconds) || 0));
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
};

const difficultyClass = (d?: string) => {
  if (d === 'EASY') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  if (d === 'MEDIUM') return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
};

// ============================================================
// HEADER COMPONENT
// ============================================================

const InterviewHeader = ({
  sessionId,
  timeLeft,
  roundState,
  activeRound,
  onLockedClick,
  onFinish,
  isSubmitting,
}: {
  sessionId: string;
  timeLeft: number;
  roundState: RoundState;
  activeRound: 'aptitude' | 'coding' | 'hr' | 'report';
  onLockedClick: () => void;
  onFinish: () => void;
  isSubmitting: boolean;
}) => {
  const rounds = [
    { key: 'aptitude', label: 'Aptitude' },
    { key: 'coding', label: 'Coding' },
    { key: 'hr', label: 'HR Interview' },
    { key: 'report', label: 'Final Report' },
  ] as const;

  const isLow = timeLeft < 300;

  return (
    <header className="h-14 border-b border-white/10 bg-[#0d1117] flex items-center justify-between px-4 sm:px-6 shrink-0 z-20 shadow-sm">
      {/* Left: Branding */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="font-bold text-base text-indigo-400 tracking-tight">NM Sandbox</div>
        <div className="hidden sm:block h-4 w-px bg-white/20" />
        <span className="hidden sm:block text-xs text-gray-500 font-mono">
          {sessionId.startsWith('practice-') ? 'Practice' : `Session: ${sessionId.slice(0, 8)}â€¦`}
        </span>
      </div>

      {/* Center: Round Progress */}
      <div className="flex items-center gap-1 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
        {rounds.map((r, i) => {
          const status = roundState[r.key];
          const isCurrent = r.key === activeRound;
          return (
            <React.Fragment key={r.key}>
              <button
                onClick={status === 'LOCKED' ? onLockedClick : undefined}
                disabled={status === 'LOCKED'}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all
                  ${isCurrent ? 'bg-indigo-600 text-white shadow-sm' : ''}
                  ${status === 'COMPLETED' && !isCurrent ? 'text-emerald-400 hover:bg-white/5 cursor-default' : ''}
                  ${status === 'LOCKED' ? 'text-gray-600 cursor-not-allowed' : ''}
                `}
              >
                {status === 'COMPLETED' && !isCurrent && <CheckCircle2 className="w-3 h-3 shrink-0" />}
                {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse shrink-0" />}
                {status === 'LOCKED' && <Lock className="w-3 h-3 shrink-0" />}
                {status === 'ACTIVE' && !isCurrent && <Circle className="w-3 h-3 shrink-0" />}
                <span className="hidden sm:inline">{r.label}</span>
              </button>
              {i < rounds.length - 1 && (
                <div className={`w-4 h-px ${status === 'COMPLETED' ? 'bg-emerald-500/40' : 'bg-white/10'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Right: Timer + Finish */}
      <div className="flex items-center gap-3 shrink-0">
        <div className={`flex items-center gap-1.5 font-mono text-sm font-semibold px-3 py-1.5 rounded-md border
          ${isLow ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse' : 'bg-white/5 text-gray-300 border-white/10'}`}>
          <Clock className="h-3.5 w-3.5 shrink-0" />
          {formatTime(timeLeft)}
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-8 border-white/10 text-gray-400 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30 text-xs"
          onClick={onFinish}
          disabled={isSubmitting}
        >
          {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Finish Session'}
        </Button>
      </div>
    </header>
  );
};

// ============================================================
// APTITUDE WORKSPACE
// ============================================================

const AptitudeWorkspace = ({
  questions,
  sessionId,
  onComplete,
  telemetry,
  setTelemetry,
}: {
  questions: any[];
  sessionId: string;
  onComplete: (result: AptitudeTelemetry) => void;
  telemetry: AptitudeTelemetry;
  setTelemetry: (t: AptitudeTelemetry) => void;
}) => {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>(() => telemetry.answers || {});
  const total = questions.length;
  const question = questions[index];
  const q = normalizeInterviewQuestion(question);
  const selectedOption = q?.id != null ? answers[q.id] : undefined;

  useEffect(() => {
    if (telemetry.answers && Object.keys(telemetry.answers).length > 0) {
      setAnswers(prev => ({ ...prev, ...telemetry.answers }));
    }
  }, [telemetry.answers]);

  const handleSelect = (optIdx: number) => {
    if (!q?.id) return;
    setAnswers(prev => ({ ...prev, [q.id]: optIdx }));
    if (sessionId) {
      api.post(`/interviews/${sessionId}/aptitude/answer`, {
        questionId: q.id,
        selectedOptionIndex: optIdx,
      }).catch(console.warn);
    }
  };

  const handleSubmit = async () => {
    let correct = 0, incorrect = 0, unanswered = 0;
    questions.forEach(raw => {
      const nq = normalizeInterviewQuestion(raw);
      if (!nq) return;
      const ans = answers[nq.id];
      if (ans === undefined || ans === null) unanswered++;
      else if (ans === nq.correctOptionIndex) correct++;
      else incorrect++;
    });
    const score = Math.round((correct / total) * 100);
    const result: AptitudeTelemetry = { total, correct, incorrect, unanswered, score, completed: true, answers };
    setTelemetry(result);
    onComplete(result);
  };

  if (!q) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
          <p className="text-gray-400">Unable to load question data.</p>
        </div>
      </div>
    );
  }

  if (!q.valid) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-sm">
          <XCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
          <h3 className="font-semibold text-lg mb-1">Question Configuration Error</h3>
          <p className="text-gray-400 text-sm">This question is missing required options. Please contact support.</p>
          <p className="text-gray-600 text-xs mt-2 font-mono">ID: {q.id}</p>
        </div>
      </div>
    );
  }

  const progress = Math.round(((index + 1) / total) * 100);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Progress bar */}
      <div className="h-1 bg-white/5 shrink-0">
        <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex-1 overflow-y-auto p-6 lg:p-8 max-w-3xl mx-auto w-full">
        {/* Question meta */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-1">Aptitude Round</p>
            <h2 className="text-2xl font-bold text-white">Question {index + 1} <span className="text-gray-500 font-normal">of {total}</span></h2>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium px-2 py-1 rounded-full border ${difficultyClass(q.difficulty)}`}>
              {q.difficulty}
            </span>
            {q.topic && (
              <span className="text-xs text-gray-500 border border-white/10 px-2 py-1 rounded-full">
                {typeof q.topic === 'string' ? q.topic : (q.topic?.name || 'General')}
              </span>
            )}
          </div>
        </div>

        {/* Question text */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-100 leading-relaxed mb-3">{q.title}</h3>
          {q.description && q.description !== q.title && (
            <div className="text-gray-400 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: q.description.replace(/\n/g, '<br/>') }} />
          )}
        </div>

        {/* Options */}
        <div className="space-y-3 mb-8">
          {q.options.map((opt: string, i: number) => {
            const isSelected = selectedOption === i;
            return (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200 group
                  ${isSelected
                    ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10'
                    : 'border-white/8 bg-white/3 hover:border-indigo-500/40 hover:bg-indigo-500/5'
                  }`}
              >
                <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-sm font-bold shrink-0 transition-all
                  ${isSelected ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-white/20 text-gray-500 group-hover:border-indigo-500/50'}`}>
                  {String.fromCharCode(65 + i)}
                </div>
                <span className={`text-base flex-1 ${isSelected ? 'text-white' : 'text-gray-300'}`}>{opt}</span>
                {isSelected && <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Answer progress summary */}
        <div className="flex gap-1 mb-8 flex-wrap">
          {questions.map((raw, i) => {
            const nq = normalizeInterviewQuestion(raw);
            const answered = nq?.id != null && answers[nq.id] !== undefined;
            return (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`w-8 h-8 rounded-md text-xs font-bold border transition-all
                  ${i === index ? 'border-indigo-500 bg-indigo-500 text-white' : answered ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' : 'border-white/10 bg-white/5 text-gray-500'}`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer nav */}
      <div className="shrink-0 border-t border-white/8 px-6 py-4 flex items-center justify-between bg-[#0d1117]">
        <Button
          variant="outline"
          onClick={() => setIndex(p => Math.max(0, p - 1))}
          disabled={index === 0}
          className="gap-2 border-white/10 bg-transparent hover:bg-white/5 disabled:opacity-30"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </Button>

        {index < total - 1 ? (
          <Button
            onClick={() => setIndex(p => p + 1)}
            className="gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-8"
          >
            Next <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-8"
          >
            <CheckCircle2 className="w-4 h-4" /> Submit Aptitude
          </Button>
        )}
      </div>
    </div>
  );
};
// ============================================================
// HR WORKSPACE
// ============================================================

const HRWorkspace = ({
  question: rawQuestion,
  sessionId,
  onComplete,
  telemetry,
  setTelemetry,
}: {
  question: any;
  sessionId: string;
  onComplete: (result: HRTelemetry) => void;
  telemetry: HRTelemetry;
  setTelemetry: (t: HRTelemetry) => void;
}) => {
  const question = normalizeInterviewQuestion(rawQuestion);
  const [transcript, setTranscript] = useState('');
  const [history, setHistory] = useState<Array<{ role: 'interviewer' | 'candidate'; content: string }>>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load persisted conversation history
    api.get(`/interviews/${sessionId}/hr/conversation`)
      .then((res) => {
        const conv = res.data?.data?.conversation;
        if (Array.isArray(conv) && conv.length > 0) {
          setHistory(conv.map((c: any) => ({ role: c.role, content: c.content })));
        } else {
          const initial = question?.description || question?.title || 'Please introduce yourself and your technical background.';
          setHistory([{ role: 'interviewer', content: initial }]);
          if ('speechSynthesis' in window) {
            setTimeout(() => speakText(initial), 800);
          }
        }
      })
      .catch(() => {
        const initial = question?.description || question?.title || 'Please introduce yourself and your technical background.';
        setHistory([{ role: 'interviewer', content: initial }]);
      });

    return () => {
      stopSpeaking();
      recognitionRef.current?.stop();
    };
  }, [sessionId, question?.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isThinking]);

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.onstart = () => setIsSpeaking(true);
    msg.onend = () => setIsSpeaking(false);
    msg.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(msg);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) { window.speechSynthesis.cancel(); setIsSpeaking(false); }
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert('Your browser does not support Speech Recognition. Please type your answer.');
        return;
      }
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SR();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onresult = (e: any) => {
        let final = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) final += e.results[i][0].transcript;
        }
        if (final) setTranscript(prev => prev + ' ' + final);
      };
      recognition.onend = () => setIsRecording(false);
      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
    }
  };

  const handleSubmit = async () => {
    if (isRecording) toggleRecording();
    if (!transcript.trim()) return;
    const userText = transcript.trim();
    const newHistory: typeof history = [...history, { role: 'candidate', content: userText }];
    setHistory(newHistory);
    setTranscript('');
    setIsThinking(true);

    try {
      const res = await api.post(`/interviews/${sessionId}/hr/message`, {
        response: userText,
        turnIndex: newHistory.length,
      });
      setIsThinking(false);
      if (res.data?.nextMessage?.content) {
        const nextContent = res.data.nextMessage.content;
        setHistory(prev => [...prev, { role: 'interviewer', content: nextContent }]);
        speakText(nextContent);
      }
    } catch {
      setIsThinking(false);
      const msg = 'Thank you. Your response has been recorded.';
      setHistory(prev => [...prev, { role: 'interviewer', content: msg }]);
    }
  };

  const candidateTurns = history.filter(h => h.role === 'candidate').length;
  const canComplete = candidateTurns >= 1 && !isThinking;
  const evaluationCriteria = question?.evaluationCriteria || [];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden max-w-4xl mx-auto w-full p-4">
      {/* Criteria */}
      {evaluationCriteria.length > 0 && (
        <Card className="p-4 bg-indigo-500/5 border-indigo-500/20 mb-4 shrink-0">
          <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" /> Evaluation Criteria
          </h4>
          <ul className="space-y-1">
            {evaluationCriteria.map((c: string, i: number) => (
              <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
                <span className="text-indigo-400 mt-0.5">â€¢</span> {c}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Chat */}
      <Card className="flex-1 flex flex-col border-white/5 overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-medium">AI Interviewer</span>
          </div>
          <div className="flex items-center gap-2">
            {isSpeaking && <Badge variant="outline" className="text-indigo-400 border-indigo-500/30 bg-indigo-500/10 text-xs animate-pulse gap-1"><Volume2 className="w-3 h-3" />Speaking</Badge>}
            <Button size="sm" variant="outline" onClick={stopSpeaking} disabled={!isSpeaking} className="h-7 text-xs border-white/10">Stop</Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
          {history.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'candidate' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed
                ${msg.role === 'candidate' ? 'bg-indigo-500/20 border border-indigo-500/30 text-indigo-100' : 'bg-white/5 border border-white/8 text-gray-200'}`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isThinking && (
            <div className="flex justify-start">
              <div className="bg-white/5 border border-white/8 p-3 rounded-2xl text-gray-500 text-sm flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Thinkingâ€¦
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="shrink-0 p-4 border-t border-white/5 space-y-3">
          <textarea
            value={transcript}
            onChange={e => setTranscript(e.target.value)}
            disabled={isThinking}
            placeholder="Type or dictate your response hereâ€¦"
            className="w-full p-3 rounded-xl border border-white/10 bg-black/20 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none min-h-[80px] disabled:opacity-50"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">{transcript.length} chars</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className={`gap-1.5 text-xs border-white/10 ${isRecording ? 'border-rose-500/50 text-rose-400 hover:bg-rose-500/10' : ''}`}
                onClick={toggleRecording}
                disabled={isThinking}
              >
                {isRecording ? <><MicOff className="w-3.5 h-3.5" /> Stop Dictation</> : <><Mic className="w-3.5 h-3.5" /> Start Dictation</>}
              </Button>
              <Button size="sm" onClick={handleSubmit} disabled={!transcript.trim() || isThinking} className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white">
                Submit Answer
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Complete HR */}
      {canComplete && (
        <div className="shrink-0 pt-4 flex justify-end">
          <Button
            onClick={() => onComplete({ ...telemetry, completed: true })}
            className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
          >
            <CheckCircle2 className="w-4 h-4" /> Complete HR Round & View Report
          </Button>
        </div>
      )}
    </div>
  );
};

// ============================================================
// REPORT WORKSPACE
// ============================================================

// Internal ReportWorkspace has been extracted to ../components/ReportWorkspace.tsx

// ============================================================
// LOCKED ROUND TOAST
// ============================================================

const LockedToast = ({ visible, onHide }: { visible: boolean; onHide: () => void }) => {
  useEffect(() => { if (visible) { const t = setTimeout(onHide, 2500); return () => clearTimeout(t); } }, [visible]);
  if (!visible) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-rose-900/90 border border-rose-500/30 text-rose-200 px-5 py-3 rounded-xl shadow-xl text-sm flex items-center gap-2 backdrop-blur">
      <Lock className="w-4 h-4 text-rose-400 shrink-0" />
      Complete the current round first to proceed.
    </div>
  );
};

// ============================================================
// FINISH CONFIRM DIALOG
// ============================================================

const FinishDialog = ({ open, roundState, onCancel, onConfirm }: { open: boolean; roundState: RoundState; onCancel: () => void; onConfirm: () => void }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-[#0d1117] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <h3 className="text-lg font-bold mb-1">Finish Interview?</h3>
        <p className="text-gray-400 text-sm mb-4">Your current progress will be saved.</p>
        <div className="space-y-2 mb-6">
          {[
            { label: 'Aptitude', status: roundState.aptitude },
            { label: 'Coding', status: roundState.coding },
            { label: 'HR Interview', status: roundState.hr },
          ].map(r => (
            <div key={r.label} className="flex items-center justify-between text-sm">
              <span className="text-gray-300">{r.label}</span>
              <span className={r.status === 'COMPLETED' ? 'text-emerald-400' : r.status === 'ACTIVE' ? 'text-indigo-400' : 'text-gray-600'}>
                {r.status === 'COMPLETED' ? 'âœ“ Completed' : r.status === 'ACTIVE' ? 'â— In Progress' : 'â—‹ Not Started'}
              </span>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 border-white/10" onClick={onCancel}>Continue Interview</Button>
          <Button className="flex-1 bg-rose-600 hover:bg-rose-500 text-white" onClick={onConfirm}>Finish Session</Button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// MAIN SESSION COMPONENT
// ============================================================

export const InterviewSession = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(3600);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [showLockedToast, setShowLockedToast] = useState(false);

  const { isWarningVisible, acknowledgeWarning } = useInterviewFocusGuard({
    gracePeriodMs: 2000,
    enabled: true, // we could disable it if roundState is report
    onViolation: async (violation: FocusViolation) => {
      try {
        if (!id) return;
        await api.post(`/interviews/${id}/focus-violation`, violation);
      } catch (err) {
        console.error('Failed to log focus violation', err);
      }
    }
  });

  // Round state machine
  const [roundState, setRoundState] = useState<RoundState>({
    aptitude: 'ACTIVE',
    coding: 'LOCKED',
    hr: 'LOCKED',
    report: 'LOCKED',
  });

  const [activeRound, setActiveRound] = useState<'aptitude' | 'coding' | 'hr' | 'report'>('aptitude');

  // Telemetry
  const [telemetry, setTelemetry] = useState<SessionTelemetry>(initialTelemetry);

  // 1. Fetch complete session runtime state (Restores active stage on reload/refresh)
  const { data: sessionStateRes, refetch: refetchState } = useQuery({
    queryKey: ['sessionState', id],
    queryFn: async () => {
      const res = await api.get(`/interviews/${id}/state`);
      return res.data?.data;
    },
    enabled: !!id,
    staleTime: 5000,
  });

  // Restore state when sessionStateRes arrives
  useEffect(() => {
    if (sessionStateRes) {
      if (sessionStateRes.roundState) {
        setRoundState(sessionStateRes.roundState);
      }
      if (sessionStateRes.activeRound) {
        setActiveRound(sessionStateRes.activeRound);
      }
      if (sessionStateRes.reportSnapshot) {
        setSessionReport(sessionStateRes.reportSnapshot);
      }
      if (sessionStateRes.aptitude?.answers) {
        setTelemetry(prev => ({
          ...prev,
          aptitude: {
            ...prev.aptitude,
            ...sessionStateRes.aptitude,
            answers: sessionStateRes.aptitude.answers,
          },
        }));
      }
    }
  }, [sessionStateRes]);

  // 2. Fetch assigned questions
  const { data: sessionQuestionsRes, isLoading, isError, refetch } = useQuery({
    queryKey: ['sessionQuestions', id],
    queryFn: async () => {
      const res = await api.get(`/interviews/${id}/questions`);
      return res.data?.data;
    },
    enabled: !!id,
    staleTime: Infinity,
    retry: 2,
  });

  const aptitudeQuestions: any[] = sessionQuestionsRes?.aptitude || [];
  const codingQuestions: any[] = sessionQuestionsRes?.coding || [];
  const hrQuestion: any = sessionQuestionsRes?.hr?.[0] || null;

  // Timer
  useEffect(() => {
    if (timeLeft <= 0) { handleFinish(); return; }
    const t = setInterval(() => setTimeLeft(p => p - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft]);

  const handleAptitudeComplete = useCallback(async (result: AptitudeTelemetry) => {
    setTelemetry(prev => ({ ...prev, aptitude: result }));
    try {
      if (id) await api.post(`/interviews/${id}/aptitude`, result);
    } catch (err) {
      console.warn('Failed to record aptitude telemetry:', err);
    }
    setRoundState({ aptitude: 'COMPLETED', coding: 'ACTIVE', hr: 'LOCKED', report: 'LOCKED' });
    setActiveRound('coding');
    refetchState();
  }, [id, refetchState]);

  const handleCodingComplete = useCallback(async (result: CodingTelemetry) => {
    setTelemetry(prev => ({ ...prev, coding: result }));
    try {
      if (id) await api.post(`/interviews/${id}/coding/complete`);
    } catch (err) {
      console.warn('Coding stage complete record:', err);
    }
    setRoundState({ aptitude: 'COMPLETED', coding: 'COMPLETED', hr: 'ACTIVE', report: 'LOCKED' });
    setActiveRound('hr');
    refetchState();
  }, [id, refetchState]);

  const [sessionReport, setSessionReport] = useState<any>(null);

  const handleHRComplete = useCallback(async (result: HRTelemetry) => {
    setTelemetry(prev => ({ ...prev, hr: result }));
    try {
      if (id) await api.post(`/interviews/${id}/hr`, result);
      const res = await api.post(`/interviews/${id}/finalize`, {
        telemetry: { ...telemetry, hr: result }
      });
      setSessionReport(res.data);
    } catch (err) {
      console.error('Failed to finalize session:', err);
    }
    setRoundState({ aptitude: 'COMPLETED', coding: 'COMPLETED', hr: 'COMPLETED', report: 'ACTIVE' });
    setActiveRound('report');
    refetchState();
  }, [id, telemetry, refetchState]);


  const handleFinish = async () => {
    setShowFinishDialog(false);
    setIsSubmitting(true);
    try {
      await api.post(`/interviews/${id}/finalize`, { telemetry });
    } catch (err) {
      console.error('Failed to finalize session:', err);
    }
    navigate(`/student/interviews/summary/${id}`);
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-background flex flex-col">
        <div className="h-14 border-b border-white/5 bg-background" />
        <div className="flex-1 p-6 flex gap-4">
          <Skeleton className="w-full max-w-sm h-full rounded-xl bg-white/5" />
          <Skeleton className="flex-1 h-full rounded-xl bg-white/5" />
        </div>
      </div>
    );
  }

  if (isError || (!isLoading && !sessionQuestionsRes)) {
    return (
      <div className="h-screen bg-background flex items-center justify-center flex-col gap-4">
        <div className="text-destructive/70 mb-2">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-sm font-medium">Failed to load interview questions</h2>
        <p className="text-muted-foreground text-sm">Unable to retrieve questions for this session.</p>
        <Button variant="secondary" size="sm" onClick={() => refetch()} className="gap-2 mt-2"><RotateCcw className="w-4 h-4" /> Retry</Button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      <InterviewHeader
        sessionId={id || ''}
        timeLeft={timeLeft}
        roundState={roundState}
        activeRound={activeRound}
        onLockedClick={() => setShowLockedToast(true)}
        onFinish={() => setShowFinishDialog(true)}
        isSubmitting={isSubmitting}
      />

      <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {activeRound === 'aptitude' && aptitudeQuestions.length > 0 && (
          <AptitudeWorkspace
            questions={aptitudeQuestions}
            sessionId={id || ''}
            onComplete={handleAptitudeComplete}
            telemetry={telemetry.aptitude}
            setTelemetry={(t) => setTelemetry(prev => ({ ...prev, aptitude: t }))}
          />
        )}

        {activeRound === 'coding' && codingQuestions.length > 0 && (
          <CodingRound
            questions={codingQuestions}
            sessionId={id || ''}
            timeLeft={timeLeft}
            onComplete={(result) => handleCodingComplete({ ...telemetry.coding, ...result, completed: true })}
          />
        )}

        {activeRound === 'hr' && hrQuestion && (
          <HRWorkspace
            question={hrQuestion}
            sessionId={id || ''}
            onComplete={handleHRComplete}
            telemetry={telemetry.hr}
            setTelemetry={(t) => setTelemetry(prev => ({ ...prev, hr: t }))}
          />
        )}

        {activeRound === 'report' && (
          <ReportWorkspace interviewId={id!} sessionData={sessionReport} />
        )}

        {/* Edge case: active round but no data */}
        {activeRound === 'aptitude' && !isLoading && aptitudeQuestions.length === 0 && (
          <div className="flex-1 flex items-center justify-center flex-col gap-4">
            <div className="text-muted-foreground opacity-50 mb-2">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="text-sm text-muted-foreground">No aptitude questions found for this session.</p>
            <Button variant="secondary" size="sm" onClick={() => refetch()} className="gap-2"><RotateCcw className="w-4 h-4" /> Retry</Button>
          </div>
        )}
      </main>

      <LockedToast visible={showLockedToast} onHide={() => setShowLockedToast(false)} />
      
      <Dialog open={isWarningVisible}>
        <DialogContent className="sm:max-w-md bg-rose-950/90 border-rose-500/50 text-rose-50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-200">
              <Shield className="w-5 h-5" />
              Focus Lost Detected
            </DialogTitle>
            <DialogDescription className="text-rose-200/80">
              You navigated away from the interview tab or lost focus. 
              This event has been recorded in your interview telemetry. Please remain focused on this window.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-start">
            <Button
              type="button"
              className="bg-rose-600 hover:bg-rose-500 text-white w-full"
              onClick={acknowledgeWarning}
            >
              I Understand, Continue Interview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FinishDialog
        open={showFinishDialog}
        roundState={roundState}
        onCancel={() => setShowFinishDialog(false)}
        onConfirm={handleFinish}
      />
    </div>
  );
};
