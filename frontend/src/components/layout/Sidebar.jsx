// src/components/layout/Sidebar.jsx
import { NavLink } from 'react-router-dom';
import {
  Zap, Briefcase, Search, Sparkles, Users, GraduationCap,
  MessageSquare, User, FileText, Building2, LayoutDashboard,
  Clock, Star, UserCheck, LogOut, ChevronRight, Bell, Activity
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ROLE_LABELS, ROLE_COLORS } from '../../constants/appConstants';

const navClass = ({ isActive }) =>
  `nav-link ${isActive ? 'active' : ''}`;

function NavGroup({ title, children }) {
  return (
    <div className="mb-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-3 mb-1">{title}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function NavItem({ to, icon: Icon, label, end }) {
  return (
    <NavLink to={to} className={navClass} end={end}>
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span>{label}</span>
    </NavLink>
  );
}

export default function Sidebar({ collapsed, onClose }) {
  const { user, logout } = useAuth();
  const role = user?.role || '';
  const isStudent = role === 'student';
  const isAlumni  = role === 'alumni';
  const isFaculty = role === 'faculty';
  const isAdmin   = role === 'admin';
  const canPost   = isFaculty || isAlumni || isAdmin;
  const canApply  = isStudent || isAlumni;
  const canBeMentor = isFaculty || isAlumni;

  return (
    <>
      {/* Mobile Overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 h-full
        w-64 bg-white border-r border-slate-200
        flex flex-col transition-transform duration-300 ease-out shadow-sm
        ${collapsed ? '-translate-x-full' : 'translate-x-0'}
        lg:static lg:translate-x-0 lg:flex-shrink-0
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200">
          <div className="w-8 h-8 rounded-xl bg-primary-50 border border-primary-200 flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-primary-600" />
          </div>
          <div>
            <span className="font-display font-bold text-slate-900 text-base leading-none tracking-tight">BCET Connect</span>
            <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider font-semibold">Career Ecosystem</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          <NavGroup title="Discover">
            <NavItem to="/feed"           icon={Activity}       label="Feed"          end />
            <NavItem to="/communities"    icon={Users}          label="Communities"   end />
            <NavItem to="/jobs"           icon={Briefcase}      label="Jobs"          end />
            {canApply && <NavItem to="/recommendation" icon={Sparkles} label="Recommended" end />}
          </NavGroup>

          <NavGroup title="Network">
            <NavItem to="/connections"          icon={Users}         label="Connections"  end />
            <NavItem to="/connections/requests" icon={UserCheck}     label="Requests"     end />
            <NavItem to="/mentors"              icon={GraduationCap} label="Mentors"      end />
            <NavItem to="/chat"                 icon={MessageSquare} label="Inbox"        end />
          </NavGroup>

          <NavGroup title="My Space">
            <NavItem to="/profile"                  icon={User}      label="My Profile"      end />
            {canApply && <NavItem to="/jobs/applications/my"  icon={FileText}  label="My Applications" end />}
            {canPost  && <NavItem to="/jobs/my"              icon={Building2} label="My Jobs"          end />}
            {canPost  && <NavItem to="/jobs/post"            icon={Briefcase} label="Post a Job"       end />}
            {canApply && <NavItem to="/mentors/requests/my"  icon={Clock}     label="My Mentorship Requests"  end />}
            {canBeMentor && <NavItem to="/mentors/requests/received" icon={Star} label="Received Requests" end />}
            {canBeMentor && (
              <NavItem to="/mentors/become" icon={GraduationCap} label="Become Mentor" end />
            )}
            <NavItem to="/notifications" icon={Bell} label="Notifications" end />
          </NavGroup>

          {isAdmin && (
            <NavGroup title="Admin">
              <NavItem to="/admin"              icon={LayoutDashboard} label="Admin Dashboard" end />
              <NavItem to="/jobs/admin/pending" icon={Clock}           label="Pending Jobs"   end />
            </NavGroup>
          )}
        </nav>

        {/* User Profile Bottom */}
        <div className="px-3 py-4 border-t border-slate-200">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-50 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0 text-primary-700 font-bold text-sm">
              {user?.fullName?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{user?.fullName || 'User'}</p>
              <span className={`badge text-[10px] ${ROLE_COLORS[role] || 'badge-neutral'}`}>
                {ROLE_LABELS[role] || role}
              </span>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
