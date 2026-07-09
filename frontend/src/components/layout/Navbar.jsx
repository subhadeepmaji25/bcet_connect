// src/components/layout/Navbar.jsx
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, Bell, ChevronDown, User, LogOut, Search,
  BriefcaseIcon, Users, MessageCircle,
  GraduationCap, Shield, FileText
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ROLE_LABELS } from '../../constants/appConstants';
import { getUnreadCount, getNotifications, markAsRead, markAllAsRead } from '../../api/notification.api';

// ─── Category icon map ────────────────────────────────────────────────────────
const CATEGORY_ICONS = {
  AUTH:          Shield,
  PROFILE:       User,
  JOB:           BriefcaseIcon,
  APPLICATION:   FileText,
  MENTORSHIP:    GraduationCap,
  CONNECTION:    Users,
  COMMUNICATION: MessageCircle,
  SYSTEM:        Bell,
};

const TYPE_COLORS = {
  success: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  info:    'text-indigo-600 bg-indigo-50 border-indigo-100',
  warning: 'text-amber-600 bg-amber-50 border-amber-100',
  error:   'text-red-600 bg-red-50 border-red-100',
};

const ACTION_ROUTES = {
  OPEN_JOB:          (notif) => notif.meta?.jobId ? `/jobs/${notif.meta.jobId}` : '/jobs',
  OPEN_PROFILE:      () => '/profile',
  OPEN_CHAT:         (notif) => notif.meta?.conversationId ? `/chat/${notif.meta.conversationId}` : '/chat',
  OPEN_MENTORSHIP:   (notif) => {
    if (notif.event === 'mentorship.request.created') return '/mentors/requests/received';
    if (notif.event === 'mentorship.request.accepted' || notif.event === 'mentorship.session.scheduled') return '/mentors/requests/my';
    return '/mentors';
  },
  OPEN_CONNECTION:   (notif) => {
    if (notif.event === 'connection.request.created') return '/connections/requests';
    return '/connections';
  },
  OPEN_NOTIFICATION: () => '/notifications',
};

// ─── Notification Dropdown Panel ──────────────────────────────────────────────
function NotificationDropdown({ onClose }) {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data, isPending } = useQuery({
    queryKey: ['notifications-preview'],
    queryFn: () => getNotifications({ limit: 8 }),
    refetchInterval: 30000,
  });

  const markAllMut = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications-preview'] });
      qc.invalidateQueries({ queryKey: ['notification-count'] });
    },
  });

  const markOneMut = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications-preview'] });
      qc.invalidateQueries({ queryKey: ['notification-count'] });
    },
  });

  const notifications = data?.data?.items || [];

  const [now, setNow] = useState(() => Date.now());
  
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const timeAgo = (dateStr) => {
    const diff = Math.floor((now - new Date(dateStr)) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-200/80 z-50 overflow-hidden ring-1 ring-slate-900/5"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100/80 bg-white/50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-50 rounded-lg">
            <Bell className="w-4 h-4 text-indigo-600" />
          </div>
          <h3 className="font-black text-slate-900 text-[15px] tracking-tight">Notifications</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => markAllMut.mutate()}
            disabled={markAllMut.isPending}
            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors disabled:opacity-50"
          >
            Mark all read
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-[360px] overflow-y-auto custom-scrollbar divide-y divide-slate-50/80">
        {isPending ? (
          <div className="p-8 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-xs font-medium text-slate-400">Loading your updates...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-10 text-center flex flex-col items-center">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3 border border-slate-100">
              <Bell className="w-5 h-5 text-slate-300" />
            </div>
            <p className="text-[14px] font-black text-slate-700">All caught up!</p>
            <p className="text-xs text-slate-400 mt-1 font-medium">No new notifications right now.</p>
          </div>
        ) : (
          notifications.map((notif) => {
            const Icon = CATEGORY_ICONS[notif.category] || Bell;
            const colorClass = TYPE_COLORS[notif.type] || TYPE_COLORS.info;
            const isUnread = notif.status === 'unread';

            return (
              <div
                key={notif._id}
                onClick={() => { 
                  if (isUnread) markOneMut.mutate(notif._id);
                  const route = ACTION_ROUTES[notif.actionType]?.(notif);
                  if (route) {
                    navigate(route);
                    onClose();
                  }
                }}
                className={`group flex gap-3.5 px-5 py-3.5 hover:bg-slate-50/80 cursor-pointer transition-all relative ${isUnread ? 'bg-indigo-50/30' : ''}`}
              >
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 shadow-sm transition-transform duration-300 group-hover:scale-105 ${colorClass}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[13px] font-bold leading-snug mb-0.5 truncate tracking-tight ${isUnread ? 'text-indigo-950' : 'text-slate-900'}`}>{notif.title}</p>
                  <p className="text-[12px] text-slate-500 font-medium leading-relaxed line-clamp-2">{notif.body}</p>
                  <p className="text-[10px] text-slate-400 font-bold mt-1.5 bg-slate-100/50 w-fit px-1.5 py-0.5 rounded-md">{timeAgo(notif.createdAt)}</p>
                </div>
                {isUnread && (
                  <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-2 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100/80 p-3 bg-white/80 backdrop-blur-md">
        <Link
          to="/notifications"
          onClick={onClose}
          className="group/link flex items-center justify-center gap-1.5 w-full text-center text-xs font-black text-indigo-600 bg-indigo-50/50 hover:bg-indigo-50 py-2.5 rounded-xl transition-all"
        >
          Open Notification Center <ChevronDown className="w-3.5 h-3.5 -rotate-90 group-hover/link:translate-x-1 transition-transform" />
        </Link>
      </div>
    </motion.div>
  );
}

// ─── Main Navbar ──────────────────────────────────────────────────────────────
export default function Navbar({ onMenuToggle }) {
  const { user, logout } = useAuth();
  const [dropOpen, setDropOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const notifRef = useRef(null);
  // Real unread count from backend
  const { data: countData } = useQuery({
    queryKey: ['notification-count'],
    queryFn: getUnreadCount,
    refetchInterval: 30000,
    enabled: !!user,
  });
  const unreadCount = countData?.data?.count || 0;

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    setDropOpen(false);
    await logout();
    navigate('/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="h-20 flex-shrink-0 z-30 bg-transparent flex items-center px-3 md:px-5 pt-3 w-full relative">
      <div className="w-full h-full rounded-[24px] border border-slate-200/80 bg-white/88 backdrop-blur-xl shadow-[0_10px_34px_rgba(15,23,42,0.05)] flex items-center px-4 gap-4">
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden btn-ghost p-2 -ml-2 text-slate-600"
        aria-label="Toggle menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Omnibox Search (Center) */}
      <div className="flex-1 max-w-2xl mx-auto hidden md:block">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search jobs, mentors, or connections..."
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-600/15 focus:border-teal-600/30 transition-all"
          />
        </form>
      </div>

      {/* Spacer for mobile */}
      <div className="flex-1 md:hidden" />

      {/* Right side */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Search Icon */}
        <button className="md:hidden btn-ghost p-2 text-slate-600" onClick={() => navigate('/search')}>
          <Search className="w-5 h-5" />
        </button>

        {/* Notification bell with real count */}
        <div ref={notifRef} className="relative">
          <button
            id="notification-bell-btn"
            onClick={() => { setNotifOpen((o) => !o); setDropOpen(false); }}
            className={`relative p-2.5 rounded-xl transition-all shadow-sm border ${notifOpen ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600'}`}
            aria-label="Notifications"
          >
            <Bell className={`w-5 h-5 transition-transform ${notifOpen ? 'rotate-12' : ''}`} />
            {unreadCount > 0 && (
              <motion.span
                key={unreadCount}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute -top-1 -right-1 min-w-[20px] h-[20px] bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 border-2 border-white shadow-md z-10"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
                <div className="absolute inset-0 bg-white/20 rounded-full animate-ping opacity-75" />
              </motion.span>
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <NotificationDropdown onClose={() => setNotifOpen(false)} />
            )}
          </AnimatePresence>
        </div>

        {/* User dropdown */}
        <div className="relative">
          <button
            id="user-menu-btn"
            onClick={() => { setDropOpen((o) => !o); setNotifOpen(false); }}
            className="flex items-center gap-2 sm:gap-2.5 px-2 py-1.5 rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm overflow-hidden border-2 border-indigo-200">
              {user?.avatar
                ? <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover" />
                : user?.fullName?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-bold text-slate-800 leading-none">{user?.fullName || 'User'}</p>
              <p className="text-[10px] text-slate-500 mt-0.5 font-semibold capitalize">{ROLE_LABELS?.[user?.role] || user?.role}</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${dropOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {dropOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setDropOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-20 overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-black text-slate-900 truncate">{user?.fullName}</p>
                    <p className="text-xs text-slate-400 font-medium truncate mt-0.5">{user?.email}</p>
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setDropOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:text-indigo-700 hover:bg-indigo-50 transition-colors"
                  >
                    <User className="w-4 h-4" /> My Profile
                  </Link>
                  <Link
                    to="/notifications"
                    onClick={() => setDropOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:text-indigo-700 hover:bg-indigo-50 transition-colors"
                  >
                    <Bell className="w-4 h-4" />
                    Notifications
                    {unreadCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-[9px] font-black rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Link>

                  <div className="border-t border-slate-100 my-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
      </div>
    </header>
  );
}
