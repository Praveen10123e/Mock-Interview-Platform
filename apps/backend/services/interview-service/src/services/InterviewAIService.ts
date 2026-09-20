/**
 * InterviewAIService.ts
 *
 * Core AI engine for the HR Behavioral Interview Module.
 * - Question generation from curated bank (20+ placement behavioral questions)
 * - Dynamic follow-up generation via Groq LLM with deterministic fallback
 * - 10-factor behavioral evaluation (Communication 20%, Problem Solving 15%, ...)
 */

import axios from 'axios';

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
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function isLLMAvailable(): boolean {
  return LLM_PROVIDER === 'GROQ' && !!LLM_API_KEY && LLM_API_KEY.length > 10;
}

async function callGroq(messages: Array<{ role: string; content: string }>, maxTokens = 512): Promise<string> {
  const response = await axios.post(
    GROQ_API_URL,
    {
      model: GROQ_MODEL,
      messages,
      max_tokens: maxTokens,
      temperature: 0.6,
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

function heuristicEvaluation(transcript: string, durationSeconds: number): Partial<BehavioralEvaluation> {
  const words = transcript.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const wpm = durationSeconds > 0 ? (wordCount / durationSeconds) * 60 : wordCount;

  const hasSTAR = /\b(situation|task|action|result|worked|resolved|led|achieved|completed|improved|reduced)\b/i.test(transcript);
  const hasNumbers = /\b\d+[\d%xX]*\b/.test(transcript);
  const hasTeamRef = /\b(team|colleague|collaborate|together|we|group|member)\b/i.test(transcript);
  const hasIRef = /\b(I|my|me|myself)\b/.test(transcript);
  const isLong = wordCount >= 80;
  const isMedium = wordCount >= 40;

  const base = isLong ? 72 : isMedium ? 62 : 48;
  const bonus = (hasSTAR ? 8 : 0) + (hasNumbers ? 5 : 0) + (hasTeamRef ? 4 : 0) + (hasIRef ? 3 : 0);

  const communication = clamp(base + bonus + (wpm > 80 && wpm < 180 ? 5 : 0));
  const problemSolving = clamp(base + (hasSTAR ? 10 : 0) + (hasNumbers ? 5 : 0));
  const teamwork = clamp(base + (hasTeamRef ? 12 : 0));
  const professionalism = clamp(base + 5);
  const relevance = clamp(base + (hasSTAR ? 8 : 0));
  const clarity = clamp(base + (isLong ? 8 : 0));
  const ownership = clamp(base + (hasIRef ? 8 : 0));
  const leadership = clamp(base + (hasIRef && hasTeamRef ? 5 : 0));
  const confidence = clamp(base + (isLong ? 5 : 0));
  const structure = clamp(base + (hasSTAR ? 12 : 0));

  const strengths: string[] = [];
  const improvements: string[] = [];

  if (isLong) strengths.push('Provided a detailed, comprehensive response');
  if (hasSTAR) strengths.push('Used structured behavioral framing in the response');
  if (hasTeamRef) strengths.push('Referenced collaborative team experience');
  if (!isLong) improvements.push('Expand your response with more detail and specific examples');
  if (!hasSTAR) improvements.push('Structure your answer using the STAR framework (Situation, Task, Action, Result)');
  if (!hasNumbers) improvements.push('Quantify your outcomes with specific metrics (e.g., "improved by 30%")');

  return {
    communicationScore: communication,
    problemSolvingScore: problemSolving,
    teamworkScore: teamwork,
    professionalismScore: professionalism,
    relevanceScore: relevance,
    clarityScore: clarity,
    ownershipScore: ownership,
    leadershipScore: leadership,
    confidenceScore: confidence,
    structureScore: structure,
    strengths,
    improvements,
  };
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
    if (!candidateTranscript || candidateTranscript.trim().length < 10) {
      return 'Could you elaborate a bit more with a specific example?';
    }
    if (!isLLMAvailable()) {
      const pool = DETERMINISTIC_FOLLOWUPS[category] || DETERMINISTIC_FOLLOWUPS['Project Challenge'];
      return pool[Math.floor(Math.random() * pool.length)];
    }

    const systemPrompt = `You are a professional technical HR interviewer for a ${role} position. Your tone is professional, empathetic, and precise.`;
    const userPrompt = `You just asked: "${mainQuestion}"\n\nThe candidate responded: "${candidateTranscript.substring(0, 800)}"\n\nGenerate ONE targeted follow-up question (1–2 sentences) probing deeper into a specific aspect of their answer — a concrete example, measurable outcome, or technical detail. Output ONLY the question, nothing else.`;

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
   * Evaluate a single candidate response across all 10 behavioral dimensions.
   */
  static async evaluateResponse(
    question: string,
    category: string,
    transcript: string,
    durationSeconds: number
  ): Promise<Partial<BehavioralEvaluation>> {
    if (!isLLMAvailable()) {
      return heuristicEvaluation(transcript, durationSeconds);
    }

    const systemPrompt = `You are a senior HR behavioral interview evaluator using STAR framework assessment. Return ONLY valid JSON, no markdown.`;
    const userPrompt = `Evaluate this candidate response.
Question: "${question}"
Category: ${category}
Response: "${transcript.substring(0, 1200)}"
Duration: ${durationSeconds}s

Return ONLY JSON:
{
  "communicationScore": <0-100>,
  "problemSolvingScore": <0-100>,
  "teamworkScore": <0-100>,
  "professionalismScore": <0-100>,
  "relevanceScore": <0-100>,
  "clarityScore": <0-100>,
  "ownershipScore": <0-100>,
  "leadershipScore": <0-100>,
  "confidenceScore": <0-100>,
  "structureScore": <0-100>,
  "strengths": ["<string>", "<string>"],
  "improvements": ["<string>", "<string>"],
  "starFeedback": "<1-2 sentence STAR feedback>"
}`;

    try {
      const llmText = await callGroq([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ], 600);

      const jsonStart = llmText.indexOf('{');
      const jsonEnd = llmText.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const parsed = JSON.parse(llmText.substring(jsonStart, jsonEnd + 1));
        return {
          communicationScore: clamp(parsed.communicationScore),
          problemSolvingScore: clamp(parsed.problemSolvingScore),
          teamworkScore: clamp(parsed.teamworkScore),
          professionalismScore: clamp(parsed.professionalismScore),
          relevanceScore: clamp(parsed.relevanceScore),
          clarityScore: clamp(parsed.clarityScore),
          ownershipScore: clamp(parsed.ownershipScore),
          leadershipScore: clamp(parsed.leadershipScore),
          confidenceScore: clamp(parsed.confidenceScore),
          structureScore: clamp(parsed.structureScore),
          strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 3) : [],
          improvements: Array.isArray(parsed.improvements) ? parsed.improvements.slice(0, 3) : [],
          starGuidance: parsed.starFeedback || '',
        };
      }
    } catch {
      // fall through to heuristic
    }

    return heuristicEvaluation(transcript, durationSeconds);
  }

  /**
   * Synthesize final holistic HR evaluation from all session responses.
   */
  static async evaluateFinalSession(
    questionsWithTranscripts: Array<{ question: string; category: string; transcript: string; durationSeconds: number }>
  ): Promise<BehavioralEvaluation> {
    const perResponse = await Promise.all(
      questionsWithTranscripts.map((q) =>
        this.evaluateResponse(q.question, q.category, q.transcript, q.durationSeconds)
      )
    );

    const avgDim = (key: keyof BehavioralEvaluation): number => {
      const vals = perResponse.map((r) => (r[key] as number) || 0).filter((v) => v > 0);
      return vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 55;
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

    const overallScore = Math.round(
      communicationScore * 0.20 +
      problemSolvingScore * 0.15 +
      teamworkScore * 0.15 +
      professionalismScore * 0.15 +
      relevanceScore * 0.15 +
      clarityScore * 0.10 +
      ownershipScore * 0.05 +
      leadershipScore * 0.05
    );

    const allStrengths = perResponse.flatMap((r) => r.strengths || []);
    const allImprovements = perResponse.flatMap((r) => r.improvements || []);
    const uniqueStrengths = [...new Set(allStrengths)].slice(0, 4);
    const uniqueImprovements = [...new Set(allImprovements)].slice(0, 4);

    let aiSummary = `Candidate completed ${questionsWithTranscripts.length} behavioral interview questions. Overall performance score: ${overallScore}/100. Focus: apply STAR framework with measurable outcomes.`;
    if (isLLMAvailable() && questionsWithTranscripts.length > 0) {
      try {
        const transcriptSample = questionsWithTranscripts
          .map((q, i) => `Q${i + 1} [${q.category}]: ${q.transcript.substring(0, 300)}`)
          .join('\n');
        const summaryText = await callGroq([
          { role: 'system', content: 'You are a professional HR evaluator. Be concise and specific.' },
          { role: 'user', content: `Based on these behavioral interview responses:\n${transcriptSample}\n\nWrite a 2-3 sentence professional HR evaluation summary highlighting the candidate's overall behavioral competency and key recommendation. Be specific and evidence-based.` },
        ], 200);
        if (summaryText) aiSummary = summaryText;
      } catch { /* use default summary */ }
    }

    const starGuidance = 'STAR Framework: (1) **Situation** — context and constraints; (2) **Task** — your specific responsibility; (3) **Action** — what YOU specifically did; (4) **Result** — quantifiable outcome (%, time, team size).';
    const feedback = overallScore >= 80
      ? 'Excellent behavioral competency demonstrated with strong communication and professional articulation.'
      : overallScore >= 65
      ? 'Good performance with clear opportunities for structured improvement. Focus on STAR framework and quantifying outcomes.'
      : 'The candidate should develop more structured behavioral responses. Practice the STAR framework with concrete, measurable examples.';

    return {
      communicationScore, problemSolvingScore, teamworkScore, professionalismScore,
      relevanceScore, clarityScore, ownershipScore, leadershipScore, confidenceScore, structureScore,
      overallScore, feedback,
      strengths: uniqueStrengths.length > 0 ? uniqueStrengths : ['Completed structured behavioral round', 'Maintained professional tone throughout'],
      improvements: uniqueImprovements.length > 0 ? uniqueImprovements : ['Use STAR framework for responses', 'Quantify results with metrics'],
      starGuidance,
      aiSummary,
    };
  }
}
