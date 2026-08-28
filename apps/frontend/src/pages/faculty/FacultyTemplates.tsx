import React, { useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  Copy,
  Eye,
  AlertCircle,
  CheckCircle2,
  Clock,
  Shuffle,
  BookOpen,
  Layers,
  Sparkles,
  Brain,
  Code2,
  MessageSquare,
  Dices,
  Hand,
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Skeleton } from '../../components/ui/skeleton';
import { EmptyState } from '../../components/shared/EmptyState';
import {
  useTemplates,
  useDuplicateTemplate,
  useDeleteTemplate,
} from '../../api/templates';
import type { InterviewTemplateItem } from '../../api/templates';
import { TemplateModal } from './components/TemplateModal';
import { TemplateDetailModal } from './components/TemplateDetailModal';

export const FacultyTemplates: React.FC = () => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [interviewType, setInterviewType] = useState('ALL');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<InterviewTemplateItem | null>(null);
  const [viewingTemplate, setViewingTemplate] = useState<InterviewTemplateItem | null>(null);

  // Delete confirmation
  const [deletingTemplate, setDeletingTemplate] = useState<InterviewTemplateItem | null>(null);

  const {
    data: templates = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useTemplates({
    search: search.trim() || undefined,
    status: status !== 'ALL' ? status : undefined,
    interviewType: interviewType !== 'ALL' ? interviewType : undefined,
  });

  const duplicateMutation = useDuplicateTemplate();
  const deleteMutation = useDeleteTemplate();

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tmpl: InterviewTemplateItem) => {
    setEditingTemplate(tmpl);
    setIsModalOpen(true);
  };

  const handleOpenView = (tmpl: InterviewTemplateItem) => {
    setViewingTemplate(tmpl);
  };

  const handleDuplicate = async (tmpl: InterviewTemplateItem) => {
    try {
      await duplicateMutation.mutateAsync(tmpl.id);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || err.message);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingTemplate) return;
    try {
      await deleteMutation.mutateAsync(deletingTemplate.id);
      setDeletingTemplate(null);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || err.message);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 max-w-7xl mx-auto w-full pb-12">
      {/* ── 1. Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/60 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text-primary">
              Interview Templates
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-accent/10 border border-accent/20 text-accent rounded-full font-mono">
              Total: {templates.length}
            </span>
          </div>
          <p className="text-xs md:text-sm text-text-secondary">
            Design, customize, and manage reusable interview templates with curated questions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-1.5 text-xs cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handleOpenCreate}
            className="gap-1.5 text-xs cursor-pointer shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Create Template
          </Button>
        </div>
      </div>

      {/* ── 2. Search & Filters Bar ────────────────────────────────────────── */}
      <Card className="p-4 bg-surface border-border">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <Input
              type="text"
              placeholder="Search by template name or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full h-9 rounded-lg border border-border bg-surface-elevated px-3 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="ALL">All Statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
            </select>
          </div>

          {/* Interview Type Filter */}
          <div>
            <select
              value={interviewType}
              onChange={(e) => setInterviewType(e.target.value)}
              className="w-full h-9 rounded-lg border border-border bg-surface-elevated px-3 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="ALL">All Interview Types</option>
              <option value="MOCK">Mock Interview</option>
              <option value="PRACTICE">Practice Assessment</option>
              <option value="TECHNICAL">Technical Interview</option>
              <option value="HR">HR Interview</option>
              <option value="CUSTOM">Custom Assessment</option>
            </select>
          </div>
        </div>
      </Card>

      {/* ── 3. Loading State ──────────────────────────────────────────────── */}
      {isLoading && (
        <Card className="p-6 space-y-4">
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        </Card>
      )}

      {/* ── 4. Error State ────────────────────────────────────────────────── */}
      {isError && (
        <div className="p-8 text-center space-y-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
          <AlertCircle className="h-6 w-6 text-rose-400 mx-auto" />
          <h3 className="text-sm font-semibold text-text-primary">Failed to load interview templates</h3>
          <p className="text-xs text-text-secondary max-w-md mx-auto">
            {(error as any)?.response?.data?.error?.message || (error as any)?.message}
          </p>
          <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-2">
            Try Again
          </Button>
        </div>
      )}

      {/* ── 5. Templates Table / Cards ────────────────────────────────────── */}
      {!isLoading && !isError && (
        <>
          {templates.length > 0 ? (
            <Card className="overflow-hidden border-border bg-surface">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border bg-surface-elevated/60 text-text-muted uppercase text-[10px] tracking-wider font-mono">
                      <th className="py-3 px-4 font-medium">Template</th>
                      <th className="py-3 px-4 font-medium">Type / Difficulty</th>
                      <th className="py-3 px-4 font-medium">Assessment Structure</th>
                      <th className="py-3 px-4 font-medium">Duration</th>
                      <th className="py-3 px-4 font-medium">Status</th>
                      <th className="py-3 px-4 font-medium">Created Date</th>
                      <th className="py-3 px-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {templates.map((tmpl) => {
                      const aptCount = tmpl.assessmentStructure?.aptitude?.count ?? tmpl.questions?.filter(q => q.questionType === 'APTITUDE').length ?? 0;
                      const codCount = tmpl.assessmentStructure?.coding?.count ?? tmpl.questions?.filter(q => q.questionType === 'CODING').length ?? 0;

                      return (
                      <tr
                        key={tmpl.id}
                        className="hover:bg-surface-elevated/40 transition-colors group cursor-pointer"
                        onClick={() => handleOpenView(tmpl)}
                      >
                        {/* Name & Description */}
                        <td className="py-3.5 px-4 max-w-[220px]">
                          <div className="font-semibold text-text-primary truncate">
                            {tmpl.name}
                          </div>
                          <div className="text-[11px] text-text-muted truncate">
                            {tmpl.description || 'No description'}
                          </div>
                        </td>

                        {/* Type & Difficulty */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-accent/10 border border-accent/20 text-accent uppercase">
                              {tmpl.interviewType}
                            </span>
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase ${
                                tmpl.difficulty === 'EASY'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : tmpl.difficulty === 'HARD'
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}
                            >
                              {tmpl.difficulty}
                            </span>
                          </div>
                        </td>

                        {/* Assessment Structure */}
                        <td className="py-3.5 px-4 min-w-[260px]">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                                tmpl.assessmentStructure?.selectionMode === 'RANDOM'
                                  ? 'bg-accent/15 border border-accent/30 text-accent'
                                  : 'bg-surface-elevated border border-border text-text-secondary'
                              }`}
                            >
                              {tmpl.assessmentStructure?.selectionMode === 'RANDOM' ? (
                                <>
                                  <Dices className="h-3 w-3" />
                                  Random
                                </>
                              ) : (
                                <>
                                  <Hand className="h-3 w-3" />
                                  Manual
                                </>
                              )}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 font-semibold text-[11px] flex items-center gap-1">
                              <Brain className="h-3 w-3" />
                              {aptCount} Aptitude
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-[11px] flex items-center gap-1">
                              <Code2 className="h-3 w-3" />
                              {tmpl.assessmentStructure?.selectionMode === 'RANDOM'
                                ? '2 Coding (1 Easy, 1 Med/Hard)'
                                : `${codCount} Coding`}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-400 font-semibold text-[11px] flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              Conversational HR
                            </span>
                          </div>
                        </td>

                        {/* Duration */}
                        <td className="py-3.5 px-4 font-mono text-text-secondary">
                          {tmpl.duration} mins
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 text-[10px] font-semibold rounded-full uppercase tracking-wider ${
                              tmpl.status === 'PUBLISHED'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {tmpl.status}
                          </span>
                        </td>

                        {/* Created Date */}
                        <td className="py-3.5 px-4 text-[11px] text-text-muted">
                          {new Date(tmpl.createdAt).toLocaleDateString()}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div
                            className="flex items-center justify-end gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-text-muted hover:text-text-primary cursor-pointer"
                              onClick={() => handleOpenView(tmpl)}
                              title="View Template Details"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-text-muted hover:text-accent cursor-pointer"
                              onClick={() => handleOpenEdit(tmpl)}
                              title="Edit Template"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-text-muted hover:text-blue-400 cursor-pointer"
                              onClick={() => handleDuplicate(tmpl)}
                              disabled={duplicateMutation.isPending}
                              title="Duplicate Template"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-text-muted hover:text-rose-400 cursor-pointer"
                              onClick={() => setDeletingTemplate(tmpl)}
                              title="Delete Template"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center bg-surface border-border">
              <div className="space-y-4 max-w-sm mx-auto">
                <FileText className="h-10 w-10 text-text-muted mx-auto opacity-50" />
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-text-primary">No interview templates yet</h3>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Create reusable assessment workflows with customized question sequences from the Question Bank.
                  </p>
                </div>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleOpenCreate}
                  className="text-xs gap-1.5 cursor-pointer shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Create Your First Template
                </Button>
              </div>
            </Card>
          )}
        </>
      )}

      {/* ── Create / Edit Template Modal ───────────────────────────────────── */}
      <TemplateModal
        key={editingTemplate?.id || (isModalOpen ? 'create' : 'closed')}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTemplate(null);
        }}
        initialData={editingTemplate}
      />

      {/* ── View Template Detail Modal ────────────────────────────────────── */}
      <TemplateDetailModal
        template={viewingTemplate}
        isOpen={!!viewingTemplate}
        onClose={() => setViewingTemplate(null)}
        onEdit={(tmpl) => handleOpenEdit(tmpl)}
        onDuplicate={(tmpl) => handleDuplicate(tmpl)}
      />

      {/* ── Delete Confirmation Dialog ────────────────────────────────────── */}
      {deletingTemplate && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-surface border border-border shadow-xl rounded-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-text-primary text-base">Delete Template?</h3>
                <p className="text-xs text-text-muted">Permanent template removal</p>
              </div>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">
              <strong className="text-text-primary">"{deletingTemplate.name}"</strong> will be removed.
              This action cannot be undone. Questions in the Question Bank will remain safe and unaffected.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/60">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs cursor-pointer"
                onClick={() => setDeletingTemplate(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="text-xs gap-1.5 cursor-pointer"
                disabled={deleteMutation.isPending}
                onClick={handleConfirmDelete}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Template'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyTemplates;
