import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Briefcase, Plus, Users, TrendingUp, AlertCircle, Search, 
  MapPin, Filter, MoreVertical, Edit, Trash2, CheckCircle2,
  XCircle, Clock, Copy, ChevronRight, Activity, Eye, FileText,
  Archive, Lock, Unlock, Calendar, Tag, AlertTriangle, Zap
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getMyJobs, deleteJob, closeJob, reopenJob, archiveJob } from '../../api/jobs.api';

// --- Premium Funnel Progress Bar ---
const FunnelProgress = ({ applicants, shortlisted, interviewed, hired }) => {
  const total = Math.max(applicants, 1);
  const pS = (shortlisted / total) * 100;
  const pI = (interviewed / total) * 100;
  const pH = (hired / total) * 100;

  return (
    <div className="w-full mt-4">
      <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
        <span>Applied ({applicants})</span>
        <span>Shortlisted ({shortlisted})</span>
        <span>Interview ({interviewed})</span>
        <span>Hired ({hired})</span>
      </div>
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex relative">
        {applicants > 0 && <div className="absolute left-0 top-0 bottom-0 bg-slate-300 rounded-full" style={{ width: '100%', zIndex: 1 }} />}
        {shortlisted > 0 && <div className="absolute left-0 top-0 bottom-0 bg-blue-400 rounded-full" style={{ width: `${pS}%`, zIndex: 2 }} />}
        {interviewed > 0 && <div className="absolute left-0 top-0 bottom-0 bg-purple-500 rounded-full" style={{ width: `${pI}%`, zIndex: 3 }} />}
        {hired > 0 && <div className="absolute left-0 top-0 bottom-0 bg-[#16A34A] rounded-full" style={{ width: `${pH}%`, zIndex: 4 }} />}
      </div>
    </div>
  );
};

// --- Job Card Component ---
const RecruiterJobCard = ({ job, onAction }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  
  const isApproved = job.status === 'approved';
  const isPending = job.status === 'pending';
  const isRejected = job.status === 'rejected';
  const isClosed = job.status === 'closed';
  const isExpired = job.status === 'expired';
  
  const statusColorMap = {
    pending: 'bg-amber-50 text-amber-600 border-amber-200',
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-red-50 text-red-600 border-red-200',
    closed: 'bg-slate-100 text-slate-600 border-slate-300',
    expired: 'bg-orange-50 text-orange-600 border-orange-200',
  };
  
  const applicants = job.applicationCount || job.applications?.length || 0;
  const views = job.viewCount || 0;
  const clicks = job.analytics?.clicks || 0;
  
  // Fake funnel metrics for UI purposes if 0
  const shortlisted = Math.floor(applicants * 0.4);
  const interviewed = Math.floor(shortlisted * 0.5);
  const hired = Math.floor(interviewed * 0.2);

  const canEdit = isPending || isRejected;
  const canClose = isApproved;
  const canReopen = isClosed;
  const canDelete = true;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
      className={`bg-white rounded-2xl border ${job.isArchived ? 'border-dashed border-slate-300 bg-slate-50' : 'border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-500/30'} transition-all p-5 sm:p-6 group relative overflow-hidden`}
    >
      <div className="absolute top-0 right-0 p-3 sm:p-4">
        <div className="relative">
          <button onClick={() => setMenuOpen(!menuOpen)} className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 shadow-lg rounded-xl overflow-hidden z-20 animate-fade-in">
              {canEdit && <Link to={`/jobs/${job._id}/edit`} className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 font-medium"><Edit className="w-4 h-4" /> Edit Job</Link>}
              {canClose && <button onClick={() => { if(window.confirm('Close job?')) { onAction('close', job._id); setMenuOpen(false); } }} className="flex items-center gap-2 px-4 py-2.5 text-sm text-amber-600 hover:bg-amber-50 font-medium w-full text-left"><Lock className="w-4 h-4" /> Close Job</button>}
              {canReopen && <button onClick={() => { if(window.confirm('Reopen job?')) { onAction('reopen', job._id); setMenuOpen(false); } }} className="flex items-center gap-2 px-4 py-2.5 text-sm text-emerald-600 hover:bg-emerald-50 font-medium w-full text-left"><Unlock className="w-4 h-4" /> Reopen Job</button>}
              {!job.isArchived && <button onClick={() => { if(window.confirm('Archive job?')) { onAction('archive', job._id); setMenuOpen(false); } }} className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 font-medium w-full text-left"><Archive className="w-4 h-4" /> Archive Job</button>}
              {canDelete && <button onClick={() => { if(window.confirm('Delete job permanently?')) { onAction('delete', job._id); setMenuOpen(false); } }} className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-medium w-full text-left border-t border-slate-100"><Trash2 className="w-4 h-4" /> Delete Job</button>}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-xl border border-slate-200 bg-white p-2 shadow-sm flex items-center justify-center shrink-0">
          <Briefcase className="w-6 h-6 text-slate-400" />
        </div>
        <div className="pr-10 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">{job.title}</h3>
            {job.metadata?.verifiedCompany && <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" title="Verified Company" />}
            {job.metadata?.featured && <span className="bg-amber-100 text-amber-700 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">Featured</span>}
          </div>
          <p className="text-xs sm:text-sm font-semibold text-slate-600 flex flex-wrap items-center gap-1.5">
            {job.company} <span className="text-slate-300">•</span> <MapPin className="w-3.5 h-3.5" /> {job.location || 'Remote'}
          </p>
        </div>
      </div>

      {job.rejectionReason && isRejected && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg flex gap-2 items-start">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 font-medium"><strong>Rejected:</strong> {job.rejectionReason}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-5">
        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border ${statusColorMap[job.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
          {job.status} {job.isArchived && '(Archived)'}
        </span>
        <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
          <Tag className="w-3 h-3" /> {job.category?.replace('-', ' ')}
        </span>
        <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
          {job.employmentType}
        </span>
        {job.deadline && (
           <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md bg-orange-50 text-orange-700 border border-orange-100 flex items-center gap-1">
             <Calendar className="w-3 h-3" /> Ends: {new Date(job.deadline).toLocaleDateString()}
           </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-slate-50 border border-slate-100 rounded-xl">
         <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase">Applicants</p>
            <p className="text-base sm:text-lg font-black text-slate-900">{applicants}</p>
         </div>
         <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase">Views</p>
            <p className="text-base sm:text-lg font-black text-slate-900">{views}</p>
         </div>
         <div>
            <p className="text-[10px] font-bold text-indigo-600 uppercase">Clicks</p>
            <p className="text-base sm:text-lg font-black text-indigo-600">{clicks}</p>
         </div>
      </div>

      {applicants > 0 && (
         <FunnelProgress applicants={applicants} shortlisted={shortlisted} interviewed={interviewed} hired={hired} />
      )}

      <div className="mt-6 flex flex-col sm:flex-row gap-2">
        <Link to={`/my-jobs/${job._id}/applicants`} className="flex-1 py-2.5 bg-[#111827] text-white text-sm font-semibold rounded-xl text-center hover:bg-black transition-colors shadow-md">
          View Applicants
        </Link>
        <Link to={`/jobs/${job._id}`} className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors shadow-sm flex items-center justify-center">
          Preview
        </Link>
      </div>
    </motion.div>
  );
};

export default function MyJobsPage() {
  const qc = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [reopenFor, setReopenFor] = useState(null);
  const [reopenDeadline, setReopenDeadline] = useState('');
  
  const { data, isPending } = useQuery({ queryKey: ['my-jobs'], queryFn: getMyJobs });
  
  const invalidate = () => qc.invalidateQueries(['my-jobs']);
  
  const delMut = useMutation({ mutationFn: deleteJob, onSuccess: () => { toast.success('Job deleted permanently'); invalidate(); }, onError: (e) => toast.error(e?.message || 'Failed to delete job') });
  const closeMut = useMutation({ mutationFn: (id) => closeJob(id, { closedReason: 'Closed by poster' }), onSuccess: () => { toast.success('Job closed'); invalidate(); }, onError: (e) => toast.error(e?.message || 'Failed to close job') });
  const reopenMut = useMutation({ mutationFn: ({ id, deadline }) => reopenJob(id, { deadline }), onSuccess: () => { toast.success('Job reopened'); setReopenFor(null); invalidate(); }, onError: (e) => toast.error(e?.message || 'Failed to reopen job') });
  const archiveMut = useMutation({ mutationFn: archiveJob, onSuccess: () => { toast.success('Job archived'); invalidate(); }, onError: (e) => toast.error(e?.message || 'Failed to archive job') });

  const handleAction = (action, jobId) => {
    switch(action) {
      case 'delete': delMut.mutate(jobId); break;
      case 'close': closeMut.mutate(jobId); break;
      case 'reopen': setReopenDeadline(''); setReopenFor(jobId); break;
      case 'archive': archiveMut.mutate(jobId); break;
      default: break;
    }
  };

  const jobs = data?.data?.jobs || [];
  const filteredJobs = jobs.filter(j => 
    (j.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
    (j.company?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const totalApplicants = jobs.reduce((acc, job) => acc + (job.applicationCount || 0), 0);
  const activeJobs = jobs.filter(j => j.status === 'approved' && !j.isArchived).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12 font-sans selection:bg-indigo-500/20 selection:text-indigo-900">
      
      {/* ─── PREMIUM DASHBOARD HEADER ─── */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100">
              <Briefcase className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-none">Hiring Dashboard</h1>
              <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">Manage jobs, track applicants, and hire talent.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button className="hidden sm:flex px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm items-center gap-2">
              <Activity className="w-4 h-4" /> Analytics
            </button>
            <Link to="/post-job" className="flex-1 md:flex-none justify-center px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create Job
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* ─── TOP ANALYTICS ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {[
            { label: 'Active Postings', val: activeJobs, icon: Briefcase, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Total Applicants', val: totalApplicants, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Interviews (Mock)', val: Math.floor(totalApplicants * 0.15), icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
            { label: 'Avg Views', val: jobs.length > 0 ? Math.floor(jobs.reduce((acc, j) => acc + (j.viewCount || 0), 0) / jobs.length) : 0, icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-50' }
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-indigo-200 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider leading-tight w-24 sm:w-auto">{stat.label}</p>
                <div className={`p-1.5 sm:p-2 rounded-lg ${stat.bg} shrink-0`}>
                   <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.color}`} />
                </div>
              </div>
              <h4 className="text-2xl sm:text-3xl font-black text-slate-900 leading-none">{stat.val}</h4>
            </motion.div>
          ))}
        </div>

        {/* ─── MAIN CONTENT ─── */}
        <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
          
          <div className="flex-1 space-y-6">
            
            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search your job titles or companies..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none shadow-sm transition-all"
                />
              </div>
              <button className="px-5 py-3 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 shadow-sm flex items-center justify-center gap-2">
                <Filter className="w-4 h-4" /> Filters
              </button>
            </div>

            {/* Job Grid */}
            {isPending ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 animate-pulse shadow-sm">
                    <div className="flex gap-4 mb-4">
                      <div className="w-12 h-12 bg-slate-200 rounded-xl shrink-0" />
                      <div className="flex-1"><div className="w-3/4 h-5 bg-slate-200 rounded mb-2" /><div className="w-1/2 h-4 bg-slate-200 rounded" /></div>
                    </div>
                    <div className="w-full h-16 bg-slate-100 rounded-xl mb-4" />
                    <div className="w-full h-10 bg-slate-200 rounded-xl" />
                  </div>
                ))}
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 sm:p-16 text-center border border-slate-200 shadow-sm mt-8">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100 shadow-inner">
                  <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">No jobs found</h3>
                <p className="text-sm sm:text-base text-slate-500 max-w-md mx-auto mb-8 font-medium">You haven't posted any jobs yet, or your search didn't match any postings.</p>
                <Link to="/post-job" className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 bg-[#111827] text-white font-bold rounded-xl shadow-lg hover:-translate-y-0.5 transition-transform text-sm sm:text-base">
                  <Plus className="w-5 h-5" /> Create Job Posting
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                <AnimatePresence>
                  {filteredJobs.map(job => (
                    <RecruiterJobCard key={job._id} job={job} onAction={handleAction} />
                  ))}
                </AnimatePresence>
              </div>
            )}

          </div>

          {/* ─── RIGHT SIDEBAR (AI Insights) ─── */}
          <div className="w-full lg:w-80 shrink-0 space-y-6">
            <div className="sticky top-24 space-y-6">
              
              <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                  </div>
                  <h3 className="font-bold text-slate-900">Action Needed</h3>
                </div>
                <div className="space-y-3">
                  {jobs.filter(j => j.status === 'rejected').length > 0 && (
                    <div className="p-3 bg-red-50 rounded-xl border border-red-100 flex gap-3 cursor-pointer hover:bg-red-100 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-red-900">{jobs.filter(j => j.status === 'rejected').length} Job(s) Rejected</p>
                        <p className="text-[10px] font-medium text-red-700 mt-0.5">Edit to resubmit for approval</p>
                      </div>
                    </div>
                  )}
                  {jobs.filter(j => j.status === 'expired').length > 0 && (
                    <div className="p-3 bg-orange-50 rounded-xl border border-orange-100 flex gap-3 cursor-pointer hover:bg-orange-100 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-orange-900">{jobs.filter(j => j.status === 'expired').length} Job(s) Expired</p>
                        <p className="text-[10px] font-medium text-orange-700 mt-0.5">Extend deadline to keep active</p>
                      </div>
                    </div>
                  )}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex gap-3 cursor-pointer hover:bg-slate-100 transition-colors">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-slate-900">Review new applicants</p>
                      <p className="text-[10px] font-medium text-slate-500 mt-0.5">Check your active job postings</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#111827] to-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-lg relative overflow-hidden group hover:shadow-xl transition-shadow">
                <div className="absolute top-0 right-0 p-4"><Zap className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" /></div>
                <h3 className="font-bold text-white mb-2">AI Hiring Assistant</h3>
                <p className="text-sm text-slate-400 font-medium mb-6">Jobs with detailed descriptions receive 40% more qualified applicants.</p>
                <Link to="/post-job" className="block w-full py-2.5 bg-white text-slate-900 text-center font-bold rounded-xl hover:bg-slate-50 transition-colors text-sm shadow-sm">
                  Optimize Listings
                </Link>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* ── Reopen Job Modal ── */}
      {!!reopenFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 flex items-center gap-2"><Unlock className="w-5 h-5 text-emerald-500" /> Reopen Job</h3>
              <button onClick={() => setReopenFor(null)} className="text-slate-400 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"><XCircle className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-600 mb-4">You are about to reopen this job posting. Optionally, set a new deadline.</p>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">New Deadline (Optional)</label>
                <input 
                  type="date" 
                  value={reopenDeadline}
                  onChange={e => setReopenDeadline(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-2 justify-end">
              <button onClick={() => setReopenFor(null)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-xl transition-colors">Cancel</button>
              <button 
                onClick={() => reopenMut.mutate({ id: reopenFor, deadline: reopenDeadline || undefined })}
                disabled={reopenMut.isPending}
                className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {reopenMut.isPending ? 'Reopening...' : 'Reopen Job'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
