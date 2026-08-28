import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase } from 'lucide-react';

export const LandingFooter: FC = () => {
  return (
    <footer className="border-t border-border bg-surface-deep/60 py-12 px-4 sm:px-6 lg:px-8 text-xs text-text-muted">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Brand Description */}
        <div className="flex flex-col items-center md:items-start space-y-2 text-center md:text-left">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
              <Briefcase className="h-3.5 w-3.5" />
            </div>
            <span className="font-bold text-sm text-text-primary tracking-tight">
              NM Mock Interview Sandbox
            </span>
          </div>
          <p className="max-w-sm text-text-secondary leading-relaxed">
            AI-driven technical interview simulation and proctored assessment platform built for the Naan Mudhalvan engineering initiative.
          </p>
        </div>

        {/* Navigation & Auth Links */}
        <div className="flex flex-wrap items-center justify-center gap-6 font-semibold text-text-secondary">
          <a href="#features" className="hover:text-text-primary transition-colors">
            Features
          </a>
          <a href="#workflow" className="hover:text-text-primary transition-colors">
            Workflow
          </a>
          <a href="#categories" className="hover:text-text-primary transition-colors">
            Categories
          </a>
          <Link to="/login" className="hover:text-text-primary transition-colors">
            Sign In
          </Link>
          <Link to="/register" className="hover:text-text-primary transition-colors">
            Create Account
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <p>&copy; {new Date().getFullYear()} NM Mock Interview Sandbox. Naan Mudhalvan Initiative.</p>
        <p className="text-[11px] text-text-muted">
          All mock assessments, code executions, and evaluation reports are proctored and protected.
        </p>
      </div>
    </footer>
  );
};

export default LandingFooter;
