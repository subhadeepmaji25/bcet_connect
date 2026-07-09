import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Calendar, CheckCircle2, XCircle, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { getReceivedRequests, acceptRequest, rejectRequest, scheduleSession } from '../../api/mentorship.api';
import Avatar from '../../components/ui/Avatar';

export default function ReceivedMentorRequestsPage() {
  const queryClient = useQueryClient();
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState(null);
  const [schedulingId, setSchedulingId] = useState(null);
  const [scheduleData, setScheduleData] = useState({
    scheduledAt: '',
    duration: 30,
    mode: 'online',
    meetingLink: '',
    notes: ''
  });

  const { data, isLoading } = useQuery({
    queryKey: ['receivedMentorRequests'],
    queryFn: async () => {
      const res = await getReceivedRequests();
      return res.data;
    }
  });

  const acceptMutation = useMutation({
    mutationFn: (id) => acceptRequest(id, {}),
    onSuccess: () => {
      toast.success('Request accepted');
      queryClient.invalidateQueries(['receivedMentorRequests']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to accept')
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => rejectRequest(id, { reason }),
    onSuccess: () => {
      toast.success('Request rejected');
      setRejectingId(null);
      setRejectReason('');
      queryClient.invalidateQueries(['receivedMentorRequests']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to reject')
  });

  const scheduleMutation = useMutation({
    mutationFn: (data) => scheduleSession(data),
    onSuccess: () => {
      toast.success('Session scheduled successfully');
      setSchedulingId(null);
      setScheduleData({ scheduledAt: '', duration: 30, mode: 'online', meetingLink: '', notes: '' });
      queryClient.invalidateQueries(['receivedMentorRequests']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to schedule')
  });

  if (isLoading) return <div className="min-h-screen bg-slate-50 p-8 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;

  const requests = data?.requests || [];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,91,255,0.10),_transparent_42%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-indigo-100 text-indigo-700 text-xs font-black uppercase tracking-[0.18em] shadow-sm mb-4">
            Mentor Inbox
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Received Requests</h1>
          <p className="text-slate-600 mt-2 max-w-2xl">Review incoming mentorship requests, accept promising conversations, and schedule sessions with clarity.</p>
        </div>

        {requests.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] p-16 text-center border border-white/70 shadow-[0_16px_60px_rgba(15,23,42,0.06)]">
            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900">No requests yet</h3>
            <p className="text-slate-500 mt-2">When students request your mentorship, they will appear here.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {requests.map(req => {
              // Fix: correct path nested in profileId
              const student = req.studentId?.profileId || {};
              const fullName = student.fullName || "Unknown Mentee";
              const avatar = student.avatar || "";
              
              return (
                <div key={req._id} className="bg-white/90 backdrop-blur-xl rounded-[1.75rem] p-6 border border-white/70 shadow-[0_16px_60px_rgba(15,23,42,0.06)] flex flex-col md:flex-row gap-6">
                  <div className="shrink-0">
                    <Avatar src={avatar} alt={fullName} size="lg" />
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{fullName}</h3>
                        <p className="text-sm font-medium text-slate-500 capitalize">Requested: {req.topic.replace('-', ' ')}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        req.status === 'pending' ? 'text-amber-600 bg-amber-50' :
                        req.status === 'accepted' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
                      }`}>
                        {req.status}
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-sm text-slate-700">{req.message}</p>
                    </div>

                    <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-500">
                      <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {new Date(req.createdAt).toLocaleDateString()}</div>
                      {req.mode && <div className="flex items-center gap-1.5 capitalize"><CheckCircle2 className="w-4 h-4" /> {req.mode}</div>}
                    </div>
                  </div>

                  {req.status === 'pending' && (
                    <div className="shrink-0 flex flex-col gap-3 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 min-w-[140px]">
                      {rejectingId === req._id ? (
                        <div className="flex flex-col gap-2">
                          <input 
                            type="text" placeholder="Reason (optional)" value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                            className="text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-red-500"
                          />
                          <button onClick={() => rejectMutation.mutate({ id: req._id, reason: rejectReason })} className="bg-red-500 text-white text-sm font-bold py-2 rounded-lg">Confirm Reject</button>
                          <button onClick={() => setRejectingId(null)} className="text-slate-500 text-sm font-bold py-1">Cancel</button>
                        </div>
                      ) : (
                        <>
                          <button 
                            onClick={() => acceptMutation.mutate(req._id)}
                            disabled={acceptMutation.isPending || rejectMutation.isPending}
                            className="bg-green-500 hover:bg-green-600 text-white text-sm font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Accept
                          </button>
                          <button 
                            onClick={() => setRejectingId(req._id)}
                            disabled={acceptMutation.isPending || rejectMutation.isPending}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                          >
                            <XCircle className="w-4 h-4" /> Reject
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {req.status === 'accepted' && (
                    <div className="shrink-0 flex flex-col gap-3 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 min-w-[160px]">
                      {schedulingId === req._id ? (
                        <div className="flex flex-col gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 w-full sm:w-[240px]">
                          <h4 className="text-sm font-bold text-slate-800">Schedule Session</h4>
                          <input 
                            type="datetime-local" 
                            value={scheduleData.scheduledAt} 
                            onChange={e => setScheduleData({...scheduleData, scheduledAt: e.target.value})}
                            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-primary-500 w-full"
                          />
                          <select 
                            value={scheduleData.duration} 
                            onChange={e => setScheduleData({...scheduleData, duration: Number(e.target.value)})}
                            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-primary-500 w-full"
                          >
                            <option value={30}>30 Minutes</option>
                            <option value={45}>45 Minutes</option>
                            <option value={60}>60 Minutes</option>
                          </select>
                          <select 
                            value={scheduleData.mode} 
                            onChange={e => setScheduleData({...scheduleData, mode: e.target.value})}
                            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-primary-500 w-full"
                          >
                            <option value="online">Online</option>
                            <option value="offline">Offline</option>
                          </select>
                          {scheduleData.mode === 'online' && (
                            <input 
                              type="url" 
                              placeholder="Meeting Link (e.g. Google Meet)" 
                              value={scheduleData.meetingLink} 
                              onChange={e => setScheduleData({...scheduleData, meetingLink: e.target.value})}
                              className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-primary-500 w-full"
                            />
                          )}
                          <div className="flex gap-2 pt-1">
                            <button 
                              onClick={() => setSchedulingId(null)} 
                              className="flex-1 text-slate-500 bg-slate-200 hover:bg-slate-300 text-xs font-bold py-2 rounded-lg transition-colors"
                            >
                              Cancel
                            </button>
                            <button 
                              onClick={() => scheduleMutation.mutate({ ...scheduleData, requestId: req._id })} 
                              disabled={scheduleMutation.isPending || !scheduleData.scheduledAt || (scheduleData.mode === 'online' && !scheduleData.meetingLink)}
                              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold py-2 rounded-lg transition-colors disabled:opacity-50"
                            >
                              Schedule
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button 
                          onClick={() => {
                            setSchedulingId(req._id);
                            setScheduleData({ scheduledAt: '', duration: 30, mode: req.mode || 'online', meetingLink: '', notes: '' });
                          }}
                          className="bg-primary-50 text-primary-700 hover:bg-primary-100 hover:text-primary-800 text-sm font-bold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 w-full"
                        >
                          <Calendar className="w-4 h-4" /> Schedule Session
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
