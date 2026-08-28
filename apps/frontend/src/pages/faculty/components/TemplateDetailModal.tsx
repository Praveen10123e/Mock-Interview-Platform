import React from 'react';
import {
  X,
  FileText,
  Clock,
  Shuffle,
  Copy,
  Edit2,
  Trash2,
  BookOpen,
  Layers,
  Award,
  Brain,
  Code2,
  MessageSquare,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import type { InterviewTemplateItem } from '../../../api/templates';

interface TemplateDetailModalProps {
  template: InterviewTemplateItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (template: InterviewTemplateItem) => void;
  onDuplicate?: (template: InterviewTemplateItem) => void;
}

export const TemplateDetailModal: React.FC<TemplateDetailModalProps> = ({
  template,
  isOpen,
  onClose,
  onEdit,
  onDuplicate,
}) => {
  if (!isOpen || !template) return null;

  const cfg = template.defaultConfiguration || {};
  const questions = template.questions || [];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-surface border border-border shadow-2xl rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-border flex items-start justify-between bg-surface-elevated/50">
          <div className="space-y-1.5 min-w-0 pr-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-accent/10 border border-accent/20 text-accent uppercase">
                {template.interviewType}
              </span>

              <span
                className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                  template.difficulty === 'EASY'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : template.difficulty === 'HARD'
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}
              >
                {template.difficulty}
              </span>

              <span
                className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                  template.status === 'PUBLISHED'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}
              >
                {template.status}
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-text-primary truncate">
              {template.name}
            </h2>

            <p className="text-xs text-text-secondary leading-relaxed">
              {template.description || 'No description provided.'}
            </p>
          </div>

          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 rounded-lg shrink-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-6 text-xs text-text-primary">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl border border-border bg-surface-elevated/40 text-[11px]">
            <div>
              <span className="text-text-muted block">Duration</span>
              <span className="font-bold text-text-primary">{template.duration} Minutes</span>
            </div>
            <div>
              <span className="text-text-muted block">Total Questions</span>
              <span className="font-bold text-text-primary">{template.questionCount}</span>
            </div>
            <div>
              <span className="text-text-muted block">Randomize Order</span>
              <span className="font-bold text-text-primary">{cfg.randomizeOrder ? 'Enabled' : 'Fixed Sequence'}</span>
            </div>
            <div>
              <span className="text-text-muted block">Allow Skipping</span>
              <span className="font-bold text-text-primary">{cfg.allowSkipping !== false ? 'Yes' : 'No'}</span>
            </div>
          </div>

          {/* Assessment Composition Grid */}
          <div className="space-y-2">
            <h3 className="font-semibold text-text-secondary text-[11px] uppercase tracking-wider">
              Assessment Composition
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl border border-blue-500/20 bg-blue-500/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-blue-400" />
                  <span className="font-bold text-xs text-text-primary">Stage 1: Aptitude</span>
                </div>
                <span className="font-mono font-bold text-xs text-blue-400">
                  {questions.filter((q) => q.questionType === 'APTITUDE').length} Qs (Min 5)
                </span>
              </div>

              <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-emerald-400" />
                  <span className="font-bold text-xs text-text-primary">Stage 2: Coding</span>
                </div>
                <span className="font-mono font-bold text-xs text-emerald-400">
                  {questions.filter((q) => q.questionType === 'CODING').length} Problems (Min 2)
                </span>
              </div>

              <div className="p-3 rounded-xl border border-purple-500/20 bg-purple-500/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-purple-400" />
                  <span className="font-bold text-xs text-text-primary">Stage 3: HR Interview</span>
                </div>
                <span className="font-mono font-bold text-xs text-purple-400">
                  Conversational AI
                </span>
              </div>
            </div>
          </div>

          {/* Questions Roster */}
          <div className="space-y-2">
            <h3 className="font-semibold text-text-secondary text-[11px] uppercase tracking-wider">
              Assigned Question Sequence ({questions.length})
            </h3>

            <div className="space-y-2">
              {questions.map((q, idx) => (
                <div
                  key={q.questionId || idx}
                  className="p-3 rounded-xl border border-border bg-surface-elevated/40 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-accent/10 border border-accent/20 text-accent font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <span className="font-semibold text-text-primary truncate block">{q.title}</span>
                      <span className="text-[10px] text-text-muted">{q.category}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2 py-0.5 rounded-md bg-surface border border-border font-mono text-[10px] uppercase font-bold">
                      {q.questionType}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                        q.difficulty === 'EASY'
                          ? 'text-emerald-400'
                          : q.difficulty === 'HARD'
                          ? 'text-rose-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {q.difficulty}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-surface-elevated/50 flex items-center justify-between">
          <div className="text-[11px] text-text-muted">
            Created: {new Date(template.createdAt).toLocaleDateString()}
          </div>

          <div className="flex items-center gap-2">
            {onDuplicate && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1.5 cursor-pointer"
                onClick={() => {
                  onClose();
                  onDuplicate(template);
                }}
              >
                <Copy className="h-3.5 w-3.5" />
                Duplicate
              </Button>
            )}

            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1.5 cursor-pointer"
                onClick={() => {
                  onClose();
                  onEdit(template);
                }}
              >
                <Edit2 className="h-3.5 w-3.5" />
                Edit
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

export default TemplateDetailModal;
