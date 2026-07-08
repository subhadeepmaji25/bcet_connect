// src/pages/jobs/MyApplicationsPage.jsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Briefcase, Calendar, XCircle, ExternalLink,
  CheckCircle2, Clock, AlertCircle, TrendingUp, MapPin
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getMyApplications, withdrawApplication } from '../../api/jobs.api';

// Backend returns: { ...applicationDoc, jobId: { title, company, employmentType, status, deadline } }
// NOTE: the populated field key is "jobId" not "job"

const STATUS_MAP = {
  applied:     { cls: 'bg-slate-100 text-slate-600 border-slate-200',     icon: Clock,         label: 'Applied' },
  shortlisted: { cls: 'bg-blue-50 text-blue-700 border-blue-100',         icon: TrendingUp,    label: 'Shortlisted 🚀' },
  accepted:    { cls: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: CheckCircle2,  label: 'Accepted 🎉' },
  rejected:    { cls: 'bg-red-50 text-red-600 border-red-100',            icon: AlertCircle,   label: 'Rejected' },
  withdrawn:   { cls: 'bg-slate-100 text-slate-500 border-slate-200',     icon: XCircle,       label: 'Withdrawn' },
};

const JOB_STATUS_COLORS = {
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  closed:   'bg-slate-100 text-slate-600 border-slate-200',
  expired:  'bg-orange-50 text-orange-600 border-orange-100',
};

export default function MyApplicationsPage() {
  const qc = useQueryClient();

  const { data, isPending } = useQuery({
    queryKey: ['my-applications'],
    queryFn: () => getMyApplications(),
  });

  const withdrawMut = useMutation({
    mutationFn: withdrawApplication,
    onSuccess: () => { toast.success('Application withdrawn'); qc.invalidateQueries({ queryKey: ['my-applications'] }); },
    onError: (e) => toast.error(e?.message || 'Failed to withdraw'),
  });

  // Backend populates "jobId" (not "job")
  const apps = data?.data?.applications || [];

  const stats = {
    total: apps.length,
    shortlisted: apps.filter(a => a.status === 'shortlisted').length,
    accepted: apps.filter(a => a.status === 'accepted').length,
    active: apps.filter(a => !['rejected', 'withdrawn'].includes(a.status)).length,
  };

  return (
    <div className="min-h-screen bg-[#FAF9F8] pb-12 font-sans selection:bg-indigo-500/20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* ─── Header ─── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-11 h-11 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Applications</h1>
              <p className="text-sm text-slate-500 font-medium">Track your job application pipeline</p>
            </div>
          </div>
        </motion.div>

        {/* ─── Stats ─── */}
        {!isPending && apps.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total Applied', val: stats.total, color: 'text-slate-900', bg: 'bg-white' },
              { label: 'Active', val: stats.active, color: 'text-indigo-700', bg: 'bg-indigo-50' },
              { label: 'Shortlisted', val: stats.shortlisted, color: 'text-blue-700', bg: 'bg-blue-50' },
              { label: 'Accepted', val: stats.accepted, color: 'text-emerald-700', bg: 'bg-emerald-50' },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className={`${s.bg} rounded-2xl p-4 border border-slate-200 shadow-sm`}>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{s.label}</p>
                <p className={`text-2xl font-black mt-1 ${s.color}`}>{s.val}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* ─── List ─── */}
        {isPending ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 animate-pulse shadow-sm">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-slate-100 rounded w-1/2" />
                    <div className="h-4 bg-slate-100 rounded w-1/3" />
                    <div className="h-3 bg-slate-100 rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : apps.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 sm:p-16 text-center shadow-sm">
            <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-5">
              <FileText className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">No applications yet</h3>
            <p className="text-sm text-slate-500 font-medium mb-6 max-w-xs mx-auto">
              Start applying to jobs to track your progress here.
            </p>
            <Link to="/jobs" className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-md text-sm">
              <Briefcase className="w-4 h-4" /> Browse Jobs
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {apps.map((app, i) => {
                // Backend key is "jobId" (populated)
                const job = app.jobId || app.job || {};
                const statusInfo = STATUS_MAP[app.status] || STATUS_MAP.applied;
                const StatusIcon = statusInfo.icon;
                const canWithdraw = app.status === 'applied';
                const matchScore = app.matchScore ? Math.round(app.matchScore * 100) : null;

                return (
                  <motion.div key={app._id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: i * 0.04 }}
                    className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm hover:shadow-md hover:border-indigo-200/60 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      {/* Job Icon */}
                      <div className="w-11 h-11 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center shrink-0">
                        <Briefcase className="w-5 h-5 text-slate-400" />
                      </div>

                      {/* Job Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg border ${statusInfo.cls}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusInfo.label}
                          </span>
                          {job.status && JOB_STATUS_COLORS[job.status] && (
                            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${JOB_STATUS_COLORS[job.status]}`}>
                              Job {job.status}
                            </span>
                          )}
                          {matchScore !== null && (
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${matchScore >= 70 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                              {matchScore}% Match
                            </span>
                          )}
                        </div>
                        <h3 className="font-black text-slate-900 text-base sm:text-lg leading-tight">
                          {job.title || 'Job Title'}
                        </h3>
                        <p className="text-sm font-semibold text-slate-500 mt-0.5">{job.company || ''}</p>

                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-400 font-semibold">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Applied {new Date(app.appliedAt || app.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                          {job.deadline && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Closes {new Date(job.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </span>
                          )}
                          {job.employmentType && (
                            <span className="capitalize">{job.employmentType?.replace('-', ' ')}</span>
                          )}
                        </div>

                        {app.coverLetter && (
                          <p className="text-xs text-slate-400 mt-2 italic line-clamp-2 border-l-2 border-slate-200 pl-2">
                            "{app.coverLetter}"
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0 sm:flex-col sm:items-end">
                        {job._id && (
                          <Link
                            to={`/jobs/${job._id}`}
                            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 hover:border-indigo-300 transition-all shadow-sm"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> View Job
                          </Link>
                        )}
                        {canWithdraw && (
                          <button
                            onClick={() => { if (window.confirm('Withdraw this application? This cannot be undone.')) withdrawMut.mutate(app._id); }}
                            disabled={withdrawMut.isPending}
                            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-red-100 text-red-500 text-xs font-bold rounded-xl hover:bg-red-50 hover:border-red-200 transition-all shadow-sm disabled:opacity-50"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Withdraw
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
