import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles, TrendingUp, ChevronRight, Zap, Target, PlayCircle, Activity, CheckCircle2, FileText, AlertTriangle
} from 'lucide-react';
import { getRecommendedJobs } from '../../api/recommendation.api';
import { getResumes } from '../../api/users.api';
import { JOB_CATEGORY_LABELS, EMPLOYMENT_TYPE_LABELS } from '../../constants/appConstants';
import { useAuth } from '../../hooks/useAuth';

// --- Reusable Metric Card ---
function MetricCard({ title, value, subtitle, icon: Icon, colorClass, delay }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay }}
      className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] relative overflow-hidden group hover:-translate-y-1 transition-transform"
    >
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${colorClass} opacity-10 group-hover:scale-150 transition-transform duration-500`} />
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={`p-2.5 rounded-xl ${colorClass} bg-opacity-10 text-current`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <h3 className="text-3xl font-bold text-slate-900 mb-1 relative z-10">{value}</h3>
      <p className="font-semibold text-slate-700 text-sm relative z-10">{title}</p>
      {subtitle && <p className="text-xs text-slate-500 mt-1 relative z-10">{subtitle}</p>}
    </motion.div>
  );
}

// --- AI Recommendation Card ---
function RecommendationCard({ item, index }) {
  const job = item.job || item;
  const score = item.matchScore || item.score || 0;
  const pct = Math.round(score * 100);
  
  const categoryScores = item.categoryScores || {};
  const skillBreakdown = item.skillBreakdown || { matched: [], missing: [] };
  const matchedSkills = skillBreakdown.matched || [];
  const missingSkills = skillBreakdown.missing || [];
  
  const confidence = Math.min(100, pct + 5);
  const difficulty = pct > 80 ? 'Optimal Match' : pct > 60 ? 'Strong Match' : 'Stretch Goal';

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: index * 0.1 }}
      className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all group relative overflow-hidden"
    >
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#635BFF] to-[#ec4899] opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Left: Job Info */}
        <div className="flex-1 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded-md bg-[#635BFF]/10 text-[#635BFF] text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> {item.matchLabel || 'AI Match'}
              </span>
              <span className="text-xs text-slate-400 font-medium">{job.company}</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 group-hover:text-[#635BFF] transition-colors">{job.title}</h3>
          </div>
          
          <div className="text-sm text-slate-500 leading-relaxed mb-2">
            <div className="font-semibold text-slate-700 mb-1 flex items-center gap-1.5"><Target className="w-4 h-4 text-indigo-500"/> Why this job?</div>
            {categoryScores.eligibilityScore >= 1 ? (
              <p className="flex items-center gap-1.5 text-emerald-600 font-medium text-xs mb-2"><CheckCircle2 className="w-3.5 h-3.5"/> You meet all eligibility criteria (CGPA, Branch, Batch).</p>
            ) : categoryScores.eligibilityScore > 0 ? (
              <p className="flex items-center gap-1.5 text-amber-600 font-medium text-xs mb-2"><Zap className="w-3.5 h-3.5"/> You partially meet the eligibility criteria.</p>
            ) : null}
            
            {matchedSkills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-xs text-slate-400 block w-full mb-0.5 font-medium">Matched Skills:</span>
                {matchedSkills.map(s => <span key={s} className="px-2 py-0.5 rounded text-emerald-700 bg-emerald-50 text-[11px] font-semibold border border-emerald-100">{s}</span>)}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-50">
            {job.category && <span className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium">{JOB_CATEGORY_LABELS[job.category] || job.category}</span>}
            {job.employmentType && <span className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium">{EMPLOYMENT_TYPE_LABELS[job.employmentType] || job.employmentType}</span>}
            <span className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold">{difficulty}</span>
          </div>
        </div>

        {/* Right: AI Analysis & Actions */}
        <div className="w-full md:w-64 bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex items-end justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase">Match Score</span>
              <span className={`text-xl font-extrabold ${pct >= 70 ? 'text-[#16A34A]' : pct >= 40 ? 'text-[#F59E0B]' : 'text-slate-600'}`}>{pct}%</span>
            </div>
            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden mb-4">
              <div className={`h-full ${pct >= 70 ? 'bg-[#16A34A]' : pct >= 40 ? 'bg-[#F59E0B]' : 'bg-slate-400'} rounded-full`} style={{ width: `${pct}%` }} />
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">AI Confidence</span>
                <span className="font-semibold text-slate-700">{confidence}%</span>
              </div>
              {missingSkills.length > 0 && (
                <div className="text-xs pt-3 border-t border-slate-200 mt-2">
                  <span className="text-slate-500 block mb-1.5 font-medium">Missing Skills to Learn:</span>
                  <div className="flex gap-1.5 flex-wrap">
                    {missingSkills.map(s => <span key={s} className="text-red-600 bg-red-50 px-1.5 py-0.5 rounded font-semibold border border-red-100">{s}</span>)}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Link to={`/jobs/${job._id}`} className="w-full py-2 bg-white border border-slate-200 hover:bg-slate-50 hover:border-[#635BFF] hover:text-[#635BFF] text-slate-700 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 group/btn shadow-sm mt-3">
            Review Details <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
          </Link>
        </div>

      </div>
    </motion.div>
  );
}

// --- Empty State ---
function EmptyRecommendations({ meta }) {
  const profileCompletion = meta?.profileCompletion || 0;
  const requiredCompletion = meta?.requiredCompletion || 60;
  
  return (
    <div className="bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-sm max-w-2xl mx-auto">
      <div className="w-24 h-24 bg-gradient-to-br from-[#635BFF]/10 to-[#ec4899]/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <Target className="w-10 h-10 text-[#635BFF]" />
      </div>
      <h3 className="text-2xl font-bold text-slate-900 mb-3">Unlock AI Recommendations</h3>
      <p className="text-slate-500 mb-6">
        {meta?.message || `Your AI Career Assistant needs more data to find your perfect matches. Complete your profile to at least ${requiredCompletion}% to unlock personalized, high-accuracy job recommendations.`}
      </p>
      
      <div className="max-w-md mx-auto mb-8 bg-slate-50 rounded-xl p-4 border border-slate-100">
        <div className="flex justify-between items-end mb-2">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Profile Completeness</span>
          <span className="text-sm font-extrabold text-[#635BFF]">{profileCompletion}%</span>
        </div>
        <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#635BFF] to-[#8B5CF6] rounded-full" style={{ width: `${profileCompletion}%` }} />
        </div>
        <p className="text-[11px] text-slate-500 mt-2 font-medium text-left">
          Add education, experience, and top skills in your profile settings.
        </p>
      </div>

      <Link to="/profile" className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#635BFF] hover:bg-[#524be3] text-white font-semibold rounded-xl shadow-[0_4px_14px_0_rgba(99,91,255,0.39)] transition-all hover:-translate-y-0.5">
        Complete Profile <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

export default function RecommendedJobsPage() {
  const { user } = useAuth();
  const { data, isPending } = useQuery({ queryKey: ['recommended-jobs'], queryFn: getRecommendedJobs });
  const jobs = data?.data?.jobs || [];
  const meta = data?.data?.meta || {};
  
  const { data: resumeData } = useQuery({ queryKey: ['my-resumes'], queryFn: getResumes, enabled: !!user });
  const resumes = resumeData?.data?.resumes || [];
  const hasResume = resumes.filter(r => !r.isDeleted).length > 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12 font-sans selection:bg-[#635BFF]/20 selection:text-[#635BFF]">
      
      {/* --- Premium Hero Section --- */}
      <div className="relative overflow-hidden bg-[#111827] text-white">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[140%] bg-gradient-to-b from-[#635BFF]/20 to-transparent blur-3xl transform rotate-12" />
          <div className="absolute bottom-0 left-[10%] w-[50%] h-[50%] bg-gradient-to-t from-[#8B5CF6]/20 to-transparent blur-3xl" />
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-slate-300 mb-6 font-medium">
              <Sparkles className="w-4 h-4 text-[#8B5CF6]" /> Powered by BCET Intelligence
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 leading-[1.1]">
              Your AI Career <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#635BFF] via-[#8B5CF6] to-[#ec4899]">Assistant</span>
            </h1>
            <p className="text-lg text-slate-400 mb-8 leading-relaxed">
              We analyze your skills, parse industry trends, and use predictive modeling to find opportunities where you will thrive.
            </p>
            <div className="flex gap-4">
              <Link to="/profile" className="px-6 py-3 bg-white text-slate-900 font-semibold rounded-xl hover:bg-slate-100 transition-colors shadow-lg">
                Refine Match Settings
              </Link>
            </div>
          </motion.div>
          
          {/* Animated Hero Illustration/Graphic */}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }} className="hidden lg:block relative w-96 h-96">
            <div className="absolute inset-0 bg-gradient-to-br from-[#635BFF]/30 to-[#ec4899]/30 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
            <div className="absolute inset-10 bg-[#1f2937] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
              <div className="h-8 border-b border-white/5 bg-white/5 flex items-center px-4 gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#16A34A]" />
              </div>
              <div className="p-6 flex-1 flex flex-col justify-center gap-4">
                <div className="h-4 w-3/4 bg-white/10 rounded" />
                <div className="h-4 w-1/2 bg-white/10 rounded" />
                <div className="flex gap-2 mt-4">
                  <div className="h-8 w-20 bg-[#635BFF]/80 rounded-lg" />
                  <div className="h-8 w-8 bg-white/10 rounded-lg" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-20">
        
        {/* --- Top Metrics Dashboard --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <MetricCard title="Profile Strength" value="85%" subtitle="Top 15% of candidates" icon={Activity} colorClass="text-[#635BFF]" delay={0.1} />
          <MetricCard title="Total Recommendations" value={jobs.length.toString()} subtitle="Updated today" icon={Target} colorClass="text-[#8B5CF6]" delay={0.2} />
          <MetricCard title="Industry Demand" value="High" subtitle="Software Engineering" icon={TrendingUp} colorClass="text-[#ec4899]" delay={0.3} />
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* --- Main Recommendations List --- */}
          <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-slate-900">Personalized Matches</h2>
              <span className="text-sm font-medium text-slate-500">{jobs.length} opportunities</span>
            </div>

            {isPending ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm animate-pulse h-48" />
                ))}
              </div>
            ) : !meta.recommendationsEnabled || jobs.length === 0 ? (
              <EmptyRecommendations meta={meta} />
            ) : (
              <div className="space-y-4">
                {jobs.map((item, idx) => (
                  <RecommendationCard key={item.job?._id || item._id} item={item} index={idx} />
                ))}
              </div>
            )}
          </div>

          {/* --- Right AI Insight Panel --- */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.4 }}
            className="w-full lg:w-80 space-y-6 flex-shrink-0"
          >
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm sticky top-24">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#635BFF] to-[#8B5CF6] flex items-center justify-center text-white">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900">AI Insights</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Profile Completion</h4>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Completeness</span>
                      <span className="text-sm font-extrabold text-[#635BFF]">{meta.profileCompletion || 0}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden mb-3">
                      <div className="h-full bg-gradient-to-r from-[#635BFF] to-[#8B5CF6] rounded-full" style={{ width: `${meta.profileCompletion || 0}%` }} />
                    </div>
                    {(meta.profileCompletion || 0) < 100 && (
                       <Link to="/profile" className="text-xs text-[#635BFF] font-semibold hover:underline">Complete profile to 100% &gt;</Link>
                    )}
                  </div>
                </div>

                {!hasResume && (
                  <div>
                    <h4 className="text-xs font-bold text-red-500 uppercase tracking-wider mb-3 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5"/> Action Required</h4>
                    <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                      <p className="text-xs text-red-700 font-medium mb-3">You haven't uploaded a resume yet. This severely limits your application success.</p>
                      <Link to="/profile" className="flex items-center justify-center gap-1.5 w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors">
                        <FileText className="w-3.5 h-3.5" /> Upload Resume
                      </Link>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Suggested Learning</h4>
                  <div className="space-y-3">
                    <a href="#" className="flex items-center gap-3 group">
                      <div className="w-10 h-10 rounded-lg bg-[#F8FAFC] border border-slate-200 flex items-center justify-center group-hover:border-[#635BFF] transition-colors">
                        <PlayCircle className="w-5 h-5 text-slate-400 group-hover:text-[#635BFF] transition-colors" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 group-hover:text-[#635BFF] transition-colors">Advanced System Design</p>
                        <p className="text-xs text-slate-500">2.5 hours • High Impact</p>
                      </div>
                    </a>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <Link to="/profile" className="w-full flex items-center justify-center py-2.5 text-sm font-semibold text-[#635BFF] bg-[#635BFF]/10 hover:bg-[#635BFF]/20 rounded-xl transition-colors">
                    Update Profile Settings
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
