import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  MapPin, Briefcase, GraduationCap, Globe, UserPlus, UserCheck,
  MessageSquare, Code2, Star, ExternalLink, Building2, Calendar,
  Users, Eye, Award, ChevronRight, Zap, BookOpen, Send, UserX
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getPublicProfile, getPublicProjects } from '../../api/users.api';
import { 
  sendConnectionRequest, getConnectionStatus, removeConnection,
  cancelConnectionRequest, acceptConnectionRequest, rejectConnectionRequest
} from '../../api/connections.api';
import { startConversation } from '../../api/communication.api';
import { useAuth } from '../../hooks/useAuth';
import Avatar from '../../components/ui/Avatar';

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function ProfileSkeleton() {
  return (
    <div className="max-w-6xl mx-auto pb-16 animate-pulse">
      {/* Cover */}
      <div className="h-52 bg-gradient-to-r from-slate-200 to-slate-300 rounded-b-3xl" />
      <div className="px-6 sm:px-10">
        <div className="flex flex-col md:flex-row gap-6 -mt-16 mb-8">
          <div className="w-32 h-32 rounded-3xl bg-slate-200 border-4 border-white shadow-xl flex-shrink-0" />
          <div className="pt-16 md:pt-6 flex-1 space-y-3">
            <div className="h-7 w-56 bg-slate-200 rounded-lg" />
            <div className="h-4 w-40 bg-slate-200 rounded" />
            <div className="h-4 w-32 bg-slate-200 rounded" />
          </div>
          <div className="flex gap-3 pt-16 md:pt-6">
            <div className="h-11 w-36 bg-slate-200 rounded-xl" />
            <div className="h-11 w-28 bg-slate-200 rounded-xl" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="h-48 bg-slate-100 rounded-2xl" />
            <div className="h-32 bg-slate-100 rounded-2xl" />
          </div>
          <div className="lg:col-span-2 space-y-4">
            <div className="h-36 bg-slate-100 rounded-2xl" />
            <div className="h-52 bg-slate-100 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ value, label, icon: Icon, color = 'indigo' }) {
  const colors = {
    indigo: 'from-indigo-50 to-indigo-100/50 text-indigo-600 border-indigo-100',
    emerald: 'from-emerald-50 to-emerald-100/50 text-emerald-600 border-emerald-100',
    amber: 'from-amber-50 to-amber-100/50 text-amber-600 border-amber-100',
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-5 text-center`}>
      <Icon className={`w-5 h-5 mx-auto mb-2 opacity-70`} />
      <p className="text-2xl font-black text-slate-900">{value ?? 0}</p>
      <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mt-0.5">{label}</p>
    </div>
  );
}

// ─── Section Card ──────────────────────────────────────────────────────────────
function Section({ icon: Icon, title, iconColor = 'text-indigo-500', children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
    >
      <h2 className="font-bold text-slate-900 flex items-center gap-2.5 mb-5 text-[15px]">
        <span className={`${iconColor} bg-slate-50 p-1.5 rounded-lg border border-slate-100`}>
          <Icon className="w-4 h-4" />
        </span>
        {title}
      </h2>
      {children}
    </motion.div>
  );
}

export default function PublicProfilePage() {
  const { userId } = useParams();
  const { user: me } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const { data, isPending } = useQuery({
    queryKey: ['public-profile', userId],
    queryFn: () => getPublicProfile(userId),
  });

  const { data: projectsData } = useQuery({
    queryKey: ['public-projects', userId],
    queryFn: () => getPublicProjects(userId),
    enabled: !!userId,
  });

  const connMutation = useMutation({
    mutationFn: () => sendConnectionRequest({ receiverId: userId }),
    onSuccess: () => {
      toast.success('Connection request sent!');
      qc.invalidateQueries({ queryKey: ['public-profile', userId] });
    },
    onError: (e) => toast.error(e?.message || 'Failed to send request'),
  });

  const removeConnMutation = useMutation({
    mutationFn: () => removeConnection(userId),
    onSuccess: () => {
      toast.success('Connection removed');
      qc.invalidateQueries({ queryKey: ['public-profile', userId] });
    },
    onError: (e) => toast.error(e?.message || 'Failed to remove connection'),
  });

  const chatMutation = useMutation({
    mutationFn: () => startConversation({ recipientId: userId }),
    onSuccess: (res) => {
      const convId = res?.data?.conversation?._id || res?.data?._id;
      if (convId) navigate(`/chat/${convId}`);
    },
    onError: (e) => toast.error(e?.message || 'Failed to start chat'),
  });

  const cancelConnMutation = useMutation({
    mutationFn: (reqId) => cancelConnectionRequest(reqId),
    onSuccess: () => {
      toast.success('Connection request cancelled');
      qc.invalidateQueries({ queryKey: ['public-profile', userId] });
    },
    onError: (e) => toast.error(e?.message || 'Failed to cancel request'),
  });

  const acceptConnMutation = useMutation({
    mutationFn: (reqId) => acceptConnectionRequest(reqId),
    onSuccess: () => {
      toast.success('Connection accepted!');
      qc.invalidateQueries({ queryKey: ['public-profile', userId] });
    },
    onError: (e) => toast.error(e?.message || 'Failed to accept connection'),
  });

  const rejectConnMutation = useMutation({
    mutationFn: (reqId) => rejectConnectionRequest(reqId),
    onSuccess: () => {
      toast.success('Connection request rejected');
      qc.invalidateQueries({ queryKey: ['public-profile', userId] });
    },
    onError: (e) => toast.error(e?.message || 'Failed to reject connection'),
  });

  if (isPending) return <ProfileSkeleton />;

  // Backend response: data.data.profile = Profile doc, data.data.connectionStatus = { status, requestId }
  const profileDoc = data?.data?.profile || {};
  const connStatusObj = data?.data?.connectionStatus || { status: 'none' };
  const connStatus = connStatusObj.status || connStatusObj;
  const requestId = connStatusObj.requestId;
  
  const projects = projectsData?.data?.projects || [];

  const myId = me?.userId || me?._id || me?.id;
  const isOwnProfile = myId && (myId.toString() === userId || myId.toString() === profileDoc.userId?.toString());

  // Determine role badge style
  const roleBadge = {
    alumni: { label: 'Alumni', bg: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    faculty: { label: 'Faculty', bg: 'bg-blue-100 text-blue-700 border-blue-200' },
    student: { label: 'Student', bg: 'bg-violet-100 text-violet-700 border-violet-200' },
    admin: { label: 'Admin', bg: 'bg-slate-800 text-white border-slate-700' },
  }[profileDoc.role] || { label: profileDoc.role, bg: 'bg-slate-100 text-slate-600 border-slate-200' };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'projects', label: `Projects (${projects.length})` },
    { id: 'skills', label: 'Skills' },
  ];

  return (
    <div className="min-h-screen bg-[#F7F8FA] pb-16">
      <div className="max-w-6xl mx-auto">

        {/* ── Cover Banner ─────────────────────────────────────────────── */}
        <div className="relative h-52 md:h-64 rounded-b-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.06%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-100" />
          {profileDoc.coverImage && (
            <img src={profileDoc.coverImage} alt="cover" className="absolute inset-0 w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>

        {/* ── Profile Header ────────────────────────────────────────────── */}
        <div className="px-5 sm:px-8">
          <div className="flex flex-col md:flex-row gap-5 -mt-16 mb-6 items-start md:items-end">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <Avatar
                src={profileDoc.avatar}
                name={profileDoc.fullName || 'User'}
                size="3xl"
                className="w-32 h-32 rounded-3xl border-4 border-white shadow-2xl shadow-slate-900/20"
              />
              {profileDoc.isMentor && (
                <div className="absolute -bottom-2 -right-2 bg-amber-400 rounded-xl p-1.5 border-2 border-white shadow-lg">
                  <Star className="w-4 h-4 text-white fill-white" />
                </div>
              )}
            </div>

            {/* Name + meta */}
            <div className="flex-1 min-w-0 pt-16 md:pt-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-none">
                  {profileDoc.fullName || 'User'}
                </h1>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${roleBadge.bg}`}>
                  {roleBadge.label}
                </span>
                {profileDoc.isMentor && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border bg-amber-100 text-amber-700 border-amber-200">
                    Mentor
                  </span>
                )}
              </div>
              {profileDoc.headline && (
                <p className="text-indigo-600 font-semibold text-sm mb-2">{profileDoc.headline}</p>
              )}
              <div className="flex flex-wrap gap-3 text-sm text-slate-500 font-medium">
                {profileDoc.location && (
                  <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{profileDoc.location}</span>
                )}
                {profileDoc.currentCompany && (
                  <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" />{profileDoc.currentCompany}</span>
                )}
                {profileDoc.branch && (
                  <span className="flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5" />{profileDoc.branch}</span>
                )}
                {profileDoc.passoutYear && (
                  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />Class of {profileDoc.passoutYear}</span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2.5 flex-shrink-0 pt-16 md:pt-0">
              {isOwnProfile ? (
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                >
                  <UserCheck className="w-4 h-4" /> Edit Profile
                </Link>
              ) : (
                <>
                  {connStatus === 'connected' ? (
                    <>
                      <button
                        onClick={() => chatMutation.mutate()}
                        disabled={chatMutation.isPending}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg hover:-translate-y-0.5 transition-all"
                      >
                        <MessageSquare className="w-4 h-4" /> Message
                      </button>
                      <button
                        onClick={() => removeConnMutation.mutate()}
                        disabled={removeConnMutation.isPending}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white text-red-600 border border-red-200 hover:bg-red-50 font-bold text-sm rounded-xl transition-all disabled:opacity-70"
                      >
                        <UserX className="w-4 h-4" /> Remove
                      </button>
                    </>
                  ) : connStatus === 'pending_sent' ? (
                    <button
                      onClick={() => cancelConnMutation.mutate(requestId)}
                      disabled={cancelConnMutation.isPending}
                      className="flex items-center gap-2 px-5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-sm rounded-xl border border-amber-200 transition-all shadow-sm"
                    >
                      <UserX className="w-4 h-4" /> {cancelConnMutation.isPending ? 'Cancelling...' : 'Cancel Request'}
                    </button>
                  ) : connStatus === 'pending_received' ? (
                    <>
                      <button
                        onClick={() => acceptConnMutation.mutate(requestId)}
                        disabled={acceptConnMutation.isPending}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg transition-all"
                      >
                        <UserCheck className="w-4 h-4" /> {acceptConnMutation.isPending ? '...' : 'Accept'}
                      </button>
                      <button
                        onClick={() => rejectConnMutation.mutate(requestId)}
                        disabled={rejectConnMutation.isPending}
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-all"
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => connMutation.mutate()}
                      disabled={connMutation.isPending}
                      className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-70"
                    >
                      <UserPlus className="w-4 h-4" /> {connMutation.isPending ? 'Sending...' : 'Connect'}
                    </button>
                  )}
                  {connStatus !== 'connected' && (
                    <button
                      onClick={() => chatMutation.mutate()}
                      disabled={chatMutation.isPending}
                      className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
                    >
                      <Send className="w-4 h-4" /> {chatMutation.isPending ? '...' : 'Message'}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ── Tabs ─────────────────────────────────────────────────────── */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-6 w-fit">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Content ───────────────────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Col */}
              <div className="space-y-5">

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <StatCard value={profileDoc.stats?.followersCount} label="Connections" icon={Users} color="indigo" />
                  <StatCard value={profileDoc.stats?.profileViews} label="Views" icon={Eye} color="emerald" />
                  <StatCard value={profileDoc.stats?.mentorshipSessionsCount} label="Sessions" icon={Award} color="amber" />
                </div>

                {/* About */}
                {profileDoc.bio && (
                  <Section icon={BookOpen} title="About" iconColor="text-slate-600">
                    <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{profileDoc.bio}</p>
                  </Section>
                )}

                {/* Social Links */}
                {(profileDoc.socialLinks?.github || profileDoc.socialLinks?.linkedin || profileDoc.socialLinks?.portfolio) && (
                  <Section icon={Globe} title="Links" iconColor="text-blue-500">
                    <div className="space-y-2">
                      {profileDoc.socialLinks?.github && (
                        <a href={profileDoc.socialLinks.github} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 transition-all text-sm font-medium text-slate-700 group">
                          <Code2 className="w-4 h-4 text-slate-500 group-hover:text-slate-900" />
                          <span className="truncate">GitHub</span>
                          <ExternalLink className="w-3 h-3 ml-auto text-slate-400 group-hover:text-slate-700" />
                        </a>
                      )}
                      {profileDoc.socialLinks?.linkedin && (
                        <a href={profileDoc.socialLinks.linkedin} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-100 transition-all text-sm font-medium text-blue-700 group">
                          <Users className="w-4 h-4 text-blue-500" />
                          <span className="truncate">LinkedIn</span>
                          <ExternalLink className="w-3 h-3 ml-auto text-blue-400 group-hover:text-blue-700" />
                        </a>
                      )}
                      {profileDoc.socialLinks?.portfolio && (
                        <a href={profileDoc.socialLinks.portfolio} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 transition-all text-sm font-medium text-indigo-700 group">
                          <Globe className="w-4 h-4 text-indigo-500" />
                          <span className="truncate">Portfolio</span>
                          <ExternalLink className="w-3 h-3 ml-auto text-indigo-400 group-hover:text-indigo-700" />
                        </a>
                      )}
                    </div>
                  </Section>
                )}

                {/* Mentor Card */}
                {profileDoc.isMentor && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 p-5"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Star className="w-20 h-20 text-amber-500" />
                    </div>
                    <div className="relative z-10">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30 mb-3">
                        <Star className="w-5 h-5 text-white fill-white" />
                      </div>
                      <h3 className="font-black text-amber-800 mb-1">Available as Mentor</h3>
                      <p className="text-xs text-amber-700/80 mb-4 leading-relaxed">Offers guidance and mentorship sessions to students and professionals.</p>
                      <Link
                        to={`/mentors/${userId}`}
                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition-all shadow-md shadow-amber-500/20 hover:shadow-lg"
                      >
                        Book a Session <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Right Col */}
              <div className="lg:col-span-2 space-y-5">

                {/* Current Role */}
                {(profileDoc.currentRole || profileDoc.currentCompany || profileDoc.department || profileDoc.branch) && (
                  <Section icon={Briefcase} title="Career" iconColor="text-indigo-500">
                    <div className="space-y-3">
                      {profileDoc.currentRole && (
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Briefcase className="w-5 h-5 text-indigo-500" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{profileDoc.currentRole}</p>
                            {profileDoc.currentCompany && <p className="text-slate-500 text-xs font-medium">{profileDoc.currentCompany}</p>}
                          </div>
                        </div>
                      )}
                      {(profileDoc.branch || profileDoc.department) && (
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center flex-shrink-0">
                            <GraduationCap className="w-5 h-5 text-amber-500" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{profileDoc.branch}</p>
                            {profileDoc.department && <p className="text-slate-500 text-xs font-medium">{profileDoc.department}</p>}
                            {profileDoc.passoutYear && <p className="text-slate-400 text-[11px] font-medium mt-0.5">Class of {profileDoc.passoutYear}</p>}
                          </div>
                        </div>
                      )}
                    </div>
                  </Section>
                )}

                {/* Interests */}
                {profileDoc.interests?.length > 0 && (
                  <Section icon={Zap} title="Interests" iconColor="text-amber-500">
                    <div className="flex flex-wrap gap-2">
                      {profileDoc.interests.map(i => (
                        <span key={i} className="px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 text-amber-800 text-xs font-semibold capitalize">
                          {i}
                        </span>
                      ))}
                    </div>
                  </Section>
                )}

                {/* Skills Preview */}
                {profileDoc.searchableSkills?.length > 0 && (
                  <Section icon={Code2} title="Key Skills" iconColor="text-emerald-500">
                    <div className="flex flex-wrap gap-2">
                      {profileDoc.searchableSkills.slice(0, 12).map(s => (
                        <span key={s} className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 text-emerald-800 text-xs font-bold capitalize hover:border-emerald-300 transition-colors cursor-default">
                          {s}
                        </span>
                      ))}
                      {profileDoc.searchableSkills.length > 12 && (
                        <button onClick={() => setActiveTab('skills')} className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs font-bold hover:bg-slate-100 transition-colors">
                          +{profileDoc.searchableSkills.length - 12} more
                        </button>
                      )}
                    </div>
                  </Section>
                )}

                {/* Featured Projects Preview */}
                {projects.length > 0 && (
                  <Section icon={Code2} title="Featured Projects" iconColor="text-purple-500">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {projects.slice(0, 2).map(p => (
                        <div key={p._id} className="group p-4 rounded-xl bg-slate-50 hover:bg-white border border-slate-200 hover:border-purple-200 hover:shadow-md transition-all">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-bold text-slate-900 text-sm group-hover:text-purple-600 transition-colors">{p.title}</h3>
                            {p.projectType && <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 text-[10px] font-bold border border-purple-100 flex-shrink-0">{p.projectType}</span>}
                          </div>
                          <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 mb-3">{p.description}</p>
                          {p.techStack?.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {p.techStack.slice(0, 4).map(t => (
                                <span key={t} className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600 text-[10px] font-medium">{t}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {projects.length > 2 && (
                      <button onClick={() => setActiveTab('projects')} className="mt-3 w-full py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-sm font-bold transition-colors flex items-center justify-center gap-2">
                        View all {projects.length} projects <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </Section>
                )}
              </div>
            </div>
          )}

          {activeTab === 'projects' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {projects.length === 0 ? (
                <div className="col-span-full py-20 text-center">
                  <Code2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 font-medium">No projects added yet.</p>
                </div>
              ) : projects.map(p => (
                <motion.div
                  key={p._id}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  className="group bg-white border border-slate-200 hover:border-purple-200 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all flex flex-col"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-bold text-slate-900 group-hover:text-purple-600 transition-colors">{p.title}</h3>
                    {p.projectType && <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 text-[10px] font-bold border border-purple-100 flex-shrink-0">{p.projectType.replace('-', ' ')}</span>}
                  </div>
                  <p className="text-slate-500 text-sm leading-relaxed line-clamp-3 mb-4 flex-1">{p.description}</p>
                  {p.techStack?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {p.techStack.map(t => (
                        <span key={t} className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-100 text-[11px] font-bold">{t}</span>
                      ))}
                    </div>
                  )}
                  {(p.githubUrl || p.demoUrl) && (
                    <div className="flex gap-2 pt-4 border-t border-slate-100">
                      {p.githubUrl && (
                        <a href={p.githubUrl} target="_blank" rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors">
                          <Code2 className="w-3.5 h-3.5" /> GitHub
                        </a>
                      )}
                      {p.demoUrl && (
                        <a href={p.demoUrl} target="_blank" rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100 text-xs font-bold transition-colors">
                          <Globe className="w-3.5 h-3.5" /> Live Demo
                        </a>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === 'skills' && (
            <div className="max-w-3xl">
              <Section icon={Code2} title="All Skills & Expertise" iconColor="text-emerald-500">
                {profileDoc.searchableSkills?.length > 0 ? (
                  <div className="flex flex-wrap gap-2.5">
                    {profileDoc.searchableSkills.map(s => (
                      <motion.span
                        key={s}
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-emerald-800 text-sm font-bold capitalize hover:border-emerald-400 hover:shadow-md hover:shadow-emerald-500/10 transition-all cursor-default"
                      >
                        {s}
                      </motion.span>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm italic">No skills listed yet.</p>
                )}
              </Section>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
