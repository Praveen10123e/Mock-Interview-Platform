import type { FC } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  LayoutDashboard,
  Calendar,
  Code2,
  BookOpen,
  Activity,
  BarChart3,
  Sparkles,
  User,
  Settings,
  LogOut,
  Briefcase,
  X,
  Database,
  Server,
  Shield,
  FileText,
  Users
} from 'lucide-react';
import { useAuthStore } from '../../store/AuthStore';
import { ThemeToggle } from '../ui/theme-toggle';

interface NavItem {
  name: string;
  path: string;
  icon: any;
  disabled?: boolean;
  badge?: string | number;
}

const roleConfigs: Record<string, NavItem[]> = {
  STUDENT: [
    { name: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
    { name: 'Interviews', path: '/student/interviews', icon: Calendar },
    { name: 'Practice', path: '/student/practice', icon: Code2 },
    { name: 'Question Bank', path: '/student/questions', icon: BookOpen },
    { name: 'Progress', path: '/student/progress', icon: Activity },
    { name: 'Reports', path: '/student/reports', icon: BarChart3 },
    { name: 'Recommendations', path: '/student/recommendations', icon: Sparkles },
    { name: 'Profile', path: '/student/profile', icon: User },
  ],
  FACULTY: [
    { name: 'Dashboard', path: '/faculty/dashboard', icon: LayoutDashboard },
    { name: 'Students', path: '/faculty/students', icon: Users },
    { name: 'Question Bank', path: '/faculty/questions', icon: BookOpen },
    { name: 'Templates', path: '/faculty/templates', icon: FileText },
    { name: 'Interviews', path: '/faculty/interviews', icon: Calendar },
    { name: 'Analytics', path: '/faculty/analytics', icon: Activity, disabled: true },
    { name: 'Reports', path: '/faculty/reports', icon: BarChart3, disabled: true },
  ],
  ADMINISTRATOR: [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Users', path: '/admin/users', icon: Users, disabled: true },
    { name: 'Datasets', path: '/admin/datasets', icon: Database, disabled: true },
    { name: 'Question Bank', path: '/admin/questions', icon: BookOpen, badge: '5' },
    { name: 'System', path: '/admin/system', icon: Server, disabled: true },
    { name: 'Analytics', path: '/admin/analytics', icon: Activity, disabled: true },
    { name: 'Reports', path: '/admin/reports', icon: BarChart3, disabled: true },
  ]
};

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleLogout = () => {
    clearAuth();
    queryClient.clear();
    navigate('/login');
  };

  const primaryRole = user?.roles?.[0] || 'STUDENT';
  const navItems = roleConfigs[primaryRole] || roleConfigs.STUDENT;
  const settingsPath = primaryRole === 'ADMINISTRATOR' ? '/admin/settings' : primaryRole === 'FACULTY' ? '/faculty/settings' : '/student/settings';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-[240px] flex flex-col bg-sidebar-bg border-r border-border transition-transform duration-200 ease-out
        lg:static lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand Header */}
        <div className="flex h-16 shrink-0 items-center justify-between px-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shadow-xs">
              <Briefcase className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-text-primary leading-tight">
                NM Sandbox
              </span>
              <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">
                {primaryRole}
              </span>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover cursor-pointer"
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Main Navigation Section */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          <div className="space-y-1">
            <div className="px-3 mb-2 text-[10px] font-semibold text-text-muted uppercase tracking-wider font-mono">
              Main Navigation
            </div>
            
            <nav className="space-y-0.5">
              {navItems.map((item) =>
                item.disabled ? (
                  <div
                    key={item.name}
                    className="group flex cursor-not-allowed items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-text-muted/50"
                    title="Coming Soon"
                  >
                    <div className="flex items-center gap-2.5">
                      <item.icon className="h-4 w-4 shrink-0 opacity-40" />
                      <span>{item.name}</span>
                    </div>
                    <span className="text-[10px] text-text-muted/40 uppercase tracking-wide">Soon</span>
                  </div>
                ) : (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `group flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors duration-150 ${
                        isActive
                          ? 'bg-accent/12 text-accent font-semibold'
                          : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center gap-2.5 min-w-0">
                          <item.icon 
                            className={`h-4 w-4 shrink-0 transition-colors ${
                              isActive ? 'text-accent' : 'text-text-muted group-hover:text-text-secondary'
                            }`} 
                          />
                          <span className="truncate">{item.name}</span>
                        </div>
                        
                        {item.badge && (
                          <span className={`ml-auto rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                            isActive ? 'bg-accent/20 text-accent' : 'bg-surface text-text-muted border border-border'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                )
              )}
            </nav>
          </div>
        </div>

        {/* Separated Bottom Secondary Actions */}
        <div className="border-t border-border p-3 space-y-1 bg-sidebar-bg shrink-0">
          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="text-[11px] font-medium text-text-muted">Theme</span>
            <ThemeToggle />
          </div>

          <NavLink
            to={settingsPath}
            onClick={onClose}
            className={({ isActive }) =>
              `flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors duration-150 ${
                isActive
                  ? 'bg-accent/12 text-accent font-semibold'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
              }`
            }
          >
            {primaryRole === 'ADMINISTRATOR' ? (
              <Shield className="h-4 w-4 shrink-0 text-text-muted" />
            ) : (
              <Settings className="h-4 w-4 shrink-0 text-text-muted" />
            )}
            <span>Settings</span>
          </NavLink>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-text-secondary transition-colors duration-150 hover:bg-rose-500/10 hover:text-rose-500 cursor-pointer"
          >
            <LogOut className="h-4 w-4 shrink-0 opacity-70" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
