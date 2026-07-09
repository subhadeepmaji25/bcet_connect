import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { UserPlus, CheckCircle, Clock, Briefcase, GraduationCap, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import Avatar from '../../../components/ui/Avatar';
import { sendConnectionRequest } from '../../../api/connections.api';
import { ROLE_LABELS } from '../../../constants/appConstants';

export default function SearchUserCard({ user }) {
  const qc = useQueryClient();
  const {
    userId,
    fullName,
    username,
    role,
    avatar,
    headline,
    mergedSkills = [],
    isMentor,
    connectionStatus,
    currentRole,
    currentCompany,
    branch
  } = user;

  const connMutation = useMutation({
    mutationFn: () => sendConnectionRequest({ receiverId: userId }),
    onSuccess: () => {
      toast.success('Connection request sent!');
      qc.invalidateQueries({ queryKey: ['search-users'] });
    },
    onError: (e) => toast.error(e?.message || 'Failed to send request'),
  });

  const getRoleBadgeColor = (roleStr) => {
    switch (roleStr) {
      case 'student': return 'bg-violet-100 text-violet-700 border-violet-200';
      case 'alumni': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'faculty': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'admin': return 'bg-slate-800 text-white border-slate-700';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const renderConnectionButton = () => {
    if (connectionStatus === 'connected') {
      return (
        <button disabled className="flex flex-1 items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-600 font-bold text-xs rounded-xl border border-emerald-200">
          <CheckCircle className="w-4 h-4" /> Connected
        </button>
      );
    }
    if (connectionStatus === 'pending_sent') {
      return (
        <button disabled className="flex flex-1 items-center justify-center gap-1.5 px-3 py-2 bg-amber-50 text-amber-600 font-bold text-xs rounded-xl border border-amber-200">
          <Clock className="w-4 h-4" /> Pending
        </button>
      );
    }
    if (connectionStatus === 'pending_received') {
      return (
        <Link to="/connections/requests" className="flex flex-1 items-center justify-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition-colors">
          Review Request
        </Link>
      );
    }
    return (
      <button
        onClick={() => connMutation.mutate()}
        disabled={connMutation.isPending}
        className="flex flex-1 items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-70"
      >
        <UserPlus className="w-4 h-4" /> {connMutation.isPending ? 'Sending...' : 'Connect'}
      </button>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all flex flex-col group"
    >
      <div className="flex gap-4 items-start mb-4">
        <Link to={`/profile/${userId}`} className="relative flex-shrink-0 cursor-pointer">
          <Avatar
            src={avatar}
            name={fullName || username}
            size="xl"
            className="w-16 h-16 rounded-2xl border border-slate-200 group-hover:border-indigo-300 transition-colors shadow-sm"
          />
          {isMentor && (
            <div className="absolute -bottom-1 -right-1 bg-amber-400 rounded-lg p-1 border-2 border-white shadow-sm" title="Mentor">
              <Star className="w-3 h-3 text-white fill-white" />
            </div>
          )}
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <Link to={`/profile/${userId}`} className="text-base font-black text-slate-900 hover:text-indigo-600 truncate transition-colors">
              {fullName || username}
            </Link>
            {role && (
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${getRoleBadgeColor(role)}`}>
                {ROLE_LABELS?.[role] || role}
              </span>
            )}
          </div>
          {headline && <p className="text-indigo-600 font-semibold text-xs truncate mb-1.5">{headline}</p>}
          <div className="flex flex-col gap-1 mt-1 text-[11px] font-medium text-slate-500">
            {(currentRole || currentCompany) && (
              <span className="flex items-center gap-1.5 truncate">
                <Briefcase className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{currentRole} {currentRole && currentCompany ? 'at' : ''} {currentCompany}</span>
              </span>
            )}
            {branch && (
              <span className="flex items-center gap-1.5 truncate">
                <GraduationCap className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{branch}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1">
        {mergedSkills?.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {mergedSkills.slice(0, 4).map(skill => (
              <span key={skill} className="px-2 py-1 bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-bold rounded-lg truncate max-w-[120px]">
                {skill}
              </span>
            ))}
            {mergedSkills.length > 4 && (
              <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-lg">
                +{mergedSkills.length - 4}
              </span>
            )}
          </div>
        ) : (
          <div className="h-10 mb-4" /> // spacing fallback
        )}
      </div>

      <div className="flex gap-2 mt-auto pt-4 border-t border-slate-100">
        {renderConnectionButton()}
        <Link
          to={`/profile/${userId}`}
          className="flex items-center justify-center px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors"
        >
          View Profile
        </Link>
      </div>
    </motion.div>
  );
}
