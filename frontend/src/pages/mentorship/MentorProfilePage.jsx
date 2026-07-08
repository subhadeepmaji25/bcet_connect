import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Star, ShieldCheck, Send, Clock, Globe,
  MessageSquare, Briefcase, GraduationCap, MapPin,
  CheckCircle2, AlertCircle, ChevronRight, Users, Eye, Award
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getPublicMentorProfile, sendMentorshipRequest, getMentorReviews, getMySessions, createReview } from '../../api/mentorship.api';
import { startConversation } from '../../api/communication.api';
import { useAuth } from '../../hooks/useAuth';
import Avatar from '../../components/ui/Avatar';
import Modal from '../../components/ui/Modal';
import { DOMAIN_LABELS, MEETING_MODES, SESSION_DURATIONS } from '../../constants/appConstants';

// ─── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ value, label, icon: Icon, color = 'indigo' }) {
  const colors = {
    indigo: 'from-indigo-50 to-indigo-100/50 text-indigo-600 border-indigo-100',
    emerald: 'from-emerald-50 to-emerald-100/50 text-emerald-600 border-emerald-100',
    amber: 'from-amber-50 to-amber-100/50 text-amber-600 border-amber-100',
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-4 text-center shadow-sm`}>
      <Icon className={`w-5 h-5 mx-auto mb-2 opacity-70`} />
      <p className="text-2xl font-black text-slate-900">{value ?? 0}</p>
      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mt-1">{label}</p>
    </div>
  );
}

// ─── Section Card ──────────────────────────────────────────────────────────────
function Section({ icon: Icon, title, iconColor = 'text-indigo-500', action, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-bold text-slate-900 flex items-center gap-2.5 text-[15px]">
          <span className={`${iconColor} bg-slate-50 p-1.5 rounded-lg border border-slate-100`}>
            <Icon className="w-4 h-4" />
          </span>
          {title}
        </h2>
        {action}
      </div>
      {children}
    </motion.div>
  );
}

export default function MentorProfilePage() {
  const { mentorId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showRequest, setShowRequest] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, feedback: '', anonymous: false });
  const [selectedSessionId, setSelectedSessionId] = useState(null);

  // mentorId is the User's _id
  const { data, isPending } = useQuery({
    queryKey: ['mentor-profile', mentorId],
    queryFn: () => getPublicMentorProfile(mentorId),
  });
  const { data: reviewsData } = useQuery({
    queryKey: ['mentor-reviews', mentorId],
    queryFn: () => getMentorReviews(mentorId, { limit: 5 }),
    enabled: !!mentorId,
  });
  const { data: sessionsData } = useQuery({
    queryKey: ['my-sessions-for-review', mentorId],
    queryFn: () => getMySessions({ limit: 50 }),
    enabled: !!user,
  });

  const completedSessions = sessionsData?.data?.sessions?.filter(s => {
    const sMentorId = s.mentorId?._id || s.mentorId;
    return sMentorId === mentorId && s.status === 'completed';
  }) || [];

  const handleWriteReview = () => {
    if (completedSessions.length === 0) {
      toast.error('You need a completed session with this mentor to write a review.');
      return;
    }
    setSelectedSessionId(completedSessions[0]._id);
    setShowReview(true);
  };

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: { mode: 'online', duration: 60 }
  });

  const requestMut = useMutation({
    mutationFn: (d) => sendMentorshipRequest({ ...d, mentorId }),
    onSuccess: () => {
      toast.success('Mentorship request sent! 🎉');
      setShowRequest(false);
      reset();
      qc.invalidateQueries(['mentor-profile', mentorId]);
      qc.invalidateQueries(['my-mentor-requests']);
    },
    onError: (e) => toast.error(e?.message || 'Failed to send request'),
  });

  const msgMut = useMutation({
    mutationFn: (recipientId) => startConversation({ recipientId }),
    onSuccess: (res) => {
      const convId = res?.data?.conversation?._id || res?.data?._id;
      if (convId) navigate(`/chat/${convId}`);
    },
    onError: (e) => toast.error(e?.message || 'Failed to start chat'),
  });

  const reviewMut = useMutation({
    mutationFn: (d) => createReview(selectedSessionId, d),
    onSuccess: () => {
      toast.success('Review submitted successfully!');
      setShowReview(false);
      setReviewForm({ rating: 5, feedback: '', anonymous: false });
      qc.invalidateQueries(['mentor-reviews', mentorId]);
      qc.invalidateQueries(['mentor-profile', mentorId]);
    },
    onError: (e) => toast.error(e?.message || 'Failed to submit review'),
  });

  if (isPending) {
    return (
      <div className="max-w-4xl mx-auto pb-16 animate-pulse">
        <div className="h-48 bg-slate-200 rounded-b-3xl" />
        <div className="px-8 -mt-16 mb-8 flex gap-6">
          <div className="w-32 h-32 rounded-3xl bg-slate-300 border-4 border-white" />
          <div className="pt-16 flex-1 space-y-3"><div className="h-6 w-48 bg-slate-200 rounded" /><div className="h-4 w-32 bg-slate-200 rounded" /></div>
        </div>
        <div className="px-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4"><div className="h-40 bg-slate-100 rounded-2xl" /><div className="h-32 bg-slate-100 rounded-2xl" /></div>
          <div className="h-64 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  // Extract from the fixed backend payload
  const profileData = data?.data || {};
  const mentorProfile = profileData.mentorProfile || {};
  const publicProfile = profileData.publicProfile || {};
  const requestStatus = profileData.requestStatus;

  // Single source of truth mapping
  const mentorName = publicProfile.fullName || mentorProfile.userId?.username || 'Mentor';
  const mentorAvatar = publicProfile.avatar || '';
  const headline = publicProfile.headline || mentorProfile.designation || '';
  const company = publicProfile.currentCompany || mentorProfile.company || '';
  const role = mentorProfile.userId?.role || 'alumni';

  const isVerified = mentorProfile.verificationStatus === 'verified';
  const rating = mentorProfile.rating || 0;
  const reviewCount = mentorProfile.reviewCount || 0;
  const domains = mentorProfile.domains || [];
  const reviews = reviewsData?.data?.reviews || [];

  const canRequest = ['student', 'alumni'].includes(user?.role) && isVerified && mentorProfile.mentorStatus === 'active' && mentorProfile.profileVisibility === 'public';
  
  // Safe string comparisons for auth
  const myIdStr = user?.userId?.toString() || user?._id?.toString() || user?.id?.toString();
  const isOwnProfile = myIdStr && myIdStr === mentorId;

  return (
    <div className="min-h-screen bg-[#F7F8FA] pb-16">
      <div className="max-w-4xl mx-auto">
        
        {/* ── Cover & Header ────────────────────────────────────────────── */}
        <div className="relative h-48 rounded-b-3xl overflow-hidden bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.04%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-100" />
          <button onClick={() => navigate(-1)} className="absolute top-4 left-4 p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-md transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 sm:px-8">
          <div className="flex flex-col md:flex-row gap-6 -mt-16 mb-8 items-start md:items-end">
            <div className="relative">
              <Avatar src={mentorAvatar} name={mentorName} size="3xl" className="w-32 h-32 rounded-3xl border-4 border-white shadow-xl bg-white" />
              <div className="absolute -bottom-2 -right-2 bg-amber-400 p-1.5 rounded-xl border-2 border-white shadow-lg">
                <Star className="w-4 h-4 text-white fill-white" />
              </div>
            </div>

            <div className="flex-1 min-w-0 pt-16 md:pt-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-none">{mentorName}</h1>
                {isVerified && <ShieldCheck className="w-6 h-6 text-emerald-500 flex-shrink-0" />}
              </div>
              
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm font-medium">
                {headline && <p className="text-indigo-600 font-bold">{headline}</p>}
                {company && <span className="flex items-center gap-1 text-slate-500"><Briefcase className="w-4 h-4" /> {company}</span>}
                {publicProfile.location && <span className="flex items-center gap-1 text-slate-500"><MapPin className="w-4 h-4" /> {publicProfile.location}</span>}
              </div>

              {rating > 0 && (
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span className="text-amber-700 font-bold text-sm">{Number(rating || 0).toFixed(1)}</span>
                  </div>
                  <span className="text-slate-500 text-sm font-medium">{reviewCount} reviews</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 w-full md:w-auto pt-4 md:pt-0">
              {isOwnProfile ? (
                <button onClick={() => navigate('/profile')} className="px-6 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-xl shadow-sm hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                  <Briefcase className="w-4 h-4" /> Edit My Profile
                </button>
              ) : canRequest ? (
                <>
                  {requestStatus === 'accepted' ? (
                    <button onClick={() => msgMut.mutate(mentorId)} disabled={msgMut.isPending} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-500/20 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                      <MessageSquare className="w-4 h-4" /> {msgMut.isPending ? 'Starting Chat...' : 'Message Mentor'}
                    </button>
                  ) : (
                    <button onClick={() => setShowRequest(true)} disabled={requestStatus === 'pending'} className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                      {requestStatus === 'pending' ? <CheckCircle2 className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                      {requestStatus === 'pending' ? 'Request Pending' : 'Request Session'}
                    </button>
                  )}
                </>
              ) : (
                <div className="px-4 py-2 bg-slate-100 rounded-lg text-xs font-semibold text-slate-500 flex items-center gap-1.5 border border-slate-200">
                  <AlertCircle className="w-3.5 h-3.5" /> 
                  {!isVerified ? 'This mentor is not verified yet' : mentorProfile.mentorStatus !== 'active' ? 'Not Accepting Requests' : mentorProfile.profileVisibility !== 'public' ? 'Private Profile' : 'Student/Alumni Only'}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* ── Left Column ── */}
            <div className="md:col-span-2 space-y-6">
              <Section icon={Star} title="About Mentor" iconColor="text-amber-500">
                {mentorProfile.bio ? (
                  <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{mentorProfile.bio}</p>
                ) : (
                  <p className="text-slate-400 text-sm italic">This mentor hasn't added a bio yet.</p>
                )}
              </Section>

              <Section icon={Award} title="Expertise Areas" iconColor="text-emerald-500">
                {domains.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {domains.map(d => (
                      <span key={d} className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 text-emerald-800 text-sm font-bold capitalize hover:border-emerald-300 transition-colors">
                        {DOMAIN_LABELS[d] || d}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm italic">No expertise domains listed.</p>
                )}
              </Section>

              <Section icon={Clock} title="Availability Slots" iconColor="text-indigo-500">
                {mentorProfile.availability?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {mentorProfile.availability.map(slot => (
                      <span key={slot?.day || slot} className="px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-lg text-sm font-semibold capitalize">
                        {slot?.day ? `${slot.day} (${slot.startTime} - ${slot.endTime})` : slot}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm italic">No availability slots configured.</p>
                )}
              </Section>

              {reviews.length > 0 ? (
                <Section 
                  icon={Star} 
                  title="Recent Reviews" 
                  iconColor="text-amber-500"
                  action={
                    ['student', 'alumni'].includes(user?.role) && (
                      <button onClick={handleWriteReview} className="text-sm font-semibold text-[#635BFF] hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors">
                        Write Review
                      </button>
                    )
                  }
                >
                  <div className="space-y-4">
                    {reviews.map((review) => {
                      if (!review) return null;
                      return (
                      <div key={review._id} className="border-b border-slate-100 last:border-0 pb-4 last:pb-0">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-bold text-slate-800">
                            {review.anonymous ? 'Anonymous student' : review.studentId?.username || 'Student'}
                          </p>
                          <span className="flex items-center gap-1 text-amber-600 text-xs font-black bg-amber-50 border border-amber-100 px-2 py-1 rounded-lg">
                            <Star className="w-3.5 h-3.5 fill-amber-500" /> {review.rating}
                          </span>
                        </div>
                        {review.feedback && (
                          <p className="mt-2 text-sm text-slate-600 leading-relaxed">{review.feedback}</p>
                        )}
                      </div>
                    )})}
                  </div>
                </Section>
              ) : (
                <Section 
                  icon={Star} 
                  title="Recent Reviews" 
                  iconColor="text-amber-500"
                  action={
                    ['student', 'alumni'].includes(user?.role) && (
                      <button onClick={handleWriteReview} className="text-sm font-semibold text-[#635BFF] hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors">
                        Write Review
                      </button>
                    )
                  }
                >
                  <div className="py-6 flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                      <MessageSquare className="w-5 h-5 text-slate-300" />
                    </div>
                    <p className="text-sm font-medium text-slate-900 mb-1">No reviews yet</p>
                    <p className="text-xs text-slate-500 max-w-[200px]">This mentor hasn't received any reviews yet.</p>
                  </div>
                </Section>
              )}
            </div>

            {/* ── Right Column ── */}
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3">
                <StatCard value={mentorProfile.totalSessions || 0} label="Sessions" icon={Users} color="indigo" />
                <StatCard value={mentorProfile.yearsExperience ? `${mentorProfile.yearsExperience}+` : '0'} label="Years Exp" icon={Briefcase} color="amber" />
              </div>

              <Section icon={Globe} title="Languages" iconColor="text-blue-500">
                {mentorProfile.languages?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {mentorProfile.languages.map(l => (
                      <span key={l} className="px-3 py-1 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium capitalize">
                        {l}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm italic">Not specified</p>
                )}
              </Section>
            </div>
          </div>
        </div>
      </div>

      {/* ── Request Session Modal ── */}
      <AnimatePresence>
        {showRequest && (
          <Modal open={true} onClose={() => setShowRequest(false)} title="Request Mentorship Session"
            footer={
              <>
                <button type="button" onClick={() => setShowRequest(false)} className="px-4 py-2 font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                <button form="mentorship-request-form" type="submit" disabled={requestMut.isPending} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-md shadow-indigo-500/20 disabled:opacity-70">
                  {requestMut.isPending ? 'Sending...' : <><Send className="w-4 h-4" /> Send Request</>}
                </button>
              </>
            }
          >
            <form id="mentorship-request-form" onSubmit={handleSubmit(d => requestMut.mutate({ ...d, duration: Number(d.duration) }))} className="space-y-4 pt-2">
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex items-start gap-3 mb-2">
                <AlertCircle className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                <p className="text-[13px] text-indigo-800 font-medium leading-relaxed">
                  Provide a clear topic and message. The mentor will review your request before accepting.
                </p>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1">Topic *</label>
                <input type="text" placeholder="e.g. Guidance on applying for SDE roles"
                  className={`w-full bg-slate-50 border ${errors.topic ? 'border-red-300 ring-4 ring-red-500/10' : 'border-slate-200'} rounded-xl px-4 py-2.5 text-[15px] font-medium outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all`}
                  {...register('topic', { required: 'Topic is required', minLength: { value: 5, message: 'Minimum 5 characters' } })}
                />
                {errors.topic && <p className="text-red-500 text-xs font-bold mt-1">{errors.topic.message}</p>}
              </div>

              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1">Message *</label>
                <textarea rows={4} placeholder="Introduce yourself and explain what you hope to learn..."
                  className={`w-full resize-none bg-slate-50 border ${errors.message ? 'border-red-300 ring-4 ring-red-500/10' : 'border-slate-200'} rounded-xl px-4 py-2.5 text-[15px] font-medium outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all`}
                  {...register('message', { required: 'Message is required', minLength: { value: 10, message: 'Minimum 10 characters' } })}
                />
                {errors.message && <p className="text-red-500 text-xs font-bold mt-1">{errors.message.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-1">Domain</label>
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:bg-white focus:border-indigo-500 transition-all" {...register('preferredDomain')}>
                    <option value="">Any domain</option>
                    {domains.map(d => <option key={d} value={d}>{DOMAIN_LABELS[d] || d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-1">Mode</label>
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:bg-white focus:border-indigo-500 transition-all capitalize" {...register('mode')}>
                    {MEETING_MODES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1">Session Duration</label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:bg-white focus:border-indigo-500 transition-all" {...register('duration')}>
                  {SESSION_DURATIONS.map(d => <option key={d} value={d}>{d} minutes</option>)}
                </select>
              </div>
            </form>
          </Modal>
        )}

        {/* Review Modal */}
        {showReview && (
          <Modal
            open={showReview}
            onClose={() => setShowReview(false)}
            title="Write a Review"
          >
            <div className="p-6">
              <div className="mb-6 flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 ${reviewForm.rating >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                    />
                  </button>
                ))}
              </div>
              
              <div className="mb-5">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Your Feedback</label>
                <textarea
                  value={reviewForm.feedback}
                  onChange={(e) => setReviewForm({ ...reviewForm, feedback: e.target.value })}
                  placeholder="How was your session? What did you learn?"
                  className="input-field min-h-[100px] resize-none"
                />
              </div>
              
              <label className="flex items-center gap-2 mb-6 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reviewForm.anonymous}
                  onChange={(e) => setReviewForm({ ...reviewForm, anonymous: e.target.checked })}
                  className="rounded border-slate-300 text-[#635BFF] focus:ring-[#635BFF]"
                />
                <span className="text-sm text-slate-600 font-medium">Post this review anonymously</span>
              </label>
              
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setShowReview(false)} 
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => reviewMut.mutate(reviewForm)}
                  disabled={reviewMut.isPending}
                  className="px-5 py-2.5 rounded-xl bg-[#635BFF] hover:bg-[#524be3] text-white font-semibold flex items-center justify-center min-w-[120px] transition-all disabled:opacity-70 text-sm shadow-[0_4px_14px_0_rgba(99,91,255,0.39)]"
                >
                  {reviewMut.isPending ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </div>
          </Modal>
        )}

      </AnimatePresence>
    </div>
  );
}
