import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Video, Star, CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { getMySessions, cancelSession, createReview, completeSession } from '../../api/mentorship.api';
import { useAuth } from '../../hooks/useAuth';
import Avatar from '../../components/ui/Avatar';

export default function MentorSessionsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [reviewingId, setReviewingId] = useState(null);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['mySessions'],
    queryFn: async () => {
      const res = await getMySessions();
      return res.data;
    }
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }) => cancelSession(id, { reason }),
    onSuccess: () => {
      toast.success('Session cancelled');
      setCancellingId(null);
      setCancelReason('');
      queryClient.invalidateQueries(['mySessions']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to cancel')
  });
  
  const completeMutation = useMutation({
    mutationFn: (id) => completeSession(id),
    onSuccess: () => {
      toast.success('Session marked as completed');
      queryClient.invalidateQueries(['mySessions']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to complete')
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, rating, review }) => createReview(id, { rating, review }),
    onSuccess: () => {
      toast.success('Review submitted successfully!');
      setReviewingId(null);
      setRating(5);
      setReviewText('');
      queryClient.invalidateQueries(['mySessions']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to submit review')
  });

  if (isLoading) return <div className="min-h-screen bg-slate-50 p-8 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;

  const sessions = data?.sessions || [];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,91,255,0.10),_transparent_42%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-indigo-100 text-indigo-700 text-xs font-black uppercase tracking-[0.18em] shadow-sm mb-4">
            Session Hub
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Mentorship Sessions</h1>
          <p className="text-slate-600 mt-2 max-w-2xl">Manage your scheduled, live, and completed sessions from one focused, professional workspace.</p>
        </div>

        {sessions.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] p-16 text-center border border-white/70 shadow-[0_16px_60px_rgba(15,23,42,0.06)]">
            <Video className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900">No sessions found</h3>
            <p className="text-slate-500 mt-2">You don't have any sessions scheduled yet.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {sessions.map(session => {
              const isMentor = session.mentorId?._id === user?._id || session.mentorId?.profileId?.userId === user?._id;
              const otherUser = isMentor ? session.studentId : session.mentorId;
              const profile = otherUser?.profileId || {};
              const fullName = profile.fullName || "Unknown";
              const avatar = profile.avatar || "";
              const phaseLabel = session.phase === 'live' ? 'Live now' : session.phase === 'upcoming' ? 'Upcoming' : session.phase === 'ended' ? 'Ended' : session.phase || session.status;

              return (
                <div key={session._id} className="bg-white/90 backdrop-blur-xl rounded-[1.75rem] p-6 border border-white/70 shadow-[0_16px_60px_rgba(15,23,42,0.06)] flex flex-col md:flex-row gap-6">
                  <div className="shrink-0 flex flex-col items-center gap-2">
                    <Avatar src={avatar} alt={fullName} size="lg" />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{isMentor ? 'Mentee' : 'Mentor'}</span>
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{fullName}</h3>
                        <div className="flex items-center gap-4 mt-2 text-sm font-bold text-slate-600">
                          <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {new Date(session.scheduledAt).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {new Date(session.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        session.status === 'scheduled' ? 'text-blue-600 bg-blue-50' :
                        session.status === 'live' ? 'text-green-600 bg-green-50 animate-pulse' :
                        session.status === 'completed' ? 'text-slate-600 bg-slate-100' : 'text-red-600 bg-red-50'
                      }`}>
                        {phaseLabel}
                      </div>
                    </div>

                    {session.meetingLink && (session.status === 'scheduled' || session.status === 'live') && (
                      <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-blue-700 font-medium text-sm">
                          <Video className="w-4 h-4" /> Meeting Link Ready
                        </div>
                        <a href={session.meetingLink} target="_blank" rel="noreferrer" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm">
                          Join Meeting
                        </a>
                      </div>
                    )}
                    
                    {!isMentor && session.status === 'completed' && !session.isReviewed && (
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        {reviewingId === session._id ? (
                          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
                            <h4 className="font-bold text-slate-800 text-sm">Leave a Review for your Mentor</h4>
                            <div className="flex gap-2">
                              {[1, 2, 3, 4, 5].map(star => (
                                <button key={star} onClick={() => setRating(star)} className="focus:outline-none">
                                  <Star className={`w-6 h-6 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                                </button>
                              ))}
                            </div>
                            <textarea
                              value={reviewText} onChange={e => setReviewText(e.target.value)}
                              placeholder="How was the session? Was it helpful?"
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary-500 outline-none min-h-[80px]"
                            />
                            <div className="flex gap-3">
                              <button onClick={() => reviewMutation.mutate({ id: session._id, rating, review: reviewText })} className="bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary-700">Submit Review</button>
                              <button onClick={() => setReviewingId(null)} className="text-slate-500 font-bold text-sm px-4 py-2 hover:bg-slate-100 rounded-xl">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => setReviewingId(session._id)} className="flex items-center gap-2 text-amber-600 font-bold hover:text-amber-700 bg-amber-50 px-4 py-2 rounded-xl text-sm transition-colors w-fit">
                            <Star className="w-4 h-4" /> Write a Review
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 flex flex-col gap-3 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 min-w-[160px] justify-start items-end">
                    {/* Mentor can complete a live/scheduled session manually */}
                    {isMentor && (session.status === 'scheduled' || session.status === 'live') && (
                       <button onClick={() => completeMutation.mutate(session._id)} className="flex items-center gap-2 text-sm font-bold text-green-600 hover:text-green-700 bg-green-50 px-4 py-2 rounded-xl transition-colors w-full justify-center">
                         <CheckCircle2 className="w-4 h-4" /> Mark Complete
                       </button>
                    )}

                    {(session.status === 'scheduled' || session.status === 'live') && (
                      cancellingId === session._id ? (
                        <div className="flex flex-col gap-2 w-full">
                          <input 
                            type="text" placeholder="Reason..." value={cancelReason} onChange={e => setCancelReason(e.target.value)}
                            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-red-500"
                          />
                          <button onClick={() => cancelMutation.mutate({ id: session._id, reason: cancelReason })} className="bg-red-500 text-white text-xs font-bold py-1.5 rounded-lg w-full">Confirm Cancel</button>
                          <button onClick={() => setCancellingId(null)} className="text-slate-500 text-xs font-bold py-1 w-full hover:bg-slate-50 rounded-lg">Abort</button>
                        </div>
                      ) : (
                        <button onClick={() => setCancellingId(session._id)} className="flex items-center gap-2 text-sm font-bold text-red-500 hover:text-red-600 hover:bg-red-50 px-4 py-2 rounded-xl transition-colors w-full justify-center">
                          <XCircle className="w-4 h-4" /> Cancel Session
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
