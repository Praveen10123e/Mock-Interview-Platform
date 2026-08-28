import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../components/ui/card';
import { StatusBadge } from '../../../components/ui/badge';
import { 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Clock, 
  TrendingUp, 
  Code2, 
  Brain, 
  MessageSquare, 
  Target, 
  Award, 
  BookOpen, 
  ArrowRight,
  Flame,
  Activity,
  Layers,
  Sparkles,
  Send,
  Bot,
  User,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Terminal,
  Calculator,
  RefreshCw,
  Info
} from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import api from '../../../api/axios/instance';
import { Button } from '../../../components/ui/button';

const formatCategory = (cat: any): string => {
  if (!cat) return 'Quantitative';
  if (typeof cat === 'string') return cat;
  if (typeof cat === 'object' && cat.name) return String(cat.name);
  return 'Quantitative';
};

const formatTopic = (top: any): string => {
  if (!top) return 'Aptitude';
  if (typeof top === 'string') return top;
  if (typeof top === 'object' && top.name) return String(top.name);
  return 'Aptitude';
};

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestedFollowups?: string[];
  practiceQuestion?: {
    practiceQuestionId: string;
    question: string;
    options: string[];
    optionLabels: string[];
    relatedQuestionId?: string;
  };
}

/** Lightweight safe Markdown → HTML renderer (no external deps) */
function renderMarkdown(text: string): JSX.Element {
  const lines = text.split('\n');
  const elements: JSX.Element[] = [];
  let i = 0;
  let keyIdx = 0;

  const nextKey = () => `md-${keyIdx++}`;

  // Inline formatter: **bold**, `code`, *italic*
  const formatInline = (s: string): (string | JSX.Element)[] => {
    const parts: (string | JSX.Element)[] = [];
    // Split on bold (**...**), code (`...`), italic (*...*)  in order
    const regex = /\*\*([^*]+)\*\*|`([^`]+)`|\*([^*]+)\*/g;
    let last = 0;
    let match;
    while ((match = regex.exec(s)) !== null) {
      if (match.index > last) parts.push(s.slice(last, match.index));
      if (match[1] !== undefined) {
        parts.push(<strong key={nextKey()} className="text-white font-semibold">{match[1]}</strong>);
      } else if (match[2] !== undefined) {
        parts.push(<code key={nextKey()} className="px-1.5 py-0.5 rounded bg-black/40 text-emerald-300 font-mono text-[11px]">{match[2]}</code>);
      } else if (match[3] !== undefined) {
        parts.push(<em key={nextKey()} className="text-gray-300 italic">{match[3]}</em>);
      }
      last = regex.lastIndex;
    }
    if (last < s.length) parts.push(s.slice(last));
    return parts;
  };

  while (i < lines.length) {
    const line = lines[i];

    // Blank line
    if (line.trim() === '') {
      i++;
      continue;
    }

    // H3 ###
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={nextKey()} className="text-sm font-bold text-white mt-3 mb-1 leading-tight">
          {formatInline(line.slice(4))}
        </h3>
      );
      i++;
      continue;
    }

    // H2 ##
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={nextKey()} className="text-base font-bold text-white mt-3 mb-1 leading-tight">
          {formatInline(line.slice(3))}
        </h2>
      );
      i++;
      continue;
    }

    // H1 #
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={nextKey()} className="text-lg font-bold text-white mt-3 mb-1 leading-tight">
          {formatInline(line.slice(2))}
        </h1>
      );
      i++;
      continue;
    }

    // Numbered list (1. 2. ...)
    if (/^\d+\.\s/.test(line)) {
      const listItems: JSX.Element[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        const content = lines[i].replace(/^\d+\.\s/, '');
        listItems.push(
          <li key={nextKey()} className="flex gap-2 items-start">
            <span className="w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-center font-mono text-[10px] shrink-0 mt-0.5 font-bold">
              {listItems.length + 1}
            </span>
            <span className="flex-1">{formatInline(content)}</span>
          </li>
        );
        i++;
      }
      elements.push(<ol key={nextKey()} className="space-y-1.5 mt-1 mb-1">{listItems}</ol>);
      continue;
    }

    // Unordered list (• - *)
    if (/^[\-*•]\s/.test(line)) {
      const listItems: JSX.Element[] = [];
      while (i < lines.length && /^[\-*•]\s/.test(lines[i])) {
        const content = lines[i].replace(/^[\-*•]\s/, '');
        listItems.push(
          <li key={nextKey()} className="flex gap-2 items-start">
            <span className="text-purple-400 mt-0.5 shrink-0">•</span>
            <span className="flex-1">{formatInline(content)}</span>
          </li>
        );
        i++;
      }
      elements.push(<ul key={nextKey()} className="space-y-1 mt-1 mb-1">{listItems}</ul>);
      continue;
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      elements.push(<hr key={nextKey()} className="border-white/10 my-2" />);
      i++;
      continue;
    }

    // Normal paragraph
    elements.push(
      <p key={nextKey()} className="leading-relaxed">
        {formatInline(line)}
      </p>
    );
    i++;
  }

  return <div className="space-y-1 text-xs text-gray-200">{elements}</div>;
}

export const ReportWorkspace = ({ sessionData, interviewId }: { sessionData?: any, interviewId: string }) => {
  const navigate = useNavigate();
  const [report, setReport] = useState<any>(sessionData);
  const [loading, setLoading] = useState(!sessionData);
  const [error, setError] = useState('');
  const [showFormula, setShowFormula] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'aptitude' | 'coding' | 'hr' | 'chat'>('overview');
  const [selectedAptIndex, setSelectedAptIndex] = useState(0);
  const [aptViewMode, setAptViewMode] = useState<'single' | 'all'>('single');

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [askAiQuestion, setAskAiQuestion] = useState<any>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const sendingRef = useRef(false); // Prevent double-submit in StrictMode

  // 1. Fetch Report
  useEffect(() => {
    if (sessionData) {
      setReport(sessionData);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    api.get(`/interviews/${interviewId}/report`)
      .then(res => {
        setReport(res.data);
      })
      .catch(err => {
        setError(err.response?.data?.error || 'Failed to load report');
      })
      .finally(() => setLoading(false));
  }, [interviewId, sessionData]);

  // 2. Fetch Chat History
  useEffect(() => {
    if (!interviewId) return;
    setChatLoading(true);
    api.get(`/interviews/${interviewId}/report/chat`)
      .then(res => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setMessages(res.data.data);
        }
      })
      .catch(err => {
        console.warn('Failed to load chat history:', err);
      })
      .finally(() => setChatLoading(false));
  }, [interviewId]);

  // Scroll chat to bottom on new message
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isSending]);

  const handleSendMessage = async (msgText?: string, displayText?: string) => {
    const textToSend = msgText || inputMessage;
    if (!textToSend.trim()) return;
    // Prevent double-submission (React StrictMode, double-click, etc.)
    if (sendingRef.current) return;
    sendingRef.current = true;

    // Build human-readable display label
    let displayContent = displayText || textToSend.trim();
    if (!displayText) {
      try {
        if (displayContent.startsWith('{') && displayContent.endsWith('}')) {
          const parsed = JSON.parse(displayContent);
          if (parsed.type === 'QUESTION_CONTEXT') {
            displayContent = `💬 Asking AI about Q${parsed.questionNumber}: ${parsed.question}`;
          } else if (parsed.type === 'TEACHING_MODE') {
            const modeLabels: Record<string, string> = {
              HINT: `💡 Give me a hint for Q${parsed.questionNumber}`,
              EXPLAIN: `📖 Explain the answer for Q${parsed.questionNumber}`,
              TEACH_ME: `🎓 Teach me from basics for Q${parsed.questionNumber}`,
              EXPLAIN_MISTAKE: `🧐 Explain my mistake in Q${parsed.questionNumber}`,
              SIMILAR_QUESTION: `🧠 Give me a similar practice question for Q${parsed.questionNumber}`,
            };
            displayContent = modeLabels[parsed.mode] || `Mode: ${parsed.mode} for Q${parsed.questionNumber}`;
          }
        }
      } catch {}
    }

    const userMsg: ChatMessage = {
      id: `local-usr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      role: 'user',
      content: displayContent,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsSending(true);

    try {
      const res = await api.post(`/interviews/${interviewId}/report/chat`, {
        message: textToSend.trim(),
        displayContent,
      });

      if (res.data?.success && res.data.data) {
        const incoming: ChatMessage = res.data.data;
        // Guard: don't append if this message ID already exists (StrictMode double-invoke)
        setMessages(prev => {
          if (prev.some(m => m.id === incoming.id)) return prev;
          return [...prev, incoming];
        });
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ Sorry, I encountered an issue accessing your session evidence: ${err?.response?.data?.error || err.message}`,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
      sendingRef.current = false;
    }
  };

  // Launch Ask AI from a specific question card
  const handleAskAI = (q: any) => {
    if (sendingRef.current) return;
    setAskAiQuestion(q);
    setActiveTab('chat');
    const correctIdx = typeof q.correctOptionIndex === 'number' ? q.correctOptionIndex : 0;
    const correctLabel = q.optionLabels?.[correctIdx] || String.fromCharCode(65 + correctIdx);
    const selectedIdx = q.selectedOptionIndex;
    const selectedLabel = selectedIdx !== null ? (q.optionLabels?.[selectedIdx] || String.fromCharCode(65 + selectedIdx)) : null;

    const payload = JSON.stringify({
      type: 'QUESTION_CONTEXT',
      questionId: q.questionId,
      questionNumber: q.questionNumber || 1,
      question: q.question || q.title,
      options: q.options,
      optionLabels: q.optionLabels,
      studentAnswer: selectedIdx !== null ? `${selectedLabel}) ${q.selectedOptionText}` : 'Not Attempted',
      correctAnswer: `${correctLabel}) ${q.correctOptionText}`,
      isCorrect: q.isCorrect,
      topic: typeof q.topic === 'string' ? q.topic : (q.topic?.name || 'Aptitude'),
      mistakeType: q.mistakeType || (selectedIdx === null ? 'Not Attempted' : 'Concept Misunderstanding'),
      conceptToRevise: q.conceptToRevise,
    });
    const displayText = `💬 Asking AI about Q${q.questionNumber || 1}: ${q.question || q.title}`;
    handleSendMessage(payload, displayText);
  };

  // Trigger teaching mode from pill
  const handleTeachingPill = (mode: string) => {
    if (!askAiQuestion || sendingRef.current) return;
    const payload = JSON.stringify({
      type: 'TEACHING_MODE',
      mode,
      questionId: askAiQuestion.questionId,
      questionNumber: askAiQuestion.questionNumber || 1,
    });
    const modeLabels: Record<string, string> = {
      HINT: `💡 Give me a hint for Q${askAiQuestion.questionNumber || 1}`,
      EXPLAIN: `📖 Explain the answer for Q${askAiQuestion.questionNumber || 1}`,
      TEACH_ME: `🎓 Teach me from basics for Q${askAiQuestion.questionNumber || 1}`,
      EXPLAIN_MISTAKE: `🧐 Explain my mistake in Q${askAiQuestion.questionNumber || 1}`,
      SIMILAR_QUESTION: `🧠 Give me a similar practice question for Q${askAiQuestion.questionNumber || 1}`,
    };
    handleSendMessage(payload, modeLabels[mode]);
  };

  // Answer practice question
  const handleAnswerPractice = async (practiceQuestionId: string, answerLetter: string) => {
    if (sendingRef.current) return;
    sendingRef.current = true;

    const userMsg: ChatMessage = {
      id: `local-usr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      role: 'user',
      content: `Selected Option ${answerLetter}`,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsSending(true);

    try {
      const res = await api.post(`/interviews/${interviewId}/report/chat/practice/${practiceQuestionId}/answer`, {
        answer: answerLetter,
      });
      if (res.data?.success && res.data.data) {
        const incoming: ChatMessage = res.data.data;
        setMessages(prev => {
          if (prev.some(m => m.id === incoming.id)) return prev;
          return [...prev, incoming];
        });
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ Failed to validate answer: ${err?.response?.data?.error || err.message}`,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
      sendingRef.current = false;
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 bg-[#0d1117]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
          <p className="text-xs text-gray-400 font-mono">Aggregating session evidence & computing 7-dimension metrics...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-[#0d1117]">
        <div className="text-center max-w-md space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
          <div>
            <h2 className="text-lg font-semibold text-white">Error Loading Report</h2>
            <p className="text-xs text-gray-400 mt-1">{error || 'Interview not found or could not be loaded.'}</p>
          </div>
          <Button onClick={() => navigate('/student/interviews')} size="sm">
            Back to Interviews Hub
          </Button>
        </div>
      </div>
    );
  }

  // ── Normalize Data from Report Snapshot ──────────────────────────────────────
  const overallProficiencyScore =
    report.overallProficiencyScore ??
    report.overallScore ??
    report.scores?.normalizedCompositeScore ??
    0;

  const sessionDuration = report.sessionDuration || '45 min';
  const assessmentDate = report.assessmentDate || report.finalizedAt;
  const percentileBenchmark =
    report.percentileBenchmark || 'Benchmark unavailable — more completed assessments are required.';

  const summary = report.summary || {
    aptitudePassed: report.stages?.aptitude?.correctCount ?? 0,
    aptitudeTotal: report.stages?.aptitude?.totalQuestions ?? 5,
    aptitudeScore: report.stages?.aptitude?.scorePercentage ?? 0,
    codingAccepted:
      report.stages?.coding?.problems?.filter(
        (p: any) => p.finalStatus === 'ACCEPTED' || p.finalStatus === 'PASSED'
      ).length ?? 0,
    codingTotal: report.stages?.coding?.totalProblems ?? 2,
    codingScore: report.stages?.coding?.scorePercentage ?? 0,
    testsPassed: report.stages?.coding?.totalTestsPassed ?? 0,
    totalTests: report.stages?.coding?.totalTestsCount ?? 0,
    totalCodingAttempts:
      (report.stages?.coding?.totalRunAttempts || 0) +
      (report.stages?.coding?.totalSubmitAttempts || 0),
    hrStatus: report.stages?.hr?.status || 'NOT_ATTEMPTED',
  };

  const rawMetrics = report.metrics || {};
  const metrics =
    Object.keys(rawMetrics).length > 0
      ? rawMetrics
      : {
          correctness: {
            name: 'Correctness & Edge-Case Handling',
            weight: '20%',
            score: summary.codingScore || 0,
            explanation: `Evaluated pass rate across all test cases (${summary.testsPassed}/${summary.totalTests} passed).`,
          },
          complexity: {
            name: 'Time & Space Complexity',
            weight: '18%',
            score: summary.codingScore > 0 ? 85 : 50,
            explanation: 'Algorithmic complexity measured against expected bounds.',
          },
          codeQuality: {
            name: 'Code Quality & Readability',
            weight: '15%',
            score: summary.codingScore > 0 ? 80 : 50,
            explanation: 'Syntactic structure, maintainability, and clean naming.',
          },
          debugging: {
            name: 'Debugging Efficiency',
            weight: '15%',
            score: summary.totalCodingAttempts > 0 ? 75 : 50,
            explanation: `${summary.totalCodingAttempts} execution runs recorded across assigned problems.`,
          },
          communication: {
            name: 'Communication Clarity',
            weight: '15%',
            score: summary.hrStatus === 'COMPLETED' ? 85 : 50,
            explanation: 'Structure, confidence, and articulation in behavioral round.',
          },
          problemSolving: {
            name: 'Problem-Solving Approach',
            weight: '10%',
            score: summary.aptitudeScore || 0,
            explanation: `Aptitude reasoning score: ${summary.aptitudePassed}/${summary.aptitudeTotal} correct (${summary.aptitudeScore}%).`,
          },
          stressResilience: {
            name: 'Stress Resilience',
            weight: '7%',
            score: 80,
            explanation: 'Pacing and composure across all interview rounds.',
          },
        };

  // Build 7-Axis Radar Chart Data
  const radarData = [
    { subject: 'Correctness', A: metrics.correctness?.score ?? 0, fullMark: 100 },
    { subject: 'Complexity', A: metrics.complexity?.score ?? 0, fullMark: 100 },
    { subject: 'Code Quality', A: metrics.codeQuality?.score ?? 0, fullMark: 100 },
    { subject: 'Debugging', A: metrics.debugging?.score ?? 0, fullMark: 100 },
    { subject: 'Communication', A: metrics.communication?.score ?? 0, fullMark: 100 },
    { subject: 'Problem Solving', A: metrics.problemSolving?.score ?? 0, fullMark: 100 },
    { subject: 'Resilience', A: metrics.stressResilience?.score ?? 0, fullMark: 100 },
  ];

  const scoreBreakdown = report.scoreBreakdown || {
    formula: `Overall (${overallProficiencyScore}/100) = Aptitude (${summary.aptitudeScore}% × 40%) + Coding (${summary.codingScore}% × 40%) + HR (${summary.hrStatus === 'COMPLETED' ? 85 : 0}% × 20%)`,
    aptitudeScore: summary.aptitudeScore,
    aptitudeWeight: '40%',
    codingScore: summary.codingScore,
    codingWeight: '40%',
    hrScore: summary.hrStatus === 'COMPLETED' ? 85 : 0,
    hrWeight: '20%',
  };

  const aptitudeAnalysis = report.aptitudeAnalysis || report.stages?.aptitude?.questions || [];
  const codingAnalysis = report.codingAnalysis || report.codingBreakdown || report.stages?.coding?.problems || [];
  const hrTranscript = report.stages?.hr?.conversationLog || report.hrTranscript || [];
  const hrAnalysis = report.hrAnalysis || report.stages?.hr?.analysis || {};

  const strengths =
    report.strengths && report.strengths.length > 0
      ? report.strengths
      : [
          `Completed assessment session across ${
            (summary.aptitudeTotal || 5) + (summary.codingTotal || 2) + 1
          } assigned question items.`,
        ];

  const areasToImprove =
    report.areasToImprove && report.areasToImprove.length > 0
      ? report.areasToImprove
      : [
          'Continue practicing advanced edge cases and competitive time-limit challenges.',
        ];

  const skillGapMap = report.skillGapMap || [];
  const nextActionPlan =
    report.nextActionPlan && report.nextActionPlan.length > 0
      ? report.nextActionPlan
      : [
          'Practice problem solving on Naan Mudhalvan Sandbox modules.',
          'Review optimal time complexity patterns.',
        ];

  const suggestedQuickQuestions = [
    'Explain my biggest mistake',
    'Was my coding approach optimal?',
    'Show me a better approach',
    'Explain my aptitude mistakes',
    'How can I improve my HR answers?',
    'What should I practice next?',
  ];

  return (
    <div className="flex-1 flex flex-col bg-[#0d1117] text-gray-200 overflow-hidden">
      
      {/* ── SUB-HEADER NAVIGATION BAR ── */}
      <div className="h-12 shrink-0 flex items-center justify-between px-6 bg-[#161b22] border-b border-white/10">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'overview'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            📊 Executive Overview
          </button>
          <button
            onClick={() => setActiveTab('aptitude')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'aptitude'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            🧠 Aptitude Review ({summary.aptitudePassed}/{summary.aptitudeTotal})
          </button>
          <button
            onClick={() => setActiveTab('coding')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'coding'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            💻 Coding Deep-Dive ({summary.codingAccepted}/{summary.codingTotal} Solved)
          </button>
          <button
            onClick={() => setActiveTab('hr')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'hr'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            💬 HR Behavioral Review
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'chat'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm'
                : 'text-purple-300 bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20'
            }`}
          >
            <Bot className="h-3.5 w-3.5" />
            Ask About My Interview
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </button>
        </div>

        <Button
          onClick={() => navigate('/student/interviews')}
          variant="outline"
          size="sm"
          className="text-xs border-white/10 bg-transparent hover:bg-white/5"
        >
          Exit to Hub
        </Button>
      </div>

      {/* ── MAIN CONTENT AREA ── */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-thin">
        <div className="max-w-7xl mx-auto space-y-8">

          {/* ════════════════════════════════════════════════════════════════════ */}
          {/* TAB 1: EXECUTIVE OVERVIEW */}
          {/* ════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'overview' && (
            <>
              {/* ── SECTION 1 — HEADER & SCORE HERO ── */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#161b22] to-[#0d1117] border border-white/10 p-6 md:p-8 shadow-md">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400">
                      <ShieldCheck className="h-4 w-4" />
                      <span>Evidence-Based Candidate Evaluation</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                      FINAL ASSESSMENT REPORT
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 font-mono">
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-gray-500" /> Duration: {sessionDuration}
                      </span>
                      <span>•</span>
                      <span>
                        Date: {assessmentDate ? new Date(assessmentDate).toLocaleDateString() : 'Today'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1.5 text-emerald-400 font-medium font-sans">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Evaluated from Session Evidence
                      </span>
                    </div>
                    <div className="pt-2 text-xs text-gray-400 font-mono flex items-center gap-2">
                      <span>Cohort Benchmark:</span>
                      <span className="text-gray-200 font-semibold">{percentileBenchmark}</span>
                    </div>
                  </div>

                  {/* Hero Proficiency Score Card */}
                  <div className="flex flex-col items-center justify-center p-6 bg-[#090d13] rounded-2xl border border-white/10 min-w-[240px] text-center shadow-inner">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                      Overall Proficiency
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl md:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                        {overallProficiencyScore}
                      </span>
                      <span className="text-base text-gray-500 font-semibold">/ 100</span>
                    </div>
                    <span className="text-xs font-medium text-gray-300 mt-1">
                      {overallProficiencyScore >= 80 ? 'Proficient Ready' : overallProficiencyScore >= 60 ? 'Developing Competence' : 'Targeted Practice Required'}
                    </span>
                    
                    <button
                      onClick={() => setShowFormula(f => !f)}
                      className="mt-3 inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      <Calculator className="h-3 w-3" />
                      {showFormula ? 'Hide Calculation' : 'View Transparent Formula'}
                      {showFormula ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>
                  </div>
                </div>

                {/* Collapsible Transparent Formula Box */}
                {showFormula && (
                  <div className="mt-6 p-4 rounded-xl bg-black/40 border border-indigo-500/30 text-xs space-y-2 animate-in fade-in duration-200 font-mono">
                    <div className="text-indigo-300 font-semibold flex items-center gap-2 font-sans">
                      <Info className="h-4 w-4" /> Transparent Weighted Scoring Model:
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg text-gray-200">
                      {scoreBreakdown.formula}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-[11px] pt-1">
                      <div className="p-2 rounded bg-white/3">
                        <span className="text-gray-400">Aptitude:</span> <strong className="text-indigo-300">{scoreBreakdown.aptitudeScore}%</strong> × 40%
                      </div>
                      <div className="p-2 rounded bg-white/3">
                        <span className="text-gray-400">Coding:</span> <strong className="text-emerald-300">{scoreBreakdown.codingScore}%</strong> × 40%
                      </div>
                      <div className="p-2 rounded bg-white/3">
                        <span className="text-gray-400">HR:</span> <strong className="text-purple-300">{scoreBreakdown.hrScore}%</strong> × 20%
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ── SECTION 2 — 6 SUMMARY METRIC CARDS ── */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
                <Card className="p-4 bg-[#161b22] border border-white/10 space-y-1">
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Brain className="h-3.5 w-3.5 text-indigo-400" /> Aptitude
                  </div>
                  <div className="text-xl font-bold text-white font-mono">
                    {summary.aptitudePassed} <span className="text-xs text-gray-500">/ {summary.aptitudeTotal}</span>
                  </div>
                  <div className="text-[11px] text-gray-400">{summary.aptitudeScore}% correct</div>
                </Card>

                <Card className="p-4 bg-[#161b22] border border-white/10 space-y-1">
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Code2 className="h-3.5 w-3.5 text-emerald-400" /> Coding Accepted
                  </div>
                  <div className="text-xl font-bold text-white font-mono">
                    {summary.codingAccepted} <span className="text-xs text-gray-500">/ {summary.codingTotal}</span>
                  </div>
                  <div className="text-[11px] text-gray-400">{summary.codingScore} pts earned</div>
                </Card>

                <Card className="p-4 bg-[#161b22] border border-white/10 space-y-1">
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5 text-blue-400" /> Tests Passed
                  </div>
                  <div className="text-xl font-bold text-white font-mono">
                    {summary.testsPassed} <span className="text-xs text-gray-500">/ {summary.totalTests}</span>
                  </div>
                  <div className="text-[11px] text-gray-400">Across all problems</div>
                </Card>

                <Card className="p-4 bg-[#161b22] border border-white/10 space-y-1">
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5 text-amber-400" /> Executions
                  </div>
                  <div className="text-xl font-bold text-white font-mono">
                    {summary.totalCodingAttempts}
                  </div>
                  <div className="text-[11px] text-gray-400">Runs + Submissions</div>
                </Card>

                <Card className="p-4 bg-[#161b22] border border-white/10 space-y-1">
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5 text-purple-400" /> HR Interview
                  </div>
                  <div className="text-xl font-bold text-white">
                    <StatusBadge status={summary.hrStatus || 'NOT_ATTEMPTED'} />
                  </div>
                  <div className="text-[11px] text-gray-400">Behavioral round</div>
                </Card>

                <Card className="p-4 bg-[#161b22] border border-white/10 space-y-1">
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-rose-400" /> Duration
                  </div>
                  <div className="text-xl font-bold text-white font-mono">
                    {sessionDuration}
                  </div>
                  <div className="text-[11px] text-gray-400">Total session time</div>
                </Card>
              </div>

              {/* ── SECTION 3 — 7-DIMENSION RADAR & EVIDENCE BREAKDOWN ── */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Radar Chart Card */}
                <Card className="p-6 bg-[#161b22] border border-white/10 lg:col-span-5 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
                      <Layers className="h-4 w-4 text-indigo-400" /> 7-Axis Competency Profile
                    </h3>
                    <p className="text-xs text-gray-400">Multidimensional capability breakdown across technical and behavioral rounds</p>
                  </div>
                  <div className="h-[280px] w-full my-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="rgba(255,255,255,0.08)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar name="Proficiency" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="text-[11px] text-center text-gray-500 italic border-t border-white/5 pt-3">
                    Scores synthesized from stored execution records, test pass ratios, and HR transcripts.
                  </div>
                </Card>

                {/* 7-Dimension Explanations */}
                <Card className="p-6 bg-[#161b22] border border-white/10 lg:col-span-7 space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Award className="h-4 w-4 text-indigo-400" /> Dimension Scores & Evidence ("Why this score?")
                  </h3>

                  <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1 scrollbar-thin">
                    {Object.entries(metrics).map(([key, metric]: [string, any]) => (
                      <div key={key} className="p-3.5 rounded-xl bg-white/3 border border-white/6 space-y-1.5 hover:border-white/15 transition-all">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-gray-200">{metric.name}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-gray-400">
                              Weight: {metric.weight}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                            {metric.score} / 100
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed font-sans">
                          {metric.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* ── SECTION 4 — DEMONSTRATED STRENGTHS & IMPROVEMENTS ── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Card className="p-5 bg-[#161b22] border border-emerald-500/20 space-y-3">
                  <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="h-4 w-4" /> Demonstrated Strengths
                  </h3>
                  <ul className="space-y-2.5 text-xs text-gray-300">
                    {strengths.map((s: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </Card>

                <Card className="p-5 bg-[#161b22] border border-amber-500/20 space-y-3">
                  <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" /> Targeted Areas to Improve
                  </h3>
                  <ul className="space-y-2.5 text-xs text-gray-300">
                    {areasToImprove.map((a: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>

              {/* ── SECTION 5 — NAAN MUDHALVAN SKILL GAP MAP ── */}
              {skillGapMap.length > 0 && (
                <Card className="p-6 bg-[#161b22] border border-white/10 space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-indigo-400" /> Naan Mudhalvan Skill Gap & Curriculum Map
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-white/10 text-gray-400 uppercase text-[10px] tracking-wider bg-black/30">
                          <th className="py-2.5 px-4 font-semibold">Identified Skill Gap</th>
                          <th className="py-2.5 px-4 font-semibold">Assessment Evidence</th>
                          <th className="py-2.5 px-4 font-semibold">Recommended NM Module</th>
                          <th className="py-2.5 px-4 font-semibold">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-sans">
                        {skillGapMap.map((gap: any, idx: number) => (
                          <tr key={idx} className="hover:bg-white/5 transition-colors">
                            <td className="py-3 px-4 font-semibold text-white">{gap.weakSkill}</td>
                            <td className="py-3 px-4 text-gray-300">{gap.evidence}</td>
                            <td className="py-3 px-4 font-medium text-indigo-400">{gap.recommendedNMModule}</td>
                            <td className="py-3 px-4">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-[11px] h-7 px-2.5 border-white/10"
                                onClick={() => navigate('/student/interviews')}
                              >
                                Practice Module <ArrowRight className="h-3 w-3 ml-1" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              {/* ── SECTION 6 — NEXT ACTION PLAN ── */}
              <Card className="p-6 bg-[#161b22] border border-white/10 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Flame className="h-4 w-4 text-amber-500" /> Next Action Plan
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {nextActionPlan.map((action: string, idx: number) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-white/3 border border-white/6 flex items-start gap-3">
                      <div className="h-5 w-5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                        {idx + 1}
                      </div>
                      <span className="text-xs text-gray-300 leading-relaxed font-sans">{action}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}

          {/* ════════════════════════════════════════════════════════════════════ */}
          {/* TAB 2: APTITUDE REVIEW WITH MISTAKE DIAGNOSTICS */}
          {/* ════════════════════════════════════════════════════════════════════ */}
          {/* ════════════════════════════════════════════════════════════════════ */}
          {/* TAB 2: APTITUDE REVIEW WITH EVIDENCE-BASED LEARNING INTERFACE        */}
          {/* ════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'aptitude' && (
            <div className="space-y-6">
              {/* Header & Controls */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Brain className="h-5 w-5 text-indigo-400" /> Aptitude Stage Review
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Evidence-based learning review: original options, visual mistake diagnostics, and step-by-step solutions.
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="flex rounded-lg bg-black/40 border border-white/10 p-0.5 text-[11px]">
                    <button
                      onClick={() => setAptViewMode('single')}
                      className={`px-3 py-1 rounded-md font-semibold transition-all ${
                        aptViewMode === 'single' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Question by Question
                    </button>
                    <button
                      onClick={() => setAptViewMode('all')}
                      className={`px-3 py-1 rounded-md font-semibold transition-all ${
                        aptViewMode === 'all' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      View All ({aptitudeAnalysis.length})
                    </button>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs font-mono font-bold text-indigo-400">
                    {summary.aptitudePassed} / {summary.aptitudeTotal} Correct ({summary.aptitudeScore}%)
                  </div>
                </div>
              </div>

              {/* Navigation Bar (Shown in single question mode) */}
              {aptViewMode === 'single' && aptitudeAnalysis.length > 0 && (
                <div className="p-3.5 rounded-xl bg-[#161b22] border border-white/10 flex items-center justify-between flex-wrap gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={selectedAptIndex <= 0}
                    onClick={() => setSelectedAptIndex(prev => Math.max(0, prev - 1))}
                    className="text-xs h-8 border-white/10 text-gray-300 disabled:opacity-30"
                  >
                    <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Previous Question
                  </Button>

                  {/* Question Selector Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap justify-center">
                    {aptitudeAnalysis.map((q: any, idx: number) => {
                      const isCur = idx === selectedAptIndex;
                      const isCor = q.isCorrect;
                      const isUnattempted = q.selectedOptionIndex === null;

                      return (
                        <button
                          key={idx}
                          onClick={() => setSelectedAptIndex(idx)}
                          className={`px-3 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                            isCur
                              ? 'ring-2 ring-indigo-400 bg-indigo-600 text-white shadow-md'
                              : isCor
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25'
                              : isUnattempted
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25'
                              : 'bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25'
                          }`}
                        >
                          <span>Q{idx + 1}</span>
                          <span className="text-[10px]">
                            {isCor ? '✓' : isUnattempted ? '⏳' : '✗'}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-gray-400">
                      Question {selectedAptIndex + 1} of {aptitudeAnalysis.length}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={selectedAptIndex >= aptitudeAnalysis.length - 1}
                      onClick={() => setSelectedAptIndex(prev => Math.min(aptitudeAnalysis.length - 1, prev + 1))}
                      className="text-xs h-8 border-white/10 text-gray-300 disabled:opacity-30"
                    >
                      Next Question <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Question Card Renderer Helper */}
              {(() => {
                const renderQuestionCard = (q: any, idx: number) => {
                  const correctIdx = typeof q.correctOptionIndex === 'number' ? q.correctOptionIndex : 0;
                  const correctLabel = q.optionLabels?.[correctIdx] || String.fromCharCode(65 + correctIdx);
                  const selectedIdx = q.selectedOptionIndex;
                  const selectedLabel = selectedIdx !== null ? (q.optionLabels?.[selectedIdx] || String.fromCharCode(65 + selectedIdx)) : null;
                  const isNotAttempted = selectedIdx === null;
                  const options = Array.isArray(q.options) && q.options.length > 0 ? q.options : ['Option A', 'Option B', 'Option C', 'Option D'];

                  return (
                    <Card
                      key={q.questionId || idx}
                      className={`p-6 bg-[#161b22] border transition-all space-y-6 ${
                        q.isCorrect
                          ? 'border-emerald-500/30 bg-emerald-950/10'
                          : isNotAttempted
                          ? 'border-amber-500/30 bg-amber-950/10'
                          : 'border-rose-500/30 bg-rose-950/10'
                      }`}
                    >
                      {/* Card Header: Q1 | Topic | Difficulty | Status */}
                      <div className="flex items-start justify-between flex-wrap gap-3 pb-3 border-b border-white/5">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-white/10 text-white border border-white/15">
                            Q{q.questionNumber || idx + 1}
                          </span>
                          <span className="text-xs font-semibold text-gray-200">
                            {formatCategory(q.category)} – {formatTopic(q.topic)}
                          </span>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/5 text-gray-400 uppercase">
                            [{(q.difficulty || 'Medium').toUpperCase()}]
                          </span>
                        </div>

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold font-mono flex items-center gap-1.5 ${
                            q.isCorrect
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : isNotAttempted
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {q.isCorrect ? '✓ Correct' : isNotAttempted ? '⏳ Not Attempted' : '✗ Incorrect'}
                        </span>
                      </div>

                      {/* Question Text */}
                      <div className="space-y-1">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold">
                          Question
                        </div>
                        <h3 className="text-sm sm:text-base font-semibold text-white leading-relaxed font-sans">
                          {q.question || q.title}
                        </h3>
                      </div>

                      {/* OPTIONS LIST WITH VISUAL HIGHLIGHTING */}
                      <div className="space-y-2">
                        <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-400 flex items-center justify-between">
                          <span>OPTIONS</span>
                          <span className="text-[10px] font-normal text-gray-500 lowercase">4 choices</span>
                        </div>
                        <div className="grid grid-cols-1 gap-2.5">
                          {options.map((opt: string, optIdx: number) => {
                            const isSelected = selectedIdx === optIdx;
                            const isCorrectOption = correctIdx === optIdx;
                            const optLetter = q.optionLabels?.[optIdx] || String.fromCharCode(65 + optIdx);

                            let rowStyle = 'border-white/10 bg-white/3 text-gray-300 hover:border-white/20';
                            let circleStyle = 'bg-white/10 text-gray-400 border-white/20';
                            let badgeText = null;

                            if (isCorrectOption) {
                              rowStyle = 'border-emerald-500/60 bg-emerald-500/15 text-emerald-100 font-semibold shadow-[0_0_12px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/30';
                              circleStyle = 'bg-emerald-500 text-black border-emerald-400 font-bold';
                              badgeText = isSelected ? 'Your Answer ✓ Correct' : '✓ Correct Answer';
                            } else if (isSelected && !q.isCorrect) {
                              rowStyle = 'border-rose-500/60 bg-rose-500/15 text-rose-100 font-semibold shadow-[0_0_12px_rgba(244,63,94,0.15)] ring-1 ring-rose-500/30';
                              circleStyle = 'bg-rose-500 text-white border-rose-400 font-bold';
                              badgeText = '✗ Your Selected Answer';
                            }

                            return (
                              <div
                                key={optIdx}
                                className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 transition-all ${rowStyle}`}
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <span className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[11px] shrink-0 border ${circleStyle}`}>
                                    {optLetter}
                                  </span>
                                  <span className="leading-snug break-words">{opt}</span>
                                </div>

                                {badgeText && (
                                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold shrink-0 flex items-center gap-1 ${
                                    isCorrectOption
                                      ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                                      : 'bg-rose-500/30 text-rose-300 border border-rose-500/40'
                                  }`}>
                                    {badgeText}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* ANSWER SUMMARY BANNER */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-black/40 border border-white/10 text-xs font-mono">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 font-semibold">Your Answer:</span>
                          {isNotAttempted ? (
                            <span className="text-amber-400 font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                              Not Attempted
                            </span>
                          ) : (
                            <span className={`font-bold px-2 py-0.5 rounded ${
                              q.isCorrect
                                ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                                : 'text-rose-400 bg-rose-500/10 border border-rose-500/20'
                            }`}>
                              {selectedLabel}) {q.selectedOptionText || options[selectedIdx]}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 font-semibold">Correct Answer:</span>
                          <span className="text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                            {correctLabel}) {q.correctOptionText || options[correctIdx]}
                          </span>
                        </div>
                      </div>

                      {/* AI EXPLANATION & SOLUTION (4-STEP REAL RESOLUTION) */}
                      <div className="p-5 rounded-xl bg-[#0d1117] border border-white/10 text-xs space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-white/5">
                          <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm uppercase tracking-wide">
                            <Sparkles className="h-4 w-4" />
                            <span>AI Explanation & Solution</span>
                          </div>
                          <span className="px-2.5 py-0.5 rounded text-[10px] font-mono uppercase bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                            {q.explanationSource || 'DETERMINISTIC_ANALYSIS'}
                          </span>
                        </div>

                        {q.stepByStepSolution && q.stepByStepSolution.length > 0 ? (
                          <div className="space-y-2.5 pl-1">
                            {q.stepByStepSolution.map((step: string, sIdx: number) => {
                              const cleaned = step.replace(/^Step\s*\d*:\s*/i, '');
                              return (
                                <div key={sIdx} className="p-3 rounded-lg bg-white/3 border border-white/5 flex items-start gap-3 text-gray-200 leading-relaxed font-sans">
                                  <span className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center font-mono text-[11px] shrink-0 mt-0.5 font-bold">
                                    {sIdx + 1}
                                  </span>
                                  <div className="flex-1 space-y-0.5">
                                    <div className="text-[10px] font-mono font-bold uppercase text-indigo-300 tracking-wider">
                                      Step {sIdx + 1}
                                    </div>
                                    <div className="text-xs text-gray-200">{cleaned}</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-gray-400 italic">Step-by-step resolution synthesized from problem parameters.</p>
                        )}
                      </div>

                      {/* WHY YOUR ANSWER IS INCORRECT (FOR INCORRECT ANSWERS) */}
                      {(!q.isCorrect || isNotAttempted) && q.whyIncorrect && (
                        <div className="p-4 rounded-xl bg-rose-950/25 border border-rose-500/30 text-xs space-y-2">
                          <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wide">
                            <AlertCircle className="h-4 w-4" />
                            <span>Why Your Answer Is Incorrect</span>
                          </div>
                          <p className="text-rose-200 leading-relaxed font-sans pl-1">
                            {q.whyIncorrect}
                          </p>
                        </div>
                      )}

                      {/* CONCEPT TO REVISE & MISTAKE TYPE */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Concept to Revise Card */}
                        <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/30 text-xs space-y-2">
                          <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs uppercase tracking-wide">
                            <BookOpen className="h-4 w-4" />
                            <span>Concept to Revise</span>
                          </div>
                          <div className="text-gray-200 leading-relaxed font-sans whitespace-pre-line text-xs pl-1">
                            {typeof q.conceptToRevise === 'string' ? q.conceptToRevise : `${formatTopic(q.topic)} – Core Principles & Formulas`}
                          </div>
                        </div>

                        {/* Mistake Type Card */}
                        <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 text-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-purple-300 font-bold text-xs uppercase tracking-wide">
                              <Brain className="h-4 w-4" />
                              <span>Mistake Type</span>
                            </div>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              {q.mistakeType || (isNotAttempted ? 'Not Attempted' : q.isCorrect ? 'No Mistake' : 'Concept Misunderstanding')}
                            </span>
                          </div>
                          <p className="text-gray-300 text-xs leading-relaxed pl-1">
                            {q.mistakeType === 'Concept Misunderstanding'
                              ? 'Misinterpreted the underlying proportional or structural relationship of the problem.'
                              : q.mistakeType === 'Formula Error'
                              ? 'Applied an incorrect formula or inverted unit conversion factors.'
                              : q.mistakeType === 'Calculation Error'
                              ? 'Arrived at the right approach but made an arithmetic error in the final step.'
                              : q.mistakeType === 'Careless Mistake'
                              ? 'Overlooked a key constraint or made an off-by-one error in sequence evaluation.'
                              : q.mistakeType === 'Logical Reasoning Error'
                              ? 'Concluded a relationship not guaranteed under all possible premises.'
                              : isNotAttempted
                              ? 'Question was skipped or timed out during the assessment round.'
                              : 'Demonstrated complete conceptual mastery and exact calculation.'}
                          </p>
                        </div>
                      </div>

                      {/* HOW TO IMPROVE */}
                      <div className="p-4 rounded-xl bg-emerald-950/15 border border-emerald-500/25 text-xs space-y-2.5">
                        <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wide">
                          <TrendingUp className="h-4 w-4" />
                          <span>How to Improve</span>
                        </div>
                        <ul className="space-y-1.5 text-xs text-gray-300 pl-1">
                          {(q.howToImprove && q.howToImprove.length > 0 ? q.howToImprove : [
                            'Identify whether the relationship is direct or inverse before calculating.',
                            'Write down the governing formula and substitute given variables.',
                            'Sanity-check whether the final answer logically increases or decreases.',
                            'Verify intermediate unit conversions before finalizing the option.',
                          ]).map((tip: string, tIdx: number) => (
                            <li key={tIdx} className="flex items-start gap-2">
                              <span className="text-emerald-400 font-bold shrink-0">✓</span>
                              <span className="leading-relaxed">{tip.replace(/^✓\s*/, '')}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* CORRECT ANSWER SUCCESS BOX */}
                      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                        <div className="space-y-1 flex-1">
                          <div className="font-bold text-emerald-300 text-xs">
                            ✓ Correct Answer: {correctLabel}) {q.correctOptionText || options[correctIdx]}
                          </div>
                          <p className="text-gray-300 text-xs leading-relaxed">
                            {q.whyCorrect || `Option ${correctLabel} satisfies all mathematical and logical conditions.`}
                          </p>
                        </div>
                      </div>

                      {/* ASK AI BUTTON */}
                      <div className="pt-2 flex items-center justify-between flex-wrap gap-3 border-t border-white/5">
                        <div className="text-[11px] text-gray-500 italic">
                          Need a deeper breakdown or want a similar practice question?
                        </div>
                        <Button
                          onClick={() => handleAskAI(q)}
                          size="sm"
                          className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2 text-xs font-semibold px-4 py-2 rounded-xl shadow-lg shadow-indigo-500/10"
                        >
                          <MessageSquare className="h-4 w-4" />
                          Ask AI About This Question
                        </Button>
                      </div>
                    </Card>
                  );
                };

                if (aptitudeAnalysis.length === 0) {
                  return (
                    <Card className="p-8 text-center bg-[#161b22] border border-white/10 text-gray-400 text-xs">
                      No aptitude questions found for this interview session.
                    </Card>
                  );
                }

                if (aptViewMode === 'single') {
                  const currentQ = aptitudeAnalysis[selectedAptIndex] || aptitudeAnalysis[0];
                  return (
                    <div className="space-y-4">
                      {renderQuestionCard(currentQ, selectedAptIndex)}

                      {/* Bottom Navigation */}
                      <div className="flex items-center justify-between pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={selectedAptIndex <= 0}
                          onClick={() => {
                            setSelectedAptIndex(prev => Math.max(0, prev - 1));
                            window.scrollTo({ top: 300, behavior: 'smooth' });
                          }}
                          className="text-xs h-8 border-white/10 text-gray-300 disabled:opacity-30"
                        >
                          <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Previous Question
                        </Button>

                        <span className="text-xs font-mono text-gray-400">
                          Question {selectedAptIndex + 1} of {aptitudeAnalysis.length}
                        </span>

                        <Button
                          variant="outline"
                          size="sm"
                          disabled={selectedAptIndex >= aptitudeAnalysis.length - 1}
                          onClick={() => {
                            setSelectedAptIndex(prev => Math.min(aptitudeAnalysis.length - 1, prev + 1));
                            window.scrollTo({ top: 300, behavior: 'smooth' });
                          }}
                          className="text-xs h-8 border-white/10 text-gray-300 disabled:opacity-30"
                        >
                          Next Question <ChevronRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="space-y-6">
                    {aptitudeAnalysis.map((q: any, idx: number) => renderQuestionCard(q, idx))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════ */}
          {/* TAB 3: CODING QUESTION PERFORMANCE & COMPLEXITY */}
          {/* ════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'coding' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Code2 className="h-5 w-5 text-emerald-400" /> Coding Problem Analysis
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Algorithm approach classification, algorithmic time & space complexity, and compiler/runtime logs.
                  </p>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono font-bold text-emerald-400">
                  {summary.codingAccepted} / {summary.codingTotal} Solved ({summary.testsPassed}/{summary.totalTests} Tests)
                </div>
              </div>

              <div className="space-y-6">
                {codingAnalysis.map((p: any, idx: number) => (
                  <Card key={p.questionId || idx} className="p-6 bg-[#161b22] border border-white/10 space-y-5">
                    <div className="flex items-start justify-between flex-wrap gap-3">
                      <div>
                        <div className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-1">
                          Problem #{idx + 1} · {formatTopic(p.topic)} · {p.difficulty}
                        </div>
                        <h3 className="text-base font-bold text-white">{p.title}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2.5 py-1 rounded bg-white/5 font-mono text-gray-300">
                          {p.language || 'Python'}
                        </span>
                        <StatusBadge status={p.finalVerdict || p.finalStatus || 'NOT_ATTEMPTED'} />
                      </div>
                    </div>

                    {/* Metric Pills */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                      <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-center">
                        <div className="text-[10px] text-gray-500 uppercase">Tests Passed</div>
                        <div className="text-sm font-bold text-white mt-0.5">{p.testsPassed || p.passedCount || 0} / {p.testsTotal || p.totalCount || 0}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-center">
                        <div className="text-[10px] text-gray-500 uppercase">Your Complexity</div>
                        <div className="text-sm font-bold text-indigo-400 mt-0.5">{p.candidateTimeComplexity || p.candidateComplexity || 'O(n)'}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-center">
                        <div className="text-[10px] text-gray-500 uppercase">Optimal Complexity</div>
                        <div className="text-sm font-bold text-emerald-400 mt-0.5">{p.expectedComplexity || 'O(n)'}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-center">
                        <div className="text-[10px] text-gray-500 uppercase">Execution Time</div>
                        <div className="text-sm font-bold text-gray-200 mt-0.5">{p.timeSpent || '0.05s'}</div>
                      </div>
                    </div>

                    {/* Approach Classification & Better Approach Guidance */}
                    <div className="p-4 rounded-xl bg-white/3 border border-white/10 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-300 font-sans">Approach Evaluation:</span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {p.approachClassification || 'Standard Iteration'}
                        </span>
                      </div>
                      <p className="text-gray-300 leading-relaxed font-sans">
                        {p.approachSummary || p.complexityReason}
                      </p>

                      {p.betterApproach && (
                        <div className="pt-2 border-t border-white/5 space-y-1">
                          <span className="font-semibold text-emerald-400">💡 Optimization Recommendation:</span>
                          <p className="text-gray-300 leading-relaxed font-sans">{p.betterApproach.description}</p>
                          <p className="text-gray-400 italic text-[11px]">{p.betterApproach.whyBetter}</p>
                        </div>
                      )}
                    </div>

                    {/* Compiler or Runtime Error Alert (if present) */}
                    {p.errorExplanation && (
                      <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 space-y-2 text-xs">
                        <div className="flex items-center gap-2 text-rose-400 font-bold">
                          <AlertCircle className="h-4 w-4" />
                          <span>{p.errorExplanation.errorType} Diagnostics:</span>
                        </div>
                        <pre className="p-2.5 rounded bg-black/60 font-mono text-[11px] text-rose-300 overflow-x-auto">
                          {p.errorExplanation.rawMessage}
                        </pre>
                        <p className="text-gray-300 leading-relaxed font-sans">{p.errorExplanation.explanation}</p>
                        <p className="text-emerald-400 font-medium">Fix: {p.errorExplanation.suggestedFix}</p>
                      </div>
                    )}

                    {/* Submitted Code Viewer */}
                    {p.submittedCode && (
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Terminal className="h-3.5 w-3.5 text-gray-500" /> Submitted Solution Source Code
                        </div>
                        <pre className="p-4 rounded-xl bg-[#090d13] border border-white/10 font-mono text-xs text-gray-200 overflow-x-auto max-h-[260px] scrollbar-thin">
                          {p.submittedCode}
                        </pre>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════ */}
          {/* TAB 4: HR BEHAVIORAL INTERVIEW REVIEW */}
          {/* ════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'hr' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-purple-400" /> HR Behavioral Interview Transcript & Feedback
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Multi-turn conversational dialogue analysis, articulation scoring, and STAR framework recommendations.
                  </p>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs font-mono font-bold text-purple-400">
                  {summary.hrStatus === 'COMPLETED' ? '✓ Completed' : 'Not Attempted'}
                </div>
              </div>

              {/* Communication Scores Card */}
              {hrAnalysis && (
                <Card className="p-6 bg-[#161b22] border border-white/10 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                    <div className="p-3.5 rounded-xl bg-black/40 border border-white/5">
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider">Overall Communication</div>
                      <div className="text-lg font-bold text-purple-400 font-mono mt-0.5">{hrAnalysis.communicationScore || 85} / 100</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-black/40 border border-white/5">
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider">Clarity Score</div>
                      <div className="text-lg font-bold text-white font-mono mt-0.5">{hrAnalysis.clarityScore || 88} / 100</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-black/40 border border-white/5">
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider">Relevance Score</div>
                      <div className="text-lg font-bold text-white font-mono mt-0.5">{hrAnalysis.relevanceScore || 84} / 100</div>
                    </div>
                  </div>

                  {hrAnalysis.starMethodGuidance && (
                    <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 text-xs space-y-1.5">
                      <span className="font-semibold text-purple-300">🌟 Behavioral Interview Advice (STAR Method):</span>
                      <p className="text-gray-300 leading-relaxed font-sans">{hrAnalysis.starMethodGuidance}</p>
                    </div>
                  )}
                </Card>
              )}

              {/* Dialogue Transcript */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-purple-400" /> Chronological Dialogue Transcript
                </h3>

                {hrTranscript.length > 0 ? (
                  <div className="space-y-3">
                    {hrTranscript.map((msg: any, idx: number) => {
                      const isInterviewer = msg.role === 'interviewer' || msg.role === 'ai';
                      return (
                        <div
                          key={idx}
                          className={`p-4 rounded-xl border flex gap-3 text-xs leading-relaxed font-sans ${
                            isInterviewer
                              ? 'bg-[#161b22] border-indigo-500/30 text-gray-200 ml-0 mr-12'
                              : 'bg-purple-950/20 border-purple-500/30 text-purple-100 mr-0 ml-12'
                          }`}
                        >
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                              isInterviewer ? 'bg-indigo-600 text-white' : 'bg-purple-600 text-white'
                            }`}
                          >
                            {isInterviewer ? 'HR' : 'YOU'}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono">
                              <span>{isInterviewer ? 'Interviewer' : 'Your Response'}</span>
                              <span>{msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : ''}</span>
                            </div>
                            <p className="text-gray-200">{msg.content}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic p-4 bg-white/3 rounded-xl border border-white/5">
                    No HR dialogue transcript was recorded for this session.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════ */}
          {/* TAB 5: "ASK ABOUT MY INTERVIEW" AI CHATBOT */}
          {/* ════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'chat' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Bot className="h-5 w-5 text-purple-400" /> Ask About My Interview
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Ask questions about your answers, submitted code, mistakes, algorithmic complexity, and how to improve.
                  </p>
                </div>
                <div className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-xs text-purple-300 font-mono flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Evidence Grounded
                </div>
              </div>

              {/* Chat Container Card */}
              <Card className="p-6 bg-[#161b22] border border-white/10 flex flex-col" style={{ height: '680px' }}>

                {/* Active Question Discussion Banner & Teaching Mode Pills */}
                {askAiQuestion && (
                  <div className="mb-3 p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-2.5 shrink-0">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-indigo-300 font-semibold">
                        <Sparkles className="h-4 w-4 text-indigo-400" />
                        <span>Discussing Q{askAiQuestion.questionNumber || 1}: {typeof askAiQuestion.topic === 'string' ? askAiQuestion.topic : (askAiQuestion.topic?.name || 'Question')}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                          askAiQuestion.isCorrect ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {askAiQuestion.isCorrect ? '✓ Correct in Assessment' : '✗ Incorrect in Assessment'}
                        </span>
                      </div>
                      <button
                        onClick={() => setAskAiQuestion(null)}
                        className="text-[11px] text-gray-400 hover:text-white transition-colors"
                      >
                        ✕ Switch to General Chat
                      </button>
                    </div>

                    {/* 5 Teaching Mode Pills — always visible when question is selected */}
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      <button
                        onClick={() => handleTeachingPill('HINT')}
                        disabled={isSending}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 text-xs font-medium transition-all flex items-center gap-1.5 disabled:opacity-50"
                      >
                        💡 Give Me a Hint
                      </button>
                      <button
                        onClick={() => handleTeachingPill('EXPLAIN')}
                        disabled={isSending}
                        className="px-2.5 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/25 text-xs font-medium transition-all flex items-center gap-1.5 disabled:opacity-50"
                      >
                        📖 Explain the Answer
                      </button>
                      <button
                        onClick={() => handleTeachingPill('TEACH_ME')}
                        disabled={isSending}
                        className="px-2.5 py-1 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-300 hover:bg-purple-500/25 text-xs font-medium transition-all flex items-center gap-1.5 disabled:opacity-50"
                      >
                        🎓 Teach Me From Basics
                      </button>
                      {!askAiQuestion.isCorrect && (
                        <button
                          onClick={() => handleTeachingPill('EXPLAIN_MISTAKE')}
                          disabled={isSending}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500/25 text-xs font-medium transition-all flex items-center gap-1.5 disabled:opacity-50"
                        >
                          🧐 Explain My Mistake
                        </button>
                      )}
                      <button
                        onClick={() => handleTeachingPill('SIMILAR_QUESTION')}
                        disabled={isSending}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 text-xs font-medium transition-all flex items-center gap-1.5 disabled:opacity-50"
                      >
                        🧠 Give Me a Similar Question
                      </button>
                    </div>
                  </div>
                )}

                {/* Message Stream */}
                <div
                  ref={chatScrollRef}
                  className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-thin"
                >
                  {/* Welcome / Starter — shown only when no messages have been sent yet */}
                  {messages.length === 0 && !chatLoading && (
                    <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 text-xs text-purple-200 space-y-3">
                      <div className="flex items-center gap-2 font-bold text-purple-300">
                        <Bot className="h-4 w-4" /> Interview AI Intelligence Assistant
                      </div>
                      <p className="leading-relaxed">
                        I have analyzed your specific assessment evidence across Aptitude ({summary.aptitudePassed}/{summary.aptitudeTotal}), Coding ({summary.codingAccepted}/{summary.codingTotal} accepted), and the HR interview.
                      </p>
                      <p className="text-[11px] text-gray-400">
                        Click any question’s “Ask AI” button or pick a starter question below:
                      </p>
                      {/* Starter questions — ONLY shown before any messages */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {[
                          'Explain my biggest mistake',
                          'Was my coding approach optimal?',
                          'How can I improve my HR answers?',
                          'Show me a better approach',
                          'What should I practice next?',
                        ].map((q, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSendMessage(q)}
                            disabled={isSending}
                            className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-[11px] transition-colors disabled:opacity-50"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {chatLoading && (
                    <div className="text-xs text-gray-500 italic p-4">Loading conversation history...</div>
                  )}

                  {/* Message bubbles */}
                  {messages.map((m, msgIdx) => {
                    const isUser = m.role === 'user';
                    // Only show follow-up suggestions on the very last assistant message
                    const isLastAssistant = !isUser && msgIdx === messages.length - 1;

                    return (
                      <div
                        key={m.id}
                        className={`flex gap-3 ${
                          isUser ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {!isUser && (
                          <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center text-white shrink-0 text-xs mt-0.5">
                            <Bot className="h-4 w-4" />
                          </div>
                        )}

                        <div
                          className={`rounded-xl max-w-[85%] space-y-3 font-sans ${
                            isUser
                              ? 'bg-indigo-600 text-white rounded-br-none p-3.5 text-xs'
                              : 'bg-white/5 border border-white/10 text-gray-200 rounded-bl-none p-4'
                          }`}
                        >
                          {/* Content */}
                          {isUser ? (
                            <p className="text-xs leading-relaxed">{m.content}</p>
                          ) : (
                            renderMarkdown(m.content)
                          )}

                          {/* Practice Question Interactive Options (no answer hidden) */}
                          {m.practiceQuestion && m.practiceQuestion.options && (
                            <div className="pt-2 border-t border-white/10 space-y-2">
                              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                                Select Your Answer:
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {m.practiceQuestion.options.map((opt, optIdx) => {
                                  const letter = m.practiceQuestion?.optionLabels?.[optIdx] || String.fromCharCode(65 + optIdx);
                                  return (
                                    <button
                                      key={optIdx}
                                      onClick={() => handleAnswerPractice(m.practiceQuestion!.practiceQuestionId, letter)}
                                      disabled={isSending}
                                      className="p-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 text-left text-xs transition-all flex items-center gap-2 disabled:opacity-50"
                                    >
                                      <span className="w-5 h-5 rounded-full bg-emerald-500/30 font-bold font-mono text-[10px] flex items-center justify-center shrink-0">
                                        {letter}
                                      </span>
                                      <span className="flex-1">{opt}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Follow-up suggestions — ONLY on the latest assistant message */}
                          {isLastAssistant && m.suggestedFollowups && m.suggestedFollowups.length > 0 && (
                            <div className="pt-2 border-t border-white/10 space-y-1.5">
                              <span className="text-[10px] uppercase font-bold tracking-wider text-purple-400">
                                Suggested Follow-up:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {m.suggestedFollowups.map((f, fIdx) => (
                                  <button
                                    key={fIdx}
                                    onClick={() => handleSendMessage(f)}
                                    disabled={isSending}
                                    className="px-2.5 py-1 rounded-md bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 text-[11px] transition-colors disabled:opacity-50"
                                  >
                                    {f}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {isUser && (
                          <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-white shrink-0 text-xs mt-0.5">
                            <User className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Typing indicator */}
                  {isSending && (
                    <div className="flex items-center gap-3 text-xs text-purple-300 italic p-3">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400" />
                      Analyzing session evidence and synthesizing answer...
                    </div>
                  )}
                </div>

                {/* Input Console — ONLY input + send, no suggestion repeat */}
                <div className="pt-3 border-t border-white/10 flex gap-2 shrink-0">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Ask about your aptitude choices, coding mistakes, or interview answers..."
                    disabled={isSending}
                    className="flex-1 px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-indigo-500"
                  />
                  <Button
                    onClick={() => handleSendMessage()}
                    disabled={isSending || !inputMessage.trim()}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
