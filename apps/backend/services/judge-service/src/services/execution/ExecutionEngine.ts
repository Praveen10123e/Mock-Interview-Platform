import { ExecutionPayload, ExecutionResult, TestCase, TestCaseResult } from './ExecutionContract';
import { ExecutionValidator } from './ExecutionValidator';
import { TestCaseRunner } from './TestCaseRunner';

// ============================================================
// LANGUAGE LOOKUP
// ============================================================
const JUDGE0_LANG_KEY: Record<number, string> = {
  71: 'python',
  93: 'javascript',
  63: 'javascript',
  62: 'java',
  54: 'cpp',
  50: 'c',
};

// ============================================================
// TYPE DEFINITIONS
// ============================================================
export interface NormalizedTestInput {
  displayInput: string;   // What the UI shows to the candidate
  stdin: string;          // EXACT text sent to Judge0 stdin
}

// ============================================================
// CHAR ARRAY DETECTION
// A value is a char array if it's an array of single-character strings
// ============================================================
function isCharArray(val: any): boolean {
  return (
    Array.isArray(val) &&
    val.length > 0 &&
    val.every((item: any) => typeof item === 'string' && item.length === 1)
  );
}

function argToStdinLine(arg: any): string {
  // Char array: ["h","e","l","l","o"] → "hello"
  if (isCharArray(arg)) {
    return (arg as string[]).join('');
  }
  // 1D array of numbers: [7, 1, 5, 3, 6, 4] → "6\n7 1 5 3 6 4"
  if (Array.isArray(arg) && arg.length > 0 && arg.every((item) => typeof item === 'number')) {
    return `${arg.length}\n${arg.join(' ')}`;
  }
  // 1D array of strings: ["leet", "code"] → "2\nleet\ncode"
  if (Array.isArray(arg) && arg.length > 0 && arg.every((item) => typeof item === 'string')) {
    return `${arg.length}\n${arg.join('\n')}`;
  }
  // 2D array of numbers: [[1, 2], [3, 4]] → "2 2\n1 2\n3 4"
  if (Array.isArray(arg) && arg.length > 0 && Array.isArray(arg[0])) {
    const rows = arg.length;
    const cols = arg[0].length;
    return `${rows} ${cols}\n${arg.map((r: any[]) => r.join(' ')).join('\n')}`;
  }
  // Empty array
  if (Array.isArray(arg) && arg.length === 0) {
    return '0';
  }
  // Primitive string: "hello" → "hello" (no JSON quoting)
  if (typeof arg === 'string') {
    return arg;
  }
  // Number, boolean, etc.
  if (typeof arg === 'number' || typeof arg === 'boolean') {
    return String(arg);
  }
  // Arrays and objects → JSON
  return JSON.stringify(arg);
}

// ============================================================
// PARSE RAW INPUT → ORDERED ARG LIST
// Handles all database storage formats:
//   - Primitive: 5 → [5]
//   - Plain string: "hello" → ["hello"]
//   - Char array stored direct: ["h","e","l","l","o"] → [["h","e","l","l","o"]]
//   - arg0/arg1 wrappers: {arg0: [...]} → [[...]]
//   - named params: {nums: [...], target: 9} → [[...], 9]
//   - args list: {args: [...]} → [...]
// ============================================================
function extractArgs(rawInput: any): any[] {
  let parsed = rawInput;

  // If it's a JSON string, parse it first
  if (typeof rawInput === 'string') {
    const trimmed = rawInput.trim();
    if (
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))
    ) {
      try {
        parsed = JSON.parse(trimmed);
      } catch {
        // plain string, treat as single arg
        return [rawInput];
      }
    } else {
      return [rawInput];
    }
  }

  if (parsed === null || parsed === undefined) return [];

  // Plain array (including char arrays)
  if (Array.isArray(parsed)) {
    return [parsed];
  }

  if (typeof parsed === 'object') {
    // {args: [...]} wrapper
    if (Array.isArray(parsed.args)) {
      return parsed.args;
    }

    const keys = Object.keys(parsed);

    // {arg0: ..., arg1: ...} numeric wrapper
    if (keys.length > 0 && keys.every((k) => /^arg\d+$/i.test(k))) {
      const sorted = keys.sort((a, b) => {
        const na = parseInt(a.replace(/arg/i, ''), 10);
        const nb = parseInt(b.replace(/arg/i, ''), 10);
        return na - nb;
      });
      return sorted.map((k) => parsed[k]);
    }

    // {input: ...} meta-wrapper
    if (parsed.input !== undefined) {
      return extractArgs(parsed.input);
    }

    // Named parameter object: {nums: [...], target: 9}
    return Object.values(parsed);
  }

  // Primitive (number, boolean)
  return [parsed];
}

// ============================================================
// NORMALIZE TEST INPUT
// Takes the raw database test case input and returns:
//   displayInput: human-readable representation for UI
//   stdin: EXACT text that will be sent to Judge0
// ============================================================
export function normalizeTestInput(rawInput: any): NormalizedTestInput {
  const args = extractArgs(rawInput);

  if (args.length === 0) {
    return { displayInput: '', stdin: '' };
  }

  // Build stdin: each arg on its own line
  const stdinLines = args.map(argToStdinLine);
  const stdin = stdinLines.join('\n');

  // Build display: show logical representation for UI
  // For char arrays, show ["h","e","l","l","o"] in the UI (logical form)
  // but stdin gets "hello"
  const displayLines = args.map((arg) => {
    if (isCharArray(arg)) return JSON.stringify(arg);
    if (typeof arg === 'string') return arg;
    return JSON.stringify(arg);
  });
  const displayInput = displayLines.join('\n');

  return { displayInput, stdin };
}

// ============================================================
// NORMALIZE DISPLAY OUTPUT
// Formats the expected/actual output for UI display
// ============================================================
export function normalizeDisplayOutput(val: any): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') {
    const trimmed = val.trim();
    // Try parse JSON or Python-style single-quoted arrays
    if (
      (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
      (trimmed.startsWith('{') && trimmed.endsWith('}'))
    ) {
      // Try standard JSON first
      try {
        const p = JSON.parse(trimmed);
        return JSON.stringify(p);
      } catch {
        // Try Python single-quote conversion
        if (trimmed.includes("'") && !trimmed.includes('"')) {
          const jsonStr = trimmed.replace(/'/g, '"');
          try {
            const p = JSON.parse(jsonStr);
            return JSON.stringify(p);
          } catch {
            return trimmed;
          }
        }
        return trimmed;
      }
    }
    return trimmed;
  }
  if (typeof val === 'object') {
    return JSON.stringify(val);
  }
  return String(val);
}

// ============================================================
// STRING NORMALIZATION FOR COMPARISON
// Normalize line endings, trim, etc.
// ============================================================
function normalizeString(str: any): string {
  if (str === null || str === undefined) return '';
  const s = typeof str === 'string' ? str : JSON.stringify(str);
  return s
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .trim();
}

// ============================================================
// DEEP EQUALITY FOR JSON STRUCTURES
// ============================================================
function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null || typeof a !== typeof b) return false;
  if (typeof a !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }
  return true;
}

// ============================================================
// PARSE PYTHON-STYLE SINGLE-QUOTE STRINGS TO JSON
// e.g. ['o','l','l','e','h'] → ["o","l","l","e","h"]
// ============================================================
function parsePythonLikeArray(str: string): any | null {
  if (str.includes("'") && !str.includes('"')) {
    const jsonStr = str.replace(/'/g, '"');
    try {
      return JSON.parse(jsonStr);
    } catch {
      return null;
    }
  }
  return null;
}

// ============================================================
// ARE OUTPUTS EQUAL - DETERMINISTIC CONTRACT-BASED COMPARISON
//
// Comparison strategy (in order):
// 1. Exact normalized string match
// 2. Case-insensitive boolean match (true/false)
// 3. Both parse as valid JSON → deep equality
// 4. Expected is Python-style array → convert and compare
// 5. Expected is JSON array of single chars AND actual is plain string
//    → join expected chars and compare (char-array-as-string)
// 6. Both are numbers → float tolerance 1e-5
// 7. Multiline text comparison
// ============================================================
export function areOutputsEqual(actual: string | null | undefined, expected: any): boolean {
  if (actual === null || actual === undefined) {
    return expected === null || expected === undefined || String(expected).trim() === '';
  }

  const normActual = normalizeString(actual);
  const normExpected = normalizeString(expected);

  // 1. Exact match
  if (normActual === normExpected) return true;

  // 2. Boolean case-insensitive
  const la = normActual.toLowerCase();
  const le = normExpected.toLowerCase();
  if ((le === 'true' || le === 'false') && la === le) return true;

  // 3. Try JSON deep equality
  let parsedActual: any = null;
  let parsedExpected: any = null;
  let actualIsJson = false;
  let expectedIsJson = false;

  const tryParseActual = normActual;
  if (
    (tryParseActual.startsWith('[') && tryParseActual.endsWith(']')) ||
    (tryParseActual.startsWith('{') && tryParseActual.endsWith('}'))
  ) {
    try {
      parsedActual = JSON.parse(tryParseActual);
      actualIsJson = true;
    } catch { /* not JSON */ }
  }

  let tryParseExpected = normExpected;
  if (typeof expected === 'object' && expected !== null) {
    parsedExpected = expected;
    expectedIsJson = true;
  } else {
    if (
      (tryParseExpected.startsWith('[') && tryParseExpected.endsWith(']')) ||
      (tryParseExpected.startsWith('{') && tryParseExpected.endsWith('}'))
    ) {
      try {
        parsedExpected = JSON.parse(tryParseExpected);
        expectedIsJson = true;
      } catch {
        // Try Python single-quote arrays
        const pythonParsed = parsePythonLikeArray(tryParseExpected);
        if (pythonParsed !== null) {
          parsedExpected = pythonParsed;
          expectedIsJson = true;
        }
      }
    } else {
      // Not a JSON-shaped string — try Python single-quote
      const pythonParsed = parsePythonLikeArray(tryParseExpected);
      if (pythonParsed !== null) {
        parsedExpected = pythonParsed;
        expectedIsJson = true;
      }
    }
  }

  // JSON vs JSON deep comparison
  if (actualIsJson && expectedIsJson) {
    if (deepEqual(parsedActual, parsedExpected)) return true;
  }

  // 4. Array vs Space-Separated tokens comparison (e.g. "0 1" vs "[0,1]")
  const spaceTokensActual = normActual.split(/\s+/).filter(Boolean);
  if (expectedIsJson && Array.isArray(parsedExpected)) {
    if (parsedExpected.length === spaceTokensActual.length) {
      const allMatch = parsedExpected.every((expVal: any, idx: number) => {
        return String(expVal).trim() === spaceTokensActual[idx];
      });
      if (allMatch) return true;
    }
  }

  if (actualIsJson && Array.isArray(parsedActual)) {
    const spaceTokensExpected = normExpected.split(/\s+/).filter(Boolean);
    if (parsedActual.length === spaceTokensExpected.length) {
      const allMatch = parsedActual.every((actVal: any, idx: number) => {
        return String(actVal).trim() === spaceTokensExpected[idx];
      });
      if (allMatch) return true;
    }
  }

  // 5. CHAR ARRAY AS STRING:
  // Expected = char array like ["o","l","l","e","h"] or ['o','l','l','e','h']
  // Actual   = plain string like "olleh"
  // → join expected chars and compare
  if (expectedIsJson && parsedExpected !== null) {
    if (
      Array.isArray(parsedExpected) &&
      parsedExpected.length > 0 &&
      parsedExpected.every((x: any) => typeof x === 'string' && x.length === 1)
    ) {
      const joinedExpected = (parsedExpected as string[]).join('');
      if (normActual === joinedExpected) return true;
    }
  }

  // Also handle: actual = JSON char array, expected = plain string
  if (actualIsJson && parsedActual !== null) {
    if (
      Array.isArray(parsedActual) &&
      parsedActual.length > 0 &&
      parsedActual.every((x: any) => typeof x === 'string' && x.length === 1)
    ) {
      const joinedActual = (parsedActual as string[]).join('');
      if (joinedActual === normExpected) return true;
    }
  }

  // 6. Numeric comparison with tolerance
  const numA = Number(normActual.replace(/,/g, ''));
  const numE = Number(normExpected.replace(/,/g, ''));
  if (
    !isNaN(numA) && !isNaN(numE) &&
    normActual.trim() !== '' && normExpected.trim() !== ''
  ) {
    if (Number.isInteger(numA) && Number.isInteger(numE)) {
      if (numA === numE) return true;
    } else {
      if (Math.abs(numA - numE) <= 1e-5) return true;
    }
  }

  // 7. Multiline text (per-line comparison)
  const linesActual = normActual.split('\n').map((l) => l.trimEnd());
  const linesExpected = normExpected.split('\n').map((l) => l.trimEnd());
  if (linesActual.length === linesExpected.length && linesActual.length > 1) {
    if (linesActual.every((l, i) => l === linesExpected[i])) return true;
  }

  return false;
}

// ============================================================
// MAIN EXECUTION ENGINE
// Pure competitive-programming stdin/stdout model
// ============================================================
export class ExecutionEngine {
  static async execute(payload: ExecutionPayload): Promise<ExecutionResult> {
    const {
      runMode = 'SUBMIT',
      languageId,
      sourceCode,
      customInput,
      testCases: rawTestCases,
      examples,
    } = payload;

    const langKey = JUDGE0_LANG_KEY[languageId] || 'python';

    // Source code validation
    const validation = ExecutionValidator.validateSourceCode(sourceCode);
    if (!validation.isValid) {
      return {
        success: false,
        errorType: 'INVALID_QUESTION_CONFIGURATION',
        message: validation.message || 'Source code is required.',
      };
    }

    // Custom input mode (sandbox/debug)
    if (customInput !== undefined && (!rawTestCases || rawTestCases.length === 0)) {
      const runnerResult = await TestCaseRunner.runSingle(sourceCode, languageId, customInput);
      if (!runnerResult.success && runnerResult.errorType === 'COMPILATION_ERROR') {
        return {
          success: false,
          errorType: 'COMPILATION_ERROR',
          message: runnerResult.message || 'Compilation failed.',
          compileOutput: runnerResult.compile_output,
        };
      }
      const singleTime = runnerResult.time ? parseFloat(runnerResult.time) || 0 : 0;
      return {
        success: runnerResult.success,
        runMode,
        language: langKey,
        stdout: runnerResult.stdout,
        stderr: runnerResult.stderr,
        time: runnerResult.time || '0.000',
        totalExecutionTime: singleTime,
        memory: runnerResult.memory || 0,
        peakMemory: runnerResult.memory || 0,
        status: runnerResult.status,
      };
    }

    // Determine active test cases based on RUN vs SUBMIT
    let activeCases: TestCase[] = [];
    if (rawTestCases && rawTestCases.length > 0) {
      if (runMode === 'RUN') {
        const hasVisibilityMeta = rawTestCases.some(
          (tc) => typeof tc.hidden === 'boolean' || typeof tc.visible === 'boolean'
        );
        if (hasVisibilityMeta) {
          activeCases = rawTestCases.filter(
            (tc: any) => tc.hidden === false || tc.visible === true
          );
        } else if (examples && examples.length > 0) {
          activeCases = rawTestCases.slice(0, Math.min(examples.length, rawTestCases.length));
        } else {
          activeCases = rawTestCases.slice(0, Math.min(3, rawTestCases.length));
        }
      } else {
        activeCases = rawTestCases;
      }
    }

    // No test cases → run once with empty stdin
    if (activeCases.length === 0) {
      const runnerResult = await TestCaseRunner.runSingle(sourceCode, languageId, '');
      if (!runnerResult.success && runnerResult.errorType === 'COMPILATION_ERROR') {
        return {
          success: false,
          errorType: 'COMPILATION_ERROR',
          message: runnerResult.message || 'Compilation failed.',
          compileOutput: runnerResult.compile_output,
        };
      }
      const singleTime = runnerResult.time ? parseFloat(runnerResult.time) || 0 : 0;
      return {
        success: runnerResult.success,
        runMode,
        language: langKey,
        stdout: runnerResult.stdout,
        stderr: runnerResult.stderr,
        time: runnerResult.time || '0.000',
        totalExecutionTime: singleTime,
        memory: runnerResult.memory || 0,
        peakMemory: runnerResult.memory || 0,
        status: runnerResult.status,
      };
    }

    // Run EACH test case independently
    const results: TestCaseResult[] = [];
    const scores = this.calculateScores(activeCases);
    let earnedScore = 0;
    let totalPossible = 0;
    let passedCount = 0;
    let totalTime = 0;
    let maxMemory = 0;

    for (let i = 0; i < activeCases.length; i++) {
      const tc = activeCases[i];
      const rawInput = tc.input;
      const rawExpected = tc.expectedOutput !== undefined ? tc.expectedOutput : tc.expected;

      // ─── CENTRALIZED INPUT PIPELINE ───────────────────────
      let stdin = '';
      let cleanDisplayInput = '';

      if (tc.stdin !== undefined && tc.stdin !== null && String(tc.stdin).trim().length > 0) {
        stdin = String(tc.stdin);
        cleanDisplayInput = tc.displayInput !== undefined ? String(tc.displayInput) : (typeof rawInput === 'string' ? rawInput : JSON.stringify(rawInput));
      } else {
        const normalizedInput = normalizeTestInput(rawInput);
        cleanDisplayInput = tc.displayInput || normalizedInput.displayInput;
        stdin = normalizedInput.stdin;
      }

      // Step 3: Format expected for display
      const cleanExpected = normalizeDisplayOutput(rawExpected);

      // ─── MANDATORY DEBUG LOG ──────────────────────────────
      console.log(`\n========== EXECUTION DEBUG ==========`);
      console.log(`MODE: ${runMode}`);
      console.log(`TEST CASE ID: ${tc.id || tc.testCaseId || String(i + 1)}`);
      console.log(`LANGUAGE: ${langKey.toUpperCase()}`);
      console.log(`LOGICAL INPUT: ${JSON.stringify(rawInput)}`);
      console.log(`GENERATED STDIN (exact):\n${stdin}`);
      console.log(`JUDGE0 STDIN EXACT:\n${stdin}`);
      console.log(`LOGICAL EXPECTED OUTPUT: ${JSON.stringify(rawExpected)}`);
      console.log(`====================================`);

      // ─── EXECUTE EXACT SOURCE CODE ON JUDGE0 ─────────────
      const exec = await TestCaseRunner.runSingle(sourceCode, languageId, stdin);

      // ─── POST-EXECUTION DEBUG LOG ─────────────────────────
      const isMatch = exec.success && areOutputsEqual(exec.stdout, rawExpected);

      console.log(`\n========== EXECUTION RESULT ==========`);
      console.log(`STATUS: ${exec.success ? 'OK' : exec.errorType || 'FAILED'}`);
      console.log(`ACTUAL STDOUT: ${JSON.stringify(exec.stdout)}`);
      console.log(`STDERR: ${JSON.stringify(exec.stderr)}`);
      console.log(`EXECUTION TIME: ${exec.time}`);
      console.log(`MEMORY: ${exec.memory}`);
      console.log(`NORMALIZED ACTUAL OUTPUT: ${JSON.stringify(normalizeString(exec.stdout))}`);
      console.log(`NORMALIZED EXPECTED OUTPUT: ${JSON.stringify(normalizeString(rawExpected))}`);
      console.log(`COMPARISON RESULT: ${isMatch ? 'PASS' : 'FAIL'}`);
      console.log(`======================================`);

      // Compilation error → abort immediately
      if (exec.errorType === 'COMPILATION_ERROR') {
        return {
          success: false,
          errorType: 'COMPILATION_ERROR',
          message: exec.compile_output || exec.message || 'Compilation failed.',
          compileOutput: exec.compile_output,
          language: langKey,
          runMode,
        };
      }

      const tcScore = scores[i] || 0;
      totalPossible += tcScore;
      if (isMatch) {
        earnedScore += tcScore;
        passedCount++;
      }

      const execTimeNum = exec.time ? parseFloat(exec.time) || 0 : 0;
      totalTime += execTimeNum;
      if (exec.memory) maxMemory = Math.max(maxMemory, exec.memory);

      // Build actual display output
      const actualDisplay = exec.stderr && !exec.success
        ? `${exec.stdout ? exec.stdout + '\n' : ''}${exec.stderr}`
        : normalizeDisplayOutput(exec.stdout);

      // Status classification
      let tcStatus: 'ACCEPTED' | 'WRONG_ANSWER' | 'COMPILATION_ERROR' | 'RUNTIME_ERROR' | 'TIME_LIMIT_EXCEEDED' | 'PLATFORM_ERROR' = 'WRONG_ANSWER';
      if (!exec.success) {
        if (exec.errorType === 'COMPILER_SERVICE_UNAVAILABLE') {
          tcStatus = 'PLATFORM_ERROR';
        } else if (
          exec.errorType === 'USER_CODE_TIME_LIMIT_EXCEEDED' ||
          exec.errorType === 'TIME_LIMIT_EXCEEDED' ||
          exec.errorType === 'EXECUTION_TIMEOUT'
        ) {
          tcStatus = 'TIME_LIMIT_EXCEEDED';
        } else {
          tcStatus = 'RUNTIME_ERROR';
        }
      } else if (isMatch) {
        tcStatus = 'ACCEPTED';
      } else {
        tcStatus = 'WRONG_ANSWER';
      }

      const tcResult: TestCaseResult = {
        testCaseId: tc.id || tc.testCaseId || String(i + 1),
        index: i + 1,
        status: tcStatus,
        passed: isMatch,
        executionTime: execTimeNum,
        time: exec.time || execTimeNum.toFixed(3),
        memory: exec.memory || 0,
        input: cleanDisplayInput,
        expectedOutput: cleanExpected,
        expected: cleanExpected,
        actualOutput: actualDisplay,
        actual: actualDisplay,
        hidden: !!tc.hidden,
        score: tcScore,
      };

      // Scrub hidden test data on SUBMIT
      if (runMode === 'SUBMIT' && tc.hidden) {
        tcResult.input = '<hidden>';
        tcResult.expected = '<hidden>';
        tcResult.expectedOutput = '<hidden>';
        tcResult.actual = isMatch ? '<hidden>' : 'Failed hidden test case';
        tcResult.actualOutput = isMatch ? '<hidden>' : 'Failed hidden test case';
      }

      results.push(tcResult);
    }

    const allPassed = passedCount === activeCases.length;

    return {
      success: true,
      runMode,
      language: langKey,
      passedCount,
      totalCount: activeCases.length,
      allPassed,
      score: Math.round(earnedScore),
      totalScore: Math.round(totalPossible),
      results,
      time: totalTime > 0 ? totalTime.toFixed(3) : '0.000',
      totalExecutionTime: totalTime > 0 ? parseFloat(totalTime.toFixed(3)) : 0,
      memory: maxMemory,
      peakMemory: maxMemory,
      stdout: results
        .map((r, i) => `Test Case ${i + 1}: ${r.passed ? 'ACCEPTED' : r.status} (${r.executionTime}s)`)
        .join('\n'),
    };
  }

  private static calculateScores(testCases: TestCase[]): number[] {
    const n = testCases.length;
    if (n === 0) return [];
    const hasWeights = testCases.every((tc) => typeof tc.weight === 'number');
    if (hasWeights) return testCases.map((tc) => tc.weight as number);
    const base = Math.floor(100 / n);
    const remainder = 100 - base * n;
    return testCases.map((_, i) => (i === n - 1 ? base + remainder : base));
  }
}
