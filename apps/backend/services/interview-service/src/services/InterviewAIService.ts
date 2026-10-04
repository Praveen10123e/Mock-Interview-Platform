/**
 * InterviewAIService.ts
 *
 * Core AI engine for the HR Behavioral Interview Module.
 * - Question generation from curated bank (20+ placement behavioral questions)
 * - Dynamic follow-up generation via Groq LLM with deterministic fallback
 * - Evidence-based question-specific rubric evaluation
 * - Deterministic scoring engine with traceable criterion evidence
 */

import axios from 'axios';
import { HRTranscriptValidator } from './HRTranscriptValidator';
import {
  HRRubricService,
  QuestionRubric,
  CriterionEvidenceResult,
  DeterministicEvaluationResult,
} from './HRRubrics';

const LLM_PROVIDER = (process.env.LLM_PROVIDER || 'GROQ').toUpperCase();
const LLM_API_KEY = process.env.LLM_API_KEY || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

// ─── Curated Behavioral Question Bank ─────────────────────────────────────────

export interface CuratedQuestion {
  question: string;
  category: 'Self Introduction' | 'Project Challenge' | 'Teamwork' | 'Conflict Resolution' | 'Ownership' | 'Leadership' | 'Adaptability' | 'Situational';
  sequence: number;
}

const BEHAVIORAL_QUESTION_BANK: CuratedQuestion[] = [
  // --- Self Introduction (Always First) ---
  {
    question: 'Please introduce yourself. Tell me about your academic background, your core technical skills, and what motivated you to pursue a career in software engineering.',
    category: 'Self Introduction',
    sequence: 1,
  },
  // --- Project Challenge ---
  {
    question: 'Describe the most technically challenging project you have worked on. What was the problem, what was your approach, and what were the measurable outcomes?',
    category: 'Project Challenge',
    sequence: 2,
  },
  {
    question: 'Tell me about a time when you had to learn a new technology, framework, or programming language under a tight deadline. How did you approach the learning curve?',
    category: 'Project Challenge',
    sequence: 2,
  },
  {
    question: 'Walk me through a scenario where your initial technical solution did not work as expected. How did you debug and pivot to reach the final solution?',
    category: 'Project Challenge',
    sequence: 2,
  },
  // --- Teamwork ---
  {
    question: 'Describe a situation where you collaborated effectively with a diverse team to deliver a product feature or resolve a critical bug. What was your specific contribution?',
    category: 'Teamwork',
    sequence: 3,
  },
  {
    question: 'Tell me about a time when you had to work with team members who had different technical opinions than you. How did you reach consensus?',
    category: 'Teamwork',
    sequence: 3,
  },
  // --- Conflict Resolution ---
  {
    question: 'Give me an example of a conflict or disagreement you had with a teammate or supervisor. How did you handle it, and what was the result?',
    category: 'Conflict Resolution',
    sequence: 3,
  },
  {
    question: 'Describe a time when you had to manage competing priorities from multiple stakeholders. How did you decide what to focus on and how did you communicate that?',
    category: 'Conflict Resolution',
    sequence: 3,
  },
  // --- Ownership ---
  {
    question: 'Tell me about a situation where you took initiative and went beyond what was asked of you to ensure a project or task succeeded.',
    category: 'Ownership',
    sequence: 4,
  },
  {
    question: 'Describe a time when something went wrong on a project you were responsible for. What did you do to fix it and what did you learn?',
    category: 'Ownership',
    sequence: 4,
  },
  // --- Leadership ---
  {
    question: 'Describe a time you led a team or sub-team, even informally. How did you motivate your teammates and ensure everyone was aligned on the goal?',
    category: 'Leadership',
    sequence: 4,
  },
  // --- Adaptability ---
  {
    question: 'Describe a time when project requirements changed significantly in the middle of development. How did you adapt and what was the final outcome?',
    category: 'Adaptability',
    sequence: 4,
  },
  {
    question: 'Tell me about a time you had to work in an environment or with tools that were completely unfamiliar to you. How did you manage?',
    category: 'Adaptability',
    sequence: 4,
  },
  // --- Situational ---
  {
    question: 'Imagine you are given a critical bug in production with no clear documentation, and the original developer is unavailable. Walk me through your debugging strategy.',
    category: 'Situational',
    sequence: 4,
  },
  {
    question: 'You join a new team and discover that the codebase has significant technical debt. How would you approach improving it while still delivering new features on schedule?',
    category: 'Situational',
    sequence: 4,
  },
];

// Deterministic follow-up bank (fallback when LLM unavailable)
const DETERMINISTIC_FOLLOWUPS: Record<string, string[]> = {
  'Self Introduction': [
    'You mentioned your technical skills — can you elaborate on one project where you directly applied one of those skills to solve a real problem?',
    'What specific aspect of software engineering excites you the most, and how are you actively building expertise in that area?',
  ],
  'Project Challenge': [
    'Could you describe a specific technical edge case or bug you encountered in that project and how you resolved it step by step?',
    'Looking back, what is one architectural or design decision from that project you would approach differently today, and why?',
    'How did you communicate your technical approach to non-technical teammates or stakeholders?',
  ],
  'Teamwork': [
    'What specific actions did you take to keep the team aligned when there was ambiguity in requirements?',
    'How did you handle a situation where a teammate was not delivering their part of the work on time?',
  ],
  'Conflict Resolution': [
    'What was the most difficult part of that conversation, and what specific technique helped you de-escalate?',
    'What did you learn about working with people from that experience that you now apply proactively?',
  ],
  'Ownership': [
    'How did you measure the success of your initiative? What were the quantifiable outcomes?',
    'What risks did you identify upfront before taking that initiative, and how did you mitigate them?',
  ],
  'Leadership': [
    'How did you identify and leverage each team member\'s individual strengths to maximize the team\'s output?',
    'What was the hardest feedback you had to give to a teammate, and how did you deliver it constructively?',
  ],
  'Adaptability': [
    'Specifically, what learning resources or strategies helped you get up to speed the fastest?',
    'How did the experience of adapting to that change affect your approach to future uncertainties?',
  ],
  'Situational': [
    'In that scenario, how would you communicate your debugging progress and any blockers to your manager without creating panic?',
    'What documentation would you create after resolving the situation to prevent recurrence?',
  ],
};

// ─── Evaluation Types ──────────────────────────────────────────────────────────

export interface BehavioralEvaluation {
  communicationScore: number;
  problemSolvingScore: number;
  teamworkScore: number;
  professionalismScore: number;
  relevanceScore: number;
  clarityScore: number;
  ownershipScore: number;
  leadershipScore: number;
  confidenceScore: number;
  structureScore: number;
  overallScore: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  starGuidance: string;
  aiSummary: string;
  criteriaEvidence?: CriterionEvidenceResult[];
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function isLLMAvailable(): boolean {
  return LLM_PROVIDER === 'GROQ' && !!LLM_API_KEY && LLM_API_KEY.length > 10;
}

async function callGroq(messages: Array<{ role: string; content: string }>, maxTokens = 600): Promise<string> {
  const response = await axios.post(
    GROQ_API_URL,
    {
      model: GROQ_MODEL,
      messages,
      max_tokens: maxTokens,
      temperature: 0.2, // Low temperature for deterministic scoring consistency
    },
    {
      headers: {
        Authorization: `Bearer ${LLM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 18000,
    }
  );
  return response.data?.choices?.[0]?.message?.content?.trim() || '';
}

function clamp(score: number): number {
  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Deterministic Heuristic Evaluator (used when LLM is offline or fails).
 * Strictly evidence-based: NO arbitrary base 48! Points are awarded strictly
 * based on verified evidence matching the question's rubric criteria.
 */
function heuristicEvaluation(
  question: string,
  category: string,
  verifiedTranscript: string,
  durationSeconds: number
): DeterministicEvaluationResult {
  const rubric = HRRubricService.getRubricForQuestion(question, category);
  const words = verifiedTranscript.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  if (wordCount === 0) {
    return HRRubricService.calculateDeterministicScore(
      rubric,
      rubric.criteria.map((c) => ({
        criterion: c.name,
        maxScore: c.maxScore,
        score: 0,
        evidence: null,
        reason: 'No response was provided, so there was insufficient evidence to evaluate this question.',
      })),
      'NO_RESPONSE',
      durationSeconds,
      0
    );
  }

  // Check for Direct Concise Question (e.g. "What programming language did you use?" -> "Java.")
  if (rubric.isDirectEntityQuestion) {
    const isKnownEntity = /\b(java|python|javascript|typescript|c\+\+|c#|go|rust|sql|html|css|react|node|docker|aws)\b/i.test(verifiedTranscript);
    if (isKnownEntity) {
      const criteriaResults: CriterionEvidenceResult[] = [
        {
          criterion: rubric.criteria[0].name,
          maxScore: rubric.criteria[0].maxScore,
          score: rubric.criteria[0].maxScore,
          evidence: `Candidate explicitly stated: "${verifiedTranscript}"`,
          reason: 'Directly and accurately answered the specific entity question.',
        },
        {
          criterion: rubric.criteria[1].name,
          maxScore: rubric.criteria[1].maxScore,
          score: rubric.criteria[1].maxScore,
          evidence: `Candidate communicated clearly without confusion.`,
          reason: 'Clear and concise answer.',
        },
      ];
      return HRRubricService.calculateDeterministicScore(rubric, criteriaResults, 'ON_TOPIC', durationSeconds, wordCount);
    }
  }

  // Off-topic detection
  const qLower = question.toLowerCase();
  const tLower = verifiedTranscript.toLowerCase();

  const isTechnicalQuestion = /challeng|problem|project|bug|debug|error|solution|scale/i.test(qLower);
  const hasTechnicalEvidence = /(model|segment|object|threshold|watershed|detect|yolo|algorithm|database|api|backend|frontend|code|server|pipeline|accuracy|loss|mask|split|feature|system|service|deploy)/i.test(tLower);
  const isPureAcademicOffTopic = /(diploma|marks|percentage|cgpa|school|college|hobbies|cricket|sports)/i.test(tLower) && !hasTechnicalEvidence;

  if (isTechnicalQuestion && isPureAcademicOffTopic) {
    return HRRubricService.calculateDeterministicScore(
      rubric,
      rubric.criteria.map((c) => ({
        criterion: c.name,
        maxScore: c.maxScore,
        score: 0,
        evidence: null,
        reason: 'Response did not address the technical challenge or problem asked in the question.',
      })),
      'OFF_TOPIC',
      durationSeconds,
      wordCount
    );
  }

  // Semantic evidence extraction across standard dimensions.
  // NOTE: For Self Introduction, 'approach evidence' = technical skill/stack mentions (Python, React, etc.)
  //       For Project Challenge, 'approach evidence' = verbs like 'implemented', 'built', etc.
  const hasProblemEvidence = /\b(fail\w*|error\w*|bug\w*|issue\w*|problem\w*|difficult\w*|challeng\w*|obstacle\w*|bottleneck\w*|slow\w*|crash\w*|touching|overlap\w*|broken|limit\w*|timeout\w*|timing\s+out|project\w*|task\w*|deadline|require\w*)\b/i.test(verifiedTranscript);
  const hasApproachEvidence = /\b(used|implement\w*|built|appli\w*|algorithm\w*|method\w*|model\w*|approach\w*|solution\w*|watershed|split\w*|morphological|fix\w*|adjust\w*|threshold|cache|caching|index\w*|refactor\w*|optimi\w*|investigat\w*|add\w*|tun\w*|quer\w*|plan|database|python|java(?:script)?|react|node|django|flask|fastapi|spring|sql|html|css|angular|vue|typescript|c\+\+|c#|go\b|rust\b|kotlin|swift|php|ruby|scala|tensorflow|pytorch|scikit|pandas|numpy|docker|kubernetes|aws|azure|git\b|linux|back.?end|front.?end|full.?stack|api\b|machine.learning|deep.learning|neural|computer.vision|nlp|specification\w*|develop\w*|creat\w*|design\w*)\b/i.test(verifiedTranscript);
  const hasReasoningEvidence = /\b(because|why|reason\w*|initial\w*|tried|instead|since|tradeoff\w*|analy\w*|cause\w*|root|so that|in order to|due to|as a result of|to improv|wanted to|decided to|chose|prefer\w*)\b/i.test(verifiedTranscript);
  const hasResultEvidence = /\b(result\w*|outcome\w*|improv\w*|resolv\w*|success\w*|accura\w*|separat\w*|solv\w*|reduc\w*|percent|%|final\w*|deliver\w*|boost\w*|gain\w*|complet\w*|achiev\w*|finish\w*)\b/i.test(verifiedTranscript);
  const hasLearningEvidence = /\b(learn\w*|takeaway\w*|realiz\w*|future|growth|reflection|interest\w*|passion\w*|motivat\w*|aspir\w*|career\w*|pursu\w*)\b/i.test(verifiedTranscript);

  const criteriaResults: CriterionEvidenceResult[] = rubric.criteria.map((crit) => {
    const id = crit.id;
    const maxScore = crit.maxScore;

    if (id.includes('problem') || id.includes('obstacle') || id.includes('disagree') || id.includes('change')) {
      if (hasProblemEvidence) {
        const score = wordCount >= 15 ? maxScore : Math.max(1, maxScore - 1);
        return {
          criterion: crit.name,
          maxScore,
          score,
          evidence: `Candidate described the obstacle or challenge: "${verifiedTranscript.slice(0, 100)}..."`,
          reason: 'Clear problem identification communicated.',
        };
      }
      return {
        criterion: crit.name,
        maxScore,
        score: 0,
        evidence: null,
        reason: 'Candidate did not clearly define the specific obstacle or problem.',
      };
    }

    if (id.includes('approach') || id.includes('solution') || id.includes('contribution') || id.includes('action') || id.includes('technical_skills')) {
      if (hasApproachEvidence) {
        const score = wordCount >= 20 ? maxScore : Math.max(1, Math.floor(maxScore / 2));
        return {
          criterion: crit.name,
          maxScore,
          score,
          evidence: `Candidate explained technical approach and implementation.`,
          reason: score === maxScore ? 'Detailed solution approach articulated.' : 'Partial solution mentioned without full technical detail.',
        };
      }
      return {
        criterion: crit.name,
        maxScore,
        score: 0,
        evidence: null,
        reason: 'Candidate did not describe the technical approach or specific actions taken.',
      };
    }

    if (id.includes('reasoning') || id.includes('analysis') || id.includes('consensus') || id.includes('strategy')) {
      if (hasReasoningEvidence) {
        return {
          criterion: crit.name,
          maxScore,
          score: maxScore,
          evidence: `Candidate provided technical reasoning and explanation of why choices were made.`,
          reason: 'Solid cause-and-effect reasoning demonstrated.',
        };
      } else if (hasApproachEvidence && wordCount >= 25) {
        // Partial credit for implicit technical rationale
        return {
          criterion: crit.name,
          maxScore,
          score: Math.max(1, Math.floor(maxScore / 2)),
          evidence: `Candidate described steps taken with partial implicit reasoning.`,
          reason: 'Partial technical reasoning; could articulate tradeoffs more explicitly.',
        };
      }
      return {
        criterion: crit.name,
        maxScore,
        score: 0,
        evidence: null,
        reason: 'Candidate did not explain the technical reasoning or root cause.',
      };
    }

    if (id.includes('result') || id.includes('outcome') || id.includes('impact') || id.includes('delivery')) {
      if (hasResultEvidence) {
        return {
          criterion: crit.name,
          maxScore,
          score: maxScore,
          evidence: `Candidate stated measurable impact or final resolution.`,
          reason: 'Clear outcome and resolution provided.',
        };
      }
      return {
        criterion: crit.name,
        maxScore,
        score: 0,
        evidence: null,
        reason: 'Candidate did not describe the final outcome or impact of their work.',
      };
    }

    // Communication / reflection
    const commScore = wordCount >= 15 ? maxScore : Math.max(1, Math.floor(maxScore / 2));
    return {
      criterion: crit.name,
      maxScore,
      score: commScore,
      evidence: `Response was coherent and understandable (${wordCount} words).`,
      reason: 'Communicated in an intelligible and structured manner.',
    };
  });

  const relevanceStatus = wordCount >= 15 && hasProblemEvidence && hasApproachEvidence
    ? 'ON_TOPIC'
    : (hasProblemEvidence || hasApproachEvidence)
    ? 'PARTIALLY_RELEVANT'
    : 'OFF_TOPIC';

  return HRRubricService.calculateDeterministicScore(
    rubric,
    criteriaResults,
    relevanceStatus,
    durationSeconds,
    wordCount
  );
}

// ─── Public API ────────────────────────────────────────────────────────────────

export class InterviewAIService {
  /**
   * Select interview questions for an HR session.
   * Always starts with Self Introduction, then randomly selects from pool.
   */
  static selectSessionQuestions(count: number = 3): CuratedQuestion[] {
    const introQ = BEHAVIORAL_QUESTION_BANK.find((q) => q.category === 'Self Introduction')!;
    const pool = BEHAVIORAL_QUESTION_BANK.filter((q) => q.category !== 'Self Introduction');
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, count - 1);
    return [introQ, ...selected];
  }

  /**
   * Generate a context-aware follow-up question.
   * Falls back to deterministic bank if LLM unavailable.
   */
  static async generateFollowUp(
    mainQuestion: string,
    category: string,
    candidateTranscript: string,
    role = 'Software Engineer'
  ): Promise<string> {
    const val = HRTranscriptValidator.validate(candidateTranscript, { question: mainQuestion, category });
    if (val.isEmpty || val.isFillerOnly || val.isNonResponsive || val.wordCount < 4) {
      return 'Could you elaborate a bit more with a specific technical example?';
    }
    if (!isLLMAvailable()) {
      const pool = DETERMINISTIC_FOLLOWUPS[category] || DETERMINISTIC_FOLLOWUPS['Project Challenge'];
      return pool[Math.floor(Math.random() * pool.length)];
    }

    const systemPrompt = `You are a professional technical HR interviewer for a ${role} position. Your tone is professional, empathetic, and precise.`;
    const userPrompt = `You just asked: "${mainQuestion}"\n\nThe candidate responded: "${val.verifiedTranscript.substring(0, 800)}"\n\nGenerate ONE targeted follow-up question (1–2 sentences) probing deeper into a specific aspect of their answer — a concrete example, measurable outcome, or technical detail. Output ONLY the question, nothing else.`;

    try {
      const result = await callGroq([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ], 150);
      return result || DETERMINISTIC_FOLLOWUPS['Project Challenge'][0];
    } catch {
      const pool = DETERMINISTIC_FOLLOWUPS[category] || DETERMINISTIC_FOLLOWUPS['Project Challenge'];
      return pool[Math.floor(Math.random() * pool.length)];
    }
  }

  /**
   * Evaluate a single candidate response across all behavioral dimensions
   * with evidence-based rubric scoring.
   */
  static async evaluateResponse(
    question: string,
    category: string,
    rawTranscript: string,
    durationSeconds: number
  ): Promise<BehavioralEvaluation> {
    // 1. STEP 1: Validate transcript and check for empty / silence / filler
    const val = HRTranscriptValidator.validate(rawTranscript, { question, category });
    const rubric = HRRubricService.getRubricForQuestion(question, category);

    // CRITICAL GUARD: If empty, filler-only, or non-responsive, score is strictly 0.
    // Do NOT call scoring LLM for empty response.
    if (val.isEmpty || val.isFillerOnly || val.isNonResponsive) {
      const zeroResult = HRRubricService.calculateDeterministicScore(
        rubric,
        rubric.criteria.map((c) => ({
          criterion: c.name,
          maxScore: c.maxScore,
          score: 0,
          evidence: null,
          reason: val.rejectionReason || 'No response was provided, so there was insufficient evidence to evaluate this question.',
        })),
        'NO_RESPONSE',
        durationSeconds,
        0
      );

      return {
        ...zeroResult.dimensions,
        overallScore: 0,
        feedback: zeroResult.feedback,
        strengths: zeroResult.strengths,
        improvements: zeroResult.improvements,
        starGuidance: zeroResult.starGuidance,
        aiSummary: `Question: "${question}" — Score: 0/100. Insufficient evidence: ${val.rejectionReason}`,
        criteriaEvidence: zeroResult.criteriaResults,
      };
    }

    // 2. STEP 2: Candidate provided speech -> Evaluate against question-specific rubric
    if (!isLLMAvailable()) {
      const heuristic = heuristicEvaluation(question, category, val.verifiedTranscript, durationSeconds);
      return {
        ...heuristic.dimensions,
        overallScore: heuristic.overallScore,
        feedback: heuristic.feedback,
        strengths: heuristic.strengths,
        improvements: heuristic.improvements,
        starGuidance: heuristic.starGuidance,
        aiSummary: `Candidate response evaluated via deterministic rubric. Score: ${heuristic.overallScore}/100.`,
        criteriaEvidence: heuristic.criteriaResults,
      };
    }

    // 3. STEP 3: LLM Evidence Extraction
    const criteriaDescriptionList = rubric.criteria
      .map(
        (c) =>
          `- Criterion "${c.name}" (id: "${c.id}", maxScore: ${c.maxScore}): ${c.description}. Semantic signals: ${c.semanticExpectations.join('; ')}`
      )
      .join('\n');

    const systemPrompt = `You are an expert technical and HR interview evaluator assessing a candidate's spoken response.
Your evaluation MUST BE EVIDENCE-BASED, adhering strictly to these rules:
1. NO EVIDENCE -> NO CREDIT. If the candidate did not mention something, award 0 points for that criterion. Never assume or fabricate.
2. PARTIAL CREDIT: If the candidate partially addressed the criterion or lacked technical detail, award partial points (e.g. 1 out of 2).
3. SEMANTIC POINT DETECTION: Do NOT require rigid keyword matches. Accept semantic equivalence (e.g., "touching objects were detected as one" is equivalent to "overlapping object segmentation error").
4. NATURAL SPEECH: Do not penalize natural pauses, informal phrasing, or minor grammatical imperfections if the technical/behavioral information was communicated.
5. OFF-TOPIC ANSWERS: If the candidate answer does NOT address the question (e.g., talking about academic percentages when asked about a technical bug), mark "relevanceStatus": "OFF_TOPIC" and give 0 points for content criteria.
6. Return ONLY valid JSON matching the exact schema specified. No markdown, no explanations outside JSON.`;

    const userPrompt = `EVALUATION TASK:
Question: "${question}"
Category: "${category}"
Candidate's Verified Transcript: "${val.verifiedTranscript}"
Response Duration: ${durationSeconds} seconds

RUBRIC CRITERIA:
${criteriaDescriptionList}

Return JSON with this schema:
{
  "relevanceStatus": "ON_TOPIC" | "PARTIALLY_RELEVANT" | "OFF_TOPIC",
  "criteriaResults": [
    {
      "id": "<criterion id>",
      "criterion": "<criterion name>",
      "score": <number between 0 and maxScore>,
      "maxScore": <maxScore>,
      "evidence": "<exact quote or semantic phrase from transcript supporting the score, or null if missing>",
      "reason": "<1 concise sentence explaining the score awarded>"
    }
  ]
}`;

    try {
      const llmText = await callGroq([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ], 700);

      const jsonStart = llmText.indexOf('{');
      const jsonEnd = llmText.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const parsed = JSON.parse(llmText.substring(jsonStart, jsonEnd + 1));
        const relevanceStatus = parsed.relevanceStatus || 'ON_TOPIC';
        const rawResults = Array.isArray(parsed.criteriaResults) ? parsed.criteriaResults : [];

        // Map and validate criteria results against the rubric
        const alignedResults: CriterionEvidenceResult[] = rubric.criteria.map((c) => {
          const matched = rawResults.find((r: any) => r.id === c.id || r.criterion === c.name);
          const score = typeof matched?.score === 'number' ? Math.min(c.maxScore, Math.max(0, matched.score)) : 0;
          return {
            criterion: c.name,
            maxScore: c.maxScore,
            score,
            evidence: matched?.evidence || null,
            reason: matched?.reason || (score === 0 ? 'No evidence identified in answer.' : 'Evidence identified.'),
          };
        });

        // Deterministically compute final score and dimensions from evidence
        const detResult = HRRubricService.calculateDeterministicScore(
          rubric,
          alignedResults,
          relevanceStatus,
          durationSeconds,
          val.wordCount
        );

        return {
          ...detResult.dimensions,
          overallScore: detResult.overallScore,
          feedback: detResult.feedback,
          strengths: detResult.strengths,
          improvements: detResult.improvements,
          starGuidance: detResult.starGuidance,
          aiSummary: `Evaluated via ${rubric.category} rubric. Score: ${detResult.overallScore}/100. Status: ${relevanceStatus}.`,
          criteriaEvidence: detResult.criteriaResults,
        };
      }
    } catch {
      // Fallback to deterministic heuristic
    }

    const heuristic = heuristicEvaluation(question, category, val.verifiedTranscript, durationSeconds);
    return {
      ...heuristic.dimensions,
      overallScore: heuristic.overallScore,
      feedback: heuristic.feedback,
      strengths: heuristic.strengths,
      improvements: heuristic.improvements,
      starGuidance: heuristic.starGuidance,
      aiSummary: `Candidate response evaluated via deterministic rubric fallback. Score: ${heuristic.overallScore}/100.`,
      criteriaEvidence: heuristic.criteriaResults,
    };
  }

  /**
   * Synthesize final holistic HR evaluation across ALL session responses.
   * Real mathematical aggregation: NEVER filters out 0s! If all responses are empty, overallScore = 0.
   */
  static async evaluateFinalSession(
    questionsWithTranscripts: Array<{ question: string; category: string; transcript: string; durationSeconds: number }>
  ): Promise<BehavioralEvaluation> {
    if (!questionsWithTranscripts || questionsWithTranscripts.length === 0) {
      return {
        communicationScore: 0,
        problemSolvingScore: 0,
        teamworkScore: 0,
        professionalismScore: 0,
        relevanceScore: 0,
        clarityScore: 0,
        ownershipScore: 0,
        leadershipScore: 0,
        confidenceScore: 0,
        structureScore: 0,
        overallScore: 0,
        feedback: 'No response was provided, so there was insufficient evidence to evaluate this question.',
        strengths: [],
        improvements: ['Participate actively in the HR interview and speak clearly into the microphone.'],
        starGuidance: 'Ensure your microphone is functioning and speak clearly to structure your response.',
        aiSummary: 'HR round had 0 recorded responses. Final score: 0/100.',
        criteriaEvidence: [],
      };
    }

    // Evaluate each question individually
    const perResponse = await Promise.all(
      questionsWithTranscripts.map((q) =>
        this.evaluateResponse(q.question, q.category, q.transcript, q.durationSeconds)
      )
    );

    const totalQuestions = perResponse.length;

    // True mathematical average across all questions asked — zeroes are preserved!
    const avgDim = (key: keyof BehavioralEvaluation): number => {
      const sum = perResponse.reduce((acc, r) => acc + ((r[key] as number) || 0), 0);
      return Math.round(sum / totalQuestions);
    };

    const communicationScore = avgDim('communicationScore');
    const problemSolvingScore = avgDim('problemSolvingScore');
    const teamworkScore = avgDim('teamworkScore');
    const professionalismScore = avgDim('professionalismScore');
    const relevanceScore = avgDim('relevanceScore');
    const clarityScore = avgDim('clarityScore');
    const ownershipScore = avgDim('ownershipScore');
    const leadershipScore = avgDim('leadershipScore');
    const confidenceScore = avgDim('confidenceScore');
    const structureScore = avgDim('structureScore');

    // Authoritative overall score is the weighted sum of the dimension averages.
    // Weights match SCORING_DIMENSIONS in the frontend (communication=20, problemSolving=15,
    // teamwork=15, professionalism=15, relevance=15, clarity=10, ownership=5, leadership=5).
    // This guarantees overallScore always matches what the report UI displays.
    const weightedOverall =
      communicationScore   * 0.20 +
      problemSolvingScore  * 0.15 +
      teamworkScore        * 0.15 +
      professionalismScore * 0.15 +
      relevanceScore       * 0.15 +
      clarityScore         * 0.10 +
      ownershipScore       * 0.05 +
      leadershipScore      * 0.05;
    const overallScore = Math.min(100, Math.max(0, Math.round(weightedOverall)));

    // Collect all criteria evidence across all questions
    const allCriteriaEvidence: CriterionEvidenceResult[] = perResponse.flatMap(
      (r) => r.criteriaEvidence || []
    );

    const allStrengths = perResponse.flatMap((r) => r.strengths || []);
    const allImprovements = perResponse.flatMap((r) => r.improvements || []);
    const uniqueStrengths = [...new Set(allStrengths)].filter(Boolean).slice(0, 4);
    const uniqueImprovements = [...new Set(allImprovements)].filter(Boolean).slice(0, 4);

    // Check if ANY question had actual candidate words
    const hadAnyActualResponse = questionsWithTranscripts.some((q) => {
      const words = (q.transcript || '').trim().split(/\s+/).filter(Boolean);
      return words.length >= 2;
    });

    let aiSummary = `Candidate completed ${totalQuestions} behavioral interview question${totalQuestions > 1 ? 's' : ''}. Overall score: ${overallScore}/100.`;

    if (!hadAnyActualResponse) {
      // Truly no responses at all — silent interview
      aiSummary = 'No audible or substantive responses were provided during the HR interview. Score: 0/100. Insufficient evidence to award credit.';
    } else if (overallScore === 0) {
      // Candidate spoke but responses were off-topic, very short, or non-substantive
      aiSummary = `Candidate provided responses across ${totalQuestions} question${totalQuestions > 1 ? 's' : ''} but did not substantively address the behavioral questions asked. Score: ${overallScore}/100. Focus on directly answering with concrete examples.`;
    } else if (isLLMAvailable()) {
      try {
        const transcriptSample = questionsWithTranscripts
          .map((q, i) => `Q${i + 1} [Score: ${perResponse[i].overallScore}/100]: "${q.transcript.substring(0, 200)}"`)
          .join('\n');
        const summaryText = await callGroq([
          { role: 'system', content: 'You are a professional HR evaluator. Write a concise 2-sentence evaluation summary based strictly on the candidate actual responses.' },
          { role: 'user', content: `Candidate interview evaluation summary:\nOverall Score: ${overallScore}/100\nResponses:\n${transcriptSample}\n\nWrite a 2-sentence evidence-based summary.` },
        ], 160);
        if (summaryText) aiSummary = summaryText;
      } catch {
        // keep default aiSummary
      }
    }

    const starGuidance =
      'STAR Framework: (1) Situation — context and constraints; (2) Task — your specific responsibility; (3) Action — what YOU specifically did; (4) Result — quantifiable outcome (%, time, team size).';

    let feedback = '';
    if (!hadAnyActualResponse) {
      feedback = 'No response was provided, so there was insufficient evidence to evaluate this interview.';
    } else if (overallScore === 0) {
      feedback = 'Responses were provided but did not sufficiently address the behavioral questions. Focus on direct, structured answers with concrete project examples.';
    } else if (overallScore >= 80) {
      feedback = 'Strong behavioral competency demonstrated with structured articulation and evidence-based problem solving.';
    } else if (overallScore >= 50) {
      feedback = 'Solid performance with partial credit earned across criteria. To improve, explicitly articulate technical trade-offs and quantifiable results.';
    } else {
      feedback = 'Limited substantive technical or behavioral evidence provided. Focus on structuring answers with concrete project examples.';
    }

    return {
      communicationScore,
      problemSolvingScore,
      teamworkScore,
      professionalismScore,
      relevanceScore,
      clarityScore,
      ownershipScore,
      leadershipScore,
      confidenceScore,
      structureScore,
      overallScore,
      feedback,
      strengths: uniqueStrengths.length > 0 ? uniqueStrengths : (overallScore > 0 ? ['Participated in interview session'] : []),
      improvements: uniqueImprovements.length > 0 ? uniqueImprovements : ['Practice structuring answers with STAR framework'],
      starGuidance,
      aiSummary,
      criteriaEvidence: allCriteriaEvidence,
    };
  }
}
