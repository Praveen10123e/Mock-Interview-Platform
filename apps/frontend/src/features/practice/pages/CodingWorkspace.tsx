import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
// @ts-ignore
import { Panel, Group, Separator } from 'react-resizable-panels';
const ResizableGroup: any = Group;
import {
  Play, Send, RotateCcw, Maximize2, Minimize2,
  ChevronLeft, XCircle, Terminal, HelpCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CodeEditor } from '../components/CodeEditor';
import { ExecutionConsole } from '../components/ExecutionConsole';
import { useWorkspaceStore } from '../../../store/useWorkspaceStore';
import { useExecuteCode } from '../../../api/judge';
import { Badge, StatusBadge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { getDisplayName, getTagNames } from '../../../utils/display';
import { extractErrorMessage } from '../../../utils/display';

import { normalizeInterviewQuestion } from '../../../utils/normalizeQuestion';

interface WorkspaceProps {
  question: any;
}

const SUPPORTED_LANGUAGES = [
  { id: 71, key: 'python',     name: 'Python',     monaco: 'python' },
  { id: 93, key: 'javascript', name: 'JavaScript', monaco: 'javascript' },
  { id: 62, key: 'java',       name: 'Java',       monaco: 'java' },
  { id: 54, key: 'cpp',        name: 'C++',        monaco: 'cpp' },
  { id: 50, key: 'c',          name: 'C',          monaco: 'c' },
];

function getDefaultStarterCode(langKey: string): string {
  const templates: Record<string, string> = {
    c: `#include <stdio.h>\n\nint main() {\n    // Read input from stdin\n    return 0;\n}\n`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Read input from stdin\n    return 0;\n}\n`,
    java: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Read input from stdin\n    }\n}\n`,
    python: `# Read input from stdin\nimport sys\n\ndef solve():\n    lines = sys.stdin.read().split()\n    if not lines:\n        return\n    # Solution logic here\n\nif __name__ == '__main__':\n    solve()\n`,
    javascript: `const fs = require("fs");\nconst input = fs.readFileSync(0, "utf8").trim();\n`,
  };
  return templates[langKey] || `// Write your ${langKey} solution here\n`;
}

export const CodingWorkspace: React.FC<WorkspaceProps> = ({ question: rawQuestion }) => {
  const question = useMemo(() => normalizeInterviewQuestion(rawQuestion) || rawQuestion, [rawQuestion]);
  const navigate = useNavigate();
  const executeCodeMutation = useExecuteCode();

  const {
    code,
    setCode,
    languageId,
    setLanguageId,
    setLanguageName,
    isRunning,
    setIsRunning,
    setOutput,
    setError,
    setExecutionMetrics,
    resetWorkspace,
    saveCodeForQuestion,
    loadCodeForQuestion,
    setJudgeResponse,
    customInput,
    isFullscreen,
    setIsFullscreen,
    setActiveConsoleTab,
    setLastRunMode,
    addAttemptForQuestion,
  } = useWorkspaceStore();

  const [activeHint, setActiveHint] = useState<number | null>(null);
  const questionIdStr = question?.id ? question.id.toString() : '';

  // Auto-save code on changes
  useEffect(() => {
    if (questionIdStr && code) {
      const activeLang = SUPPORTED_LANGUAGES.find((l) => l.id === languageId)?.key || 'python';
      const timer = setTimeout(() => {
        saveCodeForQuestion(`${questionIdStr}::${activeLang}`, {
          code,
          languageId,
          languageName: activeLang,
        });
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [code, languageId, questionIdStr, saveCodeForQuestion]);

  // Load code on question or language init
  useEffect(() => {
    resetWorkspace();

    if (questionIdStr) {
      const activeLang = SUPPORTED_LANGUAGES.find((l) => l.id === languageId)?.key || 'python';
      const saved = loadCodeForQuestion(`${questionIdStr}::${activeLang}`);
      if (saved && saved.code) {
        setCode(saved.code);
        setLanguageId(saved.languageId);
        setLanguageName(saved.languageName);
        return;
      }
    }

    // Default starter template
    const starter = getDefaultStarterCode('python');
    setLanguageId(71);
    setLanguageName('python');
    setCode(starter);
  }, [questionIdStr, loadCodeForQuestion]);

  const handleLanguageChange = (newLangId: number) => {
    const target = SUPPORTED_LANGUAGES.find((l) => l.id === newLangId);
    if (!target) return;

    // Save current code
    const currentLangKey = SUPPORTED_LANGUAGES.find((l) => l.id === languageId)?.key || 'python';
    if (questionIdStr && code) {
      saveCodeForQuestion(`${questionIdStr}::${currentLangKey}`, {
        code,
        languageId,
        languageName: currentLangKey,
      });
    }

    setLanguageId(target.id);
    setLanguageName(target.key);

    // Restore or load starter code
    const saved = loadCodeForQuestion(`${questionIdStr}::${target.key}`);
    if (saved && saved.code) {
      setCode(saved.code);
    } else {
      setCode(getDefaultStarterCode(target.key));
    }
  };

  const handleResetCode = () => {
    const currentLangKey = SUPPORTED_LANGUAGES.find((l) => l.id === languageId)?.key || 'python';
    setCode(getDefaultStarterCode(currentLangKey));
  };

  const abortControllerRef = useRef<AbortController | null>(null);

  const executeCode = useCallback(async (mode: 'RUN' | 'SUBMIT') => {
    if (!code.trim()) return;

    setIsRunning(true);
    setActiveConsoleTab('results');
    setOutput(null);
    setError(null);
    setExecutionMetrics(null);
    setJudgeResponse(null);

    const isCustomRun = mode === 'RUN' && customInput.trim().length > 0;
    const effectiveRunMode = isCustomRun ? 'CUSTOM_RUN' : mode;
    setLastRunMode(effectiveRunMode);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Prepare test cases
    const allTestCases = question?.metadata?.jsonPayload?.testCases || [];
    let activeCases = [];

    if (mode === 'RUN') {
      if (isCustomRun) {
        activeCases = [
          {
            id: 'custom-stdin-tc',
            input: customInput,
            stdin: customInput,
            expectedOutput: '',
            hidden: false,
            visible: true,
          },
        ];
      } else {
        const visible = allTestCases.filter((tc: any) => tc.hidden === false || tc.visible === true);
        activeCases = visible.length > 0 ? visible : allTestCases.slice(0, 2);
      }
    } else {
      activeCases = allTestCases;
    }

    const currentLangKey = SUPPORTED_LANGUAGES.find((l) => l.id === languageId)?.key || 'python';

    try {
      const res = await executeCodeMutation.mutateAsync({
        executionMode: 'PRACTICE',
        runMode: mode,
        sourceCode: code,
        languageId,
        customInput: isCustomRun ? customInput : undefined,
        questionRefId: questionIdStr,
        signal: abortControllerRef.current.signal,
      } as any);

      const data: any = (res as any)?.data !== undefined && (res as any)?.status === undefined && (res as any)?.results === undefined
        ? (res as any).data
        : res;

      setJudgeResponse(data);

      const isPass = data.success !== false && (data.allPassed || (data.results && data.results.every((r: any) => r.passed)));
      const verdict = data.success === false
        ? data.errorType || 'ERROR'
        : isPass
        ? 'ACCEPTED'
        : 'WRONG_ANSWER';

      const passedCount = data.passedCount !== undefined
        ? data.passedCount
        : data.results?.filter((r: any) => r.passed).length || 0;
      const totalCount = data.totalCount !== undefined
        ? data.totalCount
        : data.results?.length || (isCustomRun ? 0 : 1);

      // Record attempt
      addAttemptForQuestion(questionIdStr, {
        id: `att-${Date.now()}`,
        runMode: effectiveRunMode,
        status: verdict,
        passedCount,
        totalCount,
        language: currentLangKey,
        executionTime: data.time || '0.000',
        timestamp: new Date().toISOString(),
      });

      if (data.success === false) {
        setError(data.message || data.compileOutput || 'Execution failed');
      } else if (data.results) {
        setOutput(data.stdout || null);
      } else {
        setOutput(data.stdout || null);
      }

      setExecutionMetrics({ time: data.time ?? null, memory: data.memory ?? null });
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message?.includes('canceled')) {
        return;
      }
      const errData = err.response?.data;
      const errResult = errData?.data ?? errData;
      const errorMsg = errResult?.message || extractErrorMessage(err, 'Execution failed due to network error');
      setError(errorMsg);
    } finally {
      setIsRunning(false);
      abortControllerRef.current = null;
    }
  }, [code, customInput, languageId, questionIdStr, question, executeCodeMutation]);

  const cancelExecution = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsRunning(false);
    }
  };

  const handleRun = () => executeCode('RUN');
  const handleSubmit = () => executeCode('SUBMIT');

  // ── LEFT: Problem Information Panel ─────────────────────────
  const LeftPanel = (
    <div className="h-full overflow-y-auto p-5 md:p-6 scrollbar-thin space-y-6 text-sm text-gray-300">
      {/* Title & Badges */}
      <div className="space-y-3 border-b border-white/10 pb-4">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white leading-tight">
          {question?.title}
        </h1>
        <div className="flex flex-wrap gap-2 text-xs items-center">
          <StatusBadge status={question?.difficulty || 'MEDIUM'} />
          <Badge variant="secondary">{getDisplayName(question?.category, 'Algorithms')}</Badge>
          <Badge variant="outline">{getDisplayName(question?.topic, 'General')}</Badge>
          {question?.estimatedTime && <span className="text-gray-500">• {question.estimatedTime} mins</span>}
        </div>
        {question?.tags && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {getTagNames(question.tags).map((tag, i) => (
              <span key={i} className="text-[10px] px-2 py-0.5 bg-white/5 text-gray-400 rounded border border-white/10">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Complete Description */}
      <div className="space-y-2">
        <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Problem Description</div>
        <div className="text-xs md:text-sm text-gray-300 leading-relaxed space-y-3">
          {question?.description ? (
            <div dangerouslySetInnerHTML={{ __html: question.description }} />
          ) : (
            <p className="text-gray-500 italic">No description provided.</p>
          )}
        </div>
      </div>

      {/* Input Format */}
      <div className="space-y-2 bg-indigo-950/20 border border-indigo-500/20 rounded-lg p-3.5 text-xs">
        <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5 font-mono">
          <Terminal className="h-3.5 w-3.5" /> Input Format (stdin)
        </div>
        <p className="text-gray-300 leading-relaxed font-sans">
          {question?.title?.includes('Stock')
            ? 'First line contains an integer N (number of prices). Second line contains N space-separated integers representing stock prices.'
            : question?.title?.includes('Two Sum')
            ? 'First line contains N. Second line contains N space-separated integers. Third line contains target integer.'
            : question?.inputFormat || 'Read inputs from standard input (stdin) using standard competitive programming methods (scanf, cin, Scanner, input(), or readFileSync).'}
        </p>
      </div>

      {/* Output Format */}
      <div className="space-y-2 bg-emerald-950/20 border border-emerald-500/20 rounded-lg p-3.5 text-xs">
        <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 font-mono">
          <Terminal className="h-3.5 w-3.5" /> Output Format (stdout)
        </div>
        <p className="text-gray-300 leading-relaxed font-sans">
          {question?.outputFormat || 'Print the required result to standard output (stdout).'}
        </p>
      </div>

      {/* Constraints */}
      {question?.constraints && question.constraints.length > 0 && (
        <div className="space-y-2.5 pt-2 border-t border-white/10">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Constraints</div>
          <ul className="list-disc pl-5 space-y-1 text-xs text-gray-400">
            {question.constraints.map((c: string, i: number) => (
              <li key={i}>
                <code className="font-mono text-[11px] bg-black/40 border border-white/10 px-1.5 py-0.5 rounded text-gray-200">
                  {c}
                </code>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Examples */}
      {question?.examples && question.examples.length > 0 && (
        <div className="space-y-3 pt-2 border-t border-white/10">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Examples</div>
          {question.examples.map((ex: any, i: number) => (
            <div key={i} className="bg-white/3 border border-white/8 rounded-lg p-3.5 space-y-2 font-mono text-xs">
              <div className="flex gap-2">
                <span className="text-gray-500 shrink-0">Input:</span>
                <span className="text-gray-200">{ex.input}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-500 shrink-0">Output:</span>
                <span className="text-emerald-400 font-semibold">{ex.output}</span>
              </div>
              {ex.explanation && (
                <div className="text-gray-400 text-[11px] leading-relaxed pt-1 border-t border-white/5 font-sans">
                  <span className="text-gray-500 font-medium">Explanation: </span>
                  {ex.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Hints */}
      {question?.hints && question.hints.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-white/10 pb-6">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
            <HelpCircle className="h-3.5 w-3.5" /> Hints
          </div>
          <div className="space-y-2">
            {question.hints.map((hint: string, i: number) => (
              <div
                key={i}
                onClick={() => setActiveHint(activeHint === i ? null : i)}
                className="p-3 bg-white/3 border border-white/10 rounded-lg text-xs cursor-pointer hover:bg-white/5 transition-colors"
              >
                <div className="font-semibold text-indigo-400 flex items-center justify-between">
                  <span>Hint {i + 1}</span>
                  <span className="text-gray-500 text-[10px]">{activeHint === i ? 'Hide' : 'Show'}</span>
                </div>
                {activeHint === i && (
                  <p className="text-gray-300 mt-2 leading-relaxed">{hint}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // ── RIGHT: Monaco Editor + Results Console ───────────────────
  const RightPanel = (
    <ResizableGroup orientation="vertical">
      {/* Top Right: Code Editor */}
      <Panel defaultSize={60} minSize={20}>
        <div className="flex flex-col h-full bg-[#121215]">
          {/* Editor Toolbar */}
          <div className="h-11 border-b border-white/10 flex items-center justify-between px-3 bg-[#161b22] shrink-0">
            {/* Language Selector & Reset */}
            <div className="flex items-center gap-2">
              <select
                value={languageId}
                onChange={(e) => handleLanguageChange(Number(e.target.value))}
                className="bg-white/5 text-gray-200 text-xs rounded-md border border-white/10 px-2.5 py-1 outline-none focus:border-indigo-500 cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.id} value={lang.id} className="bg-[#1e1e1e]">
                    {lang.name}
                  </option>
                ))}
              </select>

              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-gray-400 hover:text-gray-200 flex items-center gap-1 cursor-pointer"
                onClick={handleResetCode}
                title="Reset code to standard template"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-gray-400 hover:text-gray-200 cursor-pointer"
                onClick={() => setIsFullscreen(!isFullscreen)}
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </Button>

              <div className="w-px h-4 bg-white/10 mx-0.5" />

              {!isRunning ? (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-7 px-3 text-xs font-semibold bg-blue-600/20 border border-blue-500/40 text-blue-400 hover:bg-blue-600/30 cursor-pointer"
                    onClick={handleRun}
                    leftIcon={<Play className="h-3 w-3 fill-current" />}
                  >
                    Run
                  </Button>

                  <Button
                    size="sm"
                    className="h-7 px-3 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white cursor-pointer"
                    onClick={handleSubmit}
                    leftIcon={<Send className="h-3 w-3" />}
                  >
                    Submit
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-7 px-3 text-xs font-semibold"
                  onClick={cancelExecution}
                  leftIcon={<XCircle className="h-3 w-3" />}
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>

          <CodeEditor />
        </div>
      </Panel>

      <Separator className="h-1 bg-white/10 hover:bg-indigo-500/40 transition-colors cursor-row-resize flex justify-center items-center">
        <div className="w-8 h-0.5 bg-white/20 rounded-full" />
      </Separator>

      {/* Bottom Right: Console */}
      <Panel defaultSize={40} minSize={20}>
        <ExecutionConsole question={question} onRun={handleRun} onSubmit={handleSubmit} />
      </Panel>
    </ResizableGroup>
  );

  return (
    <div className={`flex flex-col bg-[#0d1117] text-gray-200 ${isFullscreen ? 'fixed inset-0 z-50' : 'h-[calc(100vh-4rem)]'}`}>
      {!isFullscreen && (
        <header className="h-11 border-b border-white/10 flex items-center justify-between px-4 bg-[#161b22] shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/student/practice/questions')}
              className="text-gray-400 hover:text-white text-xs cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Back to Questions
            </Button>
            <div className="flex items-center gap-2.5">
              <h1 className="font-semibold text-xs md:text-sm hidden sm:block truncate max-w-md text-white">
                {question?.title}
              </h1>
              <StatusBadge status={question?.difficulty || 'MEDIUM'} />
            </div>
          </div>
        </header>
      )}

      <div className="flex-1 overflow-hidden">
        {isFullscreen ? (
          <div className="w-full h-full bg-[#121215]">
            {RightPanel}
          </div>
        ) : (
          <ResizableGroup orientation="horizontal">
            <Panel defaultSize={40} minSize={25} className="bg-[#0d1117]">
              {LeftPanel}
            </Panel>

            <Separator className="w-1 bg-white/10 hover:bg-indigo-500/40 transition-colors cursor-col-resize flex flex-col justify-center items-center">
              <div className="h-8 w-0.5 bg-white/20 rounded-full" />
            </Separator>

            <Panel defaultSize={60} minSize={30}>
              {RightPanel}
            </Panel>
          </ResizableGroup>
        )}
      </div>
    </div>
  );
};

export default CodingWorkspace;
