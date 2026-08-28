import type { FC } from 'react';
import { StatCard } from '../../components/shared/StatCard';
import { EmptyState } from '../../components/shared/EmptyState';
import { Server, Database, Activity, BookOpen } from 'lucide-react';
import { useQuestionStatistics } from '../../features/progress/api/progressApi';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';

export const AdminDashboard: FC = () => {
  const navigate = useNavigate();
  const { data: questionStats } = useQuestionStatistics();
  const totalQuestions = questionStats?.data?.totalQuestions ?? 0;
  const categoriesCount = Object.keys(questionStats?.data?.byCategory || {}).length;

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/8 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-text-primary">
            System Administration
          </h1>
          <p className="text-xs md:text-sm text-text-secondary mt-1">
            Global overview of platform configuration and datasets.
          </p>
        </div>
        <div className="flex gap-2.5">
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/questions')}>
            <BookOpen className="h-4 w-4 mr-2" /> Dataset Browser
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Questions"
          value={totalQuestions}
          icon={<Database className="h-5 w-5" />}
          subtitle="Curated dataset records"
        />
        <StatCard
          title="Curriculum Domains"
          value={categoriesCount}
          icon={<Server className="h-5 w-5" />}
          subtitle="Registered categories"
        />
        <StatCard
          title="Judge0 Execution Nodes"
          value="Healthy"
          icon={<Activity className="h-5 w-5" />}
          subtitle="Judge0 service connected"
        />
        <StatCard
          title="System Status"
          value="Operational"
          icon={<Activity className="h-5 w-5" />}
          subtitle="API Gateway & microservices"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <EmptyState
          icon={<Activity className="h-5 w-5" />}
          title="System Audit Telemetry"
          description="Detailed execution gateway telemetry and service logs are stored in backend log sinks."
        />
        <EmptyState
          icon={<Database className="h-5 w-5" />}
          title="Dataset Management"
          description="Manage question datasets, import new curricular benchmarks, and configure difficulty distributions."
        />
      </div>
    </div>
  );
};

export default AdminDashboard;
