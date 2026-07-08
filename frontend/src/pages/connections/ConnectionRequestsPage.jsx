import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCheck, XCircle, X, MessageSquare, Clock, CheckCircle2,
  AlertCircle, Send, Inbox, ArrowRight, Activity, Zap, ShieldCheck
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  getReceivedRequests, getSentRequests,
  acceptConnectionRequest, rejectConnectionRequest, cancelConnectionRequest,
} from '../../api/connections.api';
import { startConversation } from '../../api/communication.api';
import Avatar from '../../components/ui/Avatar';
import { ROLE_LABELS, ROLE_COLORS } from '../../constants/appConstants';
import { normalizeUser } from '../../utils/normalize';

// --- Animated Tab Component (Apple/Vercel style Segmented Control) ---
function SegmentedControl({ tabs, activeTab, onChange }) {
  return (
    <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200/50 w-fit">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors z-10 ${isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {isActive && (
              <motion.div layoutId="activeTab" className="absolute inset-0 bg-white rounded-lg shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)] -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
            )}
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.badge > 0 && (
              <span className={`inline-flex items-center justify-center min-w-[20px] h-[20px] px-1 rounded-full text-[10px] font-bold ${isActive ? 'bg-[#635BFF] text-white shadow-sm' : 'bg-slate-200 text-slate-500'}`}>
                {tab.badge > 99 ? '99+' : tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// --- Status Badge ---
const STATUS_META = {
  pending:   { label: 'Pending',   icon: Clock,         color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-200' },
  accepted:  { label: 'Accepted',  icon: CheckCircle2,  color: 'text-emerald-600',bg: 'bg-emerald-50', border: 'border-emerald-200' },
  rejected:  { label: 'Rejected',  icon: XCircle,       color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-200' },
  cancelled: { label: 'Cancelled', icon: AlertCircle,   color: 'text-slate-600',  bg: 'bg-slate-50',  border: 'border-slate-200' },
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.pending;
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${meta.border} ${meta.bg} ${meta.color}`}>
      <Icon className="w-3.5 h-3.5" /> {meta.label}
    </span>
  );
}

// --- Request Card Component ---
function RequestCard({ req, tab, onAccept, onReject, onCancel, onMessage, isMessaging, acceptPending, rejectPending, cancelPending, index }) {
  const rawPerson = tab === 'received' ? req.requesterId : req.receiverId;
  const person = normalizeUser(rawPerson);
  const personId = person?._id || person?.userId;
  const displayName = person?.fullName || person?.username || 'User';
  
  // Mock AI Networking Data
  const careerMatch = Math.floor(Math.random() * 20) + 75; // 75-94%

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -2 }}
      className={`bg-white rounded-2xl p-6 transition-all duration-300 relative overflow-hidden group
        ${req.status === 'pending' && tab === 'received' 
          ? 'border-2 border-[#635BFF]/20 shadow-[0_4px_20px_-4px_rgba(99,91,255,0.15)] hover:border-[#635BFF]/40' 
          : 'border border-slate-100 shadow-sm hover:shadow-md'}`}
    >
      <div className="flex flex-col sm:flex-row gap-5 items-start">
        
        {/* Avatar Area */}
        <div className="relative shrink-0">
          <Avatar src={person?.avatar} name={displayName} size="xl" className="rounded-2xl border border-slate-100 shadow-sm" />
          {req.status === 'pending' && tab === 'received' && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#635BFF] border-2 border-white shadow-sm" />
          )}
        </div>

        {/* Info Area */}
        <div className="flex-1 min-w-0 w-full">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
            <div>
              <div className="flex items-center gap-1.5">
                <Link to={`/profile/${personId}`} className="font-bold text-slate-900 text-lg hover:text-[#635BFF] transition-colors truncate">
                  {displayName}
                </Link>
                {person?.isVerified && <ShieldCheck className="w-4 h-4 text-[#635BFF]" />}
              </div>
              <p className="text-sm font-medium text-slate-500 mt-0.5">@{person?.username}</p>
            </div>
            {tab === 'sent' && <StatusBadge status={req.status} />}
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            {person?.role && (
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${ROLE_COLORS[person.role] || 'bg-slate-100 text-slate-600'}`}>
                {ROLE_LABELS[person.role] || person.role}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs font-semibold text-[#15803D] bg-[#16A34A]/10 px-2 py-0.5 rounded-md">
              <Zap className="w-3 h-3" /> {careerMatch}% Career Match
            </span>
          </div>

          {req.message && (
            <div className="mb-4 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100 relative">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-300 rounded-l-xl" />
              <p className="text-sm text-slate-600 italic leading-relaxed">"{req.message}"</p>
            </div>
          )}

          {/* Action Row */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3">
            
            {/* RECEIVED + PENDING */}
            {tab === 'received' && req.status === 'pending' && (
              <>
                <button
                  onClick={() => onAccept(req._id)}
                  disabled={acceptPending}
                  className="flex-1 sm:flex-none px-6 py-2.5 bg-slate-900 hover:bg-black text-white text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <UserCheck className="w-4 h-4" /> Accept
                </button>
                <button
                  onClick={() => onReject(req._id)}
                  disabled={rejectPending}
                  className="flex-1 sm:flex-none px-6 py-2.5 bg-white border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-slate-600 text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <X className="w-4 h-4" /> Decline
                </button>
              </>
            )}

            {/* ACCEPTED (Either Tab) */}
            {req.status === 'accepted' && (
              <button
                onClick={() => onMessage(personId)}
                disabled={isMessaging}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#635BFF] hover:bg-[#524be3] text-white text-sm font-semibold rounded-xl shadow-[0_4px_14px_0_rgba(99,91,255,0.39)] transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <MessageSquare className="w-4 h-4" /> {isMessaging ? 'Opening...' : 'Send Message'}
              </button>
            )}

            {/* SENT + PENDING */}
            {tab === 'sent' && req.status === 'pending' && (
              <button
                onClick={() => onCancel(req._id)}
                disabled={cancelPending}
                className="px-6 py-2.5 bg-white border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-slate-600 text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <X className="w-4 h-4" /> Withdraw Request
              </button>
            )}

            <Link to={`/profile/${personId}`} className="px-4 py-2.5 text-sm font-semibold text-[#635BFF] hover:underline ml-auto flex items-center gap-1">
              View Profile <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// --- Empty State ---
function EmptyRequests({ tab }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-sm">
      <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
        {tab === 'received' ? <Inbox className="w-10 h-10 text-slate-400" /> : <Send className="w-10 h-10 text-slate-400" />}
      </div>
      <h3 className="text-2xl font-bold text-slate-900 mb-3">No {tab} requests</h3>
      <p className="text-slate-500 max-w-md mx-auto mb-8">
        {tab === 'received'
          ? "You're all caught up! When someone sends you a connection request, it will appear here for your review."
          : "You haven't sent any connection requests recently. Grow your network by reaching out to alumni and peers."}
      </p>
      {tab === 'received' ? (
        <Link to="/search" className="inline-flex items-center gap-2 px-8 py-3 bg-[#635BFF] text-white font-semibold rounded-xl shadow-[0_4px_14px_0_rgba(99,91,255,0.39)] transition-all hover:-translate-y-0.5">
          Discover People
        </Link>
      ) : (
        <Link to="/recommendation" className="inline-flex items-center gap-2 px-8 py-3 bg-slate-900 text-white font-semibold rounded-xl shadow-lg transition-all hover:-translate-y-0.5">
          View AI Matches
        </Link>
      )}
    </motion.div>
  );
}

export default function ConnectionRequestsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [tab, setTab] = useState('received');
  const [messagingId, setMessagingId] = useState(null);

  const receivedQ = useQuery({ queryKey: ['received-connections'], queryFn: getReceivedRequests });
  const sentQ     = useQuery({ queryKey: ['sent-connections'],     queryFn: getSentRequests });

  const msgMut = useMutation({
    mutationFn: (recipientId) => startConversation({ recipientId }),
    onSuccess: (res) => {
      const convId = res?.data?.conversation?._id || res?.data?._id;
      if (convId) navigate(`/chat/${convId}`);
      setMessagingId(null);
    },
    onError: (e) => { toast.error(e?.message || 'Failed to start chat'); setMessagingId(null); },
  });

  const acceptMut = useMutation({
    mutationFn: acceptConnectionRequest,
    onSuccess: () => { toast.success('Connection accepted! 🤝', { style: { background: '#111827', color: '#fff', borderRadius: '12px' }}); qc.invalidateQueries({ queryKey: ['received-connections'] }); qc.invalidateQueries({ queryKey: ['my-connections'] }); },
    onError: (e) => toast.error(e?.message || 'Failed'),
  });

  const rejectMut = useMutation({
    mutationFn: rejectConnectionRequest,
    onSuccess: () => { toast.success('Request declined'); qc.invalidateQueries({ queryKey: ['received-connections'] }); },
    onError: (e) => toast.error(e?.message || 'Failed'),
  });

  const cancelMut = useMutation({
    mutationFn: cancelConnectionRequest,
    onSuccess: () => { toast.success('Request withdrawn'); qc.invalidateQueries({ queryKey: ['sent-connections'] }); },
    onError: (e) => toast.error(e?.message || 'Failed'),
  });

  const activeQ = tab === 'received' ? receivedQ : sentQ;
  const requests = activeQ.data?.data?.requests || [];
  const pendingReceivedCount = receivedQ.data?.data?.requests?.filter((r) => r.status === 'pending').length ?? 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12 font-sans selection:bg-[#635BFF]/20 selection:text-[#635BFF]">
      
      {/* --- Premium Header --- */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Connection Requests</h1>
              <p className="text-slate-500 max-w-lg">
                Manage your professional networking requests and grow your connections with AI assistance.
              </p>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
              <SegmentedControl 
                activeTab={tab} 
                onChange={setTab}
                tabs={[
                  { id: 'received', label: 'Received', icon: Inbox, badge: pendingReceivedCount },
                  { id: 'sent', label: 'Sent', icon: Send, badge: 0 }
                ]} 
              />
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* --- Main Requests Area --- */}
          <div className="flex-1 space-y-4">
            {activeQ.isPending ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm animate-pulse flex gap-5 h-48">
                    <div className="w-24 h-24 bg-slate-200 rounded-2xl shrink-0" />
                    <div className="flex-1 py-2">
                      <div className="h-6 w-1/3 bg-slate-200 rounded mb-2" />
                      <div className="h-4 w-1/4 bg-slate-200 rounded mb-6" />
                      <div className="h-10 w-full bg-slate-200 rounded-xl" />
                    </div>
                  </div>
                ))}
              </div>
            ) : requests.length === 0 ? (
              <EmptyRequests tab={tab} />
            ) : (
              <AnimatePresence mode="popLayout">
                {requests.map((req, idx) => (
                  <RequestCard
                    key={req._id}
                    req={req}
                    tab={tab}
                    index={idx}
                    onAccept={(id) => acceptMut.mutate(id)}
                    onReject={(id) => rejectMut.mutate(id)}
                    onCancel={(id) => cancelMut.mutate(id)}
                    onMessage={(id) => { setMessagingId(id); msgMut.mutate(id); }}
                    isMessaging={messagingId === (normalizeUser(tab === 'received' ? req.requesterId : req.receiverId)?._id) && msgMut.isPending}
                    acceptPending={acceptMut.isPending}
                    rejectPending={rejectMut.isPending}
                    cancelPending={cancelMut.isPending}
                  />
                ))}
              </AnimatePresence>
            )}
          </div>

          {/* --- Right AI Insight Panel --- */}
          <div className="hidden lg:block w-80 shrink-0 space-y-6">
            <div className="sticky top-24 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white">
                  <Activity className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900">Network Insights</h3>
              </div>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-end mb-1">
                    <h4 className="text-sm font-bold text-slate-700">Acceptance Rate</h4>
                    <span className="text-lg font-extrabold text-[#15803D]">92%</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">Based on your last 30 requests</p>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#15803D] w-[92%]" />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">AI Suggestion</h4>
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-600">
                      Connect with people who share <strong className="text-slate-900">React</strong> skills to boost your matching algorithm score.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
