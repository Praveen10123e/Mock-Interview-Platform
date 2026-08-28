import { ExecutionMetadata } from './ExecutionTypes';

export interface TestCase {
  id?: string;
  testCaseId?: string;
  input: any;
  stdin?: string;
  displayInput?: string;
  expectedOutput?: any;
  expected?: any;
  hidden?: boolean;
  visible?: boolean;
  weight?: number;
}

export interface ExecutionPayload {
  executionMode: 'INTERVIEW' | 'PRACTICE';
  runMode?: 'RUN' | 'SUBMIT';
  interviewId?: string;
  questionRefId?: string;
  questionId?: string;
  studentId: string;
  languageId: number;
  sourceCode: string;
  customInput?: string;
  testCases?: TestCase[];
  execution?: ExecutionMetadata;
  examples?: any[];
}

export interface TestCaseResult {
  testCaseId?: string;
  index?: number;
  passed: boolean;
  status: string;
  input?: any;
  expected?: any;
  expectedOutput?: any;
  actual?: any;
  actualOutput?: any;
  executionTime?: number;
  time?: string | number;
  memory?: number;
  hidden?: boolean;
  score?: number;
}

export interface ExecutionResult {
  success: boolean;
  errorType?: string;
  message?: string;
  
  language?: string;
  runMode?: string;
  passedCount?: number;
  totalCount?: number;
  allPassed?: boolean;
  score?: number;
  totalScore?: number;
  time?: string | number;
  totalExecutionTime?: number;
  memory?: number;
  peakMemory?: number;
  results?: TestCaseResult[];
  
  stdout?: string | null;
  stderr?: string | null;
  compileOutput?: string | null;
  
  status?: {
    id: number;
    description: string;
  };
}
