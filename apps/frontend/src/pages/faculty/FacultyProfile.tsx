import React, { useState, useEffect } from 'react';
import {
  Mail,
  Building2,
  GraduationCap,
  BadgeCheck,
  ShieldCheck,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Key,
  Briefcase,
  IdCard,
} from 'lucide-react';
import { useFacultyProfile, useUpdateFacultyProfile } from '../../api/faculty';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';

export const FacultyProfile: React.FC = () => {
  const { data: profile, isLoading, isError, error, refetch, isFetching } = useFacultyProfile();
  const updateMutation = useUpdateFacultyProfile();

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [college, setCollege] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync form state when profile loads
  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName || '');
      setLastName(profile.lastName || '');
      setPhone(profile.phone || '');
      setDepartment(profile.department || 'CSE');
      setDesignation(profile.designation || '');
      setCollege(profile.college || '');
      setEmployeeId(profile.employeeId || '');
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(false);

    try {
      await updateMutation.mutateAsync({
        firstName,
        lastName,
        phone,
        department,
        designation,
        college,
        employeeId,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to update faculty profile:', err);
    }
  };

  const initials = profile?.fullName
    ? profile.fullName
        .split(' ')
        .filter(Boolean)
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'FA';

  return (
    <div className="min-h-screen bg-background text-foreground pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
              Faculty Profile & Settings
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-accent/15 border border-accent/30 text-accent font-medium">
                Faculty Portal
              </span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage your academic affiliation, contact details, and faculty credentials.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="border-border hover:bg-surface-elevated text-xs flex items-center gap-1.5 self-start sm:self-auto"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin text-accent' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* ── Loading / Error State ─────────────────────────────────────────── */}
        {isLoading && (
          <div className="space-y-6">
            <Skeleton className="h-36 rounded-2xl bg-surface border border-border" />
            <Skeleton className="h-80 rounded-2xl bg-surface border border-border" />
          </div>
        )}

        {isError && (
          <div className="p-6 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
            <div>
              <p className="font-semibold">Failed to load profile details</p>
              <p className="text-xs text-rose-400 mt-0.5">{(error as any)?.message || 'An unexpected error occurred.'}</p>
            </div>
          </div>
        )}

        {!isLoading && profile && (
          <div className="space-y-8">
            {/* ── Profile Header Card ───────────────────────────────────────── */}
            <div className="bg-surface border border-border rounded-2xl p-6 relative overflow-hidden shadow-sm">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                {/* Avatar Badge */}
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 border-2 border-accent/40 flex items-center justify-center text-white text-2xl font-bold font-mono shadow-lg shrink-0">
                  {profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={profile.fullName}
                      className="h-full w-full object-cover rounded-2xl"
                    />
                  ) : (
                    initials
                  )}
                </div>

                <div className="space-y-1.5 text-center sm:text-left flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                    <h2 className="text-xl font-bold text-white tracking-tight">{profile.fullName}</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 uppercase flex items-center gap-1">
                      <BadgeCheck className="h-3 w-3" />
                      {profile.accountStatus}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-surface-elevated text-accent border border-border">
                      {profile.roles.join(', ')}
                    </span>
                  </div>

                  <p className="text-xs text-accent font-medium">{profile.designation}</p>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                      {profile.college}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                      Dept. of {profile.department}
                    </span>
                    <span className="flex items-center gap-1.5 font-mono">
                      <IdCard className="h-3.5 w-3.5 text-muted-foreground" />
                      {profile.employeeId}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Main Edit Form & Credentials Grid ─────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Editable Information Form */}
              <div className="lg:col-span-2 bg-surface border border-border rounded-2xl p-6 space-y-6">
                <div className="border-b border-border pb-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-accent" />
                    Professional & Academic Information
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Update your personal academic profile details visible to students and reports.
                  </p>
                </div>

                {saveSuccess && (
                  <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Profile information updated and saved successfully!</span>
                  </div>
                )}

                {updateMutation.isError && (
                  <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                    <span>Failed to save profile updates. Please check your inputs.</span>
                  </div>
                )}

                <form onSubmit={handleSave} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-muted-foreground font-medium">First Name</label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-accent text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-muted-foreground font-medium">Last Name</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-accent text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-muted-foreground font-medium">Designation</label>
                      <input
                        type="text"
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        placeholder="e.g. Assistant Professor / Lead Faculty"
                        className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-accent text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-muted-foreground font-medium">Department</label>
                      <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="e.g. Computer Science & Engineering"
                        className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-accent text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-muted-foreground font-medium">Institution / College</label>
                      <input
                        type="text"
                        value={college}
                        onChange={(e) => setCollege(e.target.value)}
                        placeholder="e.g. Naan Mudhalvan Partner College"
                        className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-accent text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-muted-foreground font-medium">Faculty / Employee ID</label>
                      <input
                        type="text"
                        value={employeeId}
                        onChange={(e) => setEmployeeId(e.target.value)}
                        placeholder="e.g. FAC-10293"
                        className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-accent text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-muted-foreground font-medium">Contact Phone</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-accent text-xs"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      type="submit"
                      disabled={updateMutation.isPending}
                      className="bg-accent hover:bg-accent-hover text-white text-xs flex items-center gap-1.5 px-4 py-2"
                    >
                      <Save className="h-3.5 w-3.5" />
                      {updateMutation.isPending ? 'Saving Changes...' : 'Save Profile Updates'}
                    </Button>
                  </div>
                </form>
              </div>

              {/* Right 1 Col: Read-Only System Credentials & Security */}
              <div className="space-y-6">
                {/* Account Credentials Card */}
                <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
                  <div className="border-b border-border pb-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-accent" />
                      System Identity & Security
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Authoritative authentication credentials.
                    </p>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-[11px] text-muted-foreground block">Registered Email</span>
                      <div className="font-mono text-white font-semibold flex items-center gap-1.5 mt-0.5">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        {profile.email}
                      </div>
                      <span className="text-[10px] text-muted-foreground/80">Primary login credential (Read-Only)</span>
                    </div>

                    <div>
                      <span className="text-[11px] text-muted-foreground block">System Role</span>
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-accent/15 text-accent border border-accent/30">
                        {profile.roles.join(' • ')}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] text-muted-foreground block">Identity ID</span>
                      <span className="font-mono text-[10px] text-muted-foreground break-all">
                        {profile.identityId}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-border/60">
                      <span className="text-[11px] text-muted-foreground block">Member Since</span>
                      <span className="text-white text-xs flex items-center gap-1.5 mt-0.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        {new Date(profile.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Password & Security Card */}
                <div className="bg-surface border border-border rounded-2xl p-5 space-y-3 text-xs">
                  <div className="flex items-center gap-2 font-semibold text-white">
                    <Key className="h-4 w-4 text-amber-400" />
                    Security Notice
                  </div>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    Faculty access is authenticated via enterprise JWT credentials. For account authorization or role elevation, please contact your institutional administrator.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
