import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  BookOpen,
  Code2,
  BarChart3,
  Calendar,
  Sparkles
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { useAuthStore } from '../../store/AuthStore';
import { useProfileCompletion } from '../../hooks/useProfile';
import { useStatistics, useCategories } from '../../api/questions';
import { Skeleton } from '../../components/ui/skeleton';
import { InterviewService } from '../../features/interview/services/interview.service';
import { StatusBadge } from '../../components/ui/badge';
import { EmptyState } from '../../components/shared/EmptyState';
import { getProcessedStudentCategories } from '../../utils/categoryMapping';

export const StudentDashboard: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const { data: completionData, isLoading: isLoadingCompletion } = useProfileCompletion();
  const { data: statsData } = useStatistics();
  const { data: rawCategories } = useCategories();
  const [interviews, setInterviews] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    InterviewService.getInterviews().then(setInterviews).catch(console.error);
  }, []);

  const completedCount = interviews.filter(i => i.state === 'COMPLETED').length;
  const recentInterviews = interviews.slice(0, 4);
  const categories = getProcessedStudentCategories(rawCategories || []);
  const completionPercentage = completionData?.data?.completionPercentage || 0;

  return (
    <div className="space-y-6 md:space-y-8 max-w-7xl mx-auto w-full">
      {/* ── 1. Welcome Banner ── */}
      <div className="rounded-2xl border border-border-card bg-surface p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm relative overflow-hidden">
        <div className="space-y-2 relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/25 text-accent text-xs font-semibold">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Naan Mudhalvan Candidate Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
            Welcome back, {user?.email?.split('@')[0] || 'Candidate'}.
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
            Practice algorithmic challenges, test relational SQL queries, or launch an automated 3-round mock interview with proctoring.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10 shrink-0 w-full sm:w-auto">
          <Button
            onClick={() => navigate('/student/interviews')}
            size="lg"
            leftIcon={<Calendar className="h-4 w-4" />}
            className="flex-1 sm:flex-initial"
          >
            Mock Interviews
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/student/practice')}
            size="lg"
            leftIcon={<Code2 className="h-4 w-4" />}
            className="flex-1 sm:flex-initial"
          >
            Practice Bank
          </Button>
        </div>
      </div>

      {/* ── 2. Professional Stats Row (4 Real Metrics) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Total Sessions
            </span>
            <div className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
              {interviews.length}
            </div>
            <p className="text-xs text-text-muted">Recorded mock attempts</p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <History className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Completed
            </span>
            <div className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
              {completedCount}
            </div>
            <p className="text-xs text-text-muted">Evaluated & scored</p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Question Bank
            </span>
            <div className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
              {statsData?.totalQuestions ?? 60}
            </div>
            <p className="text-xs text-text-muted">Curriculum problems</p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <BookOpen className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Profile Readiness
            </span>
            <div className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
              {completionPercentage}%
            </div>
            <p className="text-xs text-text-muted">Academic details</p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
        </Card>
      </div>

      {/* ── 3. Main Dashboard Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        {/* Left Column: Recent Activity + Practice Quick Access (Col 4) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Recent Activity Card */}
          <Card className="p-5 md:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-accent" />
                <h2 className="text-base font-semibold text-text-primary">Recent Interview Activity</h2>
              </div>
              {recentInterviews.length > 0 && (
                <button 
                  onClick={() => navigate('/student/interviews')}
                  className="text-xs text-accent hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <span>View all</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            
            {recentInterviews.length > 0 ? (
              <div className="space-y-2.5">
                {recentInterviews.map((interview) => (
                  <div 
                    key={interview.id} 
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3.5 rounded-xl border border-border-card bg-surface-elevated hover:bg-surface-hover transition-colors"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-text-primary truncate">
                          {interview.title || 'Technical Assessment Session'}
                        </p>
                        <StatusBadge status={interview.state || 'PENDING'} />
                      </div>
                      <p className="text-xs text-text-muted">
                        Created on {new Date(interview.createdAt).toLocaleDateString()} · {interview.interviewType || 'PRACTICE'}
                      </p>
                    </div>

                    <Button 
                      variant={interview.state === 'COMPLETED' ? 'secondary' : 'default'}
                      size="sm" 
                      onClick={() => navigate(interview.state === 'COMPLETED' ? `/student/interviews/summary/${interview.id}` : `/student/interviews/session/${interview.id}`)}
                      className="shrink-0 w-full sm:w-auto"
                    >
                      {interview.state === 'COMPLETED' ? 'View Report' : 'Resume Session'}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                compact
                icon={<Calendar className="h-5 w-5" />}
                title="No interview sessions recorded yet"
                description="Start a practice interview session to experience the proctored 3-round format."
                actionLabel="Start Mock Interview"
                onAction={() => navigate('/student/interviews')}
              />
            )}
          </Card>

          {/* Quick Practice Access Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <Code2 className="h-4 w-4 text-accent" /> Recommended Curriculum Domains
              </h3>
              <button
                onClick={() => navigate('/student/practice/categories')}
                className="text-xs text-accent hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>All domains</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {categories.slice(0, 3).map((cat) => (
                <Card
                  key={cat.name}
                  className="p-4 cursor-pointer hover:border-accent/40 transition-all flex flex-col justify-between"
                  onClick={() => navigate(`/student/practice/questions?category=${encodeURIComponent(cat.name)}`)}
                >
                  <div className="space-y-2">
                    <div className="p-2 rounded-lg bg-accent/10 text-accent w-fit shadow-xs">
                      {cat.icon}
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-text-primary">{cat.name}</h4>
                      <p className="text-[11px] text-text-muted mt-0.5">{cat.count} problems</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Profile Readiness & Analytics Context (Col 3) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Profile Completion Card */}
          <Card className="p-5 md:p-6 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-text-primary">Profile Readiness</h2>
                <span className="text-xs font-mono font-bold text-accent">{completionPercentage}%</span>
              </div>

              {isLoadingCompletion ? (
                <div className="flex flex-col items-center justify-center py-4 space-y-3">
                  <Skeleton className="h-24 w-24 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-2">
                  <div className="relative h-24 w-24 rounded-full flex items-center justify-center mb-3">
                    <span className="text-2xl font-bold text-text-primary font-mono">
                      {completionPercentage}%
                    </span>
                    <svg className="absolute top-0 left-0 h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke="currentColor"
                        strokeWidth="7"
                        className="text-border"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke="currentColor"
                        strokeWidth="7"
                        className="text-accent transition-all duration-700 ease-in-out"
                        strokeDasharray="251.2"
                        strokeDashoffset={251.2 - (251.2 * completionPercentage) / 100}
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <p className="text-xs text-center text-text-secondary leading-relaxed max-w-xs">
                    Complete your academic department and skill targets to personalize mock interview rubrics.
                  </p>
                </div>
              )}
            </div>

            <Button 
              variant="secondary" 
              className="w-full" 
              size="sm"
              onClick={() => navigate('/student/profile')}
            >
              Update Candidate Profile
            </Button>
          </Card>

          {/* AI Assessment Guidance Card */}
          <Card className="p-5 md:p-6 space-y-3">
            <div className="flex items-center gap-2 text-text-primary font-semibold text-sm">
              <BarChart3 className="h-4 w-4 text-accent" />
              <span>Assessment & Scoring Insights</span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Completing full 3-round assessments automatically generates multidimensional scoring cards across code accuracy, runtime efficiency, and behavioral communication.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => navigate('/student/reports')}
              rightIcon={<ArrowRight className="h-3 w-3" />}
            >
              View Assessment Reports
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
