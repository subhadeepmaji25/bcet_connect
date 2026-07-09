import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Check, Archive, Trash2, CheckCheck,
  Shield, User, BriefcaseIcon, FileText, GraduationCap, Users,
  MessageCircle, AlertCircle, RefreshCw, Inbox
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getNotifications, getUnreadCount,
  markAsRead, archiveNotification, deleteNotification,
  markAllAsRead, archiveAllNotifications, deleteAllNotifications
} from '../../api/notification.api';

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { key: null,           label: 'All' },
  { key: 'JOB',         label: 'Jobs',         icon: BriefcaseIcon },
  { key: 'APPLICATION', label: 'Applications', icon: FileText },
  { key: 'MENTORSHIP',  label: 'Mentorship',   icon: GraduationCap },
  { key: 'CONNECTION',  label: 'Connections',  icon: Users },
  { key: 'COMMUNICATION', label: 'Messages',   icon: MessageCircle },
  { key: 'AUTH',        label: 'Security',     icon: Shield },
  { key: 'PROFILE',     label: 'Profile',      icon: User },
  { key: 'SYSTEM',      label: 'System',       icon: Bell },
];

const CATEGORY_ICON_MAP = {
  AUTH:          Shield,
  PROFILE:       User,
  JOB:           BriefcaseIcon,
  APPLICATION:   FileText,
  MENTORSHIP:    GraduationCap,
  CONNECTION:    Users,
  COMMUNICATION: MessageCircle,
  SYSTEM:        Bell,
};

const TYPE_STYLES = {
  success: { bg: 'bg-emerald-50 border-emerald-100', icon: 'text-emerald-600', dot: 'bg-emerald-500' },
  info:    { bg: 'bg-indigo-50 border-indigo-100',   icon: 'text-indigo-600',  dot: 'bg-indigo-500' },
  warning: { bg: 'bg-amber-50 border-amber-100',     icon: 'text-amber-600',   dot: 'bg-amber-500' },
  error:   { bg: 'bg-red-50 border-red-100',         icon: 'text-red-600',     dot: 'bg-red-500' },
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

const timeAgo = (dateStr, now = Date.now()) => {
  const diff = Math.floor((now - new Date(dateStr)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

// ─── Individual Notification Card ─────────────────────────────────────────────
const NotifCard = ({ notif, onMarkRead, onArchive, onDelete, onNavigate, now }) => {
  const Icon = CATEGORY_ICON_MAP[notif.category] || Bell;
  const style = TYPE_STYLES[notif.type] || TYPE_STYLES.info;
  const isUnread = notif.status === 'unread';
  const route = ACTION_ROUTES[notif.actionType]?.(notif);

  return (
    <motion.div
      layout 
      initial={{ opacity: 0, y: 15, scale: 0.98 }} 
      animate={{ opacity: 1, y: 0, scale: 1 }} 
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      whileHover={{ scale: 1.005, y: -2 }}
      className={`group flex gap-4 p-4 sm:p-5 border-b border-slate-100/80 transition-all cursor-pointer relative overflow-hidden ${isUnread ? 'bg-indigo-50/40 hover:bg-indigo-50/80' : 'bg-white hover:bg-slate-50'}`}
      onClick={() => { if (isUnread) onMarkRead(notif._id); if (route) onNavigate(route); }}
    >
      {/* Unread dot indicator with pulse */}
      {isUnread && (
        <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-r-full ${style.dot}`}>
          <div className="absolute inset-0 bg-white/30 animate-pulse" />
        </div>
      )}

      {/* Icon with subtle hover rotate */}
      <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl border flex items-center justify-center shrink-0 mt-0.5 shadow-sm transition-transform duration-300 group-hover:rotate-6 ${style.bg} ${style.icon}`}>
        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-[15px] font-black text-slate-900 leading-snug tracking-tight ${isUnread ? 'text-indigo-950' : ''}`}>
            {notif.title}
          </p>
          <span className="text-[10px] text-slate-400 font-bold shrink-0 mt-0.5 bg-slate-100/50 px-2 py-0.5 rounded-full">{timeAgo(notif.createdAt, now)}</span>
        </div>
        <p className="text-[13px] text-slate-500 font-medium mt-1 leading-relaxed">{notif.body}</p>
        
        <div className="flex items-center gap-2 mt-3">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border shadow-sm ${style.bg} ${style.icon}`}>
            {notif.category}
          </span>
          {notif.priority === 'critical' && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 shadow-sm flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Critical
            </span>
          )}
        </div>
      </div>

      {/* Action menu with slide-in animation */}
      <div className="shrink-0 flex items-start gap-1.5 opacity-0 translate-x-4 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 ml-1">
        {isUnread && (
          <button
            onClick={(e) => { e.stopPropagation(); onMarkRead(notif._id); }}
            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all shadow-sm border border-transparent hover:border-emerald-100 hover:scale-105"
            title="Mark as read"
          >
            <Check className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onArchive(notif._id); }}
          className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all shadow-sm border border-transparent hover:border-amber-100 hover:scale-105"
          title="Archive"
        >
          <Archive className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(notif._id); }}
          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shadow-sm border border-transparent hover:border-red-100 hover:scale-105"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] = useState(null);
  const [activeStatus, setActiveStatus] = useState(null); // null = unread+read, 'archived'

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);


  const queryParams = {
    limit: 30,
    ...(activeCategory && { category: activeCategory }),
    ...(activeStatus && { status: activeStatus }),
  };

  const { data, isPending, refetch, isFetching } = useQuery({
    queryKey: ['notifications-page', activeCategory, activeStatus],
    queryFn: () => getNotifications(queryParams),
    refetchInterval: 30000,
  });

  const { data: countData } = useQuery({
    queryKey: ['notification-count'],
    queryFn: getUnreadCount,
    refetchInterval: 30000,
  });

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ['notifications-page'] });
    qc.invalidateQueries({ queryKey: ['notification-count'] });
    qc.invalidateQueries({ queryKey: ['notifications-preview'] });
  };

  const markReadMut      = useMutation({ mutationFn: markAsRead,               onSuccess: invalidateAll });
  const archiveMut       = useMutation({ mutationFn: archiveNotification,       onSuccess: invalidateAll });
  const deleteMut        = useMutation({ mutationFn: deleteNotification,         onSuccess: invalidateAll });
  const markAllMut       = useMutation({ mutationFn: markAllAsRead,             onSuccess: () => { toast.success('All marked as read'); invalidateAll(); } });
  const archiveAllMut    = useMutation({ mutationFn: archiveAllNotifications,   onSuccess: () => { toast.success('All archived'); invalidateAll(); } });
  const deleteAllMut     = useMutation({ mutationFn: deleteAllNotifications,    onSuccess: () => { toast.success('All cleared'); invalidateAll(); } });

  const notifications = data?.data?.items || [];
  const unreadCount   = countData?.data?.count || 0;

  return (
    <div className="min-h-screen bg-[#FAF9F8] font-sans pb-12 selection:bg-indigo-500/20 selection:text-indigo-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* ─── Header ─── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[1.25rem] flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-indigo-600 mb-1">Inbox</p>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
                  Notifications
                </h1>
                <p className="text-sm font-medium text-slate-500 mt-1.5">
                  {unreadCount > 0 ? (
                    <span className="text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-md">{unreadCount} unread</span>
                  ) : 'All caught up!'}
                </p>
              </div>
            </div>

            {/* Bulk Actions */}
            <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => refetch()}
                  disabled={isFetching}
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 shadow-sm transition-colors"
                >
                <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => markAllMut.mutate()}
                disabled={markAllMut.isPending || unreadCount === 0}
                className="flex items-center gap-2 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 font-bold text-xs shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCheck className="w-4 h-4" /> Mark all read
              </button>
              <button
                onClick={() => { if (window.confirm('Archive all notifications?')) archiveAllMut.mutate(); }}
                disabled={archiveAllMut.isPending}
                className="flex items-center gap-2 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700 font-bold text-xs shadow-sm transition-all disabled:opacity-50"
              >
                <Archive className="w-4 h-4" /> Archive all
              </button>
              <button
                onClick={() => { if (window.confirm('Delete ALL notifications? This cannot be undone.')) deleteAllMut.mutate(); }}
                disabled={deleteAllMut.isPending}
                className="flex items-center gap-2 px-3 py-2.5 bg-white border border-red-100 rounded-xl text-red-500 hover:bg-red-50 hover:border-red-200 font-bold text-xs shadow-sm transition-all disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" /> Clear all
              </button>
            </div>
          </div>
        </motion.div>

        {/* ─── Filters ─── */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar flex-1">
            {CATEGORIES.map(({ key, label, icon: Icon }) => (
              <button
                key={key || 'all'}
                onClick={() => setActiveCategory(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 border ${
                  activeCategory === key
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50'
                }`}
              >
                {Icon && <Icon className="w-3 h-3" />}
                {label}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex gap-2 shrink-0">
            {[
              { key: null,       label: 'Active' },
              { key: 'archived', label: 'Archived' },
            ].map(({ key, label }) => (
              <button
                key={key || 'active'}
                onClick={() => setActiveStatus(key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  activeStatus === key
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ─── Notification List ─── */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {isPending ? (
            <div className="divide-y divide-slate-50">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4 p-5 animate-pulse">
                  <div className="w-11 h-11 bg-slate-100 rounded-2xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-100 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 rounded w-full" />
                    <div className="h-3 bg-slate-100 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-16 sm:py-24 flex flex-col items-center justify-center text-center px-4">
              <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center mb-5">
                <Inbox className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">No notifications</h3>
              <p className="text-sm text-slate-500 font-medium max-w-xs">
                {activeCategory
                  ? `No ${activeCategory.toLowerCase()} notifications yet.`
                  : activeStatus === 'archived'
                  ? 'No archived notifications.'
                  : "You're all caught up! Notifications will appear here."}
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {notifications.map((notif) => (
                <NotifCard
                  key={notif._id}
                  notif={notif}
                  now={now}
                  onMarkRead={(id) => markReadMut.mutate(id)}
                  onArchive={(id) => archiveMut.mutate(id)}
                  onDelete={(id) => { if (window.confirm('Delete this notification?')) deleteMut.mutate(id); }}
                  onNavigate={(route) => navigate(route)}
                />
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Pagination note */}
        {notifications.length >= 30 && (
          <p className="text-center text-xs text-slate-400 font-medium mt-4">
            Showing latest 30 - older notifications auto-expire after 60-180 days
          </p>
        )}

      </div>
    </div>
  );
}
