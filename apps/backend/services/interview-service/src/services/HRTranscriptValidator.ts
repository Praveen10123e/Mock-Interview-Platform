/**
 * HRTranscriptValidator.ts
 *
 * Evidence-Based Transcript Validation Pipeline for HR & Technical Interviews:
 * 1. Empty & Silence Detection (empty string, whitespace, silence placeholders)
 * 2. Filler-Word Only Detection ("umm", "uh", "actually yeah", etc.)
 * 3. Non-Responsive Monosyllable Detection for open-ended questions ("yes", "no", "okay")
 * 4. High-Confidence Technical Term Phonetic Correction (YOLO, YOLOv8, OpenCV, FastAPI, etc.)
 * 5. Preservation of rawTranscript vs verifiedTranscript for complete auditability
 */

export interface TranscriptValidationResult {
  rawTranscript: string;
  verifiedTranscript: string;
  isEmpty: boolean;
  isFillerOnly: boolean;
  isNonResponsive: boolean;
  hasSpeech: boolean;
  wordCount: number;
  rejectionReason?: string;
  normalizedTerms: string[];
}

// Common filler words and vocal pauses
const FILLER_WORDS = new Set([
  'um', 'umm', 'uh', 'uhh', 'ah', 'ahh', 'er', 'err',
  'hmm', 'hm', 'like', 'you know', 'actually', 'basically',
  'yeah', 'yep', 'so', 'so yeah', 'well', 'okay yeah', 'i mean',
  'just', 'you', 'know'
]);

// Non-responsive monosyllables for open-ended questions
const NON_RESPONSIVE_MONOSYLLABLES = new Set([
  'yes', 'no', 'yeah', 'yep', 'nope', 'nah', 'ok', 'okay',
  'sure', 'fine', 'right', 'maybe', 'idk', 'k'
]);

// Placeholders produced by browser recording or silence
const SILENCE_PLACEHOLDERS = [
  '[candidate audio response recorded]',
  '[candidate audio response]',
  '[no speech]',
  '[no speech detected]',
  'no speech',
  'no speech detected',
  'no transcript recorded',
  'no transcript recorded.',
  'silence',
  'inaudible',
  'unanswered',
  'empty'
];

// Technical terms commonly mistranscribed by Web Speech API
interface TechnicalReplacement {
  pattern: RegExp;
  replacement: string;
  contextKeywords?: string[];
}

const TECHNICAL_CORRECTIONS: TechnicalReplacement[] = [
  { pattern: /\byellow\s*v\s*8\b/gi, replacement: 'YOLOv8' },
  { pattern: /\byellow\s*8\b/gi, replacement: 'YOLOv8' },
  { pattern: /\byolo\s*v\s*8\b/gi, replacement: 'YOLOv8' },
  { pattern: /\byellow\b/gi, replacement: 'YOLO', contextKeywords: ['vision', 'model', 'detection', 'object', 'segmentation', 'waste', 'image', 'opencv', 'bounding'] },
  { pattern: /\bopen\s*cv\b/gi, replacement: 'OpenCV' },
  { pattern: /\bopen\s*cb\b/gi, replacement: 'OpenCV' },
  { pattern: /\bfast\s*api\b/gi, replacement: 'FastAPI' },
  { pattern: /\bfirst\s*api\b/gi, replacement: 'FastAPI', contextKeywords: ['python', 'backend', 'api', 'server', 'framework'] },
  { pattern: /\bpost\s*gres\b/gi, replacement: 'PostgreSQL' },
  { pattern: /\bpost\s*gre\s*sql\b/gi, replacement: 'PostgreSQL' },
  { pattern: /\bpost\s*grass\b/gi, replacement: 'PostgreSQL', contextKeywords: ['database', 'sql', 'backend', 'query', 'table', 'db'] },
  { pattern: /\bmango\s*db\b/gi, replacement: 'MongoDB' },
  { pattern: /\bmongo\s*db\b/gi, replacement: 'MongoDB' },
  { pattern: /\bbyte\s*track\b/gi, replacement: 'ByteTrack' },
  { pattern: /\bbite\s*track\b/gi, replacement: 'ByteTrack', contextKeywords: ['tracking', 'yolo', 'vision', 'object', 'detection'] },
  { pattern: /\bwater\s*shed\b/gi, replacement: 'watershed' },
  { pattern: /\bmorphological\s*operations?\b/gi, replacement: 'morphological operations' },
  { pattern: /\bpie\s*torch\b/gi, replacement: 'PyTorch' },
  { pattern: /\bpi\s*torch\b/gi, replacement: 'PyTorch' },
  { pattern: /\bcooper\s*nettes?\b/gi, replacement: 'Kubernetes' },
  { pattern: /\bcooper\s*netis?\b/gi, replacement: 'Kubernetes' },
];

export class HRTranscriptValidator {
  /**
   * Validate, normalize, and check transcript evidence.
   */
  static validate(
    rawInput: string | null | undefined,
    questionContext?: { question: string; category: string }
  ): TranscriptValidationResult {
    const rawTranscript = (rawInput || '').trim();

    // 1. Check for absolute emptiness
    if (!rawTranscript) {
      return {
        rawTranscript: '',
        verifiedTranscript: '',
        isEmpty: true,
        isFillerOnly: false,
        isNonResponsive: false,
        hasSpeech: false,
        wordCount: 0,
        rejectionReason: 'No speech was detected or transcript was empty.',
        normalizedTerms: [],
      };
    }

    const lowerRaw = rawTranscript.toLowerCase();

    // 2. Check for synthetic silence placeholders
    const isPlaceholder = SILENCE_PLACEHOLDERS.some((p) => lowerRaw === p || lowerRaw === `[${p}]`);
    if (isPlaceholder) {
      return {
        rawTranscript,
        verifiedTranscript: '',
        isEmpty: true,
        isFillerOnly: false,
        isNonResponsive: false,
        hasSpeech: false,
        wordCount: 0,
        rejectionReason: 'Silence detected (no candidate speech recorded).',
        normalizedTerms: [],
      };
    }

    // 3. Tokenize words (stripping punctuation)
    const cleanedWords = rawTranscript
      .toLowerCase()
      .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'…]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);

    const wordCount = cleanedWords.length;

    if (wordCount === 0) {
      return {
        rawTranscript,
        verifiedTranscript: '',
        isEmpty: true,
        isFillerOnly: false,
        isNonResponsive: false,
        hasSpeech: false,
        wordCount: 0,
        rejectionReason: 'Transcript contained only punctuation or whitespace.',
        normalizedTerms: [],
      };
    }

    // 4. Check for Filler-Only Responses (e.g. "Umm... actually... yeah...")
    const nonFillerWords = cleanedWords.filter((w) => !FILLER_WORDS.has(w));
    if (nonFillerWords.length === 0) {
      return {
        rawTranscript,
        verifiedTranscript: rawTranscript,
        isEmpty: true,
        isFillerOnly: true,
        isNonResponsive: true,
        hasSpeech: true,
        wordCount,
        rejectionReason: 'Transcript contained only vocal filler words without substantive answer content.',
        normalizedTerms: [],
      };
    }

    // 5. Check for Non-Responsive Monosyllables on Open-Ended Questions
    const qLower = (questionContext?.question || '').toLowerCase();
    const isYesNoQuestion =
      /\b(?:do you|have you|did you|are you|is it|can you)\b/i.test(qLower) &&
      !/\b(?:describe|explain|tell me|walk me through|what|how|why)\b/i.test(qLower);

    if (!isYesNoQuestion && wordCount <= 2) {
      const allMonosyllables = cleanedWords.every((w) => NON_RESPONSIVE_MONOSYLLABLES.has(w) || FILLER_WORDS.has(w));
      if (allMonosyllables) {
        return {
          rawTranscript,
          verifiedTranscript: rawTranscript,
          isEmpty: true,
          isFillerOnly: false,
          isNonResponsive: true,
          hasSpeech: true,
          wordCount,
          rejectionReason: `Response "${rawTranscript}" is non-responsive for an open-ended behavioral question.`,
          normalizedTerms: [],
        };
      }
    }

    // 6. Technical Terminology Phonetic Normalization
    let verified = rawTranscript;
    const normalizedTerms: string[] = [];
    const contextText = `${qLower} ${lowerRaw}`;

    for (const item of TECHNICAL_CORRECTIONS) {
      // Check if context applies
      if (item.contextKeywords && item.contextKeywords.length > 0) {
        const matchesContext = item.contextKeywords.some((kw) => contextText.includes(kw));
        if (!matchesContext) continue;
      }

      item.pattern.lastIndex = 0;
      if (item.pattern.test(verified)) {
        item.pattern.lastIndex = 0;
        verified = verified.replace(item.pattern, (match) => {
          normalizedTerms.push(`${match} -> ${item.replacement}`);
          return item.replacement;
        });
      }
    }

    return {
      rawTranscript,
      verifiedTranscript: verified,
      isEmpty: false,
      isFillerOnly: false,
      isNonResponsive: false,
      hasSpeech: true,
      wordCount,
      normalizedTerms,
    };
  }
}
