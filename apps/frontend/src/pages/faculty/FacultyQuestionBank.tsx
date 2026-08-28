import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  Eye,
  AlertCircle,
  CheckCircle2,
  Code2,
  Layers,
  Sparkles,
  Archive,
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Skeleton } from '../../components/ui/skeleton';
import { EmptyState } from '../../components/shared/EmptyState';
import {
  useQuestions,
  useCategories,
  useDeleteQuestion,
} from '../../api/questions';
import type { QuestionFilterParams } from '../../api/questions';
import { QuestionModal } from './components/QuestionModal';
import { QuestionDetailModal } from './components/QuestionDetailModal';

export const FacultyQuestionBank: React.FC = () => {
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('ALL');
  const [category, setCategory] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [page, setPage] = useState(1);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);
  const [viewingQuestion, setViewingQuestion] = useState<any | null>(null);

  // Delete confirmation
  const [deletingQuestion, setDeletingQuestion] = useState<any | null>(null);

  const queryParams: QuestionFilterParams = {
    search: search.trim() || undefined,
    difficulty: difficulty !== 'ALL' ? difficulty : undefined,
    categoryId: category !== 'ALL' ? category : undefined,
    status: status !== 'ALL' ? status : undefined,
    page,
    limit: 15,
  };

  const { data: questionsRes, isLoading, isError, error, refetch, isFetching } = useQuestions(queryParams);
  const { data: categories } = useCategories();
  const deleteMutation = useDeleteQuestion();

  const questions = questionsRes?.data || [];
  const pagination = questionsRes?.pagination || { total: 0, totalPages: 1, page: 1 };

  const handleOpenCreate = () => {
    setEditingQuestion(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (q: any) => {
    setEditingQuestion(q);
    setIsModalOpen(true);
  };

  const handleOpenView = (q: any) => {
    setViewingQuestion(q);
  };

  const handleConfirmDelete = async () => {
    if (!deletingQuestion) return;
    try {
      await deleteMutation.mutateAsync(deletingQuestion.id);
      setDeletingQuestion(null);
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
              Question Bank
            </h1>
            {pagination && (
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-accent/10 border border-accent/20 text-accent rounded-full font-mono">
                Total: {pagination.total}
              </span>
            )}
          </div>
          <p className="text-xs md:text-sm text-text-secondary">
            Create, manage, and organize coding questions for student assessments.
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
            Create Question
          </Button>
        </div>
      </div>

      {/* ── 2. Search & Filters Bar ────────────────────────────────────────── */}
      <Card className="p-4 bg-surface border-border">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <Input
              type="text"
              placeholder="Search by title, topic, or keyword..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 text-xs"
            />
          </div>

          {/* Difficulty Filter */}
          <div>
            <select
              value={difficulty}
              onChange={(e) => {
                setDifficulty(e.target.value);
                setPage(1);
              }}
              className="w-full h-9 rounded-lg border border-border bg-surface-elevated px-3 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="ALL">All Difficulties</option>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
              <option value="EXPERT">Expert</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="w-full h-9 rounded-lg border border-border bg-surface-elevated px-3 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="ALL">All Categories</option>
              {categories?.map((cat: any) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat._count?.questions || 0})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full h-9 rounded-lg border border-border bg-surface-elevated px-3 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="ALL">All Statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>
      </Card>

      {/* ── 3. Loading State ──────────────────────────────────────────────── */}
      {isLoading && (
        <Card className="p-6 space-y-4">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        </Card>
      )}

      {/* ── 4. Error State ────────────────────────────────────────────────── */}
      {isError && (
        <div className="p-8 text-center space-y-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
          <AlertCircle className="h-6 w-6 text-rose-400 mx-auto" />
          <h3 className="text-sm font-semibold text-text-primary">Failed to load question repository</h3>
          <p className="text-xs text-text-secondary max-w-md mx-auto">
            {(error as any)?.response?.data?.error?.message || (error as any)?.message}
          </p>
          <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-2">
            Try Again
          </Button>
        </div>
      )}

      {/* ── 5. Questions Table ────────────────────────────────────────────── */}
      {!isLoading && !isError && questionsRes && (
        <>
          {questions.length > 0 ? (
            <div className="space-y-4">
              <Card className="overflow-hidden border-border bg-surface">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border bg-surface-elevated/60 text-text-muted uppercase text-[10px] tracking-wider font-mono">
                        <th className="py-3 px-4 font-medium">Question</th>
                        <th className="py-3 px-4 font-medium">Difficulty</th>
                        <th className="py-3 px-4 font-medium">Category / Topic</th>
                        <th className="py-3 px-4 font-medium">Execution Mode</th>
                        <th className="py-3 px-4 font-medium">Test Cases</th>
                        <th className="py-3 px-4 font-medium">Status</th>
                        <th className="py-3 px-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {questions.map((q: any) => {
                        const payload = q.metadata?.jsonPayload || {};
                        const execMode = payload.execution?.executionMode || 'STANDARD_IO';
                        const stats = q.testCaseStats || {
                          total: payload.testCases?.length || 0,
                          visibleCount: payload.testCases?.filter((tc: any) => tc.visibility !== 'HIDDEN' && !tc.isHidden).length || 0,
                          hiddenCount: payload.testCases?.filter((tc: any) => tc.visibility === 'HIDDEN' || tc.isHidden).length || 0,
                        };

                        return (
                          <tr
                            key={q.id}
                            className="hover:bg-surface-elevated/40 transition-colors group cursor-pointer"
                            onClick={() => handleOpenView(q)}
                          >
                            {/* Title & Preview */}
                            <td className="py-3 px-4 max-w-[260px]">
                              <div className="font-semibold text-text-primary truncate">
                                {q.title}
                              </div>
                              <div className="text-[11px] text-text-muted truncate">
                                {q.description}
                              </div>
                            </td>

                            {/* Difficulty */}
                            <td className="py-3 px-4">
                              <span
                                className={`inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                                  q.difficulty === 'EASY'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : q.difficulty === 'HARD' || q.difficulty === 'EXPERT'
                                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                }`}
                              >
                                {q.difficulty}
                              </span>
                            </td>

                            {/* Category / Topic */}
                            <td className="py-3 px-4">
                              <div className="font-medium text-text-secondary truncate max-w-[150px]">
                                {q.category?.name || 'Programming'}
                              </div>
                              {q.topic?.name && (
                                <div className="text-[11px] text-text-muted truncate max-w-[150px]">
                                  {q.topic.name}
                                </div>
                              )}
                            </td>

                            {/* Execution Mode */}
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 text-[10px] font-mono rounded-md bg-accent/10 border border-accent/20 text-accent">
                                {execMode}
                              </span>
                            </td>

                            {/* Test Cases */}
                            <td className="py-3 px-4 font-mono text-[11px]">
                              <span className="text-emerald-400">{stats.visibleCount} Vis</span>
                              <span className="text-text-muted"> / </span>
                              <span className="text-amber-400">{stats.hiddenCount} Hid</span>
                            </td>

                            {/* Status */}
                            <td className="py-3 px-4">
                              <span
                                className={`inline-block px-2.5 py-0.5 text-[10px] font-semibold rounded-full uppercase tracking-wider ${
                                  q.status === 'PUBLISHED'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : q.status === 'DRAFT'
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                    : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                                }`}
                              >
                                {q.status}
                              </span>
                            </td>

                            {/* Action Buttons */}
                            <td className="py-3 px-4 text-right">
                              <div
                                className="flex items-center justify-end gap-1.5"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-text-muted hover:text-text-primary"
                                  onClick={() => handleOpenView(q)}
                                  title="View Question Details"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-text-muted hover:text-accent"
                                  onClick={() => handleOpenEdit(q)}
                                  title="Edit Question"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-text-muted hover:text-rose-400"
                                  onClick={() => setDeletingQuestion(q)}
                                  title="Archive / Delete"
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

              {/* Pagination Bar */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-2 text-xs text-text-muted">
                  <div>
                    Showing page <span className="font-semibold text-text-primary">{pagination.page}</span> of{' '}
                    <span className="font-semibold text-text-primary">{pagination.totalPages}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                      className="text-xs h-8"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= pagination.totalPages}
                      onClick={() => setPage(page + 1)}
                      className="text-xs h-8"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Card className="p-12 text-center bg-surface border-border">
              <div className="space-y-3 max-w-sm mx-auto">
                <BookOpen className="h-8 w-8 text-text-muted mx-auto opacity-50" />
                <h3 className="text-sm font-semibold text-text-primary">No questions found</h3>
                <p className="text-xs text-text-secondary">
                  No questions match your current search and filter criteria.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearch('');
                    setDifficulty('ALL');
                    setCategory('ALL');
                    setStatus('ALL');
                    setPage(1);
                  }}
                  className="text-xs"
                >
                  Reset Filters
                </Button>
              </div>
            </Card>
          )}
        </>
      )}

      {/* ── Question Create / Edit Modal ───────────────────────────────────── */}
      <QuestionModal
        key={editingQuestion?.id || (isModalOpen ? 'create' : 'closed')}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingQuestion(null);
        }}
        initialData={editingQuestion}
      />

      {/* ── Question Detail Preview Modal ─────────────────────────────────── */}
      <QuestionDetailModal
        question={viewingQuestion}
        isOpen={!!viewingQuestion}
        onClose={() => setViewingQuestion(null)}
        onEdit={(q) => handleOpenEdit(q)}
      />

      {/* ── Safe Delete / Archive Confirmation Dialog ──────────────────────── */}
      {deletingQuestion && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-surface border border-border shadow-xl rounded-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 shrink-0">
                <Archive className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-text-primary text-base">Archive Question</h3>
                <p className="text-xs text-text-muted">Safe preservation of historical records</p>
              </div>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">
              Are you sure you want to archive{' '}
              <strong className="text-text-primary">"{deletingQuestion.title}"</strong>?
              Archiving disables new attempts while preserving past student evaluation history and compiler benchmarks.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/60">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => setDeletingQuestion(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="text-xs gap-1.5"
                disabled={deleteMutation.isPending}
                onClick={handleConfirmDelete}
              >
                {deleteMutation.isPending ? 'Archiving...' : 'Confirm Archive'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyQuestionBank;
