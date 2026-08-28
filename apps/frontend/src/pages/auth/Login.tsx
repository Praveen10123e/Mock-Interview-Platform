import type { FC } from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mail, ShieldCheck, ArrowRight, Eye, EyeOff, Briefcase, ChevronLeft } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import api from '../../api/axios/instance';
import { useAuthStore } from '../../store/AuthStore';
import { useNavigate, Link } from 'react-router-dom';

const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof LoginSchema>;

export const Login: FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(LoginSchema),
  });
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const res = await api.post('/auth/login', data);
      const responseData = res.data.data;
      setAuth(responseData.user, responseData.accessToken);

      const role = responseData.user.roles[0];
      if (role === 'STUDENT') navigate('/student/dashboard');
      else if (role === 'FACULTY') navigate('/faculty/dashboard');
      else navigate('/admin/dashboard');
    } catch (error: any) {
      console.error('Login failed', error);
      setAuthError(error.response?.data?.error?.message || error.response?.data?.message || 'Invalid credentials. Please verify your email and password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-bg text-text-primary relative overflow-hidden px-4 py-8 selection:bg-accent/30">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center z-10">
        {/* Left Column: Brand Pillars */}
        <div className="hidden md:flex flex-col justify-center space-y-6 pr-4">
          <Link to="/" className="inline-flex items-center gap-2 text-xs text-text-muted hover:text-text-primary transition-colors">
            <ChevronLeft className="h-3.5 w-3.5" /> Back to Overview
          </Link>

          <div className="space-y-3">
            <div className="h-10 w-10 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shadow-xs">
              <Briefcase className="h-5 w-5" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-text-primary">
              Naan Mudhalvan Sandbox
            </h1>
            <p className="text-sm text-text-secondary leading-relaxed">
              Log in to continue your technical mock interview sessions, view scoring analytics, and practice algorithmic problems.
            </p>
          </div>

          <div className="space-y-2.5 pt-2">
            <div className="flex items-center gap-2.5 text-xs text-text-secondary">
              <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>Proctored diagnostic & focus-tracking environment</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-text-secondary">
              <ShieldCheck className="h-4 w-4 text-accent shrink-0" />
              <span>Multi-language Judge0 code execution</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-text-secondary">
              <ShieldCheck className="h-4 w-4 text-amber-500 shrink-0" />
              <span>Multidimensional radar competency evaluation</span>
            </div>
          </div>
        </div>

        {/* Right Column: Login Card */}
        <Card className="p-6 sm:p-8">
          <div className="mb-6">
            <div className="md:hidden mb-4">
              <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors">
                <ChevronLeft className="h-3.5 w-3.5" /> Back to Overview
              </Link>
            </div>
            <h2 className="text-xl font-bold text-text-primary tracking-tight">Sign In</h2>
            <p className="text-xs text-text-secondary mt-1">Enter your credentials to access your portal.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary">Email Address</label>
              <Input
                {...register('email')}
                type="email"
                placeholder="student@example.com"
                leftIcon={<Mail className="h-4 w-4" />}
                error={!!errors.email}
              />
              {errors.email && <p className="text-[11px] text-rose-500 mt-1">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-text-secondary">Password</label>
              </div>
              <Input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                leftIcon={<Lock className="h-4 w-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-text-muted hover:text-text-primary transition-colors p-1 cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
                error={!!errors.password}
              />
              {errors.password && <p className="text-[11px] text-rose-500 mt-1">{errors.password.message}</p>}
            </div>

            <AnimatePresence>
              {authError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 text-xs p-3 rounded-xl flex items-start gap-2"
                >
                  <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>{authError}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full"
                size="lg"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Sign In
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-border text-center text-xs text-text-muted space-y-2">
            <p>
              Don't have an account?{' '}
              <Link to="/register" className="text-accent hover:underline font-semibold">
                Create one now
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;
