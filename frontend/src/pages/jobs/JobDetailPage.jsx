// src/pages/jobs/JobDetailPage.jsx
import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Briefcase, Building2, MapPin, Clock, Star, Users,
  Zap, ExternalLink, CheckCircle, XCircle, ShieldCheck, BarChart2,
  Calendar, Globe, BookOpen, DollarSign, Eye, ChevronRight,
  Award, GraduationCap, Lock
} from "lucide-react";
import toast from "react-hot-toast";
import { 
  getJobById, applyForJob, approveJob, rejectJob, getMyApplications, withdrawApplication, 
  closeJob, archiveJob, featureJob, verifyCompany, reopenJob 
} from "../../api/jobs.api";
import { getJobMatch } from "../../api/recommendation.api";
import { useAuth } from "../../hooks/useAuth";
import { JOB_CATEGORY_LABELS, EMPLOYMENT_TYPE_LABELS } from "../../constants/appConstants";
import JobApplicationModal from "../../components/jobs/JobApplicationModal";
import ReopenJobModal from "../../components/jobs/ReopenJobModal";

/* ─── Skeleton ─────────────────────────────────────────────── */
function JobDetailSkeleton() {
  return (
    <div className="animate-fade-in space-y-5">
      <div className="skeleton h-52 w-full rounded-2xl" />
      <div className="flex gap-6">
        <div className="flex-1 space-y-4">
          <div className="glass-card p-6 space-y-3">
            <div className="skeleton h-5 w-24" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-5/6" />
            <div className="skeleton h-4 w-4/6" />
          </div>
          <div className="glass-card p-6 space-y-3">
            <div className="skeleton h-5 w-32" />
            <div className="flex gap-2 flex-wrap">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="skeleton h-7 w-20 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
        <div className="w-80 hidden lg:block space-y-4">
          <div className="skeleton h-64 rounded-2xl" />
          <div className="skeleton h-36 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

/* ─── Info Grid Cell ────────────────────────────────────────── */
function InfoCell({ icon: Icon, label, value, accent }) {
  return (
    <div className="glass rounded-xl p-3.5 flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-medium uppercase tracking-wide">
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <div className={`text-sm font-semibold capitalize ${accent || "text-slate-100"}`}>{value}</div>
    </div>
  );
}

/* ─── Skill Tag ─────────────────────────────────────────────── */
function SkillTag({ skill, variant = "required" }) {
  const styles = {
    required: "bg-emerald-500/10 border-emerald-500/20 text-emerald-300",
    preferred: "bg-amber-500/10 border-amber-500/20 text-amber-300",
  };
  return (
    <span
      className={`px-3 py-1 rounded-lg border text-xs font-medium capitalize transition-all hover:scale-105 ${styles[variant]}`}
    >
      {skill}
    </span>
  );
}

/* ─── Main Component ────────────────────────────────────────── */
export default function JobDetailPage() {
  const { jobId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectBox, setShowRejectBox] = useState(false);

  const { data, isPending, isError } = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => getJobById(jobId),
  });

  const { data: myAppsData } = useQuery({
    queryKey: ["my-applications"],
    queryFn: () => getMyApplications(),
    enabled: ["student", "alumni"].includes(user?.role),
  });
  
  const { data: matchData } = useQuery({
    queryKey: ["job-match", jobId],
    queryFn: () => getJobMatch(jobId),
    enabled: ["student", "alumni"].includes(user?.role),
    retry: false
  });
  
  const myApplication = myAppsData?.data?.applications?.find(app => app.job === jobId || app.job?._id === jobId);
  const hasApplied = !!myApplication;
  const matchInfo = matchData?.data?.match;

  const applyMutation = useMutation({
    mutationFn: ({ resumeId, coverLetter }) => applyForJob(jobId, { resumeId, coverLetter }),
    onSuccess: () => {
      toast.success("Applied successfully! 🎉");
      queryClient.invalidateQueries({ queryKey: ["my-applications"] });
      queryClient.invalidateQueries({ queryKey: ["job", jobId] });
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.message || "Failed to apply";
      toast.error(msg, { duration: 4000 });
    },
  });

  const confirmApply = async (jobId, resumeId, coverLetter) => {
    await applyMutation.mutateAsync({ resumeId, coverLetter });
  };

  const withdrawMutation = useMutation({
    mutationFn: () => withdrawApplication(myApplication._id),
    onSuccess: () => {
      toast.success("Application withdrawn");
      queryClient.invalidateQueries({ queryKey: ["my-applications"] });
      queryClient.invalidateQueries({ queryKey: ["job", jobId] });
    },
    onError: (err) => toast.error(err?.message || "Failed to withdraw"),
  });

  const closeMutation = useMutation({
    mutationFn: () => closeJob(jobId),
    onSuccess: () => {
      toast.success("Job closed successfully");
      queryClient.invalidateQueries({ queryKey: ["job", jobId] });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: () => archiveJob(jobId),
    onSuccess: () => {
      toast.success("Job archived successfully");
      queryClient.invalidateQueries({ queryKey: ["job", jobId] });
    },
  });

  const reopenMutation = useMutation({
    mutationFn: (data) => reopenJob(jobId, data),
    onSuccess: () => {
      toast.success("Job reopened successfully");
      setShowReopenModal(false);
      queryClient.invalidateQueries({ queryKey: ["job", jobId] });
    },
  });

  const featureMutation = useMutation({
    mutationFn: () => featureJob(jobId, { featured: true }),
    onSuccess: () => {
      toast.success("Job featured status updated");
      queryClient.invalidateQueries({ queryKey: ["job", jobId] });
    },
  });

  const verifyCompanyMutation = useMutation({
    mutationFn: () => verifyCompany(jobId),
    onSuccess: () => {
      toast.success("Company verified successfully");
      queryClient.invalidateQueries({ queryKey: ["job", jobId] });
    },
  });

  const approveMutation = useMutation({
    mutationFn: () => approveJob(jobId),
    onSuccess: () => {
      toast.success("Job approved!");
      queryClient.invalidateQueries({ queryKey: ["job", jobId] });
      queryClient.invalidateQueries({ queryKey: ["pending-jobs"] });
    },
    onError: (err) => toast.error(err?.message || "Failed to approve"),
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectJob(jobId, { rejectionReason: rejectReason }),
    onSuccess: () => {
      toast.success("Job rejected");
      setShowRejectBox(false);
      queryClient.invalidateQueries({ queryKey: ["job", jobId] });
      queryClient.invalidateQueries({ queryKey: ["pending-jobs"] });
    },
    onError: (err) => toast.error(err?.message || "Failed to reject"),
  });

  if (isPending) return <JobDetailSkeleton />;

  if (isError || !data?.data) {
    return (
      <div className="glass-card p-16 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-slate-200 font-semibold text-lg mb-2">Job Not Found</h2>
        <p className="text-slate-400 mb-6 text-sm">
          This job posting may have been removed or doesn&apos;t exist.
        </p>
        <Link to="/jobs" className="btn-primary inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Browse Jobs
        </Link>
      </div>
    );
  }

  const job = data?.data?.job || data?.data;
  const isExpired = job.deadline && new Date(job.deadline) < new Date();
  const canApply = ["student", "alumni"].includes(user?.role) && !isExpired;
  const canAdmin = user?.role === "admin";
  const canManage = ["faculty", "alumni", "admin"].includes(user?.role);
  const isOwner =
    job.postedBy === user?._id || job.postedBy?._id === user?._id;
  const viewCount = job.analytics?.viewCount ?? 0;
  const applicationCount = job.applicationCount ?? 0;

  const salary = (() => {
    if (!job.isSalaryVisible || (!job.salaryMin && !job.salaryMax)) return null;
    const cur = job.salaryCurrency || "₹";
    const min = job.salaryMin ? `${(job.salaryMin / 100000).toFixed(1)}L` : null;
    const max = job.salaryMax ? `${(job.salaryMax / 100000).toFixed(1)}L` : null;
    if (min && max) return `${cur}${min} – ${cur}${max} /yr`;
    if (min) return `${cur}${min}+ /yr`;
    return `Up to ${cur}${max} /yr`;
  })();

  const daysLeft = job.deadline
    ? Math.max(0, Math.ceil((new Date(job.deadline) - new Date()) / 86400000))
    : null;

  const statusConfig = {
    pending:  { label: "Pending Review",   cls: "bg-amber-500/15 border-amber-500/30 text-amber-300",   dot: "bg-amber-400" },
    approved: { label: "Actively Hiring",  cls: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300", dot: "bg-emerald-400 animate-pulse" },
    rejected: { label: "Rejected",         cls: "bg-red-500/15 border-red-500/30 text-red-300",         dot: "bg-red-400" },
    closed:   { label: "Position Closed",  cls: "bg-slate-500/15 border-slate-500/30 text-slate-400",   dot: "bg-slate-400" },
    archived: { label: "Archived",         cls: "bg-slate-500/15 border-slate-500/30 text-slate-400",   dot: "bg-slate-400" },
    expired:  { label: "Expired",          cls: "bg-slate-500/15 border-slate-500/30 text-slate-400",   dot: "bg-slate-400" },
  };
  const statusInfo = statusConfig[job.status] || statusConfig.pending;

  return (
    <div className="animate-fade-in space-y-5 max-w-6xl">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="btn-ghost flex items-center gap-2 text-sm -ml-2 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* ── Hero Banner ─────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-white/8">
        {/* Layered gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/60 via-[#0f0f1a] to-purple-900/40" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(99,102,241,0.15),transparent_60%)]" />
        {/* Subtle dot-grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative p-6 md:p-8">
          {/* Status + feature badges */}
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusInfo.cls}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
              {statusInfo.label}
            </span>
            {job.metadata?.featured && (
              <span className="badge badge-warning flex items-center gap-1">
                <Star className="w-3 h-3" /> Featured
              </span>
            )}
            {job.metadata?.verifiedCompany && (
              <span className="badge badge-success flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Verified
              </span>
            )}
            {job.rejectionReason && (
              <span className="text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-full px-3 py-1">
                Reason: {job.rejectionReason}
              </span>
            )}
          </div>

          <div className="flex items-start gap-4 md:gap-6">
            {/* Company logo placeholder */}
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-purple-600/30 border border-indigo-500/30 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-900/30">
              <Briefcase className="w-8 h-8 md:w-10 md:h-10 text-indigo-300" />
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="font-display text-2xl md:text-3xl font-bold text-white leading-tight mb-1.5">
                {job.title}
              </h1>
              <div className="flex items-center gap-2 text-slate-300 mb-4 flex-wrap">
                <Building2 className="w-4 h-4 text-indigo-400" />
                <span className="font-medium">{job.company}</span>
                {job.location && !job.isRemote && (
                  <>
                    <span className="text-slate-600">·</span>
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-slate-400 text-sm">{job.location}</span>
                  </>
                )}
                {job.isRemote && (
                  <>
                    <span className="text-slate-600">·</span>
                    <Globe className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-cyan-400 text-sm font-medium">Remote</span>
                  </>
                )}
              </div>

              {/* Key info badges */}
              <div className="flex flex-wrap gap-2">
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/8 border border-white/10 text-slate-200 text-xs font-medium">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                  {EMPLOYMENT_TYPE_LABELS[job.employmentType] || job.employmentType}
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/8 border border-white/10 text-slate-200 text-xs font-medium">
                  <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                  {JOB_CATEGORY_LABELS[job.category] || job.category}
                </span>
                {salary && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-xs font-semibold">
                    <DollarSign className="w-3.5 h-3.5" /> {salary}
                  </span>
                )}
                {daysLeft !== null && daysLeft > 0 && (
                  <span
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                      daysLeft <= 3
                        ? "bg-red-500/15 border border-red-500/25 text-red-300"
                        : daysLeft <= 7
                        ? "bg-amber-500/15 border border-amber-500/25 text-amber-300"
                        : "bg-white/8 border border-white/10 text-slate-300"
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" /> {daysLeft} day{daysLeft !== 1 ? "s" : ""} left
                  </span>
                )}
                {daysLeft === 0 && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/25 text-red-300 text-xs font-medium">
                    <XCircle className="w-3.5 h-3.5" /> Deadline passed
                  </span>
                )}
              </div>
            </div>

            {/* View count chip — visible desktop + owner/admin */}
            {(isOwner || canAdmin) && viewCount > 0 && (
              <div className="hidden md:flex flex-col items-center gap-1 px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex-shrink-0">
                <Eye className="w-4 h-4 text-indigo-400" />
                <span className="text-2xl font-bold text-white leading-none">
                  {viewCount.toLocaleString()}
                </span>
                <span className="text-[11px] text-slate-500">views</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Two-Column Layout ────────────────────────────────── */}
      <div className="flex gap-6 items-start">

        {/* ── LEFT: Main Content ─────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* View count — mobile / owner */}
          {(isOwner || canAdmin) && viewCount > 0 && (
            <div className="md:hidden glass-card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center">
                <Eye className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">{viewCount.toLocaleString()} views</p>
                <p className="text-xs text-slate-500">Total job views tracked</p>
              </div>
              <Link
                to={`/jobs/${jobId}/analytics`}
                className="ml-auto btn-ghost text-xs flex items-center gap-1"
              >
                Analytics <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Mobile Match Score */}
          {matchInfo && (
            <div className="lg:hidden glass-card border-[#635BFF]/30 p-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#635BFF] to-[#ec4899]" />
              <div className="flex items-center justify-between mb-4 mt-1">
                <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-[#ec4899]" /> AI Match Score
                </h3>
                <span className={`text-xl font-extrabold ${matchInfo.finalScore >= 0.7 ? 'text-emerald-400' : matchInfo.finalScore >= 0.4 ? 'text-amber-400' : 'text-slate-300'}`}>
                  {Math.round((matchInfo.finalScore || 0) * 100)}%
                </span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-4">
                <div 
                  className={`h-full rounded-full ${matchInfo.finalScore >= 0.7 ? 'bg-emerald-400' : matchInfo.finalScore >= 0.4 ? 'bg-amber-400' : 'bg-slate-400'}`} 
                  style={{ width: `${(matchInfo.finalScore || 0) * 100}%` }} 
                />
              </div>
            </div>
          )}

          {/* Description */}
          <div className="glass-card p-6">
            <h2 className="section-title mb-4">
              <Globe className="w-4 h-4 text-indigo-400" /> Job Description
            </h2>
            <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
              {job.description}
            </div>
          </div>

          {/* Required Skills */}
          {job.requiredSkills?.length > 0 && (
            <div className="glass-card p-6">
              <h2 className="section-title mb-4">
                <CheckCircle className="w-4 h-4 text-emerald-400" /> Required Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {job.requiredSkills.map((s) => (
                  <SkillTag key={s} skill={s} variant="required" />
                ))}
              </div>
            </div>
          )}

          {/* Preferred Skills */}
          {job.preferredSkills?.length > 0 && (
            <div className="glass-card p-6">
              <h2 className="section-title mb-4">
                <Star className="w-4 h-4 text-amber-400" /> Preferred Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {job.preferredSkills.map((s) => (
                  <SkillTag key={s} skill={s} variant="preferred" />
                ))}
              </div>
            </div>
          )}

          {/* Eligibility */}
          {job.eligibility && (
            <div className="glass-card p-6">
              <h2 className="section-title mb-4">
                <GraduationCap className="w-4 h-4 text-cyan-400" /> Eligibility Criteria
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {job.eligibility.minimumCGPA > 0 && (
                  <div className="glass rounded-xl p-3">
                    <p className="text-[11px] text-slate-500 uppercase tracking-wide mb-1">Min CGPA</p>
                    <p className="text-slate-100 font-semibold text-sm">{job.eligibility.minimumCGPA}</p>
                  </div>
                )}
                {job.eligibility.allowedBranches?.length > 0 && (
                  <div className="glass rounded-xl p-3">
                    <p className="text-[11px] text-slate-500 uppercase tracking-wide mb-1">Branches</p>
                    <p className="text-slate-100 font-semibold text-sm">
                      {job.eligibility.allowedBranches.join(", ")}
                    </p>
                  </div>
                )}
                {job.eligibility.passoutYears?.length > 0 && (
                  <div className="glass rounded-xl p-3">
                    <p className="text-[11px] text-slate-500 uppercase tracking-wide mb-1">Batch</p>
                    <p className="text-slate-100 font-semibold text-sm">
                      {job.eligibility.passoutYears.join(", ")}
                    </p>
                  </div>
                )}
                <div className="glass rounded-xl p-3">
                  <p className="text-[11px] text-slate-500 uppercase tracking-wide mb-1">Backlogs</p>
                  <p
                    className={`font-semibold text-sm ${
                      job.eligibility.backlogsAllowed ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {job.eligibility.backlogsAllowed ? "Allowed" : "Not Allowed"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions + Forms */}
          <div className="glass-card p-6">
            <div className="flex flex-wrap gap-3">
              {canApply && job.status === "approved" && !hasApplied && (
                <button
                  onClick={() => setShowApplyModal(true)}
                  className="btn-primary flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" /> Apply Now
                </button>
              )}
              {canApply && hasApplied && (
                <button
                  onClick={() => withdrawMutation.mutate()}
                  disabled={withdrawMutation.isPending}
                  className="btn-danger flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" /> 
                  {withdrawMutation.isPending ? "Withdrawing..." : "Withdraw Application"}
                </button>
              )}
              {job.applyUrl && (
                <a
                  href={job.applyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" /> External Apply
                </a>
              )}
              
              {isOwner && (
                <>
                  {["approved", "pending"].includes(job.status) && !isExpired && (
                    <button
                      onClick={() => closeMutation.mutate()}
                      disabled={closeMutation.isPending}
                      className="btn-secondary flex items-center gap-2 text-slate-300"
                    >
                      <XCircle className="w-4 h-4" /> Close Job
                    </button>
                  )}
                  {["closed", "expired"].includes(job.status) && (
                    <button
                      onClick={() => setShowReopenModal(true)}
                      className="btn-primary flex items-center gap-2 bg-blue-600 hover:bg-blue-500"
                    >
                      <Zap className="w-4 h-4" /> Reopen Job
                    </button>
                  )}
                  {job.status !== "archived" && (
                    <button
                      onClick={() => archiveMutation.mutate()}
                      disabled={archiveMutation.isPending}
                      className="btn-ghost flex items-center gap-2"
                    >
                      Archive
                    </button>
                  )}
                </>
              )}

              {canAdmin && (
                <>
                  {job.status === "pending" && (
                    <>
                      <button
                        onClick={() => approveMutation.mutate()}
                        disabled={approveMutation.isPending}
                        className="btn-primary flex items-center gap-2 !bg-emerald-600 hover:!bg-emerald-500"
                      >
                        {approveMutation.isPending ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        {approveMutation.isPending ? "Approving…" : "Approve Job"}
                      </button>
                      <button
                        onClick={() => setShowRejectBox((p) => !p)}
                        className="btn-danger flex items-center gap-2"
                      >
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                    </>
                  )}
                  {!job.metadata?.featured && (
                    <button
                      onClick={() => featureMutation.mutate()}
                      disabled={featureMutation.isPending}
                      className="btn-ghost flex items-center gap-2 text-amber-400 border border-amber-500/30"
                    >
                      <Star className="w-4 h-4" /> Feature Job
                    </button>
                  )}
                  {!job.metadata?.verifiedCompany && (
                    <button
                      onClick={() => verifyCompanyMutation.mutate()}
                      disabled={verifyCompanyMutation.isPending}
                      className="btn-ghost flex items-center gap-2 text-emerald-400 border border-emerald-500/30"
                    >
                      <ShieldCheck className="w-4 h-4" /> Verify Company
                    </button>
                  )}
                </>
              )}
              
              {canManage && (
                <Link
                  to={`/jobs/${jobId}/analytics`}
                  className="btn-ghost flex items-center gap-2 text-sm"
                >
                  <BarChart2 className="w-4 h-4" /> Analytics
                </Link>
              )}
            </div>

            {/* Reject Form */}
            {showRejectBox && (
              <div className="mt-5 pt-5 border-t border-red-500/15 animate-fade-in">
                <h3 className="font-semibold text-red-300 mb-3 flex items-center gap-2">
                  <XCircle className="w-4 h-4" /> Reject Job Posting
                </h3>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  placeholder="Reason for rejection (min 5 characters)…"
                  className="input-field resize-none mb-3"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => rejectMutation.mutate()}
                    disabled={rejectMutation.isPending || rejectReason.trim().length < 5}
                    className="btn-danger flex items-center gap-2"
                  >
                    {rejectMutation.isPending ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    Confirm Reject
                  </button>
                  <button onClick={() => setShowRejectBox(false)} className="btn-ghost">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Sticky Sidebar ──────────────────────────── */}
        <div className="hidden lg:flex flex-col gap-4 w-80 flex-shrink-0 sticky top-6">

          {/* AI Match Insights */}
          {matchInfo && (
            <div className="glass-card border-[#635BFF]/30 p-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#635BFF] to-[#ec4899]" />
              <div className="flex items-center justify-between mb-4 mt-1">
                <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-[#ec4899]" /> AI Match Score
                </h3>
                <span className={`text-xl font-extrabold ${matchInfo.finalScore >= 0.7 ? 'text-emerald-400' : matchInfo.finalScore >= 0.4 ? 'text-amber-400' : 'text-slate-300'}`}>
                  {Math.round((matchInfo.finalScore || 0) * 100)}%
                </span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-4">
                <div 
                  className={`h-full rounded-full ${matchInfo.finalScore >= 0.7 ? 'bg-emerald-400' : matchInfo.finalScore >= 0.4 ? 'bg-amber-400' : 'bg-slate-400'}`} 
                  style={{ width: `${(matchInfo.finalScore || 0) * 100}%` }} 
                />
              </div>
              
              <div className="space-y-3 mt-4 text-xs">
                {matchInfo.categoryScores?.eligibilityScore >= 1 ? (
                  <p className="flex items-center gap-1.5 text-emerald-400 font-medium"><CheckCircle className="w-3.5 h-3.5"/> Eligible to apply</p>
                ) : (
                  <p className="flex items-center gap-1.5 text-amber-400 font-medium"><XCircle className="w-3.5 h-3.5"/> May not meet all eligibility</p>
                )}
                
                {matchInfo.skillBreakdown?.matched?.length > 0 && (
                  <div>
                    <span className="text-slate-400 block mb-1">Matched Skills:</span>
                    <div className="flex flex-wrap gap-1">
                      {matchInfo.skillBreakdown.matched.map(s => <span key={s} className="px-1.5 py-0.5 rounded text-emerald-300 bg-emerald-500/10 border border-emerald-500/20">{s}</span>)}
                    </div>
                  </div>
                )}
                {matchInfo.skillBreakdown?.missing?.length > 0 && (
                  <div className="pt-2 border-t border-white/10">
                    <span className="text-slate-400 block mb-1">Missing Skills:</span>
                    <div className="flex flex-wrap gap-1">
                      {matchInfo.skillBreakdown.missing.map(s => <span key={s} className="px-1.5 py-0.5 rounded text-red-300 bg-red-500/10 border border-red-500/20">{s}</span>)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Apply CTA Card */}
          {canApply && job.status === "approved" && !hasApplied && (
            <div className="glass-card p-5 border-indigo-500/20">
              <h3 className="font-semibold text-slate-200 mb-1 text-sm">Ready to Apply?</h3>
              <p className="text-xs text-slate-500 mb-4">
                Join other applicants — takes less than 2 minutes.
              </p>
              <button
                onClick={() => setShowApplyModal(true)}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" /> Apply Now
              </button>
              {job.applyUrl && (
                <a
                  href={job.applyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost w-full flex items-center justify-center gap-2 text-sm mt-2"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> External Link
                </a>
              )}
            </div>
          )}

          {/* Job Quick Stats */}
          <div className="glass-card p-5 space-y-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
              Job Details
            </h3>
            <div className="space-y-3">
              <InfoCell
                icon={Briefcase}
                label="Employment Type"
                value={EMPLOYMENT_TYPE_LABELS[job.employmentType] || job.employmentType}
              />
              <InfoCell
                icon={BookOpen}
                label="Category"
                value={JOB_CATEGORY_LABELS[job.category] || job.category}
              />
              <InfoCell
                icon={MapPin}
                label="Location"
                value={
                  job.isRemote
                    ? "Remote / Work from Home"
                    : job.location || "Not specified"
                }
                accent={job.isRemote ? "text-cyan-300" : undefined}
              />
              {job.deadline && (
                <InfoCell
                  icon={Calendar}
                  label="Application Deadline"
                  value={new Date(job.deadline).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                  accent={daysLeft !== null && daysLeft <= 3 ? "text-red-300" : undefined}
                />
              )}
              {job.minExperienceYears > 0 && (
                <InfoCell
                  icon={Award}
                  label="Min Experience"
                  value={`${job.minExperienceYears} year${job.minExperienceYears !== 1 ? "s" : ""}`}
                />
              )}
            </div>

            {salary && (
              <div className="pt-3 border-t border-white/8">
                <p className="text-[11px] text-slate-500 uppercase tracking-wide mb-1.5">
                  Compensation
                </p>
                <p className="text-emerald-400 font-bold text-lg">{salary}</p>
              </div>
            )}
          </div>

          {/* Analytics Card (owner / admin) */}
          {(isOwner || canAdmin) && (
            <div className="glass-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                  Analytics
                </h3>
                <Link
                  to={`/jobs/${jobId}/analytics`}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
                >
                  Full Report <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="glass rounded-xl p-3 text-center">
                  <Eye className="w-4 h-4 text-indigo-400 mx-auto mb-1" />
                  <p className="text-xl font-bold text-white">{viewCount.toLocaleString()}</p>
                  <p className="text-[11px] text-slate-500">Views</p>
                </div>
                <div className="glass rounded-xl p-3 text-center">
                  <Users className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                  <p className="text-xl font-bold text-white">{applicationCount}</p>
                  <p className="text-[11px] text-slate-500">Applied</p>
                </div>
              </div>
              {viewCount > 0 && applicationCount > 0 && (
                <div className="glass rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-slate-500">Conversion Rate</span>
                    <span className="text-xs font-semibold text-indigo-300">
                      {((applicationCount / viewCount) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                      style={{
                        width: `${Math.min(100, (applicationCount / viewCount) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Target Roles */}
          {job.targetRoles?.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                Open For
              </h3>
              <div className="flex flex-wrap gap-2">
                {job.targetRoles.map((r) => (
                  <span key={r} className="badge badge-info capitalize">
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Visibility note */}
          {job.visibility && job.visibility !== "public" && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-500/8 border border-amber-500/15 text-amber-300 text-xs">
              <Lock className="w-3.5 h-3.5 flex-shrink-0" />
              <span>
                Visibility: <strong>{job.visibility.replace(/-/g, " ")}</strong>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <JobApplicationModal 
        isOpen={showApplyModal} 
        onClose={() => setShowApplyModal(false)} 
        job={job} 
        onConfirm={confirmApply} 
      />

      <ReopenJobModal 
        isOpen={showReopenModal} 
        onClose={() => setShowReopenModal(false)} 
        job={job} 
        onConfirm={(data) => reopenMutation.mutate(data)} 
        isPending={reopenMutation.isPending}
      />
    </div>
  );
}
