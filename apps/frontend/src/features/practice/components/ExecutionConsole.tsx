import React, { useState } from 'react';
import { useWorkspaceStore } from '../../../store/useWorkspaceStore';
import {
  Terminal, Clock, Cpu, AlertTriangle, CheckCircle2,
  Play, XCircle, Code2, Clock3, RotateCcw,
} from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';

import { normalizeInterviewQuestion } from '../../../utils/normalizeQuestion';

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

export const ExecutionConsole: React.FC<{
  question?: any;
  onRun?: () => void;
  onSubmit?: () => void;
}> = ({ question: rawQuestion, onRun, onSubmit }) => {
  const question = normalizeInterviewQuestion(rawQuestion) || rawQuestion;

  const {
    isRunning,
    error,
    executionMetrics,
    judgeResponse,
    activeConsoleTab,
    setActiveConsoleTab,
    selectedTestCaseIndex,
    setSelectedTestCaseIndex,
    customInput,
    setCustomInput,
    lastRunMode,
    getAttemptsForQuestion,
  } = useWorkspaceStore();

  const [expandedTest, setExpandedTest] = useState<number | null>(null);

  const questionId = question?.id ? question.id.toString() : '';
  const attempts = getAttemptsForQuestion(questionId);

  // Extract visible test cases from metadata, testCases, or examples
  const rawTestCases = question?.testCases || question?.metadata?.jsonPayload?.testCases || [];
  const visibleTestCases = rawTestCases.filter(
    (tc: any) => tc.visibility !== 'HIDDEN' && !tc.hidden && !tc.isHidden
  );

  const sampleCases = visibleTestCases.length > 0
    ? visibleTestCases.map((tc: any, idx: number) => ({
        id: tc.id || `sample-${idx + 1}`,
        input: typeof tc.input === 'object' ? JSON.stringify(tc.input) : String(tc.displayInput || tc.input || ''),
        expectedOutput: String(tc.expectedOutput || tc.expected || ''),
        displayInput: String(tc.displayInput || (typeof tc.input === 'object' ? JSON.stringify(tc.input) : tc.input) || ''),
        explanation: tc.explanation || '',
        hidden: false,
      }))
    : (question?.examples || []).map((ex: any, idx: number) => ({
        id: `sample-${idx + 1}`,
        input: typeof ex.input === 'string' ? ex.input : JSON.stringify(ex.input),
        expectedOutput: typeof ex.output === 'string' ? ex.output : JSON.stringify(ex.output),
        displayInput: typeof ex.input === 'string' ? ex.input : JSON.stringify(ex.input),
        explanation: ex.explanation || '',
        hidden: false,
      }));

  const activeSample = sampleCases[selectedTestCaseIndex] || sampleCases[0];

  return (
    <div className="h-full flex flex-col bg-[#0d1117] border-t border-white/10 overflow-hidden font-sans">
      {/* ── Console Header Navigation ─────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 bg-[#161b22] border-b border-white/10 shrink-0 h-10">
        <div className="flex items-center gap-1 h-full">
          {/* Tab 1: Test Cases */}
          <button
            onClick={() => setActiveConsoleTab('testcases')}
            className={`px-3 py-1 h-full text-xs font-semibold flex items-center gap-1.5 transition-colors border-b-2 cursor-pointer ${
              activeConsoleTab === 'testcases'
                ? 'text-indigo-400 border-indigo-500 bg-indigo-500/5'
                : 'text-gray-400 border-transparent hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Test Cases ({sampleCases.length})
          </button>

          {/* Tab 2: Test Results */}
          <button
            onClick={() => setActiveConsoleTab('results')}
            className={`px-3 py-1 h-full text-xs font-semibold flex items-center gap-1.5 transition-colors border-b-2 cursor-pointer ${
              activeConsoleTab === 'results'
                ? 'text-indigo-400 border-indigo-500 bg-indigo-500/5'
                : 'text-gray-400 border-transparent hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            <Terminal className="h-3.5 w-3.5" />
            {lastRunMode === 'RUN' ? 'Run Results' : lastRunMode === 'CUSTOM_RUN' ? 'Custom Run Results' : 'Test Results'}
          </button>

          {/* Tab 3: Custom Input */}
          <button
            onClick={() => setActiveConsoleTab('customInput')}
            className={`px-3 py-1 h-full text-xs font-semibold flex items-center gap-1.5 transition-colors border-b-2 cursor-pointer ${
              activeConsoleTab === 'customInput'
                ? 'text-indigo-400 border-indigo-500 bg-indigo-500/5'
                : 'text-gray-400 border-transparent hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            Custom Input
            {customInput.trim() && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 ml-0.5" />}
          </button>

          {/* Tab 4: Attempts */}
          <button
            onClick={() => setActiveConsoleTab('attempts')}
            className={`px-3 py-1 h-full text-xs font-semibold flex items-center gap-1.5 transition-colors border-b-2 cursor-pointer ${
              activeConsoleTab === 'attempts'
                ? 'text-indigo-400 border-indigo-500 bg-indigo-500/5'
                : 'text-gray-400 border-transparent hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            <Clock3 className="h-3.5 w-3.5" />
            Attempts ({attempts.length})
          </button>
        </div>

        {/* Status / Metrics */}
        {executionMetrics && !isRunning && (
          <div className="flex items-center gap-3 text-xs text-gray-400 font-mono">
            {executionMetrics.time != null && (
              <span className="flex items-center gap-1" title="Execution Time">
                <Clock className="h-3 w-3 text-gray-500" /> {formatTime(executionMetrics.time)}
              </span>
            )}
            {executionMetrics.memory != null && (
              <span className="flex items-center gap-1" title="Peak Memory">
                <Cpu className="h-3 w-3 text-gray-500" /> {formatMemory(executionMetrics.memory)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Console Body ─────────────────────────────────────────────── */}
      <div className="flex-1 p-4 overflow-y-auto scrollbar-thin text-xs">
        {/* ── TAB 1: TEST CASES (Sample / Visible Test Cases) ─────────── */}
        {activeConsoleTab === 'testcases' && (
          <div className="space-y-4">
            {/* Case selector pills */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              {sampleCases.map((tc: any, idx: number) => (
                <button
                  key={tc.id || idx}
                  onClick={() => setSelectedTestCaseIndex(idx)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    selectedTestCaseIndex === idx
                      ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200'
                  }`}
                >
                  Case {idx + 1}
                </button>
              ))}
            </div>

            {/* Selected case details */}
            {activeSample ? (
              <div className="space-y-3 font-mono">
                <div>
                  <div className="text-[11px] font-sans font-semibold uppercase tracking-wider text-gray-400 mb-1">
                    Input
                  </div>
                  <pre className="p-3 bg-black/40 border border-white/10 rounded-lg text-gray-200 whitespace-pre-wrap">
                    {typeof activeSample.input === 'object'
                      ? JSON.stringify(activeSample.input, null, 2)
                      : String(activeSample.displayInput || activeSample.input || '')}
                  </pre>
                </div>

                <div>
                  <div className="text-[11px] font-sans font-semibold uppercase tracking-wider text-gray-400 mb-1">
                    Expected Output
                  </div>
                  <pre className="p-3 bg-black/40 border border-white/10 rounded-lg text-emerald-400 font-semibold whitespace-pre-wrap">
                    {String(activeSample.expectedOutput || activeSample.expected || '')}
                  </pre>
                </div>

                {activeSample.explanation && (
                  <div className="font-sans text-xs text-gray-400 bg-white/3 border border-white/5 p-3 rounded-lg">
                    <span className="text-gray-500 font-medium">Explanation: </span>
                    {activeSample.explanation}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 italic">No sample test cases available.</p>
            )}
          </div>
        )}

        {/* ── TAB 2: TEST RESULTS ────────────────────────────────────── */}
        {activeConsoleTab === 'results' && (
          <div>
            {isRunning ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-blue-400">
                <Play className="h-8 w-8 animate-pulse fill-current opacity-80" />
                <span className="animate-pulse tracking-wide font-semibold text-xs font-sans">
                  Executing code directly on Judge0 with test stdin...
                </span>
                <span className="text-[11px] text-gray-500 font-sans">
                  Real runtime execution — no simulation
                </span>
              </div>
            ) : error || (judgeResponse && judgeResponse.success === false) ? (
              /* Compilation / Runtime / System Error */
              <div className="space-y-4 font-mono">
                <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-2">
                  <div className="flex items-center gap-2 font-bold font-sans text-sm text-rose-400">
                    <AlertTriangle className="h-4 w-4" />
                    {judgeResponse?.errorType || 'Execution Error'}
                  </div>
                  <pre className="text-xs whitespace-pre-wrap max-h-60 overflow-y-auto scrollbar-thin">
                    {judgeResponse?.compileOutput ||
                     judgeResponse?.message ||
                     error ||
                     'Compilation or runtime error occurred.'}
                  </pre>
                </div>
              </div>
            ) : judgeResponse?.results ? (
              /* Full Results Table / List */
              <div className="space-y-5 pb-6">
                {/* Header Banner */}
                <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    {judgeResponse.allPassed || judgeResponse.results.every((r: any) => r.passed) ? (
                      <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                        <CheckCircle2 className="h-5 w-5" />
                        <span>Accepted</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                        <XCircle className="h-5 w-5" />
                        <span>Wrong Answer</span>
                      </div>
                    )}
                    <span className="text-xs text-gray-400 font-mono ml-2">
                      {judgeResponse.passedCount !== undefined
                        ? `${judgeResponse.passedCount} / ${judgeResponse.totalCount}`
                        : `${judgeResponse.results.filter((r: any) => r.passed).length} / ${judgeResponse.results.length}`}{' '}
                      test cases passed
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono">
                    {judgeResponse.runMode && (
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        judgeResponse.runMode === 'RUN'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      }`}>
                        {judgeResponse.runMode === 'RUN' ? 'Sample Run' : 'Full Submit'}
                      </span>
                    )}
                    {judgeResponse.time && (
                      <span className="text-gray-400">Time: {formatTime(judgeResponse.time)}</span>
                    )}
                  </div>
                </div>

                {/* Test case rows */}
                <div className="space-y-2">
                  {judgeResponse.results.map((r: any, idx: number) => (
                    <div
                      key={idx}
                      onClick={() => setExpandedTest(expandedTest === idx ? null : idx)}
                      className={`p-3 rounded-lg border transition-all cursor-pointer ${
                        r.passed
                          ? 'bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10'
                          : 'bg-rose-500/5 border-rose-500/20 hover:bg-rose-500/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 font-mono">
                          {r.passed ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                          ) : (
                            <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
                          )}
                          <span className="font-semibold text-gray-200">
                            Test #{idx + 1}
                            {r.hidden && <span className="ml-2 text-xs text-gray-500 font-sans">(hidden)</span>}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 font-mono text-xs text-gray-400">
                          {r.executionTime != null && <span>{formatTime(r.executionTime)}</span>}
                          <span className={`font-semibold ${r.passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {r.passed ? 'PASSED' : r.status || 'FAILED'}
                          </span>
                        </div>
                      </div>

                      {/* Expanded details */}
                      {expandedTest === idx && !r.hidden && (
                        <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-2 font-mono text-xs">
                          <div>
                            <span className="text-gray-500 text-[10px] uppercase tracking-wider block mb-0.5">Input</span>
                            <pre className="p-2 bg-black/40 rounded border border-white/5 text-gray-300 whitespace-pre-wrap">
                              {r.input}
                            </pre>
                          </div>
                          <div>
                            <span className="text-gray-500 text-[10px] uppercase tracking-wider block mb-0.5">Expected</span>
                            <pre className="p-2 bg-black/40 rounded border border-white/5 text-emerald-400 font-semibold whitespace-pre-wrap">
                              {r.expected || r.expectedOutput}
                            </pre>
                          </div>
                          <div className="md:col-span-2">
                            <span className="text-gray-500 text-[10px] uppercase tracking-wider block mb-0.5">Your Output</span>
                            <pre className={`p-2 bg-black/40 rounded border border-white/5 whitespace-pre-wrap ${
                              r.passed ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'
                            }`}>
                              {r.actual || r.actualOutput || '<empty>'}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : judgeResponse?.stdout !== undefined ? (
              /* Custom Run / Single Output */
              <div className="space-y-3 font-mono">
                <div className="text-[11px] font-sans font-semibold uppercase tracking-wider text-gray-400">
                  Standard Output (stdout)
                </div>
                <pre className="p-3 bg-black/40 border border-white/10 rounded-lg text-gray-200 whitespace-pre-wrap">
                  {judgeResponse.stdout || '<No output printed>'}
                </pre>
                {judgeResponse.stderr && (
                  <div>
                    <div className="text-[11px] font-sans font-semibold uppercase tracking-wider text-rose-400 mb-1">
                      Standard Error (stderr)
                    </div>
                    <pre className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-300 whitespace-pre-wrap">
                      {judgeResponse.stderr}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500 space-y-2">
                <Terminal className="h-8 w-8 mx-auto opacity-40 text-gray-400" />
                <p className="text-xs">Click <strong>Run</strong> for sample test execution or <strong>Submit</strong> for full assessment.</p>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: CUSTOM INPUT ────────────────────────────────────── */}
        {activeConsoleTab === 'customInput' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-gray-400 font-sans">
              <span>Enter raw test case input (delivered directly to standard input stdin):</span>
              {customInput && (
                <button
                  onClick={() => setCustomInput('')}
                  className="text-xs text-rose-400 hover:underline cursor-pointer"
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
              className="w-full p-3 font-mono text-xs bg-black/40 border border-white/10 rounded-lg text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-indigo-500 resize-none"
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-gray-500 font-mono">
                Custom input runs independently without affecting practice statistics.
              </span>
              <Button
                size="sm"
                variant="secondary"
                disabled={isRunning}
                onClick={onRun}
                className="h-8 px-3.5 text-xs font-semibold"
                leftIcon={<Play className="h-3.5 w-3.5 fill-current" />}
              >
                Run Custom Input
              </Button>
            </div>
          </div>
        )}

        {/* ── TAB 4: ATTEMPTS (History) ──────────────────────────────── */}
        {activeConsoleTab === 'attempts' && (
          <div className="space-y-3 font-sans">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Problem Submission & Execution History
            </h4>
            {attempts.length > 0 ? (
              <div className="space-y-2">
                {attempts.map((att: any, idx: number) => (
                  <div
                    key={att.id || idx}
                    className="p-3 rounded-lg border border-white/10 bg-white/3 flex items-center justify-between text-xs font-mono"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500">#{att.attemptNumber || attempts.length - idx}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          att.runMode === 'SUBMIT'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : att.runMode === 'CUSTOM_RUN'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
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
              <p className="text-xs text-gray-500 italic">No execution attempts recorded yet for this problem.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
