import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Calendar, CheckCircle2, XCircle, Clock, Zap, 
  MapPin, ShieldCheck, FileText, ArrowRight, Video, Target, TrendingUp, AlertCircle, Star, MoreVertical
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getReceivedRequests, acceptRequest, rejectRequest, scheduleSession, getMySessions } from '../../api/mentorship.api';
import Avatar from '../../components/ui/Avatar';
import Modal from '../../components/ui/Modal';

// --- Ultra Premium Metric Card (Apple / Linear Vibe) ---
const MetricCard = ({ title, value, icon: Icon, trend, colorClass }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-xl shadow-slate-200/40 flex flex-col justify-between group hover:border-[#635BFF]/30 transition-all">
    <div className="flex justify-between items-start mb-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colorClass.bg} shadow-inner`}>
        <Icon className={`w-6 h-6 ${colorClass.text}`} />
      </div>
      {trend && (
        <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-black uppercase tracking-wider rounded-xl border border-emerald-100 flex items-center gap-1 shadow-sm">
          <TrendingUp className="w-3.5 h-3.5" /> {trend}
        </span>
      )}
    </div>
    <div>
      <h4 className="text-4xl font-black text-slate-900 tracking-tight">{value}</h4>
      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-2">{title}</p>
    </div>
  </motion.div>
);

// --- Sleek Request List Card ---
const RequestCard = ({ req, onUpdateStatus, onSchedule }) => {
  if (!req) return null;
  const student = req.studentId || {};
  const status = req.status;
  
  const statusConfig = {
    pending: { label: 'Action Required', bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200', icon: Clock },
    accepted: { label: 'Scheduled', bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200', icon: CheckCircle2 },
    rejected: { label: 'Declined', bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200', icon: XCircle },
    completed: { label: 'Completed', bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-200', icon: Target }
  };
  const conf = statusConfig[status] || statusConfig.pending;
  const StatusIcon = conf.icon;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[24px] border border-slate-200 shadow-lg shadow-slate-200/40 p-6 flex flex-col xl:flex-row gap-6 relative overflow-hidden group hover:border-[#635BFF]/30 transition-all">
      
      {/* Decorative side accent */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${status === 'pending' ? 'bg-amber-400' : status === 'accepted' ? 'bg-[#16A34A]' : 'bg-slate-200'}`} />

      {/* Profile Section */}
      <div className="flex items-start gap-4 xl:w-1/3 shrink-0">
        <Avatar src={student.avatar} name={student.fullName || student.username || 'Student'} size="2xl" className="w-16 h-16 rounded-[20px] shadow-sm border border-slate-100" />
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-black text-slate-900 group-hover:text-[#635BFF] transition-colors">{student.fullName || student.username || 'Student'}</h3>
            {student.isVerified && <ShieldCheck className="w-4 h-4 text-[#16A34A]" />}
          </div>
          <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5 mb-2">
             <MapPin className="w-3.5 h-3.5" /> {student.college || 'BCET'} • {student.branch || 'B.Tech'}
          </p>
          <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider items-center gap-1.5 border shadow-sm ${conf.bg} ${conf.text} ${conf.border}`}>
             <StatusIcon className="w-3 h-3" /> {conf.label}
          </span>
        </div>
      </div>

      {/* Context Section */}
      <div className="flex-1 border-t xl:border-t-0 xl:border-l border-slate-100 pt-4 xl:pt-0 xl:pl-6 flex flex-col justify-center">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mentorship Goal</p>
        </div>
        <p className="text-sm text-slate-700 font-medium leading-relaxed italic line-clamp-2 mb-4">"{req.message || 'I would like to learn from your experience and get guidance on my career path.'}"</p>
        
        <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
          <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200"><Video className="w-4 h-4 text-[#635BFF]" /> {req.preferredMode || 'Video Call'}</span>
          <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200"><Clock className="w-4 h-4 text-slate-400" /> 30 mins</span>
        </div>
      </div>

      {/* Actions Section */}
      <div className="flex xl:flex-col gap-3 justify-center shrink-0 border-t xl:border-t-0 xl:border-l border-slate-100 pt-4 xl:pt-0 xl:pl-6">
         {status === 'pending' ? (
            <>
              <button 
                onClick={() => onUpdateStatus(req._id, 'accepted')}
                className="flex-1 xl:flex-none py-3 px-6 bg-slate-900 text-white font-black rounded-xl shadow-lg hover:bg-black transition-all hover:scale-105 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> Accept
              </button>
              <button 
                onClick={() => { if(window.confirm('Decline this request?')) onUpdateStatus(req._id, 'rejected'); }}
                className="flex-1 xl:flex-none py-3 px-6 bg-white border-2 border-slate-200 text-red-500 font-black rounded-xl hover:bg-red-50 hover:border-red-200 transition-colors shadow-sm"
              >
                Decline
              </button>
            </>
          ) : status === 'accepted' ? (
            <button onClick={() => onSchedule(req)} className="w-full py-3 px-6 bg-gradient-to-r from-[#635BFF] to-[#8B5CF6] text-white font-black rounded-xl shadow-[0_4px_14px_0_rgba(99,91,255,0.4)] hover:shadow-[0_6px_20px_0_rgba(99,91,255,0.5)] transition-all hover:scale-105 flex items-center justify-center gap-2">
              <Calendar className="w-4 h-4" /> Schedule
            </button>
          ) : (
            <Link to={`/profile/${student._id || student.userId}`} className="w-full py-3 px-6 bg-slate-50 border border-slate-200 text-slate-700 font-black rounded-xl shadow-sm hover:bg-slate-100 transition-colors flex items-center justify-center gap-2">
              Profile <ArrowRight className="w-4 h-4" />
            </Link>
          )}
      </div>
    </motion.div>
  );
};

export default function ReceivedMentorRequestsPage() {
  const [filter, setFilter] = useState('pending');
  const [scheduleFor, setScheduleFor] = useState(null);
  const [sessionForm, setSessionForm] = useState({
    scheduledAt: '',
    duration: 30,
    mode: 'online',
    meetingLink: '',
    notes: '',
  });
  const qc = useQueryClient();

  const { data, isPending } = useQuery({ queryKey: ['received-mentor-requests'], queryFn: getReceivedRequests });
  const { data: sessionsData } = useQuery({
    queryKey: ['mentor-sessions', 'scheduled'],
    queryFn: () => getMySessions({ status: 'scheduled', limit: 5 }),
  });
  const updMut = useMutation({
    mutationFn: ({ id, action }) => {
      if (action === 'accepted') return acceptRequest(id, { meetingNote: 'Accepted' });
      if (action === 'rejected') return rejectRequest(id, { reason: 'Schedule conflict' });
      return Promise.reject(new Error('Invalid action'));
    },
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries({ queryKey: ['received-mentor-requests'] }); },
    onError: (e) => toast.error(e?.message || 'Update failed')
  });

  const scheduleMut = useMutation({
    mutationFn: () => scheduleSession({
      requestId: scheduleFor._id,
      scheduledAt: new Date(sessionForm.scheduledAt).toISOString(),
      duration: Number(sessionForm.duration),
      mode: sessionForm.mode,
      meetingLink: sessionForm.meetingLink,
      notes: sessionForm.notes,
    }),
    onSuccess: () => {
      toast.success('Session scheduled');
      setScheduleFor(null);
      qc.invalidateQueries({ queryKey: ['mentor-sessions'] });
      qc.invalidateQueries({ queryKey: ['received-mentor-requests'] });
    },
    onError: (e) => toast.error(e?.message || 'Failed to schedule session'),
  });

  const requests = data?.data?.requests || [];
  const sessions = sessionsData?.data?.sessions || [];
  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);

  const openSchedule = (req) => {
    setScheduleFor(req);
    setSessionForm({
      scheduledAt: '',
      duration: req.duration || 30,
      mode: req.mode || 'online',
      meetingLink: '',
      notes: req.meetingNote || '',
    });
  };

  // Generational Calendar Widget
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const dates = Array.from({length: 31}, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12 font-sans selection:bg-[#635BFF]/20 selection:text-[#635BFF]">
      
      {/* ─── ULTRA PREMIUM HERO ─── */}
      <div className="bg-white border-b border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 text-xs font-bold text-[#8B5CF6] mb-4 uppercase tracking-wide">
              <Star className="w-3.5 h-3.5" /> Mentorship Hub
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-none mb-4">Review Requests</h1>
            <p className="text-lg font-medium text-slate-500">Manage your calendar and mentor the next generation.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <button className="px-6 py-3 bg-white border border-slate-200 text-slate-700 text-sm font-black rounded-2xl hover:bg-slate-50 shadow-sm flex items-center gap-2 transition-all hover:scale-105">
              <Clock className="w-4 h-4" /> Availability
            </button>
            <button className="px-6 py-3 bg-slate-900 text-white text-sm font-black rounded-2xl shadow-lg hover:bg-black flex items-center gap-2 transition-all hover:scale-105">
              <Calendar className="w-4 h-4" /> Google Meet
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        
        {/* ─── TOP ANALYTICS CARDS ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <MetricCard title="Action Required" value={requests.filter(r => r.status === 'pending').length} icon={AlertCircle} colorClass={{ bg: 'bg-amber-50', text: 'text-amber-500' }} />
          <MetricCard title="Upcoming Sessions" value={requests.filter(r => r.status === 'accepted').length} icon={Calendar} colorClass={{ bg: 'bg-[#635BFF]/10', text: 'text-[#635BFF]' }} />
          <MetricCard title="Completed" value={requests.filter(r => r.status === 'completed').length} icon={Target} trend="+12%" colorClass={{ bg: 'bg-[#16A34A]/10', text: 'text-[#16A34A]' }} />
          <MetricCard title="Mentorship Hours" value="24h" icon={Clock} colorClass={{ bg: 'bg-[#8B5CF6]/10', text: 'text-[#8B5CF6]' }} />
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* ─── MAIN CONTENT AREA ─── */}
          <div className="flex-1 space-y-8">
            
            {/* Minimalist Filter Tabs */}
            <div className="flex gap-2">
              {['pending', 'accepted', 'completed', 'all'].map(f => (
                <button
                  key={f} onClick={() => setFilter(f)}
                  className={`px-6 py-2.5 text-xs font-black uppercase tracking-wider rounded-2xl transition-all ${filter === f ? 'bg-slate-900 text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Request List */}
            {isPending ? (
              <div className="space-y-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-[24px] border border-slate-200 p-6 animate-pulse h-40 flex items-center gap-6">
                    <div className="w-16 h-16 bg-slate-200 rounded-[20px]" />
                    <div className="flex-1"><div className="w-1/3 h-5 bg-slate-200 rounded mb-3" /><div className="w-2/3 h-4 bg-slate-200 rounded" /></div>
                    <div className="w-32 h-12 bg-slate-200 rounded-xl" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white rounded-[32px] p-20 text-center border border-slate-200 shadow-xl shadow-slate-200/40">
                <div className="w-24 h-24 bg-slate-50 rounded-[24px] flex items-center justify-center mx-auto mb-8 border border-slate-100 rotate-3">
                  <FileText className="w-10 h-10 text-slate-300 -rotate-3" />
                </div>
                <h3 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Inbox Zero</h3>
                <p className="text-slate-500 font-medium max-w-sm mx-auto mb-8 text-lg">
                  {filter === 'pending' ? "You have no pending requests right now. Great job!" : "Nothing to show here."}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <AnimatePresence>
                  {filtered.map(req => (
                    <RequestCard
                      key={req._id}
                      req={req}
                      onSchedule={openSchedule}
                      onUpdateStatus={(id, action) => updMut.mutate({ id, action })}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* ─── RIGHT SIDEBAR (Calendly Widget Style) ─── */}
          <div className="hidden lg:block w-[400px] shrink-0 space-y-8">
            <div className="sticky top-24 space-y-8">
              
              {/* Apple-style Calendar Widget */}
              <div className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-2xl shadow-slate-200/40">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-black text-xl text-slate-900">October 2026</h3>
                  <div className="flex gap-2">
                    <button className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition-colors">&lt;</button>
                    <button className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition-colors">&gt;</button>
                  </div>
                </div>
                
                <div className="grid grid-cols-7 gap-2 mb-4 text-center text-[10px] font-black text-slate-400 uppercase">
                  {days.map((d, i) => <div key={i}>{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-2 text-center text-sm font-bold text-slate-700">
                  <div /><div /><div />
                  {dates.map(d => {
                    const hasEvent = d === 15 || d === 18;
                    const isToday = d === 12;
                    return (
                      <div key={d} className={`relative w-10 h-10 mx-auto rounded-full flex items-center justify-center cursor-pointer transition-all ${isToday ? 'bg-[#635BFF] text-white shadow-lg shadow-[#635BFF]/30' : 'hover:bg-slate-100'}`}>
                        {d}
                        {hasEvent && !isToday && <span className="absolute bottom-1.5 w-1 h-1 bg-amber-500 rounded-full" />}
                      </div>
                    )
                  })}
                </div>

                <div className="mt-8 pt-8 border-t border-slate-100">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Upcoming Schedule</h4>
                  <div className="space-y-4">
                    {sessions.length === 0 ? (
                      <p className="text-xs font-bold text-slate-400">No scheduled sessions yet.</p>
                    ) : sessions.map((session) => {
                      if (!session) return null;
                      const starts = new Date(session.scheduledAt);
                      return (
                        <div key={session._id} className="flex items-start gap-4">
                          <div className="flex flex-col items-center w-12">
                            <span className="text-sm font-black text-slate-900">{starts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span className="text-[10px] font-bold text-slate-400">{starts.toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                          </div>
                          <div className="flex-1 bg-amber-50 border border-amber-100 p-3 rounded-2xl">
                            <p className="text-sm font-bold text-amber-900">{session.topic}</p>
                            <p className="text-xs font-bold text-amber-600/80 mt-1">with {session.studentId?.username || 'Student'} · {session.duration} min</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Pro Insights */}
              <div className="bg-gradient-to-br from-slate-900 to-black rounded-[32px] p-8 shadow-2xl relative overflow-hidden text-white border border-slate-800">
                <div className="absolute top-0 right-0 p-6"><Zap className="w-8 h-8 text-[#635BFF]" /></div>
                <h3 className="text-2xl font-black mb-3">Top 1% Mentor</h3>
                <p className="text-sm text-slate-400 font-medium mb-8 leading-relaxed">Your profile is highly ranked. Students are specifically looking for your expertise in React and AWS.</p>
                <button className="w-full py-4 bg-white text-slate-900 font-black rounded-2xl hover:scale-[1.02] transition-transform shadow-lg">
                  Update Availability
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>

      <Modal
        open={!!scheduleFor}
        onClose={() => setScheduleFor(null)}
        title="Schedule mentorship session"
        maxWidth="max-w-xl"
        footer={
          <>
            <button type="button" onClick={() => setScheduleFor(null)} className="btn-ghost">Cancel</button>
            <button
              type="button"
              disabled={scheduleMut.isPending || !sessionForm.scheduledAt || (sessionForm.mode === 'online' && !sessionForm.meetingLink)}
              onClick={() => scheduleMut.mutate()}
              className="btn-primary flex items-center gap-2 disabled:opacity-60"
            >
              <Calendar className="w-4 h-4" />
              {scheduleMut.isPending ? 'Scheduling...' : 'Schedule'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Request</p>
            <p className="mt-1 text-sm font-semibold text-slate-100">{scheduleFor?.topic}</p>
            <p className="mt-1 text-xs text-slate-400 line-clamp-2">{scheduleFor?.message}</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Date and time</label>
              <input
                type="datetime-local"
                className="input-field"
                value={sessionForm.scheduledAt}
                onChange={(e) => setSessionForm((f) => ({ ...f, scheduledAt: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Duration</label>
              <select className="input-field" value={sessionForm.duration} onChange={(e) => setSessionForm((f) => ({ ...f, duration: e.target.value }))}>
                {[30, 45, 60, 90].map((d) => <option key={d} value={d}>{d} minutes</option>)}
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Mode</label>
              <select className="input-field" value={sessionForm.mode} onChange={(e) => setSessionForm((f) => ({ ...f, mode: e.target.value }))}>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
              </select>
            </div>
            <div>
              <label className="label">Meeting link</label>
              <input
                type="url"
                className="input-field"
                placeholder="https://meet.google.com/..."
                value={sessionForm.meetingLink}
                onChange={(e) => setSessionForm((f) => ({ ...f, meetingLink: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea
              rows={3}
              className="input-field resize-none"
              placeholder="Agenda, preparation notes, or location details"
              value={sessionForm.notes}
              onChange={(e) => setSessionForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
