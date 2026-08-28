import React from 'react';
import { PageHeader } from '../../../components/shared/PageHeader';
import { StatCard } from '../../../components/shared/StatCard';
import { DataChart } from '../components/ProgressCharts';
import { EmptyAnalyticsCard } from '../components/EmptyAnalyticsCard';
import { useProfileCompletion, useQuestionStatistics } from '../api/progressApi';
import { BookOpen, Target, CheckCircle2, FolderOpen } from 'lucide-react';
import { Skeleton } from '../../../components/ui/skeleton';

export const ProgressDashboard: React.FC = () => {
  const { data: profileCompletion, isLoading: loadingProfile } = useProfileCompletion();
  const { data: questionStats, isLoading: loadingStats } = useQuestionStatistics();

  const completionPct = profileCompletion?.data?.completionPercentage ?? 0;
  
  const totalQuestions = questionStats?.data?.totalQuestions ?? 0;
  const categoriesCount = Object.keys(questionStats?.data?.byCategory || {}).length;
  const topicsCount = Object.keys(questionStats?.data?.byTopic || {}).length;

  return (
    <div className="space-y-6 md:space-y-8 max-w-7xl mx-auto w-full">
      <PageHeader
        title="Curriculum & Learning Analytics"
        description="Comprehensive breakdown of curriculum questions, difficulty distributions, and learning readiness."
        breadcrumbs={[
          { label: 'Dashboard', href: '/student/dashboard' },
          { label: 'Progress' },
        ]}
      />

      {/* ── Learning Summary ── */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-text-primary">Curriculum Metrics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loadingProfile ? (
            <Skeleton className="h-24 w-full rounded-xl" />
          ) : (
            <StatCard
              title="Profile Readiness"
              value={`${completionPct}%`}
              icon={<Target className="w-5 h-5 text-accent" />}
              subtitle="Candidate setup status"
            />
          )}

          {loadingStats ? (
            <>
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </>
          ) : (
            <>
              <StatCard
                title="Total Problem Bank"
                value={totalQuestions}
                icon={<BookOpen className="w-5 h-5" />}
                subtitle="Curated questions"
              />
              <StatCard
                title="Active Categories"
                value={categoriesCount}
                icon={<FolderOpen className="w-5 h-5" />}
                subtitle="Domain disciplines"
              />
              <StatCard
                title="Active Topics"
                value={topicsCount}
                icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                subtitle="Algorithmic themes"
              />
            </>
          )}
        </div>
      </section>

      {/* ── Curriculum Distribution (Live) ── */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-text-primary">Dataset Distribution</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loadingStats ? (
            <>
              <Skeleton className="h-[280px] w-full rounded-xl" />
              <Skeleton className="h-[280px] w-full rounded-xl" />
              <Skeleton className="h-[280px] w-full rounded-xl" />
            </>
          ) : (
            <>
              <DataChart
                title="Difficulty Distribution"
                data={questionStats?.data?.byDifficulty || {}}
                type="pie"
              />
              <DataChart
                title="Category Distribution"
                data={questionStats?.data?.byCategory || {}}
                type="bar"
              />
              <DataChart
                title="Topic Distribution"
                data={questionStats?.data?.byTopic || {}}
                type="pie"
              />
            </>
          )}
        </div>
      </section>

      {/* ── Historical Performance Cards (Truthful empty states) ── */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-text-primary">Performance Telemetry</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EmptyAnalyticsCard
            title="Competency Growth Over Time"
            description="Complete multiple mock interviews across different dates to visualize your proficiency trend line."
          />
          <EmptyAnalyticsCard
            title="Domain Mastery Benchmark"
            description="Complete targeted practice problems to compare your accuracy against Naan Mudhalvan cohort benchmarks."
          />
        </div>
      </section>
    </div>
  );
};

export default ProgressDashboard;
