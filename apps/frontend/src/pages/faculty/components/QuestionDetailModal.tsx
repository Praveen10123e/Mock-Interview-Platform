import React from 'react';
import {
  X,
  Code2,
  CheckCircle2,
  Eye,
  EyeOff,
  Clock,
  Award,
  Layers,
  FileCode2,
  Tag,
  ListOrdered,
  Check,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';

interface QuestionDetailModalProps {
  question: any | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (question: any) => void;
}

export const QuestionDetailModal: React.FC<QuestionDetailModalProps> = ({
  question,
  isOpen,
  onClose,
  onEdit,
}) => {
  if (!isOpen || !question) return null;

  const payload = question.metadata?.jsonPayload || {};
  const qType = (question.questionType || 'CODING').toUpperCase();

  const isCoding = qType === 'CODING' || qType === 'PROGRAMMING';
  const isMcq = qType === 'APTITUDE' || qType === 'MCQ';
  const isHr = qType === 'HR' || qType === 'BEHAVIORAL';
  const isTheory = qType === 'THEORY' || qType === 'TECHNICAL' || qType === 'DESCRIPTIVE';

  const execution = payload.execution || {};
  const testCases = payload.testCases || [];
  const examples = payload.examples || [];
  const constraints = payload.constraints || [];
  const hints = payload.hints || [];
  const options = payload.options || [];
  const correctOptionIndex = payload.correctOptionIndex ?? (question.expectedAnswer ? options.indexOf(question.expectedAnswer) : 0);
  const evaluationCriteria = payload.evaluationCriteria || [];
  const keyPoints = payload.keyPoints || [];
  const explanation = payload.explanation || question.idealAnswer;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-surface border border-border shadow-2xl rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-border flex items-start justify-between bg-surface-elevated/50">
          <div className="space-y-1.5 min-w-0 pr-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-accent/10 border border-accent/20 text-accent uppercase">
                {qType}
              </span>

              <span
                className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                  question.difficulty === 'EASY'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : question.difficulty === 'HARD' || question.difficulty === 'EXPERT'
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}
              >
                {question.difficulty}
              </span>

              <span
                className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                  question.status === 'PUBLISHED'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : question.status === 'DRAFT'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                }`}
              >
                {question.status}
              </span>

              {isCoding && (
                <span className="px-2 py-0.5 text-[10px] font-mono rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  {execution.executionMode || 'STANDARD_IO'}
                </span>
              )}
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-text-primary truncate">
              {question.title}
            </h2>

            <div className="flex items-center gap-3 text-xs text-text-muted">
              <span>{question.category?.name || 'Category'}</span>
              {question.topic?.name && (
                <>
                  <span>•</span>
                  <span>{question.topic.name}</span>
                </>
              )}
            </div>
          </div>

          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 rounded-lg shrink-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-6 text-xs text-text-primary">
          {/* Question / Description */}
          <div className="space-y-2">
            <h3 className="font-semibold text-text-primary uppercase text-[11px] tracking-wider text-text-muted">
              Question Statement
            </h3>
            <p className="whitespace-pre-line text-text-secondary leading-relaxed bg-surface-elevated/30 p-3.5 rounded-xl border border-border/50">
              {question.description}
            </p>
          </div>

          {/* 1. APTITUDE / MCQ OPTIONS VIEW */}
          {isMcq && options.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-text-primary uppercase text-[11px] tracking-wider text-text-muted">
                Multiple Choice Options
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {options.map((opt: string, idx: number) => {
                  const letter = String.fromCharCode(65 + idx);
                  const isCorrect = correctOptionIndex === idx;

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                        isCorrect
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 font-semibold'
                          : 'border-border bg-surface-elevated/40 text-text-secondary'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            isCorrect
                              ? 'bg-emerald-500 text-white'
                              : 'bg-surface-elevated border border-border text-text-muted'
                          }`}
                        >
                          {letter}
                        </span>
                        <span className="text-xs">{opt}</span>
                      </div>
                      {isCorrect && (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                          Correct Answer
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. EXPLANATION / SOLUTION NOTES */}
          {explanation && (
            <div className="space-y-2">
              <h3 className="font-semibold text-text-primary uppercase text-[11px] tracking-wider text-text-muted">
                Solution & Explanation
              </h3>
              <p className="whitespace-pre-line text-text-secondary bg-surface-elevated/30 p-3.5 rounded-xl border border-border/50 leading-relaxed">
                {explanation}
              </p>
            </div>
          )}

          {/* 3. HR / BEHAVIORAL RUBRICS */}
          {(evaluationCriteria.length > 0 || keyPoints.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {evaluationCriteria.length > 0 && (
                <div className="space-y-1.5">
                  <h3 className="font-semibold text-text-primary uppercase text-[11px] tracking-wider text-text-muted">
                    Evaluation Criteria
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-text-secondary bg-surface-elevated/30 p-3 rounded-xl border border-border/40">
                    {evaluationCriteria.map((c: any, i: number) => (
                      <li key={i}>{String(c)}</li>
                    ))}
                  </ul>
                </div>
              )}

              {keyPoints.length > 0 && (
                <div className="space-y-1.5">
                  <h3 className="font-semibold text-text-primary uppercase text-[11px] tracking-wider text-text-muted">
                    Expected Key Points
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-text-secondary bg-surface-elevated/30 p-3 rounded-xl border border-border/40">
                    {keyPoints.map((k: any, i: number) => (
                      <li key={i}>{String(k)}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* 4. PROGRAMMING EXAMPLES */}
          {isCoding && examples.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-text-primary uppercase text-[11px] tracking-wider text-text-muted">
                Examples
              </h3>
              <div className="space-y-2">
                {examples.map((ex: any, i: number) => (
                  <div key={i} className="p-3 rounded-xl border border-border bg-surface-elevated/40 space-y-1 font-mono text-[11px]">
                    <div>
                      <span className="text-text-muted">Input: </span>
                      <span className="text-text-primary">{typeof ex.input === 'string' ? ex.input : JSON.stringify(ex.input)}</span>
                    </div>
                    <div>
                      <span className="text-text-muted">Output: </span>
                      <span className="text-emerald-400">{typeof ex.output === 'string' ? ex.output : JSON.stringify(ex.output)}</span>
                    </div>
                    {ex.explanation && (
                      <div className="font-sans text-xs text-text-muted pt-1">
                        <span className="font-semibold">Explanation: </span>
                        {ex.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. PROGRAMMING CONSTRAINTS & HINTS */}
          {(constraints.length > 0 || hints.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {constraints.length > 0 && (
                <div className="space-y-1.5">
                  <h3 className="font-semibold text-text-primary uppercase text-[11px] tracking-wider text-text-muted">
                    Constraints
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-text-secondary font-mono text-[11px] bg-surface-elevated/30 p-3 rounded-xl border border-border/40">
                    {constraints.map((c: any, i: number) => (
                      <li key={i}>{c.constraint || c}</li>
                    ))}
                  </ul>
                </div>
              )}

              {hints.length > 0 && (
                <div className="space-y-1.5">
                  <h3 className="font-semibold text-text-primary uppercase text-[11px] tracking-wider text-text-muted">
                    Hints
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-text-secondary bg-surface-elevated/30 p-3 rounded-xl border border-border/40">
                    {hints.map((h: any, i: number) => (
                      <li key={i}>{h.hint || h}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* 6. PROGRAMMING TEST CASES */}
          {isCoding && testCases.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-text-primary uppercase text-[11px] tracking-wider text-text-muted">
                  Configured Test Cases ({testCases.length})
                </h3>
                <span className="text-[10px] text-text-muted">
                  Faculty View (Visible & Hidden)
                </span>
              </div>

              <div className="space-y-2">
                {testCases.map((tc: any, i: number) => {
                  const isHidden = tc.visibility === 'HIDDEN' || tc.isHidden;
                  return (
                    <div
                      key={i}
                      className={`p-3 rounded-xl border space-y-1.5 font-mono text-[11px] ${
                        isHidden ? 'border-amber-500/30 bg-amber-500/5' : 'border-border bg-surface-elevated/40'
                      }`}
                    >
                      <div className="flex items-center justify-between font-sans text-xs">
                        <span className="font-semibold text-text-primary">Test Case #{i + 1}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-semibold flex items-center gap-1 ${
                            isHidden
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {isHidden ? (
                            <>
                              <EyeOff className="h-3 w-3" /> Hidden (Grading)
                            </>
                          ) : (
                            <>
                              <Eye className="h-3 w-3" /> Visible (Sample)
                            </>
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="text-text-muted">Input: </span>
                        <span className="text-text-primary">
                          {typeof tc.input === 'object' ? JSON.stringify(tc.input) : String(tc.input ?? '')}
                        </span>
                      </div>
                      <div>
                        <span className="text-text-muted">Expected: </span>
                        <span className="text-emerald-400">
                          {typeof tc.expectedOutput === 'object' ? JSON.stringify(tc.expectedOutput) : String(tc.expectedOutput ?? '')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-surface-elevated/50 flex items-center justify-between">
          <div className="text-[11px] text-text-muted">
            Created: {new Date(question.createdAt).toLocaleDateString()} • Version {question.version || 1}
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs cursor-pointer"
                onClick={() => {
                  onClose();
                  onEdit(question);
                }}
              >
                Edit Question
              </Button>
            )}
            <Button variant="default" size="sm" className="text-xs cursor-pointer" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionDetailModal;
