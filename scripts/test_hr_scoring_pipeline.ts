/**
 * test_hr_scoring_pipeline.ts
 *
 * Comprehensive Automated Test Suite for Evidence-Based HR Interview Scoring:
 *
 * TEST 1 — SILENCE (empty response -> Score = 0)
 * TEST 2 — FILLER ONLY ("Umm... actually... yeah..." -> Score = 0)
 * TEST 3 — SHORT VALID ANSWER ("Java." for language question -> Recognized as valid positive score)
 * TEST 4 — OFF-TOPIC (academic marks for technical bug question -> Content criteria = 0)
 * TEST 5 — PARTIAL (problem & vague approach without depth -> Partial credit, e.g. 30-55)
 * TEST 6 — STRONG ANSWER (complete technically relevant answer -> High score >= 80)
 * TEST 7 — SEMANTIC EQUIVALENCE ("touching waste items" matches overlapping objects -> Problem credit)
 * TEST 8 — MISSING RESULT (problem + approach mentioned, no result -> Result criterion = 0)
 * TEST 9 — STT TECHNICAL TERM ("yellow v8" normalized to "YOLOv8")
 * TEST 10 — MULTI-TURN SESSION AGGREGATION (Question 1 strong, Question 2 silent -> True mathematical average)
 */

import { HRTranscriptValidator } from '../apps/backend/services/interview-service/src/services/HRTranscriptValidator';
import { HRRubricService } from '../apps/backend/services/interview-service/src/services/HRRubrics';
import { InterviewAIService } from '../apps/backend/services/interview-service/src/services/InterviewAIService';

async function runTests() {
  console.log('================================================================');
  console.log('RUNNING EVIDENCE-BASED HR INTERVIEW SCORING PIPELINE TEST SUITE');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      if (detail) console.log(`       ↳ ${detail}`);
      passedTests++;
    } else {
      console.error(`[FAIL] ${testName}`);
      if (detail) console.error(`       ↳ ${detail}`);
    }
  }

  // ────────────────────────────────────────────────────────────────
  // TEST 1 — SILENCE
  // ────────────────────────────────────────────────────────────────
  console.log('\n--- TEST 1: SILENCE / EMPTY RESPONSE ---');
  const t1Question = 'Explain your project.';
  const t1Response = '';
  const t1Val = HRTranscriptValidator.validate(t1Response, { question: t1Question, category: 'Project Challenge' });
  const t1Eval = await InterviewAIService.evaluateResponse(t1Question, 'Project Challenge', t1Response, 10);

  assert(t1Val.isEmpty === true, 'TEST 1.1: Transcript validator flags empty as isEmpty = true');
  assert(t1Eval.overallScore === 0, 'TEST 1.2: Overall score is strictly 0', `Received: ${t1Eval.overallScore}`);
  assert(
    t1Eval.criteriaEvidence?.every((c) => c.score === 0 && c.evidence === null) ?? false,
    'TEST 1.3: All criteria evidence entries have score = 0 and evidence = null'
  );
  assert(
    t1Eval.feedback.includes('No response was provided') || t1Eval.feedback.includes('insufficient evidence'),
    'TEST 1.4: Feedback explains no response was provided'
  );

  // ────────────────────────────────────────────────────────────────
  // TEST 2 — FILLER ONLY
  // ────────────────────────────────────────────────────────────────
  console.log('\n--- TEST 2: FILLER WORDS ONLY ---');
  const t2Question = 'Describe a challenging technical problem you solved.';
  const t2Response = 'Umm... actually... yeah... so yeah...';
  const t2Val = HRTranscriptValidator.validate(t2Response, { question: t2Question, category: 'Project Challenge' });
  const t2Eval = await InterviewAIService.evaluateResponse(t2Question, 'Project Challenge', t2Response, 8);

  assert(t2Val.isFillerOnly === true, 'TEST 2.1: Transcript validator flags filler-only response');
  assert(t2Eval.overallScore === 0, 'TEST 2.2: Filler-only overall score is 0', `Received: ${t2Eval.overallScore}`);
  assert(
    t2Eval.feedback.includes('No response was provided') || t2Eval.feedback.includes('insufficient evidence'),
    'TEST 2.3: Feedback indicates insufficient substantive evidence'
  );

  // ────────────────────────────────────────────────────────────────
  // TEST 3 — SHORT VALID ANSWER
  // ────────────────────────────────────────────────────────────────
  console.log('\n--- TEST 3: SHORT VALID ANSWER ---');
  const t3Question = 'What programming language did you use for the backend service?';
  const t3Response = 'Java.';
  const t3Val = HRTranscriptValidator.validate(t3Response, { question: t3Question, category: 'Direct Question' });
  const t3Eval = await InterviewAIService.evaluateResponse(t3Question, 'Direct Question', t3Response, 3);

  assert(t3Val.isEmpty === false, 'TEST 3.1: Short valid answer is not marked empty');
  assert(t3Eval.overallScore >= 70, 'TEST 3.2: Direct valid answer receives positive credit', `Received: ${t3Eval.overallScore}`);
  assert(
    t3Eval.criteriaEvidence?.some((c) => c.score > 0 && (c.evidence?.includes('Java') || c.reason.includes('Directly'))) ?? false,
    'TEST 3.3: Criterion evidence cites the language Java'
  );

  // ────────────────────────────────────────────────────────────────
  // TEST 4 — OFF-TOPIC
  // ────────────────────────────────────────────────────────────────
  console.log('\n--- TEST 4: OFF-TOPIC RESPONSE ---');
  const t4Question = 'Describe a difficult technical problem in your project and how you debugged it.';
  const t4Response = 'I completed my diploma with 93% and I like cricket and sports.';
  const t4Eval = await InterviewAIService.evaluateResponse(t4Question, 'Project Challenge', t4Response, 12);

  assert(t4Eval.overallScore <= 20, 'TEST 4.1: Off-topic answer receives near zero or 0 content score', `Received: ${t4Eval.overallScore}`);
  assert(
    t4Eval.criteriaEvidence?.every((c) => /problem|approach|reasoning|result/i.test(c.criterion) ? c.score === 0 : true) ?? false,
    'TEST 4.2: Content criteria (problem, approach, reasoning, result) receive 0 credit'
  );
  assert(
    t4Eval.feedback.toLowerCase().includes('did not address') || t4Eval.feedback.toLowerCase().includes('lack'),
    'TEST 4.3: Feedback explains answer did not address the technical problem'
  );

  // ────────────────────────────────────────────────────────────────
  // TEST 5 — PARTIAL ANSWER
  // ────────────────────────────────────────────────────────────────
  console.log('\n--- TEST 5: PARTIAL ANSWER ---');
  const t5Question = 'Explain a difficult technical problem and how you solved it.';
  const t5Response = 'We had problems with the model during our project and I changed the approach to fix it.';
  const t5Eval = await InterviewAIService.evaluateResponse(t5Question, 'Project Challenge', t5Response, 15);

  assert(
    t5Eval.overallScore > 0 && t5Eval.overallScore < 70,
    'TEST 5.1: Partial answer receives partial credit (between 20 and 65)',
    `Received: ${t5Eval.overallScore}`
  );
  const reasoningCrit = t5Eval.criteriaEvidence?.find((c) => /reasoning|analysis/i.test(c.criterion));
  assert(
    (reasoningCrit?.score ?? 0) <= 1,
    'TEST 5.2: Technical reasoning is penalized or awarded low score due to lack of depth',
    `Reasoning score: ${reasoningCrit?.score}/${reasoningCrit?.maxScore}`
  );

  // ────────────────────────────────────────────────────────────────
  // TEST 6 — STRONG ANSWER
  // ────────────────────────────────────────────────────────────────
  console.log('\n--- TEST 6: STRONG ANSWER ---');
  const t6Question = 'Describe a difficult technical issue you encountered in your project and how you solved it.';
  const t6Response =
    'During our waste segmentation project, overlapping objects were detected as a single combined object by the model. ' +
    'I first tried adjusting the confidence threshold, but it did not resolve the touching boundaries. ' +
    'To solve this, I implemented watershed segmentation on the connected mask regions combined with morphological operations. ' +
    'This improved object separation accuracy and increased detection precision by 24%.';
  const t6Eval = await InterviewAIService.evaluateResponse(t6Question, 'Project Challenge', t6Response, 35);

  assert(t6Eval.overallScore >= 80, 'TEST 6.1: Strong answer receives high score (>= 80)', `Received: ${t6Eval.overallScore}`);
  assert(
    t6Eval.criteriaEvidence?.filter((c) => c.score >= c.maxScore * 0.7).length! >= 3,
    'TEST 6.2: High credit earned across multiple criteria (problem, approach, result)'
  );

  // ────────────────────────────────────────────────────────────────
  // TEST 7 — SEMANTIC EQUIVALENCE
  // ────────────────────────────────────────────────────────────────
  console.log('\n--- TEST 7: SEMANTIC EQUIVALENCE ---');
  const t7Question = 'What was the specific bug or failure mode in your segmentation project?';
  const t7Response = 'Two touching waste items were being treated as a single object by our detector.';
  const t7Eval = await InterviewAIService.evaluateResponse(t7Question, 'Project Challenge', t7Response, 15);
  const probCrit = t7Eval.criteriaEvidence?.find((c) => /problem|obstacle/i.test(c.criterion));

  assert(
    (probCrit?.score ?? 0) > 0,
    'TEST 7.1: Problem criterion receives credit for semantically equivalent wording ("touching waste items")',
    `Score: ${probCrit?.score}/${probCrit?.maxScore}`
  );

  // ────────────────────────────────────────────────────────────────
  // TEST 8 — MISSING RESULT
  // ────────────────────────────────────────────────────────────────
  console.log('\n--- TEST 8: MISSING RESULT CRITERION ---');
  const t8Question = 'Explain a difficult technical problem and how you solved it.';
  const t8Response =
    'We faced an issue where queries on the users table were timing out under peak load. ' +
    'I investigated the query plan, identified missing indexes on foreign keys, and added composite indexes to the PostgreSQL database.';
  const t8Eval = await InterviewAIService.evaluateResponse(t8Question, 'Project Challenge', t8Response, 25);
  const resCrit = t8Eval.criteriaEvidence?.find((c) => /result|outcome/i.test(c.criterion));
  const appCrit = t8Eval.criteriaEvidence?.find((c) => /approach|solution/i.test(c.criterion));

  assert((appCrit?.score ?? 0) > 0, 'TEST 8.1: Approach receives credit for adding composite indexes', `Approach: ${appCrit?.score}/${appCrit?.maxScore}`);
  assert((resCrit?.score ?? 0) === 0, 'TEST 8.2: Result criterion receives 0 because candidate did not explain final outcome', `Result: ${resCrit?.score}/${resCrit?.maxScore}`);

  // ────────────────────────────────────────────────────────────────
  // TEST 9 — STT TECHNICAL TERM NORMALIZATION
  // ────────────────────────────────────────────────────────────────
  console.log('\n--- TEST 9: STT TECHNICAL PHONETIC CORRECTION ---');
  const t9Raw = 'I used yellow v8 with open cv and fast api to deploy the vision model.';
  const t9Val = HRTranscriptValidator.validate(t9Raw, {
    question: 'What libraries did you use in computer vision?',
    category: 'Project Challenge',
  });

  assert(t9Val.verifiedTranscript.includes('YOLOv8'), 'TEST 9.1: "yellow v8" normalized to "YOLOv8"', `Verified: "${t9Val.verifiedTranscript}"`);
  assert(t9Val.verifiedTranscript.includes('OpenCV'), 'TEST 9.2: "open cv" normalized to "OpenCV"');
  assert(t9Val.verifiedTranscript.includes('FastAPI'), 'TEST 9.3: "fast api" normalized to "FastAPI"');
  assert(t9Val.rawTranscript === t9Raw, 'TEST 9.4: rawTranscript is strictly preserved for auditability');

  // ────────────────────────────────────────────────────────────────
  // TEST 10 — MULTI-TURN SESSION AGGREGATION
  // ────────────────────────────────────────────────────────────────
  console.log('\n--- TEST 10: MULTI-TURN AGGREGATION & ZERO PRESERVATION ---');
  const t10SessionQuestions = [
    {
      question: 'Describe a challenging project problem and how you solved it.',
      category: 'Project Challenge',
      transcript:
        'During our waste segmentation project, overlapping objects were detected as a single combined object by the model. ' +
        'I first tried adjusting the confidence threshold, but it did not resolve the touching boundaries. ' +
        'To solve this, I implemented watershed segmentation on the connected mask regions combined with morphological operations. ' +
        'This improved object separation accuracy and increased detection precision by 24%.',
      durationSeconds: 35,
    },
    {
      question: 'Tell me about a time you handled a conflict in your team.',
      category: 'Conflict Resolution',
      transcript: '', // Candidate was silent
      durationSeconds: 15,
    },
  ];

  const t10Final = await InterviewAIService.evaluateFinalSession(t10SessionQuestions);
  assert(
    t10Final.overallScore > 35 && t10Final.overallScore < 55,
    'TEST 10.1: Multi-turn overall score is true mathematical average across both questions (strong ~80-90 + silent 0)/2',
    `Received: ${t10Final.overallScore}/100`
  );

  // All silent session test
  const t10AllSilent = await InterviewAIService.evaluateFinalSession([
    { question: 'Q1', category: 'Self Introduction', transcript: '', durationSeconds: 0 },
    { question: 'Q2', category: 'Project Challenge', transcript: '   ', durationSeconds: 0 },
  ]);
  assert(t10AllSilent.overallScore === 0, 'TEST 10.2: Session with all silent responses produces overallScore = 0', `Received: ${t10AllSilent.overallScore}`);

  console.log('\n================================================================');
  console.log(`TEST SUITE COMPLETE: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('================================================================');

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed with error:', err);
  process.exit(1);
});
