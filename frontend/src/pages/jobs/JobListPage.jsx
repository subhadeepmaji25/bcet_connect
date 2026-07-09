import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase, Plus, MapPin, Clock, Star, Building2,
  Search, Filter, Zap, ExternalLink,
  Users, CheckCircle2, TrendingUp, DollarSign
} from "lucide-react";
import toast from "react-hot-toast";
import { getApprovedJobs, applyForJob } from "../../api/jobs.api";
import { useAuth } from "../../hooks/useAuth";
import { useDebounce } from "../../hooks/useDebounce";
import {
  JOB_CATEGORIES, JOB_EMPLOYMENT_TYPES, JOB_CATEGORY_LABELS, EMPLOYMENT_TYPE_LABELS
} from "../../constants/appConstants";
import Pagination from "../../components/ui/Pagination";
import { getMyProfile, getResumes } from "../../api/users.api";
import JobApplicationModal from "../../components/jobs/JobApplicationModal";

// --- Profile Completion Widget ---
function ProfileCompletionWidget() {
  const { data: profileData, isPending: p1 } = useQuery({ queryKey: ["my-profile"], queryFn: getMyProfile });
  const { data: resData, isPending: p2 } = useQuery({ queryKey: ["my-resumes"], queryFn: getResumes });

  if (p1 || p2) return null;
  const profile = profileData?.data?.profile || profileData?.data?.user || profileData?.data || {};
  const resumes = resData?.data?.resumes || resData?.data || [];
  
  let score = 0;
  let missing = [];
  
  if (profile.avatar) score += 20; else missing.push("Avatar");
  if (profile.bio) score += 20; else missing.push("Bio / Summary");
  if (resumes.length > 0) score += 40; else missing.push("Resume");
  if (profile.skills?.length > 0 || profile.searchableSkills?.length > 0) score += 20; else missing.push("Skills");
  
  if (score === 100) return null;

  return (
    <div className="bg-white border border-[#F59E0B]/30 rounded-2xl p-5 shadow-sm mb-6 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-24 h-24 bg-[#F59E0B]/10 rounded-full blur-xl -mr-10 -mt-10 pointer-events-none" />
      <div className="flex items-start gap-3 relative z-10">
        <div className="p-2 bg-[#F59E0B]/10 rounded-xl text-[#F59E0B]">
          <TrendingUp className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-slate-900 text-sm">Boost Your Visibility</h4>
          <p className="text-xs text-slate-500 mt-1 mb-3">
            Your profile is {score}% complete. Recruiters and the AI recommendation engine prioritize complete profiles.
          </p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mb-3 overflow-hidden">
            <div className="bg-[#F59E0B] h-1.5 rounded-full transition-all duration-1000" style={{ width: `${score}%` }} />
          </div>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {missing.map((m, i) => (
              <span key={i} className="text-[10px] font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200">
                Missing: {m}
              </span>
            ))}
          </div>
          <Link to="/profile" className="text-xs font-bold text-[#F59E0B] hover:text-[#d97706] flex items-center gap-1 w-fit">
            Complete Profile <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// Removed internal JobApplicationModal

// --- Premium Job Card Component ---
function JobCard({ job, onApply, userRole, index }) {
  const canApply = ["student", "alumni"].includes(userRole);
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -4, scale: 1.01 }}
      className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all relative overflow-hidden group"
    >
      {/* Decorative gradient blob on hover */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#635BFF]/5 to-[#8B5CF6]/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700 pointer-events-none" />

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0 text-[#635BFF] shadow-sm">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-lg leading-tight group-hover:text-[#635BFF] transition-colors">
              {job.title}
            </h3>
            <div className="flex items-center gap-1.5 text-slate-500 text-sm mt-1">
              <span>{job.company}</span>
              {job.metadata?.verifiedCompany && (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" title="Verified Company" />
              )}
            </div>
          </div>
        </div>
        {job.metadata?.featured && (
          <div className="bg-[#F59E0B]/10 text-[#F59E0B] px-2.5 py-1 rounded-full flex items-center gap-1 text-xs font-medium border border-[#F59E0B]/20">
            <Star className="w-3 h-3 fill-current" /> Featured
          </div>
        )}
      </div>

      {/* Badges/Tags */}
      <div className="flex flex-wrap gap-2 mb-5 relative z-10">
        {job.employmentType && (
          <span className="px-2.5 py-1 rounded-md bg-[#635BFF]/5 text-[#635BFF] text-xs font-medium border border-[#635BFF]/10">
            {EMPLOYMENT_TYPE_LABELS[job.employmentType] || job.employmentType}
          </span>
        )}
        {job.category && (
          <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
            {JOB_CATEGORY_LABELS[job.category] || job.category}
          </span>
        )}
        {job.isRemote && (
          <span className="px-2.5 py-1 rounded-md bg-[#8B5CF6]/10 text-[#8B5CF6] text-xs font-medium border border-[#8B5CF6]/20">
            Remote
          </span>
        )}
      </div>

      {/* Meta Info Grid */}
      <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm text-slate-500 mb-6 relative z-10">
        {job.location && (
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-slate-400" /> <span className="truncate">{job.location}</span>
          </div>
        )}
        {job.isSalaryVisible && (job.salaryMin || job.salaryMax) && (
          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            <DollarSign className="w-4 h-4 text-[#16A34A]" />
            {job.salaryCurrency || "₹"}{job.salaryMin ? `${(job.salaryMin/1000).toFixed(0)}K` : ""}
            {job.salaryMin && job.salaryMax ? "-" : ""}
            {job.salaryMax ? `${(job.salaryMax/1000).toFixed(0)}K` : ""}
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Users className="w-4 h-4 text-slate-400" /> {job.applicationCount || 0} Applied
        </div>
        {job.deadline && (
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-slate-400" />
            {new Date(job.deadline) > new Date() ? `Till ${new Date(job.deadline).toLocaleDateString([], { month: 'short', day: 'numeric' })}` : "Expired"}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 relative z-10 border-t border-slate-100 pt-4">
        <Link
          to={`/jobs/${job._id}`}
          className="flex-1 text-center py-2.5 text-sm font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
        >
          View Details
        </Link>
        {canApply && (
          <button
            onClick={() => onApply(job._id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold text-white bg-[#635BFF] hover:bg-[#524be3] shadow-[0_4px_14px_0_rgba(99,91,255,0.39)] rounded-xl transition-all hover:-translate-y-0.5"
          >
            <Zap className="w-4 h-4" /> Apply Now
          </button>
        )}
        {job.applyUrl && !canApply && (
           <a
             href={job.applyUrl} target="_blank" rel="noopener noreferrer"
             className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold text-[#635BFF] bg-[#635BFF]/10 hover:bg-[#635BFF]/20 rounded-xl transition-colors"
           >
             External Apply <ExternalLink className="w-4 h-4" />
           </a>
        )}
      </div>
    </motion.div>
  );
}

// --- Skeleton Component ---
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm animate-pulse">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 bg-slate-200 rounded-xl" />
        <div className="flex-1">
          <div className="h-5 bg-slate-200 rounded w-2/3 mb-2" />
          <div className="h-4 bg-slate-200 rounded w-1/3" />
        </div>
      </div>
      <div className="flex gap-2 mb-6">
        <div className="h-6 bg-slate-200 rounded w-16" />
        <div className="h-6 bg-slate-200 rounded w-20" />
      </div>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="h-4 bg-slate-200 rounded w-full" />
        <div className="h-4 bg-slate-200 rounded w-3/4" />
        <div className="h-4 bg-slate-200 rounded w-2/3" />
      </div>
      <div className="flex gap-3">
        <div className="h-10 bg-slate-200 rounded-xl flex-1" />
        <div className="h-10 bg-slate-200 rounded-xl flex-1" />
      </div>
    </div>
  );
}

// --- Main Page Component ---
export default function JobListPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [filters, setFilters] = useState({ category: "", employmentType: "", isRemote: "" });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [applyModalJob, setApplyModalJob] = useState(null);

  // Page reset is now handled in event handlers

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["jobs", filters, debouncedSearch, page],
    queryFn: () => getApprovedJobs({
      page,
      ...(debouncedSearch && { q: debouncedSearch }),
      ...(filters.category && { category: filters.category }),
      ...(filters.employmentType && { employmentType: filters.employmentType }),
      ...(filters.isRemote === "true" && { isRemote: true }),
    }),
  });

  const applyMutation = useMutation({
    mutationFn: ({ jobId, resumeId, coverLetter }) => applyForJob(jobId, { resumeId, coverLetter }),
    onSuccess: () => {
      toast.success("Application submitted! 🎉", { style: { background: '#111827', color: '#fff', borderRadius: '12px' }});
      queryClient.invalidateQueries({ queryKey: ["my-applications"] });
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.message || "Failed to apply";
      toast.error(msg, { duration: 4000 });
    },
  });

  const handleApplyClick = (jobId) => {
    const job = filtered.find(j => j._id === jobId);
    setApplyModalJob(job);
  };

  const confirmApply = async (jobId, resumeId, coverLetter) => {
    await applyMutation.mutateAsync({ jobId, resumeId, coverLetter });
  };

  const filtered = data?.data?.jobs || [];

  const canPost = ["faculty", "alumni", "admin"].includes(user?.role);
  const canApply = ["student", "alumni"].includes(user?.role);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12 font-sans selection:bg-[#635BFF]/20 selection:text-[#635BFF]">
      
      {/* --- Premium Hero Section --- */}
      <div className="relative overflow-hidden bg-white border-b border-slate-200">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] opacity-30 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-[#635BFF] via-[#8B5CF6] to-[#ec4899] blur-[100px] rounded-full mix-blend-multiply opacity-20 animate-pulse" style={{ animationDuration: '8s' }} />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 mb-4">
              Find your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#635BFF] to-[#8B5CF6]">dream opportunity</span>
            </h1>
            <p className="text-base text-slate-500 max-w-2xl mx-auto mb-8">
              Discover roles at top companies, connect with alumni, and accelerate your career with AI-powered recommendations.
            </p>
          </motion.div>

          {/* Floating Search Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="max-w-3xl mx-auto bg-white/80 backdrop-blur-xl border border-slate-200 p-2 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col sm:flex-row gap-2"
          >
            <div className="relative flex-1 flex items-center">
              <Search className="absolute left-4 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Job title, keywords, or company..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full bg-transparent border-none focus:ring-0 pl-12 pr-4 py-3 text-slate-900 font-medium placeholder:text-slate-400 outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`px-5 py-3 rounded-xl font-medium flex items-center gap-2 transition-colors ${showFilters ? 'bg-slate-100 text-[#635BFF]' : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'}`}
              >
                <Filter className="w-4 h-4" /> Filters
              </button>
              <button className="px-8 py-3 bg-slate-900 hover:bg-black text-white font-semibold rounded-xl shadow-md transition-all hover:shadow-lg">
                Search
              </button>
            </div>
          </motion.div>

          {/* Quick Stats */}
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-6 mt-10 text-sm font-medium text-slate-500"
          >
            <div className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-[#635BFF]" /> {filtered.length} Active Jobs</div>
            <div className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-[#16A34A]" /> High Hiring Rate</div>
            <div className="flex items-center gap-2"><Star className="w-4 h-4 text-[#F59E0B]" /> Alumni Recommended</div>
          </motion.div>
        </div>
      </div>

      {/* --- Main Content Area --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Action Bar */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-slate-900">Recommended for you</h2>
          <div className="flex gap-3">
            {canPost && (
              <Link to="/jobs/my" className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm transition-colors">
                Manage Postings
              </Link>
            )}
            {canPost && (
              <Link to="/jobs/post" className="px-4 py-2 text-sm font-semibold text-white bg-[#635BFF] hover:bg-[#524be3] rounded-lg shadow-sm transition-colors flex items-center gap-2">
                <Plus className="w-4 h-4" /> Post a Job
              </Link>
            )}
            {canApply && (
              <Link to="/jobs/applications/my" className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm transition-colors">
                My Applications
              </Link>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* --- Sticky Sidebar --- */}
          <AnimatePresence>
            {showFilters && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="w-full lg:hidden flex-shrink-0"
              >
                {canApply && <ProfileCompletionWidget />}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-6 mb-6">
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-3 flex items-center justify-between">
                      Filters
                      <button onClick={() => { setFilters({ category: "", employmentType: "", isRemote: "" }); setPage(1); }} className="text-xs text-[#635BFF] font-medium hover:underline">
                        Reset All
                      </button>
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Job Type</label>
                      <div className="space-y-2">
                        <label className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer group">
                          <input type="radio" name="empType_mob" value="" checked={filters.employmentType === ""} onChange={() => { setFilters(f => ({...f, employmentType: ""})); setPage(1); }} className="w-4 h-4 text-[#635BFF] border-slate-300 focus:ring-[#635BFF]" />
                          <span className="group-hover:text-slate-900">Any Type</span>
                        </label>
                        {JOB_EMPLOYMENT_TYPES.map(t => (
                          <label key={t} className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer group">
                            <input type="radio" name="empType_mob" value={t} checked={filters.employmentType === t} onChange={() => { setFilters(f => ({...f, employmentType: t})); setPage(1); }} className="w-4 h-4 text-[#635BFF] border-slate-300 focus:ring-[#635BFF]" />
                            <span className="group-hover:text-slate-900">{EMPLOYMENT_TYPE_LABELS[t] || t}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Category</label>
                      <select 
                        value={filters.category} 
                        onChange={(e) => { setFilters(f => ({...f, category: e.target.value})); setPage(1); }}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-[#635BFF]/20 focus:border-[#635BFF] outline-none"
                      >
                        <option value="">All Categories</option>
                        {JOB_CATEGORIES.map(c => <option key={c} value={c}>{JOB_CATEGORY_LABELS[c] || c}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Location</label>
                      <label className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
                        <input type="checkbox" checked={filters.isRemote === "true"} onChange={(e) => { setFilters(f => ({...f, isRemote: e.target.checked ? "true" : ""})); setPage(1); }} className="w-4 h-4 rounded text-[#635BFF] border-slate-300 focus:ring-[#635BFF]" />
                        <span>Remote Only</span>
                      </label>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Desktop Sidebar (Always visible on lg screens) */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              {canApply && <ProfileCompletionWidget />}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-6">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3 flex items-center justify-between">
                  Filters
                  <button onClick={() => setFilters({ category: "", employmentType: "", isRemote: "" })} className="text-xs text-[#635BFF] font-medium hover:underline">
                    Reset All
                  </button>
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Job Type</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer group">
                      <input type="radio" name="empType" value="" checked={filters.employmentType === ""} onChange={() => { setFilters(f => ({...f, employmentType: ""})); setPage(1); }} className="w-4 h-4 text-[#635BFF] border-slate-300 focus:ring-[#635BFF]" />
                      <span className="group-hover:text-slate-900">Any Type</span>
                    </label>
                    {JOB_EMPLOYMENT_TYPES.map(t => (
                      <label key={t} className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer group">
                        <input type="radio" name="empType" value={t} checked={filters.employmentType === t} onChange={() => { setFilters(f => ({...f, employmentType: t})); setPage(1); }} className="w-4 h-4 text-[#635BFF] border-slate-300 focus:ring-[#635BFF]" />
                        <span className="group-hover:text-slate-900">{EMPLOYMENT_TYPE_LABELS[t] || t}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Category</label>
                  <select 
                    value={filters.category} 
                    onChange={(e) => { setFilters(f => ({...f, category: e.target.value})); setPage(1); }}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-[#635BFF]/20 focus:border-[#635BFF] outline-none"
                  >
                    <option value="">All Categories</option>
                    {JOB_CATEGORIES.map(c => <option key={c} value={c}>{JOB_CATEGORY_LABELS[c] || c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Location</label>
                  <label className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
                    <input type="checkbox" checked={filters.isRemote === "true"} onChange={(e) => { setFilters(f => ({...f, isRemote: e.target.checked ? "true" : ""})); setPage(1); }} className="w-4 h-4 rounded text-[#635BFF] border-slate-300 focus:ring-[#635BFF]" />
                    <span>Remote Only</span>
                  </label>
                </div>
                </div>
              </div>
            </div>
          </div>

          {/* --- Job Grid --- */}
          <div className="flex-1">
            {isPending ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
                {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : isError ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
                <p className="text-slate-500 mb-4">Something went wrong loading the jobs.</p>
                <button onClick={() => refetch()} className="px-6 py-2 bg-slate-900 text-white rounded-xl font-medium">Try Again</button>
              </div>
            ) : filtered.length === 0 ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl p-16 text-center border border-slate-200 shadow-sm">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No matching jobs found</h3>
                <p className="text-slate-500 max-w-md mx-auto mb-8">
                  We couldn't find any opportunities matching your current filters or search terms. Try adjusting them to see more results.
                </p>
                <button onClick={() => {setSearch(""); setFilters({ category: "", employmentType: "", isRemote: "" }); setPage(1);}} className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors">
                  Clear All Filters
                </button>
              </motion.div>
            ) : (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
                  {filtered.map((job, idx) => (
                    <JobCard
                      key={job._id}
                      job={job}
                      index={idx}
                      userRole={user?.role}
                      onApply={handleApplyClick}
                    />
                  ))}
                </div>
                {data?.meta?.pagination && (
                  <Pagination
                    currentPage={data.meta.pagination.page}
                    totalPages={data.meta.pagination.totalPages}
                    onPageChange={setPage}
                    hasNextPage={data.meta.pagination.hasNextPage}
                    hasPrevPage={data.meta.pagination.hasPrevPage}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <JobApplicationModal 
        isOpen={!!applyModalJob} 
        onClose={() => setApplyModalJob(null)} 
        job={applyModalJob} 
        onConfirm={confirmApply} 
      />
    </div>
  );
}
