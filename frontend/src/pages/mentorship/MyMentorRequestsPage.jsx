// src/pages/mentorship/MyMentorRequestsPage.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Clock, XCircle, GraduationCap, MessageSquare, Calendar, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getMyRequests, cancelRequest, getMySessions, cancelSession, createReview } from '../../api/mentorship.api';
import { startConversation } from '../../api/communication.api';
import { REQUEST_STATUS_COLORS, DOMAIN_LABELS } from '../../constants/appConstants';
import Avatar from '../../components/ui/Avatar';
import Modal from '../../components/ui/Modal';
import { normalizeUser } from '../../utils/normalize';
import { useAuth } from '../../hooks/useAuth';

export default function MyMentorRequestsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sessionRole, setSessionRole] = useState('all');
  const [reviewFor, setReviewFor] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, feedback: '', anonymous: false });
  const { data, isPending } = useQuery({ queryKey: ['my-mentor-requests'], queryFn: getMyRequests });
  const { data: sessionsData } = useQuery({ 
    queryKey: ['my-mentor-sessions', sessionRole], 
    queryFn: () => getMySessions({ limit: 10, as: sessionRole === 'all' ? undefined : sessionRole }) 
  });
  const requests = data?.data?.requests || [];
  const sessions = sessionsData?.data?.sessions || [];

  const msgMut = useMutation({
    mutationFn: (recipientId) => startConversation({ recipientId }),
    onSuccess: (res) => {
      const convId = res?.data?.conversation?._id || res?.data?._id;
      if (convId) navigate(`/chat/${convId}`);
    },
    onError: (e) => toast.error(e?.message || 'Failed to start chat'),
  });

  const cancelMut = useMutation({
    mutationFn: cancelRequest,
    onSuccess: () => { toast.success('Request cancelled'); qc.invalidateQueries(['my-mentor-requests']); },
    onError: (e) => toast.error(e?.message || 'Failed'),
  });

  const cancelSessionMut = useMutation({
    mutationFn: (sessionId) => cancelSession(sessionId, { reason: 'Cancelled by student' }),
    onSuccess: () => { toast.success('Session cancelled'); qc.invalidateQueries({ queryKey: ['my-mentor-sessions'] }); },
    onError: (e) => toast.error(e?.message || 'Failed to cancel session'),
  });

  const reviewMut = useMutation({
    mutationFn: () => createReview(reviewFor._id, {
      rating: Number(reviewForm.rating),
      feedback: reviewForm.feedback,
      anonymous: reviewForm.anonymous,
    }),
    onSuccess: () => {
      toast.success('Review submitted');
      setReviewFor(null);
      setReviewForm({ rating: 5, feedback: '', anonymous: false });
      qc.invalidateQueries({ queryKey: ['my-mentor-sessions'] });
    },
    onError: (e) => toast.error(e?.message || 'Failed to submit review'),
  });

  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-slate-100 flex items-center gap-2">
        <Clock className="w-6 h-6 text-primary-400" /> My Mentorship Requests
      </h1>

      {sessions.length > 0 && (
        <div className="glass-card p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h2 className="section-title flex items-center gap-2 m-0"><Calendar className="w-4 h-4" /> My Sessions</h2>
            {user?.role === 'alumni' && (
              <div className="flex bg-white/5 rounded-lg p-1 border border-white/10 w-fit">
                {['all', 'student', 'mentor'].map(role => (
                  <button 
                    key={role} 
                    onClick={() => setSessionRole(role)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md capitalize transition-colors ${sessionRole === role ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    {role === 'all' ? 'All' : `As ${role}`}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-3">
            {sessions.map((session) => {
              if (!session) return null;
              const mentor = normalizeUser(session.mentorId);
              const starts = new Date(session.scheduledAt);
              return (
                <div key={session._id} className="rounded-2xl border border-white/8 bg-white/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-100 text-sm">{session.topic}</p>
                    <p className="text-xs text-slate-400">
                      {starts.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })} · {session.duration} min · {mentor?.fullName || mentor?.username || 'Mentor'}
                    </p>
                    <span className={`mt-2 inline-flex badge ${session.status === 'completed' ? 'badge-success' : session.status === 'cancelled' ? 'badge-danger' : 'badge-info'}`}>
                      {session.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {session.status === 'scheduled' && session.meetingLink && (
                      <a href={session.meetingLink} target="_blank" rel="noreferrer" className="btn-primary text-xs py-2 px-3">Join</a>
                    )}
                    {session.status === 'scheduled' && (
                      <button
                        onClick={() => { if (window.confirm('Cancel this session?')) cancelSessionMut.mutate(session._id); }}
                        className="btn-ghost text-xs py-2 px-3 hover:text-red-400"
                      >
                        Cancel
                      </button>
                    )}
                    {session.status === 'completed' && (
                      <button onClick={() => setReviewFor(session)} className="btn-primary text-xs py-2 px-3 flex items-center gap-1">
                        <Star className="w-3.5 h-3.5" /> Review
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isPending ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="glass-card p-4 skeleton h-20" />)}</div>
      ) : requests.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <GraduationCap className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-slate-300 font-semibold">No requests sent</h3>
          <p className="text-slate-500 text-sm mb-4">Find a mentor and request a session!</p>
          <Link to="/mentors" className="btn-primary">Browse Mentors</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => {
            if (!req) return null;
            const mentor = normalizeUser(req.mentorId);
            return (
            <div key={req._id} className="glass-card p-5 hover:border-white/15 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <Avatar src={mentor?.avatar} name={mentor?.fullName || mentor?.username || 'Mentor'} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className={`badge ${REQUEST_STATUS_COLORS[req.status] || 'badge-neutral'}`}>{req.status}</span>
                    </div>
                    <p className="font-semibold text-slate-100 text-sm">{req.topic}</p>
                    <p className="text-slate-400 text-xs">To: {mentor?.fullName || mentor?.username || 'Mentor'}</p>
                    {req.preferredDomain && (
                      <p className="text-slate-500 text-xs mt-0.5">Domain: {DOMAIN_LABELS[req.preferredDomain] || req.preferredDomain}</p>
                    )}
                    <p className="text-xs text-slate-600 mt-1">{new Date(req.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {req.status === 'pending' && (
                  <button
                    onClick={() => { if (window.confirm('Cancel this request?')) cancelMut.mutate(req._id); }}
                    disabled={cancelMut.isPending}
                    className="btn-ghost text-xs py-1.5 px-3 hover:text-red-400 flex items-center gap-1 flex-shrink-0"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Cancel
                  </button>
                )}
              </div>
              {req.message && (
                <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-white/8 italic line-clamp-2">"{req.message}"</p>
              )}
              {req.status === 'accepted' && (
                <div className="mt-4 pt-4 border-t border-white/8">
                  <button
                    onClick={() => msgMut.mutate(req.mentorId?._id || req.mentorId)}
                    disabled={msgMut.isPending}
                    className="btn-primary w-full flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-[0_0_15px_rgba(14,165,233,0.4)]"
                  >
                    <MessageSquare className="w-4 h-4" />
                    {msgMut.isPending ? 'Starting Chat...' : 'Message Mentor'}
                  </button>
                </div>
              )}
            </div>
          )})}
        </div>
      )}

      <Modal
        open={!!reviewFor}
        onClose={() => setReviewFor(null)}
        title="Review mentorship session"
        footer={
          <>
            <button type="button" onClick={() => setReviewFor(null)} className="btn-ghost">Cancel</button>
            <button type="button" disabled={reviewMut.isPending} onClick={() => reviewMut.mutate()} className="btn-primary">
              {reviewMut.isPending ? 'Submitting...' : 'Submit Review'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Rating</label>
            <select className="input-field" value={reviewForm.rating} onChange={(e) => setReviewForm((f) => ({ ...f, rating: e.target.value }))}>
              {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} stars</option>)}
            </select>
          </div>
          <div>
            <label className="label">Feedback</label>
            <textarea
              rows={4}
              className="input-field resize-none"
              placeholder="What helped you most?"
              value={reviewForm.feedback}
              onChange={(e) => setReviewForm((f) => ({ ...f, feedback: e.target.value }))}
            />
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
            <input
              type="checkbox"
              checked={reviewForm.anonymous}
              onChange={(e) => setReviewForm((f) => ({ ...f, anonymous: e.target.checked }))}
            />
            Post anonymously
          </label>
        </div>
      </Modal>
    </div>
  );
}
