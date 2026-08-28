import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { PageHeader } from '../../../components/shared/PageHeader';
import { ReportWorkspace } from '../components/ReportWorkspace';

export const InterviewSummary: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) {
    return null;
  }

  return (
    <motion.div 
      className="space-y-6 max-w-7xl mx-auto w-full pb-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <PageHeader
        title="Assessment Report"
        description={`Detailed competency breakdown for session ${id.substring(0, 8)}...`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/student/dashboard' }, 
          { label: 'Interviews', href: '/student/interviews' },
          { label: 'Report' }
        ]}
        actions={
          <Button variant="outline" onClick={() => navigate('/student/interviews')} className="gap-2">
            <ChevronLeft className="h-4 w-4" /> Return to Interviews
          </Button>
        }
      />

      <ReportWorkspace interviewId={id} />
    </motion.div>
  );
};
