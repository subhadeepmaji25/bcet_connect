import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, UserX, MessageSquare, ExternalLink,
  Search, UserPlus, Sparkles, X, Briefcase, GraduationCap, MapPin, Activity, CheckCircle2, MoreHorizontal
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getMyConnections, removeConnection } from '../../api/connections.api';
import { startConversation } from '../../api/communication.api';
import Avatar from '../../components/ui/Avatar';
import { ROLE_LABELS, ROLE_COLORS } from '../../constants/appConstants';
import { normalizeUser } from '../../utils/normalize';

// --- Premium Profile Card Component ---
function ConnectionCard({ conn, index, onMessage, onRemove, isMessaging, isRemoving }) {
  const rawPerson = conn.user || conn.connectedUser || conn;
  const person = normalizeUser(rawPerson);
  const personId = person?._id || person?.userId;
  const displayName = person?.fullName || person?.username || 'User';

  // Mocking AI Data for Premium SaaS Feel
  const networkingScore = Math.floor(Math.random() * 20) + 80; // 80-99
  const commonInterests = ['React', 'System Design'].slice(0, (index % 2) + 1);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all overflow-hidden group flex flex-col relative"
    >
      {/* Cover Background */}
      <div className="h-20 w-full bg-gradient-to-r from-[#635BFF]/10 to-[#8B5CF6]/10 relative group-hover:from-[#635BFF]/20 group-hover:to-[#8B5CF6]/20 transition-colors">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />
      </div>

      <div className="px-5 pb-5 flex-1 flex flex-col relative">
        {/* Avatar Area */}
        <div className="flex justify-between items-start -mt-10 mb-3 relative z-10">
          <div className="relative p-1 bg-white rounded-2xl shadow-sm">
            <Avatar src={person.avatar} name={displayName} size="xl" className="rounded-xl border border-slate-100" />
            <div className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-[#16A34A] border-2 border-white rounded-full" title="Online" />
          </div>
          <button aria-label="More options" className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors mt-12">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Info */}
        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Link to={`/profile/${personId}`} className="font-bold text-slate-900 text-lg hover:text-[#635BFF] transition-colors truncate max-w-[180px]">
              {displayName}
            </Link>
            {person.isVerified && <CheckCircle2 className="w-4 h-4 text-[#635BFF]" />}
          </div>
          <p className="text-sm text-slate-500 mb-2 truncate">@{person.username}</p>

          <p className="text-sm font-medium text-slate-700 line-clamp-1 mb-3">
            {person.headline || `${ROLE_LABELS[person.role] || person.role} at BCET`}
          </p>

          <div className="space-y-1.5 text-xs text-slate-500 mb-4">
            {person.company && <div className="flex items-center gap-2"><Briefcase className="w-3.5 h-3.5" /> <span className="truncate">{person.company}</span></div>}
            <div className="flex items-center gap-2"><GraduationCap className="w-3.5 h-3.5" /> <span className="truncate">BCET Alumni Network</span></div>
            {person.location && <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> <span className="truncate">{person.location}</span></div>}
          </div>

          {/* AI Features Mock */}
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Networking Score</span>
              <span className="text-xs font-bold text-[#15803D]">{networkingScore}%</span>
            </div>
            <p className="text-xs text-slate-500 truncate">Shared Interests: {commonInterests.join(', ')}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-auto">
          <button
            onClick={() => onMessage(personId)}
            disabled={isMessaging}
            className="flex-1 py-2 bg-[#635BFF] hover:bg-[#524be3] text-white text-sm font-semibold rounded-xl shadow-[0_4px_14px_0_rgba(99,91,255,0.25)] transition-all hover:-translate-y-0.5 flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <MessageSquare className="w-4 h-4" /> {isMessaging ? 'Opening...' : 'Message'}
          </button>
          <button
            onClick={() => onRemove(personId)}
            disabled={isRemoving}
            className="px-3 py-2 bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-500 border border-slate-200 hover:border-red-200 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
            title="Remove Connection"
          >
            <UserX className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// --- Main Connections Page Component ---
export default function MyConnectionsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [removingId, setRemovingId] = useState(null);
  const [messagingId, setMessagingId] = useState(null);

  const { data, isPending } = useQuery({ queryKey: ['my-connections'], queryFn: getMyConnections });
  const connections = data?.data?.connections || [];

  const removeMut = useMutation({
    mutationFn: removeConnection,
    onSuccess: () => { toast.success('Connection removed'); qc.invalidateQueries({ queryKey: ['my-connections'] }); setRemovingId(null); },
    onError: (e) => { toast.error(e?.message || 'Failed'); setRemovingId(null); },
  });

  const chatMut = useMutation({
    mutationFn: (recipientId) => startConversation({ recipientId }),
    onSuccess: (res) => {
      const id = res?.data?.conversation?._id || res?.data?._id;
      if (id) navigate(`/chat/${id}`);
      setMessagingId(null);
    },
    onError: (e) => { toast.error(e?.message || 'Failed'); setMessagingId(null); },
  });

  const filtered = useMemo(() => {
    if (!search || !search.trim()) return connections;
    const q = search.toLowerCase();
    return connections.filter((conn) => {
      if (!conn) return false;
      const p = normalizeUser(conn.user || conn.connectedUser || conn);
      if (!p) return false;
      const fName = p.fullName || '';
      const uName = p.username || '';
      const rLabel = ROLE_LABELS[p.role] || p.role || '';
      return fName.toLowerCase().includes(q) || 
             uName.toLowerCase().includes(q) || 
             rLabel.toLowerCase().includes(q);
    });
  }, [connections, search]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12 font-sans selection:bg-[#635BFF]/20 selection:text-[#635BFF]">
      
      {/* --- Premium Hero Section --- */}
      <div className="bg-white border-b border-slate-200 relative overflow-hidden">
        <div className="absolute -right-40 -top-40 w-[500px] h-[500px] bg-gradient-to-br from-[#635BFF]/10 to-[#ec4899]/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">
                Build Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#635BFF] to-[#8B5CF6]">Professional Network</span>
              </h1>
              <p className="text-slate-500 max-w-xl text-sm md:text-base">
                Connect with alumni, mentors, recruiters and students to unlock new career opportunities and insights.
              </p>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="flex gap-3 shrink-0">
              <Link to="/search" className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 shadow-sm transition-colors flex items-center gap-2 text-sm">
                <Search className="w-4 h-4" /> Find People
              </Link>
              <Link to="/connections/requests" className="px-5 py-2.5 bg-[#635BFF] text-white font-semibold rounded-xl shadow-[0_4px_14px_0_rgba(99,91,255,0.39)] hover:-translate-y-0.5 transition-all flex items-center gap-2 text-sm">
                <UserPlus className="w-4 h-4" /> Connection Requests
              </Link>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* --- Main Content --- */}
          <div className="flex-1 space-y-6">
            
            {/* Network Stats & Search Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {!isPending && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#635BFF]/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-[#635BFF]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900 leading-none">{connections.length}</p>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Total Connections</p>
                  </div>
                </div>
              )}

              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search connections..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-[#635BFF]/20 focus:border-[#635BFF] transition-all shadow-sm outline-none"
                />
                {search && (
                  <button aria-label="Clear search" onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Results Label */}
            {!isPending && search && (
              <p className="text-sm font-medium text-slate-500">
                {filtered.length === 0 ? 'No connections match your search.' : `Found ${filtered.length} connection${filtered.length !== 1 ? 's' : ''}`}
              </p>
            )}

            {/* Skeleton Loading */}
            {isPending && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm animate-pulse h-72 flex flex-col">
                    <div className="h-20 bg-slate-200 rounded-t-2xl w-full" />
                    <div className="px-5 pb-5 -mt-10 flex-1 flex flex-col">
                      <div className="w-20 h-20 bg-slate-300 rounded-xl border-4 border-white mb-3" />
                      <div className="h-4 bg-slate-200 rounded w-2/3 mb-2" />
                      <div className="h-3 bg-slate-200 rounded w-1/2 mb-4" />
                      <div className="mt-auto flex gap-2">
                        <div className="h-9 bg-slate-200 rounded-xl flex-1" />
                        <div className="h-9 bg-slate-200 rounded-xl w-10" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isPending && connections.length === 0 && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-sm max-w-2xl mx-auto mt-10">
                <div className="w-24 h-24 bg-gradient-to-br from-[#635BFF]/10 to-[#8B5CF6]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <UserPlus className="w-10 h-10 text-[#635BFF]" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Grow Your Network</h3>
                <p className="text-slate-500 mb-8 max-w-md mx-auto">
                  Your network is completely empty. Start connecting with alumni, mentors, and peers to uncover hidden opportunities.
                </p>
                <Link to="/search" className="inline-flex items-center gap-2 px-8 py-3 bg-[#635BFF] text-white font-semibold rounded-xl shadow-[0_4px_14px_0_rgba(99,91,255,0.39)] transition-all hover:-translate-y-0.5">
                  Explore Alumni <ExternalLink className="w-4 h-4" />
                </Link>
              </motion.div>
            )}

            {/* Connections Grid */}
            {!isPending && filtered.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                <AnimatePresence>
                  {filtered.map((conn, idx) => (
                    <ConnectionCard
                      key={conn._id}
                      conn={conn}
                      index={idx}
                      onMessage={(id) => { setMessagingId(id); chatMut.mutate(id); }}
                      onRemove={(id) => { setRemovingId(id); removeMut.mutate(id); }}
                      isMessaging={messagingId === (normalizeUser(conn.user || conn.connectedUser || conn)?._id) && chatMut.isPending}
                      isRemoving={removingId === (normalizeUser(conn.user || conn.connectedUser || conn)?._id) && removeMut.isPending}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* --- Right AI Insight Panel --- */}
          <div className="hidden lg:block w-80 shrink-0 space-y-6">
            <div className="sticky top-24 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#16A34A] to-[#10B981] flex items-center justify-center text-white">
                  <Activity className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900">Networking Insights</h3>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Network Health</h4>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#15803D] w-[65%]" />
                  </div>
                  <p className="text-xs text-slate-500 mt-2 font-medium">Top 35% among your peers</p>
                </div>
                
                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">AI Suggestion</h4>
                  <div className="p-4 bg-[#635BFF]/5 rounded-xl border border-[#635BFF]/10 text-sm text-slate-700">
                    <p className="mb-2">You haven't connected with any <strong>Alumni</strong> in the software industry recently.</p>
                    <Link to="/search?role=alumni" className="text-[#635BFF] font-semibold text-xs hover:underline flex items-center gap-1">
                      Find Software Alumni <ExternalLink className="w-3 h-3" />
                    </Link>
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
