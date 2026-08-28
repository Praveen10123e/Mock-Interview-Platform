import type { FC } from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mail, User, ShieldCheck, ArrowRight, Eye, EyeOff, Briefcase, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Select } from '../../components/ui/select';
import api from '../../api/axios/instance';
import { useNavigate, Link } from 'react-router-dom';

const RegisterSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['STUDENT', 'FACULTY']),
});

type RegisterForm = z.infer<typeof RegisterSchema>;

export const Register: FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      role: 'STUDENT',
    },
  });
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const endpoint = data.role === 'FACULTY' 
        ? '/auth/register/faculty' 
        : '/auth/register/student';
      
      await api.post(endpoint, {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      });

      setRegisteredSuccess(true);
    } catch (error: any) {
      console.error('Registration failed', error);
      const errMsg = 
        error.response?.data?.message || 
        error.response?.data?.error?.message || 
        error.response?.data?.error || 
        'Registration failed. Please check your details and try again.';
      setAuthError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-bg text-text-primary relative overflow-hidden px-4 py-8 selection:bg-accent/30">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center z-10">
        {/* Left Column: Platform Onboarding Info */}
        <div className="hidden md:flex flex-col justify-center space-y-6 pr-4">
          <Link to="/" className="inline-flex items-center gap-2 text-xs text-text-muted hover:text-text-primary transition-colors">
            <ChevronLeft className="h-3.5 w-3.5" /> Back to Overview
          </Link>

          <div className="space-y-3">
            <div className="h-10 w-10 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shadow-xs">
              <Briefcase className="h-5 w-5" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-text-primary">
              Join NM Sandbox
            </h1>
            <p className="text-sm text-text-secondary leading-relaxed">
              Create an account to track your interview progression, benchmark against curriculum standards, and receive AI-driven feedback.
            </p>
          </div>

          <div className="space-y-2.5 pt-2">
            <div className="flex items-center gap-2.5 text-xs text-text-secondary">
              <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>Full access to curated DSA & SQL problem banks</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-text-secondary">
              <ShieldCheck className="h-4 w-4 text-accent shrink-0" />
              <span>Comprehensive 3-stage mock interview sessions</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-text-secondary">
              <ShieldCheck className="h-4 w-4 text-amber-500 shrink-0" />
              <span>Detailed performance radar and scoring analytics</span>
            </div>
          </div>
        </div>

        {/* Right Column: Register Card */}
        <Card className="p-6 sm:p-8">
          {registeredSuccess ? (
            <div className="text-center py-6 space-y-4">
              <div className="h-12 w-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 mx-auto flex items-center justify-center shadow-xs">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-text-primary">Account Created</h2>
              <p className="text-xs text-text-secondary max-w-xs mx-auto leading-relaxed">
                Your account has been registered successfully. You can now sign in to your dashboard.
              </p>
              <div className="pt-3">
                <Button size="lg" className="w-full" onClick={() => navigate('/login')}>
                  Proceed to Sign In
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <div className="md:hidden mb-4">
                  <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors">
                    <ChevronLeft className="h-3.5 w-3.5" /> Back to Overview
                  </Link>
                </div>
                <h2 className="text-xl font-bold text-text-primary tracking-tight">Create Account</h2>
                <p className="text-xs text-text-secondary mt-1">Get started with NM Mock Interview Sandbox.</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-secondary">First Name</label>
                    <Input
                      {...register('firstName')}
                      placeholder="Jane"
                      leftIcon={<User className="h-4 w-4" />}
                      error={!!errors.firstName}
                    />
                    {errors.firstName && <p className="text-[10px] text-rose-500 mt-0.5">{errors.firstName.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-secondary">Last Name</label>
                    <Input
                      {...register('lastName')}
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary">Email Address</label>
                  <Input
                    {...register('email')}
                    type="email"
                    placeholder="student@example.com"
                    leftIcon={<Mail className="h-4 w-4" />}
                    error={!!errors.email}
                  />
                  {errors.email && <p className="text-[10px] text-rose-500 mt-0.5">{errors.email.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary">Password</label>
                  <Input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    leftIcon={<Lock className="h-4 w-4" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-text-muted hover:text-text-primary transition-colors p-1 flex items-center justify-center cursor-pointer"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    }
                    error={!!errors.password}
                  />
                  {errors.password && <p className="text-[10px] text-rose-500 mt-0.5">{errors.password.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary">Primary Role</label>
                  <Select {...register('role')}>
                    <option value="STUDENT">Student Candidate</option>
                    <option value="FACULTY">Faculty Evaluator</option>
                  </Select>
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
                    Register Account
                  </Button>
                </div>
              </form>

              <div className="mt-5 pt-4 border-t border-border text-center text-xs text-text-muted">
                <p>
                  Already have an account?{' '}
                  <Link to="/login" className="text-accent hover:underline font-semibold">
                    Sign in here
                  </Link>
                </p>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Register;
