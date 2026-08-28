import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/AuthStore';
import { LandingNavbar } from './components/LandingNavbar';
import { LandingHero } from './components/LandingHero';
import { HeroProductPreview } from './components/HeroProductPreview';
import { LandingPlatformStats } from './components/LandingPlatformStats';
import { LandingFeatureGrid } from './components/LandingFeatureGrid';
import { LandingHowItWorks } from './components/LandingHowItWorks';
import { LandingCategoryShowcase } from './components/LandingCategoryShowcase';
import { LandingExperiencePreview } from './components/LandingExperiencePreview';
import { LandingCTA } from './components/LandingCTA';
import { LandingFooter } from './components/LandingFooter';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const handleStartMockInterview = () => {
    if (user) {
      const role = user.roles?.[0] || 'STUDENT';
      if (role === 'STUDENT') navigate('/student/interviews');
      else if (role === 'FACULTY') navigate('/faculty/dashboard');
      else navigate('/admin/dashboard');
    } else {
      navigate('/login');
    }
  };

  const handleExplorePracticeBank = () => {
    if (user) {
      navigate('/student/practice');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text-primary flex flex-col selection:bg-accent/30 font-sans">
      {/* 1. Sticky Navigation */}
      <LandingNavbar />

      <main className="flex-1 flex flex-col">
        {/* 2. Hero Section */}
        <LandingHero
          onStartMockInterview={handleStartMockInterview}
          onExplorePracticeBank={handleExplorePracticeBank}
        />

        {/* 3. Hero Product Preview IDE */}
        <HeroProductPreview />

        {/* 4. Platform Overview & Real Metrics */}
        <LandingPlatformStats />

        {/* 5. Supported Feature Architecture Grid */}
        <LandingFeatureGrid />

        {/* 6. Assessment Flow (How It Works) */}
        <LandingHowItWorks />

        {/* 7. Curriculum Domain Showcase */}
        <LandingCategoryShowcase />

        {/* 8. Assessment Experience & Analytics Preview */}
        <LandingExperiencePreview />

        {/* 9. Final Call to Action */}
        <LandingCTA
          onStartMockInterview={handleStartMockInterview}
          onExplorePracticeBank={handleExplorePracticeBank}
        />
      </main>

      {/* 10. Minimal Footer */}
      <LandingFooter />
    </div>
  );
};

export default LandingPage;
