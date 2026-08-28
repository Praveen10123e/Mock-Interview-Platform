import { PrismaClient } from './generated/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

function toFloat(val: any, fallback = 0): number {
  if (val !== null && val !== undefined && val !== '') {
    const num = Number(val);
    return isNaN(num) ? fallback : num;
  }
  return fallback;
}

function toInt(val: any, fallback = 0): number {
  if (val !== null && val !== undefined && val !== '') {
    const num = parseInt(String(val), 10);
    return isNaN(num) ? fallback : num;
  }
  return fallback;
}

export async function recordExecution(
  sessionId: string,
  questionRefId: string,
  languageId: number,
  runMode: 'RUN' | 'SUBMIT',
  sourceCode: string,
  judgeResult: any,
  questionMeta: any
) {
  const passedCount = toInt(judgeResult.passedCount, 0);
  const totalCount = toInt(judgeResult.totalCount, 0);

  let primaryErrorType = judgeResult.errorType || null;
  let statusDesc = judgeResult.status?.description || judgeResult.statusDescription || 'Unknown';

  if (judgeResult.compileOutput || judgeResult.compile_output) {
    primaryErrorType = 'COMPILATION_ERROR';
    statusDesc = 'Compilation Error';
  }

  // Detect runtime or compilation errors across test cases
  if (judgeResult.results && Array.isArray(judgeResult.results)) {
    for (const r of judgeResult.results) {
      const desc = r.status?.description || r.status || '';
      const out = r.studentOutput || r.actualOutput || r.stdout || '';
      if (
        (typeof desc === 'string' && desc.includes('Runtime Error')) ||
        (typeof out === 'string' && (out.includes('Traceback (most recent call last)') || out.includes('RuntimeError') || out.includes('Exception')))
      ) {
        primaryErrorType = 'RUNTIME_ERROR';
        statusDesc = 'Runtime Error';
        break;
      } else if (typeof desc === 'string' && desc.includes('Compilation Error')) {
        primaryErrorType = 'COMPILATION_ERROR';
        statusDesc = 'Compilation Error';
        break;
      } else if (typeof desc === 'string' && desc.includes('Time Limit')) {
        primaryErrorType = 'TIME_LIMIT_EXCEEDED';
        statusDesc = 'Time Limit Exceeded';
        break;
      } else if (typeof desc === 'string' && desc.includes('Memory Limit')) {
        primaryErrorType = 'MEMORY_LIMIT_EXCEEDED';
        statusDesc = 'Memory Limit Exceeded';
        break;
      }
    }
  }

  let status = 'FAILED';
  if (primaryErrorType === 'COMPILATION_ERROR' || statusDesc.includes('Compilation Error')) {
    status = 'COMPILATION_ERROR';
    primaryErrorType = 'COMPILATION_ERROR';
  } else if (primaryErrorType === 'RUNTIME_ERROR' || statusDesc.includes('Runtime Error')) {
    status = 'RUNTIME_ERROR';
    primaryErrorType = 'RUNTIME_ERROR';
  } else if (primaryErrorType === 'TIME_LIMIT_EXCEEDED') {
    status = 'TIME_LIMIT_EXCEEDED';
  } else if (primaryErrorType === 'MEMORY_LIMIT_EXCEEDED') {
    status = 'MEMORY_LIMIT_EXCEEDED';
  } else if (passedCount === totalCount && totalCount > 0) {
    status = runMode === 'SUBMIT' ? 'ACCEPTED' : 'RUN_PASSED';
  } else if (passedCount > 0 && passedCount < totalCount) {
    status = 'PARTIALLY_SOLVED';
  } else {
    status = runMode === 'SUBMIT' ? 'WRONG_ANSWER' : 'RUN_ATTEMPTED';
  }

  // Calculate visible vs hidden
  let visiblePassedCount = 0;
  let hiddenPassedCount = 0;
  let visibleTotalCount = 0;
  let hiddenTotalCount = 0;

  if (judgeResult.results && Array.isArray(judgeResult.results)) {
    judgeResult.results.forEach((r: any) => {
      const isHidden = r.hidden === true || r.isHidden === true;
      const isPassed = r.passed === true || r.status?.id === 3 || r.status === 'Passed';
      if (isHidden) {
        hiddenTotalCount++;
        if (isPassed) hiddenPassedCount++;
      } else {
        visibleTotalCount++;
        if (isPassed) visiblePassedCount++;
      }
    });
  } else {
    // Fallback if judge doesn't return per-testcase results
    visibleTotalCount = toInt(judgeResult.totalCount);
    visiblePassedCount = toInt(judgeResult.passedCount);
  }

  const sourceCodeHash = crypto.createHash('sha256').update(sourceCode || '').digest('hex');
  const sourceCodeLength = sourceCode?.length || 0;

  // Safe numeric field conversions
  const score = toFloat(judgeResult.score, 0);
  const executionTime = toFloat(judgeResult.time ?? judgeResult.executionTime, 0);
  const memory = toFloat(judgeResult.memory, 0);

  // Transaction to safely generate attemptNumber and upsert final result
  await prisma.$transaction(async (tx) => {
    const prevAttempts = await tx.interviewExecutionRecord.findMany({
      where: { sessionId, questionRefId },
      orderBy: { attemptNumber: 'desc' },
      take: 1
    });

    const nextAttempt = prevAttempts.length > 0 ? prevAttempts[0].attemptNumber + 1 : 1;
    const changedFromPrevious = prevAttempts.length > 0 ? prevAttempts[0].sourceCodeHash !== sourceCodeHash : true;

    // Create record
    const record = await tx.interviewExecutionRecord.create({
      data: {
        sessionId,
        questionRefId,
        language: String(languageId),
        runMode,
        status,
        statusDescription: statusDesc,
        passedCount,
        totalCount,
        score,
        executionTime,
        memory,
        compileOutput: judgeResult.compile_output || judgeResult.compileOutput || null,
        stdout: judgeResult.stdout || null,
        stderr: judgeResult.stderr || judgeResult.message || null,
        testCaseResults: judgeResult.results || null,
        primaryErrorType,
        attemptNumber: nextAttempt,
        visiblePassedCount: toInt(visiblePassedCount, 0),
        hiddenPassedCount: toInt(hiddenPassedCount, 0),
        visibleTotalCount: toInt(visibleTotalCount, 0),
        hiddenTotalCount: toInt(hiddenTotalCount, 0),
        sourceCode: sourceCode || null,
        sourceCodeHash,
        sourceCodeLength: toInt(sourceCodeLength, 0),
        changedFromPrevious,
        questionTitle: questionMeta?.title || 'Unknown Question',
        questionTopic: typeof questionMeta?.topic === 'string' ? questionMeta.topic : (questionMeta?.topic?.name || null),
        questionTags: questionMeta?.tags || [],
        questionDifficulty: questionMeta?.difficulty || 'Medium'
      }
    });

    // Update Question Result
    const existingResult = await tx.interviewQuestionResult.findUnique({
      where: { sessionId_questionRefId: { sessionId, questionRefId } }
    });

    let newFinalStatus = existingResult?.finalStatus || 'NOT_ATTEMPTED';
    let newFinalScore = toFloat(existingResult?.finalScore, 0);
    let newTotalScore = toFloat(existingResult?.totalScore, 0);
    let newPassedCount = toInt(existingResult?.passedCount, 0);
    let newTotalCount = toInt(existingResult?.totalCount, 0);
    let latestRunRecordId = existingResult?.latestRunRecordId;
    let latestSubmitRecordId = existingResult?.latestSubmitRecordId;

    if (status !== 'PLATFORM_ERROR') {
      if (runMode === 'SUBMIT') {
        latestSubmitRecordId = record.id;
        newFinalStatus = status;
        newFinalScore = toFloat(record.score, 0);
        newTotalScore = toFloat(judgeResult.totalScore, 0);
        newPassedCount = toInt(record.passedCount, 0);
        newTotalCount = toInt(record.totalCount, 0);
      } else {
        latestRunRecordId = record.id;
        // If no submit yet, run is provisional final
        if (!existingResult?.latestSubmitRecordId) {
          newFinalStatus = status; // RUN_PASSED or RUN_ATTEMPTED
          newFinalScore = toFloat(record.score, 0);
          newTotalScore = toFloat(judgeResult.totalScore, 0);
          newPassedCount = toInt(record.passedCount, 0);
          newTotalCount = toInt(record.totalCount, 0);
        }
      }
    }

    await tx.interviewQuestionResult.upsert({
      where: { sessionId_questionRefId: { sessionId, questionRefId } },
      create: {
        sessionId,
        questionRefId,
        finalStatus: newFinalStatus,
        finalScore: newFinalScore,
        totalScore: newTotalScore,
        passedCount: newPassedCount,
        totalCount: newTotalCount,
        latestRunRecordId,
        latestSubmitRecordId
      },
      update: {
        finalStatus: newFinalStatus,
        finalScore: newFinalScore,
        totalScore: newTotalScore,
        passedCount: newPassedCount,
        totalCount: newTotalCount,
        latestRunRecordId,
        latestSubmitRecordId
      }
    });
  });
}
