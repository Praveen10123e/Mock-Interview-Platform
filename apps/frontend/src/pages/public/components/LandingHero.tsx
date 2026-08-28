import type { FC } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Play, Code2, ShieldCheck, Terminal, Cpu } from 'lucide-react';
import { Button } from '../../../components/ui/button';

interface LandingHeroProps {
  onStartMockInterview: () => void;
  onExplorePracticeBank: () => void;
}

export const LandingHero: FC<LandingHeroProps> = ({
  onStartMockInterview,
  onExplorePracticeBank,
}) => {
  return (
    <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full text-center">
      {/* Subtle Ambient Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[340px] bg-accent/8 blur-[130px] rounded-full pointer-events-none -z-10" />

      {/* Eyebrow Chip */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-accent/10 border border-accent/25 text-accent text-xs font-semibold mb-6 shadow-xs"
      >
        <Sparkles className="h-3.5 w-3.5" />
        <span>Naan Mudhalvan AI-Driven Technical Interview Platform</span>
      </motion.div>

      {/* Hero Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: 0.05 }}
        className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-text-primary max-w-4xl mx-auto leading-[1.12]"
      >
        Master Technical Interviews with Production-Grade Rigor.
      </motion.h1>

      {/* Subheadline */}
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: 0.1 }}
        className="text-sm md:text-base text-text-secondary max-w-2xl mx-auto mt-5 leading-relaxed"
      >
        Experience realistic multi-round mock interviews with Judge0 code execution, anti-cheat proctoring, AI conversational HR assessments, and automated multidimensional evaluation reports.
      </motion.p>

      {/* Hero CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: 0.15 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mt-8"
      >
        <Button
          size="lg"
          onClick={onStartMockInterview}
          leftIcon={<Play className="h-4 w-4 fill-current" />}
          className="w-full sm:w-auto"
        >
          Start Mock Interview
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={onExplorePracticeBank}
          leftIcon={<Code2 className="h-4 w-4" />}
          className="w-full sm:w-auto"
        >
          Explore Practice Bank
        </Button>
      </motion.div>

      {/* High-Level Feature Trust Pills */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: 0.2 }}
        className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-10 text-xs font-semibold text-text-muted"
      >
        <div className="flex items-center gap-1.5">
          <Terminal className="h-3.5 w-3.5 text-accent" />
          <span>5 Language Judge0 Runner</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span>Focus Guard Telemetry</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Cpu className="h-3.5 w-3.5 text-amber-500" />
          <span>3-Round Assessment Flow</span>
        </div>
      </motion.div>
    </section>
  );
};

export default LandingHero;
