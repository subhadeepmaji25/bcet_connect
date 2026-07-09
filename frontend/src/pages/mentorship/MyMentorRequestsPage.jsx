import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Clock, CheckCircle2, XCircle, Calendar, MessageSquare, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { getMyRequests, cancelRequest } from '../../api/mentorship.api';
import Avatar from '../../components/ui/Avatar';

export default function MyMentorRequestsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['myMentorRequests'],
    queryFn: async () => {
      const res = await getMyRequests();
      return res.data;
    }
  });

  const cancelMutation = useMutation({
    mutationFn: cancelRequest,
    onSuccess: () => {
      toast.success('Request cancelled');
      queryClient.invalidateQueries(['myMentorRequests']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to cancel')
  });

  if (isLoading) return <div className="min-h-screen bg-slate-50 p-8 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;

  const requests = data?.requests || [];

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Mentorship Requests</h1>
          <p className="text-slate-500 mt-2">Track the status of requests you've sent to mentors.</p>
        </div>

        {requests.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-slate-100">
            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900">No requests sent</h3>
            <p className="text-slate-500 mt-2">Find a mentor and send a request to get started.</p>
            <Link to="/mentors" className="inline-block mt-6 px-6 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors">
              Find Mentors
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {requests.map(req => {
              // Fix: correct path nested in profileId
              const mentor = req.mentorId?.profileId || {};
              const fullName = mentor.fullName || "Unknown Mentor";
              const avatar = mentor.avatar || "";
              const statusColor = {
                pending: 'text-amber-600 bg-amber-50',
                accepted: 'text-green-600 bg-green-50',
                rejected: 'text-red-600 bg-red-50',
                cancelled: 'text-slate-600 bg-slate-100'
              }[req.status] || 'text-slate-600 bg-slate-100';

              return (
                <div key={req._id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6">
                  <div className="shrink-0">
                    <Avatar src={avatar} alt={fullName} size="lg" />
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{fullName}</h3>
                        <p className="text-sm font-medium text-slate-500 capitalize">{req.topic.replace('-', ' ')}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusColor}`}>
                        {req.status}
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-sm text-slate-700">{req.message}</p>
                    </div>

                    <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-500">
                      <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {new Date(req.createdAt).toLocaleDateString()}</div>
                      {req.preferredDomain && <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> {req.preferredDomain}</div>}
                    </div>
                  </div>

                  <div className="shrink-0 flex flex-col justify-between items-end gap-4 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                    <Link to={`/mentors/${req.mentorId?._id}`} className="text-sm font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1">
                      View Profile <ChevronRight className="w-4 h-4" />
                    </Link>
                    
                    {req.status === 'pending' && (
                      <button 
                        onClick={() => cancelMutation.mutate(req._id)}
                        disabled={cancelMutation.isPending}
                        className="text-sm font-bold text-red-500 hover:text-red-600 hover:bg-red-50 px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
                      >
                        Cancel Request
                      </button>
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
