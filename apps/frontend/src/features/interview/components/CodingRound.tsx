/**
 * CodingRound.tsx - HackerEarth-style Coding Round Component
 *
 * Layout:
 *   [Header: Problem tabs | Run | Submit | Timer | Fullscreen]
 *   [LEFT: Problem Panel (scrollable)] | [RIGHT: Monaco Editor + Results]
 *
 * Features:
 *   - Language selector per-question (5 langs)
 *   - Per-language starter code loaded from metadata
 *   - Code persisted per-question per-language on tab switch
 *   - RUN: sample test cases only
 *   - SUBMIT: all test cases, score persisted
 *   - Dynamic score display (no hardcoded weights)
 *   - Error panel: COMPILATION_ERROR | RUNTIME_ERROR | WRAPPER_ERROR etc.
 *   - Hidden test case results: pass/fail only (no input/output exposed)
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Editor from "@monaco-editor/react";
import {
  Play, Send, Clock, ChevronRight, CheckCircle2,
  XCircle, AlertTriangle, Loader2, Maximize2, Minimize2,
  Terminal, Cpu, Clock3, Code2, Circle,
} from "lucide-react";
import api from "../../../api/axios/instance";
import { normalizeInterviewQuestion } from "../../../utils/normalizeQuestion";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TestResult {
  index: number;
  passed: boolean;
  input?: string;
  expected?: string;
  actual?: string;
  hidden?: boolean;
  time?: number | string | null;
  executionTime?: number | string | null;
  memory?: number | null;
  score?: number;
}

type RunMode = "RUN" | "SUBMIT";

type ErrorType =
  | "COMPILATION_ERROR"
  | "RUNTIME_ERROR"
  | "WRAPPER_ERROR"
  | "INVALID_QUESTION_CONFIGURATION"
  | "COMPILER_SERVICE_UNAVAILABLE"
  | "TIME_LIMIT_EXCEEDED"
  | "NETWORK_ERROR";

interface ExecutionResult {
  success: boolean;
  errorType?: ErrorType;
  message?: string;
  status?: { id: number; description: string };
  results?: TestResult[];
  score?: number;
  totalScore?: number;
  passedCount?: number;
  totalCount?: number;
  allPassed?: boolean;
  time?: number | null;
  memory?: number | null;
  language?: string;
  runMode?: RunMode;
}

interface CodingQuestion {
  id: string;
  title: string;
  difficulty?: string;
  topic?: string;
  description?: string;
  examples?: Array<{ input: string; output: string; explanation?: string }>;
  constraints?: string[];
  metadata?: {
    jsonPayload?: {
      execution?: {
        languages?: Record<string, {
          functionName?: string;
          methodName?: string;
          starterCode?: string;
          judge0LanguageId?: number;
          parameters?: Array<{ name: string; type: string }>;
          returnType?: string;
        }>;
      };
    };
  };
}

// ─── Language Config ──────────────────────────────────────────────────────────

const LANGUAGES = [
  { key: "python",     label: "Python",     monacoLang: "python",     judge0Id: 71  },
  { key: "javascript", label: "JavaScript", monacoLang: "javascript", judge0Id: 93  },
  { key: "java",       label: "Java",       monacoLang: "java",       judge0Id: 62  },
  { key: "cpp",        label: "C++",        monacoLang: "cpp",        judge0Id: 54  },
  { key: "c",          label: "C",          monacoLang: "c",          judge0Id: 50  },
] as const;

type LangKey = typeof LANGUAGES[number]["key"];

function getStarterCode(_question: CodingQuestion | null, langKey: LangKey): string {
  const defaultTemplates: Record<string, string> = {
    c: `#include <stdio.h>\n\nint main() {\n    // Read input from stdin\n    return 0;\n}\n`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Read input from stdin\n    return 0;\n}\n`,
    java: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Read input from stdin\n    }\n}\n`,
    python: `# Read input from stdin\n`,
    javascript: `const fs = require("fs");\nconst input = fs.readFileSync(0, "utf8").trim();\n`,
  };
  return defaultTemplates[langKey] || `// Write your ${langKey} solution here\n`;
}

// ─── Score Display ────────────────────────────────────────────────────────────

function ScorePill({ earned, total, allPassed }: { earned: number; total: number; allPassed: boolean }) {
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold
      ${allPassed ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  : "bg-amber-500/15 text-amber-400 border border-amber-500/30"}`}>
      {earned} / {total} pts
    </div>
  );
}

// ─── Difficulty Badge ─────────────────────────────────────────────────────────

function DifficultyBadge({ difficulty }: { difficulty?: string }) {
  const cls =
    difficulty === "EASY"   ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
    difficulty === "MEDIUM" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
    difficulty === "HARD"   ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
    "bg-gray-500/10 text-gray-400 border-gray-500/20";
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cls}`}>
      {difficulty || "MEDIUM"}
    </span>
  );
}

// ─── Error Panel ──────────────────────────────────────────────────────────────

function ErrorPanel({ result }: { result: ExecutionResult }) {
  const meta: Record<string, { icon: React.ReactNode; title: string; color: string }> = {
    COMPILATION_ERROR:            { icon: <Code2 className="h-4 w-4"/>, title: "Compilation Error",        color: "rose"   },
    RUNTIME_ERROR:                { icon: <AlertTriangle className="h-4 w-4"/>, title: "Runtime Error",           color: "orange" },
    WRAPPER_ERROR:                { icon: <AlertTriangle className="h-4 w-4"/>, title: "Function Resolution Error", color: "amber" },
    INVALID_QUESTION_CONFIGURATION: { icon: <XCircle className="h-4 w-4"/>, title: "Invalid Question Configuration", color: "rose" },
    COMPILER_SERVICE_UNAVAILABLE: { icon: <Terminal className="h-4 w-4"/>, title: "Execution Service Unavailable", color: "gray" },
    TIME_LIMIT_EXCEEDED:          { icon: <Clock3 className="h-4 w-4"/>, title: "Time Limit Exceeded",    color: "yellow" },
    NETWORK_ERROR:                { icon: <AlertTriangle className="h-4 w-4"/>, title: "Network Error",           color: "gray"  },
  };

  const m = meta[result.errorType || ""] || { icon: <AlertTriangle className="h-4 w-4"/>, title: "Execution Error", color: "rose" };

  const colorMap: Record<string, string> = {
    rose:   "border-rose-500/30 bg-rose-500/5 text-rose-400",
    orange: "border-orange-500/30 bg-orange-500/5 text-orange-400",
    amber:  "border-amber-500/30 bg-amber-500/5 text-amber-400",
    gray:   "border-gray-500/30 bg-gray-500/5 text-gray-400",
    yellow: "border-yellow-500/30 bg-yellow-500/5 text-yellow-400",
  };

  return (
    <div className="p-4 space-y-3">
      <div className={`flex items-center gap-2 p-3 rounded-lg border ${colorMap[m.color]}`}>
        {m.icon}
        <span className="font-semibold text-sm">{m.title}</span>
      </div>
      {result.message && (
        <pre className={`text-xs font-mono whitespace-pre-wrap p-4 rounded-lg border ${colorMap[m.color]} opacity-90`}>
          {result.message}
        </pre>
      )}
    </div>
  );
}

// ─── Results Panel ────────────────────────────────────────────────────────────

function formatTime(time: any): string {
  if (time === null || time === undefined || time === '') return '0.000s';
  const num = typeof time === 'number' ? time : parseFloat(String(time));
  return isNaN(num) ? `${time}s` : `${num.toFixed(3)}s`;
}

function formatMemory(mem: any): string {
  if (mem === null || mem === undefined || mem === '') return '0 KB';
  const num = typeof mem === 'number' ? mem : parseFloat(String(mem));
  return isNaN(num) ? `${mem} KB` : `${Math.round(num)} KB`;
}

function ResultsPanel({ result, runMode }: { result: ExecutionResult; runMode: RunMode }) {
  const { results, score, totalScore, passedCount, totalCount, allPassed, time, memory, language } = result;
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="p-4 space-y-4 overflow-y-auto">
      {/* ── Summary Header ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className={`flex items-center gap-2 text-base font-bold
          ${allPassed ? "text-emerald-400" : "text-rose-400"}`}>
          {allPassed
            ? <CheckCircle2 className="h-5 w-5"/>
            : <XCircle className="h-5 w-5"/>}
          {allPassed ? "Accepted" : "Wrong Answer"}
        </div>

        {score !== undefined && totalScore !== undefined && (
          <ScorePill earned={score} total={totalScore} allPassed={!!allPassed}/>
        )}

        <div className="flex items-center gap-3 ml-auto text-xs text-gray-400">
          {time !== null && time !== undefined && (
            <span className="flex items-center gap-1" title="Total Execution Time">
              <Clock3 className="h-3.5 w-3.5"/> Total: {formatTime(time)}
            </span>
          )}
          {memory !== null && memory !== undefined && (
            <span className="flex items-center gap-1" title="Peak Memory">
              <Cpu className="h-3.5 w-3.5"/> Peak: {formatMemory(memory)}
            </span>
          )}
          {language && (
            <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 capitalize">
              {language}
            </span>
          )}
          {runMode && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold
              ${runMode === "RUN" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                 : "bg-purple-500/10 text-purple-400 border border-purple-500/20"}`}>
              {runMode === "RUN" ? "Sample Run" : "Full Submit"}
            </span>
          )}
        </div>
      </div>

      {/* ── Test Case Count ───────────────────────────────────────────── */}
      {totalCount !== undefined && (
        <div className="text-sm text-gray-400 flex items-center justify-between">
          <div>
            <span className="text-white font-semibold">{passedCount}</span> / {totalCount} test case{totalCount !== 1 ? "s" : ""} passed
          </div>
          {time !== null && time !== undefined && (
            <div className="text-xs font-mono text-gray-400">
              Total execution time: <span className="text-white font-semibold">{formatTime(time)}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Test Results Table ────────────────────────────────────────── */}
      {results && results.length > 0 && (
        <div className="space-y-2">
          {results.map((r, i) => (
            <div
              key={i}
              className={`rounded-lg border overflow-hidden transition-all cursor-pointer
                ${r.passed
                  ? "border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10"
                  : "border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10"}`}
              onClick={() => setExpanded(expanded === i ? null : i)}
            >
              {/* Row header */}
              <div className="flex items-center justify-between px-4 py-2.5">
                <div className="flex items-center gap-3">
                  {r.passed
                    ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0"/>
                    : <XCircle className="h-4 w-4 text-rose-500 shrink-0"/>}
                  <span className="text-sm font-medium text-gray-200">
                    Test #{i + 1}
                    {r.hidden && (
                      <span className="ml-2 text-xs text-gray-500">(hidden)</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="font-mono">{formatTime(r.executionTime ?? r.time)}</span>
                  <span className={`font-semibold ${r.passed ? "text-emerald-400" : "text-rose-400"}`}>
                    {r.score !== undefined && `${r.score} pts`}
                  </span>
                  <ChevronRight className={`h-4 w-4 text-gray-500 transition-transform ${expanded === i ? "rotate-90" : ""}`}/>
                </div>
              </div>

              {/* Expandable details (only for non-hidden tests) */}
              {expanded === i && !r.hidden && (
                <div className="border-t border-white/10 px-4 py-3 space-y-3 text-xs font-mono">
                  {r.input !== undefined && (
                    <div>
                      <div className="text-gray-500 mb-1 font-sans font-semibold uppercase tracking-wider text-[10px]">Input</div>
                      <div className="bg-black/30 rounded p-2 text-gray-300 whitespace-pre-wrap">{r.input}</div>
                    </div>
                  )}
                  {r.expected !== undefined && (
                    <div>
                      <div className="text-gray-500 mb-1 font-sans font-semibold uppercase tracking-wider text-[10px]">Expected</div>
                      <div className="bg-black/30 rounded p-2 text-emerald-400 whitespace-pre-wrap">{r.expected}</div>
                    </div>
                  )}
                  {r.actual !== undefined && (
                    <div>
                      <div className={`mb-1 font-sans font-semibold uppercase tracking-wider text-[10px] ${r.passed ? "text-gray-500" : "text-rose-500"}`}>
                        {r.passed ? "Output" : "Your Output"}
                      </div>
                      <div className={`bg-black/30 rounded p-2 whitespace-pre-wrap ${r.passed ? "text-gray-300" : "text-rose-400"}`}>
                        {r.actual}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Problem Panel ────────────────────────────────────────────────────────────

function ProblemPanel({ question }: { question: CodingQuestion | null }) {
  if (!question) return (
    <div className="flex items-center justify-center h-full text-gray-500">
      <div className="text-center">
        <Circle className="h-10 w-10 mx-auto mb-3 text-gray-700"/>
        <p>Loading problem...</p>
      </div>
    </div>
  );

  return (
    <div className="p-5 space-y-5 text-sm">
      {/* Title + Difficulty */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <DifficultyBadge difficulty={question.difficulty}/>
          {question.topic && (
            <span className="text-xs bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-gray-400">
              {typeof question.topic === 'string' ? question.topic : (question.topic?.name || 'General')}
            </span>
          )}
        </div>
        <h2 className="text-base font-bold text-white leading-tight">{question.title}</h2>
      </div>

      {/* Description */}
      {question.description && (
        <div className="space-y-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Problem</div>
          <p className="text-gray-300 leading-relaxed">{question.description}</p>
        </div>
      )}

      {/* Examples */}
      {question.examples && question.examples.length > 0 && (
        <div className="space-y-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Examples</div>
          {question.examples.map((ex, i) => (
            <div key={i} className="bg-white/3 border border-white/8 rounded-lg p-3 space-y-2 font-mono text-xs">
              <div className="flex gap-2">
                <span className="text-gray-500 shrink-0">Input:</span>
                <span className="text-gray-200">{ex.input}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-500 shrink-0">Output:</span>
                <span className="text-emerald-400">{ex.output}</span>
              </div>
              {ex.explanation && (
                <div className="text-gray-400 text-[11px] leading-relaxed">
                  <span className="text-gray-500">Explanation: </span>{ex.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Standard Input Format */}
      <div className="space-y-2 bg-indigo-950/20 border border-indigo-500/20 rounded-lg p-3.5 text-xs">
        <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5 font-mono">
          <Terminal className="h-3.5 w-3.5" /> Standard Input (stdin) Format
        </div>
        <p className="text-gray-300 leading-relaxed font-sans">
          {question.title.includes('Stock')
            ? 'Line 1 contains n (number of prices). Line 2 contains n space-separated integers representing the stock prices.'
            : question.title.includes('Two Sum')
            ? 'Line 1 contains n. Line 2 contains n space-separated integers. Line 3 contains the target integer.'
            : 'Read inputs from standard input (stdin) using standard competitive programming methods (scanf, cin, Scanner, input(), or readFileSync).'}
        </p>
      </div>

      {/* Constraints */}
      {question.constraints && question.constraints.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Constraints</div>
          <ul className="space-y-1 text-gray-400">
            {question.constraints.map((c, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-gray-600 mt-0.5 shrink-0">•</span>
                <span className="font-mono text-xs">{c}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Main CodingRound Component ───────────────────────────────────────────────

export const CodingRound = ({
  questions,
  sessionId,
  onComplete,
  timeLeft,
}: {
  questions: any[];
  sessionId: string;
  onComplete: (result: any) => void;
  timeLeft?: number;
}) => {
  const normalizedQuestions = useMemo(
    () => questions.map(normalizeInterviewQuestion).filter(Boolean) as CodingQuestion[],
    [questions]
  );

  const [qIndex, setQIndex] = useState(0);

  // ── Safe Question Resolution (Declared First) ──────────────────────────────
  const question: CodingQuestion | null =
    normalizedQuestions.length > 0
      ? normalizedQuestions[Math.min(qIndex, normalizedQuestions.length - 1)] ?? null
      : null;

  const [selectedLang, setSelectedLang] = useState<LangKey>("python");
  const [isRunning, setIsRunning]   = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [execResult, setExecResult] = useState<ExecutionResult | null>(null);
  const [lastRunMode, setLastRunMode] = useState<RunMode | null>(null);
  const [customInput, setCustomInput] = useState('');
  const [activeConsoleTab, setActiveConsoleTab] = useState<'results' | 'customInput' | 'history'>('results');
  const [attemptsHistory, setAttemptsHistory] = useState<any[]>([]);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [submittedQuestions, setSubmittedQuestions] = useState<Set<number>>(new Set());

  // Per-question, per-language code storage
  const codeStore = useRef<Record<string, string>>({});
  const codeKey = (qi: number, lang: LangKey) => `${qi}::${lang}`;

  // ── Load starter code when question/language changes ───────────────────────
  const [code, setCodeLocal] = useState(() => getStarterCode(question, selectedLang));

  const setCode = useCallback((val: string) => {
    setCodeLocal(val);
    codeStore.current[codeKey(qIndex, selectedLang)] = val;
  }, [qIndex, selectedLang]);

  // Restore saved code when question or language changes
  useEffect(() => {
    const saved = codeStore.current[codeKey(qIndex, selectedLang)];
    if (saved !== undefined) {
      setCodeLocal(saved);
    } else {
      const starter = getStarterCode(question, selectedLang);
      setCodeLocal(starter);
      codeStore.current[codeKey(qIndex, selectedLang)] = starter;
    }
    setExecResult(null);
    setResultsOpen(false);
  }, [qIndex, selectedLang, question]);

  // Fetch attempts history for current problem
  const loadAttempts = useCallback(async () => {
    if (!sessionId || !question?.id) return;
    try {
      const res = await api.get(`/interviews/${sessionId}/coding/attempts/${question.id}`);
      const atts = res.data?.data || [];
      setAttemptsHistory(atts);
      if (atts.some((a: any) => a.runMode === 'SUBMIT')) {
        setSubmittedQuestions(prev => new Set([...prev, qIndex]));
      }
    } catch (err) {
      console.warn('Failed to load attempts history', err);
    }
  }, [sessionId, question?.id, qIndex]);

  useEffect(() => {
    loadAttempts();
  }, [loadAttempts]);

  const abortControllerRef = useRef<AbortController | null>(null);

  // ── Execute ───────────────────────────────────────────────────────────────

  const execute = useCallback(async (runMode: RunMode) => {
    if (!code.trim() || !question) return;
    const setter = runMode === "RUN" ? setIsRunning : setIsSubmitting;
    setter(true);
    setExecResult(null);
    setResultsOpen(true);
    setActiveConsoleTab('results');
    setLastRunMode(runMode);

    const langConfig = LANGUAGES.find(l => l.key === selectedLang);
    const endpoint = runMode === "RUN" ? "run" : "submit";

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const res = await api.post(
        `/interviews/${sessionId}/${endpoint}`,
        {
          questionRefId: question.id,
          languageId: langConfig?.judge0Id ?? 71,
          sourceCode: code,
          customInput: runMode === "RUN" && customInput.trim() ? customInput : undefined,
        },
        {
          signal: abortControllerRef.current.signal
        }
      );

      const data: ExecutionResult = res.data;
      setExecResult(data);

      if (runMode === "SUBMIT") {
        setSubmittedQuestions(prev => new Set([...prev, qIndex]));
        loadAttempts();
      }
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message?.includes('canceled')) {
        console.log('Execution cancelled by user');
        return;
      }
      setExecResult({
        success: false,
        errorType: "NETWORK_ERROR",
        message: err?.response?.data?.message || err.message || "Network error",
      });
    } finally {
      setter(false);
      abortControllerRef.current = null;
    }
  }, [code, question, sessionId, selectedLang, qIndex, customInput, loadAttempts]);

  const cancelExecution = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsRunning(false);
      setIsSubmitting(false);
    }
  };

  const allSubmitted = normalizedQuestions.length > 0
    && normalizedQuestions.every((_, i) => submittedQuestions.has(i));

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const isLow = timeLeft !== undefined && timeLeft < 300;

  // ── Guard against missing / empty questions ────────────────────────────────
  if (normalizedQuestions.length === 0 || !question) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-[#0d1117]">
        <div className="text-center text-gray-400 text-sm">
          <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto mb-2" />
          Coding question not available for this session.
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={`flex flex-col bg-[#0d1117] text-gray-200 ${isFullscreen ? "fixed inset-0 z-50" : "flex-1 h-full"} overflow-hidden`}>

      {/* ────────── CODING ROUND SUB-HEADER ────────── */}
      <div className="h-11 shrink-0 flex items-center gap-2 px-3 bg-[#161b22] border-b border-white/10">

        {/* Problem Tabs */}
        <div className="flex items-center gap-1.5">
          {normalizedQuestions.map((_q, i) => {
            const done = submittedQuestions.has(i);
            return (
              <button
                key={i}
                onClick={() => setQIndex(i)}
                className={`flex items-center gap-1.5 h-7 px-3 rounded-md text-xs font-medium border transition-all
                  ${qIndex === i
                    ? "bg-indigo-600 border-indigo-500 text-white shadow-sm"
                    : done
                    ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10"
                    : "border-white/10 bg-white/3 text-gray-400 hover:bg-white/8 hover:text-gray-200"}`}
              >
                {done ? <CheckCircle2 className="h-3 w-3 shrink-0"/> : <Circle className="h-3 w-3 shrink-0"/>}
                Problem {i + 1}
              </button>
            );
          })}
        </div>

        <div className="flex-1"/>

        {/* Language Selector */}
        <select
          value={selectedLang}
          onChange={e => setSelectedLang(e.target.value as LangKey)}
          className="h-7 text-xs px-2 rounded-md bg-white/5 border border-white/10 text-gray-300 hover:border-white/20 focus:outline-none focus:border-indigo-500 cursor-pointer"
        >
          {LANGUAGES.map(l => (
            <option key={l.key} value={l.key} className="bg-[#1e1e1e]">{l.label}</option>
          ))}
        </select>

        {/* Run / Submit / Cancel */}
        {(isRunning || isSubmitting) ? (
          <button
            onClick={cancelExecution}
            className="flex items-center gap-1.5 h-7 px-3 rounded-md text-xs font-semibold border border-rose-500/40 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/60 transition-all"
          >
            <XCircle className="h-3.5 w-3.5"/> Cancel
          </button>
        ) : (
          <>
            <button
              onClick={() => execute("RUN")}
              className="flex items-center gap-1.5 h-7 px-3 rounded-md text-xs font-semibold border border-blue-500/40 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/60 transition-all"
            >
              <Play className="h-3.5 w-3.5"/> Run
            </button>

            <button
              onClick={() => execute("SUBMIT")}
              className="flex items-center gap-1.5 h-7 px-3 rounded-md text-xs font-semibold border border-purple-500/40 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 hover:border-purple-500/60 transition-all"
            >
              <Send className="h-3.5 w-3.5"/> Submit
            </button>
          </>
        )}

        {/* Timer */}
        {timeLeft !== undefined && (
          <div className={`flex items-center gap-1.5 h-7 px-3 rounded-md text-xs font-mono font-semibold border transition-colors
            ${isLow ? "bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse" : "bg-white/5 text-gray-300 border-white/10"}`}>
            <Clock className="h-3.5 w-3.5"/>
            {formatTime(timeLeft)}
          </div>
        )}

        {/* Fullscreen */}
        <button
          onClick={() => setIsFullscreen(f => !f)}
          className="flex items-center justify-center h-7 w-7 rounded-md border border-white/10 bg-white/3 text-gray-400 hover:bg-white/8 hover:text-gray-200 transition-all"
        >
          {isFullscreen ? <Minimize2 className="h-3.5 w-3.5"/> : <Maximize2 className="h-3.5 w-3.5"/>}
        </button>

        {/* Complete button when all submitted */}
        {allSubmitted && (
          <button
            onClick={() => onComplete({ completed: true, submittedQuestions: [...submittedQuestions] })}
            className="flex items-center gap-1.5 h-7 px-3 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all"
          >
            <CheckCircle2 className="h-3.5 w-3.5"/> Complete Round
          </button>
        )}
      </div>

      {/* ────────── MAIN SPLIT PANEL ────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* LEFT: Problem Description */}
        <div className="w-[42%] shrink-0 border-r border-white/10 overflow-y-auto
          scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          <ProblemPanel question={question}/>
        </div>

        {/* RIGHT: Editor + Results */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Monaco Editor */}
          <div className={`${resultsOpen ? "flex-none" : "flex-1"} min-h-[200px]`}
               style={{ height: resultsOpen ? "55%" : "100%" }}>
            <Editor
              height="100%"
              language={LANGUAGES.find(l => l.key === selectedLang)?.monacoLang || "python"}
              theme="vs-dark"
              value={code}
              onChange={val => setCode(val || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                wordWrap: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 12, bottom: 12 },
                lineNumbersMinChars: 3,
                folding: true,
                suggestOnTriggerCharacters: true,
                tabSize: 4,
              }}
              loading={
                <div className="flex items-center justify-center h-full bg-[#1e1e1e]">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-500"/>
                </div>
              }
            />
          </div>

          {/* Results / Console Panel */}
          {resultsOpen && (
            <div className="flex-1 border-t border-white/10 bg-[#0d1117] overflow-y-auto
              scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent min-h-[150px]">

              {/* Console Header with Tabs */}
              <div className="flex items-center justify-between h-9 px-4 bg-[#161b22] border-b border-white/10 shrink-0">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setActiveConsoleTab('results')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                      activeConsoleTab === 'results'
                        ? 'bg-white/10 text-white'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <Terminal className="h-3.5 w-3.5" />
                    {lastRunMode === 'RUN' ? 'Run Results' : 'Submit Results'}
                  </button>

                  <button
                    onClick={() => setActiveConsoleTab('customInput')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                      activeConsoleTab === 'customInput'
                        ? 'bg-white/10 text-white'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <Code2 className="h-3.5 w-3.5" />
                    Custom Input (stdin)
                    {customInput.trim() && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                  </button>

                  <button
                    onClick={() => {
                      setActiveConsoleTab('history');
                      loadAttempts();
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                      activeConsoleTab === 'history'
                        ? 'bg-white/10 text-white'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <Clock3 className="h-3.5 w-3.5" />
                    Attempts ({attemptsHistory.length})
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {(isRunning || isSubmitting) && (
                    <span className="flex items-center gap-1.5 text-xs text-blue-400 animate-pulse">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Executing...
                    </span>
                  )}
                  <button
                    onClick={() => setResultsOpen(false)}
                    className="text-xs text-gray-500 hover:text-gray-300 transition-colors px-1.5"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Content by Tab */}
              <div className="overflow-y-auto p-4">
                {activeConsoleTab === 'customInput' ? (
                  <div className="space-y-3">
                    <div className="text-xs text-gray-400 flex items-center justify-between">
                      <span>Enter raw test case input (sent directly to standard input stdin):</span>
                      {customInput && (
                        <button
                          onClick={() => setCustomInput('')}
                          className="text-xs text-rose-400 hover:underline"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <textarea
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      placeholder={`e.g.\n6\n7 1 5 3 6 4`}
                      rows={5}
                      className="w-full p-3 font-mono text-xs bg-black/40 border border-white/10 rounded-lg text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-indigo-500"
                    />
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-gray-500 font-mono">Custom tests execute in real-time without affecting official assessment scores.</span>
                      <button
                        onClick={() => execute("RUN")}
                        disabled={isRunning || isSubmitting}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all disabled:opacity-50"
                      >
                        <Play className="h-3.5 w-3.5" /> Run Custom Test
                      </button>
                    </div>
                  </div>
                ) : activeConsoleTab === 'history' ? (
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Problem Submission & Execution History
                    </h4>
                    {attemptsHistory.length > 0 ? (
                      <div className="space-y-2">
                        {attemptsHistory.map((att: any, idx: number) => (
                          <div
                            key={att.id || idx}
                            className="p-3 rounded-lg border border-white/10 bg-white/3 flex items-center justify-between text-xs font-mono"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-gray-500">#{att.attemptNumber || idx + 1}</span>
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                  att.runMode === 'SUBMIT'
                                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                }`}
                              >
                                {att.runMode}
                              </span>
                              <span
                                className={`font-semibold ${
                                  att.status === 'ACCEPTED' || att.status === 'PASSED'
                                    ? 'text-emerald-400'
                                    : 'text-rose-400'
                                }`}
                              >
                                {att.status}
                              </span>
                              <span className="text-gray-400 capitalize font-sans">{att.language}</span>
                            </div>

                            <div className="flex items-center gap-3 text-gray-400">
                              {att.totalCount > 0 && (
                                <span>
                                  {att.passedCount}/{att.totalCount} tests
                                </span>
                              )}
                              <span>{new Date(att.timestamp).toLocaleTimeString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">No execution attempts recorded yet for this problem.</p>
                    )}
                  </div>
                ) : isRunning || isSubmitting ? (
                  <div className="flex flex-col items-center justify-center p-8 gap-3 text-blue-400">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="text-sm font-medium">Executing on Judge0...</span>
                    <span className="text-xs text-gray-500">Real execution — no simulation</span>
                  </div>
                ) : execResult ? (
                  execResult.success === false ? (
                    <ErrorPanel result={execResult} />
                  ) : (
                    <ResultsPanel result={execResult} runMode={lastRunMode || 'SUBMIT'} />
                  )
                ) : (
                  <div className="text-xs text-gray-500 text-center py-6">
                    Click <strong>Run</strong> for sample test verification or <strong>Submit</strong> for full evaluation.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
