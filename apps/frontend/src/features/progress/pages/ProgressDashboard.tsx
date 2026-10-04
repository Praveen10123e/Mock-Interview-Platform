import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../components/shared/PageHeader';
import { StatCard } from '../../../components/shared/StatCard';
import { PerformanceTrendChart, type InterviewProgressPoint } from '../components/PerformanceTrendChart';
import { RoundPerformanceChart } from '../components/RoundPerformanceChart';
import { SkillPerformanceTable, type SkillMetric } from '../components/SkillPerformanceTable';
import { StrengthsAndAttention } from '../components/StrengthsAndAttention';
import { InterviewService } from '../../interview/services/interview.service';
import { useStatistics, useCategories } from '../../../api/questions';
import { getProcessedStudentCategories } from '../../../utils/categoryMapping';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';
import {
  TrendingUp,
  Award,
  Calendar,
  BookOpen,
  ArrowRight,
  Sparkles,
  Clock,
  Compass,
} from 'lucide-react';

export const ProgressDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState<any[]>([]);
  const [isLoadingInterviews, setIsLoadingInterviews] = useState(true);
  const { data: statsData, isLoading: isLoadingStats } = useStatistics();
  const { data: rawCategories } = useCategories();

  useEffect(() => {
    setIsLoadingInterviews(true);
    InterviewService.getInterviews()
      .then((data) => {
        setInterviews(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error('Failed to load progress interviews:', err);
      })
      .finally(() => {
        setIsLoadingInterviews(false);
      });
  }, []);

  // ── Extract Chronological Completed Interviews ──
  // Stored interviews are descending (latest first). Reverse to get chronological (earliest -> latest).
  const completedChronological = interviews
    .filter((i) => i.state === 'COMPLETED' || i.session?.finalizedAt)
    .slice()
    .reverse();

  const trendPoints: InterviewProgressPoint[] = [];

  completedChronological.forEach((inv, idx) => {
    const snap = inv.session?.reportSnapshot;
    const overall = snap?.overallScore ?? snap?.overallProficiencyScore;
    if (typeof overall !== 'number' || isNaN(overall)) return;

    const dateStr = inv.createdAt || inv.session?.finalizedAt;
    const d = dateStr ? new Date(dateStr) : new Date();
    const formattedDate = !isNaN(d.getTime())
      ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : `Assessment ${idx + 1}`;

    const apt = typeof snap?.stages?.aptitude?.scorePercentage === 'number' ? snap.stages.aptitude.scorePercentage : null;
    const coding = typeof snap?.stages?.coding?.scorePercentage === 'number' ? snap.stages.coding.scorePercentage : null;
    const hr = typeof (snap?.stages?.hr?.analysis?.overallScore ?? snap?.stages?.hr?.scorePercentage) === 'number'
      ? (snap?.stages?.hr?.analysis?.overallScore ?? snap?.stages?.hr?.scorePercentage)
      : null;

    trendPoints.push({
      id: inv.id,
      interviewNumber: idx + 1,
      label: `Interview ${idx + 1}`,
      formattedDate,
      overallScore: overall,
      aptitudeScore: apt,
      codingScore: coding,
      hrScore: hr,
    });
  });

  const totalEvaluationsCount = trendPoints.length;
  const hasMultipleInterviews = totalEvaluationsCount >= 2;

  // ── Growth Summary Calculations ──
  const firstPoint = trendPoints[0] || null;
  const latestPoint = trendPoints[trendPoints.length - 1] || null;

  const firstScore = firstPoint?.overallScore ?? null;
  const latestScore = latestPoint?.overallScore ?? null;

  let netScoreChange: number | null = null;
  let percentChange: number | null = null;

  if (hasMultipleInterviews && firstScore !== null && latestScore !== null) {
    netScoreChange = latestScore - firstScore;
    if (firstScore > 0) {
      percentChange = Math.round(((latestScore - firstScore) / firstScore) * 1000) / 10;
    } else {
      percentChange = null;
    }
  }

  // ── Extract Skills & Competency Dimension Data from Stored Evidence ──
  const latestSnapshot = completedChronological[completedChronological.length - 1]?.session?.reportSnapshot || null;
  const prevSnapshot = completedChronological.length >= 2
    ? completedChronological[completedChronological.length - 2]?.session?.reportSnapshot
    : null;

  const skillsList: SkillMetric[] = [];

  if (latestSnapshot) {
    const hrAnalysis = latestSnapshot?.stages?.hr?.analysis;
    const prevHrAnalysis = prevSnapshot?.stages?.hr?.analysis;
    const hrCompetencies = hrAnalysis?.competencyScores || {};
    const prevHrCompetencies = prevHrAnalysis?.competencyScores || {};

    // 8 Authorized HR Dimensions
    const hrDimensionDefinitions: { key: string; name: string; desc: string }[] = [
      { key: 'relevance', name: 'Relevance', desc: 'Direct alignment with interview queries' },
      { key: 'specificity', name: 'Specificity', desc: 'Concrete technical examples & metrics' },
      { key: 'evidence', name: 'Evidence', desc: 'Demonstrated problem-solving track record' },
      { key: 'structure', name: 'Structure', desc: 'Logical delivery using the STAR methodology' },
      { key: 'clarity', name: 'Clarity', desc: 'Concise, professional articulation' },
      { key: 'technicalDepth', name: 'Technical Depth', desc: 'Architectural & algorithmic nuance' },
      { key: 'ownership', name: 'Ownership', desc: 'Accountability and initiative in execution' },
      { key: 'professionalism', name: 'Professionalism', desc: 'Poise, ethical standards & tone' },
    ];

    hrDimensionDefinitions.forEach((dim) => {
      const score = hrCompetencies[dim.key] ?? (hrAnalysis?.overallScore || null);
      if (typeof score === 'number' && score > 0) {
        const prevScore = prevHrCompetencies[dim.key] ?? null;
        skillsList.push({
          name: dim.name,
          category: 'HR Behavioral',
          score: Math.round(score),
          previousScore: typeof prevScore === 'number' ? Math.round(prevScore) : null,
          description: dim.desc,
        });
      }
    });

    // Coding Technical Dimensions
    const codingStage = latestSnapshot?.stages?.coding;
    const prevCodingStage = prevSnapshot?.stages?.coding;
    if (codingStage && typeof codingStage.scorePercentage === 'number') {
      skillsList.push({
        name: 'Algorithmic Problem Solving',
        category: 'Coding Technical',
        score: Math.round(codingStage.scorePercentage),
        previousScore: prevCodingStage ? Math.round(prevCodingStage.scorePercentage) : null,
        description: 'Time and space optimal algorithmic implementation',
      });
      if (typeof codingStage.totalTestsPassed === 'number' && codingStage.totalTestsCount > 0) {
        const testPassRate = Math.round((codingStage.totalTestsPassed / codingStage.totalTestsCount) * 100);
        skillsList.push({
          name: 'Test Case & Edge Case Coverage',
          category: 'Coding Technical',
          score: testPassRate,
          description: `${codingStage.totalTestsPassed}/${codingStage.totalTestsCount} test cases verified in execution`,
        });
      }
    }

    // Aptitude Dimensions
    const aptStage = latestSnapshot?.stages?.aptitude;
    const prevAptStage = prevSnapshot?.stages?.aptitude;
    if (aptStage && typeof aptStage.scorePercentage === 'number') {
      skillsList.push({
        name: 'Quantitative & Logical Reasoning',
        category: 'Aptitude & Logic',
        score: Math.round(aptStage.scorePercentage),
        previousScore: prevAptStage ? Math.round(prevAptStage.scorePercentage) : null,
        description: `${aptStage.correctCount ?? 0}/${aptStage.totalQuestions ?? 0} correct problem solutions`,
      });
    }
  }

  // ── Extract Evidence-Backed Strengths & Areas Needing Attention ──
  const extractedStrengths: { title: string; metric?: string; detail: string }[] = [];
  const extractedAttention: { title: string; metric?: string; detail: string; actionRoute?: string; actionLabel?: string }[] = [];

  if (latestSnapshot) {
    // Check Aptitude performance
    const apt = latestSnapshot?.stages?.aptitude;
    if (apt && typeof apt.scorePercentage === 'number') {
      if (apt.scorePercentage >= 75) {
        extractedStrengths.push({
          title: 'Aptitude & Logical Consistency',
          metric: `${apt.scorePercentage}%`,
          detail: `Demonstrated high accuracy with ${apt.correctCount}/${apt.totalQuestions} questions answered correctly.`,
        });
      } else {
        extractedAttention.push({
          title: 'Quantitative & Analytical Aptitude',
          metric: `${apt.scorePercentage}%`,
          detail: 'Accuracy in timed problem sets can be improved through systematic practice.',
          actionRoute: '/student/practice/categories',
          actionLabel: 'Practice Aptitude',
        });
      }
    }

    // Check Coding performance
    const coding = latestSnapshot?.stages?.coding;
    if (coding && typeof coding.scorePercentage === 'number') {
      if (coding.scorePercentage >= 75) {
        extractedStrengths.push({
          title: 'Algorithmic Implementation',
          metric: `${coding.scorePercentage}%`,
          detail: `Solved ${coding.problemsAccepted}/${coding.totalProblems} assigned problems successfully against all unit test cases.`,
        });
      } else {
        extractedAttention.push({
          title: 'Data Structures & Edge Cases',
          metric: `${coding.scorePercentage}%`,
          detail: 'Solve targeted algorithmic problems and verify edge cases using the interactive Judge0 compiler.',
          actionRoute: '/student/practice/questions',
          actionLabel: 'Practice Coding',
        });
      }
    }

    // Check HR performance
    const hr = latestSnapshot?.stages?.hr;
    const hrScoreVal = hr?.analysis?.overallScore ?? hr?.scorePercentage;
    if (typeof hrScoreVal === 'number') {
      if (hrScoreVal >= 75) {
        extractedStrengths.push({
          title: 'Behavioral Communication & Structure',
          metric: `${hrScoreVal}%`,
          detail: 'Clear, well-articulated situational answers delivered with structured problem-solving evidence.',
        });
      } else {
        extractedAttention.push({
          title: 'Behavioral Depth & STAR Structure',
          metric: `${hrScoreVal}%`,
          detail: 'Incorporate concrete technical metrics, role responsibilities, and quantified outcomes in responses.',
          actionRoute: '/student/interviews',
          actionLabel: 'Practice Mock Assessment',
        });
      }
    }

    // Incorporate stored narrative strengths & growth areas if present
    if (Array.isArray(latestSnapshot.strengths)) {
      latestSnapshot.strengths.slice(0, 2).forEach((strText: string) => {
        if (strText && !extractedStrengths.some((s) => s.title.includes(strText.slice(0, 15)))) {
          extractedStrengths.push({
            title: 'Demonstrated Competency',
            detail: strText,
          });
        }
      });
    }

    if (Array.isArray(latestSnapshot.growthAreas)) {
      latestSnapshot.growthAreas.slice(0, 2).forEach((gapText: string) => {
        if (gapText && !extractedAttention.some((a) => a.title.includes(gapText.slice(0, 15)))) {
          extractedAttention.push({
            title: 'Targeted Focus Area',
            detail: gapText,
            actionRoute: '/student/practice',
            actionLabel: 'Continue Practice',
          });
        }
      });
    }
  }

  // ── Practice Curriculum Categories ──
  const categories = getProcessedStudentCategories(rawCategories || []);
  const totalQuestionsCount = statsData?.totalQuestions ?? 0;

  return (
    <div className="space-y-6 md:space-y-8 max-w-7xl mx-auto w-full pb-12">
      {/* ── Page Header ── */}
      <PageHeader
        title="MY PROGRESS"
        description="Track how your interview performance and preparation are improving over time."
        breadcrumbs={[
          { label: 'Dashboard', href: '/student/dashboard' },
          { label: 'My Progress' },
        ]}
        actions={
          <Button
            onClick={() => navigate('/student/interviews')}
            size="sm"
            leftIcon={<Calendar className="h-4 w-4" />}
          >
            New Mock Assessment
          </Button>
        }
      />

      {/* ── 1. Longitudinal Growth Summary (Top Metric Row) ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5 font-mono">
            <Award className="h-4 w-4 text-blue-600" />
            Performance Growth Summary
          </h2>
          {hasMultipleInterviews && (
            <span className="text-[11px] text-slate-500 font-mono">
              Evaluated across {totalEvaluationsCount} sequential sessions
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="First Recorded Score"
            value={firstScore !== null ? `${firstScore}/100` : '--'}
            subtitle={firstPoint ? `Initial baseline (${firstPoint.formattedDate})` : 'Awaiting first assessment'}
            icon={<Clock className="h-5 w-5" />}
            tone="violet"
          />
          <StatCard
            title="Latest Score"
            value={latestScore !== null ? `${latestScore}/100` : '--'}
            subtitle={latestPoint ? `Most recent (${latestPoint.formattedDate})` : 'Awaiting first assessment'}
            icon={<Award className="h-5 w-5" />}
            tone="accent"
          />
          <StatCard
            title="Score Trajectory"
            value={
              hasMultipleInterviews && netScoreChange !== null
                ? `${netScoreChange >= 0 ? `+${netScoreChange}` : netScoreChange} pts`
                : totalEvaluationsCount === 1
                ? 'Baseline Set'
                : '--'
            }
            subtitle={
              hasMultipleInterviews && netScoreChange !== null
                ? netScoreChange >= 0
                  ? 'Net improvement achieved'
                  : 'Score variation noted'
                : 'Requires 2+ completed interviews'
            }
            icon={<TrendingUp className="h-5 w-5" />}
            tone={netScoreChange !== null && netScoreChange >= 0 ? 'success' : netScoreChange !== null ? 'warning' : 'neutral'}
          />
          <StatCard
            title="Growth Rate"
            value={
              hasMultipleInterviews && percentChange !== null
                ? `${percentChange >= 0 ? `+${percentChange}` : percentChange}%`
                : totalEvaluationsCount === 1
                ? '1st Assessment'
                : '--'
            }
            subtitle={hasMultipleInterviews ? 'Cumulative progress rate' : 'Calculates after 2nd assessment'}
            icon={<Sparkles className="h-5 w-5" />}
            tone={percentChange !== null && percentChange >= 0 ? 'gold' : 'neutral'}
          />
        </div>
      </section>

      {/* ── 2. Performance Trends Over Time ── */}
      <section className="space-y-6">
        {isLoadingInterviews ? (
          <Skeleton className="h-[360px] w-full rounded-2xl" />
        ) : hasMultipleInterviews ? (
          <div className="space-y-6">
            {/* Overall Progression Trend Chart */}
            <PerformanceTrendChart data={trendPoints} />

            {/* Round-by-Round Progression Comparison Chart */}
            <RoundPerformanceChart data={trendPoints} />
          </div>
        ) : totalEvaluationsCount === 1 ? (
          <Card className="p-6 md:p-8 text-center space-y-4 overflow-hidden border-blue-200 bg-blue-50/20">
            <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-base font-bold text-slate-900">
                1 Completed Assessment Recorded ({latestScore}/100)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Complete another mock interview to unlock your chronological performance trajectory, round-by-round comparative trendlines, and growth metrics.
              </p>
            </div>
            <div className="pt-2">
              <Button onClick={() => navigate('/student/interviews')} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                Start Second Mock Interview
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="p-8 md:p-12 text-center space-y-4 overflow-hidden border-slate-200 bg-white">
            <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 flex items-center justify-center mx-auto">
              <Compass className="h-6 w-6" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-base font-bold text-slate-900">No Assessment History Recorded</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Complete your first mock interview to start tracking your score progression, multi-round calibration, and skill development over time.
              </p>
            </div>
            <div className="pt-2">
              <Button onClick={() => navigate('/student/interviews')} className="bg-blue-600 hover:bg-blue-700 text-white">
                Start First Mock Assessment
              </Button>
            </div>
          </Card>
        )}
      </section>

      {/* ── 3. Skill & Competency Dimension Performance ── */}
      {skillsList.length > 0 && (
        <section className="space-y-3">
          <SkillPerformanceTable skills={skillsList} hasHistory={hasMultipleInterviews} />
        </section>
      )}

      {/* ── 4. Strengths & Areas Needing Attention ── */}
      {(extractedStrengths.length > 0 || extractedAttention.length > 0) && (
        <section className="space-y-3">
          <StrengthsAndAttention
            strengths={extractedStrengths}
            attentionAreas={extractedAttention}
          />
        </section>
      )}

      {/* ── 5. Practice Progress & Problem Bank Coverage (Secondary Section) ── */}
      <section className="space-y-3 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5 font-mono">
              <BookOpen className="h-4 w-4 text-blue-600" />
              Practice & Curriculum Domain Coverage
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Curated problem bank distribution supporting your mock interview preparation
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/student/practice')}
            className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1 font-semibold"
          >
            Explore Question Bank ({totalQuestionsCount}) <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {isLoadingStats ? (
            <>
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </>
          ) : (
            categories.slice(0, 6).map((cat) => (
              <div
                key={cat.name}
                onClick={() => navigate(`/student/practice/questions?category=${encodeURIComponent(cat.name)}`)}
                className="p-4 rounded-xl bg-white border border-slate-200/80 hover:border-blue-300 hover:shadow-xs transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {cat.name}
                  </span>
                  <span className="text-xs font-mono font-bold text-blue-600">
                    {cat.count} Questions
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-1 mb-3">{cat.description}</p>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full"
                    style={{
                      width: `${Math.min(100, Math.max(10, Math.round((cat.count / Math.max(1, totalQuestionsCount)) * 100 * 3)))}%`,
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default ProgressDashboard;
