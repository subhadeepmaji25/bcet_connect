import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MapPin, Briefcase, Calendar, Clock, Globe, Shield, MessageSquare, X, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getPublicMentorProfile, createRequest } from '../../api/mentorship.api';
import Avatar from '../../components/ui/Avatar';

const MENTORSHIP_TOPICS = ["placement", "resume", "career", "interview", "projects", "research", "higher-studies", "coding", "hackathon"];

export default function MentorProfilePage() {
  const { mentorId } = useParams();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [topic, setTopic] = useState(MENTORSHIP_TOPICS[0]);
  const [message, setMessage] = useState('');
  const [preferredDomain, setPreferredDomain] = useState('');
  const [preferredSlot, setPreferredSlot] = useState('');
  const [mode, setMode] = useState('online');

  const { data, isLoading } = useQuery({
    queryKey: ['mentorProfile', mentorId],
    queryFn: async () => {
      const res = await getPublicMentorProfile(mentorId);
      return res.data;
    }
  });

  const requestMutation = useMutation({
    mutationFn: createRequest,
    onSuccess: () => {
      toast.success('Mentorship request sent successfully!');
      setIsModalOpen(false);
      setMessage('');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to send request');
    }
  });

  const handleRequestSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) return toast.error('Message is required');
    if (!topic) return toast.error('Topic is required');
    
    requestMutation.mutate({
      mentorId,
      topic,
      message,
      preferredDomain: preferredDomain || undefined,
      preferredSlot: preferredSlot || undefined,
      mode
    });
  };

  if (isLoading) return <div className="min-h-screen bg-slate-50 p-8 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;
  if (!data?.mentorProfile) return <div className="min-h-screen bg-slate-50 p-8 text-center text-lg font-bold text-slate-700">Mentor not found</div>;

  const { mentorProfile, publicProfile, requestStatus } = data;
  const { fullName, currentCompany, currentRole, avatar } = publicProfile || {};
  const { bio, domains, languages, yearsExperience, company, designation, availability, verificationStatus, rating, reviewCount, totalSessions } = mentorProfile;

  const displayCompany = company || currentCompany;
  const displayRole = designation || currentRole;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,91,255,0.10),_transparent_42%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Card */}
        <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)] border border-white/70 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-primary-500/10 to-blue-500/10" />
          
          <div className="relative pt-8 flex flex-col md:flex-row gap-8 items-start">
            <div className="relative">
              <Avatar src={avatar} alt={fullName} size="2xl" className="ring-8 ring-white shadow-lg" />
              {verificationStatus === 'verified' && (
                <div className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full ring-4 ring-white" title="Verified Expert">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">{fullName}</h1>
                  <p className="text-lg text-slate-600 font-medium mt-1">
                    {displayRole} {displayCompany ? `at ${displayCompany}` : ''}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.14em] bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Mentor Profile
                    </span>
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.14em] bg-slate-50 text-slate-700 border border-slate-200">
                      {verificationStatus === 'verified' ? 'Verified' : 'Pending Review'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-4 text-sm font-bold">
                    <div className="flex items-center gap-1.5 bg-amber-50 text-amber-600 px-3 py-1.5 rounded-xl">
                      <Star className="w-4 h-4 fill-amber-500" />
                      {rating > 0 ? rating.toFixed(1) : 'New'} ({reviewCount} reviews)
                    </div>
                    <div className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl">
                      <Shield className="w-4 h-4" />
                      {totalSessions} Sessions
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl">
                      <Briefcase className="w-4 h-4" />
                      {yearsExperience} YOE
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setIsModalOpen(true)}
                  disabled={requestStatus === 'pending' || requestStatus === 'accepted'}
                  className="shrink-0 flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MessageSquare className="w-5 h-5" />
                  {requestStatus === 'pending' ? 'Request Pending' : requestStatus === 'accepted' ? 'Mentoring You' : 'Request Mentorship'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-8">
            <div className="bg-white/90 backdrop-blur-xl rounded-[1.75rem] p-8 shadow-[0_16px_60px_rgba(15,23,42,0.06)] border border-white/70">
              <h2 className="text-xl font-black text-slate-900 mb-4">About Me</h2>
              <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">
                {bio || "This mentor is ready to guide you!"}
              </p>
            </div>

            <div className="bg-white/90 backdrop-blur-xl rounded-[1.75rem] p-8 shadow-[0_16px_60px_rgba(15,23,42,0.06)] border border-white/70">
              <h2 className="text-xl font-black text-slate-900 mb-6">Expertise Domains</h2>
              <div className="flex flex-wrap gap-3">
                {domains.map(d => (
                  <span key={d} className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-bold text-sm">
                    {d.replace('_', ' ').toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <div className="bg-white/90 backdrop-blur-xl rounded-[1.75rem] p-6 shadow-[0_16px_60px_rgba(15,23,42,0.06)] border border-white/70">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
                <Globe className="w-5 h-5 text-primary-500" /> Languages
              </h2>
              <div className="flex flex-wrap gap-2">
                {languages.map(l => (
                  <span key={l} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium capitalize">
                    {l}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-xl rounded-[1.75rem] p-6 shadow-[0_16px_60px_rgba(15,23,42,0.06)] border border-white/70">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-primary-500" /> Availability
              </h2>
              {availability?.length > 0 ? (
                <div className="space-y-3">
                  {availability.map(slot => (
                    <div key={slot.day} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="font-bold text-slate-700 capitalize">{slot.day.substring(0,3)}</span>
                      <span className="text-sm text-slate-600 font-medium">{slot.startTime} - {slot.endTime}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No fixed slots added.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Request Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[1.75rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                <h3 className="text-xl font-bold text-slate-900">Request Mentorship</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-full shadow-sm hover:shadow transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                <form id="requestForm" onSubmit={handleRequestSubmit} className="space-y-5">
                  
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Topic *</label>
                    <select 
                      value={topic} onChange={e => setTopic(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary-500 outline-none"
                    >
                      {MENTORSHIP_TOPICS.map(t => (
                        <option key={t} value={t}>{t.replace('-', ' ').toUpperCase()}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Message *</label>
                    <textarea 
                      value={message} onChange={e => setMessage(e.target.value)} required minLength={10} maxLength={1000}
                      placeholder="Explain what you need help with (min 10 chars)..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary-500 outline-none min-h-[120px]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Preferred Domain (Optional)</label>
                      <select 
                        value={preferredDomain} onChange={e => setPreferredDomain(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary-500 outline-none"
                      >
                        <option value="">Any Domain</option>
                        {domains.map(d => (
                          <option key={d} value={d}>{d.toUpperCase()}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Mode</label>
                      <select 
                        value={mode} onChange={e => setMode(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary-500 outline-none"
                      >
                        <option value="online">Online</option>
                        <option value="offline">Offline</option>
                      </select>
                    </div>
                  </div>

                </form>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50/50 shrink-0">
                <button 
                  type="submit" form="requestForm" disabled={requestMutation.isPending}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary-500/30 disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {requestMutation.isPending ? 'Sending...' : 'Send Request'}
                  {!requestMutation.isPending && <CheckCircle2 className="w-5 h-5" />}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
