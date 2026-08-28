import { useState, useEffect, type FC } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Briefcase, ArrowRight, Menu, X } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { ThemeToggle } from '../../../components/ui/theme-toggle';
import { useAuthStore } from '../../../store/AuthStore';

export const LandingNavbar: FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleDashboardRedirect = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    const role = user.roles?.[0] || 'STUDENT';
    if (role === 'STUDENT') navigate('/student/dashboard');
    else if (role === 'FACULTY') navigate('/faculty/dashboard');
    else navigate('/admin/dashboard');
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-200 ${
        isScrolled
          ? 'border-b border-border bg-surface/90 backdrop-blur-md shadow-sm'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="h-8 w-8 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shadow-xs group-hover:scale-105 transition-transform">
            <Briefcase className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-tight text-text-primary">
              NM Sandbox
            </span>
            <span className="text-[10px] font-mono text-text-muted hidden sm:inline-block leading-tight">
              Naan Mudhalvan
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-text-secondary">
          <a href="#features" className="hover:text-text-primary transition-colors">
            Features
          </a>
          <a href="#workflow" className="hover:text-text-primary transition-colors">
            Workflow
          </a>
          <a href="#categories" className="hover:text-text-primary transition-colors">
            Categories
          </a>
          <a href="#experience" className="hover:text-text-primary transition-colors">
            Experience
          </a>
        </nav>

        {/* Action Controls */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          {user ? (
            <Button
              size="sm"
              onClick={handleDashboardRedirect}
              rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
            >
              Dashboard
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/login')}
              >
                Sign In
              </Button>
              <Button
                size="sm"
                onClick={() => navigate('/register')}
              >
                Register
              </Button>
            </>
          )}
        </div>

        {/* Mobile Actions & Menu Toggle */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Collapsible Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-surface-elevated/95 backdrop-blur-xl px-4 py-4 space-y-3 animate-in slide-in-from-top-2 duration-150 shadow-xl">
          <nav className="flex flex-col space-y-2 text-xs font-semibold text-text-secondary">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-surface-hover hover:text-text-primary transition-colors"
            >
              Features
            </a>
            <a
              href="#workflow"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-surface-hover hover:text-text-primary transition-colors"
            >
              Workflow
            </a>
            <a
              href="#categories"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-surface-hover hover:text-text-primary transition-colors"
            >
              Categories
            </a>
            <a
              href="#experience"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-surface-hover hover:text-text-primary transition-colors"
            >
              Experience
            </a>
          </nav>

          <div className="pt-2 border-t border-border flex flex-col gap-2">
            {user ? (
              <Button
                size="sm"
                className="w-full"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleDashboardRedirect();
                }}
                rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
              >
                Go to Dashboard
              </Button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/login');
                  }}
                >
                  Sign In
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/register');
                  }}
                >
                  Register
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default LandingNavbar;
