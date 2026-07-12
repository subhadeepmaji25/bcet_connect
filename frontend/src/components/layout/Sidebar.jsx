// src/components/layout/Sidebar.jsx
import { NavLink } from 'react-router-dom';
import {
  Zap, Briefcase, Sparkles, Users, GraduationCap,
  MessageSquare, User, FileText, Building2, LayoutDashboard,
  Clock, Star, UserCheck, LogOut, Bell, Activity, Calendar,
  BookOpen, Library, UploadCloud
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
        w-72 bg-white/92 border-r border-slate-200/80 backdrop-blur-xl
        flex flex-col transition-transform duration-300 ease-out shadow-sm
        ${collapsed ? '-translate-x-full' : 'translate-x-0'}
        lg:static lg:translate-x-0 lg:flex-shrink-0
      `}>
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-200/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-600 to-sky-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-teal-600/20">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-display font-bold text-slate-900 text-base leading-none tracking-tight">BCET Connect</span>
              <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-[0.22em] font-bold">Career Network</p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 mb-1">Workspace</p>
            <p className="text-sm font-semibold text-slate-800 leading-snug">Focused tools for careers, networking, mentorship, and communities.</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
          <NavGroup title="Discover">
            <NavItem to="/feed"           icon={Activity}       label="Feed"          end />
            <NavItem to="/communities"    icon={Users}          label="Communities"   end />
            <NavItem to="/events"         icon={Calendar}       label="Events"        end />
            <NavItem to="/jobs"           icon={Briefcase}      label="Jobs"          end />
            {canApply && <NavItem to="/recommendation" icon={Sparkles} label="Recommended" end />}
          </NavGroup>

          <NavGroup title="Learning">
            <NavItem to="/learning"           icon={BookOpen}       label="Learning Hub"  end />
            <NavItem to="/learning/resources" icon={Library}        label="Resources"     end />
            <NavItem to="/learning/paths"     icon={GraduationCap}  label="Learning Paths" end />
            <NavItem to="/learning/my-uploads" icon={UploadCloud}   label="My Uploads"    end />
          </NavGroup>

          <NavGroup title="Network">
            <NavItem to="/connections"          icon={Users}         label="Connections"  end />
            <NavItem to="/connections/requests" icon={UserCheck}     label="Requests"     end />
            <NavItem to="/mentors"              icon={GraduationCap} label="Mentors"      end />
            <NavItem to="/chat"                 icon={MessageSquare} label="Inbox"        end />
          </NavGroup>

          <NavGroup title="My Space">
            <NavItem to="/profile"                  icon={User}      label="My Profile"      end />
            <NavItem to="/events/registrations/my"  icon={Calendar}  label="My Event Passes" end />
            {canApply && <NavItem to="/jobs/applications/my"  icon={FileText}  label="My Applications" end />}
            {canPost  && <NavItem to="/jobs/my"              icon={Building2} label="My Jobs"          end />}
            {canPost  && <NavItem to="/jobs/post"            icon={Briefcase} label="Post a Job"       end />}
            {canPost  && <NavItem to="/events/my-events"     icon={Calendar}  label="My Events"        end />}
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
              <NavItem to="/events/admin/pending" icon={Calendar}      label="Pending Events" end />
            </NavGroup>
          )}
        </nav>

        {/* User Profile Bottom */}
        <div className="px-3 py-4 border-t border-slate-200/80">
          <div className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-slate-50/80 border border-slate-200/80 transition-colors">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-100 to-sky-100 flex items-center justify-center flex-shrink-0 text-teal-800 font-bold text-sm border border-teal-200/60">
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
              className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
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
