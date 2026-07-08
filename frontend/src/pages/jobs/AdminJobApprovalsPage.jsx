// src/pages/jobs/AdminJobApprovalsPage.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, CheckCircle, XCircle, Eye, Building2, Users, Star, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { getPendingJobs, approveJob, rejectJob, featureJob, verifyCompany } from '../../api/jobs.api';

export default function AdminJobApprovalsPage() {
  const qc = useQueryClient();
  const { data, isPending } = useQuery({ queryKey: ['pending-jobs'], queryFn: getPendingJobs });
  const jobs = data?.data?.jobs || [];
  const [rejectingId, setRejectingId] = useState(null);
  const [reason, setReason] = useState('');

  const approveMut = useMutation({
    mutationFn: approveJob,
    onSuccess: () => { toast.success('Job approved!'); qc.invalidateQueries(['pending-jobs']); },
    onError: (e) => toast.error(e?.message || 'Failed'),
  });
  const rejectMut = useMutation({
    mutationFn: ({ id, reason }) => rejectJob(id, { rejectionReason: reason }),
    onSuccess: () => { toast.success('Job rejected'); setRejectingId(null); setReason(''); qc.invalidateQueries(['pending-jobs']); },
    onError: (e) => toast.error(e?.message || 'Failed'),
  });
  
  const featureMut = useMutation({
    mutationFn: (id) => featureJob(id, { featured: true }),
    onSuccess: () => { toast.success('Job featured!'); qc.invalidateQueries(['pending-jobs']); },
    onError: (e) => toast.error(e?.message || 'Failed'),
  });

  const verifyMut = useMutation({
    mutationFn: (id) => verifyCompany(id),
    onSuccess: () => { toast.success('Company verified!'); qc.invalidateQueries(['pending-jobs']); },
    onError: (e) => toast.error(e?.message || 'Failed'),
  });

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
          <Clock className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-100">Pending Job Approvals</h1>
          <p className="text-slate-400 text-sm">{jobs.length} job{jobs.length !== 1 ? 's' : ''} awaiting review</p>
        </div>
      </div>

      {isPending ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="glass-card p-5 skeleton h-24" />)}</div>
      ) : jobs.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <h3 className="text-slate-300 font-semibold">All clear!</h3>
          <p className="text-slate-500 text-sm">No pending jobs to review.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map(job => (
            <div key={job._id} className="glass-card p-5 border-l-2 border-amber-500/50">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-100 text-base">{job.title}</h3>
                  <div className="flex items-center gap-2 text-slate-400 text-sm mt-0.5">
                    <Building2 className="w-3.5 h-3.5" /> {job.company}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2 text-xs text-slate-500">
                    <span>Posted by: <span className="text-slate-300">@{job.postedBy?.username || 'unknown'}</span></span>
                    <span>•</span>
                    <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {job.requiredSkills?.length} skills required</span>
                  </div>
                  <p className="text-slate-400 text-xs mt-2 line-clamp-2">{job.description}</p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link to={`/jobs/${job._id}`} className="btn-ghost p-2" title="View full details">
                    <Eye className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => approveMut.mutate(job._id)}
                    disabled={approveMut.isPending}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all active:scale-95 disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" /> Approve
                  </button>
                  <button
                    onClick={() => { setRejectingId(job._id); setReason(''); }}
                    className="btn-danger flex items-center gap-1.5 text-sm"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                  <div className="flex flex-col gap-1 border-l border-slate-700 pl-2 ml-2">
                    {!job.metadata?.featured && (
                      <button
                        onClick={() => featureMut.mutate(job._id)}
                        disabled={featureMut.isPending}
                        className="btn-ghost flex items-center gap-1 text-[11px] py-1 px-2 text-amber-400 hover:text-amber-300 border border-amber-500/30"
                      >
                        <Star className="w-3 h-3" /> Feature
                      </button>
                    )}
                    {!job.metadata?.verifiedCompany && (
                      <button
                        onClick={() => verifyMut.mutate(job._id)}
                        disabled={verifyMut.isPending}
                        className="btn-ghost flex items-center gap-1 text-[11px] py-1 px-2 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30"
                      >
                        <ShieldCheck className="w-3 h-3" /> Verify
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Reject form */}
              {rejectingId === job._id && (
                <div className="mt-4 pt-4 border-t border-red-500/20 animate-fade-in">
                  <label className="label text-red-400">Rejection Reason (required)</label>
                  <textarea
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    rows={2}
                    placeholder="Explain why this job is being rejected..."
                    className="input-field resize-none mb-3"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => rejectMut.mutate({ id: job._id, reason })}
                      disabled={reason.trim().length < 5 || rejectMut.isPending}
                      className="btn-danger text-sm flex items-center gap-1.5"
                    >
                      {rejectMut.isPending ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <XCircle className="w-4 h-4" />}
                      Confirm Reject
                    </button>
                    <button onClick={() => setRejectingId(null)} className="btn-ghost text-sm">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
