import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  User,
  Calendar,
  Clock,
  Award,
  CheckCircle2,
  AlertCircle,
  Brain,
  Code2,
  MessageSquare,
  Eye,
  RefreshCw,
  Search,
  Filter,
  Dices,
  Hand,
  TrendingUp,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import type { FacultyStudentInterviewSummary, FacultyInterviewSessionItem } from '../../../api/faculty';
import { FacultySessionDetailModal } from './FacultySessionDetailModal';

interface StudentInterviewHistoryViewProps {
  summary: FacultyStudentInterviewSummary;
  onBack: () => void;
}

export const StudentInterviewHistoryView: React.FC<StudentInterviewHistoryViewProps> = ({
  summary,
  onBack,
}) => {
  const [selectedTab, setSelectedTab] = useState<'ALL' | 'PRACTICE' | 'MOCK' | 'COMPLETED' | 'IN_PROGRESS'>('ALL');
  const [search, setSearch] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const student = summary.student;
  const sessions = summary.sessions;

  // Filter sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      // Tab filter
      if (selectedTab === 'PRACTICE' && s.template.id) return false;
      if (selectedTab === 'MOCK' && !s.template.id) return false;
      if (selectedTab === 'COMPLETED' && s.overallStatus !== 'COMPLETED' && s.overallStatus !== 'EVALUATED') return false;
      if (selectedTab === 'IN_PROGRESS' && s.overallStatus !== 'IN_PROGRESS') return false;

      // Keyword search
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchTitle = s.template.name.toLowerCase().includes(q);
        const matchStatus = s.overallStatus.toLowerCase().includes(q);
        return matchTitle || matchStatus;
      }
      return true;
    });
  }, [sessions, selectedTab, search]);

  const practiceCount = sessions.filter((s) => !s.template.id).length;
  const mockCount = sessions.filter((s) => !!s.template.id).length;
  const completedCount = summary.completedSessions;
  const inProgressCount = summary.inProgressSessions;

  const handleOpenDetail = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setIsDetailOpen(true);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* ── 1. Navigation Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-2 text-xs font-semibold hover:bg-surface-elevated cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 text-accent" />
          Back to All Students
        </Button>

        <span className="text-xs text-text-muted font-mono">
          Student ID: <strong className="text-text-secondary">{student.rollNumber || student.identityId.substring(0, 8)}</strong>
        </span>
      </div>

      {/* ── 2. Student Hero Profile Banner ────────────────────────────────── */}
      <Card className="p-5 sm:p-6 bg-surface border-border overflow-hidden relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-2xl bg-accent/15 border border-accent/30 text-accent font-bold text-lg flex items-center justify-center shrink-0 shadow-inner">
              {getInitials(student.fullName)}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">
                  {student.fullName}
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase font-mono">
                  Active Student
                </span>
              </div>
              <p className="text-xs text-text-muted font-mono">{student.email}</p>
              <div className="flex items-center gap-2 text-xs text-text-secondary flex-wrap pt-0.5">
                <span>{student.department}</span>
                <span>•</span>
                <span>{student.college}</span>
                <span>•</span>
                <span className="font-mono">{student.batch}</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Strip inside Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border/60">
            <div className="p-2.5 rounded-xl bg-surface-elevated/60 border border-border text-center min-w-[90px]">
              <div className="text-base font-bold font-mono text-text-primary">{summary.totalSessions}</div>
              <div className="text-[10px] text-text-muted font-medium">Total Sessions</div>
            </div>

            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center min-w-[90px]">
              <div className="text-base font-bold font-mono text-blue-400">{summary.inProgressSessions}</div>
              <div className="text-[10px] text-blue-300 font-medium">In Progress</div>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center min-w-[90px]">
              <div className="text-base font-bold font-mono text-emerald-400">{summary.completedSessions}</div>
              <div className="text-[10px] text-emerald-300 font-medium">Completed</div>
            </div>

            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center min-w-[90px]">
              <div className="text-base font-bold font-mono text-purple-400 truncate">
                {summary.averageScore !== null ? `${summary.averageScore}%` : summary.averageScoreDisplay}
              </div>
              <div className="text-[10px] text-purple-300 font-medium">Average Score</div>
            </div>
          </div>
        </div>
      </Card>

      {/* ── 3. Filters & Tabs ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-surface-elevated p-1 rounded-xl border border-border overflow-x-auto text-xs">
          <button
            onClick={() => setSelectedTab('ALL')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              selectedTab === 'ALL'
                ? 'bg-accent text-accent-foreground shadow-xs'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            All Sessions ({sessions.length})
          </button>
          <button
            onClick={() => setSelectedTab('PRACTICE')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              selectedTab === 'PRACTICE'
                ? 'bg-accent text-accent-foreground shadow-xs'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            Practice ({practiceCount})
          </button>
          <button
            onClick={() => setSelectedTab('MOCK')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              selectedTab === 'MOCK'
                ? 'bg-accent text-accent-foreground shadow-xs'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            Mock Tests ({mockCount})
          </button>
          <button
            onClick={() => setSelectedTab('IN_PROGRESS')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              selectedTab === 'IN_PROGRESS'
                ? 'bg-accent text-accent-foreground shadow-xs'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            In Progress ({inProgressCount})
          </button>
          <button
            onClick={() => setSelectedTab('COMPLETED')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              selectedTab === 'COMPLETED'
                ? 'bg-accent text-accent-foreground shadow-xs'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            Completed ({completedCount})
          </button>
        </div>

        {/* Search within student's sessions */}
        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
          <Input
            placeholder="Search sessions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs h-9 bg-surface"
          />
        </div>
      </div>

      {/* ── 4. Chronological Session History List ─────────────────────────── */}
      <div className="space-y-3">
        {filteredSessions.length > 0 ? (
          filteredSessions.map((session, index) => (
            <Card
              key={session.id}
              className="p-4 sm:p-5 bg-surface border-border hover:border-accent/40 transition-all shadow-xs cursor-pointer group"
              onClick={() => handleOpenDetail(session.id)}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Session Title & Metadata */}
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-surface-elevated border border-border text-text-secondary">
                      Attempt #{sessions.length - index}
                    </span>

                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-accent/10 border border-accent/30 text-accent uppercase font-mono">
                      {session.template.interviewType || 'PRACTICE'}
                    </span>

                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase font-mono ${
                        session.overallStatus === 'EVALUATED'
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          : session.overallStatus === 'COMPLETED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : session.overallStatus === 'IN_PROGRESS'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse'
                          : 'bg-surface-elevated text-text-muted border border-border'
                      }`}
                    >
                      {session.overallStatus}
                    </span>

                    <span className="text-[10px] text-text-muted font-mono flex items-center gap-1">
                      {session.template.selectionMode === 'RANDOM' ? (
                        <Dices className="h-3 w-3 text-accent" />
                      ) : (
                        <Hand className="h-3 w-3 text-text-muted" />
                      )}
                      {session.template.selectionMode}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-text-primary group-hover:text-accent transition-colors truncate">
                    {session.template.name}
                  </h3>

                  <div className="flex items-center gap-3 text-[11px] text-text-muted">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(session.createdAt).toLocaleDateString()}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(session.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                {/* 3-Stage Progress Strip */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 shrink-0 py-2 sm:py-0 border-t lg:border-t-0 border-border/60">
                  {/* Stage 1: Aptitude */}
                  <div className="p-2.5 rounded-xl bg-blue-500/5 border border-blue-500/20 min-w-[110px]">
                    <span className="text-[10px] font-bold text-blue-400 flex items-center gap-1 mb-0.5">
                      <Brain className="h-3 w-3" /> Stage 1
                    </span>
                    <div className="text-xs font-mono font-bold text-text-primary">
                      {session.stages.aptitude.score !== null
                        ? `${session.stages.aptitude.score}%`
                        : `${session.stages.aptitude.totalQuestions} Qs`}
                    </div>
                    <span className="text-[9px] text-text-muted uppercase">
                      {session.stages.aptitude.status}
                    </span>
                  </div>

                  {/* Stage 2: Coding */}
                  <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 min-w-[110px]">
                    <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 mb-0.5">
                      <Code2 className="h-3 w-3" /> Stage 2
                    </span>
                    <div className="text-xs font-mono font-bold text-text-primary">
                      {session.stages.coding.passedProblems} / {session.stages.coding.totalProblems} Solved
                    </div>
                    <span className="text-[9px] text-text-muted">
                      {session.stages.coding.totalSubmissions} attempts
                    </span>
                  </div>

                  {/* Stage 3: HR */}
                  <div className="p-2.5 rounded-xl bg-purple-500/5 border border-purple-500/20 min-w-[110px]">
                    <span className="text-[10px] font-bold text-purple-400 flex items-center gap-1 mb-0.5">
                      <MessageSquare className="h-3 w-3" /> Stage 3
                    </span>
                    <div className="text-xs font-bold text-text-primary truncate">
                      Conversational
                    </div>
                    <span className="text-[9px] text-text-muted uppercase">
                      {session.stages.hr.status}
                    </span>
                  </div>
                </div>

                {/* Score & View Details Action */}
                <div className="flex items-center justify-between lg:flex-col lg:items-end gap-2 shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] text-text-muted block">Overall Result</span>
                    <div className="text-sm font-extrabold font-mono text-accent">
                      {session.scoreDisplay}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1.5 border-accent/40 text-accent hover:bg-accent/10 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDetail(session.id);
                    }}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View Details
                  </Button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-10 text-center bg-surface border-border space-y-2 text-text-muted">
            <Layers className="h-8 w-8 mx-auto opacity-40" />
            <h4 className="text-sm font-bold text-text-primary">No sessions match your filter</h4>
            <p className="text-xs">Try selecting a different tab or clearing your search filter.</p>
          </Card>
        )}
      </div>

      {/* ── 5. Session Detail Modal ───────────────────────────────────────── */}
      <FacultySessionDetailModal
        sessionId={selectedSessionId}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedSessionId(null);
        }}
      />
    </div>
  );
};

export default StudentInterviewHistoryView;
